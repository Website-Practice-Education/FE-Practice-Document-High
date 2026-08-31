import api from './api';

const SPEAKING_BASE_URL = '/speaking';

export interface SpeakingTopic {
  id: number;
  title: string;
  description: string;
  difficulty: number;
  category: string;
  level: string;
  estimatedMinutes: number;
  prompts: SpeakingPrompt[];
}

export interface SpeakingPrompt {
  id: number;
  topicId: number;
  question: string;
  hint?: string;
  suggestedVocabulary?: string[];
  maxDurationSeconds: number;
  order: number;
}

export interface SpeakingAttempt {
  id: number;
  topicId: number;
  userId: number;
  promptId: number;
  audioUrl?: string;
  transcript?: string;
  score?: number;
  pronunciationScore?: number;
  fluencyScore?: number;
  grammarScore?: number;
  vocabularyScore?: number;
  feedback?: string;
  completedAt: string;
}

export interface SpeakingLevel {
  level: number;
  name: string;
  minPoints: number;
  maxPoints: number;
  color: string;
  icon: string;
  description: string;
  requiredTopics: number;
  completedTopics: number;
}

export interface UserSpeakingStats {
  totalAttempts: number;
  totalTimeMinutes: number;
  averageScore: number;
  currentStreak: number;
  longestStreak: number;
  totalPoints: number;
  currentLevel: number;
  nextLevelPoints: number;
  topicsCompleted: number;
  totalTopics: number;
  weeklyGoalMinutes: number;
  weeklyProgressMinutes: number;
}

export interface LeaderboardEntry {
  rank: number;
  userId: number;
  userName: string;
  userAvatar?: string;
  totalPoints: number;
  averageScore: number;
  topicsCompleted: number;
  currentLevel: number;
  streak: number;
}

export const speakingService = {
  // Topics
  getTopics: async (difficulty?: number, category?: string): Promise<SpeakingTopic[]> => {
    const params = new URLSearchParams();
    if (difficulty) params.append('difficulty', String(difficulty));
    if (category) params.append('category', category);
    const response = await api.get(`${SPEAKING_BASE_URL}/topics`, { params });
    return response.data.data;
  },

  getTopic: async (id: number): Promise<SpeakingTopic> => {
    const response = await api.get(`${SPEAKING_BASE_URL}/topics/${id}`);
    return response.data.data;
  },

  getRandomTopic: async (difficulty?: number): Promise<SpeakingTopic> => {
    const params = new URLSearchParams();
    if (difficulty) params.append('difficulty', String(difficulty));
    const response = await api.get(`${SPEAKING_BASE_URL}/topics/random`, { params });
    return response.data.data;
  },

  // Attempts
  saveAttempt: async (data: {
    topicId: number;
    promptId: number;
    audioBlob?: Blob;
    transcript?: string;
    durationSeconds: number;
  }): Promise<SpeakingAttempt> => {
    const formData = new FormData();
    formData.append('topicId', String(data.topicId));
    formData.append('promptId', String(data.promptId));
    if (data.audioBlob) {
      formData.append('audio', data.audioBlob, 'recording.webm');
    }
    if (data.transcript) formData.append('transcript', data.transcript);
    formData.append('durationSeconds', String(data.durationSeconds));

    const response = await api.post(`${SPEAKING_BASE_URL}/attempts`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
  },

  getMyAttempts: async (topicId?: number): Promise<SpeakingAttempt[]> => {
    const params = topicId ? { topicId: String(topicId) } : {};
    const response = await api.get(`${SPEAKING_BASE_URL}/attempts`, { params });
    return response.data.data;
  },

  getAttempt: async (id: number): Promise<SpeakingAttempt> => {
    const response = await api.get(`${SPEAKING_BASE_URL}/attempts/${id}`);
    return response.data.data;
  },

  // Stats
  getMyStats: async (): Promise<UserSpeakingStats> => {
    const response = await api.get(`${SPEAKING_BASE_URL}/stats`);
    return response.data.data;
  },

  // Levels
  getLevels: async (): Promise<SpeakingLevel[]> => {
    const response = await api.get(`${SPEAKING_BASE_URL}/levels`);
    return response.data.data;
  },

  getMyLevel: async (): Promise<SpeakingLevel> => {
    const response = await api.get(`${SPEAKING_BASE_URL}/levels/current`);
    return response.data.data;
  },

  // Leaderboard
  getLeaderboard: async (limit = 20): Promise<LeaderboardEntry[]> => {
    const response = await api.get(`${SPEAKING_BASE_URL}/leaderboard`, { params: { limit } });
    return response.data.data;
  },
};

// Speaking Level definitions (for frontend)
export const SPEAKING_LEVELS: SpeakingLevel[] = [
  { level: 1, name: 'Người mới', minPoints: 0, maxPoints: 100, color: '#94a3b8', icon: '🌱', description: 'Bắt đầu hành trình luyện nói', requiredTopics: 0, completedTopics: 0 },
  { level: 2, name: 'Người tập nói', minPoints: 100, maxPoints: 300, color: '#22c55e', icon: '🌿', description: 'Cải thiện phát âm cơ bản', requiredTopics: 3, completedTopics: 0 },
  { level: 3, name: 'Người luyện tập', minPoints: 300, maxPoints: 600, color: '#06b6d4', icon: '🌳', description: 'Phát triển sự tự tin', requiredTopics: 7, completedTopics: 0 },
  { level: 4, name: 'Người tiến bộ', minPoints: 600, maxPoints: 1000, color: '#3b82f6', icon: '🌲', description: 'Nói trôi chảy hơn', requiredTopics: 12, completedTopics: 0 },
  { level: 5, name: 'Người thành thạo', minPoints: 1000, maxPoints: 1500, color: '#8b5cf6', icon: '⭐', description: 'Kỹ năng nói tốt', requiredTopics: 18, completedTopics: 0 },
  { level: 6, name: 'Người giỏi', minPoints: 1500, maxPoints: 2200, color: '#f59e0b', icon: '🌟', description: 'Nói lưu loát và chính xác', requiredTopics: 25, completedTopics: 0 },
  { level: 7, name: 'Chuyên gia', minPoints: 2200, maxPoints: 3000, color: '#ef4444', icon: '💎', description: 'Trình độ người bản ngữ', requiredTopics: 33, completedTopics: 0 },
  { level: 8, name: 'Bậc thầy', minPoints: 3000, maxPoints: Infinity, color: '#ec4899', icon: '👑', description: 'Hoàn hảo về ngôn ngữ', requiredTopics: 42, completedTopics: 0 },
];

export const getLevelFromPoints = (points: number): SpeakingLevel => {
  for (let i = SPEAKING_LEVELS.length - 1; i >= 0; i--) {
    if (points >= SPEAKING_LEVELS[i].minPoints) {
      return SPEAKING_LEVELS[i];
    }
  }
  return SPEAKING_LEVELS[0];
};

export const getProgressToNextLevel = (points: number): { current: number; required: number; percentage: number } => {
  const currentLevel = getLevelFromPoints(points);
  if (currentLevel.maxPoints === Infinity) {
    return { current: points - currentLevel.minPoints, required: 1, percentage: 100 };
  }
  const current = points - currentLevel.minPoints;
  const required = currentLevel.maxPoints - currentLevel.minPoints;
  return { current, required, percentage: Math.min((current / required) * 100, 100) };
};
