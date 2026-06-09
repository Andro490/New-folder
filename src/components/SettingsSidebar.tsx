import React, { useState, useRef, useEffect } from 'react';
import { DesignLayer, TShirtColor, TShirtView } from '../types';
import { Info } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { SizeGuideModal } from './SizeGuideModal';
import { PRINT_AREA, getTshirtSVG, CANVAS_WIDTH, CANVAS_HEIGHT } from '../utils/tshirtSvg';
import blackMockupFront from '../assets/black-mockup.png';
import blackMockupBack from '../assets/black-mockup-back.png';
import whiteMockupFront from '../assets/—Pngtree—white t shirt mockup realistic_13020297.png';
import whiteMockupBack from '../assets/—Pngtree—back white t shirt_13029479.png';

// ── Mini T-shirt Preview Canvas ──────────────────────────────────
function TshirtPreviewBox({ layers, tshirtColor, view, width = 220, height = 180 }: {
  layers: DesignLayer[];
  tshirtColor: TShirtColor;
  view: TShirtView;
  width?: number;
  height?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scale = width / CANVAS_WIDTH;
    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0, 0, width, height);

    // Determine background source
    let imgSrc = '';
    let isSvg = false;
    if (tshirtColor === 'black') {
      imgSrc = view === 'front' ? blackMockupFront : blackMockupBack;
    } else if (tshirtColor === 'white') {
      imgSrc = view === 'front' ? whiteMockupFront : whiteMockupBack;
    } else {
      isSvg = true;
      const svgStr = getTshirtSVG(tshirtColor, view);
      const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
      imgSrc = URL.createObjectURL(svgBlob);
    }

    const shirtImg = new Image();
    shirtImg.onload = () => {
      const rawHeight = Math.round(CANVAS_HEIGHT * scale);
      ctx.drawImage(shirtImg, 0, 0, width, rawHeight);
      if (isSvg) URL.revokeObjectURL(imgSrc);

      // Draw each visible layer
      const visibleLayers = layers.filter(l => l.visible && l.view === view);
      let drawn = 0;
      if (visibleLayers.length === 0) return;
      visibleLayers.forEach(layer => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          ctx.save();
          const cx = (layer.x + layer.width / 2) * scale;
          const cy = (layer.y + layer.height / 2) * scale;
          ctx.translate(cx, cy);
          ctx.rotate((layer.rotation * Math.PI) / 180);
          ctx.globalAlpha = layer.opacity;
          ctx.drawImage(img, -layer.width * scale / 2, -layer.height * scale / 2, layer.width * scale, layer.height * scale);
          ctx.restore();
          drawn++;
        };
        img.onerror = () => { drawn++; };
        img.src = layer.imageUrl;
      });
    };
    shirtImg.src = imgSrc;
  }, [layers, tshirtColor, view, width, height]);

  return <canvas ref={canvasRef} style={{ width, height, display: 'block' }} />;
}

interface PinterestModalProps {
  onClose: () => void;
  onAddLayer: (layer: DesignLayer) => void;
  view: TShirtView;
  setDesignUrl?: (url: string) => void;
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

function PinterestModal({ onClose, onAddLayer, view, setDesignUrl }: PinterestModalProps) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFetch = async () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    setLoading(true);
    setError('');

    try {
      let imageUrl = trimmed;
      const isPinterest =
        trimmed.includes('pinterest.com') ||
        trimmed.includes('pin.it') ||
        trimmed.includes('pinterest.');

      if (isPinterest) {
        const response = await fetch('/api/pinterest-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: trimmed })
        });
        const data = await response.json();
        
        if (!response.ok || !data.success) {
          throw new Error(data.error || 'فشل في جلب الصورة');
        }
        imageUrl = `/api/proxy-image?url=${encodeURIComponent(data.imageUrl)}`;
      }

      // Create layer
      const printArea = PRINT_AREA[view];
      const newLayer = {
        id: uuidv4(),
        name: 'Pinterest Image',
        imageUrl,
        x: printArea.x + 20,
        y: printArea.y + 20,
        width: Math.min(150, printArea.width - 40),
        height: Math.min(150, printArea.height - 40),
        rotation: 0,
        opacity: 1,
        visible: true,
        locked: false,
        view: view,
        pinterestUrl: isPinterest ? trimmed : (trimmed.startsWith('data:image') ? 'جاري الرفع...' : trimmed),
      };
      
      onAddLayer(newLayer);
      if (setDesignUrl) {
        setDesignUrl(newLayer.pinterestUrl);
      }
      onClose();

      // Upload base64 strings in the background
      if (!isPinterest && trimmed.startsWith('data:image')) {
        uploadToImgBB(trimmed).then(publicUrl => {
          // If we had onUpdateLayer we could update the layer, but we don't have it in props here.
          // However, we can at least update the designUrl state so checkout uses the public url!
          if (setDesignUrl) setDesignUrl(publicUrl);
        }).catch(err => {
          console.error("Failed to upload base64 to ImgBB", err);
        });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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
          width: 400, backgroundColor: '#0d0d0d',
          border: '1px solid #222', fontFamily: "'Inter', sans-serif", padding: 24
        }}
        onClick={e => e.stopPropagation()}
        dir="rtl"
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ margin: 0, color: '#fff' }}>إضافة صورة من Pinterest</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#666', fontSize: 20, cursor: 'pointer' }}>×</button>
        </div>
        
        <input 
          type="text" 
          value={url} 
          onChange={e => setUrl(e.target.value)} 
          placeholder="ضع رابط Pinterest هنا (مثل https://pin.it/...)"
          style={{ width: '100%', padding: '10px', marginBottom: 10, background: '#111', color: '#fff', border: '1px solid #333' }}
        />
        
        {error && <p style={{ color: '#e74c3c', fontSize: 13, marginBottom: 10 }}>{error}</p>}
        
        <button
          onClick={handleFetch}
          disabled={loading || !url}
          style={{
            width: '100%', padding: '12px',
            backgroundColor: loading || !url ? '#333' : '#f5c842',
            color: loading || !url ? '#666' : '#000',
            border: 'none', cursor: loading || !url ? 'not-allowed' : 'pointer',
            fontWeight: 'bold'
          }}
        >
          {loading ? 'جاري الجلب...' : 'استيراد الصورة'}
        </button>
      </div>
    </div>
  );
}

interface SettingsSidebarProps {
  view: TShirtView;
  onViewChange: (v: TShirtView) => void;
  tshirtColor: TShirtColor;
  onColorChange: (c: TShirtColor) => void;
  selectedLayer: DesignLayer | null;
  onLayerUpdate: (id: string, attrs: Partial<DesignLayer>) => void;
  onLayerRemove: (id: string) => void;
  onExport: () => void;
  onAddLayer: (layer: DesignLayer) => void;
  mockupScale: number;
  setMockupScale: (scale: number | ((prev: number) => number)) => void;
  onSaveDesign: () => void;
  allLayers: DesignLayer[];
}

interface OrderModalProps {
  onClose: () => void;
  tshirtColor: TShirtColor;
  allLayers: DesignLayer[];
  designLink?: string;
}

// ─── Text Modal ────────────────────────────────────────────────────
const FONTS = [
  { label: 'Cairo (عربي)', value: 'Cairo, sans-serif' },
  { label: 'Impact', value: 'Impact, sans-serif' },
  { label: 'Arial Black', value: '"Arial Black", sans-serif' },
  { label: 'Courier New', value: '"Courier New", monospace' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Anton', value: '"Anton", sans-serif' },
  { label: 'Bangers', value: '"Bangers", cursive' },
  { label: 'Bebas Neue', value: '"Bebas Neue", sans-serif' },
  { label: 'Bowlby One SC', value: '"Bowlby One SC", cursive' },
  { label: 'Changa One', value: '"Changa One", sans-serif' },
  { label: 'Creepster', value: '"Creepster", cursive' },
  { label: 'Knewave', value: '"Knewave", cursive' },
  { label: 'Modak', value: '"Modak", cursive' },
  { label: 'Monoton', value: '"Monoton", cursive' },
  { label: 'Nosifer', value: '"Nosifer", cursive' },
  { label: 'Permanent Marker', value: '"Permanent Marker", cursive' },
  { label: 'Righteous', value: '"Righteous", cursive' },
  { label: 'Rubik Glitch', value: '"Rubik Glitch", cursive' },
  { label: 'Special Elite', value: '"Special Elite", cursive' },
];

const PRESET_COLORS = [
  '#ffffff', '#000000', '#e60023', '#f5c842',
  '#6366f1', '#22d3ee', '#4ade80', '#f97316',
];

interface TextModalProps {
  onClose: () => void;
  onAddLayer: (layer: DesignLayer) => void;
  view: TShirtView;
}

function TextModal({ onClose, onAddLayer, view }: TextModalProps) {
  const [text, setText] = useState('نصك هنا');
  const [font, setFont] = useState('Cairo, sans-serif');
  const [color, setColor] = useState('#ffffff');
  const [fontSize, setFontSize] = useState(48);
  const [bold, setBold] = useState(true);
  const printArea = PRINT_AREA[view];

  function handleAdd() {
    if (!text.trim()) return;

    // Measure text width
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const weight = bold ? 'bold' : 'normal';
    ctx.font = `${weight} ${fontSize}px ${font}`;
    const metrics = ctx.measureText(text);
    const w = Math.ceil(metrics.width) + 20;
    const h = Math.ceil(fontSize * 1.4) + 10;

    canvas.width = w;
    canvas.height = h;
    const ctx2 = canvas.getContext('2d')!;
    ctx2.clearRect(0, 0, w, h);
    ctx2.font = `${weight} ${fontSize}px ${font}`;
    ctx2.fillStyle = color;
    ctx2.textBaseline = 'middle';
    ctx2.fillText(text, 10, h / 2);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      onAddLayer({
        id: uuidv4(),
        name: text.slice(0, 18),
        imageUrl: url,
        x: printArea.x + 20,
        y: printArea.y + 30,
        width: Math.min(w, printArea.width - 40),
        height: Math.ceil(h * Math.min(w, printArea.width - 40) / w),
        rotation: 0, opacity: 1, visible: true, locked: false,
        view: view,
        textProps: { text, font, color },
      });
      onClose();
    });
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
          width: 460, backgroundColor: '#0d0d0d',
          border: '1px solid #222', fontFamily: "'Inter', sans-serif",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: '1px solid #1e1e1e',
        }}>
          <div>
            <p style={{ fontSize: 10, color: '#888', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 2 }}>
              TEXT LAYER
            </p>
            <p style={{ fontSize: 15, fontWeight: 800, color: '#fff', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              ADD YOUR TEXT
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#666', fontSize: 20, cursor: 'pointer' }}>
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px' }}>

          {/* Live Preview */}
          <div style={{
            backgroundColor: '#111', border: '1px solid #222',
            padding: '20px', marginBottom: 20, minHeight: 80,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden',
          }}>
            <span style={{
              fontFamily: font,
              fontSize: Math.min(fontSize, 44),
              fontWeight: bold ? 900 : 400,
              color: color,
              whiteSpace: 'pre-wrap', wordBreak: 'break-word', textAlign: 'center',
            }}>
              {text || 'اكتب شيئاً...'}
            </span>
          </div>

          {/* Text Input */}
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="اكتب نصك هنا..."
            dir="auto"
            rows={2}
            style={{
              width: '100%', padding: '10px 12px',
              backgroundColor: '#0a0a0a', color: '#fff',
              border: '1px solid #2a2a2a', marginBottom: 16,
              fontSize: 14, outline: 'none', resize: 'none',
              fontFamily: font, boxSizing: 'border-box',
            }}
          />

          {/* Font & Bold row */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 10, color: '#666', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>FONT</p>
              <select
                value={font}
                onChange={e => setFont(e.target.value)}
                style={{
                  width: '100%', padding: '8px 10px',
                  backgroundColor: '#111', color: '#fff',
                  border: '1px solid #2a2a2a', fontSize: 12, outline: 'none',
                }}
              >
                {FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>
            <div>
              <p style={{ fontSize: 10, color: '#666', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>BOLD</p>
              <button
                onClick={() => setBold(b => !b)}
                style={{
                  padding: '8px 14px', height: 34,
                  backgroundColor: bold ? '#f5c842' : '#111',
                  color: bold ? '#000' : '#888',
                  border: '1px solid #2a2a2a', cursor: 'pointer',
                  fontWeight: 900, fontSize: 13,
                }}
              >
                B
              </button>
            </div>
          </div>

          {/* Font size */}
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 10, color: '#666', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>
              SIZE — {fontSize}px
            </p>
            <input
              type="range" min={16} max={120} value={fontSize}
              onChange={e => setFontSize(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#f5c842' }}
            />
          </div>

          {/* Color */}
          <div style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 10, color: '#666', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>COLOR</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  style={{
                    width: 28, height: 28, backgroundColor: c,
                    border: color === c ? '2px solid #f5c842' : '1px solid #333',
                    cursor: 'pointer', flexShrink: 0,
                  }}
                />
              ))}
              {/* Custom color picker */}
              <input
                type="color" value={color}
                onChange={e => setColor(e.target.value)}
                style={{ width: 28, height: 28, padding: 0, border: '1px solid #333', cursor: 'pointer', backgroundColor: 'transparent' }}
                title="اختر لون مخصص"
              />
            </div>
          </div>

          {/* Add button */}
          <button
            onClick={handleAdd}
            disabled={!text.trim()}
            style={{
              width: '100%', padding: '14px',
              backgroundColor: text.trim() ? 'rgb(245, 200, 66)' : '#333',
              color: text.trim() ? '#000' : '#666',
              border: 'none', cursor: text.trim() ? 'pointer' : 'not-allowed',
              fontSize: 13, fontWeight: 900,
              letterSpacing: '0.2em', textTransform: 'uppercase',
            }}
          >
            ADD TO DESIGN
          </button>
        </div>
      </div>
    </div>
  );
}

const SIZES = [
  { id: 'S',   label: 'SMALL',   dims: '52 × 68', height: '165–170 cm tall', weight: '50–70 kg' },
  { id: 'M',   label: 'MEDIUM',  dims: '54 × 70', height: '170–175 cm tall', weight: '70–80 kg' },
  { id: 'L',   label: 'LARGE',   dims: '56 × 72', height: '175–180 cm tall', weight: '80–90 kg' },
  { id: 'XL',  label: 'XLARGE',  dims: '58 × 74', height: '180–185 cm tall', weight: '90–100 kg' },
  { id: 'XXL', label: 'XXLARGE', dims: '60 × 76', height: '185–195 cm tall', weight: '100–110 kg' },
];

// ── دالة إرسال الطلب عبر الـ Backend (يتجنب CORS) ──────────────
async function sendOrderToSheet(orderData: Record<string, string>): Promise<void> {
  // ✅ تنظيف كل القيم
  const safe: Record<string, string> = {};
  for (const key in orderData) {
    const val = orderData[key];
    safe[key] = (val !== undefined && val !== null && String(val).trim() !== '')
      ? String(val).trim()
      : 'غير متوفر';
  }

  console.log('📦 بيانات الطلب اللي هتتبعت:', safe);

  const response = await fetch('/api/submit-order', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(safe),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'فشل الإرسال');
  }

  console.log('✅ تم إرسال الطلب بنجاح');
}


function OrderModal({ onClose, tshirtColor, allLayers, designLink }: OrderModalProps) {
  type Step = 'size' | 'review' | 'checkout' | 'thanks';
  const [step, setStep] = useState<Step>('size');
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [payMethod, setPayMethod] = useState<'instapay' | 'cod'>('cod');
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState<string | null>(null);
  const [shipping, setShipping] = useState<'free' | 'premium'>('free');
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', city: '', governorate: '', address: '' });
  const [showRefundPolicy, setShowRefundPolicy] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const colorLabel = tshirtColor === 'black' ? 'أسود' : tshirtColor === 'white' ? 'أبيض' : tshirtColor === 'navy' ? 'كحلي' : tshirtColor === 'red' ? 'أحمر' : 'رمادي';
  const colorDot = tshirtColor === 'black' ? '#111' : tshirtColor === 'white' ? '#f0f0f0' : tshirtColor === 'navy' ? '#1e3a5f' : tshirtColor === 'red' ? '#c0392b' : '#888';
  const designPrice = 700;
  const shippingCost = shipping === 'premium' ? 70 : 0;
  const total = designPrice + shippingCost;

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px',
    backgroundColor: '#0a0a0a', color: '#fff',
    border: '1px solid #2a2a2a', outline: 'none',
    fontSize: 13, fontFamily: 'inherit',
    boxSizing: 'border-box',
  };

  // ── THANK YOU ──────────────────────────────────────────────────
  if (step === 'thanks') {
    return (
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <div style={{ maxWidth: 520, width: '90%', backgroundColor: '#080808', border: '1px solid #1e1e1e', padding: '52px 40px', textAlign: 'center', fontFamily: "'Inter', sans-serif" }}>
          {/* Animated checkmark */}
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #f5c842, #e6a800)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px', boxShadow: '0 0 40px rgba(245,200,66,0.35)' }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          <p style={{ fontSize: 11, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#f5c842', marginBottom: 12 }}>ORDER CONFIRMED</p>
          <h2 style={{ fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: '0.05em', marginBottom: 16 }}>شكراً لك! 🎉</h2>
          <p style={{ fontSize: 14, color: '#666', lineHeight: 1.8, marginBottom: 36 }}>
            تم استلام طلبك بنجاح.<br />
            سيتواصل معك فريقنا خلال <strong style={{ color: '#fff' }}>24 ساعة</strong> لتأكيد التصميم.<br />
            ترقّب تيشيرتك المخصص! 🔥
          </p>

          {/* Order summary pill */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 36 }}>
            {[
              { label: 'المقاس', value: selectedSize ?? '-' },
              { label: 'اللون', value: colorLabel },
              { label: 'الإجمالي', value: `${total} جنيه` },
            ].map(item => (
              <div key={item.label} style={{ backgroundColor: '#111', border: '1px solid #222', padding: '10px 20px', minWidth: 110 }}>
                <p style={{ fontSize: 10, color: '#555', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>{item.label}</p>
                <p style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{item.value}</p>
              </div>
            ))}
          </div>

          <button
            onClick={onClose}
            style={{ width: '100%', padding: '14px', backgroundColor: '#f5c842', color: '#000', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase' }}
          >
            العودة للتصميم
          </button>
        </div>
      </div>
    );
  }

  // ── CHECKOUT FORM ───────────────────────────────────────────────
  if (step === 'checkout') {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 200, backgroundColor: '#060606', overflowY: 'auto', fontFamily: "'Inter', sans-serif" }} dir="rtl">
        
        {/* Refund Policy Modal */}
        {showRefundPolicy && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowRefundPolicy(false)}>
            <div style={{ width: 480, maxWidth: '90%', backgroundColor: '#111', border: '1px solid #222', padding: 40, fontFamily: "'Inter', sans-serif" }} onClick={e => e.stopPropagation()} dir="rtl">
              <p style={{ fontSize: 11, color: '#555', marginBottom: 12 }}>سياسة</p>
              <h2 style={{ fontSize: 24, fontWeight: 900, color: '#fff', letterSpacing: '0.05em', marginBottom: 24 }}>سياسة الاسترداد</h2>
              <p style={{ fontSize: 15, color: '#ddd', lineHeight: 1.8, marginBottom: 36 }}>
                للأسف، لا نقدم خدمة الإرجاع أو الاستبدال لأن هذا التيشيرت مصمم خصيصاً لك. مع ذلك، يمكنك رفض استلام الطلب إذا لم يكن التصميم كما صممته أو طلبته، أو إذا لم تكن راضياً عن الخامة.
              </p>
              <button onClick={() => setShowRefundPolicy(false)} style={{ width: '100%', padding: '16px', backgroundColor: '#f5c842', color: '#000', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 900 }}>
                فهمتها
              </button>
            </div>
          </div>
        )}

        {/* Top bar */}
        <div style={{ borderBottom: '1px solid #1a1a1a', padding: '14px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontSize: 11, color: '#555', letterSpacing: '0.1em' }}>الخطوة الثانية من أجل خطواتك</p>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#444', fontSize: 20, cursor: 'pointer' }}>×</button>
        </div>

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px', display: 'grid', gridTemplateColumns: '1fr 380px', gap: 40 }}>
          {/* LEFT: Form */}
          <div>
            <h1 style={{ fontSize: 36, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', marginBottom: 32 }}>الدفع</h1>

            {/* Delivery info */}
            <p style={{ fontSize: 12, color: '#555', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>معلومات التوصيل</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: 10, color: '#555', letterSpacing: '0.1em' }}>الاسم الأول</label>
                <input style={inputStyle} value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: 10, color: '#555', letterSpacing: '0.1em' }}>اسم العائلة</label>
                <input style={inputStyle} value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} />
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 10, color: '#555', letterSpacing: '0.1em' }}>رقم الهاتف</label>
              <input style={inputStyle} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="01xxxxxxxxx" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: 10, color: '#555', letterSpacing: '0.1em' }}>مدينة</label>
                <input style={inputStyle} value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: 10, color: '#555', letterSpacing: '0.1em' }}>محافظة</label>
                <input style={inputStyle} value={form.governorate} onChange={e => setForm(f => ({ ...f, governorate: e.target.value }))} />
              </div>
            </div>
            <div style={{ marginBottom: 32 }}>
              <label style={{ fontSize: 10, color: '#555', letterSpacing: '0.1em' }}>عنوان</label>
              <input style={inputStyle} value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
            </div>

            {/* Shipping */}
            <p style={{ fontSize: 12, color: '#555', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>شحن</p>
            {[
              { id: 'free', label: 'اشحن مجانًا', sub: 'متوفر داخل 6 أكتوبر والشيخ زايد فقط', price: '0 جنيه مصري', icon: '🎁' },
              { id: 'premium', label: 'خدمة الترحيل في مصر', sub: 'يتم التوصيل خلال 7 أيام عمل', price: '70 جنيهًا مصريًا', icon: '🚚' },
            ].map(opt => (
              <div
                key={opt.id}
                onClick={() => setShipping(opt.id as 'free' | 'premium')}
                style={{ border: `1px solid ${shipping === opt.id ? '#f5c842' : '#1e1e1e'}`, backgroundColor: shipping === opt.id ? 'rgba(245,200,66,0.05)' : '#0a0a0a', padding: '16px 20px', marginBottom: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16 }}
              >
                <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${shipping === opt.id ? '#f5c842' : '#444'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {shipping === opt.id && <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#f5c842' }} />}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{opt.icon} {opt.label}</p>
                  <p style={{ fontSize: 11, color: '#555', marginTop: 2 }}>{opt.sub}</p>
                </div>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#4ade80', flexShrink: 0 }}>{opt.price}</p>
              </div>
            ))}

            {/* Payment */}
            <p style={{ fontSize: 12, color: '#555', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16, marginTop: 28 }}>قسط</p>
            {[
              { id: 'instapay', label: 'إنستاباي', sub: 'أرسل إلى: 01065383482', icon: '📱' },
              { id: 'cod', label: 'الدفع عند الاستلام', sub: 'سيُطلب دفع عربون بنسبة 20% من السعر الإجمالي', icon: '💵' },
            ].map(opt => (
              <div
                key={opt.id}
                onClick={() => setPayMethod(opt.id as 'instapay' | 'cod')}
                style={{ border: `1px solid ${payMethod === opt.id ? '#f5c842' : '#1e1e1e'}`, backgroundColor: payMethod === opt.id ? 'rgba(245,200,66,0.05)' : '#0a0a0a', padding: '16px 20px', marginBottom: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16 }}
              >
                <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${payMethod === opt.id ? '#f5c842' : '#444'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {payMethod === opt.id && <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#f5c842' }} />}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{opt.icon} {opt.label}</p>
                  <p style={{ fontSize: 11, color: '#555', marginTop: 2 }}>{opt.sub}</p>
                </div>
              </div>
            ))}

            {/* InstaPay Upload Section */}
            {payMethod === 'instapay' && (
              <div style={{ marginTop: 16, border: '1px dashed #f5c842', padding: '20px', backgroundColor: 'rgba(245,200,66,0.03)' }}>
                <p style={{ fontSize: 11, color: '#f5c842', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>📎 إرفاق إيصال التحويل</p>
                <label
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: 10, padding: '14px', border: '1px solid #2a2a2a',
                    backgroundColor: '#0a0a0a', cursor: 'pointer',
                    fontSize: 12, color: '#888', letterSpacing: '0.08em'
                  }}
                >
                  <span style={{ fontSize: 18 }}>📷</span>
                  {paymentProof ? paymentProof.name : '+ اختر صورة التحويل'}
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setPaymentProof(file);
                        setPaymentProofPreview(URL.createObjectURL(file));
                      }
                    }}
                  />
                </label>
                {paymentProofPreview && (
                  <div style={{ marginTop: 12, position: 'relative' }}>
                    <img
                      src={paymentProofPreview}
                      alt="إيصال الدفع"
                      style={{ width: '100%', maxHeight: 200, objectFit: 'cover', border: '1px solid #2a2a2a' }}
                    />
                    <button
                      onClick={() => { setPaymentProof(null); setPaymentProofPreview(null); }}
                      style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,0.8)', border: 'none', color: '#fff', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', fontSize: 14 }}
                    >×</button>
                    <p style={{ fontSize: 11, color: '#4ade80', marginTop: 8 }}>✓ تم رفع الإيصال بنجاح</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RIGHT: Order summary */}
          <div>
            <p style={{ fontSize: 12, color: '#555', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 20 }}>تصميمك</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 24 }}>
              {[{ id: 'front', label: 'أمام' }, { id: 'back', label: 'خلف' }].map(side => (
                <div key={side.id} style={{ backgroundColor: '#0a0a0a', border: '1px solid #1a1a1a', padding: 12 }}>
                  <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8, overflow: 'hidden' }}>
                    <TshirtPreviewBox layers={allLayers} tshirtColor={tshirtColor} view={side.id as TShirtView} width={150} height={160} />
                  </div>
                  <p style={{ fontSize: 11, color: '#555', textAlign: 'center', letterSpacing: '0.1em' }}>{side.label}</p>
                </div>
              ))}
            </div>

            <p style={{ fontSize: 12, color: '#555', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>ملخص الطلب</p>
            {[
              { label: 'منتج', value: 'تي شيرت' },
              { label: 'ملائم', value: 'مقاس عادي' },
              { label: 'لون', value: <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 12, height: 12, backgroundColor: colorDot, border: '1px solid #333', display: 'inline-block' }} />{colorLabel}</span> },
              { label: 'مقاس', value: selectedSize },
              { label: 'تصميم', value: `جنيه مصري ${designPrice}` },
              { label: 'رابط التصميم', value: (allLayers.find(l => l.pinterestUrl)?.pinterestUrl || 'لا يوجد رابط') },
              { label: 'شحن', value: shippingCost === 0 ? <span style={{ color: '#4ade80' }}>حر</span> : `${shippingCost} جنيه` },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #111' }}>
                <span style={{ fontSize: 12, color: '#555' }}>{row.label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{row.value as any}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', marginTop: 4 }}>
              <span style={{ fontSize: 12, color: '#555' }}>المجموع</span>
              <span style={{ fontSize: 18, fontWeight: 900, color: '#f5c842' }}>جنيه مصري {total}</span>
            </div>

            <button
              id="submit-btn"
              disabled={isSubmitting}
              onClick={async () => {
                if (!form.firstName || !form.phone || !form.address) {
                  alert('يرجى ملء الاسم ورقم الهاتف والعنوان');
                  return;
                }
                if (payMethod === 'instapay' && !paymentProof) {
                  alert('يرجى رفع صورة إيصال التحويل عبر إنستاباي');
                  return;
                }
                setIsSubmitting(true);
                // ── استخراج رابط Pinterest من الطبقات ──
                const pLayer = allLayers.find(l => l.pinterestUrl);
                const designLinkFinal = designLink || pLayer?.pinterestUrl || 'لا يوجد رابط';

                // ── استخراج طبقات النصوص ──
                const textLayers = allLayers.filter(l => l.textProps);
                const textSummary = textLayers.length > 0
                  ? textLayers.map((l, i) =>
                      `[${i + 1}] نص: "${l.textProps!.text}" | خط: ${l.textProps!.font.split(',')[0]} | لون: ${l.textProps!.color}`
                    ).join('\n')
                  : 'لا يوجد نص';

                try {
                  // ── إرسال الطلب عبر الـ Backend ──
                  await sendOrderToSheet({
                    firstName:     form.firstName,
                    lastName:      form.lastName,
                    phone:         form.phone,
                    city:          form.city,
                    governorate:   form.governorate,
                    address:       form.address,
                    size:          selectedSize ?? '-',
                    color:         tshirtColor,
                    shippingType:  shipping,
                    paymentMethod: payMethod,
                    designLink:    designLinkFinal,
                    textLayers:    textSummary,
                    paymentStatus: payMethod === 'instapay' ? 'إيداع انستا باي' : 'الدفع عند الاستلام',
                    totalPrice:    String(designPrice + (shipping === 'premium' ? 70 : 0)) + ' جنيه',
                    timestamp:     new Date().toLocaleString('ar-EG'),
                  });
                  setStep('thanks');
                } catch (err: any) {
                  alert('❌ حدث خطأ أثناء إرسال الطلب:\n' + err.message);
                } finally {
                  setIsSubmitting(false);
                }
              }}
              style={{
                width: '100%', padding: '16px',
                backgroundColor: isSubmitting ? '#8a7020' : '#f5c842',
                color: '#000', border: 'none',
                cursor: isSubmitting ? 'wait' : 'pointer',
                fontSize: 14, fontWeight: 900,
                letterSpacing: '0.15em', marginTop: 4,
                transition: 'background-color 0.2s',
              }}
            >
              {isSubmitting ? '⏳ جاري إرسال الطلب...' : 'إتمام الطلب ✓'}
            </button>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 16 }}>
              <button style={{ background: 'none', border: 'none', fontSize: 12, color: '#444', cursor: 'pointer' }}>اتصل بنا</button>
              <span style={{ color: '#333' }}>|</span>
              <button onClick={() => setShowRefundPolicy(true)} style={{ background: 'none', border: 'none', fontSize: 12, color: '#444', cursor: 'pointer' }}>سياسة الاسترداد</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── REVIEW ──────────────────────────────────────────────────────
  if (step === 'review') {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
        <div style={{ width: 560, backgroundColor: '#080808', border: '1px solid #1e1e1e', fontFamily: "'Inter', sans-serif" }} onClick={e => e.stopPropagation()}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #111', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: 10, color: '#555', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 4 }}>STEP 2 OF 2</p>
              <h2 style={{ fontSize: 18, fontWeight: 900, color: '#fff', letterSpacing: '0.08em', textTransform: 'uppercase' }}>REVIEW ORDER</h2>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#444', fontSize: 20, cursor: 'pointer' }}>×</button>
          </div>

          <div style={{ padding: '24px', overflowY: 'auto', maxHeight: '70vh' }}>
            <button onClick={() => setStep('size')} style={{ background: 'none', border: 'none', color: '#555', fontSize: 12, cursor: 'pointer', marginBottom: 20, letterSpacing: '0.05em' }}>← CHANGE SIZE</button>

            <p style={{ fontSize: 10, color: '#555', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>DESIGN PREVIEW</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 24 }}>
              {[{ id: 'front', label: 'FRONT' }, { id: 'back', label: 'BACK' }].map(side => (
                <div key={side.id} style={{ backgroundColor: '#0a0a0a', border: '1px solid #1a1a1a' }}>
                  <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    <TshirtPreviewBox layers={allLayers} tshirtColor={tshirtColor} view={side.id as TShirtView} width={200} height={200} />
                  </div>
                  <p style={{ textAlign: 'center', fontSize: 10, color: '#444', letterSpacing: '0.15em', padding: '8px 0' }}>{side.label}</p>
                </div>
              ))}
            </div>

            <p style={{ fontSize: 10, color: '#555', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>CONFIGURATION</p>
            {[
              { label: 'PRODUCT', value: 'T-SHIRT' },
              { label: 'FIT', value: 'REGULAR FIT' },
              { label: 'COLOR', value: <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 12, height: 12, backgroundColor: colorDot, border: '1px solid #333', display: 'inline-block' }} />{colorLabel.toUpperCase()}</span> },
              { label: 'SIZE', value: selectedSize },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: '#0a0a0a', border: '1px solid #111', marginBottom: 1 }}>
                <span style={{ fontSize: 11, color: '#444', letterSpacing: '0.1em' }}>{row.label}</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#fff', letterSpacing: '0.05em' }}>{row.value as any}</span>
              </div>
            ))}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', marginTop: 8 }}>
              <span style={{ fontSize: 11, color: '#555', letterSpacing: '0.1em' }}>TOTAL</span>
              <span style={{ fontSize: 22, fontWeight: 900, color: '#f5c842' }}>{designPrice} <span style={{ fontSize: 13, color: '#888' }}>EGP</span></span>
            </div>

            <button
              onClick={() => setStep('checkout')}
              style={{ width: '100%', padding: '16px', backgroundColor: '#f5c842', color: '#000', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase' }}
            >
              CONFIRM ORDER
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── SIZE SELECTION ───────────────────────────────────────────────
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ width: 860, maxHeight: '90vh', backgroundColor: '#080808', border: '1px solid #1e1e1e', fontFamily: "'Inter', sans-serif", display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #111', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: 10, color: '#555', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 4 }}>STEP 1 OF 2</p>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: '#fff', letterSpacing: '0.08em', textTransform: 'uppercase' }}>SELECT SIZE</h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#444', fontSize: 20, cursor: 'pointer' }}>×</button>
        </div>

        <div style={{ overflowY: 'auto', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <p style={{ fontSize: 10, color: '#555', letterSpacing: '0.15em', textTransform: 'uppercase', margin: 0 }}>PERFECT YOUR FIT</p>
            <button
              onClick={() => setShowSizeGuide(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', backgroundColor: 'rgba(245, 200, 66, 0.1)',
                color: '#f5c842', border: '1px solid rgba(245, 200, 66, 0.3)',
                borderRadius: 100, fontSize: 12, fontWeight: 700,
                cursor: 'pointer', transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(245, 200, 66, 0.2)'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(245, 200, 66, 0.1)'}
            >
              <Info size={14} />
              اعرف مقاسك
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            {SIZES.map(sz => (
              <div
                key={sz.id}
                onClick={() => { setSelectedSize(sz.id); setStep('review'); }}
                style={{
                  border: `1px solid ${selectedSize === sz.id ? '#f5c842' : '#1e1e1e'}`,
                  backgroundColor: selectedSize === sz.id ? 'rgba(245,200,66,0.05)' : '#0a0a0a',
                  padding: '28px 20px', cursor: 'pointer', textAlign: 'center',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#f5c842')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = selectedSize === sz.id ? '#f5c842' : '#1e1e1e')}
              >
                <p style={{ fontSize: 20, fontWeight: 900, color: '#fff', letterSpacing: '0.12em', marginBottom: 8 }}>{sz.label}</p>
                <p style={{ fontSize: 12, color: '#555', marginBottom: 10 }}>
                  {sz.dims.split(' × ')[0]} × {sz.dims.split(' × ')[1]} <span style={{ color: '#4a9eff', fontSize: 10 }}>cm</span>
                </p>
                <p style={{ fontSize: 11, color: '#444', lineHeight: 1.7 }}>{sz.height}<br />{sz.weight}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      {showSizeGuide && (
        <SizeGuideModal onClose={() => setShowSizeGuide(false)} />
      )}
    </div>
  );
}

export default function SettingsSidebar({
  view,
  onViewChange,
  tshirtColor,
  onColorChange,
  selectedLayer,
  onLayerUpdate,
  onLayerRemove,
  onExport,
  onAddLayer,
  mockupScale,
  setMockupScale,
  onSaveDesign,
  allLayers,
}: SettingsSidebarProps) {
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showTextModal, setShowTextModal] = useState(false);
  const [showPinterestModal, setShowPinterestModal] = useState(false);
  const [designUrl, setDesignUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const printArea = PRINT_AREA[view];

  function createLayer(imageUrl: string, name: string): DesignLayer {
    return {
      id: uuidv4(),
      name,
      imageUrl,
      x: printArea.x + 20,
      y: printArea.y + 20,
      width: Math.min(150, printArea.width - 40),
      height: Math.min(150, printArea.height - 40),
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      view: view,
    };
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const name = file.name.replace(/\.[^.]+$/, '').slice(0, 20);
    onAddLayer(createLayer(url, name));
    e.target.value = '';
  }

  return (
    <>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileUpload}
      />
      <aside
        className="flex flex-col shrink-0 overflow-y-auto bg-[#050505] w-full lg:w-[288px] lg:min-w-[288px] h-auto lg:h-full border-t lg:border-t-0 border-[#1a1a1a]"
        style={{ borderLeft: '1px solid #1a1a1a' }}
        dir="rtl"
      >
        {/* ─── Section 1: إعدادات ─── */}
        <div style={{ padding: '24px', borderBottom: '1px solid #1a1a1a' }}>
          <p style={{ fontSize: 13, color: '#888', marginBottom: 20, textAlign: 'right' }}>
            إعدادات
          </p>

          {/* Row: منتج */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 13, color: '#555' }}>منتج</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>تي شيرت</span>
          </div>

          {/* Row: ملائم */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 13, color: '#555' }}>ملائم</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>مقاس عادي</span>
          </div>

          {/* Row: لون */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: '#555' }}>لون</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>
                {tshirtColor === 'black' ? 'أسود'
                : tshirtColor === 'white' ? 'أبيض'
                : tshirtColor === 'navy'  ? 'كحلي'
                : tshirtColor === 'red'   ? 'أحمر' : 'رمادي'}
              </span>
              <div style={{
                width: 14, height: 14,
                backgroundColor:
                  tshirtColor === 'black' ? '#111'
                  : tshirtColor === 'white' ? '#f0f0f0'
                  : tshirtColor === 'navy'  ? '#1e3a5f'
                  : tshirtColor === 'red'   ? '#c0392b' : '#888',
                border: `1px solid ${tshirtColor === 'white' ? '#ccc' : '#333'}`,
              }} />
            </div>
          </div>
        </div>

        {/* ─── Section 2: اطلب الآن ─── */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #1a1a1a' }}>
          <button
            onClick={() => setShowOrderModal(true)}
            style={{
              width: '100%',
              padding: '14px 0',
              backgroundColor: 'rgb(245, 200, 66)',
              color: 'rgb(13, 13, 13)',
              fontWeight: 900,
              fontSize: 14,
              letterSpacing: '0.2em',
              border: 'none',
              cursor: 'pointer',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            اطلب الآن
          </button>
        </div>

        {/* ─── Section 3: أدوات ─── */}
        <div style={{ padding: '24px', borderBottom: '1px solid #1a1a1a' }}>
          <p style={{ fontSize: 13, color: '#888', marginBottom: 20, textAlign: 'right' }}>
            أدوات
          </p>

          {/* إضافة صورة */}
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              display: 'block', width: '100%', textAlign: 'right',
              padding: '12px 16px', marginBottom: 12,
              fontSize: 14, fontWeight: 700, color: '#fff',
              backgroundColor: '#050505',
              border: '1px solid #222',
              cursor: 'pointer', transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#111')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#050505')}
          >
            إضافة صورة من الجهاز
          </button>

          {/* إضافة رابط Pinterest */}
          <button
            onClick={() => setShowPinterestModal(true)}
            style={{
              display: 'block', width: '100%', textAlign: 'right',
              padding: '12px 16px', marginBottom: 12,
              fontSize: 14, fontWeight: 700, color: '#fff',
              backgroundColor: '#050505',
              border: '1px solid #222',
              cursor: 'pointer', transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#111')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#050505')}
          >
            إضافة رابط Pinterest
          </button>

          {/* أضف نصًا */}
          <button
            onClick={() => setShowTextModal(true)}
            style={{
              display: 'block', width: '100%', textAlign: 'right',
              padding: '12px 16px', marginBottom: 24,
              fontSize: 14, fontWeight: 700, color: '#fff',
              backgroundColor: '#050505',
              border: '1px solid #222',
              cursor: 'pointer', transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#111')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#050505')}
          >
            أضف نصًا
          </button>

          {/* حجم النموذج الأولي */}
          <p style={{ fontSize: 12, color: '#555', marginBottom: 10, textAlign: 'right' }}>
            حجم النموذج الأولي
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => setMockupScale(s => Math.max(0.5, s - 0.1))}
              style={{
                flex: 1, padding: '10px 0', textAlign: 'center',
                fontSize: 13, fontWeight: 700, color: '#fff',
                backgroundColor: '#050505', border: '1px solid #222',
                cursor: 'pointer',
              }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#111')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#050505')}
            >
              - أصغر
            </button>
            <button
              onClick={() => setMockupScale(s => Math.min(2, s + 0.1))}
              style={{
                flex: 1, padding: '10px 0', textAlign: 'center',
                fontSize: 13, fontWeight: 700, color: '#fff',
                backgroundColor: '#050505', border: '1px solid #222',
                cursor: 'pointer',
              }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#111')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#050505')}
            >
              + أكبر
            </button>
          </div>

          <button
            onClick={onSaveDesign}
            style={{
              display: 'block', width: '100%', textAlign: 'center',
              padding: '12px 16px', marginTop: 12,
              fontSize: 13, fontWeight: 700, color: '#0d0d0d',
              backgroundColor: '#f5c842', border: 'none',
              cursor: 'pointer', transition: 'all 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            حفظ التعديلات (Save)
          </button>
        </div>

        {/* ─── Empty bottom ─── */}
        <div style={{ flex: 1, backgroundColor: '#050505' }} />
      </aside>

      {showOrderModal && <OrderModal onClose={() => setShowOrderModal(false)} tshirtColor={tshirtColor} allLayers={allLayers} designLink={designUrl} />}
      {showPinterestModal && (
        <PinterestModal
          onClose={() => setShowPinterestModal(false)}
          onAddLayer={onAddLayer}
          view={view}
          setDesignUrl={setDesignUrl}
        />
      )}
      {showTextModal && (
        <TextModal
          onClose={() => setShowTextModal(false)}
          onAddLayer={onAddLayer}
          view={view}
        />
      )}
    </>
  );
}
