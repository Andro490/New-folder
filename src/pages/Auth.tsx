import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const API_BASE = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:3001' : '');
    const url = isLogin ? `${API_BASE}/api/auth/login` : `${API_BASE}/api/auth/register`;
    const payload = isLogin ? { email, password } : { name, email, password };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'حدث خطأ');
      }

      localStorage.setItem('wearurway_token', data.token);
      localStorage.setItem('wearurway_user', JSON.stringify(data.user));
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="flex-1 min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a] text-white font-['Inter'] px-4 py-12">
      <div className="w-full max-w-md p-8 bg-[#111] border border-[#222] rounded-2xl shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-[#f5c842]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
        <h2 className="text-3xl font-black text-center mb-6 text-[#f5c842]">
          {isLogin ? 'تسجيل الدخول' : 'إنشاء حساب'}
        </h2>
        {error && <div className="bg-red-500/20 border border-red-500 text-red-500 p-3 rounded mb-4 text-center text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 relative z-10" dir="rtl">
          {!isLogin && (
            <input
              type="text"
              placeholder="الاسم كامل"
              className="p-3 bg-[#1a1a1a] border border-[#333] rounded focus:outline-none focus:border-[#f5c842] transition-colors"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          )}
          <input
            type="email"
            placeholder="البريد الإلكتروني"
            className="p-3 bg-[#1a1a1a] border border-[#333] rounded focus:outline-none focus:border-[#f5c842] transition-colors text-right"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            dir="ltr"
          />
          <input
            type="password"
            placeholder="كلمة المرور"
            className="p-3 bg-[#1a1a1a] border border-[#333] rounded focus:outline-none focus:border-[#f5c842] transition-colors text-right"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            dir="ltr"
          />
          <button type="submit" className="mt-2 py-3 bg-[#f5c842] text-black font-bold rounded hover:bg-[#e6b72f] transition-colors">
            {isLogin ? 'دخول' : 'تسجيل'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-400 relative z-10">
          {isLogin ? 'ليس لديك حساب؟ ' : 'لديك حساب بالفعل؟ '}
          <button onClick={() => setIsLogin(!isLogin)} className="text-[#f5c842] hover:underline font-bold">
            {isLogin ? 'سجل الآن' : 'سجل دخول'}
          </button>
        </p>
      </div>
    </div>
  );
}
