import { useState, useEffect } from 'react';
import achievementService, { Achievement } from '../services/achievementService';
import XPBar from '../components/XPBar';

export default function Achievements() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [totalXP, setTotalXP] = useState(1250); // Mock XP

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    setLoading(true);
    try {
      const allAchievements = await achievementService.getAllAchievements();
      setAchievements(allAchievements);
      // Mock user achievements - in real app this would come from API
      setUserAchievements([1, 2, 3, 4, 7]); // Achievement IDs that user has unlocked
    } catch (error) {
      console.error('Failed to load achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAchievements = achievements.filter((a) => {
    const isUnlocked = userAchievements.includes(a.id);
    if (filter === 'unlocked') return isUnlocked;
    if (filter === 'locked') return !isUnlocked;
    return true;
  });

  const unlockedCount = userAchievements.length;
  const totalCount = achievements.length;
  const progressPercent = totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0;

  return (
    <div>
      {/* Header */}
      <div className="mb-8 animate-fade-in-down">
        <h1 className="page-title">Thanh tich</h1>
        <p className="page-subtitle">Kham pha va khoai pha cac thach thuc</p>
      </div>

      {/* XP Progress Card */}
      <div 
        className="mb-8 p-6 rounded-2xl animate-fade-in-up"
        style={{
          background: 'linear-gradient(145deg, #1a1a2e, #16213e)',
          border: '1px solid rgba(99, 102, 241, 0.2)',
          boxShadow: '0 8px 32px rgba(99, 102, 241, 0.15)',
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-white mb-1">Tien trinh Thanh tich</h3>
            <p className="text-slate-400 text-sm">
              {unlockedCount} / {totalCount} thanh tich da khoai pha
            </p>
          </div>
          <div className="text-right">
            <span className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
              {Math.round(progressPercent)}%
            </span>
          </div>
        </div>
        
        <XPBar totalXP={totalXP} size="lg" />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-3 mb-6 animate-fade-in-up">
        {[
          { key: 'all', label: 'Tat ca', count: totalCount },
          { key: 'unlocked', label: 'Da khoai pha', count: unlockedCount },
          { key: 'locked', label: 'Dang khoa', count: totalCount - unlockedCount },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setFilter(item.key as any)}
            className={`px-5 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
              filter === item.key
                ? 'text-white'
                : 'text-slate-400 hover:text-white'
            }`}
            style={{
              background: filter === item.key
                ? 'linear-gradient(135deg, #6366f1, #a855f7)'
                : 'rgba(255, 255, 255, 0.05)',
              border: filter === item.key
                ? 'none'
                : '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: filter === item.key
                ? '0 4px 20px rgba(99, 102, 241, 0.4)'
                : 'none',
            }}
          >
            {item.label}
            <span 
              className="ml-2 px-2 py-0.5 rounded-lg text-xs"
              style={{
                background: filter === item.key ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)',
              }}
            >
              {item.count}
            </span>
          </button>
        ))}
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredAchievements.map((achievement, index) => (
          <div
            key={achievement.id}
            className="animate-fade-in-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <AchievementCard
              achievement={achievement}
              isUnlocked={userAchievements.includes(achievement.id)}
            />
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredAchievements.length === 0 && (
        <div className="text-center py-20 rounded-3xl" 
          style={{ 
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          <div className="text-6xl mb-4">🎖️</div>
          <p className="text-lg text-slate-400">Khong co thanh tich nao</p>
        </div>
      )}
    </div>
  );
}
