import api from './api';

const BASE_URL = '/livesessions';

// ASP.NET Core serializes collections as { $values: [...] }
const normalizeArray = (data: any): any[] => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.$values)) return data.$values;
  if (Array.isArray(data?.value)) return data.value;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.$values)) return data.data.$values;
  if (Array.isArray(data?.data?.items)) return data.data.items;
  if (data && typeof data === 'object') {
    const keys = ['items', 'data', 'documents', 'results', 'records'];
    for (const key of keys) {
      const value = data[key];
      if (Array.isArray(value)) return value;
      if (value && Array.isArray(value.$values)) return value.$values;
    }
  }
  return [];
};

export interface LiveSession {
  id: number;
  title: string;
  description?: string;
  sessionType: 'practice' | 'quiz' | 'competition';
  subjectName?: string;
  difficulty: number;
  currentParticipants: number;
  maxParticipants: number;
  status: 'waiting' | 'live' | 'ended';
  hostId: number;
  hostName?: string;
  inviteCode: string;
  createdAt: string;
}

export interface CreateSessionRequest {
  title: string;
  description?: string;
  sessionType: 'practice' | 'quiz' | 'competition';
  difficulty: number;
  maxParticipants: number;
}

export interface JoinSessionRequest {
  inviteCode?: string;
}

export const liveSessionService = {
  getSessions: async (): Promise<LiveSession[]> => {
    const response = await api.get(`${BASE_URL}`);
    return normalizeArray(response.data);
  },

  getSession: async (id: number): Promise<LiveSession> => {
    const response = await api.get(`${BASE_URL}/${id}`);
    return response.data?.data || response.data;
  },

  getLiveSessions: async (): Promise<LiveSession[]> => {
    const response = await api.get(`${BASE_URL}/live`);
    return normalizeArray(response.data);
  },

  createSession: async (data: CreateSessionRequest): Promise<LiveSession> => {
    const response = await api.post(BASE_URL, data);
    return response.data?.data || response.data;
  },

  updateSession: async (id: number, data: Partial<CreateSessionRequest>): Promise<LiveSession> => {
    const response = await api.put(`${BASE_URL}/${id}`, data);
    return response.data?.data || response.data;
  },

  joinSession: async (id: number, data?: JoinSessionRequest): Promise<void> => {
    await api.post(`${BASE_URL}/${id}/join`, data);
  },

  joinByCode: async (inviteCode: string): Promise<{ sessionId: number; sessionTitle: string }> => {
    const response = await api.post(`${BASE_URL}/join-by-code`, { inviteCode });
    return response.data?.data || response.data;
  },

  leaveSession: async (id: number): Promise<void> => {
    await api.post(`${BASE_URL}/${id}/leave`);
  },

  endSession: async (id: number): Promise<void> => {
    await api.post(`${BASE_URL}/${id}/end`);
  },

  deleteSession: async (id: number): Promise<void> => {
    await api.delete(`${BASE_URL}/${id}`);
  },
};
