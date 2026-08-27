import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
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

      signalRService.onTyping((data) => {
        setTypingUsers(prev => [...prev, data.userId]);
        setTimeout(() => {
          setTypingUsers(prev => prev.filter(uid => uid !== data.userId));
        }, 2000);
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

  if (loading) return <Loading />;

  if (!space) return <div className="p-6">Space not found</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-3rem)]">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">{space.name}</h1>
            <p className="text-sm text-gray-500">{space.description || 'No description'}</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              {space.memberCount} members
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              connectionStatus === 'connected' ? 'bg-green-100 text-green-700' :
              connectionStatus === 'connecting' ? 'bg-yellow-100 text-yellow-700' :
              'bg-red-100 text-red-700'
            }`}>
              {connectionStatus === 'connected' ? 'Connected' :
               connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>

      {/* Members sidebar */}
      <div className="flex gap-4 flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No messages yet. Start the conversation!
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.userId === parseInt(currentUserId()) ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
                    msg.userId === parseInt(currentUserId()) ? 'bg-blue-500' : 'bg-gray-400'
                  }`}>
                    {msg.userName?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div className={`max-w-[70%] ${msg.userId === parseInt(currentUserId()) ? 'text-right' : ''}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-700">{msg.userName}</span>
                      <span className="text-xs text-gray-400">
                        {new Date(msg.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className={`inline-block px-4 py-2 rounded-lg ${
                      msg.userId === parseInt(currentUserId())
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))
            )}
            {typingUsers.length > 0 && (
              <div className="text-sm text-gray-500 italic">
                Someone is typing...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message input */}
          <form onSubmit={handleSendMessage} className="border-t p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleTyping}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Send
              </button>
            </div>
          </form>
        </div>

        {/* Members list */}
        <div className="w-64 bg-white rounded-lg shadow-sm p-4 overflow-y-auto">
          <h3 className="font-semibold text-gray-700 mb-4">Members</h3>
          <div className="space-y-3">
            {space.members?.map((member) => (
              <div key={member.id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm font-medium">
                  {member.name?.charAt(0).toUpperCase() || '?'}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700">{member.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{member.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
