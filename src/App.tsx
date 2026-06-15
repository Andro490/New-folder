import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Community from './pages/Community';
import AdminDashboard from './pages/AdminDashboard';
import Canvas from './components/Canvas';
import LayerSidebar from './components/LayerSidebar';
import SettingsSidebar from './components/SettingsSidebar';
import Navbar from './components/Navbar';
import { DesignLayer, TShirtColor, TShirtView } from './types';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './utils/tshirtSvg';
import { Layers, Sparkles, Zap } from 'lucide-react';

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
          className="text-[10px] font-bold tracking-[0.2em] uppercase px-3 py-1 rounded-full"
          style={{
            background: 'var(--accent-glow)',
            color: 'var(--accent-secondary)',
            border: '1px solid var(--border-color)',
          }}
        >
          {view} VIEW
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
              className="text-sm px-10 py-2.5 font-bold tracking-[0.15em] transition-colors"
              style={{
                backgroundColor: view === 'front' ? 'var(--accent-primary)' : 'var(--bg-card)',
                color: view === 'front' ? '#f9f4e6' : 'var(--text-secondary)',
              }}
              onClick={() => setView('front')}
            >
              أمامي
            </button>
            <div style={{ width: 1, backgroundColor: 'var(--border-color)' }} />
            <button
              className="text-sm px-10 py-2.5 font-bold tracking-[0.15em] transition-colors"
              style={{
                backgroundColor: view === 'back' ? 'var(--accent-primary)' : 'var(--bg-card)',
                color: view === 'back' ? '#f9f4e6' : 'var(--text-secondary)',
              }}
              onClick={() => setView('back')}
            >
              خلفي
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
  return (
    <div className="flex-1 min-h-screen flex flex-col font-['Inter']" style={{ color: 'var(--text-primary)' }}>
      <Navbar />
      
      {/* Banner */}
      <div 
        className="w-full py-10 flex flex-col items-center justify-center relative overflow-hidden mt-4"
        style={{ 
          background: 'linear-gradient(rgba(70, 50, 30, 0.9), rgba(50, 35, 20, 0.9))',
          boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
        }}
      >
        {/* Subtle wood texture effect via repeating gradient */}
        <div className="absolute inset-0 opacity-20 mix-blend-overlay" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.2) 2px, rgba(0,0,0,0.2) 4px)' }}></div>
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-wider text-[#f3ebd2] z-10" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>SELECT PRODUCT</h1>
        <p className="text-sm mt-2 text-[#d4c3a3] z-10">.Choose your canvas</p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-start px-4 py-12">
        <div className="w-full max-w-5xl md:px-10">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-5">
            {/* SWEATPANTS */}
            <div className="flex flex-col items-center pt-10 relative">
              <div 
                className="w-full aspect-[4/5] rounded-xl relative overflow-hidden flex flex-col items-center justify-center opacity-80"
                style={{ backgroundColor: '#d5d1cc', boxShadow: '0 8px 25px rgba(0,0,0,0.1)' }}
              >
                <img src={pantImg} alt="Sweatpants" className="w-4/5 h-auto object-contain opacity-60" />
                <div className="absolute inset-0 flex items-center justify-center backdrop-blur-[2px]">
                  <span className="font-black text-xl tracking-wider text-[#3d3329]" style={{ textShadow: '1px 1px 0px rgba(255,255,255,0.5)' }}>COMING SOON</span>
                </div>
              </div>
            </div>

            {/* SWEATSHIRT */}
            <div className="flex flex-col items-center pt-10 relative">
              <div 
                className="w-full aspect-[4/5] rounded-xl relative overflow-hidden flex flex-col items-center justify-center opacity-80"
                style={{ backgroundColor: '#d5d1cc', boxShadow: '0 8px 25px rgba(0,0,0,0.1)' }}
              >
                <img src={hodyImg} alt="Sweatshirt" className="w-4/5 h-auto object-contain opacity-60" />
                <div className="absolute inset-0 flex items-center justify-center backdrop-blur-[2px]">
                  <span className="font-black text-xl tracking-wider text-[#3d3329]" style={{ textShadow: '1px 1px 0px rgba(255,255,255,0.5)' }}>COMING SOON</span>
                </div>
              </div>
            </div>

            {/* T-SHIRT (Active) */}
            <div className="flex flex-col items-center">
              <h2 className="text-3xl font-black mb-4 text-[#3d3329]">T-SHIRT</h2>
              <div 
                className="w-full aspect-[4/5] rounded-xl relative overflow-hidden flex flex-col items-center p-4 transition-transform hover:-translate-y-2"
                style={{ 
                  background: 'linear-gradient(145deg, #e6ded0, #f5f0e6)',
                  boxShadow: '0 12px 30px rgba(139, 107, 67, 0.2)',
                  border: '2px solid #fff'
                }}
              >
                <img src={whiteMockupFront} alt="T-Shirt" className="w-[90%] h-auto object-contain flex-1 filter drop-shadow-xl" />
                
                <div className="w-full mt-4 flex flex-col items-center gap-3">
                  <span className="font-bold text-sm text-[#3d3329]">T-SHIRT</span>
                  <button
                    onClick={() => navigate('/fit')}
                    className="w-full py-3 rounded text-[#fff8e8] font-bold tracking-wider transition-all"
                    style={{ 
                      background: 'linear-gradient(to right, #6a4f2d, #b1894d, #6a4f2d)',
                      backgroundSize: '200% auto',
                      boxShadow: '0 4px 10px rgba(106, 79, 45, 0.4)'
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundPosition = 'right center'}
                    onMouseLeave={e => e.currentTarget.style.backgroundPosition = 'left center'}
                  >
                    GET STARTED
                  </button>
                </div>
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
  return (
    <div className="flex-1 min-h-screen flex flex-col font-['Inter']" style={{ color: 'var(--text-primary)' }}>
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-start px-4 py-12 relative">
        <div className="w-full max-w-5xl md:px-10 flex flex-col items-center text-center">
          
          <h2 className="text-4xl md:text-5xl font-black mb-2 text-[#3d3329]" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>صمّم تيشرتك</h2>
          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-wide mb-3" style={{ color: 'var(--text-primary)' }}>?WHICH FIT DO YOU PREFER</h1>
          <p className="text-md italic mb-10" style={{ color: 'var(--text-muted)' }}>.Define the silhouette</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full mt-2">
            
            {/* OVERSIZE */}
            <div className="flex flex-col items-center relative">
              <div 
                className="w-full aspect-square rounded-2xl relative overflow-hidden flex flex-col items-center justify-center opacity-80"
                style={{ 
                  background: 'linear-gradient(145deg, #d4c8b8, #c4b6a2)',
                  boxShadow: 'inset 0 0 40px rgba(0,0,0,0.1), 0 10px 25px rgba(0,0,0,0.1)'
                }}
              >
                <img src={oversizeImg} alt="Oversize" className="w-[85%] h-auto object-contain opacity-70 filter drop-shadow-2xl" />
                <div className="absolute inset-0 flex items-center justify-center backdrop-blur-[1px]">
                  <span className="font-bold text-xl tracking-wider text-[#f3ebd2]" style={{ textShadow: '1px 2px 4px rgba(0,0,0,0.6)' }}>COMING SOON</span>
                </div>
                <span className="absolute bottom-6 font-bold text-lg text-[#3d3329]">OVERSIZE</span>
              </div>
            </div>

            {/* REGULAR FIT */}
            <div className="flex flex-col items-center cursor-pointer group" onClick={() => navigate('/color')}>
              <div 
                className="w-full aspect-square rounded-2xl relative overflow-hidden flex flex-col items-center justify-center transition-transform hover:-translate-y-2"
                style={{ 
                  background: 'linear-gradient(145deg, #f5efe6, #eae2d3)',
                  boxShadow: '0 12px 30px rgba(139, 107, 67, 0.15)',
                  border: '1px solid rgba(255,255,255,0.5)'
                }}
              >
                <img src={regularFitImg} alt="Regular Fit" className="w-[85%] h-auto object-contain filter drop-shadow-xl transition-transform group-hover:scale-105" />
                <span className="absolute bottom-6 font-bold text-lg text-[#3d3329]">REGULAR FIT</span>
              </div>
            </div>

            {/* BOXY FIT */}
            <div className="flex flex-col items-center cursor-pointer group" onClick={() => navigate('/color')}>
              <div 
                className="w-full aspect-square rounded-2xl relative overflow-hidden flex flex-col items-center justify-center transition-transform hover:-translate-y-2"
                style={{ 
                  background: 'linear-gradient(145deg, #f5efe6, #eae2d3)',
                  boxShadow: '0 12px 30px rgba(139, 107, 67, 0.15)',
                  border: '1px solid rgba(255,255,255,0.5)'
                }}
              >
                <img src={boxyFitImg} alt="Boxy Fit" className="w-[85%] h-auto object-contain filter drop-shadow-xl transition-transform group-hover:scale-105" />
                <span className="absolute bottom-6 font-bold text-lg text-[#3d3329]">BOXY FIT</span>
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
  return (
    <div className="flex-1 min-h-screen flex flex-col font-['Inter']" style={{ color: 'var(--text-primary)' }}>
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-5xl md:px-10 flex flex-col items-center md:items-start text-center md:text-left">
          <h1 className="text-3xl md:text-5xl font-black uppercase leading-tight mb-2 md:mb-5" style={{ color: 'var(--text-primary)' }}>Select Color</h1>
          <p className="text-sm mb-6 md:mb-5" style={{ color: 'var(--text-muted)' }}>Set the tone.</p>
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-14 mt-2 md:mt-5 w-full max-w-xs md:max-w-none">
            <button
              onClick={() => navigate('/editor?color=black')}
              className="flex flex-col items-center group w-full md:w-auto"
            >
              <div className="w-full aspect-square md:w-40 md:h-40 transition-colors mb-4 md:mb-5" style={{ backgroundColor: '#111', border: '2px solid var(--border-color)' }} onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-primary)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}></div>
              <span className="text-xs font-bold uppercase transition-colors" style={{ color: 'var(--text-primary)' }}>Black</span>
            </button>
            <button
              onClick={() => navigate('/editor?color=white')}
              className="flex flex-col items-center group w-full md:w-auto"
            >
              <div className="w-full aspect-square md:w-40 md:h-40 transition-colors mb-4 md:mb-5" style={{ backgroundColor: '#e5e5e5', border: '2px solid var(--border-color)' }} onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-primary)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}></div>
              <span className="text-xs font-bold uppercase transition-colors" style={{ color: 'var(--text-primary)' }}>White</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const location = useLocation();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const ref = searchParams.get('ref');
    if (ref) {
      localStorage.setItem('wearurway_ref', ref);
    }
  }, [location]);

  return (
    <Routes>
      <Route path="/" element={<ProductStep />} />
      <Route path="/fit" element={<FitStep />} />
      <Route path="/color" element={<ColorStep />} />
      <Route path="/editor" element={<Editor />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/community" element={<Community />} />
      <Route path="/admin" element={<AdminDashboard />} />
    </Routes>
  );
}
