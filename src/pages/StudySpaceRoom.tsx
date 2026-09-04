import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { ChatMessage } from '../services/studySpaceService';
import type { StudySpace } from '../services/studySpaceService';
import { signalRService } from '../services/signalR';
import { studySpaceService, chatService } from '../services/studySpaceService';
import { musicService, fileService, roomSettingsService } from '../services/roomService';
import type { MusicTrack, SharedFile, RoomSettings } from '../services/roomService';
import Loading from '../components/Loading';

type TabType = 'chat' | 'music' | 'files' | 'focus' | 'notes';
type ThemeType = 'aurora' | 'sunset' | 'ocean' | 'forest' | 'lavender' | 'midnight' | 'custom';

const THEMES = {
  aurora: { bg: 'from-emerald-500 via-cyan-400 to-indigo-600', accent: '#10b981', name: 'Aurora Borealis' },
  sunset: { bg: 'from-rose-500 via-orange-400 to-amber-500', accent: '#f97316', name: 'Sunset Vibes' },
  ocean: { bg: 'from-blue-600 via-cyan-500 to-teal-400', accent: '#0ea5e9', name: 'Ocean Wave' },
  forest: { bg: 'from-emerald-700 via-green-500 to-lime-400', accent: '#22c55e', name: 'Forest Chill' },
  lavender: { bg: 'from-violet-600 via-purple-500 to-pink-400', accent: '#a855f7', name: 'Lavender Dream' },
  midnight: { bg: 'from-slate-900 via-purple-900 to-indigo-900', accent: '#6366f1', name: 'Midnight Mode' },
};

export default function StudySpaceRoom() {
  const { id } = useParams<{ id: string }>();
  const [space, setSpace] = useState<StudySpace | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [typingUsers, setTypingUsers] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState<TabType>('chat');
  const [currentTheme, setCurrentTheme] = useState<ThemeType>('aurora');
  const [customBgImage, setCustomBgImage] = useState<string | null>(null);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showAddMusicModal, setShowAddMusicModal] = useState(false);
  const [musicTab, setMusicTab] = useState<'playlist' | 'library'>('library');
  
  // Music state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [volume, setVolume] = useState(70);
  const [uploadedTracks, setUploadedTracks] = useState<MusicTrack[]>([]);
  const [currentMusicUrl, setCurrentMusicUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // File upload state
  const [uploadedFiles, setUploadedFiles] = useState<SharedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Notes state
  const [notes, setNotes] = useState<{ id: string; content: string; createdAt: string }[]>([]);
  const [newNote, setNewNote] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  
  // Pomodoro state
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60);
  const [isPomodoroRunning, setIsPomodoroRunning] = useState(false);
  const [pomodoroMode, setPomodoroMode] = useState<'work' | 'break'>('work');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unsubMsgRef = useRef<(() => void) | null>(null);
  const unsubTypingRef = useRef<(() => void) | null>(null);
  const isConnectedRef = useRef(false);
  const apiUrl = import.meta.env.VITE_API_URL || '';

  const token = localStorage.getItem('token');
  
  const currentUserId = () => {
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
    } catch {
      return '0';
    }
  };

  useEffect(() => {
    let mounted = true;
    
    const init = async () => {
      await Promise.all([
        loadSpace(mounted),
        loadMessages(mounted),
        loadMusicTracks(),
        loadSharedFiles(),
        loadRoomSettings(),
        loadNotes(),
      ]);
      if (mounted) {
        await connectToHub(mounted);
      }
    };
    
    init();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    
    return () => {
      mounted = false;
      unsubMsgRef.current?.();
      unsubTypingRef.current?.();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      signalRService.stop();
      if (audioRef.current) audioRef.current.pause();
      clearInterval(timer);
      isConnectedRef.current = false;
    };
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

  const connectToHub = async (mounted: boolean = true) => {
    if (!token || isConnectedRef.current) return;
    
    setConnectionStatus('connecting');
    try {
      await signalRService.start(token);
      await signalRService.joinSpace(id!);

      unsubMsgRef.current?.();
      unsubTypingRef.current?.();

      unsubMsgRef.current = signalRService.onMessage((msg: ChatMessage) => {
        if (msg.spaceId === parseInt(id!)) {
          setMessages(prev => {
            const alreadyExists = prev.some(m => m.id === msg.id);
            if (alreadyExists) return prev;
            return [...prev, msg];
          });
        }
      });

      unsubTypingRef.current = signalRService.onTyping((data: { userId: number; spaceId: number }) => {
        if (data.spaceId === parseInt(id!)) {
          setTypingUsers(prev => {
            if (!prev.includes(data.userId)) {
              return [...prev, data.userId];
            }
            return prev;
          });
          setTimeout(() => setTypingUsers(prev => prev.filter(uid => uid !== data.userId)), 2000);
        }
      });

      if (mounted) {
        setConnectionStatus('connected');
        isConnectedRef.current = true;
      }
    } catch (error) {
      console.error('Failed to connect to chat:', error);
      if (mounted) {
        setConnectionStatus('disconnected');
      }
    }
  };

  const loadSpace = async (mounted: boolean = true) => {
    try {
      const data = await studySpaceService.getSpace(parseInt(id!));
      if (mounted) {
        setSpace(data);
      }
    } catch (error) {
      console.error('Failed to load space:', error);
    } finally {
      if (mounted) {
        setLoading(false);
      }
    }
  };

  const loadMessages = async (mounted: boolean = true) => {
    try {
      const data = await chatService.getMessages(parseInt(id!));
      if (mounted) {
        setMessages(data);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

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

  const loadMusicTracks = async () => {
    try {
      const tracks = await musicService.getTracks(parseInt(id!));
      setUploadedTracks(tracks);
    } catch (error) {
      console.error('Failed to load music tracks:', error);
    }
  };

  const loadSharedFiles = async () => {
    try {
      const files = await fileService.getFiles(parseInt(id!));
      setUploadedFiles(files);
    } catch (error) {
      console.error('Failed to load shared files:', error);
    }
  };

  const loadNotes = async () => {
    try {
      const savedNotes = localStorage.getItem(`room_notes_${id}`);
      if (savedNotes) {
        setNotes(JSON.parse(savedNotes));
      }
    } catch (error) {
      console.error('Failed to load notes:', error);
    }
  };

  const saveNotes = (updatedNotes: { id: string; content: string; createdAt: string }[]) => {
    localStorage.setItem(`room_notes_${id}`, JSON.stringify(updatedNotes));
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = newMessage.trim();
    if (!content) return;

    const tempId = -Date.now();
    const userIdNum = parseInt(currentUserId());
    const optimistic: ChatMessage = {
      id: tempId,
      spaceId: parseInt(id!),
      userId: userIdNum || 0,
      userName: 'Ban',
      content,
      messageType: 'text',
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimistic]);
    setNewMessage('');

    try {
      await signalRService.sendMessage(parseInt(id!), content);
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages(prev => prev.filter(m => m.id !== tempId));
    }
  };

  const handleTyping = () => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    signalRService.sendTyping(parseInt(id!));
    typingTimeoutRef.current = setTimeout(() => {}, 0);
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

  // Notes handlers
  const handleAddNote = () => {
    if (!newNote.trim()) return;
    const note = {
      id: Date.now().toString(),
      content: newNote,
      createdAt: new Date().toISOString(),
    };
    const updatedNotes = [note, ...notes];
    setNotes(updatedNotes);
    saveNotes(updatedNotes);
    setNewNote('');
  };

  const handleEditNote = (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (note) {
      setEditingNoteId(noteId);
      setEditingContent(note.content);
    }
  };

  const handleSaveEditNote = () => {
    if (!editingNoteId || !editingContent.trim()) return;
    const updatedNotes = notes.map(n => 
      n.id === editingNoteId 
        ? { ...n, content: editingContent, createdAt: new Date().toISOString() }
        : n
    );
    setNotes(updatedNotes);
    saveNotes(updatedNotes);
    setEditingNoteId(null);
    setEditingContent('');
  };

  const handleDeleteNote = (noteId: string) => {
    const updatedNotes = notes.filter(n => n.id !== noteId);
    setNotes(updatedNotes);
    saveNotes(updatedNotes);
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
      image: 'IMG',
      video: 'VID',
      audio: 'AUD',
      pdf: 'PDF',
      document: 'DOC',
      spreadsheet: 'XLS',
      presentation: 'PPT',
      archive: 'ZIP',
      other: 'FILE',
    };
    return icons[fileType] || 'FILE';
  };

  if (loading) return <Loading message="Dang vao phong hoc..." />;

  if (!space) {
    return (
      <div className="text-center py-20 animate-fade-in-up">
        <div className="empty-symbol">!</div>
        <p className="text-lg font-semibold text-slate-700">Khong tim thay phong hoc</p>
        <Link to="/study-spaces" className="btn-primary mt-4 inline-flex"> Quay lai</Link>
      </div>
    );
  }

  const theme = currentTheme !== 'custom' ? THEMES[currentTheme] : null;
  const members = Array.isArray(space.members)
    ? space.members
    : Array.isArray((space.members as any)?.$values)
      ? (space.members as any).$values
      : [];

  return (
    <div 
      className="min-h-screen animate-fade-in-up relative overflow-hidden"
      style={{
        background: customBgImage 
          ? `url(${customBgImage}) center/cover no-repeat fixed`
          : theme 
            ? undefined
            : 'bg-slate-50',
      }}
    >
      {/* Audio element */}
      <audio ref={audioRef} onEnded={() => setIsPlaying(false)} />

      {/* Dynamic Background */}
      {!customBgImage && theme && (
        <div className={`fixed inset-0 ${theme ? `bg-gradient-to-br ${theme.bg}` : 'bg-slate-900'} transition-all duration-1000 -z-10`}>
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
          <div className="absolute inset-0 backdrop-blur-sm bg-white/5" />
        </div>
      )}

      {/* Theme Picker Button */}
      <button
        onClick={() => setShowThemePicker(!showThemePicker)}
        className="fixed top-4 right-4 z-50 w-12 h-12 rounded-full glass-card flex items-center justify-center text-xl shadow-lg hover:scale-110 transition-all"
      >
        Paint
      </button>

      {/* Theme Picker Panel */}
      {showThemePicker && (
        <div className="fixed top-20 right-4 z-50 glass-card rounded-2xl p-4 shadow-2xl animate-fade-in-up w-72">
          <h3 className="text-white font-bold mb-3 text-sm">Chon nen & Hinh nen</h3>
          
          <p className="text-white/60 text-xs mb-2">Mau nen co san</p>
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
          
          <div className="border-t border-white/10 pt-3">
            <p className="text-white/60 text-xs mb-2">Hinh nen tuy chinh</p>
            <label className="block w-full p-4 rounded-xl border-2 border-dashed border-white/20 hover:border-white/40 cursor-pointer transition-all text-center">
              <input
                type="file"
                accept="image/*"
                onChange={handleUploadBackground}
                className="hidden"
              />
              <div className="text-2xl mb-1">Upload</div>
              <p className="text-white/60 text-xs">Chon hinh tu may</p>
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

      {/* Header */}
      <div className="glass-card rounded-2xl p-5 m-4 animate-fade-in-down">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/study-spaces" className="w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-all text-sm font-bold backdrop-blur-md">
              Back
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white font-[family-name:var(--font-display)]">{space.name}</h1>
              <p className="text-sm text-white/70">{space.description || 'Phong hoc nhom'}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-white/70">{space.memberCount} thanh vien</span>
            <div className="glass-card rounded-full px-3 py-1.5">
              <p className="text-lg font-bold text-white font-[family-name:var(--font-display)] tabular-nums">
                {currentTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex gap-4 p-4 pb-24 h-[calc(100vh-8rem)]">
        {/* Main Panel */}
        <div className="flex-1 glass-card rounded-2xl overflow-hidden animate-fade-in-up">
          {/* Tab Header */}
          <div className="flex border-b border-white/10">
            {[
              { id: 'chat' as TabType, label: 'Chat' },
              { id: 'music' as TabType, label: 'Nhac' },
              { id: 'files' as TabType, label: 'Files' },
              { id: 'notes' as TabType, label: 'Ghi chu' },
              { id: 'focus' as TabType, label: 'Focus' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-4 py-3 text-sm font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-white/15 text-white border-b-2 border-white'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-5 h-[calc(100%-3rem)] overflow-y-auto">
            {/* CHAT TAB */}
            {activeTab === 'chat' && (
              <div className="h-full flex flex-col">
                <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="empty-symbol">—</div>
                      <p className="text-white/60 font-medium">Chua co tin nhan nao</p>
                      <p className="text-sm text-white/40 mt-1">Hay bat dau cuoc tro chuyen!</p>
                    </div>
                  ) : (
                    messages.map((msg, index) => {
                      const isMine = msg.userId === parseInt(currentUserId());
                      return (
                        <div
                          key={msg.id}
                          className={`flex gap-3 animate-fade-in-up ${isMine ? 'flex-row-reverse' : ''}`}
                          style={{ animationDelay: `${Math.min(index * 30, 300)}ms`, animationFillMode: 'forwards', opacity: 0 }}
                        >
                          <div className={`avatar !w-9 !h-9 !text-xs flex-shrink-0 ${isMine ? '' : '!bg-gradient-to-br !from-slate-400 !to-slate-500'}`}>
                            {msg.userName?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <div className={`max-w-[70%] ${isMine ? 'text-right' : ''}`}>
                            <div className={`flex items-center gap-2 mb-1 ${isMine ? 'flex-row-reverse' : ''}`}>
                              <span className="text-sm font-semibold text-white">{msg.userName}</span>
                              <span className="text-xs text-white/50">
                                {new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <div className={`${isMine ? 'chat-bubble-mine' : 'chat-bubble-other'}`}>
                              {msg.content}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  {typingUsers.length > 0 && (
                    <div className="flex items-center gap-2 text-sm text-white/40 italic animate-fade-in">
                      <span className="flex gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce-subtle" />
                        <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce-subtle" style={{ animationDelay: '0.2s' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce-subtle" style={{ animationDelay: '0.4s' }} />
                      </span>
                      Ai do dang nhap...
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSendMessage} className="border-t border-white/10 pt-4">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={handleTyping}
                      placeholder="Nhap tin nhan..."
                      className="input-field flex-1 !rounded-full"
                    />
                    <button type="submit" disabled={!newMessage.trim()} className="btn-primary !rounded-full !px-6 disabled:opacity-40">
                      Gui
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* MUSIC TAB */}
            {activeTab === 'music' && (
              <div className="space-y-4 animate-fade-in-up">
                <div className="flex gap-3 mb-4">
                  <button
                    onClick={() => setMusicTab('library')}
                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                      musicTab === 'library' ? 'bg-white/30 text-white' : 'bg-white/10 text-white/60'
                    }`}
                  >
                    Thu vien nhac ({uploadedTracks.length})
                  </button>
                  <button
                    onClick={() => setShowAddMusicModal(true)}
                    className="ml-auto px-4 py-2 rounded-full bg-pink-500 text-white text-sm font-semibold hover:bg-pink-600 transition-all"
                  >
                    Them nhac
                  </button>
                </div>

                {musicTab === 'library' ? (
                  <div className="space-y-2">
                    {uploadedTracks.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="text-5xl mb-4">Music</div>
                        <p className="text-white/60">Chua co nhac nao</p>
                        <p className="text-sm text-white/40 mt-1">Them nhac tu link hoac upload file</p>
                      </div>
                    ) : (
                      uploadedTracks.map((track) => (
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
                            {currentMusicUrl === (track.externalUrl || (track.filePath ? `${apiUrl}${track.filePath}` : null)) && isPlaying ? 'Pause' : 'Play'}
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium truncate">{track.title}</p>
                            <p className="text-white/50 text-sm truncate">{track.artist || (track.sourceType === 'link' ? 'Link' : 'Uploaded')}</p>
                          </div>
                          <button
                            onClick={() => handleDeleteTrack(track.id)}
                            className="w-8 h-8 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center hover:bg-red-500/30 transition-all"
                          >
                            X
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                ) : null}

                {uploadedTracks.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-white/10">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={togglePlay}
                        className="w-12 h-12 rounded-full bg-white text-slate-800 flex items-center justify-center text-xl hover:scale-110 transition-all shadow-lg"
                      >
                        {isPlaying ? 'Pause' : 'Play'}
                      </button>
                      <div className="flex-1">
                        <p className="text-white text-sm">
                          {uploadedTracks.find(t => currentMusicUrl === (t.externalUrl || (t.filePath ? `${apiUrl}${t.filePath}` : null)))?.title || 'Select a track'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-white/60 text-sm">Vol</span>
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
            )}

            {/* FILES TAB */}
            {activeTab === 'files' && (
              <div className="space-y-4 animate-fade-in-up">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="glass-card rounded-2xl p-8 text-center cursor-pointer hover:bg-white/10 transition-all border-2 border-dashed border-white/20 hover:border-white/40"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.mp3,.mp4,.zip,.rar"
                  />
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center text-3xl">
                    Up
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Upload & Chia se file</h3>
                  <p className="text-white/60 text-sm">Click de chon file hoac keo tha</p>
                  <p className="text-white/40 text-xs mt-2">PDF, DOC, TXT, Images, Audio, Video, ZIP</p>
                </div>

                {uploadedFiles.length > 0 ? (
                  <div className="glass-card rounded-2xl p-4">
                    <h3 className="text-white font-bold mb-4">File da chia se ({uploadedFiles.length})</h3>
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {uploadedFiles.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
                        >
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500/30 to-cyan-500/30 flex items-center justify-center text-sm text-white font-bold">
                            {getFileIcon(file.fileType)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium truncate">{file.originalName}</p>
                            <p className="text-white/50 text-sm">
                              {formatFileSize(file.fileSize)} • {file.uploaderName || 'You'}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDownloadFile(file)}
                            className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center hover:bg-blue-500/30 transition-all"
                          >
                            DL
                          </button>
                          <button
                            onClick={() => handleDeleteFile(file.id)}
                            className="w-10 h-10 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center hover:bg-red-500/30 transition-all"
                          >
                            X
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="glass-card rounded-2xl p-8 text-center">
                    <div className="text-5xl mb-4">Empty</div>
                    <p className="text-white/60">Chua co file nao duoc chia se</p>
                    <p className="text-sm text-white/40 mt-1">Upload tai lieu de chia se voi moi nguoi</p>
                  </div>
                )}
              </div>
            )}

            {/* NOTES TAB */}
            {activeTab === 'notes' && (
              <div className="space-y-4 animate-fade-in-up">
                <div className="glass-card rounded-2xl p-4">
                  <h3 className="text-white font-bold mb-3">Ghi chu nhanh</h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                      placeholder="Viet ghi chu..."
                      className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white placeholder-white/40"
                    />
                    <button
                      onClick={handleAddNote}
                      disabled={!newNote.trim()}
                      className="px-6 py-2 rounded-xl bg-pink-500 text-white font-semibold hover:bg-pink-600 transition-all disabled:opacity-40"
                    >
                      Them
                    </button>
                  </div>
                </div>

                {notes.length > 0 ? (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {notes.map((note) => (
                      <div key={note.id} className="glass-card rounded-xl p-4 bg-white/5 hover:bg-white/10 transition-all">
                        {editingNoteId === note.id ? (
                          <div className="space-y-2">
                            <textarea
                              value={editingContent}
                              onChange={(e) => setEditingContent(e.target.value)}
                              className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white text-sm resize-none"
                              rows={3}
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={handleSaveEditNote}
                                className="px-3 py-1 rounded-lg bg-green-500 text-white text-sm font-semibold hover:bg-green-600 transition-all"
                              >
                                Luu
                              </button>
                              <button
                                onClick={() => setEditingNoteId(null)}
                                className="px-3 py-1 rounded-lg bg-white/10 text-white/60 text-sm font-semibold hover:bg-white/20 transition-all"
                              >
                                Huy
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <p className="text-white mb-2 whitespace-pre-wrap">{note.content}</p>
                            <div className="flex items-center justify-between">
                              <span className="text-white/40 text-xs">
                                {new Date(note.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleEditNote(note.id)}
                                  className="px-3 py-1 rounded-lg bg-blue-500/20 text-blue-400 text-xs font-semibold hover:bg-blue-500/30 transition-all"
                                >
                                  Sua
                                </button>
                                <button
                                  onClick={() => handleDeleteNote(note.id)}
                                  className="px-3 py-1 rounded-lg bg-red-500/20 text-red-400 text-xs font-semibold hover:bg-red-500/30 transition-all"
                                >
                                  Xoa
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-3">Note</div>
                    <p className="text-white/60">Chua co ghi chu nao</p>
                    <p className="text-sm text-white/40 mt-1">Tao ghi chu de ghi lai thong tin quan trong</p>
                  </div>
                )}
              </div>
            )}

            {/* FOCUS TAB */}
            {activeTab === 'focus' && (
              <div className="space-y-6 animate-fade-in-up">
                <div className="glass-card rounded-3xl p-8 text-center">
                  <div className="flex justify-center gap-4 mb-6">
                    <button
                      onClick={() => { setPomodoroMode('work'); setPomodoroTime(25 * 60); }}
                      className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
                        pomodoroMode === 'work' ? 'bg-red-500 text-white' : 'bg-white/20 text-white/70'
                      }`}
                    >
                      Work
                    </button>
                    <button
                      onClick={() => { setPomodoroMode('break'); setPomodoroTime(5 * 60); }}
                      className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
                        pomodoroMode === 'break' ? 'bg-green-500 text-white' : 'bg-white/20 text-white/70'
                      }`}
                    >
                      Break
                    </button>
                  </div>
                  
                  <div className="relative w-56 h-56 mx-auto mb-6">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="112"
                        cy="112"
                        r="104"
                        stroke="rgba(255,255,255,0.2)"
                        strokeWidth="8"
                        fill="none"
                      />
                      <circle
                        cx="112"
                        cy="112"
                        r="104"
                        stroke="white"
                        strokeWidth="8"
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={2 * Math.PI * 104}
                        strokeDashoffset={2 * Math.PI * 104 * (1 - pomodoroTime / (pomodoroMode === 'work' ? 25 * 60 : 5 * 60))}
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-5xl font-bold text-white font-[family-name:var(--font-display)] tabular-nums">
                        {formatTime(pomodoroTime)}
                      </span>
                      <span className="text-white/60 text-sm mt-2">
                        {pomodoroMode === 'work' ? 'Tap trung nao!' : 'Nghi ngoi di~' }
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
                    {isPomodoroRunning ? 'Pause' : 'Start'}
                  </button>
                </div>

                <div className="glass-card rounded-2xl p-6">
                  <h3 className="text-white font-bold mb-4">Dang hoc cung ({space.memberCount})</h3>
                  <div className="flex flex-wrap gap-3">
                    {members.slice(0, 8).map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm"
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-white/30 to-white/10 flex items-center justify-center text-white font-bold text-sm">
                          {member.name?.charAt(0)}
                        </div>
                        <span className="text-white text-sm font-medium">{member.name}</span>
                      </div>
                    ))}
                    {space.memberCount > 8 && (
                      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm">
                        <span className="text-white text-sm">+{space.memberCount - 8} more</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Members Sidebar */}
        <div className="w-64 glass-card rounded-2xl p-5 overflow-y-auto animate-slide-in-left hidden xl:block">
          <h3 className="font-bold text-white mb-4 font-[family-name:var(--font-display)]">
            Thanh vien ({members.length})
          </h3>
          <div className="space-y-2">
            {members.map((member) => (
              <div
                key={member.id}
                className="user-item animate-fade-in-up"
              >
                <div className="avatar !w-8 !h-8 !text-xs">{member.name?.charAt(0).toUpperCase() || '?'}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{member.name}</p>
                  <p className="text-xs text-white/50 capitalize">{member.role}</p>
                </div>
                <span className="status-dot status-connected" />
              </div>
            ))}
          </div>
        </div>
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
        <h2 className="text-xl font-bold text-white mb-5 font-[family-name:var(--font-display)]">Them nhac</h2>
        
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setMode('link')}
            className={`flex-1 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              mode === 'link' ? 'bg-pink-500 text-white' : 'bg-white/10 text-white/60'
            }`}
          >
            Tu Link
          </button>
          <button
            onClick={() => setMode('upload')}
            className={`flex-1 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              mode === 'upload' ? 'bg-pink-500 text-white' : 'bg-white/10 text-white/60'
            }`}
          >
            Upload File
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-white/80 mb-1">Ten bai hat</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white placeholder-white/40"
              placeholder="VD: Summer Vibes"
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-white/80 mb-1">Nghe si (tuy chon)</label>
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
              <label className="block text-sm font-semibold text-white/80 mb-1">Link nhac</label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white placeholder-white/40"
                placeholder="https://example.com/music.mp3"
              />
              <p className="text-white/40 text-xs mt-1">Ho tro link MP3, WAV, OGG truc tiep</p>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-semibold text-white/80 mb-1">Chon file nhac</label>
              <label className="block w-full p-6 rounded-xl border-2 border-dashed border-white/20 hover:border-white/40 cursor-pointer transition-all text-center">
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <div className="text-3xl mb-2">{file ? 'File' : 'Select'}</div>
                <p className="text-white/60 text-sm">
                  {file ? file.name : 'Click de chon file nhac'}
                </p>
                <p className="text-white/40 text-xs mt-1">MP3, WAV, OGG, M4A</p>
              </label>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 rounded-full bg-white/10 text-white/80 hover:bg-white/20 transition-all">
            Huy
          </button>
          <button
            onClick={handleSubmit}
            disabled={mode === 'link' ? !url : !file}
            className="px-6 py-2 rounded-full bg-pink-500 text-white font-semibold hover:bg-pink-600 transition-all disabled:opacity-40"
          >
            Them
          </button>
        </div>
      </div>
    </div>
  );
}
