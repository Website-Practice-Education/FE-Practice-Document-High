import { useState, useEffect } from 'react';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'achievement' | 'streak' | 'friend' | 'system' | 'exam';
  isRead: boolean;
  createdAt: string;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    // Mock data
    setTimeout(() => {
      setNotifications([
        {
          id: 1,
          title: '🎉 Chuc mung!',
          message: 'Ban da khoai pha thanh tich "Nguoi hoc tot" - 100 cau hoi',
          type: 'achievement',
          isRead: false,
          createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        },
        {
          id: 2,
          title: '🔥 Streak moi!',
          message: 'Ban da dat duoc 5 ngay lien tiep! Tiep tuc hoc nhe.',
          type: 'streak',
          isRead: false,
          createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        },
        {
          id: 3,
          title: '👋 Loi moi ket ban',
          message: 'Nguyen Van A muon ket ban voi ban',
          type: 'friend',
          isRead: true,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        },
        {
          id: 4,
          title: '📝 Bai thi sap dien ra',
          message: 'Bai thi giua ky mon Toan se dien ra vao ngay mai',
          type: 'exam',
          isRead: true,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
        },
        {
          id: 5,
          title: '⭐ Tang cap!',
          message: 'Ban da len Level 15! Tiep tuc phat huy nhe.',
          type: 'achievement',
          isRead: true,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        },
      ]);
      setLoading(false);
    }, 500);
  };

  const markAsRead = (id: number) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, isRead: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };

  const deleteNotification = (id: number) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const filteredNotifications = notifications.filter(n => 
    filter === 'all' || !n.isRead
  );

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'achievement': return '🏆';
      case 'streak': return '🔥';
      case 'friend': return '👥';
      case 'exam': return '📝';
      default: return '🔔';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'achievement': return 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30';
      case 'streak': return 'from-orange-500/20 to-red-500/20 border-orange-500/30';
      case 'friend': return 'from-blue-500/20 to-cyan-500/20 border-blue-500/30';
      case 'exam': return 'from-green-500/20 to-emerald-500/20 border-green-500/30';
      default: return 'from-slate-500/20 to-slate-600/20 border-slate-500/30';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Vua xong';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} phut truoc`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} gio truoc`;
    return `${Math.floor(diff / 86400000)} ngay truoc`;
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8 animate-fade-in-down">
        <div>
          <h1 className="page-title">Thong bao</h1>
          <p className="page-subtitle">
            {unreadCount > 0 ? `Ban co ${unreadCount} thong bao chua doc` : 'Tat ca da doc'}
          </p>
        </div>
        <div className="flex gap-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-4 py-2 rounded-xl text-sm"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#e2e8f0',
            }}
          >
            <option value="all">Tat ca</option>
            <option value="unread">Chua doc</option>
          </select>
          {unreadCount > 0 && (
            <button onClick={markAllAsRead} className="btn-secondary">
              Danh dau da doc
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {filteredNotifications.map((notification, index) => (
          <div
            key={notification.id}
            className={`relative p-5 rounded-2xl animate-fade-in-up transition-all duration-300 ${
              notification.isRead ? 'opacity-70' : ''
            }`}
            style={{
              animationDelay: `${index * 50}ms`,
              background: 'linear-gradient(145deg, #1a1a2e, #16213e)',
              border: `1px solid ${notification.isRead ? 'rgba(255, 255, 255, 0.05)' : 'rgba(99, 102, 241, 0.3)'}`,
              boxShadow: notification.isRead 
                ? '0 4px 16px rgba(0, 0, 0, 0.2)' 
                : '0 8px 32px rgba(99, 102, 241, 0.15)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateX(8px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateX(0)';
            }}
          >
            {/* Unread indicator */}
            {!notification.isRead && (
              <div 
                className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
                style={{ background: 'linear-gradient(to bottom, #6366f1, #a855f7)' }}
              />
            )}

            <div className="flex items-start gap-4">
              {/* Icon */}
              <div 
                className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                  notification.isRead ? 'opacity-60' : ''
                }`}
                style={{
                  background: `linear-gradient(135deg, ${notification.type === 'achievement' ? 'rgba(245, 158, 11, 0.2)' : notification.type === 'streak' ? 'rgba(249, 115, 22, 0.2)' : notification.type === 'friend' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(99, 102, 241, 0.2)'}, ${notification.type === 'achievement' ? 'rgba(245, 158, 11, 0.1)' : notification.type === 'streak' ? 'rgba(249, 115, 22, 0.1)' : notification.type === 'friend' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(99, 102, 241, 0.1)'})`,
                }}
              >
                {getTypeIcon(notification.type)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-bold text-white">{notification.title}</h4>
                  <span className="text-xs text-slate-500">{formatTime(notification.createdAt)}</span>
                </div>
                <p className="text-sm text-slate-400">{notification.message}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {!notification.isRead && (
                  <button
                    onClick={() => markAsRead(notification.id)}
                    className="p-2 rounded-lg text-slate-400 hover:text-white transition-colors"
                    style={{ background: 'rgba(255, 255, 255, 0.05)' }}
                    title="Danh dau da doc"
                  >
                    ✓
                  </button>
                )}
                <button
                  onClick={() => deleteNotification(notification.id)}
                  className="p-2 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                  style={{ background: 'rgba(255, 255, 255, 0.05)' }}
                  title="Xoa thong bao"
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredNotifications.length === 0 && !loading && (
        <div className="text-center py-20 rounded-3xl" 
          style={{ 
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          <div className="text-6xl mb-4">🔔</div>
          <p className="text-lg text-slate-400 mb-2">
            {filter === 'unread' ? 'Khong co thong bao nao chua doc' : 'Chua co thong bao nao'}
          </p>
          <p className="text-sm text-slate-500">Thong bao se xuat hien tai day</p>
        </div>
      )}
    </div>
  );
}
