import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, LayoutGrid, Star, ArrowRight } from 'lucide-react';

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
      <div className="flex-1 flex flex-col h-screen overflow-y-auto relative z-10 custom-scrollbar p-4 md:p-8">
        
        {/* Header Section */}
        <header className="relative pt-10 pb-12 flex flex-col items-center justify-center">
          <button
            onClick={() => navigate('/')}
            className="absolute left-0 top-0 px-4 py-2 rounded-xl text-[#8b6b43] hover:text-[#594228] transition-colors flex items-center gap-2 group"
            style={{ backgroundColor: '#fdfaf6', border: '1px solid #d4ba7b', boxShadow: '0 4px 15px rgba(139, 107, 67, 0.1)' }}
          >
            <ArrowRight className="w-4 h-4 group-hover:-translate-x-1 transition-transform rotate-180" />
            <span className="text-sm font-bold tracking-wider">العودة</span>
          </button>

          <div className="flex flex-col items-center mt-2 relative z-10">
            <div className="w-12 h-10 flex items-center justify-center border-[2px] border-[#8b6b43] mb-3 bg-[#fdfaf6] rounded-sm shadow-sm">
              <span className="font-serif text-lg font-bold text-[#594228]">PS</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-[#1a0e06] mb-2 drop-shadow-sm" style={{ fontFamily: "'Aref Ruqaa', serif" }}>
              مَعْرِض التَّصَامِيم المُجْتَمَعِيَّة
            </h1>
            <p className="text-[#4a3b2c] text-sm md:text-base font-semibold">
              اكتشف تصاميم المبدعين، اشترِ ما يعجبك وادعمهم
            </p>
          </div>
        </header>

        {/* Main Grid */}
        <main className="flex-1 pb-12 overflow-y-auto">
              {loading ? (
                <div className="flex justify-center py-20">
                  <div className="w-10 h-10 border-4 border-[#8b6b43] border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : filteredDesigns.length === 0 ? (
                <div className="text-center py-20 text-[#8b6b43] font-bold text-lg">لا توجد تصاميم مطابقة للبحث.</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-10 pt-8">
                  {filteredDesigns.map(design => {


                    return (
                    /* ─── Sleek Card ─── */
                    <div
                      key={design.id}
                      className="group relative flex flex-col bg-[#fdfaf6] rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(139,107,67,0.2)] border border-[#d4ba7b]/40"
                      style={{
                        boxShadow: '0 8px 30px rgba(139, 107, 67, 0.08)'
                      }}
                    >
                      {/* Image Area */}
                      <div className="relative w-full aspect-[4/5] flex items-center justify-center p-6 bg-transparent">
                        {design.imageUrl ? (
                          <img src={design.imageUrl} alt={design.name} className="w-full h-full object-contain drop-shadow-2xl transition-transform duration-500 group-hover:scale-105" />
                        ) : (
                          <span className="text-[#8b6b43]/50 font-bold text-sm">بدون صورة</span>
                        )}
                      </div>

                      {/* Info Area */}
                      <div className="px-5 pt-2 pb-4 flex flex-col items-end">
                        <h3 className="font-bold text-base text-[#1a0e06] truncate text-right mb-1" style={{ fontFamily: "'Cairo', sans-serif" }}>
                          {design.name}
                        </h3>
                        <p className="text-xs text-[#8b6b43] text-right font-semibold truncate">
                          من تصميم: <span className="text-[#1a0e06] font-bold">{design.user.name || 'مبدع مجهول'}</span>
                        </p>
                      </div>

                      {/* Buy Button */}
                      <button
                        onClick={() => handleBuy(design)}
                        className="w-full py-3.5 flex items-center justify-center gap-2 font-bold text-sm transition-all duration-200 mt-auto"
                        style={{
                          backgroundColor: '#f3ebd2',
                          color: '#4a3b2c',
                          borderTop: '1px solid rgba(212, 186, 123, 0.4)',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#e8d5a3'; e.currentTarget.style.color = '#1a0e06'; }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#f3ebd2'; e.currentTarget.style.color = '#4a3b2c'; }}
                      >
                        <ShoppingCart className="w-4 h-4" />
                        <span>شراء التصميم</span>
                      </button>
                    </div>
                    );
                  })}
                </div>
              )}
            </main>
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
