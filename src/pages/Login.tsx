import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { AuthService } from '../services/authService';
import { toast } from 'react-toastify';
import { useTheme } from '../contexts/ThemeContext';

interface LoginProps {
  onLoginSuccess?: () => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const googleClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();
  const hasGoogleClient = !!googleClientId && googleClientId !== 'YOUR_GOOGLE_CLIENT_ID';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Vui lòng nhập đầy đủ email và mật khẩu');
      return;
    }

    setLoading(true);
    try {
      const response = await AuthService.login(email, password);
      toast.success(`Chào mừng ${response.fullName}!`);
      if (onLoginSuccess) {
        onLoginSuccess();
      } else {
        navigate('/dashboard');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setLoading(true);
    try {
      const response = await AuthService.googleLogin(credentialResponse.credential);
      toast.success(`Chào mừng ${response.fullName}!`);
      if (onLoginSuccess) {
        onLoginSuccess();
      } else {
        navigate('/dashboard');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Đăng nhập Google thất bại. Vui lòng thử lại.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    toast.error('Đăng nhập Google thất bại. Vui lòng thử lại.');
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${isDark ? 'bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900' : 'bg-gradient-to-br from-teal-50 via-white to-cyan-50'}`}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-lg ${isDark ? 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-indigo-500/30' : 'bg-gradient-to-br from-teal-400 to-cyan-500 shadow-teal-100'}`}>
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>StudyHub</h1>
          <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>Đăng nhập để tiếp tục</p>
        </div>

        {/* Login form */}
        <div className={`rounded-2xl p-8 ${isDark ? 'bg-slate-800/80 border border-slate-700' : 'bg-white shadow-lg shadow-teal-100/50 border border-slate-100'}`}>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Nhập email của bạn"
                className={`w-full px-4 py-3 rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${isDark ? 'bg-slate-900/50 border border-slate-600 text-white focus:ring-indigo-500' : 'bg-slate-50 border border-slate-200 text-slate-800 focus:ring-teal-400'}`}
                disabled={loading}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu"
                  className={`w-full px-4 py-3 rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all pr-12 ${isDark ? 'bg-slate-900/50 border border-slate-600 text-white focus:ring-indigo-500' : 'bg-slate-50 border border-slate-200 text-slate-800 focus:ring-teal-400'}`}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${isDark ? 'text-slate-400 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <Link
                to="/forgot-password"
                className={`text-sm transition-colors ${isDark ? 'text-indigo-400 hover:text-indigo-300' : 'text-teal-600 hover:text-teal-700'}`}
              >
                Quên mật khẩu?
              </Link>
            </div>

            {/* Google Login */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className={`w-full border-t ${isDark ? 'border-slate-600' : 'border-slate-200'}`}></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className={`px-2 ${isDark ? 'bg-slate-800/80 text-slate-400' : 'bg-white text-slate-500'}`}>
                  Hoặc
                </span>
              </div>
            </div>

            {hasGoogleClient ? (
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                useOneTap
                theme={isDark ? 'filled_black' : 'outline'}
                size="large"
                shape="rectangular"
                width="100%"
              />
            ) : (
              <div className={`rounded-xl border px-4 py-3 text-center text-sm ${isDark ? 'border-slate-700 bg-slate-900/40 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-500'}`}>
                Google login chưa được cấu hình.
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 bg-gradient-to-r text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed ${isDark ? 'from-indigo-500 to-purple-600 hover:opacity-90 shadow-lg shadow-indigo-500/30' : 'from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 shadow-lg shadow-teal-200'}`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Đang đăng nhập...
                </span>
              ) : (
                'Đăng nhập'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>
              Chưa có tài khoản?{' '}
              <Link to="/register" className={`font-medium transition-colors ${isDark ? 'text-indigo-400 hover:text-indigo-300' : 'text-teal-600 hover:text-teal-700'}`}>
                Đăng ký ngay
              </Link>
            </p>
          </div>
        </div>

        {/* Back to home */}
        <div className="mt-6 text-center">
          <Link
            to="/"
            className={`inline-flex items-center gap-2 transition-colors ${isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Quay lại trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}
