import { HubConnection, HubConnectionBuilder, HubConnectionState } from '@microsoft/signalr';

const HUB_URL = (
  import.meta.env.VITE_SIGNALR_HUB_URL ||
  import.meta.env.VITE_SIGNALR_HUB_URL_SECURE ||
  'http://localhost:5058/hubs/chat'
).replace(/\/+$/, '');

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
  private connectionPromise: Promise<void> | null = null;
  private currentToken: string | null = null;

  async start(token: string): Promise<void> {
    // If already connected with the same token, return immediately
    if (this.connection?.state === HubConnectionState.Connected && this.currentToken === token) {
      return;
    }

    // If a connection attempt is already in progress, wait for it
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    // Stop any existing connection before starting a new one
    if (this.connection) {
      try {
        await this.connection.stop();
      } catch (e) {
        // Ignore errors when stopping
      }
      this.connection = null;
    }

    this.currentToken = token;
    this.connectionPromise = this.doStart(token);

    try {
      await this.connectionPromise;
    } finally {
      this.connectionPromise = null;
    }
  }

  private async doStart(token: string): Promise<void> {
    this.connection = new HubConnectionBuilder()
      .withUrl(HUB_URL, { accessTokenFactory: () => token })
      .withAutomaticReconnect([0, 1000, 5000, 10000, 30000]) // Retry with increasing delays
      .configureLogging('warn') // Reduce log verbosity
      .build();

    this.connection.on('ReceiveMessage', (message: ChatMessage) => {
      this.messageCallbacks.forEach(cb => cb(message));
    });

    this.connection.on('UserTyping', (data: { userId: number; spaceId: number }) => {
      this.typingCallbacks.forEach(cb => cb(data));
    });

    try {
      await this.connection.start();
    } catch (error) {
      // Reset connection state on failure
      this.connection = null;
      this.currentToken = null;
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (this.connection) {
      try {
        await this.connection.stop();
      } catch (e) {
        // Ignore errors when stopping
      }
      this.connection = null;
      this.currentToken = null;
    }
    this.connectionPromise = null;
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
