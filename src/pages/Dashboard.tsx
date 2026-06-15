import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, Copy, CheckCircle } from 'lucide-react';
import Navbar from '../components/Navbar';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [designCount, setDesignCount] = useState(0);
  const [totalSales, setTotalSales] = useState(0);

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

  if (!user) return <div className="min-h-screen flex items-center justify-center" style={{ color: 'var(--text-primary)' }}>جاري التحميل...</div>;

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
    <div className="flex-1 min-h-screen flex flex-col font-['Inter']" style={{ color: 'var(--text-primary)' }} dir="rtl">
      <Navbar />

      <div className="flex-1 w-full flex flex-col items-center p-6 md:p-10">
        
        {/* Main Content Container matching the reference image layout */}
        <div className="max-w-7xl w-full mx-auto flex flex-col gap-8">
          
          {/* Top Title & Subtitle */}
          <div className="text-center mb-6">
            <h1 className="text-3xl md:text-4xl font-black mb-3 flex items-center justify-center gap-3" style={{ color: 'var(--text-primary)' }}>
               أهلاً بك، <span style={{ color: 'var(--accent-primary)' }}>{user.name}</span>!
            </h1>
            <p className="text-gray-400 text-sm md:text-base">
              مرحباً بك في لوحة التحكم الخاصة بك. تابع أرباحك وتصاميمك من هنا.
            </p>
          </div>

          {/* Wide Top Box: Affiliate Link (Like 'إدارة التصنيفات' in ref) */}
          <div className="w-full rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6 shadow-xl" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <div className="flex items-center gap-3 min-w-fit">
              <Layers size={24} style={{ color: 'var(--accent-primary)' }} />
              <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>رابط الإحالة الخاص بك</h2>
            </div>
            
            <p className="text-sm flex-1 hidden lg:block" style={{ color: 'var(--text-muted)' }}>
              شارك هذا الرابط مع أصدقائك أو عملائك واحصل على <span style={{ color: 'var(--accent-primary)' }}>50 جنيه</span> عن كل شراء.
            </p>

            <div className="flex items-center rounded-xl p-1.5 gap-2 w-full md:w-auto flex-1 md:flex-none" style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
              <input
                type="text"
                readOnly
                value={affiliateLink}
                className="bg-transparent flex-1 outline-none text-xs md:text-sm text-left px-3 font-mono min-w-[200px]"
                style={{ color: 'var(--text-primary)' }}
                dir="ltr"
              />
              <button
                onClick={handleCopy}
                className="font-semibold px-4 py-2 text-sm rounded-lg transition-all flex items-center justify-center shrink-0 gap-2 border"
                style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
              >
                {copied ? <CheckCircle size={16} style={{ color: 'var(--accent-primary)' }} /> : <Copy size={16} />}
                {copied ? 'تم النسخ' : 'نسخ'}
              </button>
            </div>
          </div>

          {/* Stats Row (4 columns layout style) */}
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Stat 1: Balance */}
            <div className="rounded-2xl p-6 flex flex-col justify-between shadow-xl" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
              <p className="text-sm mb-4 font-semibold" style={{ color: 'var(--text-muted)' }}>رصيدك الحالي</p>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-black" style={{ color: 'var(--accent-primary)' }}>{user.discountBalance}</span>
                <span className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>ج.م</span>
              </div>
            </div>

            {/* Stat 2: Referrals */}
            <div className="rounded-2xl p-6 flex flex-col justify-between shadow-xl" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
              <p className="text-sm mb-4 font-semibold" style={{ color: 'var(--text-muted)' }}>العملاء المحالين</p>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>{user.referredUsers}</span>
                <span className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>شخص</span>
              </div>
            </div>

            {/* Stat 3: Total Sales */}
            <div className="rounded-2xl p-6 flex flex-col justify-between shadow-xl" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
              <p className="text-sm mb-4 font-semibold" style={{ color: 'var(--text-muted)' }}>المبيعات الإجمالية</p>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>{totalSales}</span>
                <span className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>عملية</span>
              </div>
            </div>

            <div className="rounded-2xl p-6 flex flex-col justify-between shadow-xl" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
              <p className="text-sm mb-4 font-semibold" style={{ color: 'var(--text-muted)' }}>التصاميم المنشورة</p>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>{designCount}</span>
                <span className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>تصميم</span>
              </div>
            </div>

          </div>

          <p className="text-xs text-gray-500 text-center mt-4">
            * سيتم خصم رصيدك تلقائياً عند قيامك بشراء تيشيرت خاص بك من المتجر.
          </p>

        </div>
      </div>
    </div>
  );
}
