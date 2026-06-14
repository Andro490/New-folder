import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, Copy, CheckCircle, LogOut } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [copied, setCopied] = useState(false);

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
          <button onClick={handleLogout} className="text-sm font-bold text-red-500 hover:text-red-400 transition-colors flex items-center gap-2">
            <LogOut size={16} /> خروج
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-6 mt-8">
        <div className="max-w-7xl w-full mx-auto flex flex-col">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-black mb-4">
              أهلاً بك، <span className="text-[#f5c842]">{user.name}</span>!
            </h1>
            <p className="text-gray-400 text-lg">
              مرحباً بك في لوحة التحكم الخاصة بك. تابع أرباحك وتصاميمك من هنا.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            {/* Stats Card */}
            <div className="bg-[#111] border border-[#222] rounded-3xl p-8 flex flex-col justify-center shadow-xl hover:border-[#333] transition-colors">
              <h2 className="text-xl font-bold mb-8 flex items-center justify-center gap-2 text-gray-300">
                إحصائياتك الحالية
              </h2>
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-[#050505] border border-[#1a1a1a] rounded-2xl p-6 text-center shadow-inner">
                  <p className="text-gray-500 text-sm mb-3">رصيدك الحالي</p>
                  <p className="text-5xl font-black text-[#f5c842]">
                    {user.discountBalance} <span className="text-base text-gray-500 font-normal">ج.م</span>
                  </p>
                </div>
                <div className="bg-[#050505] border border-[#1a1a1a] rounded-2xl p-6 text-center shadow-inner">
                  <p className="text-gray-500 text-sm mb-3">العملاء المحالين</p>
                  <p className="text-5xl font-black text-white">{user.referredUsers}</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 text-center mt-8 px-4 leading-relaxed">
                * سيتم خصم رصيدك تلقائياً عند قيامك بشراء تيشيرت خاص بك من المتجر.
              </p>
            </div>

            {/* Affiliate Card */}
            <div className="bg-[#111] border border-[#222] rounded-3xl p-8 relative overflow-hidden group shadow-xl hover:border-[#f5c842]/50 transition-colors">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#f5c842]/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none transition-all group-hover:bg-[#f5c842]/10"></div>

              <h2 className="text-2xl font-black mb-4 flex items-center gap-3 text-white">
                <Layers className="text-[#f5c842]" size={28} /> رابط الإحالة الخاص بك
              </h2>

              <p className="text-gray-400 mb-8 leading-relaxed text-sm md:text-base">
                شارك هذا الرابط مع أصدقائك أو عملائك. ستحصل على <span className="text-[#f5c842] font-black bg-[#f5c842]/10 px-2 py-1 rounded">50 جنيه</span> رصيد إضافي عن كل عميل يشتري من خلال الرابط الخاص بك.
              </p>

              <div className="flex items-center bg-[#050505] border border-[#333] rounded-xl p-2 gap-2 shadow-inner">
                <input
                  type="text"
                  readOnly
                  value={affiliateLink}
                  className="bg-transparent flex-1 outline-none text-sm md:text-base text-gray-300 text-left px-4 font-mono"
                  dir="ltr"
                />
                <button
                  onClick={handleCopy}
                  className="bg-[#f5c842] hover:bg-[#e6b72f] text-black font-bold px-6 py-3 rounded-lg transition-all flex items-center justify-center shrink-0 gap-2 shadow-lg hover:shadow-xl active:scale-95"
                  title="نسخ الرابط"
                >
                  {copied ? (
                    <>
                      <CheckCircle size={18} /> تم النسخ
                    </>
                  ) : (
                    <>
                      <Copy size={18} /> انسخ الرابط
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
