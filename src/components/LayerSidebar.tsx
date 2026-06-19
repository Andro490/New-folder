import React, { useRef, useState } from 'react';
import { DesignLayer, TShirtView } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { PRINT_AREA } from '../utils/tshirtSvg';
// @ts-ignore
import { removeBackground } from '@imgly/background-removal';
import { Eye, EyeOff, Trash2, ArrowUp, ArrowDown, Wand2, Droplet, Edit2, RotateCw, RotateCcw, Undo2 } from 'lucide-react';

interface LayerSidebarProps {
  layers: DesignLayer[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onAdd: (layer: DesignLayer) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, attrs: Partial<DesignLayer>) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  view: TShirtView;
}

async function uploadToImgBB(fileOrBase64: File | string): Promise<string> {
  const apiKey = '878a3e7d1975c224f0cfc02c0bd29299';
  const formData = new FormData();
  
  if (typeof fileOrBase64 === 'string') {
    const base64Data = fileOrBase64.includes('base64,') ? fileOrBase64.split('base64,')[1] : fileOrBase64;
    formData.append('image', base64Data);
  } else {
    formData.append('image', fileOrBase64);
  }

  const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
    method: 'POST',
    body: formData
  });
  const data = await res.json();
  if (data.success) {
    return data.data.url;
  } else {
    throw new Error('فشل رفع الصورة');
  }
}

// ── Pinterest Modal ─────────────────────────────────────────────
function PinterestModal({
  onClose,
  onAddLayer,
  view,
  onUpdateLayer
}: {
  onClose: () => void;
  onAddLayer: (layer: DesignLayer) => void;
  view: TShirtView;
  onUpdateLayer?: (id: string, attrs: Partial<DesignLayer>) => void;
}) {
  const [step, setStep] = useState<'choose' | 'paste'>('choose');
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const printArea = PRINT_AREA[view];

  const [loading, setLoading] = useState(false);

  async function handleStartDesign() {
    const trimmed = url.trim();
    if (!trimmed) { setError('الرجاء إدخال الرابط'); return; }
    setError('');
    setLoading(true);

    try {
      let imageUrl = trimmed;

      const isPinterest =
        trimmed.includes('pinterest.com') ||
        trimmed.includes('pin.it') ||
        trimmed.includes('pinterest.');

      const isDirectPinterestImage = trimmed.includes('pinimg.com');

      const API_BASE = (import.meta.env.VITE_API_URL as string) || '';

      if (isPinterest && !isDirectPinterestImage) {
        let response: Response;
        try {
          response = await fetch(`${API_BASE}/api/pinterest-image`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: trimmed }),
            signal: AbortSignal.timeout(25000),
          });
        } catch {
          setError('تعذّر الاتصال. جرّب نسخ رابط الصورة مباشرة من المتصفح ثم الصقه هنا.');
          setLoading(false);
          return;
        }

        let data: { success?: boolean; imageUrl?: string; error?: string } = {};
        try {
          const text = await response.text();
          data = JSON.parse(text);
        } catch {
          setError('رد غير متوقع من الخادم. جرّب نسخ URL الصورة مباشرة من بنتريست.');
          setLoading(false);
          return;
        }

        if (!response.ok || !data.success || !data.imageUrl) {
          setError(
            (data.error || 'تعذّر استخراج الصورة.') +
            ' — جرّب: اضغط على صورة بنتريست → "فتح في تبويبة جديدة" → انسخ الرابط.'
          );
          setLoading(false);
          return;
        }

        imageUrl = `${API_BASE}/api/proxy-image?url=${encodeURIComponent(data.imageUrl)}`;

      } else if (isDirectPinterestImage || (trimmed.startsWith('http') && !trimmed.includes('localhost'))) {
        // Direct external image URL — proxy via same-origin to bypass CORS
        imageUrl = `${API_BASE}/api/proxy-image?url=${encodeURIComponent(trimmed)}`;
      }


      // Verify the image actually loads
      await new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('image load failed'));
        setTimeout(() => reject(new Error('timeout')), 20000);
        img.src = imageUrl;
      });

      const newLayer = {
        id: uuidv4(),
        name: 'Pinterest Image',
        imageUrl,
        x: printArea.x + 20,
        y: printArea.y + 20,
        width: Math.min(150, printArea.width - 40),
        height: Math.min(150, printArea.height - 40),
        rotation: 0, opacity: 1, visible: true, locked: false,
        view: view,
        originalImageUrl: imageUrl,
        pinterestUrl: isPinterest ? trimmed : (trimmed.startsWith('data:image') ? 'جاري الرفع...' : trimmed),
      };

      onAddLayer(newLayer);
      onClose();

      // Upload base64 in background
      if (!isPinterest && trimmed.startsWith('data:image') && onUpdateLayer) {
        uploadToImgBB(trimmed).then(publicUrl => {
          onUpdateLayer(newLayer.id, { pinterestUrl: publicUrl });
        }).catch(err => console.error('Failed to upload base64 to ImgBB', err));
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg === 'timeout') {
        setError('انتهت مدة تحميل الصورة. تحقق من الرابط وحاول مرة أخرى.');
      } else if (msg === 'image load failed') {
        setError('جرى جلب الصورة لكن تعذّر تحميلها. انسخ URL الصورة مباشرة وجرّب مرة أخرى.');
      } else {
        setError('حدث خطأ غير متوقع. جرّب نسخ رابط الصورة مباشرة.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 480, backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          fontFamily: "'Inter', sans-serif",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: '1px solid #1e1e1e',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%',
              backgroundColor: '#e60023',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
              </svg>
            </div>
            <div>
              <p style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 2 }}>
                DESIGN INSPIRATION
              </p>
              <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                FIND YOUR DESIGN
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#666', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '28px 24px' }}>
          {step === 'choose' ? (
            <>
              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--accent-primary)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>
                  ⚠ BEFORE YOU CONTINUE ⚠
                </p>
                <p style={{ fontSize: 12, color: '#666', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  PICK DESIGN → COPY LINK → PASTE HERE
                </p>
              </div>

              {/* Browse Pinterest */}
              <button
                onClick={() => window.open('https://www.pinterest.com/search/pins/?q=streetwear+tshirt+design', '_blank')}
                style={{
                  width: '100%', padding: '16px', marginBottom: 12,
                  backgroundColor: '#e60023', color: '#fff',
                  border: 'none', cursor: 'pointer',
                  fontSize: 13, fontWeight: 800,
                  letterSpacing: '0.15em', textTransform: 'uppercase',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
                </svg>
                BROWSE PINTEREST DESIGNS
              </button>

              <button
                onClick={() => setStep('paste')}
                style={{
                  width: '100%', padding: '14px',
                  backgroundColor: 'transparent', color: '#888',
                  border: '1px solid #2a2a2a', cursor: 'pointer',
                  fontSize: 12, fontWeight: 700,
                  letterSpacing: '0.15em', textTransform: 'uppercase',
                }}
              >
                I ALREADY HAVE A LINK
              </button>
            </>
          ) : (
            <>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24, lineHeight: 1.6 }}>
                الصق رابط Pinterest pin أو رابط الصورة المباشر، ثم اضغط <strong style={{ color: 'var(--text-primary)' }}>Start Design</strong>.
              </p>

              <p style={{ fontSize: 10, color: '#666', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8 }}>
                PASTE PINTEREST PIN OR IMAGE URL
              </p>

              <div style={{ display: 'flex', gap: 0, marginBottom: 12 }}>
                <input
                  type="text"
                  value={url}
                  onChange={e => { setUrl(e.target.value); setError(''); }}
                  onKeyDown={e => e.key === 'Enter' && !loading && handleStartDesign()}
                  placeholder="https://pin.it/... أو https://www.pinterest.com/pin/..."
                  disabled={loading}
                  style={{
                    flex: 1, padding: '12px 14px',
                    backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)', borderRight: 'none',
                    fontSize: 12, outline: 'none',
                    fontFamily: 'inherit',
                    opacity: loading ? 0.5 : 1,
                  }}
                />
                <button
                  onClick={handleStartDesign}
                  disabled={loading}
                  style={{
                    padding: '12px 18px', flexShrink: 0,
                    backgroundColor: loading ? '#5a4208' : '#8b6914',
                    color: '#fff',
                    border: 'none',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: 11, fontWeight: 800,
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                    minWidth: 110,
                  }}
                >
                  {loading ? '⏳ جاري...' : 'START DESIGN'}
                </button>
              </div>

              {error && (
                <p style={{ fontSize: 12, color: '#e60023', marginBottom: 16 }}>{error}</p>
              )}

              <button
                onClick={() => { setStep('choose'); setError(''); setUrl(''); }}
                style={{ background: 'none', border: 'none', color: '#666', fontSize: 12, cursor: 'pointer', letterSpacing: '0.05em' }}
              >
                ← BACK
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────
export default function LayerSidebar({
  layers,
  selectedId,
  onSelect,
  onAdd,
  onRemove,
  onUpdate,
  onReorder,
  view,
}: LayerSidebarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showPinterest, setShowPinterest] = useState(false);
  const [removingBg, setRemovingBg] = useState<Record<string, boolean>>({});
  const printArea = PRINT_AREA[view];

  function createLayer(imageUrl: string, name: string): DesignLayer {
    return {
      id: uuidv4(), name, imageUrl,
      x: printArea.x + 20, y: printArea.y + 20,
      width: Math.min(150, printArea.width - 40),
      height: Math.min(150, printArea.height - 40),
      rotation: 0, opacity: 1, visible: true, locked: false,
      view: view,
      originalImageUrl: imageUrl,
    };
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const newLayer = createLayer(URL.createObjectURL(file), file.name.replace(/\.[^.]+$/, '').slice(0, 20));
    onAdd(newLayer);
    e.target.value = '';

    uploadToImgBB(file).then(publicUrl => {
      // OVERWRITE the local blob with the permanent ImgBB URL
      onUpdate(newLayer.id, { 
        imageUrl: publicUrl, 
        originalImageUrl: publicUrl, 
        pinterestUrl: publicUrl 
      });
    }).catch(err => console.error("Upload failed", err));
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file?.type.startsWith('image/')) {
      const newLayer = createLayer(URL.createObjectURL(file), file.name.slice(0, 20));
      onAdd(newLayer);
      
      uploadToImgBB(file).then(publicUrl => {
        // OVERWRITE the local blob with the permanent ImgBB URL
        onUpdate(newLayer.id, { 
          imageUrl: publicUrl, 
          originalImageUrl: publicUrl, 
          pinterestUrl: publicUrl 
        });
      }).catch(err => console.error("Upload failed", err));
    }
  }

  async function handleRemoveBg(layerId: string, imageUrl: string) {
    try {
      setRemovingBg(prev => ({ ...prev, [layerId]: true }));
      
      // 1. جلب الصورة كملف محلي (Blob) بيسرع العملية وبيمنع مشاكل السيرفرات (CORS)
      const res = await fetch(imageUrl);
      const imageBlob = await res.blob();

      // 2. استخدام الموديل الافتراضي ذو الجودة العالية (isnet) للحصول على أفضل دقة عزل بدون تشوه الصورة
      const blob = await removeBackground(imageBlob);
      
      const newUrl = URL.createObjectURL(blob);
      const layer = layers.find(l => l.id === layerId);
      onUpdate(layerId, { 
        imageUrl: newUrl, 
        originalImageUrl: layer?.originalImageUrl || imageUrl,
        pinterestUrl: 'جاري الرفع...' 
      });

      // 3. نرفع الصورة المعزولة على ImgBB في الخلفية عشان تتبعت في تليجرام
      const fileToUpload = new File([blob], 'removed_bg.png', { type: 'image/png' });
      uploadToImgBB(fileToUpload).then(publicUrl => {
        onUpdate(layerId, { imageUrl: publicUrl, pinterestUrl: publicUrl });
      }).catch(err => console.error("Upload failed", err));

    } catch (error) {
      console.error("Failed to remove background:", error);
      alert("تعذر إزالة الخلفية، حاول مرة أخرى.");
    } finally {
      setRemovingBg(prev => ({ ...prev, [layerId]: false }));
    }
  }

  async function handleRemoveColor(layerId: string, imageUrl: string, colorToRemove: 'black' | 'white') {
    try {
      setRemovingBg(prev => ({ ...prev, [layerId]: true }));
      
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = imageUrl;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const tolerance = 40; 
      
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        if (colorToRemove === 'black') {
          if (r <= tolerance && g <= tolerance && b <= tolerance) {
            const maxVal = Math.max(r, g, b);
            data[i + 3] = (maxVal / tolerance) * 255;
          }
        } else {
          if (r >= 255 - tolerance && g >= 255 - tolerance && b >= 255 - tolerance) {
            const minVal = Math.min(r, g, b);
            data[i + 3] = ((255 - minVal) / tolerance) * 255;
          }
        }
      }
      
      ctx.putImageData(imageData, 0, 0);
      const newImageUrl = canvas.toDataURL('image/png');
      const layer = layers.find(l => l.id === layerId);
      onUpdate(layerId, { 
        imageUrl: newImageUrl,
        originalImageUrl: layer?.originalImageUrl || imageUrl,
        pinterestUrl: 'جاري الرفع...'
      });

      // Upload the edited image to ImgBB so it gets sent in the Telegram order
      uploadToImgBB(newImageUrl).then(publicUrl => {
        onUpdate(layerId, { imageUrl: publicUrl, pinterestUrl: publicUrl });
      }).catch(err => console.error("Upload failed", err));

    } catch (error) {
      console.error("Failed to remove color:", error);
      alert("تعذر تفريغ اللون، حاول مرة أخرى.");
    } finally {
      setRemovingBg(prev => ({ ...prev, [layerId]: false }));
    }
  }

  async function handleCleanEdges(layerId: string, imageUrl: string) {
    try {
      setRemovingBg(prev => ({ ...prev, [layerId]: true }));
      
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = imageUrl;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Remove any pixel that is semi-transparent (alpha < 200) to get rid of smoke/halos
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] > 0 && data[i + 3] < 200) {
          data[i + 3] = 0; // Make fully transparent
        }
      }
      
      ctx.putImageData(imageData, 0, 0);
      const newImageUrl = canvas.toDataURL('image/png');
      const layer = layers.find(l => l.id === layerId);
      onUpdate(layerId, { 
        imageUrl: newImageUrl,
        originalImageUrl: layer?.originalImageUrl || imageUrl,
        pinterestUrl: 'جاري الرفع...'
      });

      uploadToImgBB(newImageUrl).then(publicUrl => {
        onUpdate(layerId, { imageUrl: publicUrl, pinterestUrl: publicUrl });
      }).catch(err => console.error("Upload failed", err));

    } catch (error) {
      console.error("Failed to clean edges:", error);
      alert("تعذر تنظيف الحواف، حاول مرة أخرى.");
    } finally {
      setRemovingBg(prev => ({ ...prev, [layerId]: false }));
    }
  }

  const viewLabel = view === 'front' ? 'FRONT' : 'BACK';

  const S = {
    sidebar: {
      backgroundColor: 'var(--bg-primary)',
      borderRight: '1px solid var(--border-color)',
      display: 'flex', flexDirection: 'column' as const,
      fontFamily: "'Inter', sans-serif",
    },
    header: {
      padding: '20px 24px',
      borderBottom: '1px solid var(--border-color)',
    },
    brand: {
      fontSize: 18, fontWeight: 900, color: 'var(--text-primary)',
      letterSpacing: '0.15em', textTransform: 'uppercase' as const,
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 12, fontWeight: 700, color: 'var(--text-muted)',
      letterSpacing: '0.15em', textTransform: 'uppercase' as const,
    },
    layerList: { flex: 1, overflowY: 'auto' as const, padding: '16px' },
    emptyText: {
      fontSize: 12, fontWeight: 600, color: 'var(--text-muted)',
      letterSpacing: '0.05em', lineHeight: 1.6, padding: '20px 0', textAlign: 'center' as const,
    },
    layerCard: (selected: boolean) => ({
      border: `1px solid ${selected ? 'var(--accent-primary)' : 'var(--border-color)'}`,
      backgroundColor: selected ? 'var(--bg-card)' : 'var(--bg-secondary)',
      borderRadius: 12,
      marginBottom: 12, padding: '12px',
      transition: 'all 0.2s ease',
      cursor: 'pointer',
      boxShadow: selected ? '0 4px 15px rgba(139, 107, 67, 0.1)' : 'none',
    }),
    layerRow: {
      display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8,
    },
    thumb: {
      width: 44, height: 44, objectFit: 'contain' as const,
      backgroundColor: 'var(--bg-tertiary)', borderRadius: 8, border: '1px solid var(--border-color)', flexShrink: 0,
    },
    layerName: {
      flex: 1, fontSize: 13, fontWeight: 700, color: 'var(--text-primary)',
      letterSpacing: '0.05em', whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis',
    },
    iconBtn: (danger = false) => ({
      background: 'none', border: 'none', cursor: 'pointer',
      color: danger ? 'var(--danger)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 6, borderRadius: 6, transition: 'all 0.2s',
    }),
    actionRow: { display: 'flex', gap: 8, marginBottom: 8 },
    actionBtn: (disabled = false) => ({
      flex: 1, padding: '8px 6px',
      backgroundColor: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border-color)',
      color: disabled ? 'rgba(89, 66, 40, 0.5)' : 'var(--text-secondary)',
      fontSize: 11, fontWeight: 600,
      cursor: disabled ? 'not-allowed' : 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      transition: 'all 0.2s'
    }),
    deleteBtn: {
      padding: '8px', borderRadius: 8,
      backgroundColor: 'rgba(198, 40, 40, 0.1)', border: '1px solid rgba(198, 40, 40, 0.2)',
      color: 'var(--danger)', cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'all 0.2s',
    },
    uploadZone: {
      margin: '0 12px 12px',
      border: '1px dashed var(--border-color)', padding: '12px',
      textAlign: 'center' as const, cursor: 'pointer',
      backgroundColor: 'var(--bg-secondary)',
    },
    uploadText: {
      fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)',
      letterSpacing: '0.1em', textTransform: 'uppercase' as const,
    },
    pinterestCard: {
      margin: '0 12px 12px',
      backgroundColor: '#fbe9e7', /* Light reddish/parchment tint for pinterest */
      border: '1px solid #ffccbc',
      borderRadius: 10, padding: '14px',
      cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'flex-start',
    },
    pinterestIcon: {
      width: 28, height: 28, borderRadius: '50%',
      backgroundColor: '#e60023', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    },
    pinterestText: {
      fontSize: 12, fontWeight: 700, color: '#b71c1c', lineHeight: 1.5,
    },
  };

  return (
    <>
      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileUpload} />

      <aside className="w-full lg:w-[220px] lg:min-w-[220px] h-auto lg:h-full shrink-0" style={S.sidebar}>
        {/* Header */}
        <div style={S.header}>
          {layers.length > 0 && (
            <p style={S.brand}>WEARURWAY</p>
          )}
          <p style={S.sectionTitle}>
            {viewLabel} LAYERS{layers.length > 0 ? ` (${layers.length})` : ''}
          </p>
        </div>

        <div style={S.layerList} onDragOver={e => e.preventDefault()} onDrop={handleDrop}>
          {layers.length === 0 ? (
            <p style={S.emptyText}>
              No layers yet. Start adding designs to create your masterpiece.
            </p>
          ) : (
            [...layers].reverse().map((layer, i) => {
              const realIndex = layers.length - 1 - i;
              const selected = layer.id === selectedId;
              return (
                <div
                  key={layer.id}
                  style={S.layerCard(selected)}
                  onClick={() => onSelect(selected ? null : layer.id)}
                >
                  <div style={S.layerRow}>
                    <img src={layer.imageUrl} alt={layer.name} style={S.thumb} />
                    <span style={S.layerName}>LAYER {realIndex + 1}</span>
                    <button
                      style={S.iconBtn()}
                      onClick={e => { e.stopPropagation(); onUpdate(layer.id, { visible: !layer.visible }); }}
                      title={layer.visible ? 'Hide' : 'Show'}
                      onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                      onMouseLeave={e => e.currentTarget.style.color = '#888'}
                    >
                      {layer.visible ? <Eye size={18} /> : <EyeOff size={18} color="#666" />}
                    </button>
                  </div>

                  {selected && (
                    <div onClick={e => e.stopPropagation()}>
                      <div style={{ marginBottom: 12 }}>
                        <button
                          style={{ ...S.actionBtn(), width: '100%', padding: '10px', backgroundColor: 'var(--accent-primary)', color: '#000', border: 'none' }}
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Edit2 size={14} /> تغيير الصورة
                        </button>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                        {layer.originalImageUrl && layer.originalImageUrl !== layer.imageUrl && (
                          <button
                            style={{ ...S.actionBtn(), width: '100%', color: 'var(--text-primary)', backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
                            onClick={() => onUpdate(layer.id, { imageUrl: layer.originalImageUrl, pinterestUrl: '' })}
                            title="إلغاء التعديلات والرجوع للصورة الأصلية"
                          >
                            <Undo2 size={14} /> استعادة الأصلية
                          </button>
                        )}
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            style={{ ...S.actionBtn(removingBg[layer.id]), flex: 1 }}
                            onClick={() => handleRemoveColor(layer.id, layer.imageUrl, 'black')}
                            disabled={removingBg[layer.id]}
                          >
                            <Droplet size={14} color="#555" /> إزالة الأسود
                          </button>
                          <button
                            style={{ ...S.actionBtn(removingBg[layer.id]), flex: 1 }}
                            onClick={() => handleRemoveColor(layer.id, layer.imageUrl, 'white')}
                            disabled={removingBg[layer.id]}
                          >
                            <Droplet size={14} color="#ddd" /> إزالة الأبيض
                          </button>
                        </div>
                        <button
                          style={{ ...S.actionBtn(removingBg[layer.id]), width: '100%', justifyContent: 'center' }}
                          onClick={() => handleCleanEdges(layer.id, layer.imageUrl)}
                          disabled={removingBg[layer.id]}
                          title="يزيل الهالة السوداء أو الدخان الخفيف المتبقي بعد العزل"
                        >
                          <Wand2 size={14} color="#3b82f6" />
                          {removingBg[layer.id] ? 'جاري التنظيف...' : 'تنظيف الحواف (إزالة الدخان/الهالة)'}
                        </button>
                        <button
                          style={{ ...S.actionBtn(removingBg[layer.id]), width: '100%', justifyContent: 'center' }}
                          onClick={() => handleRemoveBg(layer.id, layer.imageUrl)}
                          disabled={removingBg[layer.id]}
                        >
                          <Wand2 size={14} color="#a855f7" />
                          {removingBg[layer.id] ? 'جاري العزل...' : 'عزل ذكي (AI)'}
                        </button>
                      </div>

                      {/* Rotate & Controls */}
                      <div style={S.actionRow}>
                        <button
                          style={S.actionBtn()}
                          onClick={() => onUpdate(layer.id, { rotation: (layer.rotation - 45 + 360) % 360 })}
                        >
                          <RotateCcw size={14} />
                        </button>
                        <button
                          style={S.actionBtn()}
                          onClick={() => onUpdate(layer.id, { rotation: (layer.rotation + 45) % 360 })}
                        >
                          <RotateCw size={14} />
                        </button>
                        <button
                          style={S.actionBtn(realIndex <= 0)}
                          disabled={realIndex <= 0}
                          onClick={() => onReorder(realIndex, realIndex - 1)}
                        >
                          <ArrowDown size={14} />
                        </button>
                        <button
                          style={S.actionBtn(realIndex >= layers.length - 1)}
                          disabled={realIndex >= layers.length - 1}
                          onClick={() => onReorder(realIndex, realIndex + 1)}
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button
                          style={S.deleteBtn}
                          onClick={() => onRemove(layer.id)}
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Upload zone */}
        <div style={S.uploadZone} onClick={() => fileInputRef.current?.click()}>
          <p style={S.uploadText}>+ DROP IMAGE HERE</p>
        </div>

        {/* Pinterest Card */}
        <div style={S.pinterestCard} onClick={() => setShowPinterest(true)}>
          <div style={S.pinterestIcon}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
              <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
            </svg>
          </div>
          <p style={S.pinterestText}>
            Not sure which design fits your idea? I'll help you pick the perfect one.
          </p>
        </div>
      </aside>

      {showPinterest && (
        <PinterestModal
          onClose={() => setShowPinterest(false)}
          onAddLayer={onAdd}
          view={view}
          onUpdateLayer={onUpdate}
        />
      )}
    </>
  );
}
