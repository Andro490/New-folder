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
    <div className="min-h-screen bg-[#121212] text-white font-['Cairo'] relative overflow-x-hidden" dir="rtl">
      {/* Background Pattern Overlay */}
      <div className="fixed inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      <div className="fixed inset-0 opacity-20 pointer-events-none bg-gradient-to-b from-[#b89547]/10 via-transparent to-transparent"></div>

      {/* Header Section */}
      <header className="relative pt-12 pb-8 px-6 md:px-12 flex flex-col items-center justify-center z-10">
        <button
          onClick={() => navigate('/')}
          className="absolute right-6 top-8 text-gray-400 hover:text-[#e5bc5b] transition-colors flex items-center gap-2 group"
        >
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          <span className="text-sm font-semibold tracking-wider">العودة</span>
        </button>

        <div className="flex flex-col items-center mb-4">
          <div className="w-12 h-12 flex items-center justify-center border border-[#e5bc5b] rounded-sm mb-4">
            <span className="font-serif text-xl font-bold text-[#e5bc5b] tracking-widest">PS</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-[#fceabb] to-[#f8b500] drop-shadow-lg mb-3" style={{ fontFamily: "'Aref Ruqaa', serif" }}>
            مَعْرِض التَّصَامِيم المُجْتَمَعِيَّة
          </h1>
          <p className="text-gray-400 text-sm md:text-base tracking-wide font-light">
            اكتشف تصاميم المبدعين، اشترِ ما يعجبك وادعمهم
          </p>
        </div>
      </header>

      {/* Main Layout: Grid + Sidebar */}
      <div className="max-w-[1500px] mx-auto px-6 md:px-12 pb-24 relative z-10 flex flex-col lg:flex-row gap-10">
        
        {/* Main Grid (Right side in RTL) */}
        <main className="flex-1 order-2 lg:order-1">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-10 h-10 border-4 border-[#e5bc5b] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredDesigns.length === 0 ? (
            <div className="text-center py-20 text-gray-500 font-semibold text-lg">لا توجد تصاميم مطابقة للبحث.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
              {filteredDesigns.map(design => (
                <div 
                  key={design.id} 
                  className="group relative bg-[#181818] rounded-xl overflow-hidden flex flex-col transition-all duration-500 hover:shadow-[0_0_30px_rgba(229,188,91,0.15)] hover:-translate-y-1"
                  style={{
                    boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.05), 0 10px 30px -10px rgba(0,0,0,0.5)',
                  }}
                >
                  {/* Glowing border effect on hover */}
                  <div className="absolute inset-0 bg-gradient-to-b from-[#e5bc5b]/0 to-[#e5bc5b]/0 group-hover:from-[#e5bc5b]/20 group-hover:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-xl"></div>
                  
                  {/* Image Container with elegant frame */}
                  <div className="relative aspect-[4/5] bg-[#0a0a0a] m-1 rounded-t-lg overflow-hidden flex items-center justify-center p-6 border-b border-[#222]">
                    <div className="absolute inset-0 shadow-[inset_0_0_50px_rgba(0,0,0,0.8)] pointer-events-none z-10"></div>
                    
                    {design.imageUrl ? (
                      <img 
                        src={design.imageUrl} 
                        alt={design.name} 
                        className="w-full h-full object-contain relative z-0 transition-transform duration-700 ease-out group-hover:scale-110 drop-shadow-2xl" 
                      />
                    ) : (
                      <span className="text-[#333] font-bold tracking-widest text-sm relative z-0">بدون صورة</span>
                    )}
                    
                    <div className="absolute top-4 right-4 z-20 bg-gradient-to-r from-[#d4af37] to-[#aa8327] text-black text-xs font-bold px-3 py-1.5 rounded-sm shadow-lg flex items-center gap-1">
                      <span>{design.purchases}</span>
                      <span>شراء</span>
                    </div>
                  </div>
                  
                  {/* Content Section */}
                  <div className="p-5 flex flex-col flex-1 relative z-10 bg-[#161616]">
                    <h3 className="font-bold text-xl text-white mb-1 truncate tracking-wide text-right">{design.name}</h3>
                    <p className="text-xs text-[#888] mb-6 truncate text-right font-light">
                      من تصميم: <span className="text-[#ccc]">{design.user.name || 'مبدع مجهول'}</span>
                    </p>
                    
                    <div className="mt-auto">
                      <button
                        onClick={() => handleBuy(design)}
                        className="w-full py-3.5 bg-transparent border border-[#333] group-hover:border-[#e5bc5b] text-gray-300 group-hover:text-[#e5bc5b] hover:bg-[#e5bc5b] hover:text-black text-sm font-bold rounded-md transition-all duration-300 flex items-center justify-center gap-2"
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

        {/* Sidebar (Left side in RTL because of order-1 / flex-row behavior where second child is on the left) */}
        <aside className="w-full lg:w-[300px] shrink-0 order-1 lg:order-2">
          <div className="sticky top-24 bg-[#161616]/80 backdrop-blur-md border border-[#333] rounded-xl p-6 shadow-2xl">
            
            {/* Categories */}
            <div className="mb-8">
              <h3 className="flex items-center gap-2 text-[#e5bc5b] font-bold text-lg mb-4 border-b border-[#333] pb-2">
                <LayoutGrid className="w-5 h-5" />
                <span>التصنيفات</span>
              </h3>
              <div className="space-y-2">
                <button 
                  onClick={() => setSelectedCategory('all')}
                  className={`w-full text-right px-3 py-2 rounded-md transition-colors text-sm ${selectedCategory === 'all' ? 'bg-[#e5bc5b]/10 text-[#e5bc5b]' : 'text-gray-400 hover:text-white hover:bg-[#222]'}`}
                >
                  الكل
                </button>
                <button 
                  onClick={() => setSelectedCategory('tshirts')}
                  className={`w-full text-right px-3 py-2 rounded-md transition-colors text-sm ${selectedCategory === 'tshirts' ? 'bg-[#e5bc5b]/10 text-[#e5bc5b]' : 'text-gray-400 hover:text-white hover:bg-[#222]'}`}
                >
                  تي شيرت (T-Shirts)
                </button>
                <button 
                  onClick={() => setSelectedCategory('hoodies')}
                  className={`w-full text-right px-3 py-2 rounded-md transition-colors text-sm ${selectedCategory === 'hoodies' ? 'bg-[#e5bc5b]/10 text-[#e5bc5b]' : 'text-gray-400 hover:text-white hover:bg-[#222]'}`}
                >
                  هوديز (قريباً)
                </button>
              </div>
            </div>

            {/* Price Range */}
            <div className="mb-8">
              <h3 className="flex items-center gap-2 text-[#e5bc5b] font-bold text-lg mb-4 border-b border-[#333] pb-2">
                <Tag className="w-5 h-5" />
                <span>نطاق السعر</span>
              </h3>
              <div className="space-y-2">
                <button className="w-full text-right px-3 py-2 rounded-md transition-colors text-sm bg-[#e5bc5b]/10 text-[#e5bc5b]">
                  جميع الأسعار
                </button>
                <button className="w-full text-right px-3 py-2 rounded-md transition-colors text-sm text-gray-400 hover:text-white hover:bg-[#222] opacity-50 cursor-not-allowed" title="متوفر قريباً">
                  أقل من 500 جنيه
                </button>
              </div>
            </div>

            {/* Featured Artists */}
            <div>
              <h3 className="flex items-center gap-2 text-[#e5bc5b] font-bold text-lg mb-4 border-b border-[#333] pb-2">
                <Star className="w-5 h-5" />
                <span>أبرز المبدعين</span>
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                <button 
                  onClick={() => setSelectedArtist('all')}
                  className={`w-full text-right px-3 py-2 rounded-md transition-colors text-sm ${selectedArtist === 'all' ? 'bg-[#e5bc5b]/10 text-[#e5bc5b]' : 'text-gray-400 hover:text-white hover:bg-[#222]'}`}
                >
                  الجميع
                </button>
                {uniqueArtists.map(artist => (
                  <button 
                    key={artist}
                    onClick={() => setSelectedArtist(artist as string)}
                    className={`w-full text-right px-3 py-2 rounded-md transition-colors text-sm ${selectedArtist === artist ? 'bg-[#e5bc5b]/10 text-[#e5bc5b]' : 'text-gray-400 hover:text-white hover:bg-[#222]'}`}
                  >
                    {artist}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </aside>
      </div>
    </div>
  );
}
