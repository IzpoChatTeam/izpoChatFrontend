import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { ChatService } from '../../services/chat.service';
import { AuthService } from '../../services/auth.service';
import { WebSocketService } from '../../services/websocket.service';
import { FileUploadService } from '../../services/file-upload.service';
import { Room } from '../../interfaces/room.interface';
import { Message, WebSocketMessage, MessageCreate } from '../../interfaces/message.interface';
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
  
  // File upload properties
  uploadProgress = 0;
  selectedFile: File | null = null;
  
  typingUsers: Set<string> = new Set();
  typingTimeout: any;
  
  private subscriptions: Subscription[] = [];
  private roomId: number = 0;
  private shouldScrollToBottom = true;
  isWebSocketConnected = false; // Público para el template
  private httpPollingInterval: any;
  private lastMessageId = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private chatService: ChatService,
    private authService: AuthService,
    private webSocketService: WebSocketService,
    private fileUploadService: FileUploadService,
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
      this.roomId = +params['id'];  // Cambiar 'roomId' por 'id'
      console.log('🏠 Room ID obtenido de la ruta:', this.roomId);
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
    
    // Limpiar HTTP polling
    this.stopHttpPolling();
    
    // Limpiar timeout de typing
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
  }

  loadRoom(): void {
    this.loading = true;
    this.error = '';

    console.log('🔍 Cargando sala con ID:', this.roomId);
    console.log('🔍 Tipo de roomId:', typeof this.roomId);
    console.log('🔍 Es número válido:', !isNaN(this.roomId) && this.roomId > 0);

    // Validar que el roomId sea un número válido
    if (isNaN(this.roomId) || this.roomId <= 0) {
      console.error('❌ Room ID inválido:', this.roomId);
      this.error = 'ID de sala inválido';
      this.loading = false;
      return;
    }

    // Cargar información de la sala
    this.chatService.getRoom(this.roomId).subscribe({
      next: (room) => {
        console.log('✅ Sala cargada exitosamente:', room);
        this.room = room;
        this.loadMessages();
        this.connectWebSocket();
        this.loadOnlineUsers();
      },
      error: (error) => {
        console.error('❌ Error cargando sala:', error);
        console.error('❌ Status:', error.status);
        console.error('❌ Error detail:', error.error);
        this.error = error.error?.detail || `Error al cargar la sala (${error.status})`;
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
    console.log('🔌 Iniciando conexión WebSocket para sala:', this.roomId);
    
    this.webSocketService.connect(this.roomId).then(() => {
      console.log('✅ Conectado exitosamente al WebSocket de la sala');
      this.webSocketService.startHeartbeat();
      this.error = ''; // Limpiar cualquier error previo
      this.isWebSocketConnected = true;
    }).catch(error => {
      console.error('❌ Error conectando WebSocket:', error);
      console.warn('🔄 WebSocket no disponible, usando polling HTTP como fallback');
      
      // Intentar diagnosticar el problema
      console.log('🔍 Diagnóstico WebSocket:');
      console.log('- Room ID:', this.roomId);
      console.log('- Usuario autenticado:', this.authService.isAuthenticated());
      console.log('- Token disponible:', !!this.authService.getToken());
      console.log('- Posible causa: Firewall de Google Cloud bloqueando WebSockets');
      
      this.error = 'Conexión en tiempo real no disponible. Los mensajes se actualizarán cada 5 segundos.';
      this.isWebSocketConnected = false;
      this.startHttpPolling();
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
        if (this.isWebSocketConnected && this.webSocketService.isConnected()) {
          // Enviar via WebSocket para tiempo real
          console.log('📤 Enviando mensaje via WebSocket');
          this.webSocketService.sendMessage(messageContent);
        } else {
          // Fallback: Enviar via HTTP
          console.log('📤 Enviando mensaje via HTTP (fallback)');
          this.chatService.sendMessage(this.roomId, messageContent).subscribe({
            next: (message) => {
              console.log('✅ Mensaje enviado via HTTP:', message);
              // Agregar mensaje a la lista inmediatamente
              this.messages.push(message);
              this.shouldScrollToBottom = true;
            },
            error: (error) => {
              console.error('❌ Error enviando mensaje via HTTP:', error);
              this.error = 'Error enviando mensaje';
            }
          });
        }
        
        // Limpiar formulario
        this.messageForm.reset();
        
        // Detener indicador de escritura (solo si WebSocket está conectado)
        if (this.isWebSocketConnected) {
          this.stopTyping();
        }
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

  private startHttpPolling(): void {
    console.log('🔄 Iniciando HTTP polling como fallback del WebSocket');
    
    // Limpiar interval anterior si existe
    if (this.httpPollingInterval) {
      clearInterval(this.httpPollingInterval);
    }
    
    // Polling cada 5 segundos para obtener nuevos mensajes
    this.httpPollingInterval = setInterval(() => {
      this.loadMessages();
    }, 5000);
  }

  private stopHttpPolling(): void {
    if (this.httpPollingInterval) {
      clearInterval(this.httpPollingInterval);
      this.httpPollingInterval = null;
    }
  }

  // File upload methods
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.uploadFile();
    }
  }

  private uploadFile(): void {
    if (!this.selectedFile || !this.roomId) {
      return;
    }

    // Validación de tamaño (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (this.selectedFile.size > maxSize) {
      alert('El archivo es demasiado grande. Máximo 10MB.');
      return;
    }

    // Reset progress
    this.uploadProgress = 0;

    // Upload the file
    this.fileUploadService.uploadFile(this.selectedFile)
      .subscribe({
        next: (event) => {
          this.uploadProgress = event.progress;
          
          if (event.file) {
            console.log('📁 Archivo subido exitosamente:', event.file);
            
            // Send file message through WebSocket or HTTP
            const fileMessage = {
              content: event.file.original_filename,
              file_url: event.file.public_url,
              file_type: event.file.content_type,
              file_size: event.file.file_size
            };

            this.sendFileMessage(fileMessage);
            
            // Reset
            this.selectedFile = null;
            this.uploadProgress = 0;
          }
        },
        error: (error) => {
          console.error('❌ Error subiendo archivo:', error);
          alert('Error al subir el archivo. Inténtalo de nuevo.');
          this.uploadProgress = 0;
          this.selectedFile = null;
        }
      });
  }

  private sendFileMessage(fileData: any): void {
    if (!this.currentUser || !this.room) return;

    // Para WebSocket, enviamos el objeto completo
    const fileMessage: WebSocketMessage = {
      type: 'message',
      content: `📁 ${fileData.content}`,
      room_id: this.room.id,
      file: {
        id: 0, // Será asignado por el backend
        original_filename: fileData.content,
        stored_filename: fileData.content,
        file_size: fileData.file_size,
        content_type: fileData.file_type,
        public_url: fileData.file_url,
        uploader_id: this.currentUser.id,
        uploaded_at: new Date().toISOString(),
        uploader: this.currentUser
      }
    };

    if (this.isWebSocketConnected) {
      this.webSocketService.sendMessage(JSON.stringify(fileMessage));
    } else {
      // Send via HTTP - solo enviamos el mensaje con referencia al archivo
      const messageData: MessageCreate = {
        content: `📁 ${fileData.content}`,
        file_id: undefined // El backend asociará el archivo por el contenido o URL
      };

      this.chatService.sendMessage(this.room.id, messageData).subscribe({
        next: () => {
          console.log('📁 Mensaje de archivo enviado por HTTP');
          this.loadMessages(); // Reload to show the new message
        },
        error: (error) => {
          console.error('❌ Error enviando mensaje de archivo:', error);
        }
      });
    }
  }

  // Utility methods for file display
  getFileIcon(fileType: string): string {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType.startsWith('video/')) return '🎥';
    if (fileType.startsWith('audio/')) return '🎵';
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('doc')) return '📝';
    if (fileType.includes('zip') || fileType.includes('rar')) return '📦';
    return '📁';
  }

  formatFileSize(bytes: number): string {
    return this.fileUploadService.formatFileSize(bytes);
  }

  downloadFile(fileId: number, fileName: string): void {
    this.fileUploadService.downloadFile(fileId, fileName).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('❌ Error descargando archivo:', error);
        alert('Error al descargar el archivo.');
      }
    });
  }
}