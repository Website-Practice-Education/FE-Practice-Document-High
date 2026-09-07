// Progress Service - Daily progress tracking
// Updated to use real API data instead of mock data

export interface DailyProgress {
  id?: number;
  userId?: number;
  date?: string;
  progressDate?: string;
  questionsAnswered: number;
  questionsCorrect: number;
  correctAnswers?: number;
  studyMinutes: number;
  timeSpentMinutes?: number;
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
  dailyXP: number[];
  dailyProgress?: Array<{
    date: string;
    questionsAnswered: number;
    correctAnswers: number;
    timeSpentMinutes: number;
    xpEarned?: number;
  }>;
}

export interface MonthlyStats {
  year: number;
  month: number;
  monthName: string;
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

// Dashboard response from API
export interface DashboardResponse {
  totalQuestionsAnswered: number;
  totalCorrectAnswers: number;
  accuracyRate: number;
  totalExamsTaken: number;
  averageScore: number;
  currentStreak: number;
  longestStreak: number;
  totalStudyTimeMinutes: number;
  lessonsCompleted: number;
  topicsCompleted: number;
  weeklyProgress: Array<{
    date: string;
    questionsAnswered: number;
    correctAnswers: number;
    timeSpentMinutes: number;
  }>;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate?: string;
}

// API Response wrapper
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
  errors: string[];
}

class ProgressService {
  private readonly API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5058/api';

  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };
  }

  private async handleResponse<T>(response: Response): Promise<T | null> {
    if (!response.ok) {
      console.error(`API Error: ${response.status} ${response.statusText}`);
      return null;
    }
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  // Get dashboard data (main endpoint that returns comprehensive progress data)
  async getDashboard(): Promise<DashboardResponse | null> {
    try {
      const response = await fetch(`${this.API_URL}/progress/dashboard`, {
        headers: this.getAuthHeaders(),
      });
      const result: ApiResponse<DashboardResponse> = await this.handleResponse(response);
      return result?.data || null;
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      return null;
    }
  }

  // Get today's progress
  async getTodayProgress(): Promise<DailyProgress | null> {
    try {
      const response = await fetch(`${this.API_URL}/progress/today`, {
        headers: this.getAuthHeaders(),
      });
      const result: ApiResponse<any> = await this.handleResponse(response);
      
      if (result?.data) {
        return {
          id: result.data.id,
          userId: result.data.userId,
          progressDate: result.data.progressDate || result.data.date,
          questionsAnswered: result.data.questionsAnswered,
          questionsCorrect: result.data.questionsCorrect || result.data.correctAnswers,
          correctAnswers: result.data.correctAnswers || result.data.questionsCorrect,
          studyMinutes: result.data.studyMinutes || result.data.timeSpentMinutes || 0,
          timeSpentMinutes: result.data.timeSpentMinutes || result.data.studyMinutes || 0,
          examsCompleted: result.data.examsCompleted,
          xpEarned: result.data.xpEarned,
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching today progress:', error);
      return null;
    }
  }

  // Get weekly progress
  async getWeeklyProgress(): Promise<WeeklyStats | null> {
    try {
      const response = await fetch(`${this.API_URL}/progress/weekly`, {
        headers: this.getAuthHeaders(),
      });
      const result: ApiResponse<any> = await this.handleResponse(response);
      
      if (result?.data) {
        return {
          weekStart: result.data.weekStart,
          totalQuestions: result.data.totalQuestions,
          correctQuestions: result.data.correctQuestions,
          totalMinutes: result.data.totalMinutes,
          totalExams: result.data.totalExams,
          totalXP: result.data.totalXP,
          averageScore: result.data.averageScore,
          bestDay: result.data.bestDay,
          streak: result.data.streak,
          dailyXP: result.data.dailyXP || [],
          dailyProgress: result.data.dailyProgress,
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching weekly progress:', error);
      return null;
    }
  }

  // Get daily progress (alias for getTodayProgress)
  async getDailyProgress(_date?: string): Promise<DailyProgress | null> {
    return this.getTodayProgress();
  }

  // Get monthly stats
  async getMonthlyStats(): Promise<MonthlyStats | null> {
    try {
      const response = await fetch(`${this.API_URL}/progress/monthly`, {
        headers: this.getAuthHeaders(),
      });
      const result: ApiResponse<any> = await this.handleResponse(response);
      
      if (result?.data) {
        return {
          year: result.data.year,
          month: result.data.month,
          monthName: result.data.monthName,
          totalQuestions: result.data.totalQuestions,
          correctQuestions: result.data.correctQuestions,
          totalMinutes: result.data.totalMinutes,
          totalExams: result.data.totalExams,
          totalXP: result.data.totalXP,
          daysActive: result.data.daysActive,
          averageDailyXP: result.data.averageDailyXP,
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching monthly stats:', error);
      return null;
    }
  }

  // Get topic progress
  async getTopicProgress(): Promise<TopicProgress[]> {
    try {
      const response = await fetch(`${this.API_URL}/progress/topics`, {
        headers: this.getAuthHeaders(),
      });
      const result: ApiResponse<any[]> = await this.handleResponse(response);
      
      if (result?.data && Array.isArray(result.data)) {
        return result.data.map(t => ({
          topicId: t.topicId,
          topicName: t.topicName,
          totalQuestions: t.totalQuestions,
          correctCount: t.correctCount,
          accuracy: t.accuracy,
          lastPracticed: t.lastPracticed || '',
        }));
      }
      return [];
    } catch (error) {
      console.error('Error fetching topic progress:', error);
      return [];
    }
  }

  // Update daily progress (force refresh)
  async updateDailyProgress(): Promise<DailyProgress | null> {
    try {
      const response = await fetch(`${this.API_URL}/progress/update`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });
      const result: ApiResponse<any> = await this.handleResponse(response);
      
      if (result?.data) {
        return {
          questionsAnswered: result.data.questionsAnswered,
          questionsCorrect: result.data.correctAnswers,
          correctAnswers: result.data.correctAnswers,
          studyMinutes: result.data.timeSpentMinutes || 0,
          timeSpentMinutes: result.data.timeSpentMinutes || 0,
          examsCompleted: 0,
          xpEarned: result.data.xpEarned,
        };
      }
      return null;
    } catch (error) {
      console.error('Error updating progress:', error);
      return null;
    }
  }

  // Get streak data
  async getStreak(): Promise<StreakData> {
    try {
      const response = await fetch(`${this.API_URL}/progress/streak`, {
        headers: this.getAuthHeaders(),
      });
      const result: ApiResponse<StreakData> = await this.handleResponse(response);
      return result?.data || { currentStreak: 0, longestStreak: 0 };
    } catch (error) {
      console.error('Error fetching streak:', error);
      return { currentStreak: 0, longestStreak: 0 };
    }
  }

  // Update lesson progress
  async updateLessonProgress(lessonId: number, status: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.API_URL}/progress/lesson/${lessonId}`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ status }),
      });
      return response.ok;
    } catch (error) {
      console.error('Error updating lesson progress:', error);
      return false;
    }
  }

  // Update topic progress
  async updateTopicProgress(topicId: number, status: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.API_URL}/progress/topic/${topicId}`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ status }),
      });
      return response.ok;
    } catch (error) {
      console.error('Error updating topic progress:', error);
      return false;
    }
  }

  // Helper methods
  formatMinutes(minutes: number): string {
    if (!minutes || minutes < 60) {
      return `${minutes || 0}p`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }

  calculateAccuracy(correct: number, total: number): number {
    if (!total || total === 0) return 0;
    return Math.round((correct / total) * 100);
  }
}

export default new ProgressService();
