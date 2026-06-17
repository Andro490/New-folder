import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function GoogleSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');

    if (token) {
      localStorage.setItem('wearurway_token', token);
      
      const API_BASE = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:3001' : '');
      
      fetch(`${API_BASE}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(res => {
        if (!res.ok) throw new Error('Fetch failed');
        return res.json();
      })
      .then(data => {
        if (data.success && data.user) {
          localStorage.setItem('wearurway_user', JSON.stringify(data.user));
          navigate('/dashboard', { replace: true });
        } else {
          throw new Error('Invalid user data');
        }
      })
      .catch(() => {
        localStorage.removeItem('wearurway_token');
        navigate('/auth?error=parse_failed', { replace: true });
      });
    } else {
      navigate('/auth?error=missing_params', { replace: true });
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ color: 'var(--text-primary)' }}>
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4"
          style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }} />
        <p className="text-lg font-semibold">جارٍ تسجيل الدخول بحساب جوجل...</p>
      </div>
    </div>
  );
}
