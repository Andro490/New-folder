import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag, Palette, LogOut, LayoutDashboard, ChevronDown, Zap } from 'lucide-react';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const userRaw = localStorage.getItem('wearurway_user');
  const user = userRaw ? JSON.parse(userRaw) : null;
  const firstLetter = user?.name ? user.name.charAt(0).toUpperCase() : '؟';

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('wearurway_token');
    localStorage.removeItem('wearurway_user');
    setDropdownOpen(false);
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav
      className="w-full flex items-center justify-between px-6 h-14 shrink-0 sticky top-0 z-50"
      style={{
        backgroundColor: 'rgba(243, 235, 210, 0.97)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-color)',
        boxShadow: '0 1px 12px rgba(139, 107, 67, 0.08)',
      }}
      dir="rtl"
    >
      {/* Logo */}
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 shrink-0"
      >
        <div
          className="w-7 h-7 rounded flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #b1894d, #6a4f2d)',
            boxShadow: '0 0 10px rgba(139, 107, 67, 0.3)',
          }}
        >
          <Zap size={13} color="#f3ebd2" fill="#f3ebd2" />
        </div>
        <span className="font-black text-base tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Print<span style={{ color: 'var(--accent-primary)' }}>Studio</span>
        </span>
      </button>

      {/* Center Nav Links */}
      <div className="flex items-center gap-1">
        {/* Store */}
        <button
          onClick={() => navigate('/community')}
          className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all"
          style={{
            backgroundColor: isActive('/community') ? 'var(--accent-primary)' : 'transparent',
            color: isActive('/community') ? '#fff8e8' : 'var(--text-primary)',
            border: isActive('/community') ? '1px solid var(--accent-primary)' : '1px solid transparent',
          }}
          onMouseEnter={e => {
            if (!isActive('/community')) {
              e.currentTarget.style.backgroundColor = 'var(--bg-card)';
              e.currentTarget.style.borderColor = 'var(--border-color)';
            }
          }}
          onMouseLeave={e => {
            if (!isActive('/community')) {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = 'transparent';
            }
          }}
        >
          <ShoppingBag size={15} />
          متجر
        </button>

        {/* Design T-shirt */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all"
          style={{
            backgroundColor: isActive('/editor') || isActive('/') || isActive('/fit') || isActive('/color') ? 'var(--accent-primary)' : 'transparent',
            color: isActive('/editor') || isActive('/') || isActive('/fit') || isActive('/color') ? '#fff8e8' : 'var(--text-primary)',
            border: '1px solid transparent',
          }}
          onMouseEnter={e => {
            const active = isActive('/editor') || isActive('/') || isActive('/fit') || isActive('/color');
            if (!active) {
              e.currentTarget.style.backgroundColor = 'var(--bg-card)';
              e.currentTarget.style.borderColor = 'var(--border-color)';
            }
          }}
          onMouseLeave={e => {
            const active = isActive('/editor') || isActive('/') || isActive('/fit') || isActive('/color');
            if (!active) {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = 'transparent';
            }
          }}
        >
          <Palette size={15} />
          صمم تيشيرتك
        </button>
      </div>

      {/* Right: User Avatar or Login */}
      <div className="flex items-center gap-3">
        {user ? (
          <div className="relative" ref={dropdownRef}>
            {/* Avatar Button */}
            <button
              onClick={() => setDropdownOpen(o => !o)}
              className="flex items-center gap-2 px-2 py-1 rounded-full transition-all"
              style={{ border: '1px solid var(--border-color)' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
              onMouseLeave={e => { if (!dropdownOpen) e.currentTarget.style.borderColor = 'var(--border-color)'; }}
            >
              {/* Avatar circle with first letter */}
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center font-black text-sm select-none"
                style={{
                  background: 'linear-gradient(135deg, var(--accent-primary), #6a4f2d)',
                  color: '#f9f4e6',
                  boxShadow: '0 2px 8px rgba(139, 107, 67, 0.35)',
                  letterSpacing: '0.05em',
                }}
              >
                {firstLetter}
              </div>
              <span className="hidden sm:block text-sm font-bold" style={{ color: 'var(--text-primary)', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.name}
              </span>
              <ChevronDown
                size={14}
                style={{
                  color: 'var(--text-muted)',
                  transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s',
                }}
              />
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div
                className="absolute left-0 top-full mt-2 w-52 rounded-xl overflow-hidden shadow-xl"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  boxShadow: '0 8px 30px rgba(139, 107, 67, 0.15)',
                }}
              >
                {/* User info header */}
                <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <p className="text-xs font-bold truncate" style={{ color: 'var(--text-primary)' }}>{user.name}</p>
                  <p className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>{user.email}</p>
                </div>

                {/* Menu items */}
                <div className="py-1">
                  <button
                    onClick={() => { navigate('/dashboard'); setDropdownOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-right transition-colors"
                    style={{ color: 'var(--text-primary)' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <LayoutDashboard size={15} style={{ color: 'var(--accent-primary)' }} />
                    لوحة التحكم
                  </button>

                  {user.isAdmin && (
                    <button
                      onClick={() => { navigate('/admin'); setDropdownOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-right transition-colors"
                      style={{ color: '#e74c3c' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <LayoutDashboard size={15} />
                      لوحة الإدارة
                    </button>
                  )}

                  <div style={{ height: 1, backgroundColor: 'var(--border-color)', margin: '4px 0' }} />

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-right transition-colors"
                    style={{ color: '#e74c3c' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fff5f5'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <LogOut size={15} />
                    تسجيل الخروج
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => navigate('/auth')}
            className="px-5 py-2 rounded-full text-sm font-bold transition-all"
            style={{ backgroundColor: 'var(--accent-primary)', color: '#fff8e8' }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 15px var(--accent-glow)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
          >
            تسجيل الدخول
          </button>
        )}
      </div>
    </nav>
  );
}
