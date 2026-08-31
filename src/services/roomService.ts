import api from './api';

const BASE_URL = '/room';

// Types
export interface MusicTrack {
  id: number;
  spaceId: number;
  title: string;
  artist?: string;
  sourceType: 'upload' | 'link';
  filePath?: string;
  externalUrl?: string;
  durationSeconds: number;
  uploadedBy: number;
  uploaderName?: string;
  createdAt: string;
}

export interface SharedFile {
  id: number;
  spaceId: number;
  fileName: string;
  originalName: string;
  filePath: string;
  fileSize: number;
  contentType: string;
  fileType: 'image' | 'video' | 'audio' | 'pdf' | 'document' | 'spreadsheet' | 'presentation' | 'archive' | 'other';
  uploadedBy: number;
  uploaderName?: string;
  createdAt: string;
}

export interface RoomSettings {
  id?: number;
  spaceId: number;
  backgroundType: 'theme' | 'custom';
  backgroundValue?: string;
  backgroundImagePath?: string;
  accentColor?: string;
  updatedAt?: string;
}

// Music Service
export const musicService = {
  getTracks: async (spaceId: number): Promise<MusicTrack[]> => {
    const response = await api.get(`${BASE_URL}/${spaceId}/music`);
    return response.data.data;
  },

  addFromLink: async (spaceId: number, data: { title: string; artist?: string; url: string; durationSeconds: number }): Promise<MusicTrack> => {
    const response = await api.post(`${BASE_URL}/${spaceId}/music/link`, data);
    return response.data.data;
  },

  upload: async (spaceId: number, file: File, title: string, artist?: string, duration: number = 0): Promise<MusicTrack> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    if (artist) formData.append('artist', artist);
    formData.append('duration', duration.toString());

    const response = await api.post(`${BASE_URL}/${spaceId}/music/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
  },

  delete: async (trackId: number): Promise<void> => {
    await api.delete(`${BASE_URL}/music/${trackId}`);
  },
};

// File Sharing Service
export const fileService = {
  getFiles: async (spaceId: number): Promise<SharedFile[]> => {
    const response = await api.get(`${BASE_URL}/${spaceId}/files`);
    return response.data.data;
  },

  upload: async (spaceId: number, file: File): Promise<SharedFile> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post(`${BASE_URL}/${spaceId}/files/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
  },

  download: async (fileId: number): Promise<Blob> => {
    const response = await api.get(`${BASE_URL}/files/${fileId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  delete: async (fileId: number): Promise<void> => {
    await api.delete(`${BASE_URL}/files/${fileId}`);
  },

  getDownloadUrl: (fileId: number): string => {
    const token = localStorage.getItem('token');
    return `${import.meta.env.VITE_API_URL || ''}${BASE_URL}/files/${fileId}/download?access_token=${token}`;
  },
};

// Room Settings Service
export const roomSettingsService = {
  get: async (spaceId: number): Promise<RoomSettings> => {
    const response = await api.get(`${BASE_URL}/${spaceId}/settings`);
    return response.data.data;
  },

  updateBackground: async (spaceId: number, backgroundType: string, backgroundValue?: string, backgroundImagePath?: string): Promise<RoomSettings> => {
    const response = await api.put(`${BASE_URL}/${spaceId}/settings/background`, {
      backgroundType,
      backgroundValue,
      backgroundImagePath,
    });
    return response.data.data;
  },

  uploadBackgroundImage: async (spaceId: number, file: File): Promise<{ backgroundImagePath: string; imageUrl: string }> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post(`${BASE_URL}/${spaceId}/settings/background/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
  },

  updateAccentColor: async (spaceId: number, accentColor: string): Promise<RoomSettings> => {
    const response = await api.put(`${BASE_URL}/${spaceId}/settings/accent`, { accentColor });
    return response.data.data;
  },
};
