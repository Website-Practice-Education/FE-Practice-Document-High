// Notification Service
export interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'achievement' | 'streak' | 'friend' | 'system' | 'exam';
  isRead: boolean;
  createdAt: string;
}

class NotificationService {
  private readonly API_URL = 'http://localhost:5058/api';

  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };
  }

  async getNotifications(): Promise<Notification[]> {
    try {
      const response = await fetch(`${this.API_URL}/notifications`, {
        headers: this.getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to fetch notifications');
      const result = await response.json();
      const data = result.data || result;
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  async markAsRead(id: number): Promise<void> {
    try {
      await fetch(`${this.API_URL}/notifications/${id}/read`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  async markAllAsRead(): Promise<void> {
    try {
      await fetch(`${this.API_URL}/notifications/read-all`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }

  async deleteNotification(id: number): Promise<void> {
    try {
      await fetch(`${this.API_URL}/notifications/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }

  async getUnreadCount(): Promise<number> {
    try {
      const response = await fetch(`${this.API_URL}/notifications/unread-count`, {
        headers: this.getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to fetch unread count');
      const result = await response.json();
      return result.data || result.count || 0;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }
  }
}

export default new NotificationService();
