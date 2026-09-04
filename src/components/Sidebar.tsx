import { useState, useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import NavIcon from './icons/NavIcon';
import ThemeToggle from './ThemeToggle';
import { AuthService } from '../services/authService';
import moderationService from '../services/moderationService';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' as const },
  { path: '/progress', label: 'Tien do', icon: 'progress' as const },
  { path: '/subjects', label: 'Mon hoc', icon: 'subjects' as const },
  { path: '/questions', label: 'Cau hoi', icon: 'questions' as const },
  { path: '/exams', label: 'De thi', icon: 'exams' as const },
  { path: '/documents', label: 'Tai lieu', icon: 'documents' as const },
  { path: '/users', label: 'Nguoi dung', icon: 'users' as const },
  { path: '/chat', label: 'Chat tong', icon: 'chat' as const },
  { path: '/forum', label: 'Dien dan', icon: 'forum' as const },
  { path: '/study-spaces', label: 'Phong hoc', icon: 'study-spaces' as const },
  { path: '/live-sessions', label: 'Phong live', icon: 'live' as const },
];

export default function Sidebar() {
  const [pendingCount, setPendingCount] = useState(0);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [userInfo, setUserInfo] = useState({ fullName: '', email: '', role: '' });
  const [isAdmin, setIsAdmin] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const user = AuthService.getCurrentUser();
    if (user) {
      setUserInfo({
        fullName: user.fullName || 'Admin',
        email: user.email || 'admin@studyhub.com',
        role: user.role || 'Admin'
      });
      setIsAdmin(user.role?.toLowerCase() === 'admin' || user.role?.toLowerCase() === 'moderator');
    }
    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchPendingCount = async () => {
    try {
      const response = await moderationService.getPendingCount();
      setPendingCount(response.count);
    } catch (error) {
      console.error('Failed to fetch pending count:', error);
    }
  };

  const handleLogout = () => {
    AuthService.logout();
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-400 border-red-500/30';
      case 'moderator':
        return 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-400 border-yellow-500/30';
      case 'user':
        return 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border-green-500/30';
      default:
        return 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-400 border-blue-500/30';
    }
  };

  return (
    <aside className="w-72 min-h-screen relative z-20 flex flex-col animate-slide-in-left" 
      style={{
        background: 'linear-gradient(180deg, #0f0f1a 0%, #16213e 50%, #1a1a2e 100%)',
        borderRight: '1px solid rgba(255, 255, 255, 0.06)',
      }}
    >
      {/* Animated gradient border */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-60" />
      
      {/* Logo Section */}
      <div className="relative px-6 py-6" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white relative"
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
                boxShadow: '0 8px 32px rgba(99, 102, 241, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
              }}
            >
              <NavIcon name="logo" size={22} />
              {/* Glow effect */}
              <div className="absolute inset-0 rounded-xl animate-pulse" 
                style={{ background: 'rgba(99, 102, 241, 0.3)', filter: 'blur(8px)' }} 
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white font-[family-name:var(--font-display)] tracking-tight">
                StudyHub
              </h1>
              <p className="text-xs text-indigo-300/70">Learning Platform</p>
            </div>
          </div>
          
          {/* User Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="relative w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 group"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
              title="Tai khoan & Cai dat"
            >
              <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" 
                style={{ background: 'rgba(99, 102, 241, 0.2)' }} 
              />
              <div className="relative transition-transform duration-300 group-hover:scale-110">
                <NavIcon name="user" size={18} className="text-white/80 group-hover:text-white" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2" 
                style={{ borderColor: '#1a1a2e' }} 
              />
            </button>

            {showUserDropdown && (
              <div 
                className="absolute left-0 top-14 w-80 rounded-2xl overflow-hidden animate-fade-in-up z-50"
                style={{
                  background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 24px 48px rgba(0, 0, 0, 0.5)',
                }}
              >
                {/* User Details */}
                <div className="p-5" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <div className="flex items-center gap-4 mb-4">
                    <div 
                      className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-xl font-bold"
                      style={{
                        background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                        boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)',
                      }}
                    >
                      {(userInfo.fullName || 'A').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-semibold text-white truncate">{userInfo.fullName || 'Admin'}</p>
                      <p className="text-sm text-slate-400 truncate">{userInfo.email || 'admin@example.com'}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs px-3 py-1.5 rounded-full border ${getRoleBadgeColor(userInfo.role)}`}>
                      {userInfo.role || 'Admin'}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      Dang hoat dong
                    </span>
                  </div>
                </div>

                {/* Menu */}
                <div className="p-3 space-y-1">
                  <button
                    onClick={() => setShowUserDropdown(false)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-slate-300 hover:text-white transition-all duration-200"
                    style={{ background: 'transparent' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <NavIcon name="settings" size={18} className="text-slate-400" />
                    <span>Cai dat tai khoan</span>
                  </button>
                  
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-red-400 hover:text-red-300 transition-all duration-200"
                    style={{ background: 'transparent' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <NavIcon name="logout" size={18} />
                    <span>Dang xuat</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <ThemeToggle />
        </div>
      </div>

      {/* Navigation */}
      <nav className="relative flex-1 mt-4 px-3">
        <ul className="space-y-1">
          {navItems.map((item, index) => (
            <li
              key={item.path}
              className={`animate-fade-in-up stagger-${index + 1}`}
              style={{ animationFillMode: 'forwards' }}
            >
              <NavLink
                to={item.path}
                end={item.path === '/dashboard'}
                className={({ isActive }) =>
                  `group relative flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? 'text-white'
                      : 'text-slate-400 hover:text-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <div
                        className="absolute left-0 right-0 h-[52px] rounded-xl -z-10 transition-all duration-300"
                        style={{
                          background: 'linear-gradient(135deg, rgba(99,102,241,0.25) 0%, rgba(167,139,250,0.15) 100%)',
                          border: '1px solid rgba(99, 102, 241, 0.3)',
                          boxShadow: '0 4px 20px rgba(99, 102, 241, 0.25)',
                        }}
                      />
                    )}
                    <span 
                      className={`nav-icon-box ${isActive ? 'active scale-110' : 'inactive group-hover:scale-105'}`}
                      style={!isActive ? { background: 'rgba(255, 255, 255, 0.06)' } : {}}
                    >
                      <NavIcon name={item.icon} size={18} />
                    </span>
                    <span className="relative">{item.label}</span>
                    {isActive && (
                      <div className="ml-auto w-1.5 h-6 rounded-full bg-gradient-to-b from-cyan-400 to-indigo-500" />
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}
          
          {/* Moderation - Admin only */}
          {isAdmin && (
            <li className="pt-4 mt-4" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <NavLink
                to="/moderation"
                className={({ isActive }) =>
                  `group relative flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? 'text-white'
                      : 'text-slate-400 hover:text-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <div
                        className="absolute left-0 right-0 h-[52px] rounded-xl -z-10 transition-all duration-300"
                        style={{
                          background: 'linear-gradient(135deg, rgba(234,179,8,0.25) 0%, rgba(251,191,36,0.15) 100%)',
                          border: '1px solid rgba(234, 179, 8, 0.3)',
                          boxShadow: '0 4px 20px rgba(234, 179, 8, 0.2)',
                        }}
                      />
                    )}
                    <span 
                      className={`nav-icon-box ${isActive ? 'active scale-110' : 'inactive group-hover:scale-105'}`}
                      style={!isActive ? { background: 'rgba(255, 255, 255, 0.06)' } : {}}
                    >
                      <NavIcon name="moderation" size={18} />
                    </span>
                    <span className="relative">Kiem duyet</span>
                    {pendingCount > 0 && (
                      <span 
                        className="ml-auto px-2.5 py-0.5 rounded-full text-xs font-bold text-white min-w-[24px] text-center"
                        style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
                      >
                        {pendingCount > 99 ? '99+' : pendingCount}
                      </span>
                    )}
                    {isActive && (
                      <div className="ml-auto w-1.5 h-6 rounded-full bg-gradient-to-b from-cyan-400 to-indigo-500" />
                    )}
                  </>
                )}
              </NavLink>
            </li>
          )}

          {/* Achievements & Leaderboard - Gamification */}
          <li className="pt-4 mt-4" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <span className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Gamification
            </span>
          </li>
          <li>
            <NavLink
              to="/achievements"
              className={({ isActive }) =>
                `group relative flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                  isActive
                    ? 'text-white'
                    : 'text-slate-400 hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <div
                      className="absolute left-0 right-0 h-[52px] rounded-xl -z-10 transition-all duration-300"
                      style={{
                        background: 'linear-gradient(135deg, rgba(245,158,11,0.25) 0%, rgba(251,191,36,0.15) 100%)',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        boxShadow: '0 4px 20px rgba(245, 158, 11, 0.2)',
                      }}
                    />
                  )}
                  <span 
                    className={`nav-icon-box ${isActive ? 'active scale-110' : 'inactive group-hover:scale-105'}`}
                    style={!isActive ? { background: 'rgba(255, 255, 255, 0.06)' } : {}}
                  >
                    <NavIcon name="trophy" size={18} />
                  </span>
                  <span className="relative">Thanh tich</span>
                  {isActive && (
                    <div className="ml-auto w-1.5 h-6 rounded-full bg-gradient-to-b from-cyan-400 to-indigo-500" />
                  )}
                </>
              )}
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/leaderboard"
              className={({ isActive }) =>
                `group relative flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                  isActive
                    ? 'text-white'
                    : 'text-slate-400 hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <div
                      className="absolute left-0 right-0 h-[52px] rounded-xl -z-10 transition-all duration-300"
                      style={{
                        background: 'linear-gradient(135deg, rgba(236,72,153,0.25) 0%, rgba(244,63,94,0.15) 100%)',
                        border: '1px solid rgba(236, 72, 153, 0.3)',
                        boxShadow: '0 4px 20px rgba(236, 72, 153, 0.2)',
                      }}
                    />
                  )}
                  <span 
                    className={`nav-icon-box ${isActive ? 'active scale-110' : 'inactive group-hover:scale-105'}`}
                    style={!isActive ? { background: 'rgba(255, 255, 255, 0.06)' } : {}}
                  >
                    <NavIcon name="leaderboard" size={18} />
                  </span>
                  <span className="relative">Bang xep hang</span>
                  {isActive && (
                    <div className="ml-auto w-1.5 h-6 rounded-full bg-gradient-to-b from-cyan-400 to-indigo-500" />
                  )}
                </>
              )}
            </NavLink>
          </li>
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
        <div className="text-center">
          <p className="text-xs text-slate-500">StudyHub v1.0</p>
          <p className="text-xs text-slate-600 mt-1">2026</p>
        </div>
      </div>
    </aside>
  );
}
