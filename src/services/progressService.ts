// Progress Service - Daily progress tracking
export interface DailyProgress {
  id: number;
  userId: number;
  progressDate: string;
  questionsAnswered: number;
  questionsCorrect: number;
  studyMinutes: number;
  examsCompleted: number;
  xpEarned: number;
}

export interface WeeklyStats {
  weekStart: string;
  totalQuestions: number;
  correctQuestions: number;
  totalMinutes: number;
  totalExams: number;
  totalXP: number;
  averageScore: number;
  bestDay: string;
  streak: number;
}

export interface MonthlyStats {
  month: string;
  totalQuestions: number;
  correctQuestions: number;
  totalMinutes: number;
  totalExams: number;
  totalXP: number;
  daysActive: number;
  averageDailyXP: number;
}

export interface TopicProgress {
  topicId: number;
  topicName: string;
  totalQuestions: number;
  correctCount: number;
  accuracy: number;
  lastPracticed: string;
}

class ProgressService {
  private readonly API_URL = 'http://localhost:5058/api';

  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };
  }

  async getDailyProgress(userId: number, date?: string): Promise<DailyProgress | null> {
    try {
      const targetDate = date || new Date().toISOString().split('T')[0];
      const response = await fetch(`${this.API_URL}/progress/today`, {
        headers: this.getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to fetch daily progress');
      const result = await response.json();
      return result.data || this.getMockDailyProgress();
    } catch (error) {
      console.error('Error fetching daily progress:', error);
      return this.getMockDailyProgress();
    }
  }

  async getWeeklyStats(userId: number): Promise<WeeklyStats> {
    try {
      const response = await fetch(`${this.API_URL}/progress/weekly`, {
        headers: this.getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to fetch weekly stats');
      const result = await response.json();
      return result.data || this.getMockWeeklyStats();
    } catch (error) {
      console.error('Error fetching weekly stats:', error);
      return this.getMockWeeklyStats();
    }
  }

  async getMonthlyStats(userId: number): Promise<MonthlyStats> {
    try {
      const response = await fetch(`${this.API_URL}/users/${userId}/progress/monthly`);
      if (!response.ok) throw new Error('Failed to fetch monthly stats');
      return await response.json();
    } catch (error) {
      console.error('Error fetching monthly stats:', error);
      return this.getMockMonthlyStats();
    }
  }

  async getTopicProgress(userId: number): Promise<TopicProgress[]> {
    try {
      const response = await fetch(`${this.API_URL}/users/${userId}/progress/topics`);
      if (!response.ok) throw new Error('Failed to fetch topic progress');
      return await response.json();
    } catch (error) {
      console.error('Error fetching topic progress:', error);
      return this.getMockTopicProgress();
    }
  }

  async updateDailyProgress(userId: number, data: Partial<DailyProgress>): Promise<DailyProgress> {
    try {
      const response = await fetch(`${this.API_URL}/users/${userId}/progress/daily`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update progress');
      return await response.json();
    } catch (error) {
      console.error('Error updating progress:', error);
      throw error;
    }
  }

  async getStreak(userId: number): Promise<{ currentStreak: number; longestStreak: number }> {
    try {
      const response = await fetch(`${this.API_URL}/users/${userId}/progress/streak`);
      if (!response.ok) throw new Error('Failed to fetch streak');
      return await response.json();
    } catch (error) {
      console.error('Error fetching streak:', error);
      return { currentStreak: 5, longestStreak: 15 };
    }
  }

  // Mock data generators
  private getMockDailyProgress(): DailyProgress {
    return {
      id: 1,
      userId: 1,
      progressDate: new Date().toISOString().split('T')[0],
      questionsAnswered: Math.floor(Math.random() * 50) + 10,
      questionsCorrect: Math.floor(Math.random() * 30) + 5,
      studyMinutes: Math.floor(Math.random() * 120) + 30,
      examsCompleted: Math.floor(Math.random() * 3),
      xpEarned: Math.floor(Math.random() * 200) + 50,
    };
  }

  private getMockWeeklyStats(): WeeklyStats {
    return {
      weekStart: this.getWeekStart(),
      totalQuestions: Math.floor(Math.random() * 300) + 100,
      correctQuestions: Math.floor(Math.random() * 200) + 80,
      totalMinutes: Math.floor(Math.random() * 600) + 200,
      totalExams: Math.floor(Math.random() * 10) + 3,
      totalXP: Math.floor(Math.random() * 1000) + 300,
      averageScore: Math.floor(Math.random() * 30) + 60,
      bestDay: this.getWeekDays()[Math.floor(Math.random() * 5)],
      streak: Math.floor(Math.random() * 15) + 3,
    };
  }

  private getMockMonthlyStats(): MonthlyStats {
    return {
      month: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
      totalQuestions: Math.floor(Math.random() * 1500) + 500,
      correctQuestions: Math.floor(Math.random() * 1000) + 400,
      totalMinutes: Math.floor(Math.random() * 3000) + 1000,
      totalExams: Math.floor(Math.random() * 30) + 10,
      totalXP: Math.floor(Math.random() * 5000) + 1500,
      daysActive: Math.floor(Math.random() * 25) + 5,
      averageDailyXP: Math.floor(Math.random() * 200) + 50,
    };
  }

  private getMockTopicProgress(): TopicProgress[] {
    const topics = [
      'Toan Hoc', 'Vat Ly', 'Hoa Hoc', 'Sinh Hoc', 'Ngu Van',
      'Lich Su', 'Dia Ly', 'Anh Van', 'Tin Hoc', 'The Duc'
    ];

    return topics.map((name, index) => ({
      topicId: index + 1,
      topicName: name,
      totalQuestions: Math.floor(Math.random() * 100) + 20,
      correctCount: Math.floor(Math.random() * 70) + 10,
      accuracy: Math.floor(Math.random() * 40) + 60,
      lastPracticed: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    }));
  }

  private getWeekStart(): string {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    return new Date(now.setDate(diff)).toISOString().split('T')[0];
  }

  private getWeekDays(): string[] {
    const days = [];
    const now = new Date();
    for (let i = 0; i < 5; i++) {
      const day = new Date(now);
      day.setDate(now.getDate() - now.getDay() + i + 1);
      days.push(day.toLocaleDateString('vi-VN', { weekday: 'short' }));
    }
    return days;
  }

  formatMinutes(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} phut`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }

  calculateAccuracy(correct: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((correct / total) * 100);
  }
}

export default new ProgressService();
