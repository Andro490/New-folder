import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

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
  }, []);

  const handleBuy = async (design: Design) => {
    // Call API to track the purchase and reward the designer
    try {
      const API_BASE = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:3001' : '');
      await fetch(`${API_BASE}/api/designs/${design.id}/purchase`, { method: 'POST' });
      // Update local count
      setDesigns(prev => prev.map(d => d.id === design.id ? { ...d, purchases: d.purchases + 1 } : d));
    } catch(e) { console.error(e); }

    // Save layers to localstorage and navigate to editor
    try {
      const front = JSON.parse(design.frontDesign || '[]');
      const back = JSON.parse(design.backDesign || '[]');
      localStorage.setItem('wearurway_layers', JSON.stringify([...front, ...back]));
    } catch(e) {}
    
    navigate(`/editor?color=${design.tshirtColor}&designId=${design.id}`);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-['Inter']" dir="rtl">
      {/* Header */}
      <header className="flex items-center justify-between px-6 md:px-12 py-6 border-b border-[#1a1a1a] sticky top-0 bg-[#0a0a0a]/90 backdrop-blur-md z-50">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">معرض التصاميم <span className="text-[#f5c842]">المجتمعية</span></h1>
          <p className="text-gray-400 text-sm mt-1">اكتشف تصاميم المبدعين، اشترِ ما يعجبك، وادعمهم!</p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="text-sm font-bold bg-[#111] border border-[#333] hover:border-[#f5c842] text-white px-6 py-2 rounded-full transition-colors"
        >
          العودة
        </button>
      </header>

      {/* Grid */}
      <main className="max-w-7xl mx-auto px-6 md:px-12 py-10">
        {loading ? (
          <div className="flex justify-center py-20 text-gray-500">جاري التحميل...</div>
        ) : designs.length === 0 ? (
          <div className="text-center py-20 text-gray-500">لا توجد تصاميم منشورة بعد. كُن أول من ينشر!</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {designs.map(design => (
              <div key={design.id} className="bg-[#111] border border-[#222] rounded-xl overflow-hidden group hover:border-[#f5c842] transition-colors flex flex-col">
                <div className="relative aspect-square bg-[#050505] overflow-hidden flex items-center justify-center p-4">
                  {design.imageUrl ? (
                    <img src={design.imageUrl} alt={design.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <span className="text-gray-600">لا توجد صورة</span>
                  )}
                  <div className="absolute top-3 left-3 bg-[#f5c842] text-black text-[10px] font-bold px-2 py-1 rounded">
                    {design.purchases} شراء
                  </div>
                </div>
                
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-bold text-lg text-white mb-1 truncate">{design.name}</h3>
                  <p className="text-xs text-gray-400 mb-4 truncate">من تصميم: {design.user.name || 'مبدع مجهول'}</p>
                  
                  <div className="mt-auto">
                    <button
                      onClick={() => handleBuy(design)}
                      className="w-full py-3 bg-[#1a1a1a] hover:bg-[#f5c842] text-white hover:text-black text-sm font-bold rounded-lg transition-colors"
                    >
                      شراء التصميم
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
