import { useState, useEffect, useRef } from 'react';
import { signalRService } from '../services/signalR';
import type { ChatMessage } from '../services/signalR';
import Loading from '../components/Loading';

// Global chat uses spaceId = 0
const GLOBAL_SPACE_ID = 0;

export default function GlobalChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [typingUsers, setTypingUsers] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const token = localStorage.getItem('token');

  const currentUserId = (): number | null => {
    try {
      if (!token) return null;
      const payload = JSON.parse(atob(token.split('.')[1]));
      return parseInt(payload.nameidentifier);
    } catch {
      return null;
    }
  };

  useEffect(() => {
    loadMessages();
    connectToHub();
    return () => {
      signalRService.stop();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const connectToHub = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setConnectionStatus('connecting');
    try {
      await signalRService.start(token);
      await signalRService.joinSpace(GLOBAL_SPACE_ID.toString());
      signalRService.onMessage((msg: ChatMessage) => {
        if (msg.spaceId === GLOBAL_SPACE_ID) {
          setMessages(prev => [...prev, msg]);
        }
      });
      signalRService.onTyping((data: { userId: number; spaceId: number }) => {
        if (data.spaceId === GLOBAL_SPACE_ID) {
          setTypingUsers(prev => [...prev, data.userId]);
          setTimeout(() => setTypingUsers(prev => prev.filter(uid => uid !== data.userId)), 2000);
        }
      });
      setConnectionStatus('connected');
    } catch (error) {
      console.error('Failed to connect to chat:', error);
      setConnectionStatus('disconnected');
    } finally {
      setLoading(false);
    }
  };

  const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '';

  const loadMessages = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/chat/${GLOBAL_SPACE_ID}/messages?pageSize=50`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        if (response.status === 401) {
          console.error('Unauthorized: Please login again');
        }
        setLoading(false);
        return;
      }
      const data = await response.json();
      // Handle various API response formats with defensive checks
      let msgs: ChatMessage[] = [];
      if (Array.isArray(data)) {
        msgs = data;
      } else if (data && typeof data === 'object') {
        if (Array.isArray(data.data)) {
          msgs = data.data;
        } else if (Array.isArray(data.messages)) {
          msgs = data.messages;
        } else if (Array.isArray(data.items)) {
          msgs = data.items;
        } else if (data.result) {
          msgs = Array.isArray(data.result) ? data.result : [];
        }
      }
      setMessages(msgs);
    } catch (error) {
      console.error('Failed to load messages:', error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    try {
      await signalRService.sendMessage(GLOBAL_SPACE_ID, newMessage);
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleTyping = () => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    signalRService.sendTyping(GLOBAL_SPACE_ID);
    typingTimeoutRef.current = setTimeout(() => {}, 0);
  };

  const statusConfig = {
    connected: { label: 'Đã kết nối', dot: 'status-connected', badge: 'badge-success' },
    connecting: { label: 'Đang kết nối...', dot: 'status-connecting', badge: 'bg-amber-100 text-amber-700 px-2.5 py-0.5 rounded-full text-xs font-semibold' },
    disconnected: { label: 'Chưa kết nối', dot: 'status-disconnected', badge: 'badge-danger' },
  };

  const status = statusConfig[connectionStatus];

  if (loading) return <Loading message="Đang kết nối chat..." />;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] animate-fade-in-up">
      {/* Header */}
      <div className="glass-card rounded-2xl p-5 mb-4 animate-fade-in-down">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-white"
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #a78bfa 100%)',
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 font-[family-name:var(--font-display)]">
                Chat tổng
              </h1>
              <p className="text-sm text-slate-500">Trò chuyện cùng mọi người</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`flex items-center gap-2 ${status.badge}`}>
              <span className={`status-dot ${status.dot}`} />
              {status.label}
            </span>
          </div>
        </div>
      </div>

      {/* Chat container */}
      <div className="flex-1 chat-container overflow-hidden">
        <div
          className="flex-1 overflow-y-auto p-5 space-y-4"
          style={{ maxHeight: 'calc(100vh - 16rem)' }}
        >
          {messages.length === 0 ? (
            <div className="text-center py-16 animate-scale-in">
              <div className="empty-symbol">—</div>
              <p className="text-lg font-semibold text-slate-700">Chưa có tin nhắn nào</p>
              <p className="text-sm text-slate-400 mt-1">Hãy bắt đầu cuộc trò chuyện!</p>
            </div>
          ) : (
            (Array.isArray(messages) ? messages : []).map((msg, index) => {
              const isMine = msg.userId === currentUserId();
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
                      <span className="text-sm font-semibold text-slate-700">{msg.userName}</span>
                      <span className="text-xs text-slate-400">
                        {new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className={isMine ? 'chat-bubble-mine' : 'chat-bubble-other'}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          {typingUsers.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-slate-400 italic animate-fade-in">
              <span className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce-subtle" />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce-subtle" style={{ animationDelay: '0.2s' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce-subtle" style={{ animationDelay: '0.4s' }} />
              </span>
              Ai đó đang nhập...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message input */}
        <form onSubmit={handleSendMessage} className="border-t border-slate-100 p-4 bg-white/50">
          <div className="flex gap-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              placeholder="Nhập tin nhắn..."
              className="input-field flex-1 !rounded-full"
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || connectionStatus !== 'connected'}
              className="btn-primary !rounded-full !px-6 disabled:opacity-40"
            >
              Gửi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
