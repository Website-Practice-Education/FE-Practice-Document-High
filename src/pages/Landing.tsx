import { Link } from 'react-router-dom';
import { AuthService } from '../services/authService';
import { useTheme } from '../contexts/ThemeContext';

export default function Landing() {
  const isAuthenticated = AuthService.isAuthenticated();
  const user = AuthService.getCurrentUser();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen relative overflow-hidden ${isDark ? 'bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900' : 'bg-gradient-to-br from-teal-50 via-white to-cyan-50'}`}>
      {/* Navigation */}
      <nav className="relative z-10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${isDark ? 'from-indigo-500 to-purple-600' : 'from-teal-400 to-cyan-500'} flex items-center justify-center ${isDark ? 'shadow-lg shadow-indigo-500/30' : 'shadow-lg shadow-teal-100'}`}>
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <span className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>StudyHub</span>
          </div>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className={`px-5 py-2 ${isDark ? 'text-slate-300 hover:text-indigo-400' : 'text-slate-600 hover:text-teal-600'} transition-colors font-medium`}
                >
                  Dashboard
                </Link>
                <div className={`flex items-center gap-3 pl-4 border-l ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                  <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${isDark ? 'from-indigo-500 to-purple-600' : 'from-teal-400 to-cyan-500'} flex items-center justify-center text-white text-sm font-bold`}>
                    {user?.fullName?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className={`font-medium hidden sm:block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{user?.fullName}</span>
                  <button
                    onClick={() => AuthService.logout()}
                    className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
                  >
                    Đăng xuất
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className={`px-5 py-2 ${isDark ? 'text-slate-300 hover:text-indigo-400' : 'text-slate-600 hover:text-teal-600'} transition-colors font-medium`}
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className={`px-5 py-2.5 bg-gradient-to-r ${isDark ? 'from-indigo-500 to-purple-600' : 'from-teal-500 to-cyan-500'} text-white rounded-lg hover:opacity-90 transition-all font-medium ${isDark ? 'shadow-lg shadow-indigo-500/30' : 'shadow-lg shadow-teal-200'}`}
                >
                  Đăng ký
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero section */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32">
        <div className="text-center max-w-4xl mx-auto">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 ${isDark ? 'bg-indigo-500/20 border border-indigo-500/30' : 'bg-teal-50 border border-teal-200'}`}>
            <span className={`w-2 h-2 rounded-full animate-pulse ${isDark ? 'bg-indigo-400' : 'bg-teal-400'}`} />
            <span className={`text-sm font-medium ${isDark ? 'text-indigo-300' : 'text-teal-600'}`}>Nền tảng học tập thông minh</span>
          </div>

          <h1 className={`text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>
            Học tập thông minh,
            <br />
            <span className={`bg-clip-text text-transparent bg-gradient-to-r ${isDark ? 'from-indigo-400 via-purple-400 to-indigo-400' : 'from-teal-500 via-cyan-500 to-teal-400'}`}>
              Thành công bền vững
            </span>
          </h1>

          <p className={`text-xl mb-10 max-w-2xl mx-auto ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Nền tảng quản lý học tập hiện đại với ngân hàng câu hỏi phong phú, 
            đề thi đa dạng và không gian học tập tương tác.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {!isAuthenticated && (
              <>
                <Link
                  to="/register"
                  className={`w-full sm:w-auto px-8 py-4 bg-gradient-to-r ${isDark ? 'from-indigo-500 to-purple-600' : 'from-teal-500 to-cyan-500'} text-white rounded-xl font-semibold text-lg hover:opacity-90 transition-all ${isDark ? 'shadow-lg shadow-indigo-500/30' : 'shadow-lg shadow-teal-200'} flex items-center justify-center gap-2`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Bắt đầu miễn phí
                </Link>
                <Link
                  to="/login"
                  className={`w-full sm:w-auto px-8 py-4 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2 ${isDark ? 'bg-slate-800/50 border border-slate-700 text-white hover:bg-slate-800' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'} ${isDark ? 'shadow-sm' : 'shadow-sm'}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Đăng nhập
                </Link>
              </>
            )}
            {isAuthenticated && (
              <Link
                to="/dashboard"
                className={`w-full sm:w-auto px-8 py-4 bg-gradient-to-r ${isDark ? 'from-indigo-500 to-purple-600' : 'from-teal-500 to-cyan-500'} text-white rounded-xl font-semibold text-lg hover:opacity-90 transition-all ${isDark ? 'shadow-lg shadow-indigo-500/30' : 'shadow-lg shadow-teal-200'} flex items-center justify-center gap-2`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                Đi đến Dashboard
              </Link>
            )}
          </div>
        </div>

        {/* Features */}
        <div className="mt-24 grid md:grid-cols-3 gap-8">
          <div className={`rounded-2xl p-8 transition-all group ${isDark ? 'bg-slate-800/50 border border-slate-700 hover:border-indigo-500/50 hover:bg-slate-800' : 'bg-white rounded-2xl p-8 shadow-lg shadow-teal-100/50 border border-slate-100 hover:shadow-xl'}`}>
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${isDark ? 'bg-indigo-500/20' : 'bg-gradient-to-br from-teal-100 to-teal-200'}`}>
              <svg className={`w-7 h-7 ${isDark ? 'text-indigo-400' : 'text-teal-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className={`text-xl font-semibold mb-3 ${isDark ? 'text-white' : 'text-slate-800'}`}>Ngân hàng câu hỏi</h3>
            <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>Hệ thống câu hỏi phong phú với nhiều loại câu hỏi và độ khó khác nhau.</p>
          </div>

          <div className={`rounded-2xl p-8 transition-all group ${isDark ? 'bg-slate-800/50 border border-slate-700 hover:border-indigo-500/50 hover:bg-slate-800' : 'bg-white rounded-2xl p-8 shadow-lg shadow-teal-100/50 border border-slate-100 hover:shadow-xl'}`}>
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${isDark ? 'bg-purple-500/20' : 'bg-gradient-to-br from-cyan-100 to-cyan-200'}`}>
              <svg className={`w-7 h-7 ${isDark ? 'text-purple-400' : 'text-cyan-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <h3 className={`text-xl font-semibold mb-3 ${isDark ? 'text-white' : 'text-slate-800'}`}>Đề thi đa dạng</h3>
            <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>Tạo và quản lý đề thi với nhiều tùy chọn linh hoạt theo nhu cầu.</p>
          </div>

          <div className={`rounded-2xl p-8 transition-all group ${isDark ? 'bg-slate-800/50 border border-slate-700 hover:border-indigo-500/50 hover:bg-slate-800' : 'bg-white rounded-2xl p-8 shadow-lg shadow-teal-100/50 border border-slate-100 hover:shadow-xl'}`}>
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${isDark ? 'bg-cyan-500/20' : 'bg-gradient-to-br from-teal-100 to-teal-200'}`}>
              <svg className={`w-7 h-7 ${isDark ? 'text-cyan-400' : 'text-teal-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className={`text-xl font-semibold mb-3 ${isDark ? 'text-white' : 'text-slate-800'}`}>Phòng học tập</h3>
            <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>Không gian học tập trực tuyến với tính năng tương tác real-time.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className={`relative z-10 py-8 ${isDark ? 'border-t border-slate-800' : 'border-t border-slate-200'}`}>
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className={isDark ? 'text-slate-500 text-sm' : 'text-slate-400 text-sm'}>
            © 2026 StudyHub. Nền tảng quản lý học tập hiện đại.
          </p>
        </div>
      </footer>
    </div>
  );
}
