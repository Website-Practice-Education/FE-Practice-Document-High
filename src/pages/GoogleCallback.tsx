import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthService } from '../services/authService';
import { toast } from 'react-toastify';

export default function GoogleCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    const handleCallback = async () => {
      console.log('[GoogleCallback] Processing callback...');
      console.log('[GoogleCallback] Search params:', Object.fromEntries(searchParams));
      console.log('[GoogleCallback] Hash:', window.location.hash);
      console.log('[GoogleCallback] Origin:', window.location.origin);

      // Google OAuth2 có thể trả về qua:
      // 1. Query parameter: ?credential=xxx hoặc ?id_token=xxx
      // 2. URL fragment: #id_token=xxx hoặc #access_token=xxx
      
      // Ưu tiên lấy từ query parameter trước
      let credential = searchParams.get('credential') || 
                       searchParams.get('id_token') || 
                       searchParams.get('access_token');
      
      // Nếu không có, thử lấy từ hash (URL fragment)
      if (!credential) {
        const hash = window.location.hash;
        if (hash && hash.length > 1) {
          const hashParams = new URLSearchParams(hash.substring(1));
          credential = hashParams.get('id_token') || 
                       hashParams.get('access_token') ||
                       hashParams.get('credential');
        }
      }
      
      const error = searchParams.get('error');

      if (error) {
        console.error('[GoogleCallback] OAuth Error:', error);
        toast.error('Đăng nhập Google thất bại: ' + error);
        navigate('/login');
        return;
      }

      if (!credential) {
        console.error('[GoogleCallback] No credential found');
        console.log('[GoogleCallback] Current URL:', window.location.href);
        toast.error('Không nhận được thông tin từ Google. Vui lòng thử lại.');
        navigate('/login');
        return;
      }

      console.log('[GoogleCallback] Credential found, logging in...');

      try {
        setStatus('loading');
        await AuthService.googleLogin(credential);
        toast.success('Đăng nhập Google thành công!');
        setStatus('success');
        
        // Clear hash và query params từ URL
        window.history.replaceState(null, '', window.location.pathname);
        
        setTimeout(() => {
          navigate('/dashboard');
        }, 1000);
      } catch (err: any) {
        console.error('[GoogleCallback] Login error:', err);
        const message = err.response?.data?.message || err.message || 'Đăng nhập Google thất bại. Vui lòng thử lại.';
        toast.error(message);
        setStatus('error');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
      <div className="text-center">
        {status === 'loading' && (
          <>
            <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white text-lg">Đang xử lý đăng nhập Google...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-white text-lg">Đăng nhập thất bại. Đang chuyển hướng...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-white text-lg">Đăng nhập thành công! Đang chuyển hướng...</p>
          </>
        )}
      </div>
    </div>
  );
}
