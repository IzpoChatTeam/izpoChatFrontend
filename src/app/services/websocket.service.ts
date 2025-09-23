import { Injectable } from '@angular/core';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { WebSocketMessage } from '../interfaces/message.interface';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private ws: WebSocket | null = null;
  private wsUrl = environment.wsUrl;
  
  // Subjects para diferentes tipos de mensajes
  private messagesSubject = new Subject<WebSocketMessage>();
  private connectionStatusSubject = new BehaviorSubject<boolean>(false);
  private usersOnlineSubject = new Subject<WebSocketMessage>();
  private typingSubject = new Subject<WebSocketMessage>();
  private errorsSubject = new Subject<WebSocketMessage>();

  // Observables públicos
  public messages$ = this.messagesSubject.asObservable();
  public connectionStatus$ = this.connectionStatusSubject.asObservable();
  public usersOnline$ = this.usersOnlineSubject.asObservable();
  public typing$ = this.typingSubject.asObservable();
  public errors$ = this.errorsSubject.asObservable();

  private currentRoomId: number | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000; // 3 segundos

  constructor(private authService: AuthService) {}

  connect(roomId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const token = this.authService.getToken();
      
      if (!token) {
        reject(new Error('No authentication token available'));
        return;
      }

      // Cerrar conexión existente si hay una
      this.disconnect();

      this.currentRoomId = roomId;
      const wsUrl = `${this.wsUrl}/${roomId}?token=${token}`;

      try {
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = (event) => {
          console.log('WebSocket conectado a sala:', roomId);
          this.connectionStatusSubject.next(true);
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket cerrado:', event.code, event.reason);
          this.connectionStatusSubject.next(false);
          
          // Intentar reconectar si no fue un cierre intencional
          if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.connectionStatusSubject.next(false);
          reject(error);
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close(1000, 'Disconnected by user');
      this.ws = null;
    }
    this.currentRoomId = null;
    this.connectionStatusSubject.next(false);
  }

  sendMessage(content: string, fileId?: number): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected');
      return;
    }

    const message = {
      type: 'message',
      content: content,
      file_id: fileId
    };

    this.ws.send(JSON.stringify(message));
  }

  sendTypingIndicator(isTyping: boolean): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    const message = {
      type: 'typing',
      typing: isTyping
    };

    this.ws.send(JSON.stringify(message));
  }

  sendPing(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    const message = {
      type: 'ping'
    };

    this.ws.send(JSON.stringify(message));
  }

  private handleMessage(data: WebSocketMessage): void {
    switch (data.type) {
      case 'message':
        this.messagesSubject.next(data);
        break;
      
      case 'welcome':
        console.log('Bienvenido:', data.message);
        break;
      
      case 'users_online':
      case 'user_joined':
      case 'user_left':
        this.usersOnlineSubject.next(data);
        break;
      
      case 'typing':
        this.typingSubject.next(data);
        break;
      
      case 'error':
        console.error('WebSocket error:', data.message);
        this.errorsSubject.next(data);
        break;
      
      case 'pong':
        // Respuesta al ping, conexión está activa
        break;
      
      default:
        console.log('Mensaje WebSocket desconocido:', data);
    }
  }

  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    console.log(`Intentando reconectar... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      if (this.currentRoomId) {
        this.connect(this.currentRoomId).catch(error => {
          console.error('Error en reconexión:', error);
        });
      }
    }, this.reconnectInterval * this.reconnectAttempts);
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  getCurrentRoomId(): number | null {
    return this.currentRoomId;
  }

  // Método para mantener la conexión activa
  startHeartbeat(): void {
    setInterval(() => {
      if (this.isConnected()) {
        this.sendPing();
      }
    }, 30000); // Ping cada 30 segundos
  }
}