// Leaderboard Service
import xpService from './xpService';

export interface LeaderboardEntry {
  rank: number;
  userId: number;
  userName: string;
  avatarUrl?: string;
  totalXP: number;
  level: number;
  weeklyXP: number;
  streak: number;
  questionsAnswered: number;
  examsCompleted: number;
  rankChange?: number;
}

export interface LeaderboardFilter {
  type: 'all' | 'weekly' | 'monthly';
  limit?: number;
}

class LeaderboardService {
  private readonly API_URL = 'http://localhost:5058/api';

  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };
  }

  async getLeaderboard(filter: LeaderboardFilter = { type: 'all', limit: 50 }): Promise<LeaderboardEntry[]> {
    try {
      const response = await fetch(`${this.API_URL}/leaderboard?type=${filter.type}&limit=${filter.limit || 50}`, {
        headers: this.getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to fetch leaderboard');
      
      const result = await response.json();
      const data = result.data || result;
      return this.mapLeaderboardData(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      return this.getMockLeaderboard();
    }
  }

  async getUserRank(userId: number): Promise<number> {
    try {
      const response = await fetch(`${this.API_URL}/leaderboard/user/${userId}`, {
        headers: this.getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to fetch user rank');
      const result = await response.json();
      return result.data?.rank || 0;
    } catch (error) {
      console.error('Error fetching user rank:', error);
      return 0;
    }
  }

  async getMyRank(): Promise<any> {
    try {
      const response = await fetch(`${this.API_URL}/leaderboard/my-rank`, {
        headers: this.getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to fetch my rank');
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching my rank:', error);
      return null;
    }
  }

  async getTopUsers(type: 'xp' | 'streak' | 'questions' = 'xp', limit: number = 10): Promise<LeaderboardEntry[]> {
    try {
      const response = await fetch(`${this.API_URL}/leaderboard/top/${type}?limit=${limit}`, {
        headers: this.getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to fetch top users');
      const result = await response.json();
      return this.mapLeaderboardData(Array.isArray(result.data) ? result.data : []);
    } catch (error) {
      console.error('Error fetching top users:', error);
      return this.getMockLeaderboard().slice(0, limit);
    }
  }

  private mapLeaderboardData(data: any[]): LeaderboardEntry[] {
    return data.map((user: any, index: number) => ({
      rank: user.rank || index + 1,
      userId: user.userId || user.id,
      userName: user.userName || user.fullName || user.name,
      avatarUrl: user.avatarUrl,
      totalXP: user.totalXP || user.xp || 0,
      level: user.level || xpService.calculateLevel(user.totalXP || user.xp || 0),
      weeklyXP: user.weeklyXP || user.monthlyXP || 0,
      streak: user.streak || 0,
      questionsAnswered: user.questionsAnswered || 0,
      examsCompleted: user.examsCompleted || 0,
      rankChange: user.rankChange || 0,
    }));
  }

  private getMockLeaderboard(): LeaderboardEntry[] {
    const names = [
      'Nguyen Van A', 'Tran Thi B', 'Le Van C', 'Pham Thi D', 'Hoang Van E',
      'Nguyen Thi F', 'Do Van G', 'Bui Thi H', 'Pham Van I', 'Tran Van K',
      'Le Thi L', 'Hoang Thi M', 'Vu Van N', 'Dang Thi P', 'Ngo Van Q'
    ];

    return names.map((name, index) => ({
      rank: index + 1,
      userId: index + 1,
      userName: name,
      totalXP: Math.floor(Math.random() * 5000) + 1000 - (index * 200),
      level: Math.floor(Math.random() * 10) + 5 - Math.floor(index / 3),
      weeklyXP: Math.floor(Math.random() * 500) + 100 - (index * 30),
      streak: Math.floor(Math.random() * 30) + 1 - Math.floor(index / 5),
      questionsAnswered: Math.floor(Math.random() * 500) + 50,
      examsCompleted: Math.floor(Math.random() * 20) + 1,
      rankChange: Math.floor(Math.random() * 5) - 2,
    })).sort((a, b) => b.totalXP - a.totalXP).map((user, index) => ({
      ...user,
      rank: index + 1,
    }));
  }

  getRankIcon(rank: number): { icon: string; color: string; bgColor: string } {
    if (rank === 1) {
      return { icon: '👑', color: 'text-yellow-400', bgColor: 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20' };
    }
    if (rank === 2) {
      return { icon: '🥈', color: 'text-slate-300', bgColor: 'bg-gradient-to-r from-slate-400/20 to-slate-500/20' };
    }
    if (rank === 3) {
      return { icon: '🥉', color: 'text-orange-400', bgColor: 'bg-gradient-to-r from-orange-500/20 to-orange-600/20' };
    }
    return { icon: `#${rank}`, color: 'text-slate-400', bgColor: 'bg-slate-500/10' };
  }

  getRankChangeIcon(change: number): { icon: string; color: string } {
    if (change > 0) {
      return { icon: '↑', color: 'text-green-400' };
    }
    if (change < 0) {
      return { icon: '↓', color: 'text-red-400' };
    }
    return { icon: '—', color: 'text-slate-500' };
  }
}

export default new LeaderboardService();
