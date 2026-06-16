import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag, Palette, LogOut, LayoutDashboard, ChevronDown, Settings, Globe, Moon, Sun } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import logoImg from '../assets/favicon.png';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { t, dir, language, setLanguage } = useLanguage();

  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || document.documentElement.classList.contains('dark');
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const userRaw = localStorage.getItem('wearurway_user');
  const user = userRaw ? JSON.parse(userRaw) : null;
  const firstLetter = user?.name ? user.name.charAt(0).toUpperCase() : '?';

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
        backgroundColor: 'var(--bg-card)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-color)',
        boxShadow: '0 1px 12px rgba(139, 107, 67, 0.08)',
      }}
      dir={dir}
    >
      {/* Logo */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 shrink-0"
        >
          <img
            src={logoImg}
            alt="PrintStudio Logo"
            className="w-8 h-8 rounded shrink-0 object-contain"
            style={{ boxShadow: '0 0 10px rgba(139, 107, 67, 0.3)' }}
          />
          <span className="font-black text-base tracking-tight hidden md:block" style={{ color: 'var(--text-primary)' }}>
            Print<span style={{ color: 'var(--accent-primary)' }}>Studio</span>
          </span>
        </button>
        
        {/* Language Switcher */}
        <button
          onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
          className="flex items-center justify-center w-8 h-8 rounded-full transition-all text-[#8b6b43] hover:bg-[#8b6b43]/10"
          title="تغيير اللغة / Change Language"
        >
          <Globe size={18} />
        </button>

        {/* Dark Mode Switcher */}
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="flex items-center justify-center w-8 h-8 rounded-full transition-all"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--accent-glow)'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          title="تغيير المظهر / Toggle Theme"
        >
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      {/* Center Nav Links */}
      <div className="flex items-center gap-1">
        {/* Store */}
        <button
          onClick={() => navigate('/community')}
          className="flex items-center gap-2 rounded-full text-sm font-bold transition-all"
          style={{
            padding: '8px 20px',
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
          <span className="hidden sm:inline">{t('navbar.store')}</span>
        </button>

        {/* Design T-shirt */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 rounded-full text-sm font-bold transition-all"
          style={{
            padding: '8px 20px',
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
          <span className="hidden sm:inline">{t('navbar.design')}</span>
        </button>
      </div>

      {/* Right: User Avatar or Login */}
      <div className="flex items-center gap-3">
        {user ? (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(o => !o)}
              className="flex items-center justify-between px-1.5 py-1.5 rounded-full transition-all w-auto sm:w-[150px]"
              style={{ border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
              onMouseLeave={e => { if (!dropdownOpen) e.currentTarget.style.borderColor = 'var(--border-color)'; }}
            >
              {/* Avatar circle with first letter */}
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center font-black text-sm select-none shrink-0"
                style={{
                  background: 'linear-gradient(135deg, var(--accent-primary), #6a4f2d)',
                  color: '#f9f4e6',
                  boxShadow: '0 2px 8px rgba(139, 107, 67, 0.35)',
                  letterSpacing: '0.05em',
                }}
              >
                {firstLetter}
              </div>

              {/* Username (Center) */}
              <span className="flex-1 text-center hidden sm:block text-sm font-bold truncate px-2" style={{ color: 'var(--text-primary)' }}>
                {user.name}
              </span>

              {/* Chevron */}
              <div className="w-8 h-8 flex items-center justify-center shrink-0">
                <ChevronDown
                  size={16}
                  style={{
                    color: 'var(--text-muted)',
                    transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s',
                  }}
                />
              </div>
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div
                className={`absolute ${dir === 'rtl' ? 'left-0' : 'right-0'} top-full mt-2 w-48 rounded-md overflow-hidden shadow-lg z-50 transition-all`}
                style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
              >
                {/* User info header */}
                <div className="px-4 py-2.5 flex justify-between items-center border-b" style={{ borderColor: 'var(--border-color)' }}>
                  <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{user.name}</p>
                  <Settings size={16} style={{ color: 'var(--accent-primary)' }} />
                </div>

                {/* Menu items */}
                <div className="flex flex-col">
                  <button
                    onClick={() => { navigate('/dashboard'); setDropdownOpen(false); }}
                    className={`w-full flex items-center ${dir === 'rtl' ? 'justify-end' : 'justify-start flex-row-reverse'} gap-3 px-4 py-2 text-[13px] font-bold transition-colors border-b hover:bg-[var(--accent-glow)]`}
                    style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                  >
                    <span>{t('navbar.dashboard')}</span>
                    <LayoutDashboard size={15} style={{ color: 'var(--text-muted)' }} />
                  </button>

                  {(user.isAdmin || user.name === 'ANDRO') && (
                    <button
                      onClick={() => { navigate('/admin'); setDropdownOpen(false); }}
                      className={`w-full flex items-center ${dir === 'rtl' ? 'justify-end' : 'justify-start flex-row-reverse'} gap-3 px-4 py-2 text-[13px] font-bold transition-colors border-b`}
                      style={{ color: 'var(--danger)', borderColor: 'var(--border-color)', background: 'linear-gradient(90deg, transparent 0%, var(--accent-glow) 100%)' }}
                    >
                      <span>{t('navbar.admin')}</span>
                      <LayoutDashboard size={15} style={{ color: 'var(--danger)' }} />
                    </button>
                  )}

                  <button
                    onClick={handleLogout}
                    className={`w-full flex items-center ${dir === 'rtl' ? 'justify-end' : 'justify-start flex-row-reverse'} gap-3 px-4 py-2 text-[13px] font-bold transition-colors hover:bg-[var(--danger)] hover:text-white`}
                    style={{ color: 'var(--danger)' }}
                  >
                    <span>{t('navbar.logout')}</span>
                    <LogOut size={15} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => navigate('/auth')}
            className="rounded-full text-sm font-bold transition-all"
            style={{ backgroundColor: 'var(--accent-primary)', color: '#fff8e8', padding: '10px 24px' }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 15px var(--accent-glow)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
          >
            {t('navbar.login')}
          </button>
        )}
      </div>
    </nav>
  );
}
