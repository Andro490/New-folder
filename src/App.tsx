import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Canvas from './components/Canvas';
import LayerSidebar from './components/LayerSidebar';
import SettingsSidebar from './components/SettingsSidebar';
import { DesignLayer, TShirtColor, TShirtView } from './types';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './utils/tshirtSvg';
import { Layers, Sparkles, Zap } from 'lucide-react';

import blackMockupFront from './assets/black-mockup.png';
import blackMockupBack from './assets/black-mockup-back.png';
import whiteMockupFront from './assets/—Pngtree—white t shirt mockup realistic_13020297.png';
import whiteMockupBack from './assets/—Pngtree—back white t shirt_13029479.png';

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
      style={{ background: 'var(--bg-primary)', overflow: 'hidden', height: '100dvh' }}
    >
      {/* Top Bar */}
      <header
        className="flex items-center px-6 h-16 shrink-0"
        style={{
          backgroundColor: 'rgba(5, 5, 5, 0.85)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          zIndex: 50
        }}
      >
        {/* Left: Logo & View Badge */}
        <div className="flex items-center gap-3 w-full md:w-1/3">
          <div
            className="w-8 h-8 rounded flex items-center justify-center shrink-0"
            style={{
              background: 'linear-gradient(135deg, #f5c842, #d4af37)',
              boxShadow: '0 0 15px rgba(245, 200, 66, 0.2)',
            }}
          >
            <Zap size={16} color="#000" fill="#000" />
          </div>
          <span
            className="font-black text-xl tracking-tight shrink-0"
            style={{ color: '#fff' }}
          >
            Print<span style={{ color: '#f5c842' }}>Studio</span>
          </span>
          
          <div className="hidden sm:block h-4 w-px bg-[#222] mx-2"></div>
          
          <span
            className="hidden sm:inline-block text-[10px] font-bold tracking-[0.2em] uppercase px-3 py-1 rounded-full shrink-0"
            style={{
              background: 'rgba(245, 200, 66, 0.1)',
              color: '#f5c842',
              border: '1px solid rgba(245, 200, 66, 0.2)'
            }}
          >
            {view} VIEW
          </span>
        </div>

        {/* Center: Status / Layers */}
        <div className="hidden md:flex items-center justify-center gap-3 w-1/3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0a0a0a] border border-[#1a1a1a]">
            <Layers size={12} color="#666" />
            <span className="text-[11px] font-medium tracking-[0.1em] uppercase text-[#888]">
              {layers.length} Layer{layers.length !== 1 ? 's' : ''}
            </span>
          </div>
          {selectedLayer && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#111] border border-[#333]">
              <Sparkles size={12} color="#f5c842" />
              <span className="text-[11px] font-bold tracking-[0.1em] uppercase text-[#f5c842] truncate max-w-[100px]">
                {selectedLayer.name}
              </span>
            </div>
          )}
        </div>

        {/* Right: Branding */}
        <div className="hidden md:flex items-center justify-end gap-6 w-1/3">
          <span className="text-[10px] font-bold tracking-[0.25em] text-[#555] uppercase">
            Platform Design
          </span>
          <div className="h-4 w-px bg-[#222]"></div>
          <span
            className="text-lg font-black tracking-widest text-white"
          >
            ويرورواي
          </span>
        </div>
      </header>

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

        <main
          className="flex-1 relative flex items-center justify-center overflow-hidden min-h-[500px] lg:min-h-0"
          style={{
            backgroundImage: 'linear-gradient(45deg, rgb(42, 42, 42) 25%, transparent 25%), linear-gradient(-45deg, rgb(42, 42, 42) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgb(42, 42, 42) 75%), linear-gradient(-45deg, transparent 75%, rgb(42, 42, 42) 75%)',
            backgroundSize: '24px 24px',
            backgroundPosition: '0px 0px, 0px 12px, 12px -12px, -12px 0px',
            backgroundColor: 'rgb(26, 26, 26)'
          }}
        >

          <div className="absolute top-8 z-20 flex" style={{ border: '1px solid rgba(255,255,255,0.15)' }}>
            <button
              className="text-sm px-10 py-3 font-bold tracking-[0.15em] transition-colors"
              style={{
                backgroundColor: view === 'front' ? 'white' : 'transparent',
                color: view === 'front' ? 'black' : 'white',
              }}
              onClick={() => setView('front')}
            >
              أمامي
            </button>
            <div style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.15)' }} />
            <button
              className="text-sm px-10 py-3 font-bold tracking-[0.15em] transition-colors"
              style={{
                backgroundColor: view === 'back' ? 'white' : 'transparent',
                color: view === 'back' ? 'black' : 'white',
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
    <div className="flex-1 min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a] text-white font-['Inter'] px-4 py-12">
      <div className="absolute top-6 right-6 z-50">
        <button
          onClick={() => {
            const token = localStorage.getItem('wearurway_token');
            if (token) navigate('/dashboard');
            else navigate('/auth');
          }}
          className="text-sm font-bold bg-[#f5c842] text-black px-6 py-2 rounded-full hover:bg-[#e6b72f] transition-colors"
        >
          {localStorage.getItem('wearurway_token') ? 'حسابي' : 'تسجيل الدخول'}
        </button>
      </div>

      <div className="w-full max-w-5xl md:px-10">
        <h1 className="text-3xl md:text-5xl font-black uppercase leading-tight mb-2 md:mb-5">Select Product</h1>
        <p className="text-gray-400 text-sm mb-6 md:mb-5">Choose your canvas.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5">
          <button
            onClick={() => navigate('/fit')}
            className="h-52 border border-[#222] bg-black hover:border-[#f5c842] transition-colors flex flex-col items-center justify-center relative group"
          >
            <span className="font-bold text-sm group-hover:text-[#f5c842] transition-colors">T-SHIRT</span>
          </button>
          <button disabled className="h-52 border border-[#111] bg-[#050505] flex flex-col items-center justify-center relative opacity-40 cursor-not-allowed">
            <span className="font-bold text-sm text-gray-500 mb-4">SWEATSHIRT</span>
            <span className="text-[10px] bg-[#1a1a1a] px-3 py-1 text-gray-500 uppercase">Coming Soon</span>
          </button>
          <button disabled className="h-52 border border-[#111] bg-[#050505] flex flex-col items-center justify-center relative opacity-40 cursor-not-allowed">
            <span className="font-bold text-sm text-gray-500 mb-4">SWEATPANTS</span>
            <span className="text-[10px] bg-[#1a1a1a] px-3 py-1 text-gray-500 uppercase">Coming Soon</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function FitStep() {
  const navigate = useNavigate();
  return (
    <div className="flex-1 min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a] text-white font-['Inter'] px-4 py-12">
      <div className="w-full max-w-5xl md:px-10">
        <h1 className="text-3xl md:text-5xl font-black uppercase leading-tight mb-2 md:mb-5">Which Fit Do You Prefer?</h1>
        <p className="text-gray-400 text-sm mb-6 md:mb-5">Define the silhouette.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5">
          <button
            onClick={() => navigate('/color')}
            className="h-52 border border-[#222] bg-black hover:border-[#f5c842] transition-colors flex flex-col items-center justify-center relative group"
          >
            <span className="font-bold text-sm group-hover:text-[#f5c842] transition-colors">BOXY FIT</span>
          </button>
          <button
            onClick={() => navigate('/color')}
            className="h-52 border border-[#222] bg-black hover:border-[#f5c842] transition-colors flex flex-col items-center justify-center relative group"
          >
            <span className="font-bold text-sm group-hover:text-[#f5c842] transition-colors">REGULAR FIT</span>
          </button>
          <button disabled className="h-52 border border-[#111] bg-[#050505] flex flex-col items-center justify-center relative opacity-40 cursor-not-allowed">
            <span className="font-bold text-sm text-gray-500 mb-4">OVERSIZE</span>
            <span className="text-[10px] bg-[#1a1a1a] px-3 py-1 text-gray-500 uppercase">Coming Soon</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function ColorStep() {
  const navigate = useNavigate();
  return (
    <div className="flex-1 min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a] text-white font-['Inter'] px-4 py-12">
      <div className="w-full max-w-5xl md:px-10 flex flex-col items-center md:items-start text-center md:text-left">
        <h1 className="text-3xl md:text-5xl font-black uppercase leading-tight mb-2 md:mb-5">Select Color</h1>
        <p className="text-gray-400 text-sm mb-6 md:mb-5">Set the tone.</p>
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-14 mt-2 md:mt-5 w-full max-w-xs md:max-w-none">
          <button
            onClick={() => navigate('/editor?color=black')}
            className="flex flex-col items-center group w-full md:w-auto"
          >
            <div className="w-full aspect-square md:w-40 md:h-40 bg-[#111] border-2 border-[#333] group-hover:border-[#f5c842] transition-colors mb-4 md:mb-5"></div>
            <span className="text-xs font-bold uppercase text-gray-400 group-hover:text-white transition-colors">Black</span>
          </button>
          <button
            onClick={() => navigate('/editor?color=white')}
            className="flex flex-col items-center group w-full md:w-auto"
          >
            <div className="w-full aspect-square md:w-40 md:h-40 bg-[#e5e5e5] border-2 border-[#ccc] group-hover:border-[#f5c842] transition-colors mb-4 md:mb-5"></div>
            <span className="text-xs font-bold uppercase text-gray-400 group-hover:text-white transition-colors">White</span>
          </button>
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
    </Routes>
  );
}
