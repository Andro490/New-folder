import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useLanguage } from '../contexts/LanguageContext';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { t, dir } = useLanguage();
  const [searchParams] = useSearchParams();

  // Handle error from Google OAuth redirect
  useEffect(() => {
    const oauthError = searchParams.get('error');
    if (oauthError === 'google_failed') setError('فشل تسجيل الدخول بحساب جوجل. حاول مرة أخرى.');
  }, [searchParams]);

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
    <div className="flex-1 min-h-screen flex flex-col font-['Inter']" style={{ color: 'var(--text-primary)' }} dir={dir}>
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md p-8 rounded-2xl shadow-2xl relative overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="absolute inset-0 opacity-0 transition-opacity duration-500 pointer-events-none" style={{ background: 'linear-gradient(135deg, var(--accent-glow), transparent)' }}></div>
          <h2 className="text-3xl font-black text-center mb-6" style={{ color: 'var(--accent-primary)' }}>
            {isLogin ? t('auth.loginTitle') : t('auth.registerTitle')}
          </h2>

          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-500 p-3 rounded mb-4 text-center text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 relative z-10">
            {!isLogin && (
              <input
                type="text"
                placeholder={t('auth.fullName')}
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
              placeholder={t('auth.email')}
              className={`p-3 rounded focus:outline-none transition-colors ${dir === 'rtl' ? 'text-right' : 'text-left'}`}
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
              placeholder={t('auth.password')}
              className={`p-3 rounded focus:outline-none transition-colors ${dir === 'rtl' ? 'text-right' : 'text-left'}`}
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              onFocus={e => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
              onBlur={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              dir="ltr"
            />
            <button
              type="submit"
              className="mt-2 py-3 font-bold rounded transition-all"
              style={{ backgroundColor: 'var(--accent-primary)', color: '#000' }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 20px var(--accent-glow)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
            >
              {isLogin ? t('auth.loginBtn') : t('auth.registerBtn')}
            </button>
          </form>

          {/* ── Divider ── */}
          <div className="relative my-6 flex items-center z-10">
            <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border-color)' }} />
            <span className="mx-3 text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>أو</span>
            <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border-color)' }} />
          </div>

          {/* ── Google OAuth Button ── */}
          <GoogleButton />

          <p className="mt-6 text-center text-sm relative z-10" style={{ color: 'var(--text-muted)' }}>
            {isLogin ? t('auth.noAccount') : t('auth.haveAccount')}
            <button onClick={() => setIsLogin(!isLogin)} className="hover:underline font-bold ms-1" style={{ color: 'var(--accent-primary)' }}>
              {isLogin ? t('auth.registerNow') : t('auth.loginNow')}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
function GoogleButton() {
  const API_BASE = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:3001' : '');

  return (
    <button
      type="button"
      onClick={() => { window.location.href = `${API_BASE}/api/auth/google`; }}
      className="w-full flex items-center justify-center gap-3 py-3 rounded-xl font-bold transition-all duration-300 relative z-10"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        color: 'var(--text-primary)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = '#4285F4';
        e.currentTarget.style.boxShadow = '0 0 20px rgba(66,133,244,0.2)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border-color)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Official Google "G" SVG */}
      <svg width="20" height="20" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M47.532 24.552c0-1.636-.147-3.2-.412-4.706H24v8.898h13.204c-.57 3.07-2.306 5.67-4.916 7.412v6.16h7.958c4.654-4.284 7.286-10.602 7.286-17.764z" fill="#4285F4"/>
        <path d="M24 48c6.48 0 11.914-2.148 15.886-5.824l-7.958-6.16c-2.21 1.482-5.04 2.356-7.928 2.356-6.096 0-11.258-4.116-13.104-9.646H2.654v6.358C6.606 42.892 14.756 48 24 48z" fill="#34A853"/>
        <path d="M10.896 28.726A14.4 14.4 0 0 1 10.4 24c0-1.654.286-3.26.496-4.726V12.916H2.654A24.01 24.01 0 0 0 0 24c0 3.876.928 7.548 2.654 10.726l8.242-6z" fill="#FBBC05"/>
        <path d="M24 9.628c3.436 0 6.518 1.182 8.944 3.498l6.708-6.708C35.908 2.412 30.478 0 24 0 14.756 0 6.606 5.108 2.654 13.274l8.242 6.002C12.742 13.744 17.904 9.628 24 9.628z" fill="#EA4335"/>
      </svg>
      متابعة بحساب جوجل
    </button>
  );
}
