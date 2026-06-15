import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, ShoppingBag, User as UserIcon } from 'lucide-react';
import Navbar from '../components/Navbar';
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
  authorName?: string;
  productType?: string;
  price?: number;
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
        if (data.success) {
          setDesigns(data.designs);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const uniqueArtists = Array.from(new Set(designs.map(d => d.user.name || '')));

  const filteredDesigns = designs.filter(design => {
    if (selectedCategory !== 'all') {
      if (selectedCategory === 'hoodies') return false;
    }
    if (selectedArtist !== 'all') {
      if ((design.user.name || '') !== selectedArtist) return false;
    }
    return true;
  });

  return (
    <div className="flex-1 min-h-screen flex flex-col font-['Inter']" style={{ color: 'var(--text-primary)', backgroundColor: '#fdfaf6' }} dir={dir}>
      <Navbar />

      <div className="flex-1 w-full max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 px-4 md:px-8 py-8 relative">
        
        {/* Main Content Area */}
        <div className="flex-1">
          <div className="text-center mb-10 mt-4 w-full">
            <h1 className="text-4xl md:text-5xl font-black mb-3" style={{ color: '#4a3b2c' }}>
              {t('community.title')}
            </h1>
            <p className="text-sm md:text-base font-medium max-w-2xl mx-auto" style={{ color: '#6a543f' }}>
              {t('community.subtitle')}
            </p>
          </div>

          <main className="pb-12">
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="w-10 h-10 border-4 border-[#8b6b43] border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : filteredDesigns.length === 0 ? (
              <div className="w-full py-20 flex flex-col items-center justify-center text-center opacity-50">
                <Search size={48} className="mb-4 text-gray-400" />
                <p className="text-lg font-bold text-gray-500">{t('community.noDesigns')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDesigns.map(design => {
                  let hasBackDesign = false;
                  try {
                    const parsed = JSON.parse(design.backDesign || '[]');
                    if (Array.isArray(parsed) && parsed.length > 0) hasBackDesign = true;
                  } catch(e) {}

                  return (
                    <div key={design.id} className="group relative bg-white rounded-2xl overflow-hidden border border-[#d4ba7b]/20 shadow-sm hover:shadow-lg transition-all duration-300">
                      <div className="relative w-full aspect-[4/5] bg-gray-50 overflow-hidden">
                        {design.imageUrl ? (
                          <img src={design.imageUrl} alt={design.name} className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 text-xs font-medium">
                            {t('community.noImage')}
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col gap-1 pointer-events-none transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                          <span className="text-white font-bold text-sm truncate">{design.name || t('community.unknownArtist')}</span>
                          <div className="flex items-center gap-1.5 text-white/80 text-xs">
                            <UserIcon size={12} />
                            <span className="truncate">{t('community.designedBy')} {design.user.name || t('community.unknownArtist')}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-3 bg-white flex items-center justify-between">
                        <div className="flex flex-col">
                           <span className="text-[11px] text-gray-500 uppercase font-bold tracking-wider">{design.productType || 'T-Shirt'}</span>
                           <span className="text-sm font-black text-[#4a3b2c]">
                             {design.price ? `${design.price} EGP` : 'Free'}
                           </span>
                        </div>
                        <button 
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors shadow-sm`}
                          style={{ backgroundColor: '#8b6b43', color: '#fff' }}
                          title={t('community.buyDesign')}
                          onClick={() => navigate(`/?designId=${design.id}`)}
                        >
                          <ShoppingBag size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </div>

        {/* Sidebar Filters */}
        <aside className="w-full lg:w-64 shrink-0 flex flex-col gap-6">
          <div className="bg-white rounded-2xl p-5 shadow-sm border" style={{ borderColor: '#d4ba7b' }}>
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
              <Filter size={18} style={{ color: '#b1894d' }} />
              <h3 className="font-bold text-[#4a3b2c]">{t('community.categories')}</h3>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`text-sm ${dir === 'rtl' ? 'text-right' : 'text-left'} px-3 py-2 rounded-lg transition-colors ${selectedCategory === 'all' ? 'bg-[#f3ebd2] text-[#8b6b43] font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                {t('community.all')}
              </button>
              <button
                onClick={() => setSelectedCategory('tshirt')}
                className={`text-sm ${dir === 'rtl' ? 'text-right' : 'text-left'} px-3 py-2 rounded-lg transition-colors ${selectedCategory === 'tshirt' ? 'bg-[#f3ebd2] text-[#8b6b43] font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                {t('community.tshirts')}
              </button>
              <button
                disabled
                className={`text-sm ${dir === 'rtl' ? 'text-right' : 'text-left'} px-3 py-2 rounded-lg text-gray-400 opacity-60 cursor-not-allowed`}
              >
                {t('community.hoodies')}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border" style={{ borderColor: '#d4ba7b' }}>
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
              <UserIcon size={18} style={{ color: '#b1894d' }} />
              <h3 className="font-bold text-[#4a3b2c]">{t('community.featuredArtists')}</h3>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setSelectedArtist('all')}
                className={`text-sm ${dir === 'rtl' ? 'text-right' : 'text-left'} px-3 py-2 rounded-lg transition-colors ${selectedArtist === 'all' ? 'bg-[#f3ebd2] text-[#8b6b43] font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                {t('community.allArtists')}
              </button>
              {uniqueArtists.map(artist => (
                <button
                  key={artist}
                  onClick={() => setSelectedArtist(artist)}
                  className={`text-sm ${dir === 'rtl' ? 'text-right' : 'text-left'} px-3 py-2 rounded-lg transition-colors truncate ${selectedArtist === artist ? 'bg-[#f3ebd2] text-[#8b6b43] font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  {artist || t('community.unknownArtist')}
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
