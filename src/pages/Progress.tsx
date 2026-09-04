import { useState, useEffect } from 'react';
import progressService, { DailyProgress, WeeklyStats, TopicProgress } from '../services/progressService';
import Streak from '../components/Streak';

export default function Progress() {
  const [dailyProgress, setDailyProgress] = useState<DailyProgress | null>(null);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats | null>(null);
  const [topicProgress, setTopicProgress] = useState<TopicProgress[]>([]);
  const [currentStreak, setCurrentStreak] = useState({ currentStreak: 5, longestStreak: 15 });
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month'>('week');

  useEffect(() => {
    loadProgressData();
  }, []);

  const loadProgressData = async () => {
    setLoading(true);
    try {
      const [daily, weekly, topics, streak] = await Promise.all([
        progressService.getDailyProgress(1),
        progressService.getWeeklyStats(1),
        progressService.getTopicProgress(1),
        progressService.getStreak(1),
      ]);
      setDailyProgress(daily);
      setWeeklyStats(weekly);
      setTopicProgress(topics);
      setCurrentStreak(streak);
    } catch (error) {
      console.error('Failed to load progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const accuracy = dailyProgress 
    ? progressService.calculateAccuracy(dailyProgress.questionsCorrect, dailyProgress.questionsAnswered)
    : 0;

  return (
    <div>
      {/* Header */}
      <div className="mb-8 animate-fade-in-down">
        <h1 className="page-title">Tien do hoc tap</h1>
        <p className="page-subtitle">Theo doi lich su va tien trinh cua ban</p>
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
              <p className="text-sm text-slate-400">Cau hoi</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-green-400">✅ {dailyProgress?.questionsCorrect || 0} dung</span>
            <span className="text-slate-500">|</span>
            <span className="text-red-400">{accuracy}% dung</span>
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
                {dailyProgress ? progressService.formatMinutes(dailyProgress.studyMinutes) : '0p'}
              </p>
              <p className="text-sm text-slate-400">Thoi gian hoc</p>
            </div>
          </div>
          <p className="text-sm text-cyan-400">Tuan nay: {weeklyStats ? progressService.formatMinutes(weeklyStats.totalMinutes) : '0p'}</p>
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
              <p className="text-sm text-slate-400">Bai thi</p>
            </div>
          </div>
          <p className="text-sm text-green-400">Thang nay: {weeklyStats?.totalExams || 0} bai</p>
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
              <p className="text-sm text-slate-400">XP hom nay</p>
            </div>
          </div>
          <p className="text-sm text-yellow-400">Tuan nay: +{weeklyStats?.totalXP || 0} XP</p>
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
          <h3 className="text-lg font-bold text-white mb-4">📊 Hoat dong tuan nay</h3>
          <div className="space-y-4">
            {/* Simple bar chart */}
            {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day, index) => {
              const value = Math.floor(Math.random() * 100);
              const isToday = index === new Date().getDay() - 1 || (new Date().getDay() === 0 && index === 6);
              return (
                <div key={day} className="flex items-center gap-3">
                  <span className={`w-8 text-sm font-medium ${isToday ? 'text-indigo-400' : 'text-slate-400'}`}>
                    {day}
                  </span>
                  <div className="flex-1 h-6 rounded-lg overflow-hidden" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                    <div 
                      className="h-full rounded-lg transition-all duration-500"
                      style={{ 
                        width: `${value}%`,
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
        <h3 className="text-lg font-bold text-white mb-4">📚 Tien do theo chu de</h3>
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
                <span>{topic.totalQuestions} cau hoi</span>
                <span>{topic.correctCount} dung</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
