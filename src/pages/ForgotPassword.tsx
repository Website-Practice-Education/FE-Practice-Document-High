import { useState } from 'react';
import { UserService } from '../services/userService';
import { toast } from 'react-toastify';

interface ForgotPasswordProps {
  onBack: () => void;
  onResetPassword: () => void;
}

export default function ForgotPassword({ onBack }: ForgotPasswordProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Vui lòng nhập email');
      return;
    }

    setLoading(true);
    try {
      const response = await UserService.forgotPassword(email);
      toast.success(response.message || 'Đã gửi email đặt lại mật khẩu!');
      setEmailSent(true);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể gửi email. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-cyan-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center">
            <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Kiểm tra email!</h2>
            <p className="text-slate-600 mb-6">
              Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu đến email <strong>{email}</strong>
            </p>
            <p className="text-sm text-slate-500 mb-6">
              Nếu không thấy email, hãy kiểm tra hộp thư spam.
            </p>
            <button
              onClick={onBack}
              className="w-full py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-lg hover:from-teal-600 hover:to-cyan-600 transition-colors font-medium shadow-lg shadow-teal-200"
            >
              Quay lại đăng nhập
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-cyan-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <button
          onClick={onBack}
          className="flex items-center text-slate-600 hover:text-teal-600 mb-6 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Quay lại
        </button>

        <h2 className="text-2xl font-bold text-slate-800 mb-2">Quên mật khẩu?</h2>
        <p className="text-slate-600 mb-6">
          Nhập email của bạn và chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-slate-700 text-sm font-medium mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Nhập email của bạn"
              className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-400 focus:border-teal-500 outline-none transition-all bg-slate-50"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-lg hover:from-teal-600 hover:to-cyan-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-teal-200"
          >
            {loading ? 'Đang gửi...' : 'Gửi email đặt lại'}
          </button>
        </form>
      </div>
    </div>
  );
}
