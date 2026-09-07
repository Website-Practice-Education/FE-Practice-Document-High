import api from './api';

const BASE_URL = '/room';

// Helper to normalize array responses from backend.
// Backend uses ApiResponse<T> which serializes collections as { $values: [...] }
// (because of ReferenceHandler.Preserve in Program.cs).
const normalizeArray = (data: any): any[] => {
  if (Array.isArray(data)) return data;
  if (data?.data?.$values && Array.isArray(data.data.$values)) return data.data.$values;
  if (data?.data && Array.isArray(data.data)) return data.data;
  if (data?.$values && Array.isArray(data.$values)) return data.$values;
  if (data?.items && Array.isArray(data.items)) return data.items;
  if (data?.value && Array.isArray(data.value)) return data.value;
  return [];
};

// Types
export interface MusicTrack {
  id: number;
  spaceId: number;
  title: string;
  artist?: string;
  sourceType: 'upload' | 'link' | 'youtube';
  filePath?: string;
  externalUrl?: string;
  durationSeconds: number;
  uploadedBy: number;
  uploaderName?: string;
  createdAt: string;
  thumbnailUrl?: string;
}

// YouTube URL patterns
const YOUTUBE_PATTERNS = [
  /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
];

// Extract YouTube video ID
export const extractYouTubeId = (url: string): string | null => {
  for (const pattern of YOUTUBE_PATTERNS) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

// YouTube thumbnail URL helper
export const getYouTubeThumbnail = (videoId: string, quality: 'default' | 'medium' | 'high' | 'max' = 'medium'): string => {
  const qualityMap = {
    default: 'default',
    medium: 'mqdefault',
    high: 'hqdefault',
    max: 'maxresdefault',
  };
  return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}.jpg`;
};

// YouTube embed URL helper
export const getYouTubeEmbedUrl = (videoId: string): string => {
  return `https://www.youtube.com/embed/${videoId}?autoplay=0&controls=1&rel=0`;
};

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
    return normalizeArray(response.data);
  },

  addFromLink: async (spaceId: number, data: { title: string; artist?: string; url: string; durationSeconds: number }): Promise<MusicTrack> => {
    const response = await api.post(`${BASE_URL}/${spaceId}/music/link`, data);
    return response.data?.data || response.data;
  },

  /**
   * Add track from YouTube URL - auto extracts metadata
   */
  addFromYouTube: async (spaceId: number, youtubeUrl: string): Promise<MusicTrack> => {
    const videoId = extractYouTubeId(youtubeUrl);
    if (!videoId) {
      throw new Error('Invalid YouTube URL');
    }

    // Send to backend (backend will handle YouTube URL storage)
    const response = await api.post(`${BASE_URL}/${spaceId}/music/youtube`, {
      url: youtubeUrl,
      videoId: videoId,
    });
    return response.data?.data || response.data;
  },

  /**
   * Update track info (title, artist)
   */
  updateTrack: async (trackId: number, data: { title?: string; artist?: string }): Promise<MusicTrack> => {
    const response = await api.put(`${BASE_URL}/music/${trackId}`, data);
    return response.data?.data || response.data;
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
    return response.data?.data || response.data;
  },

  delete: async (trackId: number): Promise<void> => {
    await api.delete(`${BASE_URL}/music/${trackId}`);
  },

  /**
   * Get streaming URL for a track
   */
  getStreamUrl: (track: MusicTrack): string => {
    if (track.sourceType === 'youtube' && track.externalUrl) {
      const videoId = extractYouTubeId(track.externalUrl);
      if (videoId) {
        return getYouTubeEmbedUrl(videoId);
      }
    }
    if (track.filePath) {
      const token = localStorage.getItem('token');
      // Remove /api suffix from API_URL for static file access
      const baseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/api$/, '');
      return `${baseUrl}${track.filePath}?access_token=${token}`;
    }
    return track.externalUrl || '';
  },
};

// File Sharing Service
export const fileService = {
  getFiles: async (spaceId: number): Promise<SharedFile[]> => {
    const response = await api.get(`${BASE_URL}/${spaceId}/files`);
    return normalizeArray(response.data);
  },

  upload: async (spaceId: number, file: File): Promise<SharedFile> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post(`${BASE_URL}/${spaceId}/files/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data?.data || response.data;
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
    return response.data?.data || response.data;
  },

  updateBackground: async (spaceId: number, backgroundType: string, backgroundValue?: string, backgroundImagePath?: string): Promise<RoomSettings> => {
    const response = await api.put(`${BASE_URL}/${spaceId}/settings/background`, {
      backgroundType,
      backgroundValue,
      backgroundImagePath,
    });
    return response.data?.data || response.data;
  },

  uploadBackgroundImage: async (spaceId: number, file: File): Promise<{ backgroundImagePath: string; imageUrl: string }> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post(`${BASE_URL}/${spaceId}/settings/background/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data?.data || response.data;
  },

  updateAccentColor: async (spaceId: number, accentColor: string): Promise<RoomSettings> => {
    const response = await api.put(`${BASE_URL}/${spaceId}/settings/accent`, { accentColor });
    return response.data?.data || response.data;
  },
};
