import { useState, useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import NavIcon from './icons/NavIcon';
import ThemeToggle from './ThemeToggle';
import { AuthService } from '../services/authService';
import moderationService from '../services/moderationService';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' as const },
  { path: '/subjects', label: 'Môn học', icon: 'subjects' as const },
  { path: '/questions', label: 'Câu hỏi', icon: 'questions' as const },
  { path: '/exams', label: 'Đề thi', icon: 'exams' as const },
  { path: '/documents', label: 'Tài liệu', icon: 'documents' as const },
  { path: '/users', label: 'Người dùng', icon: 'users' as const },
  { path: '/chat', label: 'Chat tổng', icon: 'chat' as const },
  { path: '/forum', label: 'Diễn đàn', icon: 'forum' as const },
  { path: '/study-spaces', label: 'Phòng học', icon: 'study-spaces' as const },
];

export default function Sidebar() {
  const [pendingCount, setPendingCount] = useState(0);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [userInfo, setUserInfo] = useState({ fullName: '', email: '', role: '' });
  const [isAdmin, setIsAdmin] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Get user info from localStorage
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
    // Poll every 30 seconds to update badge
    const interval = setInterval(fetchPendingCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
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
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'moderator':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'user':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      default:
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  };

  return (
    <aside className="w-72 min-h-screen relative z-20 flex flex-col animate-slide-in-left bg-slate-900 border-r border-slate-800">
      <div className="relative px-6 py-6 border-b border-slate-700">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-white"
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #a78bfa 100%)',
                boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)',
              }}
            >
              <NavIcon name="logo" size={20} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white font-[family-name:var(--font-display)]">
                StudyHub
              </h1>
              <p className="text-xs text-indigo-300/70">Admin Panel</p>
            </div>
          </div>
          
          {/* User & Settings Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="relative w-11 h-11 rounded-xl flex items-center justify-center bg-white/10 hover:bg-white/15 text-white transition-all duration-300 group"
              title="Tài khoản & Cài đặt"
            >
              {/* Glow effect */}
              <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-indigo-500/20" />
              
              {/* Icon */}
              <div className="relative transition-transform duration-300 group-hover:scale-110">
                {showUserDropdown ? (
                  <NavIcon name="chevronUp" size={18} />
                ) : (
                  <NavIcon name="user" size={18} />
                )}
              </div>
              
              {/* Online status dot */}
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-[#1a1a2e]" />
            </button>

            {/* Dropdown Menu */}
            {showUserDropdown && (
              <div 
                className="absolute right-0 top-14 w-72 rounded-xl overflow-hidden animate-fade-in-up z-50"
                style={{
                  background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
                  backdropFilter: 'blur(20px)',
                }}
              >
                {/* User Details Section */}
                <div className="p-4 border-b border-white/10">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-lg font-bold shadow-lg">
                      {userInfo.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{userInfo.fullName}</p>
                      <p className="text-xs text-slate-400 truncate">{userInfo.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs px-2.5 py-1 rounded-full border ${getRoleBadgeColor(userInfo.role)}`}>
                      {userInfo.role}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      Đang hoạt động
                    </span>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="p-2">
                  <button
                    onClick={() => {
                      // Navigate to settings or show settings modal
                      setShowUserDropdown(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/10 transition-all duration-200"
                  >
                    <NavIcon name="settings" size={16} />
                    <span>Cài đặt tài khoản</span>
                  </button>
                  
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200"
                  >
                    <NavIcon name="logout" size={16} />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <ThemeToggle />
        </div>
      </div>

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
                  `group relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? 'text-white'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <div
                        className="absolute left-3 right-3 h-[44px] rounded-xl -z-10 transition-all duration-300"
                        style={{
                          background: 'linear-gradient(135deg, rgba(99,102,241,0.25) 0%, rgba(167,139,250,0.15) 100%)',
                          border: '1px solid rgba(99, 102, 241, 0.3)',
                          boxShadow: '0 4px 16px rgba(99, 102, 241, 0.2)',
                        }}
                      />
                    )}
                    <span className={`nav-icon-box ${isActive ? 'active scale-110' : 'inactive group-hover:scale-105'}`}>
                      <NavIcon name={item.icon} size={17} />
                    </span>
                    <span className="relative">{item.label}</span>
                    {isActive && (
                      <div className="ml-auto w-1 h-5 rounded-full bg-cyan-400" />
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}
          
          {/* Moderation - Special section for admin - only show for admin users */}
          {isAdmin && (
            <li className="pt-4 mt-4 border-t border-white/10">
              <NavLink
                to="/moderation"
                className={({ isActive }) =>
                  `group relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? 'text-white'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <div
                        className="absolute left-3 right-3 h-[44px] rounded-xl -z-10 transition-all duration-300"
                        style={{
                          background: 'linear-gradient(135deg, rgba(234,179,8,0.25) 0%, rgba(251,191,36,0.15) 100%)',
                          border: '1px solid rgba(234,179,8,0.3)',
                          boxShadow: '0 4px 16px rgba(234,179,8,0.2)',
                        }}
                      />
                    )}
                    <span className={`nav-icon-box ${isActive ? 'active scale-110' : 'inactive group-hover:scale-105'}`}>
                      <NavIcon name="moderation" size={17} />
                    </span>
                    <span className="relative">Kiểm duyệt</span>
                    {pendingCount > 0 && (
                      <span className="ml-auto bg-yellow-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                        {pendingCount > 99 ? '99+' : pendingCount}
                      </span>
                    )}
                    {isActive && (
                      <div className="ml-auto w-1 h-5 rounded-full bg-cyan-400" />
                    )}
                  </>
                )}
              </NavLink>
            </li>
          )}
        </ul>
      </nav>
    </aside>
  );
}
