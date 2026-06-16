import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useLanguage } from '../contexts/LanguageContext';

type AuthStep = 'credentials' | 'otp';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState<AuthStep>('credentials');

  // Credentials fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  // OTP fields — 6 separate inputs
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  const navigate = useNavigate();
  const { t, dir } = useLanguage();
  const [searchParams] = useSearchParams();

  const API_BASE = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:3001' : '');

  useEffect(() => {
    const oauthError = searchParams.get('error');
    if (oauthError === 'google_failed') setError('فشل تسجيل الدخول بحساب جوجل. حاول مرة أخرى.');
  }, [searchParams]);

  // Countdown timer for resend
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setTimeout(() => setResendCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  // ── Step 1: Send OTP ──────────────────────────────────────────────
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, isLogin }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'حدث خطأ');

      setSuccess(`✅ تم إرسال الكود إلى ${email}`);
      setStep('otp');
      setResendCountdown(60);
      setTimeout(() => otpRefs.current[0]?.focus(), 200);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ── OTP input handlers ──────────────────────────────────────────
  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/[^0-9]/g, '').slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = digit;
    setOtpDigits(newDigits);
    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    const newDigits = [...otpDigits];
    pasted.split('').forEach((ch, i) => { newDigits[i] = ch; });
    setOtpDigits(newDigits);
    otpRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  // ── Step 2: Verify OTP ───────────────────────────────────────────
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const otp = otpDigits.join('');
    if (otp.length !== 6) { setError('أدخل الكود كاملاً (6 أرقام)'); return; }
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'كود خاطئ');

      localStorage.setItem('wearurway_token', data.token);
      localStorage.setItem('wearurway_user', JSON.stringify(data.user));
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    color: 'var(--text-primary)',
    padding: '12px 16px',
    marginBottom: '16px',
    borderRadius: '8px',
    width: '100%',
    outline: 'none',
    fontSize: '14px',
  };

  return (
    <div className="flex-1 min-h-screen flex flex-col font-['Inter']" style={{ color: 'var(--text-primary)' }} dir={dir}>
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div
          className="w-full max-w-md rounded-2xl shadow-2xl relative overflow-hidden"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '2rem', borderRadius: '1rem' }}
        >
          {/* ── Header ── */}
          <h2
            className="text-3xl font-black text-center"
            style={{ color: 'var(--accent-primary)', marginBottom: '0.5rem', fontSize: '1.75rem' }}
          >
            {step === 'credentials'
              ? (isLogin ? 'تسجيل الدخول' : 'إنشاء حساب')
              : '📨 تحقق من بريدك'}
          </h2>
          {step === 'otp' && (
            <p className="text-center text-sm" style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              أرسلنا كود التحقق إلى <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>
            </p>
          )}
          {step === 'credentials' && (
            <p className="text-center text-xs" style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              {isLogin ? 'أدخل بياناتك وسنرسل لك كود تحقق' : 'سنرسل كود تحقق على بريدك لتأكيد التسجيل'}
            </p>
          )}

          {/* ── Error / Success Messages ── */}
          {error && (
            <div style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '12px', borderRadius: '8px', marginBottom: '16px', textAlign: 'center', fontSize: '13px' }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{ backgroundColor: 'rgba(34,197,94,0.1)', border: '1px solid #22c55e', color: '#22c55e', padding: '12px', borderRadius: '8px', marginBottom: '16px', textAlign: 'center', fontSize: '13px' }}>
              {success}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              STEP 1 — Credentials Form
          ══════════════════════════════════════════════════════════ */}
          {step === 'credentials' && (
            <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column' }}>
              {!isLogin && (
                <input
                  type="text"
                  placeholder="الاسم الكامل"
                  style={inputStyle}
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onFocus={e => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
                  onBlur={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
                  required
                />
              )}
              <input
                type="email"
                placeholder="البريد الإلكتروني"
                style={inputStyle}
                value={email}
                onChange={e => setEmail(e.target.value)}
                onFocus={e => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
                onBlur={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
                required
                dir="ltr"
              />
              <input
                type="password"
                placeholder="كلمة المرور"
                style={inputStyle}
                value={password}
                onChange={e => setPassword(e.target.value)}
                onFocus={e => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
                onBlur={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
                required
                dir="ltr"
              />
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  backgroundColor: 'var(--accent-primary)',
                  color: '#000',
                  padding: '14px 24px',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '15px',
                  border: 'none',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.7 : 1,
                  marginBottom: '12px',
                }}
              >
                {isLoading ? 'جاري الإرسال...' : '📩 إرسال كود التحقق'}
              </button>
            </form>
          )}

          {/* ══════════════════════════════════════════════════════════
              STEP 2 — OTP Entry
          ══════════════════════════════════════════════════════════ */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {/* 6-box OTP input */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '28px', direction: 'ltr' }}>
                {otpDigits.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => { otpRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(i, e)}
                    onPaste={handleOtpPaste}
                    style={{
                      width: '48px',
                      height: '60px',
                      textAlign: 'center',
                      fontSize: '24px',
                      fontWeight: 900,
                      borderRadius: '10px',
                      border: digit ? '2px solid var(--accent-primary)' : '2px solid var(--border-color)',
                      backgroundColor: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                    }}
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={isLoading || otpDigits.join('').length !== 6}
                style={{
                  width: '100%',
                  backgroundColor: otpDigits.join('').length === 6 ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                  color: otpDigits.join('').length === 6 ? '#000' : 'var(--text-muted)',
                  padding: '14px 24px',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '15px',
                  border: 'none',
                  cursor: isLoading || otpDigits.join('').length !== 6 ? 'not-allowed' : 'pointer',
                  marginBottom: '16px',
                }}
              >
                {isLoading ? 'جاري التحقق...' : '✅ تأكيد الكود'}
              </button>

              {/* Resend + Back */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '100%' }}>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={resendCountdown > 0 || isLoading}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: resendCountdown > 0 ? 'not-allowed' : 'pointer',
                    color: resendCountdown > 0 ? 'var(--text-muted)' : 'var(--accent-primary)',
                    fontSize: '13px',
                    fontWeight: 600,
                  }}
                >
                  {resendCountdown > 0 ? `إعادة الإرسال بعد ${resendCountdown}ث` : '🔄 إعادة إرسال الكود'}
                </button>
                <button
                  type="button"
                  onClick={() => { setStep('credentials'); setError(''); setSuccess(''); setOtpDigits(['','','','','','']); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '12px' }}
                >
                  ← تغيير البريد الإلكتروني
                </button>
              </div>
            </form>
          )}

          {/* ── Divider + Google (only on credentials step) ── */}
          {step === 'credentials' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', margin: '8px 0 16px' }}>
                <div style={{ flex: 1, height: 1, backgroundColor: 'var(--border-color)' }} />
                <span style={{ margin: '0 12px', color: 'var(--text-muted)', fontSize: '12px' }}>أو</span>
                <div style={{ flex: 1, height: 1, backgroundColor: 'var(--border-color)' }} />
              </div>
              <GoogleButton apiBase={API_BASE} />
              <p style={{ marginTop: '16px', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>
                {isLogin ? 'مش عندك حساب؟' : 'عندك حساب؟'}
                <button
                  onClick={() => { setIsLogin(!isLogin); setError(''); setSuccess(''); }}
                  style={{ color: 'var(--accent-primary)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', marginRight: '4px' }}
                >
                  {isLogin ? 'سجّل الآن' : 'سجّل دخول'}
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
function GoogleButton({ apiBase }: { apiBase: string }) {
  return (
    <button
      type="button"
      onClick={() => { window.location.href = `${apiBase}/api/auth/google`; }}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        padding: '12px 24px',
        borderRadius: '10px',
        fontWeight: 700,
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        color: 'var(--text-primary)',
        cursor: 'pointer',
        fontSize: '14px',
        transition: 'all 0.2s',
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
      <svg width="20" height="20" viewBox="0 0 48 48" fill="none">
        <path d="M47.532 24.552c0-1.636-.147-3.2-.412-4.706H24v8.898h13.204c-.57 3.07-2.306 5.67-4.916 7.412v6.16h7.958c4.654-4.284 7.286-10.602 7.286-17.764z" fill="#4285F4"/>
        <path d="M24 48c6.48 0 11.914-2.148 15.886-5.824l-7.958-6.16c-2.21 1.482-5.04 2.356-7.928 2.356-6.096 0-11.258-4.116-13.104-9.646H2.654v6.358C6.606 42.892 14.756 48 24 48z" fill="#34A853"/>
        <path d="M10.896 28.726A14.4 14.4 0 0 1 10.4 24c0-1.654.286-3.26.496-4.726V12.916H2.654A24.01 24.01 0 0 0 0 24c0 3.876.928 7.548 2.654 10.726l8.242-6z" fill="#FBBC05"/>
        <path d="M24 9.628c3.436 0 6.518 1.182 8.944 3.498l6.708-6.708C35.908 2.412 30.478 0 24 0 14.756 0 6.606 5.108 2.654 13.274l8.242 6.002C12.742 13.744 17.904 9.628 24 9.628z" fill="#EA4335"/>
      </svg>
      متابعة بحساب جوجل
    </button>
  );
}
