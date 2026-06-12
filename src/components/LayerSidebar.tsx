import React, { useRef, useState } from 'react';
import { DesignLayer, TShirtView } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { PRINT_AREA } from '../utils/tshirtSvg';
import { removeBackground } from '@imgly/background-removal';

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

      if (isPinterest) {
        const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:3001' : '';
        
        let response: Response;
        try {
          response = await fetch(`${API_BASE}/api/pinterest-image`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: trimmed })
          });
        } catch {
          setError('تعذّر الاتصال بالخادم. تحقق من الإنترنت وحاول مرة أخرى.');
          setLoading(false);
          return;
        }

        // Safely parse JSON — avoid crash if server returns HTML
        let data: { success?: boolean; imageUrl?: string; error?: string };
        try {
          const text = await response.text();
          data = JSON.parse(text);
        } catch {
          setError('تعذّر جلب الصورة من الرابط. حاول نسخ رابط الصورة مباشرة، أو اضغط على الصورة ثم "فتح في تبويبة جديدة" وانسخ URLالصورة.');
          setLoading(false);
          return;
        }
        
        if (!response.ok || !data.success || !data.imageUrl) {
          setError(data.error || 'تعذّر استخراج الصورة من الرابط. حاول نسخ رابط الصورة مباشرة؟');
          setLoading(false);
          return;
        }

        imageUrl = `${API_BASE}/api/proxy-image?url=${encodeURIComponent(data.imageUrl)}`;
      }

      // Verify image loads
      await new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('image load failed'));
        // timeout after 15s
        setTimeout(() => reject(new Error('timeout')), 15000);
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

      // Upload base64 strings in the background
      if (!isPinterest && trimmed.startsWith('data:image') && onUpdateLayer) {
        uploadToImgBB(trimmed).then(publicUrl => {
          onUpdateLayer(newLayer.id, { pinterestUrl: publicUrl });
        }).catch(err => {
          console.error("Failed to upload base64 to ImgBB", err);
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg === 'timeout') {
        setError('انتهت مدة تحميل الصورة. تحقق من الرابط وحاول مرة أخرى.');
      } else {
        setError('تعذّر تحميل الصورة. حاول نسخ رابط الصورة مباشرة (اضغط على الصورة → فتح في تبويبة جديدة → انسخ URL)الصورة.');
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
          width: 480, backgroundColor: '#0d0d0d',
          border: '1px solid #222',
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
              <p style={{ fontSize: 10, color: '#888', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 2 }}>
                DESIGN INSPIRATION
              </p>
              <p style={{ fontSize: 15, fontWeight: 800, color: '#fff', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
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
                <p style={{ fontSize: 13, fontWeight: 800, color: '#f5c842', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>
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
              <p style={{ fontSize: 13, color: '#aaa', marginBottom: 24, lineHeight: 1.6 }}>
                الصق رابط Pinterest pin أو رابط الصورة المباشر، ثم اضغط <strong style={{ color: '#fff' }}>Start Design</strong>.
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
                    backgroundColor: '#0a0a0a', color: '#fff',
                    border: '1px solid #2a2a2a', borderRight: 'none',
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
      onUpdate(newLayer.id, { pinterestUrl: publicUrl });
    }).catch(err => console.error("Upload failed", err));
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file?.type.startsWith('image/')) {
      const newLayer = createLayer(URL.createObjectURL(file), file.name.slice(0, 20));
      onAdd(newLayer);
      
      uploadToImgBB(file).then(publicUrl => {
        onUpdate(newLayer.id, { pinterestUrl: publicUrl });
      }).catch(err => console.error("Upload failed", err));
    }
  }

  async function handleRemoveBg(layerId: string, imageUrl: string) {
    try {
      setRemovingBg(prev => ({ ...prev, [layerId]: true }));
      
      // 1. جلب الصورة كملف محلي (Blob) بيسرع العملية وبيمنع مشاكل السيرفرات (CORS)
      const res = await fetch(imageUrl);
      const imageBlob = await res.blob();

      // 2. استخدام الموديل الأصغر "isnet_quint8" عشان يكون أسرع بكتير من الافتراضي
      const blob = await removeBackground(imageBlob, {
        model: 'isnet_quint8',
      });
      
      const newUrl = URL.createObjectURL(blob);
      onUpdate(layerId, { imageUrl: newUrl, pinterestUrl: 'جاري الرفع...' });

      // 3. نرفع الصورة المعزولة على ImgBB في الخلفية عشان تتبعت في تليجرام
      const fileToUpload = new File([blob], 'removed_bg.png', { type: 'image/png' });
      uploadToImgBB(fileToUpload).then(publicUrl => {
        onUpdate(layerId, { pinterestUrl: publicUrl });
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
      onUpdate(layerId, { imageUrl: canvas.toDataURL('image/png') });
    } catch (error) {
      console.error("Failed to remove color:", error);
      alert("تعذر تفريغ اللون، حاول مرة أخرى.");
    } finally {
      setRemovingBg(prev => ({ ...prev, [layerId]: false }));
    }
  }

  const viewLabel = view === 'front' ? 'FRONT' : 'BACK';

  const S = {
    sidebar: {
      backgroundColor: '#080808',
      borderRight: '1px solid #1a1a1a',
      display: 'flex', flexDirection: 'column' as const,
      fontFamily: "'Inter', sans-serif",
    },
    header: {
      padding: '20px 16px 16px',
      borderBottom: '1px solid #1a1a1a',
    },
    brand: {
      fontSize: 16, fontWeight: 900, color: '#fff',
      letterSpacing: '0.15em', textTransform: 'uppercase' as const,
      marginBottom: 14,
    },
    sectionTitle: {
      fontSize: 11, fontWeight: 800, color: '#888',
      letterSpacing: '0.15em', textTransform: 'uppercase' as const,
    },
    layerList: { flex: 1, overflowY: 'auto' as const, padding: '12px' },
    emptyText: {
      fontSize: 11, fontWeight: 700, color: '#444',
      letterSpacing: '0.1em', textTransform: 'uppercase' as const,
      lineHeight: 1.7, padding: '8px 0',
    },
    layerCard: (selected: boolean) => ({
      border: `1px solid ${selected ? '#e60023' : '#1e1e1e'}`,
      backgroundColor: selected ? '#120000' : '#0d0d0d',
      marginBottom: 8, padding: '10px',
    }),
    layerRow: {
      display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8,
    },
    thumb: {
      width: 36, height: 36, objectFit: 'contain' as const,
      backgroundColor: '#111', border: '1px solid #222', flexShrink: 0,
    },
    layerName: {
      flex: 1, fontSize: 11, fontWeight: 800, color: '#fff',
      letterSpacing: '0.12em', textTransform: 'uppercase' as const,
      whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis',
    },
    iconBtn: (danger = false) => ({
      background: 'none', border: 'none', cursor: 'pointer',
      color: danger ? '#e60023' : '#555', fontSize: 15, lineHeight: 1, padding: 2,
    }),
    actionRow: { display: 'flex', gap: 6, marginBottom: 6 },
    actionBtn: (disabled = false) => ({
      flex: 1, padding: '6px 4px',
      backgroundColor: '#111', border: '1px solid #222',
      color: disabled ? '#333' : '#999',
      fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
      textTransform: 'uppercase' as const, cursor: disabled ? 'not-allowed' : 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
    }),
    deleteBtn: {
      padding: '6px 8px',
      backgroundColor: '#1a0000', border: '1px solid #3a0000',
      color: '#e60023', fontSize: 12, cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    },
    uploadZone: {
      margin: '0 12px 12px',
      border: '1px dashed #1e1e1e', padding: '12px',
      textAlign: 'center' as const, cursor: 'pointer',
      backgroundColor: '#0a0a0a',
    },
    uploadText: {
      fontSize: 10, fontWeight: 700, color: '#444',
      letterSpacing: '0.1em', textTransform: 'uppercase' as const,
    },
    pinterestCard: {
      margin: '0 12px 12px',
      backgroundColor: '#1a0000',
      border: '1px solid #3a0000',
      borderRadius: 10, padding: '14px',
      cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'flex-start',
    },
    pinterestIcon: {
      width: 28, height: 28, borderRadius: '50%',
      backgroundColor: '#e60023', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    },
    pinterestText: {
      fontSize: 12, fontWeight: 700, color: '#fff', lineHeight: 1.5,
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

        {/* Layer list */}
        <div style={S.layerList} onDragOver={e => e.preventDefault()} onDrop={handleDrop}>
          {layers.length === 0 ? (
            <p style={S.emptyText}>
              No layers yet. Add an image to the {viewLabel.toLowerCase()} to start designing.
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
                  {/* Layer row */}
                  <div style={S.layerRow}>
                    <img src={layer.imageUrl} alt={layer.name} style={S.thumb} />
                    <span style={S.layerName}>LAYER {realIndex + 1}</span>
                    <button
                      style={S.iconBtn()}
                      onClick={e => { e.stopPropagation(); onUpdate(layer.id, { visible: !layer.visible }); }}
                      title={layer.visible ? 'Hide' : 'Show'}
                    >
                      {layer.visible ? '👁' : '🚫'}
                    </button>
                  </div>

                  {selected && (
                    <div onClick={e => e.stopPropagation()}>
                      {/* Edit Image */}
                      <div style={{ marginBottom: 6 }}>
                        <button
                          style={{ ...S.actionBtn(), width: '100%', justifyContent: 'center' }}
                          onClick={() => fileInputRef.current?.click()}
                        >
                          — EDIT IMAGE
                        </button>
                      </div>

                      {/* Advanced Remove Background Tools */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 6 }}>
                        {layer.originalImageUrl && layer.originalImageUrl !== layer.imageUrl && (
                          <button
                            style={{ ...S.actionBtn(), width: '100%', justifyContent: 'center', color: '#fff', backgroundColor: '#e60023', borderColor: '#e60023' }}
                            onClick={() => onUpdate(layer.id, { imageUrl: layer.originalImageUrl, pinterestUrl: '' })}
                            title="إلغاء التعديلات والرجوع للصورة الأصلية"
                          >
                            ↺ استعادة الصورة الأصلية
                          </button>
                        )}
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            style={{ ...S.actionBtn(removingBg[layer.id]), flex: 1, padding: '8px 4px' }}
                            onClick={() => handleRemoveColor(layer.id, layer.imageUrl, 'black')}
                            disabled={removingBg[layer.id]}
                            title="تفريغ اللون الأسود بالكامل مع الحفاظ على النصوص"
                          >
                            ⬛ إزالة الأسود
                          </button>
                          <button
                            style={{ ...S.actionBtn(removingBg[layer.id]), flex: 1, padding: '8px 4px' }}
                            onClick={() => handleRemoveColor(layer.id, layer.imageUrl, 'white')}
                            disabled={removingBg[layer.id]}
                            title="تفريغ اللون الأبيض بالكامل مع الحفاظ على النصوص"
                          >
                            ⬜ إزالة الأبيض
                          </button>
                        </div>
                        <button
                          style={{ ...S.actionBtn(removingBg[layer.id]), width: '100%', justifyContent: 'center' }}
                          onClick={() => handleRemoveBg(layer.id, layer.imageUrl)}
                          disabled={removingBg[layer.id]}
                          title="عزل الشخص أو العنصر الأساسي (يمسح النصوص والخلفية المشتتة)"
                        >
                          {removingBg[layer.id] ? '⏳ جاري العزل...' : '✨ عزل ذكي (AI)'}
                        </button>
                      </div>

                      {/* Rotate */}
                      <div style={S.actionRow}>
                        <button
                          style={S.actionBtn()}
                          onClick={() => onUpdate(layer.id, { rotation: (layer.rotation - 45 + 360) % 360 })}
                        >
                          ↺ ROTATE
                        </button>
                        <button
                          style={S.actionBtn()}
                          onClick={() => onUpdate(layer.id, { rotation: (layer.rotation + 45) % 360 })}
                        >
                          ↻ ROTATE
                        </button>
                      </div>

                      {/* Up / Down / Delete */}
                      <div style={S.actionRow}>
                        <button
                          style={S.actionBtn(realIndex >= layers.length - 1)}
                          disabled={realIndex >= layers.length - 1}
                          onClick={() => onReorder(realIndex, realIndex + 1)}
                        >
                          ↑ UP
                        </button>
                        <button
                          style={S.actionBtn(realIndex <= 0)}
                          disabled={realIndex <= 0}
                          onClick={() => onReorder(realIndex, realIndex - 1)}
                        >
                          ↓ DOWN
                        </button>
                        <button
                          style={S.deleteBtn}
                          onClick={() => onRemove(layer.id)}
                          title="Delete"
                        >
                          ×
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
