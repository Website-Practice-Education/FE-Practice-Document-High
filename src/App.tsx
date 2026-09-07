import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { GoogleOAuthProvider } from '@react-oauth/google';
import 'react-toastify/dist/ReactToastify.css';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Subjects from './pages/Subjects';
import Questions from './pages/Questions';
import Exams from './pages/Exams';
import Users from './pages/Users';
import StudyHub from './pages/StudyHub';
import GlobalChat from './pages/GlobalChat';
import Forum from './pages/Forum';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Login from './pages/Login';
import Register from './pages/Register';
import Landing from './pages/Landing';
import GoogleCallback from './pages/GoogleCallback';
import Documents from './pages/Documents';
import FloatingChat from './components/FloatingChat';
import AIChatBot from './components/AIChatBot';
import Moderation from './pages/Moderation';
import { ThemeProvider } from './contexts/ThemeContext';
// NEW: Gamification & Social Features
import Leaderboard from './pages/Leaderboard';
import Achievements from './pages/Achievements';
import Progress from './pages/Progress';
import Notifications from './pages/Notifications';

export default function App() {
  const GOOGLE_CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();
  const hasGoogleClient = !!GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID !== 'YOUR_GOOGLE_CLIENT_ID';

  const appContent = (
    <ThemeProvider>
      <ToastContainer position="top-right" autoClose={3000} />
      <BrowserRouter>
        <Routes>
          {/* Public routes - không có Layout */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/google-callback" element={<GoogleCallback />} />
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
            <Route path="/study-hub" element={<StudyHub />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/moderation" element={<Moderation />} />
            {/* Gamification & Social Features */}
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/achievements" element={<Achievements />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/live-sessions" element={<StudyHub />} />
            <Route path="/notifications" element={<Notifications />} />
          </Route>
        </Routes>
        {/* Floating Chat - Hiển thị trên tất cả các trang */}
        <FloatingChat />
        {/* AI Chat Bot - Nút nổi AI Assistant */}
        <AIChatBot />
      </BrowserRouter>
    </ThemeProvider>
  );

  if (!hasGoogleClient) {
    return appContent;
  }

  return <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>{appContent}</GoogleOAuthProvider>;
}
