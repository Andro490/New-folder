import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, Copy, CheckCircle, LogOut } from 'lucide-react';

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

  if (!user) return <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">جاري التحميل...</div>;

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
    <div className="flex-1 min-h-screen flex flex-col bg-[#0a0a0a] text-white font-['Inter']" dir="rtl">
      {/* Header */}
      <header className="flex items-center justify-between px-6 h-16 shrink-0 bg-[#050505]/85 backdrop-blur-md border-b border-white/5 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <span className="text-xl font-black tracking-widest text-white">
            ويرورواي <span className="text-[#f5c842]">Affiliate</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/')} className="text-sm font-bold text-gray-400 hover:text-white transition-colors">
            الرئيسية
          </button>
          <button onClick={() => navigate('/editor')} className="text-sm font-bold bg-[#f5c842] text-black px-4 py-2 rounded hover:bg-[#e6b72f] transition-colors">
            صمم تيشيرتك
          </button>
          {user.isAdmin && (
            <button onClick={() => navigate('/admin')} className="text-sm font-bold bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors">
              لوحة الإدارة
            </button>
          )}
          <button onClick={handleLogout} className="text-sm font-bold text-red-500 hover:text-red-400 transition-colors flex items-center gap-2">
            <LogOut size={16} /> خروج
          </button>
        </div>
      </header>

      <div className="flex-1 w-full flex flex-col items-center p-6 md:p-10">
        
        {/* Main Content Container matching the reference image layout */}
        <div className="max-w-7xl w-full mx-auto flex flex-col gap-8">
          
          {/* Top Title & Subtitle */}
          <div className="text-center mb-6">
            <h1 className="text-3xl md:text-4xl font-black mb-3 flex items-center justify-center gap-3">
               أهلاً بك، <span className="text-[#f5c842]">{user.name}</span>!
            </h1>
            <p className="text-gray-400 text-sm md:text-base">
              مرحباً بك في لوحة التحكم الخاصة بك. تابع أرباحك وتصاميمك من هنا.
            </p>
          </div>

          {/* Wide Top Box: Affiliate Link (Like 'إدارة التصنيفات' in ref) */}
          <div className="w-full bg-[#050505] border border-[#1a1a1a] rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6 shadow-xl">
            <div className="flex items-center gap-3 min-w-fit">
              <Layers className="text-[#f5c842]" size={24} />
              <h2 className="text-lg font-bold text-white">رابط الإحالة الخاص بك</h2>
            </div>
            
            <p className="text-sm text-gray-400 flex-1 hidden lg:block">
              شارك هذا الرابط مع أصدقائك أو عملائك واحصل على <span className="text-[#f5c842]">50 جنيه</span> عن كل شراء.
            </p>

            <div className="flex items-center bg-[#111] border border-[#222] rounded-xl p-1.5 gap-2 w-full md:w-auto flex-1 md:flex-none">
              <input
                type="text"
                readOnly
                value={affiliateLink}
                className="bg-transparent flex-1 outline-none text-xs md:text-sm text-gray-300 text-left px-3 font-mono min-w-[200px]"
                dir="ltr"
              />
              <button
                onClick={handleCopy}
                className="bg-[#222] hover:bg-[#333] text-white font-semibold px-4 py-2 text-sm rounded-lg transition-all flex items-center justify-center shrink-0 gap-2 border border-[#333]"
              >
                {copied ? <CheckCircle size={16} className="text-[#f5c842]" /> : <Copy size={16} />}
                {copied ? 'تم النسخ' : 'نسخ'}
              </button>
            </div>
          </div>

          {/* Stats Row (4 columns layout style) */}
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Stat 1: Balance */}
            <div className="bg-[#050505] border border-[#1a1a1a] rounded-2xl p-6 flex flex-col justify-between shadow-xl">
              <p className="text-gray-500 text-sm mb-4 font-semibold">رصيدك الحالي</p>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-black text-[#f5c842]">{user.discountBalance}</span>
                <span className="text-sm text-gray-500 mb-1">ج.م</span>
              </div>
            </div>

            {/* Stat 2: Referrals */}
            <div className="bg-[#050505] border border-[#1a1a1a] rounded-2xl p-6 flex flex-col justify-between shadow-xl">
              <p className="text-gray-500 text-sm mb-4 font-semibold">العملاء المحالين</p>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-black text-white">{user.referredUsers}</span>
                <span className="text-sm text-gray-500 mb-1">شخص</span>
              </div>
            </div>

            {/* Stat 3: Total Sales */}
            <div className="bg-[#050505] border border-[#1a1a1a] rounded-2xl p-6 flex flex-col justify-between shadow-xl">
              <p className="text-gray-500 text-sm mb-4 font-semibold">المبيعات الإجمالية</p>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-black text-white">{totalSales}</span>
                <span className="text-sm text-gray-500 mb-1">عملية</span>
              </div>
            </div>

            <div className="bg-[#050505] border border-[#1a1a1a] rounded-2xl p-6 flex flex-col justify-between shadow-xl">
              <p className="text-gray-500 text-sm mb-4 font-semibold">التصاميم المنشورة</p>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-black text-white">{designCount}</span>
                <span className="text-sm text-gray-500 mb-1">تصميم</span>
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
