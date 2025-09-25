import { Injectable } from '@angular/core';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { WebSocketMessage } from '../interfaces/message.interface';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SocketIOService {
  private socket: Socket | null = null;
  private wsUrl = environment.apiUrl || environment.apiUrl;
  
  // Subjects para diferentes tipos de mensajes
  private messagesSubject = new Subject<any>();
  private connectionStatusSubject = new BehaviorSubject<boolean>(false);
  private usersOnlineSubject = new Subject<any>();
  private typingSubject = new Subject<any>();
  private errorsSubject = new Subject<any>();

  // Observables públicos
  public messages$ = this.messagesSubject.asObservable();
  public connectionStatus$ = this.connectionStatusSubject.asObservable();
  public usersOnline$ = this.usersOnlineSubject.asObservable();
  public typing$ = this.typingSubject.asObservable();
  public errors$ = this.errorsSubject.asObservable();

  private currentRoomId: number | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor(private authService: AuthService) {}

  connect(roomId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const token = this.authService.getToken();
      
      console.log('🔌 Conectando a Flask-SocketIO, sala:', roomId);
      console.log('🔐 Token disponible:', !!token);
      console.log('🔗 URL SocketIO:', this.wsUrl);
      
      if (!token) {
        console.error('❌ No hay token de autenticación');
        reject(new Error('No authentication token available'));
        return;
      }

      // Cerrar conexión existente
      this.disconnect();

      // Crear conexión SocketIO con autenticación
      this.socket = io(this.wsUrl, {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true
      });

      // Eventos de conexión
      this.socket.on('connect', () => {
        console.log('✅ Conectado a Flask-SocketIO');
        this.connectionStatusSubject.next(true);
        this.currentRoomId = roomId;
        this.reconnectAttempts = 0;
        
        // Unirse a la sala
        this.socket?.emit('join_room', { room_id: roomId });
        resolve();
      });

      this.socket.on('disconnect', (reason) => {
        console.log('❌ Desconectado de SocketIO:', reason);
        this.connectionStatusSubject.next(false);
        
        // Reconectar automáticamente si no fue intencional
        if (reason === 'io server disconnect' && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.attemptReconnect();
        }
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ Error de conexión SocketIO:', error);
        this.connectionStatusSubject.next(false);
        this.errorsSubject.next({ type: 'connection_error', error: error.message });
        
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.attemptReconnect();
        } else {
          reject(error);
        }
      });

      // Eventos de mensajes
      this.socket.on('new_message', (data) => {
        console.log('📨 Nuevo mensaje recibido via SocketIO:', data);
        console.log('📨 Tipo de datos:', typeof data);
        console.log('📨 Estructura:', Object.keys(data));
        this.messagesSubject.next(data);
      });

      this.socket.on('user_joined', (data) => {
        console.log('👤 Usuario se unió:', data);
        this.usersOnlineSubject.next({ type: 'user_joined', ...data });
      });

      this.socket.on('user_left', (data) => {
        console.log('👋 Usuario se fue:', data);
        this.usersOnlineSubject.next({ type: 'user_left', ...data });
      });

      this.socket.on('typing', (data) => {
        console.log('⌨️ Usuario escribiendo:', data);
        this.typingSubject.next(data);
      });

      this.socket.on('error', (error) => {
        console.error('❌ Error de SocketIO:', error);
        this.errorsSubject.next({ type: 'socket_error', error });
      });
    });
  }

  disconnect(): void {
    if (this.socket) {
      console.log('🔌 Desconectando de Flask-SocketIO');
      
      // Salir de la sala actual
      if (this.currentRoomId) {
        this.socket.emit('leave_room', { room_id: this.currentRoomId });
      }
      
      this.socket.disconnect();
      this.socket = null;
      this.currentRoomId = null;
      this.connectionStatusSubject.next(false);
    }
  }

  sendMessage(message: string): void {
    if (this.socket && this.currentRoomId) {
      console.log('📤 Enviando mensaje SocketIO:');
      console.log('  - Sala ID:', this.currentRoomId);
      console.log('  - Contenido:', message);
      console.log('  - Socket conectado:', this.socket.connected);
      
      this.socket.emit('send_message', {
        room_id: this.currentRoomId,
        content: message
      });
    } else {
      console.error('❌ No hay conexión SocketIO o sala para enviar mensaje');
      console.error('  - Socket disponible:', !!this.socket);
      console.error('  - Socket conectado:', this.socket?.connected);
      console.error('  - Sala actual:', this.currentRoomId);
    }
  }

  sendTypingIndicator(isTyping: boolean): void {
    if (this.socket && this.currentRoomId) {
      this.socket.emit('typing', {
        room_id: this.currentRoomId,
        typing: isTyping
      });
    }
  }

  joinRoom(roomId: number): void {
    if (this.socket) {
      console.log('🏠 Uniéndose a sala:', roomId);
      this.socket.emit('join_room', { room_id: roomId });
      this.currentRoomId = roomId;
    }
  }

  leaveRoom(roomId: number): void {
    if (this.socket) {
      console.log('🚪 Saliendo de sala:', roomId);
      this.socket.emit('leave_room', { room_id: roomId });
      if (this.currentRoomId === roomId) {
        this.currentRoomId = null;
      }
    }
  }

  private attemptReconnect(): void {
    this.reconnectAttempts++;
    console.log(`🔄 Intento de reconexión ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
    
    setTimeout(() => {
      if (this.currentRoomId) {
        this.connect(this.currentRoomId);
      }
    }, 3000 * this.reconnectAttempts);
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getCurrentRoomId(): number | null {
    return this.currentRoomId;
  }
}