// XP Service - Handle XP, Level, and Progress calculations
const XP_PER_LEVEL = 500;
const XP_MULTIPLIERS = {
  correct_answer: 10,
  exam_completed: 50,
  daily_streak: 25,
  achievement_unlocked: 100,
  lesson_completed: 30,
  discussion_participation: 5,
};

export interface UserXP {
  userId: number;
  totalXP: number;
  level: number;
  currentLevelXP: number;
  nextLevelXP: number;
  progressPercent: number;
}

export interface DailyProgress {
  questionsAnswered: number;
  questionsCorrect: number;
  studyMinutes: number;
  examsCompleted: number;
  xpEarned: number;
  streak: number;
}

export interface LeaderboardEntry {
  rank: number;
  userId: number;
  userName: string;
  avatarUrl?: string;
  totalXP: number;
  level: number;
  weeklyXP: number;
  streak: number;
}

class XPService {
  calculateLevel(totalXP: number): number {
    return Math.floor(totalXP / XP_PER_LEVEL) + 1;
  }

  calculateCurrentLevelXP(totalXP: number): number {
    return totalXP % XP_PER_LEVEL;
  }

  calculateProgressPercent(totalXP: number): number {
    return (totalXP % XP_PER_LEVEL) / XP_PER_LEVEL * 100;
  }

  getLevelProgress(totalXP: number): UserXP {
    const level = this.calculateLevel(totalXP);
    const currentLevelXP = this.calculateCurrentLevelXP(totalXP);
    
    return {
      userId: 0,
      totalXP,
      level,
      currentLevelXP,
      nextLevelXP: XP_PER_LEVEL,
      progressPercent: this.calculateProgressPercent(totalXP),
    };
  }

  calculateXPEarned(action: keyof typeof XP_MULTIPLIERS, bonus?: number): number {
    const baseXP = XP_MULTIPLIERS[action] || 0;
    const multiplier = bonus || 1;
    return Math.floor(baseXP * multiplier);
  }

  getLevelTitle(level: number): string {
    if (level >= 50) return 'Huyền thoại';
    if (level >= 40) return 'Bậc thầy';
    if (level >= 30) return 'Chuyên gia';
    if (level >= 20) return 'Người giỏi';
    if (level >= 10) return 'Người học';
    if (level >= 5) return 'Người mới';
    return 'Tân binh';
  }

  getLevelColor(level: number): string {
    if (level >= 50) return 'from-purple-500 to-pink-500';
    if (level >= 40) return 'from-red-500 to-orange-500';
    if (level >= 30) return 'from-yellow-500 to-amber-500';
    if (level >= 20) return 'from-green-500 to-emerald-500';
    if (level >= 10) return 'from-cyan-500 to-teal-500';
    if (level >= 5) return 'from-blue-500 to-indigo-500';
    return 'from-slate-400 to-slate-500';
  }

  formatXP(xp: number): string {
    if (xp >= 10000) {
      return (xp / 1000).toFixed(1) + 'K';
    }
    return xp.toString();
  }
}

export default new XPService();
