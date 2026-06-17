import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Community from './pages/Community';
import AdminDashboard from './pages/AdminDashboard';
import GoogleSuccess from './pages/GoogleSuccess';
import Canvas from './components/Canvas';
import LayerSidebar from './components/LayerSidebar';
import SettingsSidebar from './components/SettingsSidebar';
import Navbar from './components/Navbar';
import { useLanguage } from './contexts/LanguageContext';
import { appConfig } from './config';
import { DesignLayer, TShirtColor, TShirtView } from './types';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './utils/tshirtSvg';
import { Layers, Sparkles, Zap, Paintbrush } from 'lucide-react';

import blackMockupFront from './assets/black-mockup.png';
import blackMockupBack from './assets/black-mockup-back.png';
import whiteMockupFront from './assets/—Pngtree—white t shirt mockup realistic_13020297.png';
import whiteMockupBack from './assets/—Pngtree—back white t shirt_13029479.png';
import pantImg from './assets/pant.png';
import hodyImg from './assets/hody.png';
import boxyFitImg from './assets/boxy-fit.png';
import oversizeImg from './assets/oversize.png';
import regularFitImg from './assets/reugulert.png';

function Editor() {
  const { t } = useLanguage();
  const [layers, setLayers] = useState<DesignLayer[]>(() => {
    const saved = localStorage.getItem('wearurway_layers');
    if (saved) {
      try { 
        const parsed: DesignLayer[] = JSON.parse(saved);
        // Blob URLs expire on refresh, so we fallback to the uploaded ImgBB URL if available
        return parsed.map(layer => {
          if (layer.imageUrl.startsWith('blob:')) {
            // If it's an old text layer saved as blob, regenerate it using textProps!
            if (layer.textProps) {
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d')!;
              const { text, font, color } = layer.textProps;
              const weight = font.includes('bold') ? 'bold' : 'normal';
              const fontSize = 150; // default large size used in modal
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
              
              return { ...layer, imageUrl: canvas.toDataURL('image/png') };
            }
            // Otherwise fallback to pinterestUrl for images
            if (layer.pinterestUrl && layer.pinterestUrl.startsWith('http')) {
              return { ...layer, imageUrl: layer.pinterestUrl };
            }
          }
          return layer;
        });
      } catch (e) {}
    }
    return [];
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [view, setView] = useState<TShirtView>('front');
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialColor = (searchParams.get('color') as TShirtColor) || 'black';

  const [tshirtColor, setTshirtColor] = useState<TShirtColor>(initialColor);

  useEffect(() => {
    setTshirtColor(initialColor);
  }, [initialColor]);

  // Layer CRUD
  const handleAddLayer = useCallback((layer: DesignLayer) => {
    setLayers((prev) => [...prev, layer]);
    setSelectedId(layer.id);
  }, []);

  const handleRemoveLayer = useCallback((id: string) => {
    setLayers((prev) => prev.filter((l) => l.id !== id));
    setSelectedId((sel) => (sel === id ? null : sel));
  }, []);

  const handleUpdateLayer = useCallback((id: string, attrs: Partial<DesignLayer>) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...attrs } : l))
    );
  }, []);

  const handleReorder = useCallback((fromIndex: number, toIndex: number) => {
    setLayers((prev) => {
      const arr = [...prev];
      const viewLayers = arr.filter(l => l.view === view);
      const [item] = viewLayers.splice(fromIndex, 1);
      viewLayers.splice(toIndex, 0, item);
      
      const otherLayers = arr.filter(l => l.view !== view);
      return [...otherLayers, ...viewLayers];
    });
  }, [view]);

  const handleSaveDesign = useCallback(() => {
    localStorage.setItem('wearurway_layers', JSON.stringify(layers));
    alert('تم حفظ التصميم بنجاح! سيتم استرجاعه عند العودة.');
  }, [layers]);

  // Export canvas as PNG
  const handleExport = useCallback(() => {
    const stage = document.querySelector('canvas');
    if (!stage) return;
    const link = document.createElement('a');
    link.download = `tshirt-design-${view}.png`;
    link.href = stage.toDataURL('image/png');
    link.click();
  }, [view]);

  const selectedLayer = layers.find((l) => l.id === selectedId) ?? null;

  const [historyIndex, setHistoryIndex] = useState(-1);
  const [mockupScale, setMockupScale] = useState(1);

  return (
    <div
      className="flex flex-col"
      style={{ overflow: 'hidden', height: '100dvh' }}
    >
      {/* Top Bar - replaced with shared Navbar */}
      <Navbar />

      {/* Sub-bar: Editor status */}
      <div
        className="flex items-center justify-between px-6 h-9 shrink-0"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-color)',
          zIndex: 40,
        }}
      >
        {/* Left: view badge */}
        <span
          className="px-6 py-2 rounded-full text-xs font-black tracking-[0.2em] shadow-sm hidden sm:block"
          style={{
            background: 'var(--accent-glow)',
            color: 'var(--accent-secondary)',
            border: '1px solid var(--border-color)',
          }}
        >
          {view === 'front' ? t('home.front') : t('home.back')} VIEW
        </span>

        {/* Center: layers */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <Layers size={11} color="var(--text-muted)" />
            <span className="text-[10px] font-medium tracking-[0.1em] uppercase" style={{ color: 'var(--text-muted)' }}>
              {layers.length} Layer{layers.length !== 1 ? 's' : ''}
            </span>
          </div>
          {selectedLayer && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--accent-primary)' }}>
              <Sparkles size={11} color="var(--accent-primary)" />
              <span className="text-[10px] font-bold tracking-[0.1em] uppercase truncate max-w-[100px]" style={{ color: 'var(--accent-secondary)' }}>
                {selectedLayer.name}
              </span>
            </div>
          )}
        </div>

        {/* Right: platform tag */}
        <span className="text-[10px] font-bold tracking-[0.2em] uppercase hidden md:block" style={{ color: 'var(--text-muted)' }}>
          Platform Design
        </span>
      </div>

      {/* Main Layout */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-y-auto lg:overflow-hidden overflow-x-hidden">
        <LayerSidebar
          layers={layers.filter(l => l.view === view)}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onAdd={handleAddLayer}
          onRemove={handleRemoveLayer}
          onUpdate={handleUpdateLayer}
          onReorder={handleReorder}
          view={view}
        />

        {/* Golden left divider */}
        <div
          className="hidden lg:block w-[2px] shrink-0 self-stretch"
          style={{
            background: 'linear-gradient(to bottom, transparent, #c8a85a 15%, #b1894d 50%, #c8a85a 85%, transparent)',
            boxShadow: '0 0 8px rgba(200, 168, 90, 0.5)',
          }}
        />

        <main
          className="flex-1 relative flex items-center justify-center overflow-hidden min-h-[500px] lg:min-h-0"
          style={{
            backgroundImage: 'radial-gradient(rgba(139, 107, 67, 0.15) 1px, transparent 1px)',
            backgroundSize: '30px 30px',
            backgroundColor: 'transparent'
          }}
        >

          <div className="absolute top-8 z-20 flex rounded-full overflow-hidden border-2" style={{ borderColor: 'var(--border-color)', boxShadow: '0 4px 15px rgba(139, 107, 67, 0.1)' }}>
            <button
              className="text-sm font-bold tracking-[0.15em] transition-colors"
              style={{
                padding: '10px 40px',
                backgroundColor: view === 'front' ? 'var(--accent-primary)' : 'var(--bg-card)',
                color: view === 'front' ? '#f9f4e6' : 'var(--text-secondary)',
              }}
              onClick={() => setView('front')}
            >
              {t('home.front')}
            </button>
            <div style={{ width: 1, backgroundColor: 'var(--border-color)' }} />
            <button
              className="text-sm font-bold tracking-[0.15em] transition-colors"
              style={{
                padding: '10px 40px',
                backgroundColor: view === 'back' ? 'var(--accent-primary)' : 'var(--bg-card)',
                color: view === 'back' ? '#f9f4e6' : 'var(--text-secondary)',
              }}
              onClick={() => setView('back')}
            >
              {t('home.back')}
            </button>
          </div>

          <div
            className="relative z-10 flex items-center justify-center w-full h-full max-w-full overflow-hidden"
          >
            <div
              style={{
                transform: `scale(${mockupScale})`,
                transformOrigin: 'center center',
                transition: 'transform 0.15s ease',
              }}
            >
              <Canvas
                layers={layers.filter(l => l.view === view)}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onLayerChange={handleUpdateLayer}
                tshirtColor={tshirtColor}
                view={view}
              />
            </div>
          </div>

            {layers.filter(l => l.view === view).length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div 
                  className={`px-8 py-5 rounded-2xl border-2 border-dashed backdrop-blur-sm transition-colors ${
                    tshirtColor === 'white' 
                      ? 'border-gray-400/50 text-gray-800 bg-white/30' 
                      : 'border-gray-500/50 text-gray-200 bg-black/30'
                  }`}
                >
                  <p className="text-[16px] font-bold tracking-wide">
                    يمكنك الآن إضافة تصميمك هنا
                  </p>
                </div>
              </div>
            )}
        </main>

        {/* Golden right divider */}
        <div
          className="hidden lg:block w-[2px] shrink-0 self-stretch"
          style={{
            background: 'linear-gradient(to bottom, transparent, #c8a85a 15%, #b1894d 50%, #c8a85a 85%, transparent)',
            boxShadow: '0 0 8px rgba(200, 168, 90, 0.5)',
          }}
        />

        <SettingsSidebar
          view={view}
          onViewChange={setView}
          tshirtColor={tshirtColor}
          onColorChange={setTshirtColor}
          selectedLayer={selectedLayer}
          onLayerUpdate={handleUpdateLayer}
          onLayerRemove={handleRemoveLayer}
          onExport={handleExport}
          onAddLayer={handleAddLayer}
          mockupScale={mockupScale}
          setMockupScale={setMockupScale}
          onSaveDesign={handleSaveDesign}
          allLayers={layers}
        />
      </div>
    </div>
  );
}

function ProductStep() {
  const navigate = useNavigate();
  const { t, dir, language } = useLanguage();
  return (
    <div className="flex-1 min-h-screen flex flex-col font-['Inter']" style={{ color: 'var(--text-primary)' }}>
      <Navbar />
      
      {/* Banner */}
      <div 
        className="w-full py-5 flex flex-col items-center justify-center relative overflow-hidden mt-2"
        style={{ 
          background: 'linear-gradient(rgba(70, 50, 30, 0.9), rgba(50, 35, 20, 0.9))',
          boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
        }}
      >
        {/* Subtle wood texture effect via repeating gradient */}
        <div className="absolute inset-0 opacity-20 mix-blend-overlay" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.2) 2px, rgba(0,0,0,0.2) 4px)' }}></div>
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-wider text-[#f3ebd2] z-10 text-center" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>{t('home.selectProduct')}</h1>
        <p className="text-sm mt-2 text-[#d4c3a3] z-10 text-center">.{t('home.chooseCanvas')}</p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-start px-4 py-12">
        <div className="w-full max-w-5xl md:px-10">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-5">
            {/* T-SHIRT (Active) */}
            <div className="flex flex-col items-center">
              <h2 className="text-3xl font-black mb-4 uppercase" style={{ color: 'var(--text-primary)' }}>
                {language === 'ar' ? appConfig.products.tshirt.nameAr : appConfig.products.tshirt.nameEn}
              </h2>
              <div 
                className="w-full aspect-[4/5] rounded-xl relative overflow-hidden flex flex-col items-center p-4 transition-transform hover:-translate-y-2 cursor-pointer group"
                onClick={() => navigate('/fit')}
                style={{ 
                  background: 'var(--bg-card)',
                  boxShadow: '0 12px 30px rgba(139, 107, 67, 0.2)',
                  border: '2px solid var(--border-color)'
                }}
              >
                <img src={whiteMockupFront} alt="T-Shirt" className="w-[90%] h-auto object-contain flex-1 filter drop-shadow-xl transition-transform group-hover:scale-105" />
                
                <div className="w-full mt-4 flex flex-col items-center gap-3">
                  <span className="font-bold text-sm uppercase" style={{ color: 'var(--text-primary)' }}>
                    {language === 'ar' ? appConfig.products.tshirt.nameAr : appConfig.products.tshirt.nameEn}
                  </span>
                </div>
              </div>
            </div>

            {/* SWEATSHIRT */}
            <div className="flex flex-col items-center">
              <h2 className={`text-3xl font-black mb-4 uppercase ${!appConfig.products.sweatshirt.enabled && 'opacity-0'}`} style={{ color: 'var(--text-primary)' }}>
                {language === 'ar' ? appConfig.products.sweatshirt.nameAr : appConfig.products.sweatshirt.nameEn}
              </h2>
              <div 
                className={`w-full aspect-[4/5] rounded-xl relative overflow-hidden flex flex-col items-center justify-center p-4 ${appConfig.products.sweatshirt.enabled ? 'cursor-pointer group transition-transform hover:-translate-y-2' : ''}`}
                style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', boxShadow: '0 8px 25px rgba(0,0,0,0.1)' }}
                onClick={() => appConfig.products.sweatshirt.enabled && navigate('/fit')}
              >
                <img src={hodyImg} alt="Sweatshirt" className="w-[85%] h-auto object-contain transition-transform group-hover:scale-105" />
                <span className="font-bold text-sm mt-4 uppercase" style={{ color: 'var(--text-primary)' }}>
                  {language === 'ar' ? appConfig.products.sweatshirt.nameAr : appConfig.products.sweatshirt.nameEn}
                </span>

                {!appConfig.products.sweatshirt.enabled && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center backdrop-blur-md bg-[#e6ded0]/30">
                    <span className="font-black text-2xl tracking-wider text-[#3d3329]">{t('home.comingSoon')}</span>
                  </div>
                )}
              </div>
            </div>

            {/* SWEATPANTS */}
            <div className="flex flex-col items-center">
              <h2 className={`text-3xl font-black mb-4 uppercase ${!appConfig.products.sweatpants.enabled && 'opacity-0'}`} style={{ color: 'var(--text-primary)' }}>
                {language === 'ar' ? appConfig.products.sweatpants.nameAr : appConfig.products.sweatpants.nameEn}
              </h2>
              <div 
                className={`w-full aspect-[4/5] rounded-xl relative overflow-hidden flex flex-col items-center justify-center p-4 ${appConfig.products.sweatpants.enabled ? 'cursor-pointer group transition-transform hover:-translate-y-2' : ''}`}
                style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', boxShadow: '0 8px 25px rgba(0,0,0,0.1)' }}
                onClick={() => appConfig.products.sweatpants.enabled && navigate('/fit')}
              >
                <img src={pantImg} alt="Sweatpants" className="w-[85%] h-auto object-contain transition-transform group-hover:scale-105" />
                <span className="font-bold text-sm mt-4 uppercase" style={{ color: 'var(--text-primary)' }}>
                  {language === 'ar' ? appConfig.products.sweatpants.nameAr : appConfig.products.sweatpants.nameEn}
                </span>

                {!appConfig.products.sweatpants.enabled && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center backdrop-blur-md bg-[#e6ded0]/30">
                    <span className="font-black text-2xl tracking-wider text-[#3d3329]">{t('home.comingSoon')}</span>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

function FitStep() {
  const navigate = useNavigate();
  const { t, dir, language } = useLanguage();
  return (
    <div className="flex-1 min-h-screen flex flex-col font-['Inter']" style={{ color: 'var(--text-primary)' }} dir={dir}>
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-start px-4 py-12 relative">
        <div className="w-full max-w-5xl md:px-10 flex flex-col items-center text-center">
          
          <h2 className="text-4xl md:text-5xl font-black mb-2" style={{ color: 'var(--text-primary)', fontFamily: 'system-ui, -apple-system, sans-serif' }}>{t('home.designTshirt')}</h2>
          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-wide mb-3 text-center" style={{ color: 'var(--text-primary)' }}>{t('home.whichFit')}</h1>
          <p className="text-md italic mb-10 text-center" style={{ color: 'var(--text-muted)' }}>.{t('home.defineSilhouette')}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full mt-2">
            
            {/* OVERSIZE */}
            <div className={`flex flex-col items-center ${appConfig.fits.oversize.enabled ? 'cursor-pointer group' : 'relative'}`} onClick={() => appConfig.fits.oversize.enabled && navigate('/color?fit=oversize')}>
              <div 
                className="w-full aspect-square rounded-2xl relative overflow-hidden flex flex-col items-center justify-center transition-transform hover:-translate-y-2"
                style={{ 
                  background: 'var(--bg-card)',
                  boxShadow: '0 12px 30px rgba(139, 107, 67, 0.15)',
                  border: '1px solid var(--border-color)'
                }}
              >
                <img src={oversizeImg} alt="Oversize" className="w-[85%] h-auto object-contain filter drop-shadow-2xl transition-transform group-hover:scale-105" />
                <span className="absolute bottom-6 font-bold text-lg text-[var(--text-primary)] uppercase">
                  {language === 'ar' ? appConfig.fits.oversize.nameAr : appConfig.fits.oversize.nameEn}
</span>
                {!appConfig.fits.oversize.enabled && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center backdrop-blur-[6px] bg-[#f5efe6]/40">
                    <span className="font-black text-2xl tracking-wider" style={{ color: 'var(--text-primary)' }}>{t('home.comingSoon')}</span>
                  </div>
                )}
              </div>
            </div>

            {/* REGULAR FIT */}
            <div className={`flex flex-col items-center ${appConfig.fits.regularFit.enabled ? 'cursor-pointer group' : 'relative'}`} onClick={() => appConfig.fits.regularFit.enabled && navigate('/color?fit=regularFit')}>
              <div 
                className="w-full aspect-square rounded-2xl relative overflow-hidden flex flex-col items-center justify-center transition-transform hover:-translate-y-2"
                style={{ 
                  background: 'var(--bg-card)',
                  boxShadow: '0 12px 30px rgba(139, 107, 67, 0.15)',
                  border: '1px solid var(--border-color)'
                }}
              >
                <img src={regularFitImg} alt="Regular Fit" className="w-[85%] h-auto object-contain filter drop-shadow-xl transition-transform group-hover:scale-105" />
                <span className="absolute bottom-6 font-bold text-lg uppercase" style={{ color: 'var(--text-primary)' }}>
                  {language === 'ar' ? appConfig.fits.regularFit.nameAr : appConfig.fits.regularFit.nameEn}
                </span>
                {!appConfig.fits.regularFit.enabled && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center backdrop-blur-[6px] bg-[#f5efe6]/40">
                    <span className="font-black text-2xl tracking-wider" style={{ color: 'var(--text-primary)' }}>{t('home.comingSoon')}</span>
                  </div>
                )}
              </div>
            </div>

            {/* BOXY FIT */}
            <div className={`flex flex-col items-center ${appConfig.fits.boxyFit.enabled ? 'cursor-pointer group' : 'relative'}`} onClick={() => appConfig.fits.boxyFit.enabled && navigate('/color?fit=boxyFit')}>
              <div 
                className="w-full aspect-square rounded-2xl relative overflow-hidden flex flex-col items-center justify-center transition-transform hover:-translate-y-2"
                style={{ 
                  background: 'var(--bg-card)',
                  boxShadow: '0 12px 30px rgba(139, 107, 67, 0.15)',
                  border: '1px solid var(--border-color)'
                }}
              >
                <img src={boxyFitImg} alt="Boxy Fit" className="w-[85%] h-auto object-contain filter drop-shadow-xl transition-transform group-hover:scale-105" />
                <span className="absolute bottom-6 font-bold text-lg uppercase" style={{ color: 'var(--text-primary)' }}>
                  {language === 'ar' ? appConfig.fits.boxyFit.nameAr : appConfig.fits.boxyFit.nameEn}
                </span>
                {!appConfig.fits.boxyFit.enabled && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center backdrop-blur-[6px] bg-[#f5efe6]/40">
                    <span className="font-black text-2xl tracking-wider" style={{ color: 'var(--text-primary)' }}>{t('home.comingSoon')}</span>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

function ColorStep() {
  const navigate = useNavigate();
  const { t, dir } = useLanguage();
  const location = useLocation();
  const fit = new URLSearchParams(location.search).get('fit') || 'regularFit';

  return (
    <div className="flex-1 min-h-screen flex flex-col font-['Inter']" style={{ color: 'var(--text-primary)' }} dir={dir}>
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center px-4 md:px-20 lg:px-40 py-12">
        <div className="w-full flex flex-col md:flex-row items-center justify-between gap-16 md:gap-8">
          
          {/* Left Side: Main Title */}
          <div className="flex flex-col items-center md:items-end text-center md:text-right w-full md:w-1/2 mt-10 md:mt-0">
            <div className="flex items-center gap-4 mb-2">
              <h1 className="text-4xl md:text-6xl font-black uppercase tracking-wider" style={{ color: 'var(--text-primary)', textShadow: '2px 2px 4px rgba(0,0,0,0.1)' }}>{t('home.selectColor')}</h1>
              <Paintbrush size={48} className="opacity-80" strokeWidth={1.5} style={{ color: 'var(--text-primary)' }} />
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-wide" style={{ color: 'var(--text-primary)', fontFamily: 'system-ui, -apple-system, sans-serif' }}>{t('home.designTshirt')}</h2>
          </div>

          {/* Right Side: Options */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left w-full md:w-1/2">
            <h3 className="text-3xl md:text-4xl font-black uppercase tracking-wide mb-1" style={{ color: 'var(--text-primary)' }}>{t('home.selectColor')}</h3>
            <p className="text-sm italic mb-8" style={{ color: 'var(--text-secondary)' }}>.{t('home.setTone')}</p>
            
            <div className="flex items-center gap-8 md:gap-12 w-full justify-center md:justify-start pl-0 md:pl-4">
              
              {/* White Swatch */}
              <button
                onClick={() => navigate(`/editor?fit=${fit}&color=white`)}
                className="flex flex-col items-center group transition-transform hover:-translate-y-2"
              >
                <div 
                  className="w-32 h-32 md:w-40 md:h-40 rounded-[2rem] mb-4 relative overflow-hidden" 
                  style={{ 
                    background: 'linear-gradient(145deg, #ffffff, #e6e6e6)',
                    boxShadow: '8px 8px 16px rgba(0,0,0,0.15), -8px -8px 16px rgba(255,255,255,0.4)',
                    border: '4px solid #b1894d'
                  }}
                >
                  {/* Subtle inner shadow/fabric effect */}
                  <div className="absolute inset-0 rounded-[2rem]" style={{ boxShadow: 'inset 0 10px 20px rgba(0,0,0,0.05), inset 0 -10px 20px rgba(255,255,255,0.8)' }}></div>
                </div>
                <span className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>{t('home.white')}</span>
              </button>

              {/* Black Swatch */}
              <button
                onClick={() => navigate(`/editor?fit=${fit}&color=black`)}
                className="flex flex-col items-center group transition-transform hover:-translate-y-2"
              >
                <div 
                  className="w-32 h-32 md:w-40 md:h-40 rounded-[2rem] mb-4 relative overflow-hidden" 
                  style={{ 
                    background: 'linear-gradient(145deg, #222222, #000000)',
                    boxShadow: '8px 8px 16px rgba(0,0,0,0.3), -8px -8px 16px rgba(255,255,255,0.1)',
                    border: '4px solid #b1894d'
                  }}
                >
                  {/* Subtle inner shadow/fabric effect */}
                  <div className="absolute inset-0 rounded-[2rem]" style={{ boxShadow: 'inset 0 10px 20px rgba(255,255,255,0.05), inset 0 -10px 20px rgba(0,0,0,0.8)' }}></div>
                </div>
                <span className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>{t('home.black')}</span>
              </button>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function App() {
  const location = useLocation();

  useEffect(() => {
    // Save referral code if present
    const ref = new URLSearchParams(location.search).get('ref');
    if (ref) {
      localStorage.setItem('wearurway_ref', ref);
    }

    // Secret clear command for testing
    const clear = new URLSearchParams(location.search).get('clear');
    if (clear === '1') {
      localStorage.removeItem('wearurway_ref');
      localStorage.removeItem('wearurway_community_design_id');
      window.history.replaceState({}, document.title, window.location.pathname);
      alert('تم مسح بيانات الخصم المؤقتة من المتصفح بنجاح!');
    }
  }, [location.search]);

  return (
    <Routes>
      <Route path="/" element={<ProductStep />} />
      <Route path="/fit" element={<FitStep />} />
      <Route path="/color" element={<ColorStep />} />
      <Route path="/editor" element={<Editor />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/auth/google/success" element={<GoogleSuccess />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/community" element={<Community />} />
      <Route path="/admin" element={<AdminDashboard />} />
    </Routes>
  );
}
