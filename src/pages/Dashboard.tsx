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
          <div className="text-center" style={{ marginTop: '2rem', marginBottom: '2rem' }}>
            <h1 className="text-4xl md:text-5xl font-black mb-3" style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>
               {t('dashboard.welcome')}، <span style={{ color: 'var(--accent-primary)' }}>{user.name} !</span>
            </h1>
            <p className="text-sm md:text-base font-medium" style={{ color: 'var(--text-secondary)' }}>
              {t('dashboard.subtitle')}
            </p>
          </div>

          {/* Affiliate Link Bar */}
          <div 
            className="w-full rounded-2xl flex flex-col md:flex-row items-center justify-between shadow-md" 
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', backdropFilter: 'blur(10px)', padding: '24px', marginBottom: '24px', gap: '16px' }}
          >
            <div className="flex items-center" style={{ gap: '12px' }}>
              <Layers size={20} style={{ color: 'var(--accent-primary)' }} />
              <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>{t('dashboard.affiliateLink')}</h2>
              <p className={`text-xs hidden lg:block ${dir === 'rtl' ? 'mr-2' : 'ml-2'}`} style={{ color: 'var(--text-secondary)' }}>
                {t('dashboard.affiliateDesc')}
              </p>
            </div>
            
            <div className="flex items-center rounded-xl w-full md:w-[450px]" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '6px', gap: '8px' }}>
              <input
                type="text"
                readOnly
                value={affiliateLink}
                className="bg-transparent flex-1 outline-none text-xs md:text-sm font-mono"
                style={{ padding: '8px 16px', color: 'var(--text-primary)' }}
                dir="ltr"
              />
              <button
                onClick={handleCopy}
                className="font-bold text-sm rounded-lg transition-all text-white shadow-sm"
                style={{ backgroundColor: '#a68048', padding: '10px 24px' }}
              >
                {copied ? t('dashboard.copied') : t('dashboard.copy')}
              </button>
            </div>
          </div>

          {/* Small Arabic Stats Row */}
          <div className="w-full grid grid-cols-2 lg:grid-cols-4" style={{ gap: '20px', marginBottom: '16px' }}>
            
            <div className="rounded-2xl flex flex-col items-center justify-center shadow-lg" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '24px' }}>
              <p className="text-xs font-bold text-center" style={{ color: 'var(--text-secondary)' }}>{t('dashboard.balance')}</p>
              <div className={`flex items-end justify-center mt-2 ${dir === 'rtl' ? 'flex-row-reverse' : ''}`} style={{ gap: '6px' }}>
                <span className="text-3xl font-black leading-none" style={{ color: 'var(--text-primary)' }}>{user.discountBalance}</span>
                <span className="text-xs font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{t('dashboard.currency')}</span>
              </div>
            </div>

            <div className="rounded-2xl flex flex-col items-center justify-center shadow-lg" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '24px' }}>
              <p className="text-xs font-bold text-center" style={{ color: 'var(--text-secondary)' }}>{t('dashboard.referred')}</p>
              <div className={`flex items-end justify-center mt-2 ${dir === 'rtl' ? 'flex-row-reverse' : ''}`} style={{ gap: '6px' }}>
                <span className="text-3xl font-black leading-none" style={{ color: 'var(--text-primary)' }}>{user.referredUsers}</span>
                <span className="text-xs font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{t('dashboard.person')}</span>
              </div>
            </div>

            <div className="rounded-2xl flex flex-col items-center justify-center shadow-lg" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '24px' }}>
              <p className="text-xs font-bold text-center" style={{ color: 'var(--text-secondary)' }}>{t('dashboard.totalSales')}</p>
              <div className={`flex items-end justify-center mt-2 ${dir === 'rtl' ? 'flex-row-reverse' : ''}`} style={{ gap: '6px' }}>
                <span className="text-3xl font-black leading-none" style={{ color: 'var(--text-primary)' }}>{totalSales}</span>
                <span className="text-xs font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{t('dashboard.order')}</span>
              </div>
            </div>

            <div className="rounded-2xl flex flex-col items-center justify-center shadow-lg" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '24px' }}>
              <p className="text-xs font-bold text-center" style={{ color: 'var(--text-secondary)' }}>{t('dashboard.designs')}</p>
              <div className={`flex items-end justify-center mt-2 ${dir === 'rtl' ? 'flex-row-reverse' : ''}`} style={{ gap: '6px' }}>
                <span className="text-3xl font-black leading-none" style={{ color: 'var(--text-primary)' }}>{designCount}</span>
                <span className="text-xs font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{t('dashboard.design')}</span>
              </div>
            </div>

          </div>

          <p className="text-[10px] text-center text-[#8b6b43]" style={{ marginTop: '16px', marginBottom: '24px' }}>
            * سيتم خصم رصيدك تلقائياً عند طلب شراء كشرط خصم منك من المتجر
          </p>

          {/* Large English Stats Row */}
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" style={{ gap: '24px', marginTop: '16px' }}>
            
            <div className="rounded-2xl p-8 flex flex-col items-center justify-center shadow-2xl relative overflow-hidden h-48" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
              <Paintbrush size={32} className="text-[var(--accent-primary)] mb-4" />
              <p className="text-sm mb-2 font-semibold" style={{ color: 'var(--text-secondary)' }}>Designs Submitted</p>
              <span className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>{designCount}</span>
            </div>

            <div className="rounded-2xl p-8 flex flex-col items-center justify-center shadow-2xl relative overflow-hidden h-48" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
              <ShoppingCart size={32} className="text-[var(--accent-primary)] mb-4" />
              <p className="text-sm mb-2 font-semibold" style={{ color: 'var(--text-secondary)' }}>Total Sales</p>
              <span className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>{totalSales}</span>
            </div>

            <div className="rounded-2xl p-8 flex flex-col items-center justify-center shadow-2xl relative overflow-hidden h-48" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
              <Wallet size={32} className="text-[var(--accent-primary)] mb-4" />
              <p className="text-sm mb-2 font-semibold" style={{ color: 'var(--text-secondary)' }}>Total Commissions</p>
              <div className="flex items-baseline gap-1" dir="ltr">
                <span className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>{user.discountBalance}</span>
                <span className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>.ع ج</span>
              </div>
            </div>

            <div className="rounded-2xl p-8 flex flex-col items-center justify-center shadow-2xl relative overflow-hidden h-48" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
              <Users size={32} className="text-[var(--accent-primary)] mb-4" />
              <p className="text-sm mb-2 font-semibold" style={{ color: 'var(--text-secondary)' }}>Referrals</p>
              <span className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>{user.referredUsers}</span>
            </div>

          </div>

        </div>


      </div>
    </div>
  );
}
