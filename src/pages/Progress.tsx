import { useState, useEffect, useCallback } from 'react';
import progressService, { DailyProgress, WeeklyStats, TopicProgress } from '../services/progressService';
import Streak from '../components/Streak';

export default function Progress() {
  const [dailyProgress, setDailyProgress] = useState<DailyProgress | null>(null);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats | null>(null);
  const [topicProgress, setTopicProgress] = useState<TopicProgress[]>([]);
  const [currentStreak, setCurrentStreak] = useState({ currentStreak: 0, longestStreak: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Current time state
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Current time effect - update every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  // Load progress data from API
  const loadProgressData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch data in parallel for better performance
      const [daily, weekly, topics, streak] = await Promise.all([
        progressService.getDailyProgress(),
        progressService.getWeeklyProgress(),
        progressService.getTopicProgress(),
        progressService.getStreak(),
      ]);
      
      // Use API data if available, otherwise use defaults
      if (daily) {
        setDailyProgress(daily);
      } else {
        // Set default values when no data from API
        setDailyProgress({
          questionsAnswered: 0,
          questionsCorrect: 0,
          studyMinutes: 0,
          examsCompleted: 0,
          xpEarned: 0,
        });
      }
      
      if (weekly) {
        setWeeklyStats(weekly);
      } else {
        // Set default weekly stats
        setWeeklyStats({
          weekStart: new Date().toISOString().split('T')[0],
          totalQuestions: 0,
          correctQuestions: 0,
          totalMinutes: 0,
          totalExams: 0,
          totalXP: 0,
          averageScore: 0,
          bestDay: 'T2',
          streak: 0,
          dailyXP: [0, 0, 0, 0, 0, 0, 0],
        });
      }
      
      setTopicProgress(topics);
      
      if (streak) {
        setCurrentStreak(streak);
      }
    } catch (err) {
      console.error('Failed to load progress:', err);
      setError('Không thể tải dữ liệu tiến độ. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProgressData();
  }, [loadProgressData]);

  // Calculate accuracy
  const accuracy = dailyProgress 
    ? progressService.calculateAccuracy(
        dailyProgress.questionsCorrect || dailyProgress.correctAnswers || 0,
        dailyProgress.questionsAnswered
      )
    : 0;

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-slate-400">Đang tải dữ liệu tiến độ...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md mx-auto p-10 rounded-3xl" style={{ background: 'linear-gradient(145deg, #1a1a2e, #16213e)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-red-400 mb-4">Lỗi tải dữ liệu</h2>
          <p className="text-slate-400 mb-6">{error}</p>
          <button
            onClick={loadProgressData}
            className="px-6 py-3 rounded-xl font-semibold text-white transition-all duration-300 hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #6366f1, #a855f7)',
              boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)',
            }}
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8 animate-fade-in-down">
        {/* Current Time - Top Right */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Tiến độ học tập</h1>
            <p className="page-subtitle">Theo dõi lịch sử và tiến trình của bạn</p>
          </div>
          {/* Current Time Clock */}
          <div 
            className="px-5 py-3 rounded-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.2))',
              border: '1px solid rgba(99, 102, 241, 0.3)',
            }}
          >
            <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Thời gian hiện tại</p>
            <p className="text-2xl font-bold font-mono text-white">
              🕐 {currentTime.toLocaleTimeString('vi-VN')}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {/* Questions Answered */}
        <div 
          className="p-5 rounded-2xl animate-fade-in-up"
          style={{
            background: 'linear-gradient(145deg, #1a1a2e, #16213e)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
              style={{
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.2))',
              }}
            >
              ❓
            </div>
            <div>
              <p className="text-3xl font-bold text-white">{dailyProgress?.questionsAnswered || 0}</p>
              <p className="text-sm text-slate-400">Câu hỏi</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-green-400">✅ {dailyProgress?.questionsCorrect || dailyProgress?.correctAnswers || 0} đúng</span>
            <span className="text-slate-500">|</span>
            <span className="text-red-400">{accuracy}% đúng</span>
          </div>
        </div>

        {/* Study Time */}
        <div 
          className="p-5 rounded-2xl animate-fade-in-up"
          style={{
            background: 'linear-gradient(145deg, #1a1a2e, #16213e)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            animationDelay: '100ms',
          }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
              style={{
                background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.2), rgba(6, 182, 212, 0.2))',
              }}
            >
              ⏱️
            </div>
            <div>
              <p className="text-3xl font-bold text-white">
                {dailyProgress ? progressService.formatMinutes(dailyProgress.studyMinutes || dailyProgress.timeSpentMinutes || 0) : '0p'}
              </p>
              <p className="text-sm text-slate-400">Thời gian học</p>
            </div>
          </div>
          <p className="text-sm text-cyan-400">Tuần này: {weeklyStats ? progressService.formatMinutes(weeklyStats.totalMinutes) : '0p'}</p>
        </div>

        {/* Exams Completed */}
        <div 
          className="p-5 rounded-2xl animate-fade-in-up"
          style={{
            background: 'linear-gradient(145deg, #1a1a2e, #16213e)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            animationDelay: '200ms',
          }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
              style={{
                background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(22, 163, 74, 0.2))',
              }}
            >
              📝
            </div>
            <div>
              <p className="text-3xl font-bold text-white">{dailyProgress?.examsCompleted || 0}</p>
              <p className="text-sm text-slate-400">Bài thi</p>
            </div>
          </div>
          <p className="text-sm text-green-400">Tuần này: {weeklyStats?.totalExams || 0} bài</p>
        </div>

        {/* XP Earned */}
        <div 
          className="p-5 rounded-2xl animate-fade-in-up"
          style={{
            background: 'linear-gradient(145deg, #1a1a2e, #16213e)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            animationDelay: '300ms',
          }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
              style={{
                background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(245, 158, 11, 0.2))',
              }}
            >
              ⭐
            </div>
            <div>
              <p className="text-3xl font-bold text-white">+{dailyProgress?.xpEarned || 0}</p>
              <p className="text-sm text-slate-400">XP hôm nay</p>
            </div>
          </div>
          <p className="text-sm text-yellow-400">Tuần này: +{weeklyStats?.totalXP || 0} XP</p>
        </div>
      </div>

      {/* Streak and Weekly Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Streak */}
        <div 
          className="p-6 rounded-2xl animate-fade-in-up"
          style={{
            background: 'linear-gradient(145deg, #1a1a2e, #16213e)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <h3 className="text-lg font-bold text-white mb-4">🔥 Streak</h3>
          <Streak 
            currentStreak={currentStreak.currentStreak} 
            longestStreak={currentStreak.longestStreak} 
          />
        </div>

        {/* Weekly Activity */}
        <div 
          className="col-span-2 p-6 rounded-2xl animate-fade-in-up"
          style={{
            background: 'linear-gradient(145deg, #1a1a2e, #16213e)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <h3 className="text-lg font-bold text-white mb-4">📊 Hoạt động tuần này</h3>
          <div className="space-y-4">
            {/* Simple bar chart */}
            {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day, index) => {
              const dailyXP = weeklyStats?.dailyXP || [];
              const value = dailyXP[index] || 0;
              const maxXP = Math.max(...dailyXP, 1); // Avoid division by zero
              
              // Calculate today index (Monday = 0, Sunday = 6)
              const today = new Date();
              const todayIndex = today.getDay() === 0 ? 6 : today.getDay() - 1;
              const isToday = index === todayIndex;
              
              return (
                <div key={day} className="flex items-center gap-3">
                  <span className={`w-8 text-sm font-medium ${isToday ? 'text-indigo-400' : 'text-slate-400'}`}>
                    {day}
                  </span>
                  <div className="flex-1 h-6 rounded-lg overflow-hidden" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                    <div 
                      className="h-full rounded-lg transition-all duration-500"
                      style={{ 
                        width: `${Math.max((value / maxXP) * 100, value > 0 ? 5 : 2)}%`,
                        background: isToday 
                          ? 'linear-gradient(90deg, #6366f1, #a855f7)'
                          : 'linear-gradient(90deg, rgba(99, 102, 241, 0.5), rgba(168, 85, 247, 0.5))',
                        boxShadow: isToday ? '0 0 12px rgba(99, 102, 241, 0.5)' : 'none',
                      }}
                    />
                  </div>
                  <span className="w-12 text-sm text-slate-400 text-right">{value} XP</span>
                </div>
              );
            })}
          </div>
          
          {/* Weekly Summary */}
          <div className="mt-4 pt-4 border-t border-slate-700/50 grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-indigo-400">{weeklyStats?.totalQuestions || 0}</p>
              <p className="text-xs text-slate-500">Câu hỏi</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">{weeklyStats?.averageScore || 0}%</p>
              <p className="text-xs text-slate-500">Độ chính xác</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-400">{weeklyStats?.streak || 0}</p>
              <p className="text-xs text-slate-500">Ngày liên tiếp</p>
            </div>
          </div>
        </div>
      </div>

      {/* Topic Progress */}
      <div 
        className="p-6 rounded-2xl animate-fade-in-up"
        style={{
          background: 'linear-gradient(145deg, #1a1a2e, #16213e)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <h3 className="text-lg font-bold text-white mb-4">📚 Tiến độ theo chủ đề</h3>
        {topicProgress.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {topicProgress.map((topic) => (
              <div 
                key={topic.topicId}
                className="p-4 rounded-xl"
                style={{ 
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-white">{topic.topicName}</span>
                  <span className={`font-bold ${
                    topic.accuracy >= 80 ? 'text-green-400' : 
                    topic.accuracy >= 60 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {topic.accuracy}%
                  </span>
                </div>
                <div className="h-2 rounded-full overflow-hidden mb-2" style={{ background: 'rgba(255, 255, 255, 0.1)' }}>
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${topic.accuracy}%`,
                      background: topic.accuracy >= 80 
                        ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                        : topic.accuracy >= 60 
                          ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                          : 'linear-gradient(90deg, #ef4444, #dc2626)',
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{topic.totalQuestions} câu hỏi</span>
                  <span>{topic.correctCount} đúng</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-5xl mb-4 opacity-50">📚</div>
            <p className="text-slate-400">Chưa có dữ liệu tiến độ theo chủ đề</p>
            <p className="text-sm text-slate-500 mt-2">Hãy bắt đầu học để theo dõi tiến độ!</p>
          </div>
        )}
      </div>
    </div>
  );
}
