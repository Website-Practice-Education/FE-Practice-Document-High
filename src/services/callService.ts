import api from './api';

const BASE_URL = '/call';

// Helper to normalize API responses
const normalizeData = (data: any) => {
  if (data?.data) return data.data;
  return data;
};

const normalizeArray = (data: any): any[] => {
  if (Array.isArray(data)) return data;
  if (data?.$values && Array.isArray(data.$values)) return data.$values;
  if (data?.data?.$values && Array.isArray(data.data.$values)) return data.data.$values;
  if (data?.items && Array.isArray(data.items)) return data.items;
  return [];
};

// Types
export interface CallSession {
  id: number;
  spaceId: number;
  initiatorId: number;
  initiatorName: string;
  initiatorAvatar?: string;
  callType: 'audio' | 'video';
  roomId: string;
  status: 'active' | 'ended' | 'missed';
  startedAt: string;
  endedAt?: string;
  maxParticipants: number;
  participantCount: number;
  participants: CallParticipant[];
}

export interface CallParticipant {
  id: number;
  userId: number;
  userName: string;
  userAvatar?: string;
  joinTime: string;
  leaveTime?: string;
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
  peerId?: string;
}

// Call Service
export const callService = {
  // ===== Session Management =====

  /**
   * Start a new call in a space
   */
  startCall: async (spaceId: number, callType: 'audio' | 'video' = 'audio'): Promise<CallSession> => {
    const response = await api.post(`${BASE_URL}/start/${spaceId}`, { callType });
    return normalizeData(response.data);
  },

  /**
   * Get active call for a space
   */
  getActiveCall: async (spaceId: number): Promise<CallSession | null> => {
    try {
      const response = await api.get(`${BASE_URL}/active/${spaceId}`);
      return normalizeData(response.data);
    } catch (error: any) {
      if (error.response?.status === 404) return null;
      throw error;
    }
  },

  /**
   * Get call session details
   */
  getCallSession: async (sessionId: number): Promise<CallSession> => {
    const response = await api.get(`${BASE_URL}/${sessionId}`);
    return normalizeData(response.data);
  },

  /**
   * End a call session
   */
  endCall: async (sessionId: number): Promise<void> => {
    await api.post(`${BASE_URL}/${sessionId}/end`);
  },

  // ===== Participant Management =====

  /**
   * Join an existing call
   */
  joinCall: async (sessionId: number): Promise<CallParticipant> => {
    const response = await api.post(`${BASE_URL}/${sessionId}/join`);
    return normalizeData(response.data);
  },

  /**
   * Leave a call
   */
  leaveCall: async (sessionId: number): Promise<void> => {
    await api.post(`${BASE_URL}/${sessionId}/leave`);
  },

  /**
   * Get all participants in a call
   */
  getParticipants: async (sessionId: number): Promise<CallParticipant[]> => {
    const response = await api.get(`${BASE_URL}/${sessionId}/participants`);
    return normalizeArray(normalizeData(response.data));
  },

  // ===== Call Controls =====

  /**
   * Toggle mute for current user
   */
  toggleMute: async (sessionId: number): Promise<boolean> => {
    const response = await api.post(`${BASE_URL}/${sessionId}/mute`);
    return normalizeData(response.data)?.isMuted ?? true;
  },

  /**
   * Toggle video for current user
   */
  toggleVideo: async (sessionId: number): Promise<boolean> => {
    const response = await api.post(`${BASE_URL}/${sessionId}/video`);
    return normalizeData(response.data)?.isVideoOff ?? true;
  },

  /**
   * Toggle screen share for current user
   */
  toggleScreenShare: async (sessionId: number): Promise<boolean> => {
    const response = await api.post(`${BASE_URL}/${sessionId}/screen-share`);
    return normalizeData(response.data)?.isScreenSharing ?? true;
  },

  /**
   * Update connection status
   */
  updateConnectionStatus: async (sessionId: number, status: 'connected' | 'disconnected' | 'reconnecting'): Promise<void> => {
    await api.post(`${BASE_URL}/${sessionId}/connection-status`, { status });
  },

  /**
   * Check if user is in a call for a space
   */
  isInCall: async (spaceId: number): Promise<boolean> => {
    const response = await api.get(`${BASE_URL}/in-call/${spaceId}`);
    return normalizeData(response.data)?.isInCall ?? false;
  },
};

// ===== WebRTC Helper Functions =====

export const webrtcHelpers = {
  /**
   * Get local media stream
   */
  getLocalStream: async (video: boolean = true, audio: boolean = true): Promise<MediaStream | null> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: video,
        audio: audio,
      });
      return stream;
    } catch (error) {
      console.error('Error getting local stream:', error);
      return null;
    }
  },

  /**
   * Toggle video track
   */
  toggleVideoTrack: (stream: MediaStream, enabled: boolean) => {
    const videoTrack = stream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = enabled;
    }
  },

  /**
   * Toggle audio track
   */
  toggleAudioTrack: (stream: MediaStream, enabled: boolean) => {
    const audioTrack = stream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = enabled;
    }
  },

  /**
   * Stop all tracks in a stream
   */
  stopStream: (stream: MediaStream | null) => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  },

  /**
   * Check if browser supports WebRTC
   */
  isWebRTCSupported: (): boolean => {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.RTCPeerConnection);
  },

  /**
   * Get available audio/video devices
   */
  getDevices: async (): Promise<{ audioInputs: MediaDeviceInfo[]; videoInputs: MediaDeviceInfo[] }> => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return {
        audioInputs: devices.filter(d => d.kind === 'audioinput'),
        videoInputs: devices.filter(d => d.kind === 'videoinput'),
      };
    } catch (error) {
      console.error('Error getting devices:', error);
      return { audioInputs: [], videoInputs: [] };
    }
  },
};

export default callService;
