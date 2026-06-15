import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function GoogleSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    const userRaw = searchParams.get('user');

    if (token && userRaw) {
      try {
        const user = JSON.parse(decodeURIComponent(userRaw));
        localStorage.setItem('wearurway_token', token);
        localStorage.setItem('wearurway_user', JSON.stringify(user));
        navigate('/dashboard', { replace: true });
      } catch {
        navigate('/auth?error=parse_failed', { replace: true });
      }
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
