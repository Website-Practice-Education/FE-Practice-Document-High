import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { ChatMessage } from '../services/studySpaceService';
import type { StudySpace } from '../services/studySpaceService';
import { signalRService } from '../services/signalR';
import { studySpaceService, chatService } from '../services/studySpaceService';
import { musicService, fileService, roomSettingsService } from '../services/roomService';
import type { MusicTrack, SharedFile, RoomSettings } from '../services/roomService';
import Loading from '../components/Loading';

type TabType = 'chat' | 'music' | 'files' | 'focus';
type ThemeType = 'aurora' | 'sunset' | 'ocean' | 'forest' | 'lavender' | 'midnight' | 'custom';

const THEMES = {
  aurora: { bg: 'from-emerald-500 via-cyan-400 to-indigo-600', accent: '#10b981', name: 'Aurora Borealis' },
  sunset: { bg: 'from-rose-500 via-orange-400 to-amber-500', accent: '#f97316', name: 'Sunset Vibes' },
  ocean: { bg: 'from-blue-600 via-cyan-500 to-teal-400', accent: '#0ea5e9', name: 'Ocean Wave' },
  forest: { bg: 'from-emerald-700 via-green-500 to-lime-400', accent: '#22c55e', name: 'Forest Chill' },
  lavender: { bg: 'from-violet-600 via-purple-500 to-pink-400', accent: '#a855f7', name: 'Lavender Dream' },
  midnight: { bg: 'from-slate-900 via-purple-900 to-indigo-900', accent: '#6366f1', name: 'Midnight Mode' },
};

// Sample playlists for demo
const DEMO_PLAYLISTS = [
  { id: 1, name: 'Lo-Fi Hip Hop', cover: '🎵', tracks: ['Rainy Day Beats', 'Late Night Study', 'Coffee Shop Vibes'] },
  { id: 2, name: 'Classical Focus', cover: '🎻', tracks: ['Moonlight Sonata', 'Clair de Lune', 'Four Seasons'] },
  { id: 3, name: 'Nature Sounds', cover: '🌿', tracks: ['Rain Forest', 'Ocean Waves', 'Bird Chirping'] },
  { id: 4, name: 'Jazz & Blues', cover: '🎷', tracks: ['Blue in Green', 'Take Five', 'So What'] },
];

export default function SelfStudyRoom() {
  const { id } = useParams<{ id: string }>();
  const [space, setSpace] = useState<StudySpace | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState<TabType>('focus');
  const [currentTheme, setCurrentTheme] = useState<ThemeType>('aurora');
  const [customBgImage, setCustomBgImage] = useState<string | null>(null);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showAddMusicModal, setShowAddMusicModal] = useState(false);
  const [musicTab, setMusicTab] = useState<'playlist' | 'library'>('library');
  
  // Music state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPlaylist, setCurrentPlaylist] = useState(DEMO_PLAYLISTS[0]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [volume, setVolume] = useState(70);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [uploadedTracks, setUploadedTracks] = useState<MusicTrack[]>([]);
  const [currentMusicUrl, setCurrentMusicUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // File upload state
  const [uploadedFiles, setUploadedFiles] = useState<SharedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Pomodoro state
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60);
  const [isPomodoroRunning, setIsPomodoroRunning] = useState(false);
  const [pomodoroMode, setPomodoroMode] = useState<'work' | 'break'>('work');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const token = localStorage.getItem('token');
  const apiUrl = import.meta.env.VITE_API_URL || '';

  const currentUserId = () => {
    if (!token) return '0';
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.nameidentifier;
    } catch {
      return '0';
    }
  };

  useEffect(() => {
    loadSpace();
    loadMessages();
    loadMusicTracks();
    loadSharedFiles();
    loadRoomSettings();
    connectToHub();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => { signalRService.stop(); clearInterval(timer); if (audioRef.current) audioRef.current.pause(); };
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Pomodoro timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPomodoroRunning && pomodoroTime > 0) {
      interval = setInterval(() => {
        setPomodoroTime(prev => prev - 1);
      }, 1000);
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

  // Load room settings
  const loadRoomSettings = async () => {
    try {
      const settings = await roomSettingsService.get(parseInt(id!));
      if (settings.backgroundType === 'custom' && settings.backgroundImagePath) {
        setCustomBgImage(`${apiUrl}${settings.backgroundImagePath}`);
        setCurrentTheme('custom');
      } else if (settings.backgroundValue && THEMES[settings.backgroundValue as ThemeType]) {
        setCurrentTheme(settings.backgroundValue as ThemeType);
      }
    } catch (error) {
      console.error('Failed to load room settings:', error);
    }
  };

  // Load music tracks
  const loadMusicTracks = async () => {
    try {
      const tracks = await musicService.getTracks(parseInt(id!));
      setUploadedTracks(tracks);
    } catch (error) {
      console.error('Failed to load music tracks:', error);
    }
  };

  // Load shared files
  const loadSharedFiles = async () => {
    try {
      const files = await fileService.getFiles(parseInt(id!));
      setUploadedFiles(files);
    } catch (error) {
      console.error('Failed to load shared files:', error);
    }
  };

  const connectToHub = async () => {
    if (!token) return;
    setConnectionStatus('connecting');
    try {
      await signalRService.start(token);
      await signalRService.joinSpace(id!);
      signalRService.onMessage((msg) => setMessages(prev => [...prev, msg]));
      setConnectionStatus('connected');
    } catch (error) {
      console.error('Failed to connect to chat:', error);
      setConnectionStatus('disconnected');
    }
  };

  const loadSpace = async () => {
    try {
      const data = await studySpaceService.getSpace(parseInt(id!));
      setSpace(data);
    } catch (error) {
      console.error('Failed to load space:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    try {
      const data = await chatService.getMessages(parseInt(id!));
      setMessages(data);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    try {
      await signalRService.sendMessage(parseInt(id!), newMessage);
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  // Music handlers
  const handleAddMusicFromLink = async (title: string, url: string, artist?: string) => {
    try {
      const track = await musicService.addFromLink(parseInt(id!), { 
        title, 
        url, 
        artist,
        durationSeconds: 0 
      });
      setUploadedTracks(prev => [track, ...prev]);
      setShowAddMusicModal(false);
    } catch (error) {
      console.error('Failed to add music from link:', error);
    }
  };

  const handleUploadMusic = async (file: File, title: string, artist?: string) => {
    try {
      const track = await musicService.upload(parseInt(id!), file, title, artist);
      setUploadedTracks(prev => [track, ...prev]);
      setShowAddMusicModal(false);
    } catch (error) {
      console.error('Failed to upload music:', error);
    }
  };

  const handleDeleteTrack = async (trackId: number) => {
    try {
      await musicService.delete(trackId);
      setUploadedTracks(prev => prev.filter(t => t.id !== trackId));
    } catch (error) {
      console.error('Failed to delete track:', error);
    }
  };

  const playTrack = (track: MusicTrack) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    const audio = new Audio();
    if (track.sourceType === 'link' && track.externalUrl) {
      audio.src = track.externalUrl;
    } else if (track.filePath) {
      audio.src = `${apiUrl}${track.filePath}`;
    }
    audio.volume = volume / 100;
    audioRef.current = audio;
    audio.play();
    setIsPlaying(true);
    setCurrentMusicUrl(track.externalUrl || (track.filePath ? `${apiUrl}${track.filePath}` : null));
  };

  const togglePlay = () => {
    if (!audioRef.current && uploadedTracks.length > 0) {
      playTrack(uploadedTracks[0]);
      return;
    }
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // File handlers
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      try {
        const uploadedFile = await fileService.upload(parseInt(id!), file);
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

  const handleDownloadFile = (file: SharedFile) => {
    const url = fileService.getDownloadUrl(file.id);
    window.open(url, '_blank');
  };

  // Theme handlers
  const handleThemeChange = async (theme: ThemeType) => {
    setCurrentTheme(theme);
    if (theme !== 'custom') {
      setCustomBgImage(null);
      try {
        await roomSettingsService.updateBackground(parseInt(id!), 'theme', theme);
      } catch (error) {
        console.error('Failed to save theme:', error);
      }
    }
  };

  const handleUploadBackground = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await roomSettingsService.uploadBackgroundImage(parseInt(id!), file);
      setCustomBgImage(`${apiUrl}${result.imageUrl}`);
      setCurrentTheme('custom');
    } catch (error) {
      console.error('Failed to upload background:', error);
    }
  };

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
      image: '🖼️',
      video: '🎬',
      audio: '🎵',
      pdf: '📄',
      document: '📝',
      spreadsheet: '📊',
      presentation: '📽️',
      archive: '📦',
      other: '📁',
    };
    return icons[fileType] || '📁';
  };

  if (loading) return <Loading message="Đang vào phòng tự học..." />;

  if (!space) {
    return (
      <div className="text-center py-20 animate-fade-in-up">
        <div className="empty-symbol">!</div>
        <p className="text-lg font-semibold text-slate-700">Không tìm thấy phòng</p>
        <Link to="/study-spaces" className="btn-primary mt-4 inline-flex">&lt; Quay lại</Link>
      </div>
    );
  }

  const theme = currentTheme !== 'custom' ? THEMES[currentTheme] : null;

  return (
    <div 
      className="min-h-screen animate-fade-in-up relative overflow-hidden"
      style={{
        background: customBgImage 
          ? `url(${customBgImage}) center/cover no-repeat`
          : theme 
            ? `linear-gradient(135deg, var(--tw-gradient-stops))`
            : undefined,
      }}
    >
      {/* Audio element */}
      <audio ref={audioRef} onEnded={() => setIsPlaying(false)} />

      {/* Dynamic Background Layers */}
      {!customBgImage && (
        <div className={`absolute inset-0 ${theme ? `bg-gradient-to-br ${theme.bg}` : 'bg-slate-900'} transition-all duration-1000`}>
          {/* Animated particles */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 rounded-full bg-white/20 animate-float"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 5}s`,
                  animationDuration: `${3 + Math.random() * 4}s`,
                }}
              />
            ))}
          </div>
          {/* Glass overlay */}
          <div className="absolute inset-0 backdrop-blur-sm bg-white/5" />
        </div>
      )}

      {/* Floating Tab Bar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in-up">
        <div className="glass-card rounded-full px-2 py-2 flex items-center gap-1 shadow-2xl">
          {[
            { id: 'focus' as TabType, icon: '🎯', label: 'Focus' },
            { id: 'music' as TabType, icon: '🎵', label: 'Nhạc' },
            { id: 'files' as TabType, icon: '📁', label: 'File' },
            { id: 'chat' as TabType, icon: '💬', label: 'Chat' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 rounded-full transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-white/30 text-white shadow-lg backdrop-blur-md scale-105'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              <span className="text-sm font-semibold hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Theme Picker Button */}
      <button
        onClick={() => setShowThemePicker(!showThemePicker)}
        className="fixed top-4 right-4 z-50 w-12 h-12 rounded-full glass-card flex items-center justify-center text-2xl shadow-lg hover:scale-110 transition-all"
      >
        🎨
      </button>

      {/* Theme Picker Panel */}
      {showThemePicker && (
        <div className="fixed top-20 right-4 z-50 glass-card rounded-2xl p-4 shadow-2xl animate-fade-in-up w-72">
          <h3 className="text-white font-bold mb-3 text-sm">Chọn nền & Hình nền</h3>
          
          {/* Theme Colors */}
          <p className="text-white/60 text-xs mb-2">Màu nền có sẵn</p>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {(Object.keys(THEMES) as ThemeType[]).map((themeKey) => (
              <button
                key={themeKey}
                onClick={() => handleThemeChange(themeKey)}
                className={`p-2 rounded-xl transition-all hover:scale-105 ${
                  currentTheme === themeKey ? 'ring-2 ring-white ring-offset-2 ring-offset-transparent' : ''
                }`}
              >
                <div className={`w-full h-8 rounded-lg bg-gradient-to-br ${THEMES[themeKey].bg} mb-1`} />
                <span className="text-xs text-white/80">{THEMES[themeKey].name}</span>
              </button>
            ))}
          </div>
          
          {/* Upload Background Image */}
          <div className="border-t border-white/10 pt-3">
            <p className="text-white/60 text-xs mb-2">Hình nền tùy chỉnh</p>
            <label className="block w-full p-4 rounded-xl border-2 border-dashed border-white/20 hover:border-white/40 cursor-pointer transition-all text-center">
              <input
                type="file"
                accept="image/*"
                onChange={handleUploadBackground}
                className="hidden"
              />
              <div className="text-2xl mb-1">📷</div>
              <p className="text-white/60 text-xs">Upload hình nền từ máy</p>
            </label>
          </div>
        </div>
      )}

      {/* Add Music Modal */}
      {showAddMusicModal && (
        <AddMusicModal
          onClose={() => setShowAddMusicModal(false)}
          onAddFromLink={handleAddMusicFromLink}
          onUpload={handleUploadMusic}
        />
      )}

      {/* Main Content */}
      <div className="relative z-10 max-w-6xl mx-auto p-6 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 animate-fade-in-down">
          <div className="flex items-center gap-4">
            <Link to="/study-spaces" className="w-10 h-10 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md flex items-center justify-center transition-all text-white font-bold">
              &lt;
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white font-[family-name:var(--font-display)] drop-shadow-lg">
                {space.name}
              </h1>
              <p className="text-white/70 text-sm mt-1">{space.description || 'Chill zone 🦦'}</p>
            </div>
          </div>
          
          {/* Live Clock */}
          <div className="glass-card rounded-2xl px-6 py-4 text-center">
            <p className="text-xs text-white/60 uppercase tracking-wider">Bây giờ</p>
            <p className="text-3xl font-bold text-white font-[family-name:var(--font-display)] tabular-nums drop-shadow-lg">
              {currentTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
          </div>
        </div>

        {/* FOCUS TAB */}
        {activeTab === 'focus' && (
          <div className="space-y-6 animate-fade-in-up">
            {/* Pomodoro Timer */}
            <div className="glass-card rounded-3xl p-8 text-center">
              <div className="flex justify-center gap-4 mb-6">
                <button
                  onClick={() => { setPomodoroMode('work'); setPomodoroTime(25 * 60); }}
                  className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
                    pomodoroMode === 'work' ? 'bg-red-500 text-white' : 'bg-white/20 text-white/70'
                  }`}
                >
                  🍅 Work
                </button>
                <button
                  onClick={() => { setPomodoroMode('break'); setPomodoroTime(5 * 60); }}
                  className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
                    pomodoroMode === 'break' ? 'bg-green-500 text-white' : 'bg-white/20 text-white/70'
                  }`}
                >
                  ☕ Break
                </button>
              </div>
              
              {/* Timer Circle */}
              <div className="relative w-64 h-64 mx-auto mb-6">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="128"
                    cy="128"
                    r="120"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="128"
                    cy="128"
                    r="120"
                    stroke="white"
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 120}
                    strokeDashoffset={2 * Math.PI * 120 * (1 - pomodoroTime / (pomodoroMode === 'work' ? 25 * 60 : 5 * 60))}
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-6xl font-bold text-white font-[family-name:var(--font-display)] tabular-nums drop-shadow-lg">
                    {formatTime(pomodoroTime)}
                  </span>
                  <span className="text-white/60 text-sm mt-2">
                    {pomodoroMode === 'work' ? 'Tập trung nào!' : 'Nghỉ ngơi đi~' }
                  </span>
                </div>
              </div>
              
              <button
                onClick={() => setIsPomodoroRunning(!isPomodoroRunning)}
                className={`px-8 py-3 rounded-full font-bold text-lg transition-all transform hover:scale-105 ${
                  isPomodoroRunning
                    ? 'bg-white text-emerald-600 shadow-lg'
                    : 'bg-white/20 text-white backdrop-blur-md hover:bg-white/30'
                }`}
              >
                {isPomodoroRunning ? '⏸ Pause' : '▶ Start'}
              </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: '⚡', label: 'XP Today', value: `${Math.floor(Math.random() * 200) + 100}`, color: 'from-yellow-400 to-orange-500' },
                { icon: '🔥', label: 'Streak', value: `${Math.floor(Math.random() * 30) + 1} days`, color: 'from-red-500 to-pink-500' },
                { icon: '📚', label: 'Words', value: `${Math.floor(Math.random() * 500) + 100}`, color: 'from-blue-500 to-cyan-500' },
                { icon: '🎯', label: 'Accuracy', value: `${Math.floor(Math.random() * 30) + 70}%`, color: 'from-purple-500 to-indigo-500' },
              ].map((stat, i) => (
                <div
                  key={stat.label}
                  className="glass-card rounded-2xl p-4 text-center hover:scale-105 transition-all animate-fade-in-up"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className={`w-12 h-12 mx-auto mb-2 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-xl`}>
                    {stat.icon}
                  </div>
                  <p className="text-2xl font-bold text-white font-[family-name:var(--font-display)]">{stat.value}</p>
                  <p className="text-xs text-white/60">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Online Members */}
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                Đang học cùng ({space.memberCount})
              </h3>
              <div className="flex flex-wrap gap-3">
                {space.members?.slice(0, 6).map((member, i) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm animate-fade-in-up"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-white/30 to-white/10 flex items-center justify-center text-white font-bold text-sm">
                      {member.name?.charAt(0)}
                    </div>
                    <span className="text-white text-sm font-medium">{member.name}</span>
                  </div>
                ))}
                {space.memberCount > 6 && (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm">
                    <span className="text-white text-sm">+{space.memberCount - 6} more</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* MUSIC TAB */}
        {activeTab === 'music' && (
          <div className="space-y-6 animate-fade-in-up">
            {/* Now Playing */}
            <div className="glass-card rounded-3xl p-6">
              <div className="flex items-center gap-4 mb-4">
                <button
                  onClick={() => setMusicTab('library')}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                    musicTab === 'library' ? 'bg-white/30 text-white' : 'bg-white/10 text-white/60'
                  }`}
                >
                  📚 Thư viện nhạc ({uploadedTracks.length})
                </button>
                <button
                  onClick={() => setMusicTab('playlist')}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                    musicTab === 'playlist' ? 'bg-white/30 text-white' : 'bg-white/10 text-white/60'
                  }`}
                >
                  🎶 Playlists
                </button>
                <button
                  onClick={() => setShowAddMusicModal(true)}
                  className="ml-auto px-4 py-2 rounded-full bg-pink-500 text-white text-sm font-semibold hover:bg-pink-600 transition-all flex items-center gap-2"
                >
                  <span>➕</span> Thêm nhạc
                </button>
              </div>

              {musicTab === 'library' ? (
                /* Uploaded Tracks List */
                <div className="space-y-2">
                  {uploadedTracks.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-5xl mb-4">🎵</div>
                      <p className="text-white/60">Chưa có nhạc nào</p>
                      <p className="text-white/40 text-sm mt-1">Thêm nhạc từ link hoặc upload file</p>
                    </div>
                  ) : (
                    uploadedTracks.map((track, index) => (
                      <div
                        key={track.id}
                        className={`flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-white/10 ${
                          currentMusicUrl === (track.externalUrl || (track.filePath ? `${apiUrl}${track.filePath}` : null)) ? 'bg-white/15' : ''
                        }`}
                      >
                        <button
                          onClick={() => playTrack(track)}
                          className="w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 transition-all"
                        >
                          {currentMusicUrl === (track.externalUrl || (track.filePath ? `${apiUrl}${track.filePath}` : null)) && isPlaying ? '⏸' : '▶'}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium truncate">{track.title}</p>
                          <p className="text-white/50 text-sm truncate">{track.artist || (track.sourceType === 'link' ? '🔗 Link' : '📤 Uploaded')}</p>
                        </div>
                        <span className="text-white/40 text-xs">{formatTime(track.durationSeconds)}</span>
                        <button
                          onClick={() => handleDeleteTrack(track.id)}
                          className="w-8 h-8 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center hover:bg-red-500/30 transition-all"
                        >
                          ✕
                        </button>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                /* Demo Playlists */
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {DEMO_PLAYLISTS.map((playlist) => (
                    <button
                      key={playlist.id}
                      onClick={() => { setCurrentPlaylist(playlist); setCurrentTrackIndex(0); setIsPlaying(true); }}
                      className={`p-4 rounded-2xl text-center transition-all hover:scale-105 ${
                        currentPlaylist.id === playlist.id ? 'bg-white/20' : 'bg-white/10 hover:bg-white/15'
                      }`}
                    >
                      <div className="w-16 h-16 mx-auto mb-3 rounded-xl bg-gradient-to-br from-pink-500/30 to-purple-500/30 flex items-center justify-center text-3xl">
                        {playlist.cover}
                      </div>
                      <p className="text-white font-semibold text-sm">{playlist.name}</p>
                      <p className="text-white/50 text-xs mt-1">{playlist.tracks.length} tracks</p>
                    </button>
                  ))}
                </div>
              )}

              {/* Music Controls */}
              {uploadedTracks.length > 0 && (
                <div className="mt-6 pt-4 border-t border-white/10">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={togglePlay}
                      className="w-12 h-12 rounded-full bg-white text-slate-800 flex items-center justify-center text-xl hover:scale-110 transition-all shadow-lg"
                    >
                      {isPlaying ? '⏸' : '▶'}
                    </button>
                    <div className="flex-1">
                      <p className="text-white text-sm">
                        {uploadedTracks.find(t => currentMusicUrl === (t.externalUrl || (t.filePath ? `${apiUrl}${t.filePath}` : null)))?.title || 'Select a track'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-white/60">🔊</span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={volume}
                        onChange={(e) => {
                          setVolume(parseInt(e.target.value));
                          if (audioRef.current) audioRef.current.volume = parseInt(e.target.value) / 100;
                        }}
                        className="w-24 accent-white"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* FILES TAB */}
        {activeTab === 'files' && (
          <div className="space-y-6 animate-fade-in-up">
            {/* Upload Area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="glass-card rounded-3xl p-12 text-center cursor-pointer hover:bg-white/10 transition-all border-2 border-dashed border-white/20 hover:border-white/40"
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.mp3,.mp4,.zip,.rar"
              />
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center text-4xl">
                📤
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Upload & Chia sẻ file</h3>
              <p className="text-white/60">Click để chọn file hoặc kéo thả</p>
              <p className="text-white/40 text-sm mt-4">PDF, DOC, TXT, Images, Audio, Video, ZIP</p>
            </div>

            {/* Shared Files List */}
            {uploadedFiles.length > 0 ? (
              <div className="glass-card rounded-3xl p-6">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                  📂 File đã chia sẻ ({uploadedFiles.length})
                </h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {uploadedFiles.map((file, i) => (
                    <div
                      key={file.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all animate-fade-in-up"
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500/30 to-cyan-500/30 flex items-center justify-center text-2xl">
                        {getFileIcon(file.fileType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">{file.originalName}</p>
                        <p className="text-white/50 text-sm">
                          {formatFileSize(file.fileSize)} • Uploaded by {file.uploaderName || 'You'}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDownloadFile(file)}
                        className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center hover:bg-blue-500/30 transition-all"
                        title="Download"
                      >
                        ⬇
                      </button>
                      <button
                        onClick={() => handleDeleteFile(file.id)}
                        className="w-10 h-10 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center hover:bg-red-500/30 transition-all"
                        title="Delete"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="glass-card rounded-3xl p-8 text-center">
                <div className="text-5xl mb-4">📭</div>
                <p className="text-white/60">Chưa có file nào được chia sẻ</p>
                <p className="text-white/40 text-sm mt-1">Upload tài liệu để chia sẻ với mọi người</p>
              </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: '📸', label: 'Chụp ảnh màn hình' },
                { icon: '🎥', label: 'Quay video' },
                { icon: '📝', label: 'Ghi chú nhanh' },
                { icon: '🔗', label: 'Chia sẻ link' },
              ].map((action) => (
                <button
                  key={action.label}
                  className="glass-card rounded-2xl p-4 text-center hover:bg-white/10 transition-all hover:scale-105"
                >
                  <div className="text-3xl mb-2">{action.icon}</div>
                  <p className="text-white text-sm font-medium">{action.label}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* CHAT TAB */}
        {activeTab === 'chat' && (
          <div className="animate-fade-in-up">
            <div className="glass-card rounded-3xl overflow-hidden">
              {/* Chat Header */}
              <div className="p-4 border-b border-white/10 bg-gradient-to-r from-white/5 to-transparent">
                <h3 className="text-white font-bold flex items-center gap-2">
                  💬 Chat học tập
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    connectionStatus === 'connected' ? 'bg-green-500/30 text-green-400' : 'bg-red-500/30 text-red-400'
                  }`}>
                    {connectionStatus === 'connected' ? 'Live' : 'Offline'}
                  </span>
                </h3>
              </div>

              {/* Messages */}
              <div className="h-96 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="text-5xl mb-4">💭</div>
                    <p className="text-white/60">Chưa có tin nhắn nào</p>
                    <p className="text-white/40 text-sm mt-1">Hãy bắt đầu cuộc trò chuyện!</p>
                  </div>
                ) : (
                  messages.map((msg, index) => {
                    const isMine = msg.userId === parseInt(currentUserId());
                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-3 animate-fade-in-up ${isMine ? 'flex-row-reverse' : ''}`}
                        style={{ animationDelay: `${Math.min(index * 30, 300)}ms` }}
                      >
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${
                          isMine 
                            ? 'bg-gradient-to-br from-pink-500 to-rose-500 text-white' 
                            : 'bg-white/20 text-white'
                        }`}>
                          {msg.userName?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div className={`max-w-[70%] ${isMine ? 'text-right' : ''}`}>
                          <div className="text-xs text-white/50 mb-1">
                            {msg.userName} • {new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div className={`inline-block px-4 py-2 rounded-2xl text-sm ${
                            isMine
                              ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-br-sm'
                              : 'bg-white/10 text-white rounded-bl-sm'
                          }`}>
                            {msg.content}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10 bg-white/5">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Nhắn gì đó chill..."
                    className="flex-1 bg-white/10 border border-white/20 rounded-full px-5 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white flex items-center justify-center hover:scale-110 transition-all disabled:opacity-40 disabled:transform-none"
                  >
                    ➤
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Add Music Modal Component
function AddMusicModal({ onClose, onAddFromLink, onUpload }: {
  onClose: () => void;
  onAddFromLink: (title: string, url: string, artist?: string) => void;
  onUpload: (file: File, title: string, artist?: string) => void;
}) {
  const [mode, setMode] = useState<'link' | 'upload'>('link');
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = () => {
    if (mode === 'link' && url) {
      onAddFromLink(title || 'Untitled', url, artist || undefined);
    } else if (mode === 'upload' && file) {
      onUpload(file, title || file.name, artist || undefined);
    }
  };

  return (
    <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
      <div className="glass-card rounded-2xl p-6 w-full max-w-md animate-scale-in">
        <h2 className="text-xl font-bold text-white mb-5 font-[family-name:var(--font-display)]">Thêm nhạc</h2>
        
        {/* Mode Toggle */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setMode('link')}
            className={`flex-1 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              mode === 'link' ? 'bg-pink-500 text-white' : 'bg-white/10 text-white/60'
            }`}
          >
            🔗 Từ Link
          </button>
          <button
            onClick={() => setMode('upload')}
            className={`flex-1 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              mode === 'upload' ? 'bg-pink-500 text-white' : 'bg-white/10 text-white/60'
            }`}
          >
            📤 Upload File
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-white/80 mb-1">Tên bài hát</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white placeholder-white/40"
              placeholder="VD: Summer Vibes"
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-white/80 mb-1">Nghệ sĩ (tùy chọn)</label>
            <input
              type="text"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white placeholder-white/40"
              placeholder="VD: Chill Artist"
            />
          </div>

          {mode === 'link' ? (
            <div>
              <label className="block text-sm font-semibold text-white/80 mb-1">Link nhạc</label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white placeholder-white/40"
                placeholder="https://example.com/music.mp3"
              />
              <p className="text-white/40 text-xs mt-1">Hỗ trợ link MP3, WAV, OGG trực tiếp</p>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-semibold text-white/80 mb-1">Chọn file nhạc</label>
              <label className="block w-full p-6 rounded-xl border-2 border-dashed border-white/20 hover:border-white/40 cursor-pointer transition-all text-center">
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <div className="text-3xl mb-2">{file ? '🎵' : '📁'}</div>
                <p className="text-white/60 text-sm">
                  {file ? file.name : 'Click để chọn file nhạc'}
                </p>
                <p className="text-white/40 text-xs mt-1">MP3, WAV, OGG, M4A</p>
              </label>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 rounded-full bg-white/10 text-white/80 hover:bg-white/20 transition-all">
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={mode === 'link' ? !url : !file}
            className="px-6 py-2 rounded-full bg-pink-500 text-white font-semibold hover:bg-pink-600 transition-all disabled:opacity-40"
          >
            Thêm
          </button>
        </div>
      </div>
    </div>
  );
}
