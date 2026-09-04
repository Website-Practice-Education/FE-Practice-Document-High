import { useState, useEffect } from 'react';
import leaderboardService, { LeaderboardEntry, LeaderboardFilter } from '../services/leaderboardService';
import xpService from '../services/xpService';
import { AuthService } from '../services/authService';

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [filter, setFilter] = useState<LeaderboardFilter>({ type: 'all' });
  const [loading, setLoading] = useState(true);
  const [currentUserRank, setCurrentUserRank] = useState<number>(0);

  const currentUser = AuthService.getCurrentUser();

  useEffect(() => {
    loadLeaderboard();
  }, [filter]);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const data = await leaderboardService.getLeaderboard(filter);
      setLeaderboard(data);
      if (currentUser?.id) {
        const rank = await leaderboardService.getUserRank(currentUser.id);
        setCurrentUserRank(rank);
      }
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8 animate-fade-in-down">
        <h1 className="page-title">Bang xep hang</h1>
        <p className="page-subtitle">Xem thu hang cua ban trong cung dong hoc tap</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-3 mb-8 animate-fade-in-up">
        {[
          { key: 'all', label: 'Tat ca', icon: '👑' },
          { key: 'weekly', label: 'Tuan nay', icon: '📅' },
          { key: 'monthly', label: 'Thang nay', icon: '📆' },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setFilter({ ...filter, type: item.key as any })}
            className={`px-5 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
              filter.type === item.key
                ? 'text-white'
                : 'text-slate-400 hover:text-white'
            }`}
            style={{
              background: filter.type === item.key
                ? 'linear-gradient(135deg, #6366f1, #a855f7)'
                : 'rgba(255, 255, 255, 0.05)',
              border: filter.type === item.key
                ? 'none'
                : '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: filter.type === item.key
                ? '0 4px 20px rgba(99, 102, 241, 0.4)'
                : 'none',
            }}
          >
            <span className="mr-2">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>

      {/* Your Rank Card */}
      {currentUserRank > 0 && (
        <div 
          className="mb-8 p-6 rounded-2xl animate-fade-in-up"
          style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.15))',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            boxShadow: '0 8px 32px rgba(99, 102, 241, 0.2)',
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div 
                className="w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold text-white"
                style={{
                  background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                  boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)',
                }}
              >
                #{currentUserRank}
              </div>
              <div>
                <p className="text-sm text-slate-400">Thu hang cua ban</p>
                <p className="text-xl font-bold text-white">{currentUser?.fullName}</p>
              </div>
            </div>
            <button className="btn-primary">
              Xem chi tiet
            </button>
          </div>
        </div>
      )}

      {/* Top 3 Podium */}
      {leaderboard.length >= 3 && (
        <div className="grid grid-cols-3 gap-4 mb-8 animate-fade-in-up">
          {/* 2nd Place */}
          <div className="text-center">
            <div className="relative">
              <div 
                className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center text-3xl mb-3"
                style={{
                  background: 'linear-gradient(135deg, #94a3b8, #cbd5e1)',
                  boxShadow: '0 8px 24px rgba(148, 163, 184, 0.3)',
                }}
              >
                {leaderboard[1].userName.charAt(0)}
              </div>
              <span className="absolute -top-2 -right-2 text-2xl">🥈</span>
            </div>
            <p className="font-bold text-white truncate">{leaderboard[1].userName}</p>
            <p className="text-sm text-slate-400">{xpService.formatXP(leaderboard[1].totalXP)} XP</p>
            <div 
              className="mt-3 mx-auto h-24 rounded-t-xl"
              style={{ 
                background: 'linear-gradient(to top, #94a3b8, #cbd5e1)',
                minWidth: '80px',
                opacity: 0.8,
              }}
            />
          </div>

          {/* 1st Place */}
          <div className="text-center transform scale-105">
            <div className="relative">
              <div 
                className="w-24 h-24 mx-auto rounded-2xl flex items-center justify-center text-4xl mb-3"
                style={{
                  background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
                  boxShadow: '0 8px 32px rgba(245, 158, 11, 0.4)',
                }}
              >
                {leaderboard[0].userName.charAt(0)}
              </div>
              <span className="absolute -top-2 -right-2 text-3xl">👑</span>
            </div>
            <p className="font-bold text-white text-lg">{leaderboard[0].userName}</p>
            <p className="text-sm text-slate-400">{xpService.formatXP(leaderboard[0].totalXP)} XP</p>
            <div 
              className="mt-3 mx-auto h-32 rounded-t-xl"
              style={{ 
                background: 'linear-gradient(to top, #f59e0b, #fbbf24)',
                minWidth: '100px',
                boxShadow: '0 -8px 32px rgba(245, 158, 11, 0.3)',
              }}
            />
          </div>

          {/* 3rd Place */}
          <div className="text-center">
            <div className="relative">
              <div 
                className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center text-3xl mb-3"
                style={{
                  background: 'linear-gradient(135deg, #f97316, #fb923c)',
                  boxShadow: '0 8px 24px rgba(249, 115, 22, 0.3)',
                }}
              >
                {leaderboard[2].userName.charAt(0)}
              </div>
              <span className="absolute -top-2 -right-2 text-2xl">🥉</span>
            </div>
            <p className="font-bold text-white truncate">{leaderboard[2].userName}</p>
            <p className="text-sm text-slate-400">{xpService.formatXP(leaderboard[2].totalXP)} XP</p>
            <div 
              className="mt-3 mx-auto h-16 rounded-t-xl"
              style={{ 
                background: 'linear-gradient(to top, #f97316, #fb923c)',
                minWidth: '80px',
                opacity: 0.8,
              }}
            />
          </div>
        </div>
      )}

      {/* Leaderboard List */}
      <div className="space-y-3">
        {leaderboard.slice(3).map((entry, index) => (
          <div
            key={entry.userId}
            className="flex items-center gap-4 p-4 rounded-xl animate-fade-in-up"
            style={{
              animationDelay: `${index * 50}ms`,
              background: 'linear-gradient(145deg, #1a1a2e, #16213e)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateX(8px)';
              e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(99, 102, 241, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateX(0)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.2)';
            }}
          >
            {/* Rank */}
            <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-slate-400"
              style={{ background: 'rgba(255, 255, 255, 0.05)' }}
            >
              #{entry.rank}
            </div>

            {/* Avatar */}
            <div 
              className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold"
              style={{
                background: `linear-gradient(135deg, #6366f1, #a855f7)`,
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.35)',
              }}
            >
              {entry.userName.charAt(0)}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white truncate">{entry.userName}</p>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span>Level {entry.level}</span>
                <span>•</span>
                <span>{entry.questionsAnswered} cau hoi</span>
              </div>
            </div>

            {/* Streak */}
            {entry.streak > 0 && (
              <div className="flex items-center gap-1 px-3 py-1 rounded-lg"
                style={{ background: 'rgba(249, 115, 22, 0.15)' }}
              >
                <span className="text-orange-400">🔥</span>
                <span className="text-sm font-semibold text-orange-400">{entry.streak}</span>
              </div>
            )}

            {/* XP */}
            <div className="text-right">
              <p className="text-lg font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                {xpService.formatXP(entry.totalXP)}
              </p>
              <p className="text-xs text-slate-500">XP</p>
            </div>

            {/* Rank Change */}
            {entry.rankChange !== undefined && entry.rankChange !== 0 && (
              <div className={`text-sm font-bold ${
                entry.rankChange > 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {entry.rankChange > 0 ? '↑' : '↓'} {Math.abs(entry.rankChange)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
