import { useState, useEffect } from 'react';

interface LiveSession {
  id: number;
  title: string;
  description: string;
  sessionType: 'practice' | 'quiz' | 'competition';
  subjectName: string;
  difficulty: number;
  currentParticipants: number;
  maxParticipants: number;
  status: 'waiting' | 'live' | 'ended';
  hostName: string;
  inviteCode: string;
}

export default function LiveSessions() {
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setLoading(true);
    // Mock data - in real app this would come from API
    setTimeout(() => {
      setSessions([
        {
          id: 1,
          title: 'Toan hoc - Bat dang thuc',
          description: 'On tap va luyen tap bat dang thuc',
          sessionType: 'practice',
          subjectName: 'Toan',
          difficulty: 3,
          currentParticipants: 12,
          maxParticipants: 20,
          status: 'live',
          hostName: 'Giao vien A',
          inviteCode: 'ABC123',
        },
        {
          id: 2,
          title: 'Tieng Anh - Grammar',
          description: 'Luyen tap ngu phap co ban',
          sessionType: 'quiz',
          subjectName: 'Anh Van',
          difficulty: 2,
          currentParticipants: 8,
          maxParticipants: 15,
          status: 'waiting',
          hostName: 'Giao vien B',
          inviteCode: 'DEF456',
        },
        {
          id: 3,
          title: 'Vat ly - Dao dong',
          description: 'Thi dau kien thuc dao dong',
          sessionType: 'competition',
          subjectName: 'Vat Ly',
          difficulty: 4,
          currentParticipants: 18,
          maxParticipants: 25,
          status: 'live',
          hostName: 'Giao vien C',
          inviteCode: 'GHI789',
        },
      ]);
      setLoading(false);
    }, 500);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live':
        return {
          bg: 'bg-red-500/20',
          text: 'text-red-400',
          border: 'border-red-500/30',
          label: 'Dang dien ra',
          dot: 'bg-red-500 animate-pulse',
        };
      case 'waiting':
        return {
          bg: 'bg-yellow-500/20',
          text: 'text-yellow-400',
          border: 'border-yellow-500/30',
          label: 'Dang cho',
          dot: 'bg-yellow-500 animate-pulse',
        };
      default:
        return {
          bg: 'bg-slate-500/20',
          text: 'text-slate-400',
          border: 'border-slate-500/30',
          label: 'Da ket thuc',
          dot: 'bg-slate-500',
        };
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'practice': return '📖';
      case 'quiz': return '❓';
      case 'competition': return '🏆';
      default: return '📚';
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8 animate-fade-in-down">
        <div>
          <h1 className="page-title">Phong hoc truc tuyen</h1>
          <p className="page-subtitle\">Tham gia hoc tap cung ban be theo thoi gian thuc</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary"
        >
          + Tao phong moi
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <div 
          className="p-5 rounded-2xl animate-fade-in-up"
          style={{
            background: 'linear-gradient(145deg, rgba(239, 68, 68, 0.15), rgba(220, 38, 38, 0.1))',
            border: '1px solid rgba(239, 68, 68, 0.25)',
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-red-500/20">
              🔴
            </div>
            <div>
              <p className="text-3xl font-bold text-white">{sessions.filter(s => s.status === 'live').length}</p>
              <p className="text-sm text-slate-400">Dang dien ra</p>
            </div>
          </div>
        </div>

        <div 
          className="p-5 rounded-2xl animate-fade-in-up"
          style={{
            background: 'linear-gradient(145deg, rgba(34, 211, 238, 0.15), rgba(6, 182, 212, 0.1))',
            border: '1px solid rgba(34, 211, 238, 0.25)',
            animationDelay: '100ms',
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-cyan-500/20">
              👥
            </div>
            <div>
              <p className="text-3xl font-bold text-white">
                {sessions.reduce((sum, s) => sum + s.currentParticipants, 0)}
              </p>
              <p className="text-sm text-slate-400">Nguoi tham gia</p>
            </div>
          </div>
        </div>

        <div 
          className="p-5 rounded-2xl animate-fade-in-up"
          style={{
            background: 'linear-gradient(145deg, rgba(99, 102, 241, 0.15), rgba(79, 70, 229, 0.1))',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            animationDelay: '200ms',
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-indigo-500/20">
              📚
            </div>
            <div>
              <p className="text-3xl font-bold text-white">{sessions.length}</p>
              <p className="text-sm text-slate-400">Tong phong</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sessions List */}
      <div className="space-y-4">
        {sessions.map((session, index) => {
          const status = getStatusColor(session.status);
          const progress = (session.currentParticipants / session.maxParticipants) * 100;

          return (
            <div
              key={session.id}
              className="p-6 rounded-2xl animate-fade-in-up cursor-pointer transition-all duration-300"
              style={{
                animationDelay: `${index * 100}ms`,
                background: 'linear-gradient(145deg, #1a1a2e, #16213e)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
                e.currentTarget.style.boxShadow = '0 16px 40px rgba(99, 102, 241, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)';
              }}
            >
              <div className="flex items-start gap-5">
                {/* Type Icon */}
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                  }}
                >
                  {getTypeIcon(session.sessionType)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-white">{session.title}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${status.bg} ${status.text} ${status.border}`}>
                      <span className={`inline-block w-2 h-2 rounded-full mr-2 ${status.dot}`} />
                      {status.label}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 mb-3">{session.description}</p>
                  
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span>{session.subjectName}</span>
                    <span>•</span>
                    <span>Do kho: {'⭐'.repeat(session.difficulty)}</span>
                    <span>•</span>
                    <span>Chu phong: {session.hostName}</span>
                  </div>
                </div>

                {/* Participants & Join */}
                <div className="text-right">
                  <div className="mb-3">
                    <p className="text-2xl font-bold text-white">{session.currentParticipants}</p>
                    <p className="text-sm text-slate-400">/ {session.maxParticipants}</p>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="w-24 h-1.5 rounded-full overflow-hidden mb-3" 
                    style={{ background: 'rgba(255, 255, 255, 0.1)' }}
                  >
                    <div 
                      className="h-full rounded-full transition-all"
                      style={{ 
                        width: `${progress}%`,
                        background: session.status === 'live' 
                          ? 'linear-gradient(90deg, #ef4444, #f87171)'
                          : 'linear-gradient(90deg, #6366f1, #a855f7)',
                      }}
                    />
                  </div>

                  <button 
                    className="px-5 py-2 rounded-xl font-semibold text-sm text-white transition-all"
                    style={{
                      background: session.status === 'live' 
                        ? 'linear-gradient(135deg, #ef4444, #f87171)'
                        : 'linear-gradient(135deg, #6366f1, #a855f7)',
                      boxShadow: session.status === 'live' 
                        ? '0 4px 16px rgba(239, 68, 68, 0.4)'
                        : '0 4px 16px rgba(99, 102, 241, 0.4)',
                    }}
                  >
                    {session.status === 'live' ? 'Tham gia ngay' : 'Vao cho'}
                  </button>
                </div>
              </div>

              {/* Invite Code */}
              <div className="mt-4 pt-4 flex items-center gap-3" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <span className="text-sm text-slate-500">Ma moi:</span>
                <code 
                  className="px-3 py-1 rounded-lg text-sm font-mono font-bold text-indigo-400"
                  style={{ background: 'rgba(99, 102, 241, 0.15)' }}
                >
                  {session.inviteCode}
                </code>
                <button className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
                  Sao chep
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {sessions.length === 0 && !loading && (
        <div className="text-center py-20 rounded-3xl" 
          style={{ 
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          <div className="text-6xl mb-4">📚</div>
          <p className="text-lg text-slate-400 mb-2">Chua co phong hoc nao</p>
          <p className="text-sm text-slate-500">Tao phong hoc dau tien cua ban</p>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
          <div 
            className="rounded-2xl p-6 w-full max-w-lg animate-scale-in"
            style={{
              background: 'linear-gradient(145deg, #1a1a2e, #16213e)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 32px 64px rgba(0, 0, 0, 0.5)',
            }}
          >
            <h2 className="text-xl font-bold text-white mb-5 font-[family-name:var(--font-display)]">Tao phong hoc moi</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1.5">Ten phong</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="VD: On thi giua ky Toan"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1.5">Mo ta</label>
                <textarea
                  className="input-field resize-none"
                  placeholder="Mo ta phong hoc..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-1.5">Loai phong</label>
                  <select className="input-field">
                    <option value="practice">Luyen tap</option>
                    <option value="quiz">Thi trac nghiem</option>
                    <option value="competition">Thi dau</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-1.5">Do kho</label>
                  <select className="input-field">
                    <option value="1">De</option>
                    <option value="2">Trung binh</option>
                    <option value="3">Kho</option>
                    <option value="4">Rat kho</option>
                    <option value="5">Chuyen gia</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowCreateModal(false)} className="btn-secondary">Huy</button>
              <button className="btn-primary">Tao phong</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
