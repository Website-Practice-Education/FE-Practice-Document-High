import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { ChatMessage } from '../services/studySpaceService';
import type { StudySpace } from '../services/studySpaceService';
import { signalRService } from '../services/signalR';
import { studySpaceService, chatService } from '../services/studySpaceService';
import Loading from '../components/Loading';

export default function StudySpaceRoom() {
  const { id } = useParams<{ id: string }>();
  const [space, setSpace] = useState<StudySpace | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [typingUsers, setTypingUsers] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const token = localStorage.getItem('token');
  const currentUserId = () => {
    const payload = JSON.parse(atob(token!.split('.')[1]));
    return payload.nameidentifier;
  };

  useEffect(() => {
    loadSpace();
    loadMessages();
    connectToHub();
    return () => { signalRService.stop(); };
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const connectToHub = async () => {
    if (!token) return;
    setConnectionStatus('connecting');
    try {
      await signalRService.start(token);
      await signalRService.joinSpace(id!);
      signalRService.onMessage((msg) => setMessages(prev => [...prev, msg]));
      signalRService.onTyping((data) => {
        setTypingUsers(prev => [...prev, data.userId]);
        setTimeout(() => setTypingUsers(prev => prev.filter(uid => uid !== data.userId)), 2000);
      });
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

  const handleTyping = () => {
    signalRService.sendTyping(parseInt(id!));
  };

  const statusConfig = {
    connected: { label: 'Đã kết nối', dot: 'status-connected', badge: 'badge-success' },
    connecting: { label: 'Đang kết nối...', dot: 'status-connecting', badge: 'bg-amber-100 text-amber-700 px-2.5 py-0.5 rounded-full text-xs font-semibold' },
    disconnected: { label: 'Mất kết nối', dot: 'status-disconnected', badge: 'badge-danger' },
  };

  if (loading) return <Loading message="Đang vào phòng học..." />;

  if (!space) {
    return (
      <div className="text-center py-20 animate-fade-in-up">
        <div className="empty-symbol">!</div>
        <p className="text-lg font-semibold text-slate-700">Không tìm thấy phòng học</p>
        <Link to="/study-spaces" className="btn-primary mt-4 inline-flex">&lt; Quay lại</Link>
      </div>
    );
  }

  const status = statusConfig[connectionStatus];

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] animate-fade-in-up">
      <div className="glass-card rounded-2xl p-5 mb-4 animate-fade-in-down">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/study-spaces" className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-indigo-50 flex items-center justify-center text-slate-500 hover:text-indigo-600 transition-all text-sm font-bold">
              &lt;
            </Link>
            <div>
              <h1 className="text-xl font-bold text-slate-800 font-[family-name:var(--font-display)]">{space.name}</h1>
              <p className="text-sm text-slate-500">{space.description || 'Phòng học nhóm'}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500">{space.memberCount} thành viên</span>
            <span className={`flex items-center gap-2 ${status.badge}`}>
              <span className={`status-dot ${status.dot}`} />
              {status.label}
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-4 flex-1 overflow-hidden">
        <div className="flex-1 chat-container">
          <div className="flex-1 overflow-y-auto p-5 space-y-4" style={{ maxHeight: 'calc(100vh - 16rem)' }}>
            {messages.length === 0 ? (
              <div className="text-center py-16 animate-scale-in">
                <div className="empty-symbol">—</div>
                <p className="text-slate-500 font-medium">Chưa có tin nhắn nào</p>
                <p className="text-sm text-slate-400 mt-1">Hãy bắt đầu cuộc trò chuyện!</p>
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

          <form onSubmit={handleSendMessage} className="border-t border-slate-100 p-4 bg-white/50">
            <div className="flex gap-3">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleTyping}
                placeholder="Nhập tin nhắn..."
                className="input-field flex-1 !rounded-full"
              />
              <button type="submit" disabled={!newMessage.trim()} className="btn-primary !rounded-full !px-6 disabled:opacity-40 disabled:transform-none disabled:shadow-none">
                Gửi
              </button>
            </div>
          </form>
        </div>

        <div className="w-72 glass-card rounded-2xl p-5 overflow-y-auto animate-slide-in-left hidden lg:block">
          <h3 className="font-bold text-slate-800 mb-4 font-[family-name:var(--font-display)]">
            Thành viên ({space.members?.length || 0})
          </h3>
          <div className="space-y-2">
            {space.members?.map((member, index) => (
              <div
                key={member.id}
                className="user-item animate-fade-in-up"
                style={{ animationDelay: `${index * 60}ms`, animationFillMode: 'forwards', opacity: 0 }}
              >
                <div className="avatar !w-8 !h-8 !text-xs">{member.name?.charAt(0).toUpperCase() || '?'}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{member.name}</p>
                  <p className="text-xs text-slate-500 capitalize">{member.role}</p>
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
