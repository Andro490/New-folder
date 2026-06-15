import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, Copy, CheckCircle, Paintbrush, ShoppingCart, Wallet, Users } from 'lucide-react';
import Navbar from '../components/Navbar';
import { useLanguage } from '../contexts/LanguageContext';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [designCount, setDesignCount] = useState(0);
  const [totalSales, setTotalSales] = useState(0);
  const { t, dir } = useLanguage();

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('wearurway_token');
      if (!token) {
        navigate('/auth');
        return;
      }
      try {
        const API_BASE = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:3001' : '');
        const res = await fetch(`${API_BASE}/api/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          localStorage.setItem('wearurway_user', JSON.stringify(data.user));
          // Fetch user's design count and total sales
          const designsRes = await fetch(`${API_BASE}/api/user/designs`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (designsRes.ok) {
            const designsData = await designsRes.json();
            setDesignCount(designsData.count || 0);
            setTotalSales(designsData.totalSales || 0);
          }
        } else {
          localStorage.removeItem('wearurway_token');
          navigate('/auth');
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchUser();
  }, [navigate]);

  if (!user) return <div className="min-h-screen flex items-center justify-center" style={{ color: 'var(--text-primary)' }}>{t('dashboard.loading')}</div>;

  const affiliateLink = `${window.location.origin}/?ref=${user.affiliateCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(affiliateLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = () => {
    localStorage.removeItem('wearurway_token');
    localStorage.removeItem('wearurway_user');
    navigate('/auth');
  };

  return (
    <div className="flex-1 min-h-screen flex flex-col font-['Inter']" style={{ color: 'var(--text-primary)' }} dir={dir}>
      <Navbar />

      <div className="flex-1 w-full flex flex-col items-center p-6 md:p-10 relative">
        
        {/* Main Content Container */}
        <div className="max-w-7xl w-full mx-auto flex flex-col gap-6 z-10">
          
          {/* Top Title & Subtitle */}
          <div className="text-center mb-4 mt-4">
            <h1 className="text-4xl md:text-5xl font-black mb-3" style={{ color: '#4a3b2c' }}>
               {t('dashboard.welcome')}، <span style={{ color: '#b1894d' }}>{user.name} !</span>
            </h1>
            <p className="text-sm md:text-base font-medium" style={{ color: '#6a543f' }}>
              {t('dashboard.subtitle')}
            </p>
          </div>

          {/* Affiliate Link Bar */}
          <div 
            className="w-full rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-md" 
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.7)', border: '1px solid rgba(177, 137, 77, 0.3)', backdropFilter: 'blur(10px)' }}
          >
            <div className="flex items-center gap-3">
              <Layers size={20} style={{ color: '#b1894d' }} />
              <h2 className="text-base font-bold text-[#4a3b2c]">{t('dashboard.affiliateLink')}</h2>
              <p className={`text-xs text-[#6a543f] hidden lg:block ${dir === 'rtl' ? 'mr-2' : 'ml-2'}`}>
                {t('dashboard.affiliateDesc')}
              </p>
            </div>
            
            <div className="flex items-center rounded-xl p-1 gap-2 w-full md:w-[450px]" style={{ backgroundColor: '#f2ece4', border: '1px solid rgba(177, 137, 77, 0.2)' }}>
              <input
                type="text"
                readOnly
                value={affiliateLink}
                className="bg-transparent flex-1 outline-none text-xs md:text-sm px-3 font-mono text-[#4a3b2c]"
                dir="ltr"
              />
              <button
                onClick={handleCopy}
                className="font-bold px-6 py-2 text-sm rounded-lg transition-all text-white shadow-sm"
                style={{ backgroundColor: '#a68048' }}
              >
                {copied ? t('dashboard.copied') : t('dashboard.copy')}
              </button>
            </div>
          </div>

          {/* Small Arabic Stats Row */}
          <div className="w-full grid grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
            
            <div className="rounded-2xl p-4 flex flex-col items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, #e6d3a8, #d4ba7b)', border: '1px solid rgba(255,255,255,0.4)' }}>
              <p className="text-xs font-bold text-[#4a3b2c] text-center">{t('dashboard.balance')}</p>
              <div className={`flex items-end justify-center gap-1 mt-2 ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                <span className="text-3xl font-black text-[#3d2b1f] leading-none">{user.discountBalance}</span>
                <span className="text-xs font-bold text-[#3d2b1f] mb-1">{t('dashboard.currency')}</span>
              </div>
            </div>

            <div className="rounded-2xl p-4 flex flex-col items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, #e6d3a8, #d4ba7b)', border: '1px solid rgba(255,255,255,0.4)' }}>
              <p className="text-xs font-bold text-[#4a3b2c] text-center">{t('dashboard.referred')}</p>
              <div className={`flex items-end justify-center gap-1 mt-2 ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                <span className="text-3xl font-black text-[#3d2b1f] leading-none">{user.referredUsers}</span>
                <span className="text-xs font-bold text-[#3d2b1f] mb-1">{t('dashboard.person')}</span>
              </div>
            </div>

            <div className="rounded-2xl p-4 flex flex-col items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, #e6d3a8, #d4ba7b)', border: '1px solid rgba(255,255,255,0.4)' }}>
              <p className="text-xs font-bold text-[#4a3b2c] text-center">{t('dashboard.totalSales')}</p>
              <div className={`flex items-end justify-center gap-1 mt-2 ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                <span className="text-3xl font-black text-[#3d2b1f] leading-none">{totalSales}</span>
                <span className="text-xs font-bold text-[#3d2b1f] mb-1">{t('dashboard.order')}</span>
              </div>
            </div>

            <div className="rounded-2xl p-4 flex flex-col items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, #e6d3a8, #d4ba7b)', border: '1px solid rgba(255,255,255,0.4)' }}>
              <p className="text-xs font-bold text-[#4a3b2c] text-center">{t('dashboard.designs')}</p>
              <div className={`flex items-end justify-center gap-1 mt-2 ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                <span className="text-3xl font-black text-[#3d2b1f] leading-none">{designCount}</span>
                <span className="text-xs font-bold text-[#3d2b1f] mb-1">{t('dashboard.design')}</span>
              </div>
            </div>

          </div>

          <p className="text-[10px] text-center mt-2 text-[#8b6b43]">
            * سيتم خصم رصيدك تلقائياً عند طلب شراء كشرط خصم منك من المتجر
          </p>

          {/* Large English Stats Row */}
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-4">
            
            <div className="rounded-2xl p-8 flex flex-col items-center justify-center shadow-2xl relative overflow-hidden h-48" style={{ background: 'linear-gradient(145deg, #ffffff 40%, #dec48b)', border: '1px solid rgba(255,255,255,0.6)' }}>
              <Paintbrush size={32} className="text-[#8b6b43] mb-4" />
              <p className="text-sm text-[#4a3b2c] mb-2 font-semibold">Designs Submitted</p>
              <span className="text-4xl font-black text-[#2a1e15]">{designCount}</span>
            </div>

            <div className="rounded-2xl p-8 flex flex-col items-center justify-center shadow-2xl relative overflow-hidden h-48" style={{ background: 'linear-gradient(145deg, #ffffff 40%, #dec48b)', border: '1px solid rgba(255,255,255,0.6)' }}>
              <ShoppingCart size={32} className="text-[#8b6b43] mb-4" />
              <p className="text-sm text-[#4a3b2c] mb-2 font-semibold">Total Sales</p>
              <span className="text-4xl font-black text-[#2a1e15]">{totalSales}</span>
            </div>

            <div className="rounded-2xl p-8 flex flex-col items-center justify-center shadow-2xl relative overflow-hidden h-48" style={{ background: 'linear-gradient(145deg, #ffffff 40%, #dec48b)', border: '1px solid rgba(255,255,255,0.6)' }}>
              <Wallet size={32} className="text-[#8b6b43] mb-4" />
              <p className="text-sm text-[#4a3b2c] mb-2 font-semibold">Total Commissions</p>
              <div className="flex items-baseline gap-1" dir="ltr">
                <span className="text-4xl font-black text-[#2a1e15]">{user.discountBalance}</span>
                <span className="text-xl font-bold text-[#2a1e15]">.ع ج</span>
              </div>
            </div>

            <div className="rounded-2xl p-8 flex flex-col items-center justify-center shadow-2xl relative overflow-hidden h-48" style={{ background: 'linear-gradient(145deg, #ffffff 40%, #dec48b)', border: '1px solid rgba(255,255,255,0.6)' }}>
              <Users size={32} className="text-[#8b6b43] mb-4" />
              <p className="text-sm text-[#4a3b2c] mb-2 font-semibold">Referrals</p>
              <span className="text-4xl font-black text-[#2a1e15]">{user.referredUsers}</span>
            </div>

          </div>

        </div>


      </div>
    </div>
  );
}
