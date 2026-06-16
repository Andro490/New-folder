import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, LayoutGrid, Star, ArrowRight } from 'lucide-react';

import { useLanguage } from '../contexts/LanguageContext';
import blackMockupBack from '../assets/black-mockup-back.png';
import whiteMockupBack from '../assets/—Pngtree—back white t shirt_13029479.png';

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

  const handleBuy = (design: Design) => {
    localStorage.setItem('wearurway_community_design_id', String(design.id));
    try {
      const front = JSON.parse(design.frontDesign || '[]');
      const back = JSON.parse(design.backDesign || '[]');
      localStorage.setItem('wearurway_layers', JSON.stringify([...front, ...back]));
    } catch(e) {}
    navigate(`/editor?color=${design.tshirtColor}&designId=${design.id}`);
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
          <h2 className="text-3xl font-bold text-[#594228]" style={{ fontFamily: "'Aref Ruqaa', serif" }}>
            {t('community.filterMenu')}
          </h2>
          <div className="w-16 h-0.5 bg-[#8b6b43]/50 mt-2"></div>
        </div>
        
        {/* Categories */}
        <div className="mb-10">
          <h3 className="flex items-center gap-2 text-[#594228] font-bold text-lg mb-4 border-b border-[#8b6b43]/20 pb-2">
            <LayoutGrid className="w-5 h-5 text-[#8b6b43]" />
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
                className={`w-full ${dir === 'rtl' ? 'text-right' : 'text-left'} px-4 py-2 rounded-md transition-all text-sm font-bold ${selectedCategory === cat.key ? 'bg-[#8b6b43]/10 text-[#594228] border-r-[3px] border-[#8b6b43]' : 'text-[#8b6b43] hover:text-[#594228] hover:bg-[#8b6b43]/5'} `}
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
          <h3 className="flex items-center gap-2 text-[#594228] font-bold text-lg mb-4 border-b border-[#8b6b43]/20 pb-2">
            <Star className="w-5 h-5 text-[#8b6b43]" />
            <span>{t('community.featuredArtists')}</span>
          </h3>
          <div className="space-y-1">
            <button 
              onClick={() => setSelectedArtist('all')}
              className={`w-full ${dir === 'rtl' ? 'text-right' : 'text-left'} px-4 py-2 rounded-md transition-all text-sm font-bold ${selectedArtist === 'all' ? 'bg-[#8b6b43]/10 text-[#594228] border-r-[3px] border-[#8b6b43]' : 'text-[#8b6b43] hover:text-[#594228] hover:bg-[#8b6b43]/5'} `}
            >
              {t('community.allArtists')}
            </button>
            {uniqueArtists.map(artist => (
              <button 
                key={artist}
                onClick={() => setSelectedArtist(artist as string)}
                className={`w-full ${dir === 'rtl' ? 'text-right' : 'text-left'} px-4 py-2 rounded-md transition-all text-sm font-bold truncate ${selectedArtist === artist ? 'bg-[#8b6b43]/10 text-[#594228] border-r-[3px] border-[#8b6b43]' : 'text-[#8b6b43] hover:text-[#594228] hover:bg-[#8b6b43]/5'} `}
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
            className="absolute px-4 py-2 rounded-xl text-[#8b6b43] hover:text-[#594228] transition-colors flex items-center gap-2 group z-50"
            style={{
              [dir === 'rtl' ? 'left' : 'right']: '16px',
              top: '16px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              boxShadow: '0 4px 15px rgba(139, 107, 67, 0.1)',
            }}
          >
            <ArrowRight
              className={`w-4 h-4 group-hover:-translate-x-1 transition-transform ${dir === 'rtl' ? 'rotate-180' : ''}`}
            />
            <span className="text-sm font-bold tracking-wider">{dir === 'rtl' ? 'العودة' : 'Back'}</span>
          </button>

          <div className="flex flex-col items-center mt-2 relative z-10">
            {/* PS Logo */}
            <div
              className="w-12 h-10 flex items-center justify-center border-[2px] border-[#8b6b43] mb-3 rounded-sm shadow-sm"
              style={{ backgroundColor: 'var(--bg-card)' }}
            >
              <span className="font-serif text-lg font-bold text-[#594228]">PS</span>
            </div>
            <h1
              className="text-4xl md:text-5xl font-bold text-[#1a0e06] mb-2 drop-shadow-sm text-center"
              style={{ fontFamily: "'Aref Ruqaa', serif" }}
            >
              {t('community.title')}
            </h1>
            <p className="text-[#4a3b2c] text-sm md:text-base font-semibold text-center">
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
            <div className="text-center py-20 text-[#8b6b43] font-bold text-lg">
              {t('community.noDesigns')}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 sm:gap-12 pt-8 w-full">
              {filteredDesigns.map(design => {
                // Parse back design layers for hover reveal
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

                return (
                  <div
                    key={design.id}
                    className="group relative flex flex-col rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(139,107,67,0.2)] border border-[#d4ba7b]/40"
                    style={{ backgroundColor: 'var(--bg-card)', boxShadow: '0 8px 30px rgba(139,107,67,0.08)' }}
                  >
                    {/* Image Area */}
                    <div className="relative w-full aspect-[4/5] flex items-center justify-center p-6 bg-transparent overflow-hidden">
                      {/* Front image */}
                      <div className={`absolute inset-0 flex items-center justify-center p-6 transition-opacity duration-500 ${hasBackDesign ? 'group-hover:opacity-0' : ''}`}>
                        {design.imageUrl ? (
                          <img
                            src={design.imageUrl}
                            alt={design.name}
                            className="w-full h-full object-contain drop-shadow-2xl transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <span className="text-[#8b6b43]/50 font-bold text-sm">{t('community.noImage')}</span>
                        )}
                      </div>

                      {/* Back image — revealed on hover */}
                      {hasBackDesign && (
                        <div className="absolute inset-0 flex items-center justify-center p-6 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                          <div 
                            className="relative flex items-center justify-center" 
                            style={{ 
                              width: '100%', 
                              height: '100%', 
                              aspectRatio: '500/600',
                              maxWidth: '100%',
                              maxHeight: '100%'
                            }}
                          >
                            <img
                              src={backMockup}
                              alt="Back"
                              className="absolute inset-0 w-full h-full object-contain drop-shadow-2xl transition-transform duration-500 group-hover:scale-105"
                            />
                            {/* Layer Container with same scale as image */}
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
                      )}
                    </div>

                    {/* Info */}
                    <div className="px-5 pt-2 pb-4 flex flex-col items-end">
                      <h3
                        className="font-bold text-base text-[#1a0e06] truncate text-right w-full mb-1"
                        style={{ fontFamily: "'Cairo', sans-serif" }}
                      >
                        {design.name}
                      </h3>
                      <p
                        className="text-xs text-[#8b6b43] text-right font-semibold truncate w-full"
                      >
                        {t('community.designedBy')} <span className="text-[#1a0e06] font-bold">
                          {design.user.name || t('community.unknownArtist')}
                        </span>
                      </p>
                    </div>

                    {/* Buy Button */}
                    <button
                      onClick={() => handleBuy(design)}
                      className="w-full py-3.5 flex items-center justify-center gap-2 font-bold text-sm transition-all duration-200 mt-auto"
                      style={{
                        backgroundColor: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                        borderTop: '1px solid var(--border-color)',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                        e.currentTarget.style.color = '#1a0e06';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.backgroundColor = 'var(--bg-primary)';
                        e.currentTarget.style.color = 'var(--text-primary)';
                      }}
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>{t('community.buyDesign')}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* ── Sidebar ─────────────────────────────────────── */}
      {renderSidebar(false)}
    </div>
  );
}
