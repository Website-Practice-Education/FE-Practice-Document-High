// Achievement Service
export interface Achievement {
  id: number;
  code: string;
  name: string;
  description: string;
  iconUrl?: string;
  xpReward: number;
  conditionType?: string;
  conditionValue?: number;
  isActive: boolean;
  achievedAt?: string;
}

export interface UserAchievement {
  achievementId: number;
  achievedAt: string;
  achievement?: Achievement;
}

const ACHIEVEMENT_ICONS: Record<string, string> = {
  'first_login': '🎯',
  'first_exam': '📝',
  'first_question': '❓',
  'streak_3': '🔥',
  'streak_7': '🔥',
  'streak_30': '🔥',
  'questions_100': '🧠',
  'questions_500': '💡',
  'questions_1000': '🏆',
  'perfect_exam': '💯',
  'speed_demon': '⚡',
  'early_bird': '🌅',
  'night_owl': '🦉',
  'social_butterfly': '🦋',
  'helper': '🤝',
  'consistent': '📊',
  'master': '👑',
  'scholar': '🎓',
};

class AchievementService {
  private readonly API_URL = 'http://localhost:5058/api';

  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };
  }

  async getAllAchievements(): Promise<Achievement[]> {
    try {
      const response = await fetch(`${this.API_URL}/achievement`, {
        headers: this.getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to fetch achievements');
      const result = await response.json();
      const data = result.data || result;
      return Array.isArray(data) ? data : this.getDefaultAchievements();
    } catch (error) {
      console.error('Error fetching achievements:', error);
      return this.getDefaultAchievements();
    }
  }

  async getUserAchievements(userId: number): Promise<UserAchievement[]> {
    try {
      const response = await fetch(`${this.API_URL}/achievement/my`, {
        headers: this.getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to fetch user achievements');
      const result = await response.json();
      return (result.data || result) as UserAchievement[];
    } catch (error) {
      console.error('Error fetching user achievements:', error);
      return [];
    }
  }

  async checkAndAwardAchievements(): Promise<Achievement[]> {
    try {
      const response = await fetch(`${this.API_URL}/achievement/check`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to check achievements');
      const result = await response.json();
      return (result.data || []) as Achievement[];
    } catch (error) {
      console.error('Error checking achievements:', error);
      return [];
    }
  }

  getAchievementIcon(code: string): string {
    return ACHIEVEMENT_ICONS[code] || '🏅';
  }

  getAchievementRarity(achievement: Achievement): { label: string; color: string; bgColor: string } {
    const xpReward = achievement.xpReward;
    
    if (xpReward >= 200) {
      return { 
        label: 'Legendary', 
        color: 'text-yellow-400', 
        bgColor: 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/30' 
      };
    }
    if (xpReward >= 100) {
      return { 
        label: 'Rare', 
        color: 'text-purple-400', 
        bgColor: 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/30' 
      };
    }
    if (xpReward >= 50) {
      return { 
        label: 'Uncommon', 
        color: 'text-blue-400', 
        bgColor: 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-blue-500/30' 
      };
    }
    return { 
      label: 'Common', 
      color: 'text-slate-400', 
      bgColor: 'bg-slate-500/20 border-slate-500/30' 
    };
  }

  getDefaultAchievements(): Achievement[] {
    return [
      {
        id: 1,
        code: 'first_login',
        name: 'Chào buổi sáng!',
        description: 'Đăng nhập lần đầu tiên',
        xpReward: 10,
        conditionType: 'login_count',
        conditionValue: 1,
        isActive: true,
      },
      {
        id: 2,
        code: 'first_question',
        name: 'Câu hỏi đầu tiên',
        description: 'Trả lời câu hỏi đầu tiên',
        xpReward: 20,
        conditionType: 'questions_answered',
        conditionValue: 1,
        isActive: true,
      },
      {
        id: 3,
        code: 'first_exam',
        name: 'Bài thi đầu tiên',
        description: 'Hoàn thành bài thi đầu tiên',
        xpReward: 50,
        conditionType: 'exams_completed',
        conditionValue: 1,
        isActive: true,
      },
      {
        id: 4,
        code: 'streak_3',
        name: 'Khởi đầu',
        description: 'Học liên tục 3 ngày',
        xpReward: 75,
        conditionType: 'streak_days',
        conditionValue: 3,
        isActive: true,
      },
      {
        id: 5,
        code: 'streak_7',
        name: 'Tuần này là của tôi',
        description: 'Học liên tục 7 ngày',
        xpReward: 150,
        conditionType: 'streak_days',
        conditionValue: 7,
        isActive: true,
      },
      {
        id: 6,
        code: 'streak_30',
        name: 'Chiến binh tháng',
        description: 'Học liên tục 30 ngày',
        xpReward: 500,
        conditionType: 'streak_days',
        conditionValue: 30,
        isActive: true,
      },
      {
        id: 7,
        code: 'questions_100',
        name: 'Người tò mò',
        description: 'Trả lời 100 câu hỏi',
        xpReward: 100,
        conditionType: 'questions_answered',
        conditionValue: 100,
        isActive: true,
      },
      {
        id: 8,
        code: 'questions_500',
        name: 'Học giả',
        description: 'Trả lời 500 câu hỏi',
        xpReward: 250,
        conditionType: 'questions_answered',
        conditionValue: 500,
        isActive: true,
      },
      {
        id: 9,
        code: 'questions_1000',
        name: 'Bậc thầy tri thức',
        description: 'Trả lời 1000 câu hỏi',
        xpReward: 500,
        conditionType: 'questions_answered',
        conditionValue: 1000,
        isActive: true,
      },
      {
        id: 10,
        code: 'perfect_exam',
        name: 'Hoàn hảo',
        description: 'Đạt 100% trong một bài thi',
        xpReward: 200,
        conditionType: 'perfect_score',
        conditionValue: 1,
        isActive: true,
      },
      {
        id: 11,
        code: 'speed_demon',
        name: 'Tốc độ ánh sáng',
        description: 'Trả lời đúng trong vòng 5 giây',
        xpReward: 50,
        conditionType: 'fast_answer',
        conditionValue: 5,
        isActive: true,
      },
      {
        id: 12,
        code: 'early_bird',
        name: 'Gà sớm',
        description: 'Học trước 7 giờ sáng',
        xpReward: 30,
        conditionType: 'early_bird',
        conditionValue: 1,
        isActive: true,
      },
      {
        id: 13,
        code: 'night_owl',
        name: 'Cú đêm',
        description: 'Học sau 11 giờ đêm',
        xpReward: 30,
        conditionType: 'night_owl',
        conditionValue: 1,
        isActive: true,
      },
      {
        id: 14,
        code: 'social_butterfly',
        name: 'Bướm xã hội',
        description: 'Tham gia 10 phòng học',
        xpReward: 100,
        conditionType: 'spaces_joined',
        conditionValue: 10,
        isActive: true,
      },
      {
        id: 15,
        code: 'helper',
        name: 'Người giúp đỡ',
        description: 'Đóng góp 10 câu hỏi cho cộng đồng',
        xpReward: 150,
        conditionType: 'questions_created',
        conditionValue: 10,
        isActive: true,
      },
    ];
  }
}

export default new AchievementService();
