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

      <div className="max-w-5xl w-full mx-auto p-6 md:p-10 mt-8">
        <h1 className="text-3xl font-black mb-2">أهلاً، <span className="text-[#f5c842]">{user.name}</span>!</h1>
        <p className="text-gray-400 mb-10">مرحباً بك في لوحة التحكم الخاصة بك.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Affiliate Card */}
          <div className="bg-[#111] border border-[#222] rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#f5c842]/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Layers className="text-[#f5c842]" /> رابط الإحالة الخاص بك
            </h2>
            <p className="text-sm text-gray-400 mb-6">
              شارك هذا الرابط مع أصدقائك أو عملائك. ستحصل على <span className="text-[#f5c842] font-bold">50 جنيه</span> رصيد عن كل عميل يشتري من خلال الرابط الخاص بك.
            </p>
            <div className="flex items-center bg-[#1a1a1a] border border-[#333] rounded p-2 gap-2">
              <input 
                type="text" 
                readOnly 
                value={affiliateLink} 
                className="bg-transparent flex-1 outline-none text-sm text-gray-300 text-left"
                dir="ltr"
              />
              <button 
                onClick={handleCopy}
                className="bg-[#333] hover:bg-[#444] text-white p-2 rounded transition-colors flex items-center justify-center shrink-0"
                title="نسخ الرابط"
              >
                {copied ? <CheckCircle size={16} className="text-green-400" /> : <Copy size={16} />}
              </button>
            </div>
          </div>

          {/* Stats Card */}
          <div className="bg-[#111] border border-[#222] rounded-2xl p-6 flex flex-col justify-center">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#050505] border border-[#1a1a1a] rounded-xl p-4 text-center">
                <p className="text-gray-500 text-sm mb-2">رصيدك الحالي</p>
                <p className="text-4xl font-black text-[#f5c842]">{user.discountBalance} <span className="text-sm">ج.م</span></p>
              </div>
              <div className="bg-[#050505] border border-[#1a1a1a] rounded-xl p-4 text-center">
                <p className="text-gray-500 text-sm mb-2">العملاء المحالين</p>
                <p className="text-4xl font-black text-white">{user.referredUsers}</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 text-center mt-6">
              سيتم خصم رصيدك تلقائياً عند قيامك بشراء تيشيرت خاص بك.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
