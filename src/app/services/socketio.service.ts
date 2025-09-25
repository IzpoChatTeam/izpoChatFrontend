// src/app/services/socketio.service.ts
import { Injectable } from '@angular/core';
import { Subject, BehaviorSubject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SocketIOService {
  private socket: Socket | null = null;
  // CAMBIO: Se usa apiUrl unificada
  private apiUrl = environment.apiUrl;

  private messagesSubject = new Subject<any>();
  private connectionStatusSubject = new BehaviorSubject<boolean>(false);
  // ... otros subjects

  public messages$ = this.messagesSubject.asObservable();
  public connectionStatus$ = this.connectionStatusSubject.asObservable();
  // ... otros observables

  constructor(private authService: AuthService) {}

  connect(roomId: number): void {
    const token = this.authService.getToken();

    if (!token) {
      console.error('❌ SocketIO Connect: No hay token de autenticación');
      return;
    }

    if (this.socket?.connected) {
      console.warn('Socket ya conectado. Desconectando para reconectar a nueva sala.');
      this.disconnect();
    }

    console.log(`🔌 Conectando a SocketIO en ${this.apiUrl} para la sala ${roomId}`);

    this.socket = io(this.apiUrl, { // CAMBIO: Se usa apiUrl
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      forceNew: true // Fuerza una nueva conexión, importante para cambiar de sala
    });

    this.setupEventListeners(roomId);
  }

  private setupEventListeners(roomId: number): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log(`✅ Conectado a SocketIO con ID: ${this.socket?.id}`);
      this.connectionStatusSubject.next(true);
      // Una vez conectado, unirse a la sala
      this.socket?.emit('join_room', { room_id: roomId });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Desconectado de SocketIO:', reason);
      this.connectionStatusSubject.next(false);
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Error de conexión SocketIO:', error.message);
      this.connectionStatusSubject.next(false);
    });

    // Evento que confirma que se unió a la sala
    this.socket.on('joined_room', (data) => {
      console.log('👍 Te has unido a la sala:', data);
    });

    this.socket.on('new_message', (data) => {
      console.log('📨 Nuevo mensaje recibido:', data);
      this.messagesSubject.next(data);
    });

    this.socket.on('error', (error) => {
      console.error('❌ Error general de SocketIO:', error);
    });
  }

  sendMessage(roomId: number, content: string): void {
    if (this.socket?.connected) {
      this.socket.emit('send_message', {
        room_id: roomId,
        content: content
      });
    } else {
      console.error('❌ No se puede enviar mensaje, socket no conectado.');
    }
  }

  disconnect(): void {
    if (this.socket) {
      console.log('🔌 Desconectando de SocketIO...');
      this.socket.disconnect();
      this.socket = null;
      this.connectionStatusSubject.next(false);
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}