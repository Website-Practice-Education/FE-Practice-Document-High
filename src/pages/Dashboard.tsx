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
    label: 'Môn học',
    symbol: 'S',
    from: '#14b8a6',
    to: '#2dd4bf',
    bg: 'from-teal-50 to-teal-100',
  },
  {
    key: 'questions' as const,
    label: 'Câu hỏi',
    symbol: 'Q',
    from: '#0891b2',
    to: '#06b6d4',
    bg: 'from-cyan-50 to-cyan-100',
  },
  {
    key: 'exams' as const,
    label: 'Đề thi',
    symbol: 'E',
    from: '#0d9488',
    to: '#14b8a6',
    bg: 'from-teal-50 to-cyan-50',
  },
  {
    key: 'users' as const,
    label: 'Người dùng',
    symbol: 'U',
    from: '#06b6d4',
    to: '#22d3ee',
    bg: 'from-cyan-50 to-teal-50',
  },
];

const quickActions = [
  { href: '/subjects', label: 'Thêm môn học', symbol: '+' },
  { href: '/questions', label: 'Thêm câu hỏi', symbol: '+' },
  { href: '/exams', label: 'Tạo đề thi', symbol: '+' },
  { href: '/users', label: 'Thêm người dùng', symbol: '+' },
  { href: '/study-spaces', label: 'Phòng học', symbol: '+' },
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
      setError('Không thể kết nối đến server. Vui lòng kiểm tra backend đang chạy trên port 5058.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading message="Đang tải dashboard..." />;

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-red-400 mb-4">Lỗi kết nối</h2>
          <p className="text-slate-400 mb-6">{error}</p>
          <button
            onClick={loadDashboardData}
            className="px-6 py-3 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors font-medium"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header animate-fade-in-down">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Tổng quan hệ thống quản lý học tập</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {statConfig.map((config, index) => (
          <div
            key={config.key}
            className={`stat-card p-6 animate-fade-in-up stagger-${index + 1}`}
            style={{
              ['--stat-color-from' as string]: config.from,
              ['--stat-color-to' as string]: config.to,
              animationFillMode: 'forwards',
            }}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${config.bg} rounded-2xl`} />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <span
                  className="stat-symbol"
                  style={{
                    background: `linear-gradient(135deg, ${config.from}20, ${config.to}30)`,
                    color: config.from,
                  }}
                >
                  {config.symbol}
                </span>
              </div>
              <p
                className="stat-number text-4xl font-bold font-[family-name:var(--font-display)]"
                style={{ color: config.from }}
              >
                {stats[config.key]}
              </p>
              <p className="text-slate-500 mt-1 text-sm font-medium">{config.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-8">
        <Card title="Thao tác nhanh" symbol="+" delay={200}>
          <div className="flex flex-wrap gap-3">
            {quickActions.map((action, index) => (
              <Link
                key={action.href}
                to={action.href}
                className={`group flex items-center gap-2.5 px-5 py-3 rounded-xl text-white text-sm font-semibold transition-all duration-300 hover:-translate-y-1 animate-fade-in-up stagger-${index + 1}`}
                style={{
                  background: 'linear-gradient(135deg, #14b8a6, #0891b2)',
                  boxShadow: '0 4px 14px rgba(20, 184, 166, 0.25)',
                  animationFillMode: 'forwards',
                  opacity: 0,
                }}
              >
                <span className="w-5 h-5 rounded-md bg-white/20 flex items-center justify-center text-xs font-bold">
                  {action.symbol}
                </span>
                {action.label}
              </Link>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Người dùng hoạt động gần đây" symbol="U" delay={300}>
          {recentUsers.length === 0 ? (
            <div className="text-center py-8">
              <div className="empty-symbol">—</div>
              <p className="text-slate-500">Chưa có hoạt động nào</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentUsers.map((user, index) => (
                <div
                  key={user.id}
                  className={`user-item animate-fade-in-up stagger-${index + 1}`}
                  style={{ animationFillMode: 'forwards', opacity: 0 }}
                >
                  <div className="avatar">
                    {(user.fullName || user.email).charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 truncate">
                      {user.fullName || 'Unknown'}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                  </div>
                  <div className="text-xs text-slate-400 whitespace-nowrap">
                    {user.lastLoginAt
                      ? new Date(user.lastLoginAt).toLocaleDateString('vi-VN')
                      : 'Chưa đăng nhập'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Tổng quan hệ thống" symbol="%" delay={400}>
          <div className="space-y-5">
            {[
              {
                label: 'Câu hỏi / Môn học',
                value: stats.subjects > 0 ? Math.round(stats.questions / stats.subjects) : 0,
                max: stats.questions,
                color: '#14b8a6',
              },
              {
                label: 'Câu hỏi / Đề thi',
                value: stats.exams > 0 ? Math.round(stats.questions / stats.exams) : 0,
                max: stats.questions,
                color: '#0891b2',
              },
              {
                label: 'Tổng người dùng',
                value: stats.users,
                max: Math.max(stats.users, 1),
                color: '#06b6d4',
              },
            ].map((item, index) => (
              <div key={item.label} className="animate-fade-in-up" style={{ animationDelay: `${index * 100 + 500}ms`, animationFillMode: 'forwards', opacity: 0 }}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-slate-600 font-medium">{item.label}</span>
                  <span className="font-bold text-slate-800 font-[family-name:var(--font-display)]">
                    {item.value}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: `${Math.min((item.value / item.max) * 100, 100)}%`,
                      background: `linear-gradient(90deg, ${item.color}, ${item.color}88)`,
                      animationDelay: `${index * 200 + 600}ms`,
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
