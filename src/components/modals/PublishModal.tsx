// ── PublishModal ──────────────────────────────────────────────────
// Allows logged-in users to publish their design to the community store
// with an optional solid color or image background.

import React, { useState, useRef } from 'react';
import { X, Upload } from 'lucide-react';
import { DesignLayer, TShirtColor } from '../../types';
import { generateTshirtImage } from '../../utils/tshirtCanvas';
import { uploadToImgBB } from '../../utils/imgbb';
import { useLanguage } from '../../contexts/LanguageContext';

const BG_PRESETS = ['#000000', '#111827', '#1a1a2e', '#0f3460', '#fff8e8', '#fafafa'];

interface Props {
  tshirtColor: TShirtColor;
  allLayers: DesignLayer[];
  onClose: () => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export default function PublishModal({
  tshirtColor,
  allLayers,
  onClose,
  onSuccess,
  onError,
}: Props) {
  const [name, setName] = useState('');
  const [bgTab, setBgTab] = useState<'none' | 'color' | 'image'>('none');
  const [bgColor, setBgColor] = useState('#1a1a1a');
  const [bgImage, setBgImage] = useState<string | undefined>(undefined);
  const [isPublishing, setIsPublishing] = useState(false);
  const bgFileRef = useRef<HTMLInputElement>(null);
  const { t, dir } = useLanguage();

  const handlePublish = async () => {
    const token = localStorage.getItem('wearurway_token');
    if (!token || !name.trim()) return;

    setIsPublishing(true);
    try {
      const API_BASE =
        import.meta.env.VITE_API_URL ||
        (window.location.hostname === 'localhost' ? 'http://localhost:3001' : '');

      const bgColorToUse = bgTab === 'color' ? bgColor : 'transparent';
      const bgImageToUse = bgTab === 'image' ? bgImage : undefined;

      let bgUrlToSave = bgColorToUse !== 'transparent' ? bgColorToUse : '';
      let uploadedBgImg = '';
      if (bgImageToUse) {
        try {
          uploadedBgImg = await uploadToImgBB(bgImageToUse);
          bgUrlToSave = uploadedBgImg;
        } catch (_) {}
      }

      const frontBase64 = await generateTshirtImage({
        layers: allLayers,
        tshirtColor,
        view: 'front',
        width: 500,
        height: 625,
        bgColor: bgColorToUse,
        bgImageBase64: bgImageToUse,
      });

      let imageUrl = '';
      try { imageUrl = await uploadToImgBB(frontBase64); } catch (_) {}

      // Append background info for Community.tsx to use on hover
      if (bgUrlToSave && imageUrl) {
        imageUrl += `|BG|${bgUrlToSave}`;
      }

      const res = await fetch(`${API_BASE}/api/designs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          tshirtColor,
          frontDesign: allLayers.filter(l => l.view === 'front'),
          backDesign: allLayers.filter(l => l.view === 'back'),
          imageUrl,
        }),
      });

      if (!res.ok) { const t = await res.text(); throw new Error(t); }
      const data = await res.json();
      onClose();
      if (data.success) {
        onSuccess('✅ تم رفع التصميم بنجاح!');
      } else {
        onError('❌ فشل النشر: ' + (data.error || 'خطأ غير معروف'));
      }
    } catch (err: any) {
      onClose();
      onError('❌ فشل النشر: ' + err.message);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9000,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%', maxWidth: 400,
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 20, padding: '28px 24px',
          fontFamily: "'Inter', sans-serif",
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
        onClick={e => e.stopPropagation()}
        dir={dir}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: 'linear-gradient(135deg, #4ade80, #22c55e)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Upload size={18} color="#000" />
            </div>
            <div>
              <p style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.12em', marginBottom: 2 }}>{t('publishModal.publishDesign')}</p>
              <h2 style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>{t('publishModal.designName')}</h2>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        {/* Name Input */}
        <label style={{ fontSize: 12, color: 'var(--text-muted)', letterSpacing: '0.08em', display: 'block', marginBottom: 8 }}>
          {t('publishModal.enterUniqueName')}
        </label>
        <input
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && name.trim()) handlePublish(); }}
          placeholder={t('publishModal.exampleName')}
          style={{
            width: '100%', padding: '14px 16px',
            fontSize: 14, fontWeight: 600,
            backgroundColor: 'var(--bg-secondary)',
            border: '1.5px solid var(--border-color)',
            borderRadius: 10, color: 'var(--text-primary)',
            outline: 'none', marginBottom: 20,
            boxSizing: 'border-box', textAlign: dir === 'rtl' ? 'right' : 'left', direction: dir,
          }}
          onFocus={e => (e.target.style.borderColor = 'var(--accent-primary)')}
          onBlur={e => (e.target.style.borderColor = 'var(--border-color)')}
        />

        {/* Background Section */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: 10 }}>
            {t('publishModal.bgCardOptional')}
          </p>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            {(['none', 'color', 'image'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setBgTab(tab)}
                style={{
                  flex: 1, padding: '8px 4px', borderRadius: 8,
                  fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  border: '1px solid var(--border-color)',
                  backgroundColor: bgTab === tab ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                  color: bgTab === tab ? '#000' : 'var(--text-muted)',
                  transition: 'all 0.15s',
                }}
              >
                {tab === 'none' ? t('publishModal.none') : tab === 'color' ? t('publishModal.color') : t('publishModal.image')}
              </button>
            ))}
          </div>

          {/* Color Picker */}
          {bgTab === 'color' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <input
                type="color"
                value={bgColor}
                onChange={e => setBgColor(e.target.value)}
                style={{ width: 44, height: 36, padding: 2, border: '1px solid var(--border-color)', borderRadius: 8, cursor: 'pointer', backgroundColor: 'transparent' }}
              />
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t('publishModal.chooseColor')}</span>
              {BG_PRESETS.map(c => (
                <div
                  key={c}
                  onClick={() => setBgColor(c)}
                  style={{
                    width: 24, height: 24, borderRadius: 6, backgroundColor: c, cursor: 'pointer', flexShrink: 0,
                    border: bgColor === c ? '2.5px solid var(--accent-primary)' : '1px solid #555',
                  }}
                />
              ))}
            </div>
          )}

          {/* Image Upload */}
          <input
            ref={bgFileRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={e => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = ev => setBgImage(ev.target?.result as string);
              reader.readAsDataURL(file);
              e.target.value = '';
            }}
          />
          {bgTab === 'image' && (
            <div>
              {bgImage ? (
                <div style={{ position: 'relative', marginTop: 4 }}>
                  <img
                    src={bgImage}
                    alt="خلفية"
                    style={{ width: '100%', height: 90, objectFit: 'cover', borderRadius: 10, border: '1px solid var(--border-color)' }}
                  />
                  <button
                    onClick={() => setBgImage(undefined)}
                    style={{ position: 'absolute', top: 6, left: 6, background: 'rgba(0,0,0,0.75)', border: 'none', color: '#fff', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >×</button>
                  <button
                    onClick={() => bgFileRef.current?.click()}
                    style={{ position: 'absolute', bottom: 6, left: 6, background: 'rgba(0,0,0,0.75)', border: 'none', color: '#fff', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}
                  >{t('publishModal.change')}</button>
                </div>
              ) : (
                <button
                  onClick={() => bgFileRef.current?.click()}
                  style={{
                    width: '100%', padding: '14px', marginTop: 4,
                    border: '1.5px dashed var(--border-color)', borderRadius: 10,
                    backgroundColor: 'var(--bg-secondary)', color: 'var(--text-muted)',
                    fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  {t('publishModal.uploadBgImage')}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '13px',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 10, fontSize: 13, fontWeight: 700,
              color: 'var(--text-muted)', cursor: 'pointer',
            }}
          >
            {t('publishModal.cancel')}
          </button>
          <button
            disabled={!name.trim() || isPublishing}
            onClick={handlePublish}
            style={{
              flex: 2, padding: '13px',
              backgroundColor: !name.trim() || isPublishing ? '#888' : '#4ade80',
              border: 'none', borderRadius: 10,
              fontSize: 13, fontWeight: 900,
              color: '#000', cursor: !name.trim() || isPublishing ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {isPublishing ? (
              <><span style={{ width: 16, height: 16, border: '2px solid #000', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} /> {t('publishModal.uploading')}</>
            ) : (
              <><Upload size={15} /> {t('publishModal.publishNow')}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
