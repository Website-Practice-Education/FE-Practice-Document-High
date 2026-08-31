import api from './api';

const BASE_URL = '/studyspaces';

// Helper to normalize array responses from backend
const normalizeArray = (data: any): any[] => {
  if (Array.isArray(data)) return data;
  if (data?.data) return Array.isArray(data.data) ? data.data : [data.data];
  if (data?.items) return data.items;
  return [];
};

export interface CreateSpaceRequest {
  name: string;
  description?: string;
  spaceType?: string;
}

export interface StudySpace {
  id: number;
  name: string;
  description?: string;
  spaceType: string;
  inviteCode?: string;
  maxMembers?: number;
  memberCount: number;
  members?: SpaceMember[];
  createdAt: string;
  creatorName?: string;
  isMember?: boolean;
}

export interface SpaceMember {
  id: number;
  name?: string;
  avatar?: string;
  role: string;
  joinedAt: string;
}

export interface UpdateSpaceRequest {
  name?: string;
  description?: string;
  spaceType?: string;
}

export const studySpaceService = {
  getMySpaces: async (): Promise<StudySpace[]> => {
    const response = await api.get(`${BASE_URL}`);
    return normalizeArray(response.data);
  },

  getMyCreatedSpaces: async (): Promise<StudySpace[]> => {
    const response = await api.get(`${BASE_URL}/my-created`);
    return normalizeArray(response.data);
  },

  getPublicSpaces: async (page = 1, pageSize = 20): Promise<StudySpace[]> => {
    const response = await api.get(`${BASE_URL}/public`, { params: { page, pageSize } });
    return normalizeArray(response.data);
  },

  getSpace: async (id: number): Promise<StudySpace> => {
    const response = await api.get(`${BASE_URL}/${id}`);
    return response.data?.data || response.data;
  },

  createSpace: async (data: CreateSpaceRequest): Promise<StudySpace> => {
    const response = await api.post(BASE_URL, data);
    return response.data?.data || response.data;
  },

  updateSpace: async (id: number, data: UpdateSpaceRequest): Promise<StudySpace> => {
    const response = await api.put(`${BASE_URL}/${id}`, data);
    return response.data?.data || response.data;
  },

  joinSpace: async (id: number, inviteCode?: string): Promise<void> => {
    await api.post(`${BASE_URL}/join/${id}`, { inviteCode });
  },

  joinByCode: async (inviteCode: string): Promise<{ spaceId: number; spaceName: string }> => {
    const response = await api.post(`${BASE_URL}/join-by-code`, { inviteCode });
    return response.data?.data || response.data;
  },

  leaveSpace: async (id: number): Promise<void> => {
    await api.post(`${BASE_URL}/leave/${id}`);
  },

  deleteSpace: async (id: number): Promise<void> => {
    await api.delete(`${BASE_URL}/${id}`);
  },
};

export interface ChatMessage {
  id: number;
  userId: number;
  userName?: string;
  userAvatar?: string;
  content: string;
  messageType: string;
  createdAt: string;
}

export const chatService = {
  getMessages: async (spaceId: number, page = 1, pageSize = 50): Promise<ChatMessage[]> => {
    const response = await api.get(`/chat/${spaceId}/messages`, { params: { page, pageSize } });
    return normalizeArray(response.data);
  },
};

export interface Friend {
  id: number;
  friendId: number;
  friendName?: string;
  friendAvatar?: string;
  status: string;
  createdAt: string;
}

export interface FriendRequest {
  id: number;
  userId: number;
  userName?: string;
  userAvatar?: string;
  createdAt: string;
}

export interface SearchUser {
  id: number;
  name?: string;
  avatar?: string;
  email?: string;
}

export const friendService = {
  getFriends: async (): Promise<Friend[]> => {
    const response = await api.get('/friends');
    return normalizeArray(response.data);
  },

  getPendingRequests: async (): Promise<FriendRequest[]> => {
    const response = await api.get('/friends/requests');
    return normalizeArray(response.data);
  },

  searchUsers: async (query: string): Promise<SearchUser[]> => {
    const response = await api.get('/friends/search', { params: { q: query } });
    return normalizeArray(response.data);
  },

  sendRequest: async (friendId: number): Promise<void> => {
    await api.post(`/friends/request/${friendId}`);
  },

  acceptRequest: async (requestId: number): Promise<void> => {
    await api.post(`/friends/accept/${requestId}`);
  },

  declineRequest: async (requestId: number): Promise<void> => {
    await api.post(`/friends/decline/${requestId}`);
  },

  removeFriend: async (friendId: number): Promise<void> => {
    await api.delete(`/friends/${friendId}`);
  },
};
