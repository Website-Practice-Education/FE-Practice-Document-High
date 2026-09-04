import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SubjectService } from '../services/subjectService';
import { QuestionService } from '../services/questionService';
import { ExamService } from '../services/examService';
import { UserService } from '../services/userService';
import Card from '../components/Card';
import Loading from '../components/Loading';

interface Stats {
  subjects: number;
  questions: number;
  exams: number;
  users: number;
}

interface RecentUser {
  id: number;
  fullName?: string;
  email: string;
  lastLoginAt?: string;
}

const statConfig = [
  {
    key: 'subjects' as const,
    label: 'Mon hoc',
    symbol: 'M',
    gradient: 'from-indigo-500 via-purple-500 to-pink-500',
  },
  {
    key: 'questions' as const,
    label: 'Cau hoi',
    symbol: 'C',
    gradient: 'from-cyan-500 via-blue-500 to-indigo-500',
  },
  {
    key: 'exams' as const,
    label: 'De thi',
    symbol: 'D',
    gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
  },
  {
    key: 'users' as const,
    label: 'Nguoi dung',
    symbol: 'N',
    gradient: 'from-orange-500 via-amber-500 to-yellow-500',
  },
];

const quickActions = [
  { href: '/subjects', label: 'Them mon hoc', gradient: 'from-indigo-500 to-purple-500' },
  { href: '/questions', label: 'Them cau hoi', gradient: 'from-cyan-500 to-blue-500' },
  { href: '/exams', label: 'Tao de thi', gradient: 'from-emerald-500 to-teal-500' },
  { href: '/users', label: 'Them nguoi dung', gradient: 'from-orange-500 to-amber-500' },
  { href: '/study-spaces', label: 'Phong hoc', gradient: 'from-pink-500 to-rose-500' },
];

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    subjects: 0,
    questions: 0,
    exams: 0,
    users: 0,
  });
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setError(null);
      const [subjects, questions, exams, users, recentActive] = await Promise.all([
        SubjectService.getAll(),
        QuestionService.getAll(),
        ExamService.getAll(),
        UserService.getCount(),
        UserService.getRecentlyActive(5),
      ]);
      setStats({
        subjects: subjects.length,
        questions: questions.length,
        exams: exams.length,
        users: users,
      });
      setRecentUsers(recentActive);
    } catch (error: any) {
      console.error('Error loading dashboard:', error);
      setError('Khong the ket noi den server. Vui long kiem tra backend.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading message="Dang tai dashboard..." />;

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md mx-auto p-10 rounded-3xl glass-card">
          <div className="text-7xl mb-6">!</div>
          <h2 className="text-2xl font-bold text-red-400 mb-4">Loi ket noi</h2>
          <p className="text-slate-400 mb-6">{error}</p>
          <button
            onClick={loadDashboardData}
            className="btn-primary"
          >
            Thu lai
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8 animate-fade-in-down">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Tong quan he thong quan ly hoc tap</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statConfig.map((config, index) => (
          <div
            key={config.key}
            className="relative overflow-hidden rounded-2xl p-6 animate-fade-in-up"
            style={{
              animationDelay: `${index * 100}ms`,
              background: `linear-gradient(135deg, #1a1a2e, #16213e)`,
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            }}
          >
            {/* Gradient overlay */}
            <div 
              className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-10`}
            />
            
            {/* Animated border */}
            <div 
              className="absolute inset-0 rounded-2xl"
              style={{
                background: `linear-gradient(135deg, ${config.gradient.includes('indigo') ? '#6366f1' : config.gradient.includes('cyan') ? '#06b6d4' : config.gradient.includes('emerald') ? '#10b981' : '#f59e0b'}, transparent)`,
                padding: '2px',
                mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                maskComposite: 'exclude',
                opacity: 0.5,
              }}
            />

            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold text-white"
                  style={{
                    background: `linear-gradient(135deg, ${config.gradient.includes('indigo') ? '#6366f1' : config.gradient.includes('cyan') ? '#06b6d4' : config.gradient.includes('emerald') ? '#10b981' : '#f59e0b'}, ${config.gradient.includes('indigo') ? '#a855f7' : config.gradient.includes('cyan') ? '#0891b2' : config.gradient.includes('emerald') ? '#14b8a6' : '#d97706'})`,
                    boxShadow: `0 4px 16px ${config.gradient.includes('indigo') ? 'rgba(99, 102, 241, 0.4)' : config.gradient.includes('cyan') ? 'rgba(6, 182, 212, 0.4)' : config.gradient.includes('emerald') ? 'rgba(16, 185, 129, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`,
                  }}
                >
                  {config.symbol}
                </div>
              </div>
              
              <p 
                className="text-4xl font-bold font-[family-name:var(--font-display)] mb-1"
                style={{
                  background: `linear-gradient(135deg, ${config.gradient.includes('indigo') ? '#818cf8' : config.gradient.includes('cyan') ? '#22d3ee' : config.gradient.includes('emerald') ? '#34d399' : '#fbbf24'}, ${config.gradient.includes('indigo') ? '#a78bfa' : config.gradient.includes('cyan') ? '#67e8f9' : config.gradient.includes('emerald') ? '#6ee7b7' : '#fcd34d'})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {stats[config.key]}
              </p>
              <p className="text-sm text-slate-400 font-medium">{config.label}</p>
            </div>

            {/* Decorative element */}
            <div 
              className={`absolute -bottom-4 -right-4 w-24 h-24 rounded-full opacity-20 blur-3xl bg-gradient-to-br ${config.gradient}`}
            />
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-8 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
        <Card title="Thao tac nhanh" symbol="T" delay={0}>
          <div className="flex flex-wrap gap-4">
            {quickActions.map((action, index) => (
              <Link
                key={action.href}
                to={action.href}
                className="group flex items-center gap-3 px-6 py-4 rounded-xl text-white text-sm font-semibold transition-all duration-300 hover:-translate-y-2 animate-fade-in-up"
                style={{
                  background: `linear-gradient(135deg, ${action.gradient.includes('indigo') ? '#6366f1' : action.gradient.includes('cyan') ? '#06b6d4' : action.gradient.includes('emerald') ? '#10b981' : action.gradient.includes('orange') ? '#f97316' : '#ec4899'}, ${action.gradient.includes('indigo') ? '#8b5cf6' : action.gradient.includes('cyan') ? '#0891b2' : action.gradient.includes('emerald') ? '#14b8a6' : action.gradient.includes('orange') ? '#ea580c' : '#f43f5e'})`,
                  boxShadow: `0 4px 20px ${action.gradient.includes('indigo') ? 'rgba(99, 102, 241, 0.35)' : action.gradient.includes('cyan') ? 'rgba(6, 182, 212, 0.35)' : action.gradient.includes('emerald') ? 'rgba(16, 185, 129, 0.35)' : action.gradient.includes('orange') ? 'rgba(249, 115, 22, 0.35)' : 'rgba(236, 72, 153, 0.35)'}`,
                  animationDelay: `${index * 100}ms`,
                  animationFillMode: 'forwards',
                  opacity: 0,
                }}
              >
                <span 
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
                  style={{ background: 'rgba(255, 255, 255, 0.2)' }}
                >
                  +
                </span>
                {action.label}
              </Link>
            ))}
          </div>
        </Card>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <Card title="Nguoi dung hoat dong gan day" symbol="U" delay={500}>
          {recentUsers.length === 0 ? (
            <div className="text-center py-12">
              <div className="empty-symbol">—</div>
              <p className="text-slate-400">Chua co hoat dong nao</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentUsers.map((user, index) => (
                <div
                  key={user.id}
                  className="flex items-center gap-4 p-4 rounded-xl transition-all duration-300 animate-fade-in-up"
                  style={{
                    animationDelay: `${index * 100 + 600}ms`,
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(99, 102, 241, 0.08)';
                    e.currentTarget.style.transform = 'translateX(6px)';
                    e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                    e.currentTarget.style.transform = 'translateX(0)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                  }}
                >
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                    style={{
                      background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                      boxShadow: '0 4px 12px rgba(99, 102, 241, 0.35)',
                    }}
                  >
                    {(user.fullName || user.email).charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate">
                      {user.fullName || 'Unknown'}
                    </p>
                    <p className="text-sm text-slate-400 truncate">{user.email}</p>
                  </div>
                  <div className="text-xs text-slate-500 whitespace-nowrap">
                    {user.lastLoginAt
                      ? new Date(user.lastLoginAt).toLocaleDateString('vi-VN')
                      : 'Chua dang nhap'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* System Overview */}
        <Card title="Tong quan he thong" symbol="T" delay={600}>
          <div className="space-y-5">
            {[
              {
                label: 'Cau hoi / Mon hoc',
                value: stats.subjects > 0 ? Math.round(stats.questions / stats.subjects) : 0,
                max: Math.max(stats.questions, 1),
                gradient: 'from-indigo-500 to-purple-500',
              },
              {
                label: 'Cau hoi / De thi',
                value: stats.exams > 0 ? Math.round(stats.questions / stats.exams) : 0,
                max: Math.max(stats.questions, 1),
                gradient: 'from-cyan-500 to-blue-500',
              },
              {
                label: 'Tong nguoi dung',
                value: stats.users,
                max: Math.max(stats.users, 1),
                gradient: 'from-emerald-500 to-teal-500',
              },
            ].map((item, index) => (
              <div 
                key={item.label} 
                className="animate-fade-in-up"
                style={{ 
                  animationDelay: `${index * 100 + 700}ms`,
                  animationFillMode: 'forwards',
                  opacity: 0 
                }}
              >
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm text-slate-300 font-medium">{item.label}</span>
                  <span className="font-bold text-white font-[family-name:var(--font-display)]">
                    {item.value}
                  </span>
                </div>
                <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: `${Math.min((item.value / item.max) * 100, 100)}%`,
                      background: `linear-gradient(90deg, ${item.gradient.includes('indigo') ? '#6366f1' : item.gradient.includes('cyan') ? '#06b6d4' : '#10b981'}, ${item.gradient.includes('indigo') ? '#a855f7' : item.gradient.includes('cyan') ? '#0891b2' : '#14b8a6'})`,
                      boxShadow: `0 0 12px ${item.gradient.includes('indigo') ? 'rgba(99, 102, 241, 0.5)' : item.gradient.includes('cyan') ? 'rgba(6, 182, 212, 0.5)' : 'rgba(16, 185, 129, 0.5)'}`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
