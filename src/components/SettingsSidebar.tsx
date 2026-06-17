import React, { useState, useRef, useCallback } from 'react';
import { DesignLayer, TShirtColor, TShirtView } from '../types';
import { Image as ImageIcon, Link as LinkIcon, Type, Save, CheckCircle, ZoomIn, ZoomOut } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { PRINT_AREA } from '../utils/tshirtSvg';

// Modals
import OrderModal from './modals/OrderModal';
import PinterestModal from './modals/PinterestModal';
import TextModal from './modals/TextModal';
import PublishModal from './modals/PublishModal';
import { useLanguage } from '../contexts/LanguageContext';

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

export default function SettingsSidebar({
  view,
  tshirtColor,
  onAddLayer,
  mockupScale,
  setMockupScale,
  onSaveDesign,
  allLayers,
}: SettingsSidebarProps) {
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showTextModal, setShowTextModal] = useState(false);
  const [showPinterestModal, setShowPinterestModal] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishToast, setPublishToast] = useState<string | null>(null);
  const [designUrl, setDesignUrl] = useState('');
  const { t, dir } = useLanguage();
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = useCallback((msg: string) => {
    setPublishToast(msg);
    setTimeout(() => setPublishToast(null), 3500);
  }, []);

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
        className="flex flex-col shrink-0 overflow-y-auto w-full lg:w-[288px] lg:min-w-[288px] h-auto lg:h-full border-t lg:border-t-0"
        style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', borderLeft: '1px solid var(--border-color)' }}
        dir={dir}
      >
        {/* ─── Section 1: إعدادات ─── */}
        <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)' }}>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20, textAlign: dir === 'rtl' ? 'right' : 'left' }}>
            {t('editor.settings')}
          </p>

          {/* Row: منتج */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 13, color: '#555' }}>{t('editor.product')}</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{t('editor.tshirt')}</span>
          </div>

          {/* Row: ملائم */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 13, color: '#555' }}>{t('editor.fit')}</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{t('editor.regularFit')}</span>
          </div>

          {/* Row: لون */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: '#555' }}>{t('editor.color')}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                {tshirtColor === 'black' ? t('editor.black')
                  : tshirtColor === 'white' ? t('editor.white')
                    : tshirtColor === 'navy' ? t('editor.navy')
                      : tshirtColor === 'red' ? t('editor.red') : t('editor.gray')}
              </span>
              <div style={{
                width: 14, height: 14,
                backgroundColor:
                  tshirtColor === 'black' ? '#111'
                    : tshirtColor === 'white' ? '#f0f0f0'
                      : tshirtColor === 'navy' ? '#1e3a5f'
                        : tshirtColor === 'red' ? '#c0392b' : '#888',
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
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              width: '100%',
              padding: '16px 0',
              backgroundColor: 'var(--accent-primary)',
              color: '#0d0d0d',
              fontWeight: 900,
              fontSize: 15,
              borderRadius: 12,
              boxShadow: '0 4px 15px rgba(245, 200, 66, 0.2)',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(245, 200, 66, 0.3)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(245, 200, 66, 0.2)'; }}
          >
            <CheckCircle size={18} />
            {t('editor.completeOrder')}
          </button>
        </div>

        {/* ─── Section 3: أدوات ─── */}
        <div style={{ padding: '24px', borderBottom: '1px solid #1a1a1a' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#aaa', marginBottom: 20, textAlign: dir === 'rtl' ? 'right' : 'left', display: 'flex', alignItems: 'center', gap: 8 }}>
            {t('editor.designTools')}
          </p>

          <div style={{ display: 'grid', gap: 12, marginBottom: 24 }}>
            {/* إضافة صورة */}
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 18px',
                fontSize: 14, fontWeight: 600, color: 'var(--text-primary)',
                backgroundColor: 'var(--bg-card)',
                borderRadius: 10,
                border: '1px solid var(--border-color)',
                cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'; e.currentTarget.style.borderColor = 'var(--accent-primary)'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--bg-card)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
            >
              <span>{t('editor.uploadImage')}</span>
              <ImageIcon size={18} color="var(--accent-primary)" />
            </button>

            {/* إضافة رابط Pinterest */}
            <button
              onClick={() => setShowPinterestModal(true)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 18px',
                fontSize: 14, fontWeight: 600, color: 'var(--text-primary)',
                backgroundColor: 'var(--bg-card)',
                borderRadius: 10,
                border: '1px solid var(--border-color)',
                cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'; e.currentTarget.style.borderColor = 'var(--accent-primary)'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--bg-card)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
            >
              <span>{t('editor.addPinterest')}</span>
              <LinkIcon size={18} color="#e60023" />
            </button>

            {/* أضف نصًا */}
            <button
              onClick={() => setShowTextModal(true)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 18px',
                fontSize: 14, fontWeight: 600, color: 'var(--text-primary)',
                backgroundColor: 'var(--bg-card)',
                borderRadius: 10,
                border: '1px solid var(--border-color)',
                cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'; e.currentTarget.style.borderColor = 'var(--accent-primary)'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--bg-card)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
            >
              <span>{t('editor.addText')}</span>
              <Type size={18} color="#4ade80" />
            </button>
          </div>

          {/* حجم النموذج الأولي */}
          <div style={{ backgroundColor: 'var(--bg-secondary)', padding: 16, borderRadius: 12, border: '1px solid var(--border-color)', marginBottom: 20 }}>
            <p style={{ fontSize: 12, color: '#888', marginBottom: 12, textAlign: 'center' }}>
              {t('editor.designPreview')}
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setMockupScale(s => Math.max(0.5, s - 0.1))}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  flex: 1, padding: '12px 0',
                  fontSize: 13, fontWeight: 600, color: 'var(--text-primary)',
                  backgroundColor: 'var(--bg-tertiary)', borderRadius: 8, border: '1px solid var(--border-color)',
                  cursor: 'pointer', transition: 'all 0.2s'
                }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-card)')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)')}
              >
                <ZoomOut size={16} color="#aaa" /> {t('editor.zoomOut')}
              </button>
              <button
                onClick={() => setMockupScale(s => Math.min(2, s + 0.1))}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  flex: 1, padding: '12px 0',
                  fontSize: 13, fontWeight: 600, color: 'var(--text-primary)',
                  backgroundColor: 'var(--bg-tertiary)', borderRadius: 8, border: '1px solid var(--border-color)',
                  cursor: 'pointer', transition: 'all 0.2s'
                }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#222')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#161616')}
              >
                <ZoomIn size={16} color="#aaa" /> {t('editor.zoomIn')}
              </button>
            </div>
          </div>

          <button
            onClick={onSaveDesign}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              width: '100%',
              padding: '14px 16px',
              fontSize: 13, fontWeight: 700, color: 'var(--text-primary)',
              backgroundColor: 'var(--bg-card)', 
              borderRadius: 10,
              border: '1px solid var(--border-color)',
              cursor: 'pointer', transition: 'all 0.2s',
              marginBottom: '10px'
            }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'; e.currentTarget.style.borderColor = 'var(--accent-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--bg-card)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
          >
            <Save size={16} />
            {t('editor.saveChanges')}
          </button>
          
          <button
            onClick={() => {
              const token = localStorage.getItem('wearurway_token');
              if (!token) {
                showToast(t('editor.loginFirst'));
                return;
              }
              setShowPublishModal(true);
            }}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              width: '100%',
              padding: '14px 16px',
              fontSize: 13, fontWeight: 700, color: '#000',
              backgroundColor: '#4ade80', 
              borderRadius: 10,
              border: 'none',
              cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            {t('editor.publishSale')}
          </button>
        </div>

        {/* ─── Empty bottom ─── */}
        <div style={{ height: '80px', backgroundColor: '#050505' }} />
      </aside>

      {/* Render Modals */}
      {showOrderModal && (
        <OrderModal
          onClose={() => setShowOrderModal(false)}
          tshirtColor={tshirtColor}
          allLayers={allLayers}
          designLink={designUrl}
        />
      )}
      
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

      {showPublishModal && (
        <PublishModal
          onClose={() => setShowPublishModal(false)}
          tshirtColor={tshirtColor}
          allLayers={allLayers}
          onSuccess={showToast}
          onError={showToast}
        />
      )}

      {/* ── Toast Notification ── */}
      {publishToast && (
        <div
          style={{
            position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
            zIndex: 9999, backgroundColor: '#1a2e1a', color: '#4ade80',
            border: '1px solid #4ade80', borderRadius: 12,
            padding: '12px 24px', fontSize: 14, fontWeight: 700,
            boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', gap: 10,
            animation: 'fadeInDown 0.3s ease',
            whiteSpace: 'nowrap',
          }}
        >
          <CheckCircle size={18} />
          {publishToast}
        </div>
      )}
    </>
  );
}
