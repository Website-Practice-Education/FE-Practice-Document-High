import { HubConnection, HubConnectionBuilder, HubConnectionState } from '@microsoft/signalr';

const HUB_URL = 'https://localhost:5001/hubs/chat';

export interface ChatMessage {
  id: number;
  spaceId: number;
  userId: number;
  userName?: string;
  userAvatar?: string;
  content: string;
  messageType: string;
  createdAt: string;
}

class SignalRService {
  private connection: HubConnection | null = null;
  private messageCallbacks: ((message: ChatMessage) => void)[] = [];
  private typingCallbacks: ((data: { userId: number; spaceId: number }) => void)[] = [];

  async start(token: string): Promise<void> {
    if (this.connection?.state === HubConnectionState.Connected) return;

    this.connection = new HubConnectionBuilder()
      .withUrl(HUB_URL, { accessTokenFactory: () => token })
      .withAutomaticReconnect()
      .build();

    this.connection.on('ReceiveMessage', (message: ChatMessage) => {
      this.messageCallbacks.forEach(cb => cb(message));
    });

    this.connection.on('UserTyping', (data: { userId: number; spaceId: number }) => {
      this.typingCallbacks.forEach(cb => cb(data));
    });

    await this.connection.start();
  }

  async stop(): Promise<void> {
    if (this.connection) {
      await this.connection.stop();
      this.connection = null;
    }
  }

  async joinSpace(spaceId: string): Promise<void> {
    if (this.connection?.state === HubConnectionState.Connected) {
      await this.connection.invoke('JoinSpace', spaceId);
    }
  }

  async leaveSpace(spaceId: string): Promise<void> {
    if (this.connection?.state === HubConnectionState.Connected) {
      await this.connection.invoke('LeaveSpace', spaceId);
    }
  }

  async sendMessage(spaceId: number, content: string): Promise<void> {
    if (this.connection?.state === HubConnectionState.Connected) {
      await this.connection.invoke('SendMessage', spaceId, content);
    }
  }

  async sendTyping(spaceId: number): Promise<void> {
    if (this.connection?.state === HubConnectionState.Connected) {
      await this.connection.invoke('SendTypingIndicator', spaceId);
    }
  }

  onMessage(callback: (message: ChatMessage) => void): () => void {
    this.messageCallbacks.push(callback);
    return () => {
      this.messageCallbacks = this.messageCallbacks.filter(cb => cb !== callback);
    };
  }

  onTyping(callback: (data: { userId: number; spaceId: number }) => void): () => void {
    this.typingCallbacks.push(callback);
    return () => {
      this.typingCallbacks = this.typingCallbacks.filter(cb => cb !== callback);
    };
  }
}

export const signalRService = new SignalRService();
