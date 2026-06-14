import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

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

      // Show debug info if response is not ok
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`[${response.status}] URL: ${url} | Response: ${text || 'empty'}`);
      }

      const data = await response.json();
      localStorage.setItem('wearurway_token', data.token);
      localStorage.setItem('wearurway_user', JSON.stringify(data.user));
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="flex-1 min-h-screen flex flex-col font-['Inter']" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md p-8 rounded-2xl shadow-2xl relative overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <div className="absolute inset-0 opacity-0 transition-opacity duration-500 pointer-events-none" style={{ background: 'linear-gradient(135deg, var(--accent-glow), transparent)' }}></div>
        <h2 className="text-3xl font-black text-center mb-6" style={{ color: 'var(--accent-primary)' }}>
          {isLogin ? 'تسجيل الدخول' : 'إنشاء حساب'}
        </h2>
        {error && <div className="bg-red-500/20 border border-red-500 text-red-500 p-3 rounded mb-4 text-center text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 relative z-10" dir="rtl">
          {!isLogin && (
            <input
              type="text"
              placeholder="الاسم كامل"
              className="p-3 rounded focus:outline-none transition-colors"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              onFocus={e => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
              onBlur={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          )}
          <input
            type="email"
            placeholder="البريد الإلكتروني"
            className="p-3 rounded focus:outline-none transition-colors text-right"
            style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            onFocus={e => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
            onBlur={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            dir="ltr"
          />
          <input
            type="password"
            placeholder="كلمة المرور"
            className="p-3 rounded focus:outline-none transition-colors text-right"
            style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            onFocus={e => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
            onBlur={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            dir="ltr"
          />
          <button type="submit" className="mt-2 py-3 font-bold rounded transition-all" style={{ backgroundColor: 'var(--accent-primary)', color: '#000' }} onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 20px var(--accent-glow)'} onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
            {isLogin ? 'دخول' : 'تسجيل'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm relative z-10" style={{ color: 'var(--text-muted)' }}>
          {isLogin ? 'ليس لديك حساب؟ ' : 'لديك حساب بالفعل؟ '}
          <button onClick={() => setIsLogin(!isLogin)} className="hover:underline font-bold" style={{ color: 'var(--accent-primary)' }}>
            {isLogin ? 'سجل الآن' : 'سجل دخول'}
          </button>
        </p>
        </div>
      </div>
    </div>
  );
}
