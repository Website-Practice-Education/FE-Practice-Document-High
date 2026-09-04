import { useState, useEffect } from 'react';

interface StreakProps {
  currentStreak: number;
  longestStreak: number;
  showDetails?: boolean;
}

const DAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

export default function Streak({ currentStreak, longestStreak, showDetails = true }: StreakProps) {
  const [weekProgress, setWeekProgress] = useState<boolean[]>([false, false, false, false, false, false, false]);
  const [todayIndex, setTodayIndex] = useState(new Date().getDay());

  useEffect(() => {
    // Simulate week progress - in real app this would come from API
    const mockProgress = [true, true, true, true, true, false, false];
    setWeekProgress(mockProgress);
    setTodayIndex(new Date().getDay());
  }, []);

  const getDayClass = (index: number, isActive: boolean) => {
    const isToday = index === todayIndex || (todayIndex === 0 && index === 0);
    
    if (!isActive) {
      return 'bg-slate-800/50 text-slate-500';
    }
    
    if (isToday) {
      return 'bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-lg';
    }
    
    return 'bg-gradient-to-br from-amber-500 to-orange-500 text-white';
  };

  const getFireEmoji = () => {
    if (currentStreak >= 30) return '🔥🔥🔥';
    if (currentStreak >= 7) return '🔥🔥';
    if (currentStreak >= 3) return '🔥';
    return '';
  };

  return (
    <div className="space-y-4">
      {/* Main Streak Display */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <span className="text-4xl">{getFireEmoji()}</span>
          <span className="text-6xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent font-[family-name:var(--font-display)]">
            {currentStreak}
          </span>
          <span className="text-4xl">{getFireEmoji()}</span>
        </div>
        <p className="text-slate-400 text-sm">Ngay lien tiep</p>
      </div>

      {/* Week Progress */}
      {showDetails && (
        <div className="space-y-3">
          <div className="flex justify-between gap-2">
            {DAYS.map((day, index) => (
              <div key={day} className="flex flex-col items-center gap-2">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-semibold text-sm transition-all duration-300 ${getDayClass(index, weekProgress[index])}`}
                  style={{
                    boxShadow: weekProgress[index] ? '0 4px 12px rgba(249, 115, 22, 0.4)' : 'none',
                  }}
                >
                  {index === todayIndex || (todayIndex === 0 && index === 0) ? 'H' : ''}
                </div>
                <span className={`text-xs ${index === todayIndex || (todayIndex === 0 && index === 0) ? 'text-orange-400 font-semibold' : 'text-slate-500'}`}>
                  {day}
                </span>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 pt-3" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div className="text-center p-3 rounded-xl" style={{ background: 'rgba(249, 115, 22, 0.1)' }}>
              <p className="text-2xl font-bold text-orange-400">🏆</p>
              <p className="text-xs text-slate-400 mt-1">Ky luc</p>
              <p className="text-lg font-bold text-white">{longestStreak} ngay</p>
            </div>
            <div className="text-center p-3 rounded-xl" style={{ background: 'rgba(99, 102, 241, 0.1)' }}>
              <p className="text-2xl font-bold text-indigo-400">🎯</p>
              <p className="text-xs text-slate-400 mt-1">Muc tieu</p>
              <p className="text-lg font-bold text-white">30 ngay</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
