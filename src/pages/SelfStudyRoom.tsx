import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import type { ChatMessage } from '../services/studySpaceService';
import type { StudySpace } from '../services/studySpaceService';
import { signalRService } from '../services/signalR';
import { studySpaceService, chatService } from '../services/studySpaceService';
import Loading from '../components/Loading';

export default function SelfStudyRoom() {
  const { id } = useParams<{ id: string }>();
  const [space, setSpace] = useState<StudySpace | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const token = localStorage.getItem('token');

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
    connectToHub();

    return () => {
      signalRService.stop();
    };
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

      signalRService.onMessage((msg) => {
        setMessages(prev => [...prev, msg]);
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

  if (loading) return <Loading />;

  if (!space) return <div className="p-6">Space not found</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-teal-500 rounded-xl shadow-lg p-6 mb-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <span>📖</span> {space.name}
            </h1>
            <p className="text-green-100 mt-1">{space.description || 'Self-study room - focus and learn!'}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-green-100">Current time</p>
              <p className="text-xl font-semibold">{new Date().toLocaleTimeString()}</p>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${
              connectionStatus === 'connected' ? 'bg-white text-green-600' :
              'bg-green-600 text-white'
            }`}>
              {connectionStatus === 'connected' ? '🟢 Live' : '⚪ Offline'}
            </span>
          </div>
        </div>
      </div>

      {/* Focus Timer */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Focus Mode</h2>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-4xl">🍅</span>
            <div>
              <p className="text-sm text-gray-500">Pomodoro Timer</p>
              <p className="text-lg font-semibold">25:00</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-4xl">📊</span>
            <div>
              <p className="text-sm text-gray-500">Today's XP</p>
              <p className="text-lg font-semibold">{Math.floor(Math.random() * 100) + 50} XP</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-4xl">⏱️</span>
            <div>
              <p className="text-sm text-gray-500">Study Time</p>
              <p className="text-lg font-semibold">{Math.floor(Math.random() * 3) + 1}h {Math.floor(Math.random() * 60)}m</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Section */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="bg-gray-50 px-6 py-3 border-b">
          <h3 className="font-semibold text-gray-700 flex items-center gap-2">
            <span>💬</span> Study Chat
          </h3>
        </div>
        
        {/* Messages */}
        <div className="h-80 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <p className="text-lg mb-2">🌱</p>
              <p>Start a conversation with other studiers!</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.userId === parseInt(currentUserId()) ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                  msg.userId === parseInt(currentUserId()) ? 'bg-green-500' : 'bg-gray-400'
                }`}>
                  {msg.userName?.charAt(0).toUpperCase() || '?'}
                </div>
                <div className={`max-w-[70%] ${msg.userId === parseInt(currentUserId()) ? 'text-right' : ''}`}>
                  <div className="text-xs text-gray-500 mb-1">
                    {msg.userName} • {new Date(msg.createdAt).toLocaleTimeString()}
                  </div>
                  <div className={`inline-block px-4 py-2 rounded-xl ${
                    msg.userId === parseInt(currentUserId())
                      ? 'bg-green-500 text-white rounded-br-none'
                      : 'bg-gray-100 text-gray-800 rounded-bl-none'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message input */}
        <form onSubmit={handleSendMessage} className="border-t p-4 bg-gray-50">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Share what you're learning..."
              className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="px-6 py-2 bg-green-500 text-white rounded-full hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Send
            </button>
          </div>
        </form>
      </div>

      {/* Members */}
      <div className="mt-6 bg-white rounded-xl shadow-sm p-6">
        <h3 className="font-semibold text-gray-700 mb-4">Studying Together ({space.memberCount})</h3>
        <div className="flex flex-wrap gap-3">
          {space.members?.map((member) => (
            <div key={member.id} className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-full">
              <div className="w-8 h-8 rounded-full bg-green-400 flex items-center justify-center text-white text-sm">
                {member.name?.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-gray-700">{member.name}</span>
              <span className="text-xs text-gray-400">🟢</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
