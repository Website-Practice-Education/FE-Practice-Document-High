import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { CreateSpaceRequest, StudySpace, UpdateSpaceRequest, ChatMessage, Friend, FriendRequest } from '../services/studySpaceService';
import { studySpaceService, chatService, friendService } from '../services/studySpaceService';
import type { MusicTrack, SharedFile } from '../services/roomService';
import { musicService, fileService, extractYouTubeId, getYouTubeThumbnail, roomSettingsService } from '../services/roomService';
import { callService, type CallSession, type CallParticipant } from '../services/callService';
import Loading from '../components/Loading';
import TabBar from '../components/TabBar';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import { signalRService } from '../services/signalR';

// ============= TYPE DEFINITIONS =============
type TabType = 'rooms' | 'create' | 'friends';
type RoomTabType = 'my-rooms' | 'joined' | 'public' | 'live';
type FeatureTabType = 'chat' | 'music' | 'files' | 'notes' | 'video';
type ThemeType = 'aurora' | 'sunset' | 'ocean' | 'forest' | 'lavender' | 'midnight' | 'custom';

const THEMES = {
  aurora: { bg: 'from-emerald-500 via-cyan-400 to-indigo-600', accent: '#10b981', name: 'Aurora Borealis' },
  sunset: { bg: 'from-rose-500 via-orange-400 to-amber-500', accent: '#f97316', name: 'Sunset Vibes' },
  ocean: { bg: 'from-blue-600 via-cyan-500 to-teal-400', accent: '#0ea5e9', name: 'Ocean Wave' },
  forest: { bg: 'from-emerald-700 via-green-500 to-lime-400', accent: '#22c55e', name: 'Forest Chill' },
  lavender: { bg: 'from-violet-600 via-purple-500 to-pink-400', accent: '#a855f7', name: 'Lavender Dream' },
  midnight: { bg: 'from-slate-900 via-purple-900 to-indigo-900', accent: '#6366f1', name: 'Midnight Mode' },
};

const DEMO_PLAYLISTS = [
  { id: 1, name: 'Lo-Fi Hip Hop', cover: '🎵', tracks: ['Rainy Day Beats', 'Late Night Study', 'Coffee Shop Vibes'] },
  { id: 2, name: 'Classical Focus', cover: '🎻', tracks: ['Moonlight Sonata', 'Clair de Lune', 'Four Seasons'] },
  { id: 3, name: 'Nature Sounds', cover: '🌿', tracks: ['Rain Forest', 'Ocean Waves', 'Bird Chirping'] },
  { id: 4, name: 'Jazz & Blues', cover: '🎷', tracks: ['Blue in Green', 'Take Five', 'So What'] },
];

// ============= MAIN COMPONENT =============
export default function StudyHub() {
  const navigate = useNavigate();
  
  // ===== STATE: Tabs & Navigation =====
  const [activeTab, setActiveTab] = useState<TabType>('rooms');
  const [roomTab, setRoomTab] = useState<RoomTabType>('my-rooms');
  const [activeFeature, setActiveFeature] = useState<FeatureTabType>('chat');
  const [selectedRoom, setSelectedRoom] = useState<StudySpace | null>(null);
  const [showRoomDetail, setShowRoomDetail] = useState(false);
  const [showAllMembers, setShowAllMembers] = useState(false);
  
  // ===== STATE: Rooms Data =====
  const [mySpaces, setMySpaces] = useState<StudySpace[]>([]);
  const [myCreatedSpaces, setMyCreatedSpaces] = useState<StudySpace[]>([]);
  const [publicSpaces, setPublicSpaces] = useState<StudySpace[]>([]);
  const [liveRooms, setLiveRooms] = useState<StudySpace[]>([]);
  const [loading, setLoading] = useState(true);
  
  // ===== STATE: Room CRUD =====
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingSpaceId, setDeletingSpaceId] = useState<number | null>(null);
  const [editingSpace, setEditingSpace] = useState<StudySpace | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [newSpace, setNewSpace] = useState<CreateSpaceRequest>({
    name: '',
    description: '',
    spaceType: 'public',
  });
  
  // ===== STATE: Friends =====
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  
  // ===== STATE: Room Detail - Chat =====
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  
  // ===== STATE: Room Detail - Music =====
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(70);
  const [currentMusicUrl, setCurrentMusicUrl] = useState<string | null>(null);
  const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(null);
  const [uploadedTracks, setUploadedTracks] = useState<MusicTrack[]>([]);
  const [showAddMusicModal, setShowAddMusicModal] = useState(false);
  const [editingTrack, setEditingTrack] = useState<MusicTrack | null>(null);
  const [musicTab, setMusicTab] = useState<'playlist' | 'library'>('library');
  const [currentPlaylist, setCurrentPlaylist] = useState(DEMO_PLAYLISTS[0]);
  const [showYouTubePlayer, setShowYouTubePlayer] = useState(false);
  
  // ===== STATE: Room Detail - Files =====
  const [uploadedFiles, setUploadedFiles] = useState<SharedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewFile, setPreviewFile] = useState<SharedFile | null>(null);
  
  // ===== STATE: Background Upload =====
  const bgImageInputRef = useRef<HTMLInputElement>(null);
  
  // ===== STATE: Room Detail - Notes =====
  const [notes, setNotes] = useState<{ id: number; content: string; createdAt: string }[]>([]);
  const [newNote, setNewNote] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editingNoteContent, setEditingNoteContent] = useState('');
  
  // ===== STATE: Room Detail - Video/Audio =====
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isInCall, setIsInCall] = useState(false);
  const [currentCallSession, setCurrentCallSession] = useState<CallSession | null>(null);
  const [callParticipants, setCallParticipants] = useState<CallParticipant[]>([]);
  const localStreamRef = useRef<MediaStream | null>(null);
  
  // ===== STATE: Timer =====
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60);
  const [isPomodoroRunning, setIsPomodoroRunning] = useState(false);
  const [pomodoroMode, setPomodoroMode] = useState<'work' | 'break'>('work');
  
  // ===== STATE: Theme =====
  const [currentTheme, setCurrentTheme] = useState<ThemeType>('aurora');
  const [customBgImage, setCustomBgImage] = useState<string | null>(null);
  const [showThemePicker, setShowThemePicker] = useState(false);
  
  // ===== STATE: Time =====
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // ===== REFS =====
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isPlayInProgressRef = useRef(false); // Prevent race condition between play/pause
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const token = localStorage.getItem('token');
  const apiUrl = import.meta.env.VITE_API_URL || '';
  
  // ===== HELPERS =====
  const currentUserId = useCallback(() => {
    if (!token) return '0';
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const candidates = [
        payload.nameidentifier,
        payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'],
        payload.sub,
        payload.userId,
        payload.id,
      ];
      for (const c of candidates) {
        const parsed = parseInt(c as string);
        if (!isNaN(parsed)) return parsed.toString();
      }
      return '0';
    } catch { return '0'; }
  }, [token]);
  
  // ===== EFFECTS =====
  useEffect(() => {
    loadData();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Pomodoro timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPomodoroRunning && pomodoroTime > 0) {
      interval = setInterval(() => setPomodoroTime(prev => prev - 1), 1000);
    } else if (pomodoroTime === 0) {
      setIsPomodoroRunning(false);
      if (pomodoroMode === 'work') {
        setPomodoroMode('break');
        setPomodoroTime(5 * 60);
      } else {
        setPomodoroMode('work');
        setPomodoroTime(25 * 60);
      }
    }
    return () => clearInterval(interval);
  }, [isPomodoroRunning, pomodoroTime, pomodoroMode]);
  
  // ===== DATA LOADING =====
  const loadData = async () => {
    try {
      const [my, myCreated, publicData, friendsData, requestsData] = await Promise.all([
        studySpaceService.getMySpaces(),
        studySpaceService.getMyCreatedSpaces(),
        studySpaceService.getPublicSpaces(),
        friendService.getFriends(),
        friendService.getPendingRequests(),
      ]);
      setMySpaces(my);
      setMyCreatedSpaces(myCreated);
      setPublicSpaces(publicData);
      setFriends(friendsData);
      setRequests(requestsData);
      // Mock live rooms from created spaces
      setLiveRooms(myCreated.filter(s => s.spaceType === 'live' || Math.random() > 0.5).slice(0, 3));
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // ===== ROOM DETAIL LOADING =====
  const loadRoomDetail = async (space: StudySpace) => {
    setSelectedRoom(space);
    setShowRoomDetail(true);
    try {
      // Fetch full room details including members and inviteCode
      const spaceDetail = await studySpaceService.getSpace(space.id);
      
      const [messagesData, tracksData, filesData, settingsData] = await Promise.all([
        chatService.getMessages(space.id),
        musicService.getTracks(space.id).catch(() => []),
        fileService.getFiles(space.id).catch(() => []),
        roomSettingsService.get(space.id).catch(() => null),
      ]);
      
      // Update with full details
      setSelectedRoom({
        ...spaceDetail,
        members: spaceDetail.members || [],
      });
      
      setMessages(messagesData);
      setUploadedTracks(tracksData);
      setUploadedFiles(filesData);
      
      // Load room settings (theme/background)
      if (settingsData) {
        if (settingsData.backgroundType === 'custom' && settingsData.backgroundImagePath) {
          // Backend returns path like /uploads/backgrounds/... (no /api prefix)
          const imagePath = settingsData.backgroundImagePath;
          const fullUrl = imagePath.startsWith('http') 
            ? imagePath 
            : `${apiUrl.replace('/api', '')}${imagePath}`;
          setCustomBgImage(fullUrl);
          setCurrentTheme('custom');
        } else if (settingsData.backgroundValue && THEMES[settingsData.backgroundValue as ThemeType]) {
          setCurrentTheme(settingsData.backgroundValue as ThemeType);
        }
      }
      
      // Connect to SignalR
      await connectToHub(space.id.toString());
    } catch (error) {
      console.error('Failed to load room detail:', error);
    }
  };
  
  const connectToHub = async (spaceId: string) => {
    if (!token) return;
    setConnectionStatus('connecting');
    try {
      await signalRService.start(token);
      await signalRService.joinSpace(spaceId);
      signalRService.onMessage((msg) => setMessages(prev => [...prev, msg]));
      setConnectionStatus('connected');
    } catch (error) {
      console.error('Failed to connect to chat:', error);
      setConnectionStatus('disconnected');
    }
  };
  
  const closeRoomDetail = () => {
    signalRService.stop();
    setShowRoomDetail(false);
    setSelectedRoom(null);
    setIsInCall(false);
    setShowAllMembers(false);
    if (audioRef.current) audioRef.current.pause();
  };
  
  const handleThemeSelect = async (themeKey: ThemeType) => {
    setCurrentTheme(themeKey);
    setShowThemePicker(false);
    if (themeKey === 'custom') return;
    try {
      await roomSettingsService.updateBackground(selectedRoom!.id, 'theme', themeKey, undefined);
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  };
  
  const handleUploadBackground = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedRoom) return;

    try {
      const result = await roomSettingsService.uploadBackgroundImage(selectedRoom.id, file);
      // Backend returns path like /uploads/backgrounds/... (no /api prefix)
      const imagePath = result.backgroundImagePath || result.imageUrl;
      const fullUrl = imagePath.startsWith('http') 
        ? imagePath 
        : `${apiUrl.replace('/api', '')}${imagePath}`;
      setCustomBgImage(fullUrl);
      setCurrentTheme('custom');
    } catch (error) {
      console.error('Failed to upload background:', error);
    }
  };
  
  // ===== ROOM CRUD =====
  const handleCreateSpace = async () => {
    if (!newSpace.name.trim()) return;
    try {
      const space = await studySpaceService.createSpace(newSpace);
      setShowCreateModal(false);
      loadData();
      loadRoomDetail(space);
    } catch (error) {
      console.error('Failed to create space:', error);
    }
  };
  
  const handleEditSpace = (space: StudySpace, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSpace(space);
    setShowEditModal(true);
  };
  
  const handleUpdateSpace = async () => {
    if (!editingSpace || !editingSpace.name.trim()) return;
    setIsUpdating(true);
    try {
      const updateData: UpdateSpaceRequest = { name: editingSpace.name, description: editingSpace.description, spaceType: editingSpace.spaceType };
      await studySpaceService.updateSpace(editingSpace.id, updateData);
      setShowEditModal(false);
      setEditingSpace(null);
      loadData();
    } catch (error: any) {
      console.error('Failed to update space:', error);
      alert(error.response?.data?.message || 'Khong the cap nhat phong hoc');
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleDeleteSpace = (spaceId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingSpaceId(spaceId);
    setShowDeleteModal(true);
  };
  
  const confirmDeleteSpace = async () => {
    if (!deletingSpaceId) return;
    setIsDeleting(true);
    try {
      await studySpaceService.deleteSpace(deletingSpaceId);
      setShowDeleteModal(false);
      setDeletingSpaceId(null);
      // Update local state immediately by removing the deleted space
      setMyCreatedSpaces(prev => prev.filter(s => s.id !== deletingSpaceId));
      setMySpaces(prev => prev.filter(s => s.id !== deletingSpaceId));
      setPublicSpaces(prev => prev.filter(s => s.id !== deletingSpaceId));
    } catch (error: any) {
      console.error('Failed to delete space:', error);
      alert(error.response?.data?.message || 'Khong the xoa phong hoc');
    } finally {
      setIsDeleting(false);
    }
  };
  
  const handleJoinByCode = async () => {
    if (!inviteCode.trim()) return;
    try {
      const result = await studySpaceService.joinByCode(inviteCode);
      const space = await studySpaceService.getSpace(result.spaceId);
      setShowJoinModal(false);
      loadRoomDetail(space);
    } catch (error) {
      console.error('Failed to join space:', error);
      alert('Ma moi khong hop le');
    }
  };
  
  const handleJoinSpace = async (spaceId: number) => {
    try {
      await studySpaceService.joinSpace(spaceId);
      const space = await studySpaceService.getSpace(spaceId);
      loadRoomDetail(space);
    } catch (error) {
      console.error('Failed to join space:', error);
    }
  };
  
  const handleLeaveSpace = async (spaceId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Ban co chac muon roi phong hoc nay?')) return;
    try {
      await studySpaceService.leaveSpace(spaceId);
      loadData();
    } catch (error) {
      console.error('Failed to leave space:', error);
    }
  };
  
  // ===== CHAT =====
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedRoom) return;
    try {
      await signalRService.sendMessage(selectedRoom.id, newMessage);
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };
  
  // ===== MUSIC =====
  const handleAddMusicFromLink = async (title: string, url: string, artist?: string) => {
    if (!selectedRoom) return;
    try {
      const track = await musicService.addFromLink(selectedRoom.id, { title, url, artist, durationSeconds: 0 });
      setUploadedTracks(prev => [track, ...prev]);
      setShowAddMusicModal(false);
    } catch (error) {
      console.error('Failed to add music:', error);
    }
  };

  const handleAddMusicFromYouTube = async (url: string) => {
    if (!selectedRoom) return;
    try {
      const track = await musicService.addFromYouTube(selectedRoom.id, url);
      setUploadedTracks(prev => [track, ...prev]);
      setShowAddMusicModal(false);
    } catch (error) {
      console.error('Failed to add YouTube music:', error);
      alert('Không thể thêm nhạc từ YouTube. Vui lòng kiểm tra lại link.');
    }
  };

  const handleUploadMusic = async (file: File, title: string, artist?: string) => {
    if (!selectedRoom) return;
    try {
      const track = await musicService.upload(selectedRoom.id, file, title, artist);
      setUploadedTracks(prev => [track, ...prev]);
      setShowAddMusicModal(false);
    } catch (error) {
      console.error('Failed to upload music:', error);
      alert('Không thể upload nhạc. Vui lòng thử lại.');
    }
  };

  const handleUpdateTrack = async (trackId: number, title: string, artist?: string) => {
    try {
      const updated = await musicService.updateTrack(trackId, { title, artist });
      setUploadedTracks(prev => prev.map(t => t.id === trackId ? { ...t, ...updated } : t));
      setEditingTrack(null);
    } catch (error) {
      console.error('Failed to update track:', error);
      alert('Không thể cập nhật bài hát.');
    }
  };

  const handleDeleteTrack = async (trackId: number) => {
    if (!confirm('Bạn có chắc muốn xóa bài hát này?')) return;
    try {
      await musicService.delete(trackId);
      setUploadedTracks(prev => prev.filter(t => t.id !== trackId));
      if (currentTrack?.id === trackId) {
        setCurrentTrack(null);
        setCurrentMusicUrl(null);
        setIsPlaying(false);
        if (audioRef.current) audioRef.current.pause();
      }
    } catch (error) {
      console.error('Failed to delete track:', error);
    }
  };
  
  const playTrack = (track: MusicTrack) => {
    console.log('[Music] Attempting to play track:', track);
    
    if (audioRef.current) audioRef.current.pause();
    
    setCurrentTrack(track);
    setIsPlaying(false); // Reset initially, set to true only when play succeeds
    
    const handlePlayError = (error: Error, url: string) => {
      console.error('[Music] Play error:', error, 'URL:', url);
      isPlayInProgressRef.current = false;
      // Ignore AbortError - this happens when user clicks play/pause quickly
      if (error.name === 'AbortError') {
        console.log('[Music] Play interrupted by user action (normal behavior)');
        return;
      }
      console.error('[Music] Failed to play audio:', error);
      setIsPlaying(false);
      alert(`Không thể phát nhạc!\n\nLỗi: ${error.message}\n\nURL: ${url}\n\nCó thể do:\n- File không tồn tại\n- Lỗi CORS\n- Link nhạc hỏng`);
    };
    
    if (track.sourceType === 'youtube' && track.externalUrl) {
      // YouTube - show embedded player
      const videoId = extractYouTubeId(track.externalUrl);
      if (videoId) {
        console.log('[Music] YouTube detected, showing player for:', videoId);
        setCurrentMusicUrl(`https://www.youtube.com/embed/${videoId}?autoplay=1&controls=1&rel=0`);
        setShowYouTubePlayer(true);
        setIsPlaying(true);
      } else {
        alert('Link YouTube không hợp lệ!');
      }
    } else if (track.sourceType === 'link' && track.externalUrl) {
      // External link - play audio
      // Prevent race condition: if play is already in progress, ignore this call
      if (isPlayInProgressRef.current) {
        console.log('[Music] Play already in progress, ignoring');
        return;
      }
      isPlayInProgressRef.current = true;
      console.log('[Music] Playing external link:', track.externalUrl);
      const audio = new Audio();
      audio.src = track.externalUrl;
      audio.volume = volume / 100;
      audioRef.current = audio;
      
      audio.play().then(() => {
        isPlayInProgressRef.current = false;
        setIsPlaying(true);
        setCurrentMusicUrl(track.externalUrl);
        console.log('[Music] Successfully playing external link');
      }).catch((error) => {
        handlePlayError(error, track.externalUrl);
      });
    } else if (track.filePath) {
      // Uploaded file - use base URL without /api for static files
      // Prevent race condition: if play is already in progress, ignore this call
      if (isPlayInProgressRef.current) {
        console.log('[Music] Play already in progress, ignoring');
        return;
      }
      isPlayInProgressRef.current = true;
      const baseUrl = apiUrl.replace(/\/api$/, ''); // Remove /api suffix
      const fullUrl = `${baseUrl}${track.filePath}`;
      console.log('[Music] Playing uploaded file:', fullUrl);
      const audio = new Audio();
      audio.src = fullUrl;
      audio.volume = volume / 100;
      audioRef.current = audio;
      
      audio.play().then(() => {
        isPlayInProgressRef.current = false;
        setIsPlaying(true);
        setCurrentMusicUrl(fullUrl);
        console.log('[Music] Successfully playing uploaded file');
      }).catch((error) => {
        handlePlayError(error, fullUrl);
      });
    } else {
      console.error('[Music] No valid source found for track:', track);
      alert('Không tìm thấy nguồn nhạc cho bài hát này.');
    }
  };
  
  const togglePlay = () => {
    if (!audioRef.current && uploadedTracks.length > 0) { 
      playTrack(uploadedTracks[0]); 
      return; 
    }
    if (audioRef.current) {
      // If current track is YouTube, close the player when pausing
      if (currentTrack?.sourceType === 'youtube') {
        setShowYouTubePlayer(false);
        setCurrentMusicUrl(null);
        setCurrentTrack(null);
        setIsPlaying(false);
        return;
      }
      
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        // Prevent race condition: if play is already in progress, ignore this call
        if (isPlayInProgressRef.current) {
          return;
        }
        isPlayInProgressRef.current = true;
        // Try to play, handle errors
        audioRef.current.play().then(() => {
          isPlayInProgressRef.current = false;
          setIsPlaying(true);
        }).catch((error) => {
          isPlayInProgressRef.current = false;
          // Ignore AbortError - happens when user clicks play/pause quickly
          if (error.name !== 'AbortError') {
            console.error('Failed to resume audio:', error);
            setIsPlaying(false);
            alert('Không thể phát nhạc. Vui lòng thử lại.');
          }
        });
      }
    }
  };
  
  // ===== FILES =====
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedRoom) return;
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      try {
        const uploadedFile = await fileService.upload(selectedRoom.id, file);
        setUploadedFiles(prev => [uploadedFile, ...prev]);
      } catch (error) {
        console.error('Failed to upload file:', error);
      }
    }
  };
  
  const handleDeleteFile = async (fileId: number) => {
    try {
      await fileService.delete(fileId);
      setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
    } catch (error) {
      console.error('Failed to delete file:', error);
    }
  };

  const handleDownloadFile = async (file: SharedFile) => {
    try {
      const blob = await fileService.download(file.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.originalName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download file:', error);
      // Fallback: open in new tab
      const url = fileService.getDownloadUrl(file.id);
      window.open(url, '_blank');
    }
  };

  const handlePreviewFile = (file: SharedFile) => {
    setPreviewFile(file);
  };

  const closePreview = () => {
    setPreviewFile(null);
  };

  const getPreviewUrl = (file: SharedFile) => {
    const apiUrl = import.meta.env.VITE_API_URL || '';
    return `${apiUrl}/room/files/${file.id}/download`;
  };
  
  // ===== NOTES =====
  const handleAddNote = () => {
    if (!newNote.trim()) return;
    setNotes(prev => [{ id: Date.now(), content: newNote, createdAt: new Date().toISOString() }, ...prev]);
    setNewNote('');
  };
  
  const handleEditNote = (note: { id: number; content: string }) => {
    setEditingNoteId(note.id);
    setEditingNoteContent(note.content);
  };
  
  const handleSaveNote = (id: number) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, content: editingNoteContent } : n));
    setEditingNoteId(null);
    setEditingNoteContent('');
  };
  
  const handleDeleteNote = (id: number) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  };
  
  // ===== VIDEO/AUDIO CALL =====
  const startCall = async () => {
    if (!selectedRoom) return;
    
    try {
      // Check if there's already an active call
      const activeCall = await callService.getActiveCall(selectedRoom.id);
      
      if (activeCall) {
        // Join existing call
        const participant = await callService.joinCall(activeCall.id);
        setCurrentCallSession(activeCall);
        setCallParticipants(activeCall.participants || []);
        setIsInCall(true);
        
        // Get local stream - always request both video and audio
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        // Set initial state based on call type
        setIsVideoOn(true);
      } else {
        // Start new call
        const newSession = await callService.startCall(selectedRoom.id, isVideoOn ? 'video' : 'audio');
        setCurrentCallSession(newSession);
        setCallParticipants(newSession.participants || []);
        setIsInCall(true);
        
        // Get local stream - always request both video and audio
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        // Set initial state
        setIsVideoOn(true);
      }
    } catch (error) {
      console.error('Failed to start call:', error);
      
      // Check for specific error types
      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError') {
          alert('Quyền truy cập camera/microphone bị từ chối. Vui lòng cho phép truy cập trong cài đặt trình duyệt và Windows.');
        } else if (error.name === 'NotFoundError') {
          alert('Không tìm thấy camera/microphone. Vui lòng kết nối thiết bị.');
        } else if (error.name === 'NotReadableError') {
          alert('Camera hoặc microphone đang được sử dụng bởi ứng dụng khác.');
        } else {
          alert('Không thể bắt đầu cuộc gọi. Vui lòng thử lại.');
        }
      } else {
        alert('Không thể bắt đầu cuộc gọi. Vui lòng thử lại.');
      }
      setIsInCall(false);
    }
  };

  const endCall = async () => {
    if (currentCallSession) {
      try {
        await callService.leaveCall(currentCallSession.id);
      } catch (error) {
        console.error('Failed to leave call:', error);
      }
    }
    
    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    
    setIsInCall(false);
    setCurrentCallSession(null);
    setCallParticipants([]);
    setIsVideoOn(false);
    setIsScreenSharing(false);
    if (localVideoRef.current?.srcObject) {
      (localVideoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      localVideoRef.current.srcObject = null;
    }
  };

  const toggleCallMute = async () => {
    if (!currentCallSession) return;
    try {
      const newMutedState = await callService.toggleMute(currentCallSession.id);
      setIsAudioOn(!newMutedState);
      // Toggle local audio
      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach(track => {
          track.enabled = newMutedState;
        });
      }
    } catch (error) {
      console.error('Failed to toggle mute:', error);
    }
  };

  const toggleCallVideo = async () => {
    if (!currentCallSession) return;
    try {
      const newVideoOffState = await callService.toggleVideo(currentCallSession.id);
      const shouldBeOn = !newVideoOffState; // isVideoOn = !isVideoOff
      
      setIsVideoOn(shouldBeOn);
      
      // Toggle local video track
      if (localStreamRef.current) {
        localStreamRef.current.getVideoTracks().forEach(track => {
          track.enabled = shouldBeOn;
        });
      }
    } catch (error) {
      console.error('Failed to toggle video:', error);
    }
  };

  const toggleCallScreenShare = async () => {
    if (!currentCallSession) return;
    try {
      const newSharingState = await callService.toggleScreenShare(currentCallSession.id);
      setIsScreenSharing(newSharingState);
    } catch (error) {
      console.error('Failed to toggle screen share:', error);
    }
  };
  
  // ===== HELPERS =====
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const formatFileSize = (bytes: number) => {
    if (bytes > 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };
  
  const getFileIcon = (fileType: string) => {
    const icons: Record<string, string> = {
      image: '🖼️', video: '🎬', audio: '🎵', pdf: '📄', document: '📝',
      spreadsheet: '📊', presentation: '📽️', archive: '📦', other: '📁',
    };
    return icons[fileType] || '📁';
  };
  
  // ===== RENDER HELPERS =====
  const renderRoomCard = (space: StudySpace, index: number, isOwner: boolean = false) => (
    <div
      key={space.id}
      onClick={() => loadRoomDetail(space)}
      className="group relative overflow-hidden rounded-2xl p-6 cursor-pointer animate-fade-in-up"
      style={{
        animationDelay: `${index * 100}ms`,
        background: 'linear-gradient(145deg, #1a1a2e, #16213e)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-8px)';
        e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
        e.currentTarget.style.boxShadow = '0 24px 48px rgba(99, 102, 241, 0.2)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
        e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)';
      }}
    >
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-bold text-white font-[family-name:var(--font-display)] text-lg">{space.name}</h3>
            {isOwner && (
              <span className="badge" style={{ background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(245, 158, 11, 0.15))', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
                Chu phong
              </span>
            )}
          </div>
          <p className="text-sm text-slate-400 line-clamp-2">{space.description || 'Chua co mo ta'}</p>
        </div>
        <span className="badge" style={{
          background: space.spaceType === 'public' ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(22, 163, 74, 0.15))' : 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(79, 70, 229, 0.15))',
          color: space.spaceType === 'public' ? '#22c55e' : '#6366f1',
          border: space.spaceType === 'public' ? '1px solid rgba(34, 197, 94, 0.25)' : '1px solid rgba(99, 102, 241, 0.25)',
        }}>
          {space.spaceType === 'public' ? 'Cong khai' : 'Rieng tu'}
        </span>
      </div>
      <div className="flex items-center justify-between pt-4" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
        <span className="text-sm text-slate-500">{space.memberCount} thanh vien</span>
        {isOwner ? (
          <div className="flex gap-2">
            <button onClick={(e) => handleEditSpace(space, e)} className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
              Sua
            </button>
            <button onClick={(e) => handleDeleteSpace(space.id, e)} className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              Xoa
            </button>
          </div>
        ) : (
          <button onClick={(e) => handleLeaveSpace(space.id, e)} className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            Roi phong
          </button>
        )}
      </div>
    </div>
  );
  
  // ============= RENDER =============
  if (loading) return <Loading message="Dang tai phong hoc..." />;
  
  // ===== ROOM DETAIL VIEW =====
  if (showRoomDetail && selectedRoom) {
    const theme = currentTheme !== 'custom' ? THEMES[currentTheme] : null;
    
    return (
      <div className="min-h-screen animate-fade-in-up relative overflow-hidden" style={{ background: customBgImage ? `url(${customBgImage}) center/cover no-repeat` : theme ? undefined : '#0f172a' }}>
        <audio ref={audioRef} onEnded={() => setIsPlaying(false)} />
        
        {/* Dynamic Background */}
        {!customBgImage && theme && (
          <div className={`absolute inset-0 bg-gradient-to-br ${theme.bg}`}>
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(20)].map((_, i) => (
                <div key={i} className="absolute w-2 h-2 rounded-full bg-white/20 animate-float" style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 5}s`, animationDuration: `${3 + Math.random() * 4}s` }} />
              ))}
            </div>
            <div className="absolute inset-0 backdrop-blur-sm bg-white/5" />
          </div>
        )}
        
        {/* Header */}
        <div className="relative z-10 max-w-7xl mx-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button onClick={closeRoomDetail} className="w-10 h-10 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all text-white font-bold">
                ←
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white font-[family-name:var(--font-display)]">{selectedRoom.name}</h1>
                <p className="text-white/60 text-sm">{selectedRoom.description || `${selectedRoom.memberCount} thanh vien`}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Call Button */}
              <button onClick={isInCall ? endCall : startCall} className={`px-4 py-2 rounded-xl font-semibold transition-all flex items-center gap-2 ${isInCall ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
                {isInCall ? '📴 Ket thuc' : '📞 Goi ngay'}
              </button>
              {/* Theme Button */}
              <button onClick={() => setShowThemePicker(!showThemePicker)} className="w-10 h-10 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all text-2xl">
                🎨
              </button>
              {/* Clock */}
              <div className="text-center px-4 py-2 rounded-xl bg-white/10">
                <p className="text-xs text-white/60">Bay gio</p>
                <p className="text-xl font-bold text-white font-[family-name:var(--font-display)]">{currentTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
              </div>
            </div>
          </div>
          
          {/* Feature Tabs */}
          <div className="glass-card rounded-2xl p-2 flex items-center gap-2 mb-6 inline-flex">
            {[
              { id: 'chat' as FeatureTabType, icon: '💬', label: 'Chat' },
              { id: 'music' as FeatureTabType, icon: '🎵', label: 'Nhac' },
              { id: 'files' as FeatureTabType, icon: '📁', label: 'File' },
              { id: 'notes' as FeatureTabType, icon: '📝', label: 'Ghi chu' },
              { id: 'video' as FeatureTabType, icon: '🎥', label: 'Video call' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveFeature(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${activeFeature === tab.id ? 'bg-white/30 text-white' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
              >
                <span>{tab.icon}</span>
                <span className="text-sm font-semibold hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
          
          {/* Feature Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content Area */}
            <div className="lg:col-span-2">
              {/* CHAT */}
              {activeFeature === 'chat' && (
                <div className="glass-card rounded-3xl overflow-hidden">
                  <div className="p-4 border-b border-white/10 bg-white/5">
                    <h3 className="text-white font-bold flex items-center gap-2">
                      💬 Chat
                      <span className={`px-2 py-0.5 rounded-full text-xs ${connectionStatus === 'connected' ? 'bg-green-500/30 text-green-400' : 'bg-red-500/30 text-red-400'}`}>
                        {connectionStatus === 'connected' ? 'Live' : 'Offline'}
                      </span>
                    </h3>
                  </div>
                  <div className="h-96 overflow-y-auto p-4 space-y-3">
                    {messages.length === 0 ? (
                      <div className="text-center py-16">
                        <div className="text-5xl mb-4">💭</div>
                        <p className="text-white/60">Chua co tin nhan nao</p>
                      </div>
                    ) : messages.map((msg) => {
                      const isMine = msg.userId === parseInt(currentUserId());
                      return (
                        <div key={msg.id} className={`flex gap-3 ${isMine ? 'flex-row-reverse' : ''}`}>
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${isMine ? 'bg-gradient-to-br from-pink-500 to-rose-500 text-white' : 'bg-white/20 text-white'}`}>
                            {msg.userName?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <div className={`max-w-[70%] ${isMine ? 'text-right' : ''}`}>
                            <div className="text-xs text-white/50 mb-1">{msg.userName} • {new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</div>
                            <div className={`inline-block px-4 py-2 rounded-2xl text-sm ${isMine ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-br-sm' : 'bg-white/10 text-white rounded-bl-sm'}`}>
                              {msg.content}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                  <form onSubmit={handleSendMessage} className="flex gap-3 p-4 border-t border-white/10 bg-white/5">
                    <input 
                      type="text" 
                      value={newMessage} 
                      onChange={(e) => setNewMessage(e.target.value)} 
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          if (newMessage.trim()) {
                            handleSendMessage(e as unknown as React.FormEvent);
                          }
                        }
                      }}
                      placeholder="Nhắn gì đó..." 
                      className="flex-1 bg-white/10 border border-white/20 rounded-full px-5 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                    />
                    <button 
                      type="submit" 
                      disabled={!newMessage.trim()} 
                      className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white flex items-center justify-center hover:scale-110 transition-all disabled:opacity-40"
                    >
                      ➤
                    </button>
                  </form>
                </div>
              )}
              
              {/* MUSIC */}
              {activeFeature === 'music' && (
                <div className="glass-card rounded-3xl p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <button onClick={() => setMusicTab('library')} className={`px-4 py-2 rounded-full text-sm font-semibold ${musicTab === 'library' ? 'bg-white/30 text-white' : 'bg-white/10 text-white/60'}`}>
                      📚 Thu vien ({uploadedTracks.length})
                    </button>
                    <button onClick={() => setMusicTab('playlist')} className={`px-4 py-2 rounded-full text-sm font-semibold ${musicTab === 'playlist' ? 'bg-white/30 text-white' : 'bg-white/10 text-white/60'}`}>
                      🎶 Playlists
                    </button>
                    <button onClick={() => setShowAddMusicModal(true)} className="ml-auto px-4 py-2 rounded-full bg-pink-500 text-white text-sm font-semibold hover:bg-pink-600">
                      ➕ Them nhac
                    </button>
                  </div>
                  
                  {musicTab === 'library' ? (
                    uploadedTracks.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="text-5xl mb-4">🎵</div>
                        <p className="text-white/60">Chua co nhac nao</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {uploadedTracks.map((track) => (
                          <div key={track.id} className={`flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 ${currentTrack?.id === track.id ? 'bg-white/15' : ''}`}>
                            {/* Thumbnail / Icon */}
                            {track.sourceType === 'youtube' && track.externalUrl ? (
                              <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-slate-700">
                                <img 
                                  src={getYouTubeThumbnail(extractYouTubeId(track.externalUrl) || '')} 
                                  alt="YouTube thumbnail"
                                  className="w-full h-full object-cover"
                                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                />
                              </div>
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500/30 to-purple-500/30 flex items-center justify-center flex-shrink-0">
                                <span className="text-lg">{track.sourceType === 'upload' ? '🎵' : '🔗'}</span>
                              </div>
                            )}
                            
                            {/* Play Button - Works for all track types */}
                            <button 
                              onClick={() => {
                                console.log('[Music] Play button clicked for track:', track);
                                // If clicking on current track, toggle play/pause
                                if (currentTrack?.id === track.id) {
                                  togglePlay();
                                } else {
                                  // Different track - play it
                                  playTrack(track);
                                }
                              }} 
                              className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white flex items-center justify-center hover:scale-110 transition-all flex-shrink-0 shadow-lg"
                              title={track.sourceType === 'youtube' ? 'Phát YouTube' : 'Phát nhạc'}
                            >
                              {currentTrack?.id === track.id && isPlaying ? '⏸' : '▶'}
                            </button>
                            
                            {/* Track Info */}
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-medium truncate">{track.title}</p>
                              <p className="text-white/50 text-sm truncate">
                                {track.artist || (
                                  track.sourceType === 'youtube' ? '📺 YouTube' : 
                                  track.sourceType === 'link' ? '🔗 Link nhạc' : 
                                  '📤 Đã upload'
                                )}
                              </p>
                            </div>
                            
                            {/* YouTube Badge */}
                            {track.sourceType === 'youtube' && (
                              <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs flex-shrink-0">
                                ▶ YouTube
                              </span>
                            )}
                            
                            {/* Action Buttons */}
                            <div className="flex gap-1 flex-shrink-0">
                              <button 
                                onClick={() => setEditingTrack(track)} 
                                className="w-8 h-8 rounded-full bg-white/10 text-white/60 hover:bg-white/20 flex items-center justify-center"
                                title="Sửa"
                              >
                                ✏️
                              </button>
                              <button 
                                onClick={() => handleDeleteTrack(track.id)} 
                                className="w-8 h-8 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30 flex items-center justify-center"
                                title="Xóa"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {DEMO_PLAYLISTS.map((playlist) => (
                        <button key={playlist.id} onClick={() => { setCurrentPlaylist(playlist); setIsPlaying(true); }} className={`p-4 rounded-2xl text-center hover:bg-white/15 ${currentPlaylist.id === playlist.id ? 'bg-white/20' : 'bg-white/10'}`}>
                          <div className="w-16 h-16 mx-auto mb-3 rounded-xl bg-gradient-to-br from-pink-500/30 to-purple-500/30 flex items-center justify-center text-3xl">{playlist.cover}</div>
                          <p className="text-white font-semibold text-sm">{playlist.name}</p>
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {/* YouTube Player */}
                  {showYouTubePlayer && currentMusicUrl && currentMusicUrl.includes('youtube.com/embed') && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-medium">📺 YouTube Player</span>
                        <button 
                          onClick={() => {
                            setShowYouTubePlayer(false);
                            setCurrentMusicUrl(null);
                            setCurrentTrack(null);
                            setIsPlaying(false);
                          }}
                          className="text-white/60 hover:text-white text-sm"
                        >
                          ✕ Đóng
                        </button>
                      </div>
                      <div className="aspect-video rounded-xl overflow-hidden bg-black">
                        <iframe
                          src={currentMusicUrl}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          title="YouTube Video"
                        />
                      </div>
                    </div>
                  )}
                  
                  {uploadedTracks.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-white/10">
                      <div className="flex items-center gap-2">
                        <span className="text-white/60">🔊</span>
                        <input type="range" min="0" max="100" value={volume} onChange={(e) => { setVolume(parseInt(e.target.value)); if (audioRef.current) audioRef.current.volume = parseInt(e.target.value) / 100; }} className="w-24 accent-white" />
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* FILES */}
              {activeFeature === 'files' && (
                <div className="space-y-4">
                  <div onClick={() => fileInputRef.current?.click()} className="glass-card rounded-3xl p-12 text-center cursor-pointer hover:bg-white/10 transition-all border-2 border-dashed border-white/20">
                    <input ref={fileInputRef} type="file" multiple onChange={handleFileUpload} className="hidden" accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.mp3,.mp4,.zip" />
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center text-4xl">📤</div>
                    <h3 className="text-xl font-bold text-white mb-2">Upload & Chia se file</h3>
                    <p className="text-white/60">Click de chon file hoac ke tha</p>
                  </div>
                  
                  {uploadedFiles.length > 0 ? (
                    <div className="glass-card rounded-3xl p-6">
                      <h3 className="text-white font-bold mb-4">📂 File da chia se ({uploadedFiles.length})</h3>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {uploadedFiles.map((file) => (
                          <div key={file.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10">
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500/30 to-cyan-500/30 flex items-center justify-center text-2xl">{getFileIcon(file.fileType)}</div>
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-medium truncate">{file.originalName}</p>
                              <p className="text-white/50 text-sm">{formatFileSize(file.fileSize)} • {file.uploaderName}</p>
                            </div>
                            {(file.fileType === 'image' || file.fileType === 'video' || file.fileType === 'audio' || file.fileType === 'pdf') && (
                              <button onClick={() => handlePreviewFile(file)} className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center hover:bg-purple-500/30" title="Xem truoc">👁</button>
                            )}
                            <button onClick={() => handleDownloadFile(file)} className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center hover:bg-blue-500/30" title="Tai ve">⬇</button>
                            <button onClick={() => handleDeleteFile(file.id)} className="w-8 h-8 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center hover:bg-red-500/30">✕</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="glass-card rounded-3xl p-8 text-center">
                      <div className="text-5xl mb-4">📭</div>
                      <p className="text-white/60">Chua co file nao</p>
                    </div>
                  )}
                </div>
              )}
              
              {/* NOTES */}
              {activeFeature === 'notes' && (
                <div className="glass-card rounded-3xl p-6">
                  <h3 className="text-white font-bold mb-4">📝 Ghi chu chia se</h3>
                  <div className="flex gap-3 mb-4">
                    <input type="text" value={newNote} onChange={(e) => setNewNote(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddNote()} placeholder="Viet ghi chu..." className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white placeholder-white/40" />
                    <button onClick={handleAddNote} className="px-6 py-2 rounded-xl bg-indigo-500 text-white font-semibold">Them</button>
                  </div>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {notes.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="text-5xl mb-4">📝</div>
                        <p className="text-white/60">Chua co ghi chu nao</p>
                      </div>
                    ) : notes.map((note) => (
                      <div key={note.id} className="p-4 rounded-xl bg-white/5 hover:bg-white/10">
                        {editingNoteId === note.id ? (
                          <div className="flex gap-2">
                            <input type="text" value={editingNoteContent} onChange={(e) => setEditingNoteContent(e.target.value)} className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-1 text-white" />
                            <button onClick={() => handleSaveNote(note.id)} className="px-3 py-1 rounded-lg bg-green-500 text-white text-sm">Luu</button>
                            <button onClick={() => setEditingNoteId(null)} className="px-3 py-1 rounded-lg bg-white/20 text-white text-sm">Huy</button>
                          </div>
                        ) : (
                          <div className="flex items-start gap-3">
                            <p className="flex-1 text-white">{note.content}</p>
                            <button onClick={() => handleEditNote(note)} className="text-white/40 hover:text-white">✏️</button>
                            <button onClick={() => handleDeleteNote(note.id)} className="text-white/40 hover:text-red-400">✕</button>
                          </div>
                        )}
                        <p className="text-xs text-white/40 mt-2">{new Date(note.createdAt).toLocaleString('vi-VN')}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* VIDEO CALL */}
              {activeFeature === 'video' && (
                <div className="glass-card rounded-3xl p-6">
                  <h3 className="text-white font-bold mb-4">🎥 Video Call</h3>
                  {isInCall ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        {/* Local Video */}
                        <div className="aspect-video rounded-xl bg-slate-800 relative overflow-hidden">
                          <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                          {isVideoOn ? null : (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-16 h-16 rounded-full bg-indigo-500 flex items-center justify-center text-2xl font-bold text-white">B</div>
                            </div>
                          )}
                          <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-black/50 text-white text-xs">Ban (You)</div>
                        </div>
                        {/* Remote Video Placeholder */}
                        <div className="aspect-video rounded-xl bg-slate-800 flex items-center justify-center">
                          <div className="text-center">
                            <div className="w-16 h-16 rounded-full bg-purple-500 mx-auto flex items-center justify-center text-2xl font-bold text-white mb-2">
                              {selectedRoom.name.charAt(0)}
                            </div>
                            <p className="text-white/60 text-sm">Dang cho nguoi tham gia...</p>
                          </div>
                        </div>
                      </div>
                      {/* Call Controls */}
                      <div className="flex justify-center gap-4">
                        <button onClick={toggleCallMute} className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${isAudioOn ? 'bg-slate-700 text-white' : 'bg-red-500 text-white'}`}>
                          {isAudioOn ? '🎤' : '🔇'}
                        </button>
                        <button onClick={toggleCallVideo} className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${isVideoOn ? 'bg-slate-700 text-white' : 'bg-red-500 text-white'}`}>
                          {isVideoOn ? '📹' : '📷'}
                        </button>
                        <button onClick={toggleCallScreenShare} className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${isScreenSharing ? 'bg-green-500 text-white' : 'bg-slate-700 text-white'}`}>
                          🖥️
                        </button>
                        <button onClick={endCall} className="w-12 h-12 rounded-full bg-red-500 text-white flex items-center justify-center text-xl hover:bg-red-600">
                          📴
                        </button>
                      </div>
                      
                      {/* Participants List */}
                      {callParticipants.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-white/10">
                          <p className="text-white/60 text-sm mb-2">Nguoi tham gia ({callParticipants.length}):</p>
                          <div className="flex flex-wrap gap-2">
                            {callParticipants.map((participant) => (
                              <div key={participant.id} className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/10">
                                <span className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-xs text-white font-bold">
                                  {participant.userName?.charAt(0).toUpperCase() || '?'}
                                </span>
                                <span className="text-white text-sm">{participant.userName}</span>
                                {participant.isMuted && <span className="text-red-400 text-xs">🔇</span>}
                                {participant.isVideoOff && <span className="text-red-400 text-xs">📷</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-4xl">
                        📹
                      </div>
                      <p className="text-white/60 mb-4">Bat dau cuoc goi video voi thanh vien trong phong</p>
                      <button onClick={startCall} className="px-8 py-3 rounded-full bg-green-500 text-white font-bold text-lg hover:bg-green-600 transition-all">
                        📞 Bat dau goi
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Sidebar */}
            <div className="space-y-4">
              {/* Pomodoro Timer */}
              <div className="glass-card rounded-2xl p-6 text-center">
                <h3 className="text-white font-bold mb-4">🍅 Pomodoro</h3>
                <div className="flex justify-center gap-2 mb-4">
                  <button onClick={() => { setPomodoroMode('work'); setPomodoroTime(25 * 60); }} className={`px-4 py-1 rounded-full text-sm ${pomodoroMode === 'work' ? 'bg-red-500 text-white' : 'bg-white/20 text-white/70'}`}>Work</button>
                  <button onClick={() => { setPomodoroMode('break'); setPomodoroTime(5 * 60); }} className={`px-4 py-1 rounded-full text-sm ${pomodoroMode === 'break' ? 'bg-green-500 text-white' : 'bg-white/20 text-white/70'}`}>Break</button>
                </div>
                <div className="relative w-32 h-32 mx-auto mb-4">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="64" cy="64" r="58" stroke="rgba(255,255,255,0.2)" strokeWidth="6" fill="none" />
                    <circle cx="64" cy="64" r="58" stroke="white" strokeWidth="6" fill="none" strokeLinecap="round" strokeDasharray={2 * Math.PI * 58} strokeDashoffset={2 * Math.PI * 58 * (1 - pomodoroTime / (pomodoroMode === 'work' ? 25 * 60 : 5 * 60))} className="transition-all duration-1000" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-white font-[family-name:var(--font-display)]">{formatTime(pomodoroTime)}</span>
                  </div>
                </div>
                <button onClick={() => setIsPomodoroRunning(!isPomodoroRunning)} className={`px-6 py-2 rounded-full font-bold ${isPomodoroRunning ? 'bg-white text-emerald-600' : 'bg-white/20 text-white'}`}>
                  {isPomodoroRunning ? '⏸ Pause' : '▶ Start'}
                </button>
              </div>
              
              {/* Members */}
              <div className="glass-card rounded-2xl p-4">
                <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  Thanh vien ({selectedRoom.memberCount})
                </h3>
                <div className="space-y-2">
                  {(selectedRoom.members || []).slice(0, showAllMembers ? undefined : 5).map((member) => (
                    <div key={member.id} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">{member.name?.charAt(0) || '?'}</div>
                      <span className="text-white text-sm">{member.name || 'Unknown'}</span>
                      <span className="ml-auto text-xs text-white/40">{member.role}</span>
                    </div>
                  ))}
                  {selectedRoom.memberCount > 5 && (
                    <button
                      onClick={() => setShowAllMembers(!showAllMembers)}
                      className="w-full py-2 text-center text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      {showAllMembers ? '▲ An bot' : `▼ Xem them (${selectedRoom.memberCount - 5} nua)`}
                    </button>
                  )}
                </div>
              </div>
              
              {/* Invite Code */}
              <div className="glass-card rounded-2xl p-4">
                <h3 className="text-white font-bold mb-3">🔗 Ma moi</h3>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-4 py-2 rounded-lg bg-white/10 text-indigo-400 font-mono font-bold text-center">{selectedRoom.inviteCode || '------'}</code>
                  <button onClick={() => navigator.clipboard.writeText(selectedRoom.inviteCode || '')} className="px-4 py-2 rounded-lg bg-indigo-500 text-white text-sm font-semibold">Sao chep</button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Theme Picker */}
        {showThemePicker && (
          <div className="fixed top-20 right-4 z-50 glass-card rounded-2xl p-4 shadow-2xl animate-fade-in-up w-64">
            <h3 className="text-white font-bold mb-3 text-sm">Chon nen</h3>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {(Object.keys(THEMES) as ThemeType[]).map((themeKey) => (
                <button key={themeKey} onClick={() => handleThemeSelect(themeKey)} className={`p-2 rounded-xl ${currentTheme === themeKey ? 'ring-2 ring-white' : ''}`}>
                  <div className={`w-full h-8 rounded-lg bg-gradient-to-br ${THEMES[themeKey].bg} mb-1`} />
                  <span className="text-xs text-white/80">{THEMES[themeKey].name}</span>
                </button>
              ))}
            </div>
            {/* Upload custom background */}
            <div className="border-t border-white/10 pt-3">
              <p className="text-white/60 text-xs mb-2">Hoac tai len anh nen cua ban</p>
              <div
                onClick={() => bgImageInputRef.current?.click()}
                className="p-4 rounded-xl border-2 border-dashed border-white/20 hover:border-white/40 cursor-pointer transition-all text-center"
              >
                <input
                  ref={bgImageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleUploadBackground}
                  className="hidden"
                />
                <div className="text-2xl mb-1">📷</div>
                <p className="text-white/60 text-xs">Upload anh nen tu may</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Add Music Modal */}
        {showAddMusicModal && (
          <AddMusicModal
            onClose={() => setShowAddMusicModal(false)}
            onAddFromLink={handleAddMusicFromLink}
            onAddFromYouTube={handleAddMusicFromYouTube}
            onUpload={handleUploadMusic}
          />
        )}

        {/* File Preview Modal */}
        {previewFile && (
          <FilePreviewModal
            file={previewFile}
            previewUrl={getPreviewUrl(previewFile)}
            onClose={closePreview}
            onDownload={() => handleDownloadFile(previewFile)}
          />
        )}

        {/* Edit Track Modal */}
        {editingTrack && (
          <AddMusicModal 
            onClose={() => setEditingTrack(null)} 
            onAddFromLink={handleAddMusicFromLink}
            editingTrack={editingTrack}
            onUpdateTrack={handleUpdateTrack}
          />
        )}
      </div>
    );
  }
  
  // ===== MAIN LIST VIEW =====
  return (
    <div>
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="text-right">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Thoi gian</p>
          <p className="text-2xl font-bold font-[family-name:var(--font-display)] bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            {currentTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
        </div>
      </div>
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="page-title">Study Hub</h1>
          <p className="page-subtitle">Chat - Video/Audio call - Nhac - Ghi chu - File - Bai tap - Emoji</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowJoinModal(true)} className="btn-secondary">Tham gia bang ma</button>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary">+ Tao phong moi</button>
        </div>
      </div>
      
      {/* Tabs */}
      <TabBar className="mb-8" activeTab={activeTab} onChange={(id) => setActiveTab(id as TabType)} tabs={[
        { id: 'rooms', label: 'Phong hoc', count: myCreatedSpaces.length },
        { id: 'friends', label: 'Ban be', count: friends.length, badge: requests.length || undefined },
      ]} />
      
      {/* ROOMS TAB */}
      {activeTab === 'rooms' && (
        <>
          <div className="flex gap-2 mb-6">
            {[
              { id: 'my-rooms' as RoomTabType, label: 'Phong cua toi' },
              { id: 'joined' as RoomTabType, label: 'Da tham gia' },
              { id: 'public' as RoomTabType, label: 'Phong cong khai' },
              { id: 'live' as RoomTabType, label: 'Dang live' },
            ].map((tab) => (
              <button key={tab.id} onClick={() => setRoomTab(tab.id)} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${roomTab === tab.id ? 'bg-indigo-500 text-white' : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'}`}>
                {tab.label}
              </button>
            ))}
          </div>
          
          {/* My Rooms */}
          {roomTab === 'my-rooms' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myCreatedSpaces.length === 0 ? (
                <div className="col-span-full text-center py-20 rounded-3xl glass-card">
                  <div className="empty-symbol">0</div>
                  <p className="text-lg font-semibold text-slate-300 mb-2">Ban chua tao phong nao</p>
                  <button onClick={() => setShowCreateModal(true)} className="text-indigo-400 hover:text-indigo-300 font-medium">Tao phong moi</button>
                </div>
              ) : myCreatedSpaces.map((space, i) => renderRoomCard(space, i, true))}
            </div>
          )}
          
          {/* Joined */}
          {roomTab === 'joined' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(() => {
                const joined = mySpaces.filter(s => !myCreatedSpaces.some(cs => cs.id === s.id));
                return joined.length === 0 ? (
                  <div className="col-span-full text-center py-20 rounded-3xl glass-card">
                    <div className="empty-symbol">—</div>
                    <p className="text-lg font-semibold text-slate-300 mb-2">Ban chua tham gia phong nao</p>
                    <button onClick={() => setRoomTab('public')} className="text-indigo-400 hover:text-indigo-300 font-medium">Kham pha phong cong khai</button>
                  </div>
                ) : joined.map((space, i) => renderRoomCard(space, i));
              })()}
            </div>
          )}
          
          {/* Public */}
          {roomTab === 'public' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {publicSpaces.map((space, i) => (
                <div key={space.id} onClick={() => handleJoinSpace(space.id)} className="group relative overflow-hidden rounded-2xl p-6 cursor-pointer animate-fade-in-up" style={{ animationDelay: `${i * 100}ms`, background: 'linear-gradient(145deg, #1a1a2e, #16213e)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <h3 className="font-bold text-white text-lg mb-2">{space.name}</h3>
                  <p className="text-sm text-slate-400 line-clamp-2 mb-3">{space.description || 'Chua co mo ta'}</p>
                  <p className="text-xs text-slate-500">Tao boi {space.creatorName}</p>
                  <div className="flex items-center justify-between pt-4" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <span className="text-sm text-slate-500">{space.memberCount} thanh vien</span>
                    <button className="btn-primary !px-4 !py-1.5 !text-xs">Tham gia</button>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Live */}
          {roomTab === 'live' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {liveRooms.length === 0 ? (
                <div className="col-span-full text-center py-20 rounded-3xl glass-card">
                  <div className="empty-symbol">🔴</div>
                  <p className="text-lg font-semibold text-slate-300 mb-2">Khong co phong nao dang live</p>
                </div>
              ) : liveRooms.map((space, i) => (
                <div key={space.id} onClick={() => loadRoomDetail(space)} className="group relative overflow-hidden rounded-2xl p-6 cursor-pointer animate-fade-in-up" style={{ animationDelay: `${i * 100}ms`, background: 'linear-gradient(145deg, #1a1a2e, #16213e)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-pink-500" />
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-red-400 text-xs font-semibold">DANG LIVE</span>
                  </div>
                  <h3 className="font-bold text-white text-lg mb-2">{space.name}</h3>
                  <p className="text-sm text-slate-400 line-clamp-2 mb-3">{space.description || 'Chua co mo ta'}</p>
                  <div className="flex items-center justify-between pt-4" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <span className="text-sm text-slate-500">{space.memberCount} nguoi</span>
                    <button className="px-4 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-xs font-semibold">Tham gia ngay</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
      
      {/* FRIENDS TAB */}
      {activeTab === 'friends' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Requests */}
          {requests.length > 0 && (
            <div className="rounded-2xl p-6" style={{ background: 'linear-gradient(145deg, #1a1a2e, #16213e)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <h3 className="font-bold text-white mb-4">Loi moi ket ban</h3>
              <div className="space-y-3">
                {requests.map((req) => (
                  <div key={req.id} className="flex items-center gap-4 p-4 rounded-xl bg-white/5">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">{req.userName?.charAt(0).toUpperCase()}</div>
                    <div className="flex-1">
                      <p className="font-semibold text-white">{req.userName}</p>
                      <p className="text-xs text-slate-500">{new Date(req.createdAt).toLocaleDateString('vi-VN')}</p>
                    </div>
                    <button onClick={() => friendService.acceptRequest(req.id).then(loadData)} className="btn-primary !px-3 !py-1.5 !text-xs">Chap nhan</button>
                    <button onClick={() => friendService.declineRequest(req.id).then(loadData)} className="btn-secondary !px-3 !py-1.5 !text-xs">Tu choi</button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Friends List */}
          <div className="rounded-2xl p-6" style={{ background: 'linear-gradient(145deg, #1a1a2e, #16213e)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white">Ban be cua toi</h3>
              <button onClick={() => setShowAddFriendModal(true)} className="text-sm text-indigo-400 hover:text-indigo-300 font-semibold">+ Them ban</button>
            </div>
            {friends.length === 0 ? (
              <div className="text-center py-12">
                <div className="empty-symbol">—</div>
                <p className="text-slate-400">Chua co ban be</p>
              </div>
            ) : (
              <div className="space-y-2">
                {friends.map((friend) => (
                  <div key={friend.id} className="flex items-center gap-4 p-4 rounded-xl bg-white/5">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">{friend.friendName?.charAt(0).toUpperCase()}</div>
                    <div className="flex-1">
                      <p className="font-semibold text-white">{friend.friendName}</p>
                      <p className="text-xs text-slate-500">Ban be tu {new Date(friend.createdAt).toLocaleDateString('vi-VN')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl p-6 w-full max-w-md animate-scale-in" style={{ background: 'linear-gradient(145deg, #1a1a2e, #16213e)', border: '1px solid rgba(255, 255, 255, 0.1)', boxShadow: '0 32px 64px rgba(0, 0, 0, 0.5)' }}>
            <h2 className="text-xl font-bold text-white mb-5">Tao Phong Hoc</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1.5">Ten phong</label>
                <input type="text" value={newSpace.name} onChange={(e) => setNewSpace({ ...newSpace, name: e.target.value })} className="input-field" placeholder="VD: Nhom hoc Toan" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1.5">Mo ta</label>
                <textarea value={newSpace.description} onChange={(e) => setNewSpace({ ...newSpace, description: e.target.value })} className="input-field resize-none" rows={3} placeholder="Phong hoc nay ve gi?" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1.5">Loai phong</label>
                <select value={newSpace.spaceType} onChange={(e) => setNewSpace({ ...newSpace, spaceType: e.target.value })} className="input-field">
                  <option value="public">Cong khai</option>
                  <option value="private">Rieng tu (chi moi)</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowCreateModal(false)} className="btn-secondary">Huy</button>
              <button onClick={handleCreateSpace} className="btn-primary">Tao phong</button>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit Modal */}
      {showEditModal && editingSpace && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl p-6 w-full max-w-md animate-scale-in" style={{ background: 'linear-gradient(145deg, #1a1a2e, #16213e)', border: '1px solid rgba(255, 255, 255, 0.1)', boxShadow: '0 32px 64px rgba(0, 0, 0, 0.5)' }}>
            <h2 className="text-xl font-bold text-white mb-5">Chinh sua phong hoc</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1.5">Ten phong</label>
                <input type="text" value={editingSpace.name} onChange={(e) => setEditingSpace({ ...editingSpace, name: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1.5">Mo ta</label>
                <textarea value={editingSpace.description || ''} onChange={(e) => setEditingSpace({ ...editingSpace, description: e.target.value })} className="input-field resize-none" rows={3} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1.5">Loai phong</label>
                <select value={editingSpace.spaceType} onChange={(e) => setEditingSpace({ ...editingSpace, spaceType: e.target.value })} className="input-field">
                  <option value="public">Cong khai</option>
                  <option value="private">Rieng tu</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => { setShowEditModal(false); setEditingSpace(null); }} className="btn-secondary">Huy</button>
              <button onClick={handleUpdateSpace} className="btn-primary" disabled={isUpdating}>{isUpdating ? 'Dang luu...' : 'Luu'}</button>
            </div>
          </div>
        </div>
      )}
      
      {/* Join Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl p-6 w-full max-w-md animate-scale-in" style={{ background: 'linear-gradient(145deg, #1a1a2e, #16213e)', border: '1px solid rgba(255, 255, 255, 0.1)', boxShadow: '0 32px 64px rgba(0, 0, 0, 0.5)' }}>
            <h2 className="text-xl font-bold text-white mb-5">Tham gia bang ma moi</h2>
            <input type="text" value={inviteCode} onChange={(e) => setInviteCode(e.target.value.toUpperCase())} className="input-field text-center text-xl tracking-[0.3em] font-bold" style={{ border: '2px dashed rgba(99, 102, 241, 0.3)' }} placeholder="ABCD1234" />
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowJoinModal(false)} className="btn-secondary">Huy</button>
              <button onClick={handleJoinByCode} className="btn-primary">Tham gia</button>
            </div>
          </div>
        </div>
      )}
      
      {/* Add Friend Modal */}
      {showAddFriendModal && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl p-6 w-full max-w-md animate-scale-in" style={{ background: 'linear-gradient(145deg, #1a1a2e, #16213e)', border: '1px solid rgba(255, 255, 255, 0.1)', boxShadow: '0 32px 64px rgba(0, 0, 0, 0.5)' }}>
            <h2 className="text-xl font-bold text-white mb-5">Them ban be</h2>
            <div className="flex gap-2">
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && friendService.searchUsers(searchQuery).then(setSearchResults)} className="input-field flex-1" placeholder="Tim theo ten hoac email" />
              <button onClick={() => friendService.searchUsers(searchQuery).then(setSearchResults)} className="btn-primary">Tim</button>
            </div>
            {searchResults.length > 0 && (
              <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
                {searchResults.map((user) => (
                  <div key={user.id} className="flex items-center gap-4 p-4 rounded-xl bg-white/5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">{user.name?.charAt(0).toUpperCase()}</div>
                    <div className="flex-1">
                      <p className="font-semibold text-white">{user.name}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                    <button onClick={() => friendService.sendRequest(user.id).then(() => { alert('Da gui loi moi!'); setSearchResults([]); setSearchQuery(''); })} className="btn-primary !px-3 !py-1.5 !text-xs">Them</button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-end mt-6">
              <button onClick={() => { setShowAddFriendModal(false); setSearchQuery(''); setSearchResults([]); }} className="btn-secondary">Dong</button>
            </div>
          </div>
        </div>
      )}
      
      <DeleteConfirmModal isOpen={showDeleteModal} title="Xoa phong hoc" message="Ban co chac muon xoa phong hoc nay?" onConfirm={confirmDeleteSpace} onCancel={() => { setShowDeleteModal(false); setDeletingSpaceId(null); }} isDeleting={isDeleting} />
    </div>
  );
}

// ============= ADD MUSIC MODAL =============
type MusicAddTab = 'link' | 'youtube' | 'upload';

function AddMusicModal({ 
  onClose, 
  onAddFromLink, 
  onAddFromYouTube,
  onUpload,
  editingTrack,
  onUpdateTrack,
}: { 
  onClose: () => void; 
  onAddFromLink: (title: string, url: string, artist?: string) => void;
  onAddFromYouTube?: (url: string) => void;
  onUpload?: (file: File, title: string, artist?: string) => void;
  editingTrack?: MusicTrack | null;
  onUpdateTrack?: (trackId: number, title: string, artist?: string) => void;
}) {
  const [title, setTitle] = useState(editingTrack?.title || '');
  const [artist, setArtist] = useState(editingTrack?.artist || '');
  const [url, setUrl] = useState('');
  const [addTab, setAddTab] = useState<MusicAddTab>('link');
  const [isYouTube, setIsYouTube] = useState(false);
  const [youTubePreview, setYouTubePreview] = useState<{ videoId: string; thumbnail: string } | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if URL is YouTube
  useEffect(() => {
    if (url) {
      const videoId = extractYouTubeId(url);
      if (videoId) {
        setIsYouTube(true);
        setYouTubePreview({ videoId, thumbnail: getYouTubeThumbnail(videoId, 'medium') });
      } else {
        setIsYouTube(false);
        setYouTubePreview(null);
      }
    } else {
      setIsYouTube(false);
      setYouTubePreview(null);
    }
  }, [url]);

  const handleSubmit = () => {
    if (editingTrack && onUpdateTrack) {
      onUpdateTrack(editingTrack.id, title || editingTrack.title, artist || undefined);
    } else if (addTab === 'upload' && uploadFile && onUpload) {
      onUpload(uploadFile, title || uploadFile.name, artist || undefined);
    } else if (isYouTube && onAddFromYouTube) {
      onAddFromYouTube(url);
    } else if (url) {
      onAddFromLink(title || 'Untitled', url, artist || undefined);
    }
  };

  if (editingTrack) {
    return (
      <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
        <div className="glass-card rounded-2xl p-6 w-full max-w-md animate-scale-in">
          <h2 className="text-xl font-bold text-white mb-5">✏️ Sửa thông tin bài hát</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-white/80 mb-1">Tên bài hát</label>
              <input 
                type="text" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white" 
                placeholder="VD: Summer Vibes" 
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-white/80 mb-1">Nghệ sĩ (tùy chọn)</label>
              <input 
                type="text" 
                value={artist} 
                onChange={(e) => setArtist(e.target.value)} 
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white" 
                placeholder="VD: Chill Artist" 
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={onClose} className="px-4 py-2 rounded-full bg-white/10 text-white/80 hover:bg-white/20">Hủy</button>
            <button onClick={handleSubmit} className="px-6 py-2 rounded-full bg-indigo-500 text-white font-semibold hover:bg-indigo-600">
              💾 Lưu
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
      <div className="glass-card rounded-2xl p-6 w-full max-w-lg animate-scale-in">
        <h2 className="text-xl font-bold text-white mb-5">➕ Thêm nhạc</h2>
        
        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button 
            onClick={() => { setAddTab('link'); setUrl(''); }}
            className={`px-4 py-2 rounded-full text-sm font-semibold ${addTab === 'link' ? 'bg-pink-500 text-white' : 'bg-white/10 text-white/60'}`}
          >
            🔗 Link nhạc
          </button>
          <button 
            onClick={() => { setAddTab('youtube'); setUrl(''); }}
            className={`px-4 py-2 rounded-full text-sm font-semibold ${addTab === 'youtube' ? 'bg-red-500 text-white' : 'bg-white/10 text-white/60'}`}
          >
            📺 YouTube
          </button>
          <button 
            onClick={() => { setAddTab('upload'); setUploadFile(null); }}
            className={`px-4 py-2 rounded-full text-sm font-semibold ${addTab === 'upload' ? 'bg-green-500 text-white' : 'bg-white/10 text-white/60'}`}
          >
            📤 Từ máy
          </button>
        </div>
        
        <div className="space-y-4">
          {addTab === 'link' && (
            <>
              <div>
                <label className="block text-sm font-semibold text-white/80 mb-1">Tên bài hát</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white" 
                  placeholder="VD: Summer Vibes" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-white/80 mb-1">Link nhạc</label>
                <input 
                  type="url" 
                  value={url} 
                  onChange={(e) => setUrl(e.target.value)} 
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white" 
                  placeholder="https://...music.mp3" 
                />
                <p className="text-white/40 text-xs mt-1">Hỗ trợ MP3, WAV, OGG trực tiếp</p>
              </div>
            </>
          )}
          
          {addTab === 'youtube' && (
            <>
              <div>
                <label className="block text-sm font-semibold text-white/80 mb-1">Link YouTube</label>
                <input 
                  type="url" 
                  value={url} 
                  onChange={(e) => setUrl(e.target.value)} 
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white" 
                  placeholder="https://www.youtube.com/watch?v=..." 
                />
                <p className="text-white/40 text-xs mt-1">Dán link YouTube để phát nhạc/video</p>
              </div>
              
              {/* YouTube Preview */}
              {youTubePreview && (
                <div className="flex gap-4 p-3 rounded-xl bg-white/5">
                  <img 
                    src={youTubePreview.thumbnail} 
                    alt="YouTube preview" 
                    className="w-24 h-16 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <p className="text-white font-medium text-sm">YouTube Video</p>
                    <p className="text-white/50 text-xs">ID: {youTubePreview.videoId}</p>
                    <p className="text-green-400 text-xs mt-1">✓ Hợp lệ - sẽ phát trong ứng dụng</p>
                  </div>
                </div>
              )}
              
              {/* Auto-detected YouTube indicator for link tab */}
              {isYouTube && addTab === 'link' && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                  <p className="text-red-400 text-sm">📺 Phát hiện link YouTube!</p>
                  <button 
                    onClick={() => { setAddTab('youtube'); }}
                    className="text-red-300 text-xs hover:underline mt-1"
                  >
                    → Chuyển sang chế độ YouTube để có trải nghiệm tốt hơn
                  </button>
                </div>
              )}
            </>
          )}

          {addTab === 'upload' && (
            <>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-8 rounded-xl border-2 border-dashed border-white/20 hover:border-white/40 cursor-pointer text-center transition-all"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <div className="text-4xl mb-2">{uploadFile ? '🎵' : '📁'}</div>
                <p className="text-white/60 text-sm">
                  {uploadFile ? uploadFile.name : 'Click để chọn file nhạc'}
                </p>
                <p className="text-white/40 text-xs mt-1">MP3, WAV, OGG, M4A</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-white/80 mb-1">Tên bài hát</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white" 
                  placeholder={uploadFile ? '' : 'VD: Summer Vibes'} 
                />
              </div>
            </>
          )}
        </div>
        
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 rounded-full bg-white/10 text-white/80 hover:bg-white/20">Hủy</button>
          <button 
            onClick={handleSubmit} 
            disabled={
              (addTab === 'link' && !url) || 
              (addTab === 'youtube' && !url) ||
              (addTab === 'upload' && !uploadFile)
            } 
            className="px-6 py-2 rounded-full bg-pink-500 text-white font-semibold hover:bg-pink-600 disabled:opacity-40"
          >
            {addTab === 'youtube' ? '📺 Thêm YouTube' : addTab === 'upload' ? '📤 Upload' : '🎵 Thêm nhạc'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ====== FILE PREVIEW MODAL ======
function FilePreviewModal({ file, previewUrl, onClose, onDownload }: {
  file: SharedFile;
  previewUrl: string;
  onClose: () => void;
  onDownload: () => void;
}) {
  const [loading, setLoading] = useState(true);
  
  const formatFileSize = (bytes: number) => {
    if (bytes > 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };
  
  const renderPreview = () => {
    switch (file.fileType) {
      case 'image':
        return (
          <img
            src={previewUrl}
            alt={file.originalName}
            className="max-w-full max-h-[60vh] object-contain rounded-lg"
            onLoad={() => setLoading(false)}
            onError={() => setLoading(false)}
          />
        );
      case 'video':
        return (
          <video
            src={previewUrl}
            controls
            className="max-w-full max-h-[60vh] rounded-lg"
            onCanPlay={() => setLoading(false)}
            onError={() => setLoading(false)}
          >
            Your browser does not support the video tag.
          </video>
        );
      case 'audio':
        return (
          <div className="w-full max-w-md">
            <audio
              src={previewUrl}
              controls
              className="w-full"
              onCanPlay={() => setLoading(false)}
              onError={() => setLoading(false)}
            >
              Your browser does not support the audio element.
            </audio>
          </div>
        );
      case 'pdf':
        return (
          <iframe
            src={previewUrl}
            className="w-full h-[60vh] rounded-lg border-0"
            title={file.originalName}
            onLoad={() => setLoading(false)}
            onError={() => setLoading(false)}
          />
        );
      default:
        return (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">📄</div>
            <p className="text-white/60">Không thể xem trước loại file này</p>
            <p className="text-white/40 text-sm mt-2">{file.originalName}</p>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="glass-card rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-hidden animate-scale-in flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-white truncate">{file.originalName}</h2>
            <p className="text-white/50 text-sm">{formatFileSize(file.fileSize)} • {file.uploaderName}</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 text-white/80 hover:bg-white/20 flex items-center justify-center transition-all ml-4"
          >
            ✕
          </button>
        </div>
        
        {/* Preview Content */}
        <div className="flex-1 overflow-auto flex items-center justify-center bg-black/20 rounded-xl p-4 mb-4">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full" />
            </div>
          )}
          {renderPreview()}
        </div>
        
        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-full bg-white/10 text-white/80 hover:bg-white/20 transition-all"
          >
            Đóng
          </button>
          <button
            onClick={onDownload}
            className="px-6 py-2 rounded-full bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-all flex items-center gap-2"
          >
            <span>⬇</span> Tải về
          </button>
        </div>
      </div>
    </div>
  );
}
