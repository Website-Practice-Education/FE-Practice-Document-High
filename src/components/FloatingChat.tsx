import { useState, useEffect, useRef } from 'react';
import { signalRService } from '../services/signalR';
import type { ChatMessage } from '../services/signalR';

const GLOBAL_SPACE_ID = 0;

export default function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [typingUsers, setTypingUsers] = useState<number[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
    if (!isOpen) return;
    loadMessages();
    connectToHub();
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setUnreadCount(0);
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Listen for new messages even when chat is closed
  useEffect(() => {
    if (!token) return;
    let initialized = false;

    const initListener = async () => {
      if (initialized) return;
      try {
        await signalRService.start(token);
        signalRService.onMessage((msg: ChatMessage) => {
          if (msg.spaceId === GLOBAL_SPACE_ID && !isOpen) {
            setUnreadCount(prev => prev + 1);
          }
        });
        initialized = true;
      } catch (error) {
        console.error('Failed to init floating chat listener:', error);
      }
    };

    if (!signalRService['connection'] || signalRService['connection']['state'] !== 'Connected') {
      initListener();
    } else {
      initialized = true;
    }

    return () => {};
  }, [isOpen]);

  const connectToHub = async () => {
    if (!token) return;
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
          setTypingUsers(prev => {
            if (!prev.includes(data.userId)) {
              return [...prev, data.userId];
            }
            return prev;
          });
          setTimeout(() => setTypingUsers(prev => prev.filter(uid => uid !== data.userId)), 2000);
        }
      });
      setConnectionStatus('connected');
    } catch (error) {
      console.error('Failed to connect to chat:', error);
      setConnectionStatus('disconnected');
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
        return;
      }
      const data = await response.json();
      const msgs: ChatMessage[] = data?.data || [];
      setMessages(msgs);
    } catch (error) {
      console.error('Failed to load messages:', error);
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
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setIsMinimized(false);
    }
  };

  const closeChat = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  return (
    <>
      {/* Floating Bubble */}
      <button
        onClick={toggleChat}
        className="fixed bottom-6 right-6 z-50 group"
        title="Chat tổng"
      >
        {/* Unread badge */}
        {unreadCount > 0 && !isOpen && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg animate-bounce-subtle">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}

        {/* Chat icon */}
        <div
          className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-2xl transition-all duration-300 group-hover:scale-110 ${
            isOpen
              ? 'bg-red-500 rotate-90'
              : 'bg-gradient-to-br from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500'
          }`}
        >
          {isOpen ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          )}
        </div>

        {/* Pulse ring */}
        {!isOpen && (
          <span className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 animate-ping opacity-20" />
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-20 right-6 z-50 w-80 sm:w-96 animate-slide-in-up">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200/50">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-600 to-purple-600">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-bold">Chat tổng</h3>
                  <p className="text-white/70 text-xs">
                    {connectionStatus === 'connected'
                      ? 'Đã kết nối'
                      : connectionStatus === 'connecting'
                      ? 'Đang kết nối...'
                      : 'Chưa kết nối'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Minimize button */}
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
                  title={isMinimized ? 'Phóng to' : 'Thu nhỏ'}
                >
                  {isMinimized ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="15 3 21 3 21 9" />
                      <polyline points="9 21 3 21 3 15" />
                      <line x1="21" y1="3" x2="14" y2="10" />
                      <line x1="3" y1="21" x2="10" y2="14" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="4 14 10 14 10 20" />
                      <polyline points="20 10 14 10 14 4" />
                      <line x1="14" y1="10" x2="21" y2="3" />
                      <line x1="3" y1="21" x2="10" y2="14" />
                    </svg>
                  )}
                </button>
                {/* Close button */}
                <button
                  onClick={closeChat}
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Chat content */}
            {!isMinimized && (
              <>
                {/* Messages area */}
                <div
                  className="bg-slate-50 overflow-y-auto"
                  style={{ height: '320px' }}
                >
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 py-8">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3 opacity-50">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                      <p className="text-sm font-medium">Chưa có tin nhắn</p>
                      <p className="text-xs mt-1">Hãy bắt đầu cuộc trò chuyện!</p>
                    </div>
                  ) : (
                    <div className="p-3 space-y-2">
                      {(Array.isArray(messages) ? messages : []).map((msg) => {
                        const isMine = msg.userId === currentUserId();
                        return (
                          <div
                            key={msg.id}
                            className={`flex gap-2 ${isMine ? 'flex-row-reverse' : ''}`}
                          >
                            {/* Avatar */}
                            {!isMine && (
                              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                {msg.userName?.charAt(0).toUpperCase() || '?'}
                              </div>
                            )}
                            <div className={`max-w-[75%] ${isMine ? 'text-right' : ''}`}>
                              {/* User name & time */}
                              {!isMine && (
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="text-xs font-semibold text-slate-700">{msg.userName}</span>
                                  <span className="text-[10px] text-slate-400">
                                    {new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                              )}
                              {/* Message bubble */}
                              <div
                                className={`inline-block px-3 py-1.5 rounded-2xl text-sm ${
                                  isMine
                                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-md'
                                    : 'bg-white text-slate-700 rounded-bl-md shadow-sm border border-slate-100'
                                }`}
                              >
                                {msg.content}
                              </div>
                              {/* My time */}
                              {isMine && (
                                <div className="text-[10px] text-slate-400 mt-0.5">
                                  {new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {/* Typing indicator */}
                      {typingUsers.length > 0 && (
                        <div className="flex items-center gap-2 text-xs text-slate-400 italic">
                          <span className="flex gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0.2s' }} />
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0.4s' }} />
                          </span>
                          Ai đó đang nhập...
                        </div>
                      )}

                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                {/* Input area */}
                <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-100">
                  <div className="flex gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={newMessage}
                      onChange={(e) => {
                        setNewMessage(e.target.value);
                        handleTyping();
                      }}
                      placeholder="Nhập tin nhắn..."
                      className="flex-1 px-4 py-2 rounded-full bg-slate-100 border-0 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim() || connectionStatus !== 'connected'}
                      className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13" />
                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                      </svg>
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* Minimized view - just show title */}
            {isMinimized && (
              <div className="bg-slate-50 px-4 py-3">
                <p className="text-sm text-slate-500 text-center">Chat tổng - Thu nhỏ</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
