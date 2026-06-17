import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, LayoutGrid, Star, ArrowRight } from 'lucide-react';

import { useLanguage } from '../contexts/LanguageContext';
import OrderModal from '../components/modals/OrderModal';
import blackMockupBack from '../assets/black-mockup-back.png';
import whiteMockupBack from '../assets/—Pngtree—back white t shirt_13029479.png';
import logoImg from '../assets/favicon.png';
import darkLogoImg from '../assets/darkk.png';

interface Design {
  id: number;
  name: string;
  tshirtColor: string;
  imageUrl: string | null;
  frontDesign: string;
  backDesign: string;
  purchases: number;
  user: {
    name: string;
    affiliateCode: string;
  };
}

// ── DesignCard with swipe (mobile) + hover (desktop) ──────────────
function DesignCard({ design, onBuy }: { design: Design; onBuy: (d: Design) => void }) {
  const [showBack, setShowBack] = useState(false);
  const touchStartX = useRef<number | null>(null);

  // Extract front image and background
  const [frontImgUrl, bgVal] = (design.imageUrl || '').split('|BG|');
  const isBgImage = bgVal && bgVal.startsWith('http');
  const isBgColor = bgVal && bgVal.startsWith('#');

  let backLayers: any[] = [];
  let hasBackDesign = false;
  try {
    const parsed = JSON.parse(design.backDesign || '[]');
    if (Array.isArray(parsed) && parsed.length > 0) {
      backLayers = parsed.filter((l: any) => l.imageUrl);
      hasBackDesign = backLayers.length > 0;
    }
  } catch(e) {}

  const backMockup = design.tshirtColor === 'white' ? whiteMockupBack : blackMockupBack;

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!hasBackDesign) return;
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!hasBackDesign || touchStartX.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(deltaX) > 40) {
      setShowBack(prev => !prev);
    }
    touchStartX.current = null;
  };

  return (
    <div
      className="group relative flex flex-col rounded-2xl overflow-hidden transition-all duration-300 border border-[#d4ba7b]/40"
      style={{
        backgroundColor: 'var(--bg-card)',
        boxShadow: '0 8px 30px rgba(139,107,67,0.08)',
        transform: 'translateY(0)',
        transition: 'transform 0.3s, box-shadow 0.3s',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 40px rgba(139,107,67,0.2)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 30px rgba(139,107,67,0.08)';
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Swipe hint badge — mobile only */}
      {hasBackDesign && (
        <div
          className="absolute top-3 left-3 z-20 text-[10px] font-bold px-2 py-1 rounded-full sm:hidden"
          style={{ backgroundColor: 'rgba(139,107,67,0.85)', color: '#fff8e8', backdropFilter: 'blur(4px)' }}
        >
          ← اسحب للضهر
        </div>
      )}

      {/* Image Area */}
      <div className="relative w-full aspect-[4/5] flex items-center justify-center bg-transparent overflow-hidden">
        
        {/* Front image */}
        <div
          className={`absolute inset-0 flex items-center justify-center transition-opacity duration-500 ${hasBackDesign && showBack ? 'opacity-0' : 'opacity-100'} ${hasBackDesign ? 'lg:group-hover:opacity-0' : ''}`}
        >
          {frontImgUrl ? (
            <img
              src={frontImgUrl}
              alt={design.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <span className="text-[#8b6b43]/50 font-bold text-sm">لا توجد صورة</span>
          )}
        </div>

        {/* Back image — desktop: hover | mobile: swipe */}
        {hasBackDesign && (
          <div
            className={`absolute inset-0 transition-opacity duration-500 opacity-0 lg:group-hover:opacity-100 ${showBack ? '!opacity-100' : ''}`}
            style={{ backgroundColor: isBgColor ? bgVal : 'transparent' }}
          >
            {/* Background Image for Back View */}
            {isBgImage && (
              <img src={bgVal} alt="Background" className="absolute inset-0 w-full h-full object-cover" />
            )}

            {/* Back Mockup & Layers */}
            <div className="absolute inset-0 flex items-center justify-center p-6">
              <div
                className="relative flex items-center justify-center"
                style={{ width: '100%', height: '100%', aspectRatio: '500/600', maxWidth: '100%', maxHeight: '100%' }}
              >
                <img
                  src={backMockup}
                  alt="Back"
                  className="absolute inset-0 w-full h-full object-contain drop-shadow-2xl transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 w-full h-full pointer-events-none transition-transform duration-500 group-hover:scale-105">
                  {backLayers.map((layer: any, idx: number) => (
                    <img
                      key={idx}
                      src={layer.imageUrl}
                      className="absolute z-10"
                      style={{
                        left: `${(layer.x / 500) * 100}%`,
                        top: `${(layer.y / 600) * 100}%`,
                        width: `${(layer.width / 500) * 100}%`,
                        height: `${(layer.height / 600) * 100}%`,
                        transform: `rotate(${layer.rotation || 0}deg)`,
                        opacity: layer.opacity ?? 1,
                        pointerEvents: 'none',
                      }}
                      alt="layer"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="px-5 pt-2 pb-4 flex flex-col items-end">
        <h3
          className="font-bold text-base truncate text-right w-full mb-1"
          style={{ fontFamily: "'Cairo', sans-serif", color: 'var(--text-primary)' }}
        >
          {design.name}
        </h3>
        <p className="text-xs text-right font-semibold truncate w-full" style={{ color: 'var(--text-secondary)' }}>
          من تصميم: <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{design.user.name || 'فنان مجهول'}</span>
        </p>
      </div>

      {/* Buy Button */}
      <button
        onClick={() => onBuy(design)}
        className="w-full py-3.5 flex items-center justify-center gap-2 font-bold text-sm transition-all duration-200 mt-auto"
        style={{
          backgroundColor: 'var(--bg-primary)',
          color: 'var(--text-primary)',
          borderTop: '1px solid var(--border-color)',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
          e.currentTarget.style.color = 'var(--text-primary)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.backgroundColor = 'var(--bg-primary)';
          e.currentTarget.style.color = 'var(--text-primary)';
        }}
      >
        <ShoppingCart className="w-4 h-4" />
        <span>شراء التصميم</span>
      </button>
    </div>
  );
}



interface Design {
  id: number;
  name: string;
  tshirtColor: string;
  imageUrl: string | null;
  frontDesign: string;
  backDesign: string;
  purchases: number;
  user: {
    name: string;
    affiliateCode: string;
  };
}

export default function Community() {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedArtist, setSelectedArtist] = useState<string>('all');
  const navigate = useNavigate();
  const { t, dir } = useLanguage();

  const [isDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || document.documentElement.classList.contains('dark');
  });

  useEffect(() => {
    const API_BASE = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:3001' : '');

    fetch(`${API_BASE}/api/designs`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setDesigns(data.designs);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const [buyingDesign, setBuyingDesign] = useState<Design | null>(null);

  const handleBuy = (design: Design) => {
    localStorage.setItem('wearurway_community_design_id', String(design.id));
    try {
      const front = JSON.parse(design.frontDesign || '[]');
      const back = JSON.parse(design.backDesign || '[]');
      localStorage.setItem('wearurway_layers', JSON.stringify([...front, ...back]));
    } catch(e) {}
    // Show OrderModal directly instead of navigating to editor
    setBuyingDesign(design);
  };

  const uniqueArtists = Array.from(new Set(designs.map(d => d.user.name || t('community.unknownArtist'))));

  const filteredDesigns = designs.filter(design => {
    if (selectedCategory === 'hoodies') return false;
    if (selectedArtist !== 'all') {
      if ((design.user.name || t('community.unknownArtist')) !== selectedArtist) return false;
    }
    return true;
  });

  const renderSidebar = (isMobile: boolean) => (
    <aside className={isMobile 
      ? "w-full flex flex-col lg:hidden z-20 relative pt-4 pb-8 mb-4 border-b border-[#8b6b43]/30" 
      : "hidden lg:flex w-[280px] flex-col h-screen sticky top-0 shrink-0 z-20 relative overflow-y-auto custom-scrollbar pt-12 px-4 pr-4 border-r border-[#8b6b43]/30"}>
      <div className="relative z-10 w-full max-w-sm mx-auto lg:max-w-none">

        <div className="flex flex-col items-center mb-10">
          <h2 className="text-3xl font-bold" style={{ fontFamily: "'Aref Ruqaa', serif", color: 'var(--text-primary)' }}>
            {t('community.filterMenu')}
          </h2>
          <div className="w-16 h-0.5 bg-[#8b6b43]/50 mt-2"></div>
        </div>
        
        {/* Categories */}
        <div className="mb-10">
          <h3 className="flex items-center gap-2 font-bold text-lg mb-4 border-b pb-2" style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}>
            <LayoutGrid className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
            <span>{t('community.categories')}</span>
          </h3>
          <div className="space-y-1">
            {[
              { key: 'all', label: t('community.all') },
              { key: 'tshirts', label: t('community.tshirts') },
            ].map(cat => (
              <button 
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`w-full ${dir === 'rtl' ? 'text-right' : 'text-left'} px-4 py-2 rounded-md transition-all text-sm font-bold`}
                style={{ 
                  backgroundColor: selectedCategory === cat.key ? 'var(--accent-glow)' : 'transparent',
                  color: selectedCategory === cat.key ? 'var(--text-primary)' : 'var(--text-secondary)',
                  borderRight: selectedCategory === cat.key ? '3px solid var(--accent-primary)' : 'none'
                }}
              >
                {cat.label}
              </button>
            ))}
            <button 
              disabled
              className={`w-full ${dir === 'rtl' ? 'text-right' : 'text-left'} px-4 py-2 rounded-md transition-all text-sm font-bold text-[#8b6b43] opacity-40 cursor-not-allowed`}
            >
              {t('community.hoodies')}
            </button>
          </div>
        </div>

        {/* Featured Artists */}
        <div>
          <h3 className="flex items-center gap-2 font-bold text-lg mb-4 border-b pb-2" style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}>
            <Star className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
            <span>{t('community.featuredArtists')}</span>
          </h3>
          <div className="space-y-1">
            <button 
              onClick={() => setSelectedArtist('all')}
              className={`w-full ${dir === 'rtl' ? 'text-right' : 'text-left'} px-4 py-2 rounded-md transition-all text-sm font-bold`}
              style={{ 
                backgroundColor: selectedArtist === 'all' ? 'var(--accent-glow)' : 'transparent',
                color: selectedArtist === 'all' ? 'var(--text-primary)' : 'var(--text-secondary)',
                borderRight: selectedArtist === 'all' ? '3px solid var(--accent-primary)' : 'none'
              }}
            >
              {t('community.allArtists')}
            </button>
            {uniqueArtists.map(artist => (
              <button 
                key={artist}
                onClick={() => setSelectedArtist(artist as string)}
                className={`w-full ${dir === 'rtl' ? 'text-right' : 'text-left'} px-4 py-2 rounded-md transition-all text-sm font-bold truncate`}
                style={{ 
                  backgroundColor: selectedArtist === artist ? 'var(--accent-glow)' : 'transparent',
                  color: selectedArtist === artist ? 'var(--text-primary)' : 'var(--text-secondary)',
                  borderRight: selectedArtist === artist ? '3px solid var(--accent-primary)' : 'none'
                }}
              >
                {artist}
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="flex flex-col lg:flex-row min-h-screen relative" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }} dir={dir}>
      {/* Vintage Paper Texture Overlay */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/old-wall.png")' }}></div>

      {/* ── Main Content Area ─────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-screen overflow-y-auto relative z-10 custom-scrollbar p-4 md:p-8">

        {/* Header */}
        <header className="relative pt-10 pb-12 flex flex-col items-center justify-center">
          <button
            onClick={() => navigate('/')}
            className="absolute rounded-xl text-[#8b6b43] hover:text-[#594228] transition-colors flex items-center gap-2 group z-50"
            style={{
              [dir === 'rtl' ? 'left' : 'right']: '16px',
              top: '16px',
              padding: '10px 20px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              boxShadow: '0 4px 15px rgba(139, 107, 67, 0.1)',
            }}
          >
            <ArrowRight
              className={`w-4 h-4 group-hover:-translate-x-1 transition-transform ${dir === 'rtl' ? 'rotate-180' : ''}`}
            />
            <span style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '0.05em' }}>{dir === 'rtl' ? 'العودة' : 'Back'}</span>
          </button>

          <div className="flex flex-col items-center mt-2 relative z-10">
            {/* Brand Logo */}
            <img
              src={isDarkMode ? darkLogoImg : logoImg}
              alt="PrintStudio Logo"
              className="w-16 h-16 object-contain mb-3 rounded-xl"
              style={{ filter: 'drop-shadow(0 4px 12px rgba(139,107,67,0.4))' }}
            />
            <h1
              className="text-4xl md:text-5xl font-bold mb-2 drop-shadow-sm text-center"
              style={{ fontFamily: "'Aref Ruqaa', serif", color: 'var(--text-primary)' }}
            >
              {t('community.title')}
            </h1>
            <p className="text-sm md:text-base font-semibold text-center" style={{ color: 'var(--text-secondary)' }}>
              {t('community.subtitle')}
            </p>
          </div>
        </header>

        {/* Mobile Sidebar */}
        {renderSidebar(true)}

        {/* Grid */}
        <main className="flex-1 pb-12 w-full max-w-7xl mx-auto" style={{ paddingLeft: '2rem', paddingRight: '2rem' }}>
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-10 h-10 border-4 border-[#8b6b43] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredDesigns.length === 0 ? (
            <div className="text-center py-20 font-bold text-lg" style={{ color: 'var(--text-secondary)' }}>
              {t('community.noDesigns')}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 sm:gap-12 pt-8 w-full">
              {filteredDesigns.map(design => (
                <DesignCard key={design.id} design={design} onBuy={handleBuy} />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* ── Sidebar ─────────────────────────────────────── */}
      {renderSidebar(false)}

      {/* ── Buy Modal (Size + Checkout) ───────────────── */}
      {buyingDesign && (
        <OrderModal
          onClose={() => setBuyingDesign(null)}
          tshirtColor={buyingDesign.tshirtColor as any}
          allLayers={(() => {
            try {
              const front = JSON.parse(buyingDesign.frontDesign || '[]');
              const back = JSON.parse(buyingDesign.backDesign || '[]');
              return [...front, ...back];
            } catch { return []; }
          })()}
          designLink={buyingDesign.imageUrl || ''}
        />
      )}
    </div>
  );
}
