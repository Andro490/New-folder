// ── PinterestModal ──────────────────────────────────────────────────
// Allows the user to import an image from a Pinterest URL or any direct image URL.

import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { DesignLayer, TShirtView } from '../../types';
import { PRINT_AREA } from '../../utils/tshirtSvg';
import { uploadToImgBB } from '../../utils/imgbb';

interface Props {
  onClose: () => void;
  onAddLayer: (layer: DesignLayer) => void;
  view: TShirtView;
  setDesignUrl?: (url: string) => void;
}

export default function PinterestModal({ onClose, onAddLayer, view, setDesignUrl }: Props) {
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

      const isDirectPinterestImage = trimmed.includes('pinimg.com');

      if (isPinterest && !isDirectPinterestImage) {
        const API_BASE = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:3001' : '');
        const response = await fetch(`${API_BASE}/api/pinterest-image`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: trimmed }),
          signal: AbortSignal.timeout(25000),
        });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error || 'فشل في جلب الصورة');
        imageUrl = `${API_BASE}/api/proxy-image?url=${encodeURIComponent(data.imageUrl)}`;
      } else if (isDirectPinterestImage || (trimmed.startsWith('http') && !trimmed.includes('localhost'))) {
        const API_BASE = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:3001' : '');
        imageUrl = `${API_BASE}/api/proxy-image?url=${encodeURIComponent(trimmed)}`;
      }

      const printArea = PRINT_AREA[view];
      const newLayer: DesignLayer = {
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
        view,
        pinterestUrl: isPinterest ? trimmed : trimmed.startsWith('data:image') ? 'جاري الرفع...' : trimmed,
      };

      onAddLayer(newLayer);
      if (setDesignUrl) setDesignUrl(newLayer.pinterestUrl!);
      onClose();

      // Background upload for base64 images
      if (!isPinterest && trimmed.startsWith('data:image')) {
        uploadToImgBB(trimmed)
          .then(publicUrl => { if (setDesignUrl) setDesignUrl(publicUrl); })
          .catch(err => console.error('Failed to upload base64 to ImgBB', err));
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
          width: 400,
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          fontFamily: "'Inter', sans-serif",
          padding: 24,
        }}
        onClick={e => e.stopPropagation()}
        dir="rtl"
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>إضافة صورة من Pinterest</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#666', fontSize: 20, cursor: 'pointer' }}>×</button>
        </div>

        <input
          type="text"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="ضع رابط Pinterest هنا (مثل https://pin.it/...)"
          style={{
            width: '100%', padding: '10px', marginBottom: 10,
            background: 'var(--bg-card)', color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
          }}
        />

        {error && <p style={{ color: '#e74c3c', fontSize: 13, marginBottom: 10 }}>{error}</p>}

        <button
          onClick={handleFetch}
          disabled={loading || !url}
          style={{
            width: '100%', padding: '12px',
            backgroundColor: loading || !url ? '#333' : 'var(--accent-primary)',
            color: loading || !url ? '#666' : '#000',
            border: 'none',
            cursor: loading || !url ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
          }}
        >
          {loading ? 'جاري الجلب...' : 'استيراد الصورة'}
        </button>
      </div>
    </div>
  );
}
