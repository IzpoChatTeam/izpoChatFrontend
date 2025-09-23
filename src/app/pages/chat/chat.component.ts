import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { ChatService } from '../../services/chat.service';
import { AuthService } from '../../services/auth.service';
import { WebSocketService } from '../../services/websocket.service';
import { Room } from '../../interfaces/room.interface';
import { Message, WebSocketMessage } from '../../interfaces/message.interface';
import { User } from '../../interfaces/user.interface';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  
  room: Room | null = null;
  messages: Message[] = [];
  currentUser: User | null = null;
  onlineUsers: User[] = [];
  
  messageForm: FormGroup;
  loading = true;
  error = '';
  connected = false;
  connectionStatus = false; // Añadido para el template
  
  typingUsers: Set<string> = new Set();
  typingTimeout: any;
  
  private subscriptions: Subscription[] = [];
  private roomId: number = 0;
  private shouldScrollToBottom = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private chatService: ChatService,
    private authService: AuthService,
    private webSocketService: WebSocketService,
    private fb: FormBuilder
  ) {
    this.messageForm = this.fb.group({
      message: ['', [Validators.required, Validators.maxLength(1000)]]
    });
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    
    // Obtener roomId de la ruta
    this.route.params.subscribe(params => {
      this.roomId = +params['roomId'];
      this.loadRoom();
    });

    // Suscribirse a mensajes WebSocket
    this.subscriptions.push(
      this.webSocketService.messages$.subscribe(message => {
        this.handleIncomingMessage(message);
      })
    );

    // Suscribirse a estado de conexión
    this.subscriptions.push(
      this.webSocketService.connectionStatus$.subscribe(connected => {
        this.connected = connected;
        this.connectionStatus = connected; // Sincronizar con la propiedad del template
      })
    );

    // Suscribirse a usuarios online
    this.subscriptions.push(
      this.webSocketService.usersOnline$.subscribe(data => {
        this.handleUsersOnlineUpdate(data);
      })
    );

    // Suscribirse a indicadores de escritura
    this.subscriptions.push(
      this.webSocketService.typing$.subscribe(data => {
        this.handleTypingIndicator(data);
      })
    );

    // Suscribirse a errores
    this.subscriptions.push(
      this.webSocketService.errors$.subscribe(error => {
        console.error('WebSocket error:', error);
        this.error = error.message || 'Error de conexión';
      })
    );
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
    }
  }

  ngOnDestroy(): void {
    // Limpiar suscripciones
    this.subscriptions.forEach(sub => sub.unsubscribe());
    
    // Desconectar WebSocket
    this.webSocketService.disconnect();
    
    // Limpiar timeout de typing
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
  }

  loadRoom(): void {
    this.loading = true;
    this.error = '';

    // Cargar información de la sala
    this.chatService.getRoom(this.roomId).subscribe({
      next: (room) => {
        this.room = room;
        this.loadMessages();
        this.connectWebSocket();
        this.loadOnlineUsers();
      },
      error: (error) => {
        console.error('Error cargando sala:', error);
        this.error = error.error?.detail || 'Error al cargar la sala';
        this.loading = false;
      }
    });
  }

  loadMessages(): void {
    this.chatService.getRoomMessages(this.roomId).subscribe({
      next: (messages) => {
        this.messages = messages.reverse(); // Reverse para mostrar más recientes al final
        this.loading = false;
        this.shouldScrollToBottom = true;
      },
      error: (error) => {
        console.error('Error cargando mensajes:', error);
        this.error = 'Error al cargar mensajes';
        this.loading = false;
      }
    });
  }

  connectWebSocket(): void {
    this.webSocketService.connect(this.roomId).then(() => {
      console.log('Conectado al WebSocket de la sala');
      this.webSocketService.startHeartbeat();
    }).catch(error => {
      console.error('Error conectando WebSocket:', error);
      this.error = 'Error de conexión en tiempo real';
    });
  }

  loadOnlineUsers(): void {
    this.chatService.getOnlineUsers(this.roomId).subscribe({
      next: (response) => {
        this.onlineUsers = response.online_users;
      },
      error: (error) => {
        console.error('Error cargando usuarios online:', error);
      }
    });
  }

  sendMessage(): void {
    if (this.messageForm.valid) {
      const messageContent = this.messageForm.get('message')?.value.trim();
      
      if (messageContent) {
        // Enviar via WebSocket para tiempo real
        this.webSocketService.sendMessage(messageContent);
        
        // Limpiar formulario
        this.messageForm.reset();
        
        // Detener indicador de escritura
        this.stopTyping();
      }
    }
  }

  onTyping(): void {
    this.onMessageInput();
  }

  onMessageInput(): void {
    // Iniciar indicador de escritura
    this.webSocketService.sendTypingIndicator(true);
    
    // Programar detener indicador después de 3 segundos
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
    
    this.typingTimeout = setTimeout(() => {
      this.stopTyping();
    }, 3000);
  }

  stopTyping(): void {
    this.webSocketService.sendTypingIndicator(false);
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
      this.typingTimeout = null;
    }
  }

  handleIncomingMessage(wsMessage: WebSocketMessage): void {
    if (wsMessage.type === 'message') {
      // Crear objeto Message desde WebSocketMessage
      const message: Message = {
        id: wsMessage.id!,
        content: wsMessage.content!,
        sender_id: wsMessage.sender!.id,
        room_id: wsMessage.room_id!,
        created_at: wsMessage.timestamp!,
        sender: wsMessage.sender!,
        room: this.room!,
        file_id: wsMessage.file?.id
      };
      
      // Agregar mensaje a la lista
      this.messages.push(message);
      this.shouldScrollToBottom = true;
    }
  }

  handleUsersOnlineUpdate(data: WebSocketMessage): void {
    if (data.type === 'users_online') {
      // Actualizar lista de usuarios online
      this.loadOnlineUsers();
    } else if (data.type === 'user_joined' || data.type === 'user_left') {
      // Recargar usuarios online cuando alguien se une o sale
      this.loadOnlineUsers();
    }
  }

  handleTypingIndicator(data: WebSocketMessage): void {
    const username = data.username!;
    
    if (data.typing) {
      this.typingUsers.add(username);
    } else {
      this.typingUsers.delete(username);
    }
  }

  getTypingText(): string {
    const typingArray = Array.from(this.typingUsers);
    if (typingArray.length === 0) return '';
    if (typingArray.length === 1) return `${typingArray[0]} está escribiendo...`;
    if (typingArray.length === 2) return `${typingArray[0]} y ${typingArray[1]} están escribiendo...`;
    return `${typingArray[0]} y ${typingArray.length - 1} más están escribiendo...`;
  }

  scrollToBottom(): void {
    try {
      if (this.messagesContainer) {
        const container = this.messagesContainer.nativeElement;
        container.scrollTop = container.scrollHeight;
      }
    } catch (err) {
      console.error('Error scrolling to bottom:', err);
    }
  }

  goBack(): void {
    this.router.navigate(['/rooms']);
  }

  formatMessageTime(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  formatMessageDate(timestamp: string): string {
    const date = new Date(timestamp);
    const today = new Date();
    
    if (date.toDateString() === today.toDateString()) {
      return 'Hoy';
    }
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Ayer';
    }
    
    return date.toLocaleDateString('es-ES');
  }

  isNewDay(currentIndex: number): boolean {
    if (currentIndex === 0) return true;
    
    const currentMessage = this.messages[currentIndex];
    const previousMessage = this.messages[currentIndex - 1];
    
    const currentDate = new Date(currentMessage.created_at).toDateString();
    const previousDate = new Date(previousMessage.created_at).toDateString();
    
    return currentDate !== previousDate;
  }

  isOwnMessage(message: Message): boolean {
    return message.sender_id === this.currentUser?.id;
  }

  isUserOwner(room: Room): boolean {
    if (!this.currentUser) return false;
    return room.owner_id === this.currentUser.id;
  }

  leaveRoom(): void {
    if (confirm('¿Estás seguro de que quieres salir de esta sala?')) {
      this.chatService.leaveRoom(this.roomId).subscribe({
        next: () => {
          this.router.navigate(['/rooms']);
        },
        error: (error) => {
          console.error('Error saliendo de la sala:', error);
          // Si es el propietario no puede salir, simplemente navegar
          this.router.navigate(['/rooms']);
        }
      });
    }
  }

  isMyMessage(message: Message): boolean {
    return this.currentUser?.id === message.sender_id;
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }
}