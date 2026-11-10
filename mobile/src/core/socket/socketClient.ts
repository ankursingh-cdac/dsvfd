import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BACKEND_HOST } from '../network/api';

export const SOCKET_URL = `http://${BACKEND_HOST}:4000`;

class SocketService {
  private socket: Socket | null = null;

  public async connect(): Promise<Socket> {
    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    const token = await AsyncStorage.getItem('pawdoku_token');

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('🐾 Socket connected to Pawdoku server:', this.socket?.id);
    });

    this.socket.on('connect_error', (err) => {
      console.warn('⚠️ Socket connection error:', err.message);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🐾 Socket disconnected:', reason);
    });

    return this.socket;
  }

  public getSocket(): Socket | null {
    return this.socket;
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = new SocketService();
