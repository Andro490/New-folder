import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, LayoutGrid, Star, ArrowRight } from 'lucide-react';
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
  const navigate = useNavigate();

  useEffect(() => {
    // Add Google Font for elegant Arabic typography
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Aref+Ruqaa:wght@400;700&family=Cairo:wght@400;600;800&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    const API_BASE = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:3001' : '');
    
    fetch(`${API_BASE}/api/designs`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setDesigns(data.designs);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));

    return () => { document.head.removeChild(link); };
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

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedArtist, setSelectedArtist] = useState('all');

  // Extract unique artists for the filter
  const uniqueArtists = Array.from(new Set(designs.map(d => d.user.name || 'مبدع مجهول')));

  // Filter logic
  const filteredDesigns = designs.filter(design => {
    if (selectedCategory !== 'all') {
      if (selectedCategory === 'hoodies') return false; // We only have t-shirts right now
    }
    if (selectedArtist !== 'all') {
      if ((design.user.name || 'مبدع مجهول') !== selectedArtist) return false;
    }
    return true;
  });

  return (
    <div className="flex min-h-screen bg-[#f3ebd2] text-[#3d2b1f] font-['Cairo'] relative overflow-hidden" dir="rtl">
      {/* Vintage Paper Texture Overlay */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/old-wall.png")' }}></div>

      {/* Main Content Area (Right Side in RTL) */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto relative z-10 custom-scrollbar p-8 md:p-12">
        
        {/* Ornate Frame Container */}
        <div className="flex-1 border-[3px] border-[#8b6b43]/40 rounded-sm relative p-2 md:p-3">
          {/* Ornate corners (CSS simulated) */}
          <div className="absolute top-0 right-0 w-8 h-8 border-t-[3px] border-r-[3px] border-[#8b6b43]"></div>
          <div className="absolute top-0 left-0 w-8 h-8 border-t-[3px] border-l-[3px] border-[#8b6b43]"></div>
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-[3px] border-r-[3px] border-[#8b6b43]"></div>
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-[3px] border-l-[3px] border-[#8b6b43]"></div>

          <div className="border border-[#8b6b43]/20 h-full flex flex-col">
            {/* Header Section */}
            <header className="relative pt-16 pb-10 px-6 flex flex-col items-center justify-center border-b border-[#8b6b43]/20 mx-10">
              <button
                onClick={() => navigate('/')}
                className="absolute left-0 top-2 text-[#8b6b43] hover:text-[#594228] transition-colors flex items-center gap-2 group"
              >
                <span className="text-sm font-bold tracking-wider">العودة</span>
                <ArrowRight className="w-5 h-5 group-hover:-translate-x-1 transition-transform rotate-180" />
              </button>

              <div className="flex flex-col items-center mt-2">
                <div className="w-12 h-10 flex items-center justify-center border-[2px] border-[#8b6b43] mb-3 bg-[#eaddc3]">
                  <span className="font-serif text-lg font-bold text-[#594228]">PS</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold text-[#594228] mb-2" style={{ fontFamily: "'Aref Ruqaa', serif" }}>
                  مَعْرِض التَّصَامِيم المُجْتَمَعِيَّة
                </h1>
                <p className="text-[#8b6b43] text-sm md:text-base font-semibold">
                  اكتشف تصاميم المبدعين، اشترِ ما يعجبك وادعمهم
                </p>
              </div>
            </header>

            {/* Main Grid */}
            <main className="flex-1 px-6 md:px-12 py-12 overflow-y-auto">
              {loading ? (
                <div className="flex justify-center py-20">
                  <div className="w-10 h-10 border-4 border-[#8b6b43] border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : filteredDesigns.length === 0 ? (
                <div className="text-center py-20 text-[#8b6b43] font-bold text-lg">لا توجد تصاميم مطابقة للبحث.</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-10 pt-8">
                  {filteredDesigns.map(design => {
                    // Parse back design layers using correct 'imageUrl' property
                    let backLayers: Array<{imageUrl: string; x: number; y: number; width: number; height: number; rotation: number; opacity: number; visible: boolean}> = [];
                    let hasBackDesign = false;
                    try {
                      const parsed = JSON.parse(design.backDesign || '[]');
                      if (Array.isArray(parsed) && parsed.length > 0) {
                        backLayers = parsed.filter((l: any) => l.imageUrl);
                        hasBackDesign = backLayers.length > 0;
                      }
                    } catch(e) {}

                    // Choose correct back mockup based on tshirt color
                    const backMockup = design.tshirtColor === 'white' ? whiteMockupBack : blackMockupBack;

                    return (
                    /* ─── Outer ornate frame wrapper ─── */
                    <div
                      key={design.id}
                      className="group relative p-[6px] transition-all duration-300 hover:-translate-y-1"
                      style={{
                        background: 'linear-gradient(135deg, #c9973e 0%, #f5e09a 30%, #a8742a 55%, #f5e09a 75%, #c9973e 100%)',
                        borderRadius: '12px',
                        boxShadow: '0 6px 28px rgba(90,60,20,0.28), 0 0 0 1px rgba(200,160,70,0.5)',
                        perspective: '1000px',
                      }}
                    >
                      {/* Corner ornament dots */}
                      <div className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-[#f5e09a] opacity-80 z-40"></div>
                      <div className="absolute top-1 left-1 w-2.5 h-2.5 rounded-full bg-[#f5e09a] opacity-80 z-40"></div>
                      <div className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full bg-[#f5e09a] opacity-80 z-40"></div>
                      <div className="absolute bottom-1 left-1 w-2.5 h-2.5 rounded-full bg-[#f5e09a] opacity-80 z-40"></div>

                      {/* ─── Flip container ─── */}
                      <div
                        className="relative flex flex-col w-full h-full transition-transform duration-700"
                        style={{
                          transformStyle: 'preserve-3d',
                          transform: 'rotateY(0deg)',
                        }}
                        onMouseEnter={e => { if (hasBackDesign) (e.currentTarget as HTMLDivElement).style.transform = 'rotateY(180deg)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'rotateY(0deg)'; }}
                      >
                        {/* ── FRONT FACE ── */}
                        <div
                          className="relative flex flex-col"
                          style={{
                            background: 'linear-gradient(160deg, #e8d5a3 0%, #d4b97a 40%, #c8a85a 100%)',
                            borderRadius: '8px',
                            overflow: 'visible',
                            backfaceVisibility: 'hidden',
                            WebkitBackfaceVisibility: 'hidden',
                          }}
                        >
                          {/* Image Area — FRONT */}
                          <div
                            className="mt-1.5 mx-1.5 rounded-t-md overflow-hidden flex items-center justify-center relative"
                            style={{
                              background: 'linear-gradient(180deg, #1a1008 0%, #0d0804 100%)',
                              aspectRatio: '5/6', // Matching canvas aspect ratio
                              borderRadius: '6px 6px 0 0',
                              border: '1px solid rgba(139,107,67,0.4)',
                            }}
                          >
                            {design.imageUrl ? (
                              <img src={design.imageUrl} alt={design.name} className="w-full h-full object-contain drop-shadow-xl absolute inset-0" />
                            ) : (
                              <span className="text-gray-500 font-bold text-xs">بدون صورة</span>
                            )}
                          </div>

                          {/* Info + Button */}
                          <div
                            className="mx-1.5 mb-1.5 rounded-b-md px-3 pt-2 pb-3 flex flex-col gap-1"
                            style={{
                              background: 'linear-gradient(180deg, #c8a85a 0%, #b1894d 100%)',
                              borderRadius: '0 0 6px 6px',
                              border: '1px solid rgba(139,107,67,0.4)',
                              borderTop: 'none',
                            }}
                          >
                            <h3 className="font-bold text-sm text-[#1a0e06] truncate text-right leading-tight" style={{ fontFamily: "'Aref Ruqaa', serif" }}>
                              {design.name}
                            </h3>
                            <p className="text-[10px] text-[#3d2b1f]/80 text-right font-semibold truncate mb-1.5">
                              من تصميم: <span className="text-[#1a0e06] font-bold">{design.user.name || 'مبدع مجهول'}</span>
                            </p>
                            <button
                              onClick={() => handleBuy(design)}
                              className="w-full py-2 flex items-center justify-center gap-1.5 font-bold text-xs transition-all duration-200 hover:opacity-90 active:scale-95"
                              style={{
                                background: 'linear-gradient(180deg, #2a1a0a 0%, #0d0804 100%)',
                                color: '#e8d5a3',
                                borderRadius: '5px',
                                border: '1px solid #6a4f2d',
                                boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                              }}
                            >
                              <ShoppingCart className="w-3 h-3" />
                              <span>شراء التصميم</span>
                            </button>
                          </div>
                        </div>

                        {/* ── BACK FACE ── */}
                        {hasBackDesign && (
                          <div
                            className="absolute inset-0 flex flex-col"
                            style={{
                              background: 'linear-gradient(160deg, #e8d5a3 0%, #d4b97a 40%, #c8a85a 100%)',
                              borderRadius: '8px',
                              overflow: 'hidden',
                              backfaceVisibility: 'hidden',
                              WebkitBackfaceVisibility: 'hidden',
                              transform: 'rotateY(180deg)',
                            }}
                          >
                            {/* Back label */}
                            <div className="text-center py-1.5 text-[9px] font-bold text-[#594228] tracking-widest border-b border-[#8b6b43]/30 bg-[#e8d5a3]">
                              ← الظهر
                            </div>
                            {/* Back image container */}
                            <div
                              className="flex-1 mx-1.5 mb-1.5 mt-1.5 rounded-b-md overflow-hidden flex items-center justify-center relative"
                              style={{ 
                                background: 'linear-gradient(180deg, #1a1008 0%, #0d0804 100%)',
                                aspectRatio: '5/6',
                                borderRadius: '6px 6px 6px 6px',
                              }}
                            >
                              {/* The Base Mockup */}
                              <img src={backMockup} alt="back mockup" className="w-full h-full object-cover absolute inset-0 z-0 drop-shadow-xl" />
                              
                              {/* The Layers */}
                              {backLayers.map((layer, idx) => (
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
                                    pointerEvents: 'none'
                                  }}
                                  alt="layer"
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    );
                  })}
                </div>
              )}
            </main>
          </div>
        </div>
      </div>

      {/* Sidebar (Left Side in RTL) */}
      <aside className="w-[280px] hidden lg:flex flex-col h-screen sticky top-0 shrink-0 z-20 relative overflow-y-auto custom-scrollbar pt-12 pr-4 border-r border-[#8b6b43]/30">
        <div className="p-6 relative z-10">
          <div className="flex flex-col items-center mb-10">
            <h2 className="text-3xl font-bold text-[#594228]" style={{ fontFamily: "'Aref Ruqaa', serif" }}>قائمة الفلترة</h2>
            <div className="w-16 h-0.5 bg-[#8b6b43]/50 mt-2"></div>
          </div>
          
          {/* Categories */}
          <div className="mb-10">
            <h3 className="flex items-center gap-2 text-[#594228] font-bold text-lg mb-4 border-b border-[#8b6b43]/20 pb-2">
              <LayoutGrid className="w-5 h-5 text-[#8b6b43]" />
              <span>التصنيفات</span>
            </h3>
            <div className="space-y-1">
              <button 
                onClick={() => setSelectedCategory('all')}
                className={`w-full text-right px-4 py-2 rounded-md transition-all text-sm font-bold ${selectedCategory === 'all' ? 'bg-[#8b6b43]/10 text-[#594228] border-r-[3px] border-[#8b6b43]' : 'text-[#8b6b43] hover:text-[#594228] hover:bg-[#8b6b43]/5'}`}
              >
                الكل
              </button>
              <button 
                onClick={() => setSelectedCategory('tshirts')}
                className={`w-full text-right px-4 py-2 rounded-md transition-all text-sm font-bold ${selectedCategory === 'tshirts' ? 'bg-[#8b6b43]/10 text-[#594228] border-r-[3px] border-[#8b6b43]' : 'text-[#8b6b43] hover:text-[#594228] hover:bg-[#8b6b43]/5'}`}
              >
                تي شيرت (T-Shirts)
              </button>
              <button 
                onClick={() => setSelectedCategory('hoodies')}
                className={`w-full text-right px-4 py-2 rounded-md transition-all text-sm font-bold ${selectedCategory === 'hoodies' ? 'bg-[#8b6b43]/10 text-[#594228] border-r-[3px] border-[#8b6b43]' : 'text-[#8b6b43] hover:text-[#594228] hover:bg-[#8b6b43]/5'}`}
              >
                هوديز (قريباً)
              </button>
            </div>
          </div>

          {/* Featured Artists */}
          <div>
            <h3 className="flex items-center gap-2 text-[#594228] font-bold text-lg mb-4 border-b border-[#8b6b43]/20 pb-2">
              <Star className="w-5 h-5 text-[#8b6b43]" />
              <span>أبرز المبدعين</span>
            </h3>
            <div className="space-y-1">
              <button 
                onClick={() => setSelectedArtist('all')}
                className={`w-full text-right px-4 py-2 rounded-md transition-all text-sm font-bold ${selectedArtist === 'all' ? 'bg-[#8b6b43]/10 text-[#594228] border-r-[3px] border-[#8b6b43]' : 'text-[#8b6b43] hover:text-[#594228] hover:bg-[#8b6b43]/5'}`}
              >
                الجميع
              </button>
              {uniqueArtists.map(artist => (
                <button 
                  key={artist}
                  onClick={() => setSelectedArtist(artist as string)}
                  className={`w-full text-right px-4 py-2 rounded-md transition-all text-sm font-bold ${selectedArtist === artist ? 'bg-[#8b6b43]/10 text-[#594228] border-r-[3px] border-[#8b6b43]' : 'text-[#8b6b43] hover:text-[#594228] hover:bg-[#8b6b43]/5'}`}
                >
                  {artist}
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
