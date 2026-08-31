import { useState, useEffect, useRef } from 'react';

interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Backend API URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5058';

export default function AIChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Xin chào! Tôi là trợ lý AI của bạn. Tôi có thể giúp bạn trả lời các câu hỏi về tài liệu học tập, giải đáp thắc mắc, hoặc hỗ trợ bạn trong việc học tập. Bạn cần tôi giúp gì hôm nay?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      inputRef.current?.focus();
    }
  }, [messages, isOpen]);

  // Call Backend AI API
  const callAIAPI = async (userInput: string, history: { role: string; text: string }[]): Promise<string> => {
    const response = await fetch(`${API_BASE_URL}/api/gemini/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: history
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API Error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.success && data.data) {
      return data.data;
    }
    
    throw new Error(data.message || 'Invalid response from API');
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: AIMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Build conversation history for API
      const history = messages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        text: msg.content
      }));
      history.push({ role: 'user', text: input.trim() });

      const response = await callAIAPI(input.trim(), history);
      const aiMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Xin lỗi, tôi đang gặp sự cố: ${error instanceof Error ? error.message : 'Unknown error'}. Vui lòng kiểm tra Gemini API Key hoặc thử lại sau.`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleChat = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Floating AI Button */}
      <button
        onClick={toggleChat}
        className="fixed bottom-6 left-6 z-50 group"
        title="Chat AI"
      >
        {/* AI Icon */}
        <div
          className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-2xl transition-all duration-300 group-hover:scale-110 ${
            isOpen
              ? 'bg-red-500 rotate-90'
              : 'bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500'
          }`}
        >
          {isOpen ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 8V4H8" />
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
              <path d="M8 8h8" />
              <path d="M8 12h8" />
              <path d="M12 16h.01" />
            </svg>
          )}
        </div>

        {/* Pulse ring */}
        {!isOpen && (
          <span className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 animate-ping opacity-20" />
        )}

        {/* AI Label */}
        {!isOpen && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full mr-3 px-3 py-1.5 bg-white rounded-lg shadow-lg text-sm font-medium text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Chat AI
          </div>
        )}
      </button>

      {/* AI Chat Window */}
      {isOpen && (
        <div className="fixed bottom-20 left-6 z-50 w-80 sm:w-96 animate-slide-in-up">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200/50">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-500 to-teal-600">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 8V4H8" />
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <path d="M8 8h8" />
                    <path d="M8 12h8" />
                    <path d="M12 16h.01" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-bold">AI Assistant</h3>
                  <p className="text-white/70 text-xs flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    Online
                  </p>
                </div>
              </div>
              <button
                onClick={toggleChat}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Messages Area */}
            <div
              className="bg-slate-50 overflow-y-auto"
              style={{ height: '350px' }}
            >
              <div className="p-4 space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs flex-shrink-0 mr-2">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 8V4H8" />
                          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                        </svg>
                      </div>
                    )}
                    <div
                      className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-br-md'
                          : 'bg-white text-slate-700 rounded-bl-md shadow-sm border border-slate-100'
                      }`}
                      style={{ whiteSpace: 'pre-wrap' }}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}

                {/* Loading indicator */}
                {isLoading && (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs flex-shrink-0 mr-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 8V4H8" />
                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                      </svg>
                    </div>
                    <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-md shadow-sm border border-slate-100">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" />
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0.15s' }} />
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0.3s' }} />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-100">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Hỏi AI..."
                  disabled={isLoading}
                  className="flex-1 px-4 py-2.5 rounded-full bg-slate-100 border-0 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="w-11 h-11 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </div>
            </form>

            {/* Quick Actions */}
            <div className="px-3 pb-3 bg-white">
              <div className="flex flex-wrap gap-1.5">
                {['Hướng dẫn', 'Tài liệu', 'Bài tập'].map((action) => (
                  <button
                    key={action}
                    onClick={() => setInput(action)}
                    className="px-3 py-1 text-xs bg-slate-100 hover:bg-emerald-100 text-slate-600 hover:text-emerald-700 rounded-full transition-colors"
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
