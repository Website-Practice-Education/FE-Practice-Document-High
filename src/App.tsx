import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { GoogleOAuthProvider } from '@react-oauth/google';
import 'react-toastify/dist/ReactToastify.css';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Subjects from './pages/Subjects';
import Questions from './pages/Questions';
import Exams from './pages/Exams';
import Users from './pages/Users';
import StudySpaces from './pages/StudySpaces';
import StudySpaceRoom from './pages/StudySpaceRoom';
import GlobalChat from './pages/GlobalChat';
import Forum from './pages/Forum';
import SelfStudyRoom from './pages/SelfStudyRoom';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Login from './pages/Login';
import Register from './pages/Register';
import Landing from './pages/Landing';
import Documents from './pages/Documents';
import FloatingChat from './components/FloatingChat';
import AIChatBot from './components/AIChatBot';
import Moderation from './pages/Moderation';
import { ThemeProvider } from './contexts/ThemeContext';

export default function App() {
  // Thay thế bằng Google Client ID thực tế của bạn
  // Lấy từ: https://console.cloud.google.com/apis/credentials
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID';

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <ThemeProvider>
        <ToastContainer position="top-right" autoClose={3000} />
        <BrowserRouter>
          <Routes>
            {/* Public routes - không có Layout */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword onBack={() => window.history.back()} onResetPassword={() => {}} />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Main routes - có Layout */}
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/subjects" element={<Subjects />} />
              <Route path="/questions" element={<Questions />} />
              <Route path="/exams" element={<Exams />} />
              <Route path="/users" element={<Users />} />
              <Route path="/chat" element={<GlobalChat />} />
              <Route path="/forum" element={<Forum />} />
              <Route path="/study-spaces" element={<StudySpaces />} />
              <Route path="/study-spaces/:id" element={<StudySpaceRoom />} />
              <Route path="/self-study/:id" element={<SelfStudyRoom />} />
              <Route path="/documents" element={<Documents />} />
              <Route path="/moderation" element={<Moderation />} />
            </Route>
          </Routes>
          {/* Floating Chat - Hiển thị trên tất cả các trang */}
          <FloatingChat />
          {/* AI Chat Bot - Nút nổi AI Assistant */}
          <AIChatBot />
        </BrowserRouter>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}
