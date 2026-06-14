import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, LayoutGrid, Tag, Star, ArrowRight } from 'lucide-react';

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
      <div className="flex-1 flex flex-col h-screen overflow-y-auto relative z-10 custom-scrollbar p-6">
        
        {/* Ornate Frame Container */}
        <div className="flex-1 border-[3px] border-[#8b6b43]/40 rounded-sm relative p-2">
          {/* Ornate corners (CSS simulated) */}
          <div className="absolute top-0 right-0 w-8 h-8 border-t-[3px] border-r-[3px] border-[#8b6b43]"></div>
          <div className="absolute top-0 left-0 w-8 h-8 border-t-[3px] border-l-[3px] border-[#8b6b43]"></div>
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-[3px] border-r-[3px] border-[#8b6b43]"></div>
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-[3px] border-l-[3px] border-[#8b6b43]"></div>

          <div className="border border-[#8b6b43]/20 h-full flex flex-col">
            {/* Header Section */}
            <header className="relative pt-8 pb-10 px-6 flex flex-col items-center justify-center border-b border-[#8b6b43]/20 mx-10">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-12 pt-6">
                  {filteredDesigns.map(design => (
                    <div 
                      key={design.id} 
                      className="group relative bg-[#ebddc4] rounded-lg overflow-visible flex flex-col transition-all duration-300 hover:-translate-y-1 shadow-lg border-[2px] border-[#8b6b43]/60"
                    >
                      {/* Top Circular Badge */}
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-30 w-12 h-12 rounded-full border-[2px] border-[#f3ebd2] shadow-md flex flex-col items-center justify-center bg-gradient-to-b from-[#b1894d] to-[#6a4f2d] text-[#f3ebd2]">
                        <span className="text-lg font-bold leading-none mt-1" style={{ fontFamily: "'Aref Ruqaa', serif" }}>{design.purchases}</span>
                      </div>
                      
                      {/* Image Container */}
                      <div className="relative aspect-[4/5] bg-gradient-to-b from-[#222] to-[#111] m-2 rounded-md overflow-hidden flex items-center justify-center p-4 border border-[#8b6b43]/30 shadow-inner">
                        {design.imageUrl ? (
                          <img 
                            src={design.imageUrl} 
                            alt={design.name} 
                            className="w-full h-full object-contain relative z-0 transition-transform duration-700 group-hover:scale-105 drop-shadow-xl" 
                          />
                        ) : (
                          <span className="text-gray-400 font-bold text-sm relative z-0">بدون صورة</span>
                        )}
                      </div>
                      
                      {/* Content Section */}
                      <div className="p-5 flex flex-col flex-1 relative z-10 text-center">
                        <h3 className="font-bold text-xl text-[#3d2b1f] mb-1 truncate" style={{ fontFamily: "'Aref Ruqaa', serif" }}>{design.name}</h3>
                        <p className="text-xs text-[#8b6b43] font-semibold mb-6 truncate">
                          من تصميم: <span className="text-[#594228] font-bold">{design.user.name || 'مبدع مجهول'}</span>
                        </p>
                        
                        <div className="mt-auto">
                          <button
                            onClick={() => handleBuy(design)}
                            className="w-full py-2.5 bg-gradient-to-b from-[#3d2b1f] to-[#1a120c] border border-[#594228] text-[#eaddc3] hover:text-white text-sm font-bold rounded-full shadow-md transition-all duration-300 flex items-center justify-center gap-2 hover:shadow-lg"
                          >
                            <ShoppingCart className="w-4 h-4" />
                            <span>شراء التصميم</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
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
