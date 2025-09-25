import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { ChatService } from '../../services/chat.service';
import { AuthService } from '../../services/auth.service';
import { SocketIOService } from '../../services/socketio.service';
import { FileUploadService } from '../../services/file-upload.service';
import { Room } from '../../interfaces/room.interface';
import { Message } from '../../interfaces/message.interface';
import { User } from '../../interfaces/user.interface';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  // --- PROPIEDADES CORREGIDAS Y AÑADIDAS ---
  room: Room | null = null;
  messages: Message[] = [];
  currentUser: User | null = null;
  messageForm: FormGroup;
  loading = true;
  error = '';
  connectionStatus = false;
  uploadProgress = 0;
  selectedFile: File | null = null; // CORRECCIÓN: Propiedad añadida

  private subscriptions = new Subscription();
  private roomId: number = 0;
  private shouldScrollToBottom = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private chatService: ChatService,
    private authService: AuthService,
    private socketIOService: SocketIOService,
    private fileUploadService: FileUploadService,
    private fb: FormBuilder
  ) {
    this.messageForm = this.fb.group({
      // CORRECCIÓN: El nombre del control debe coincidir con el HTML
      content: ['', [Validators.required, Validators.maxLength(1000)]]
    });
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();

    const paramsSub = this.route.params.subscribe(params => {
      this.roomId = +params['id'];
      if (this.roomId) {
        this.loadInitialData();
        this.setupWebSocketListeners();
      }
    });
    this.subscriptions.add(paramsSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.socketIOService.disconnect();
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  private loadInitialData(): void {
    this.loading = true;
    this.error = '';

    this.chatService.getRoomById(this.roomId).subscribe({
      next: room => {
        this.room = room;
        this.loadMessages();
        this.socketIOService.connect(this.roomId);
      },
      error: err => {
        this.error = 'No se pudo cargar la información de la sala.';
        this.loading = false;
      }
    });
  }

  private loadMessages(): void {
    this.chatService.getRoomMessages(this.roomId).subscribe({
      next: (messages) => {
        this.messages = messages;
        this.loading = false;
        this.shouldScrollToBottom = true;
      },
      error: (err) => {
        this.error = 'Error al cargar mensajes.';
        this.loading = false;
      }
    });
  }

  private setupWebSocketListeners(): void {
    const messagesSub = this.socketIOService.messages$.subscribe((newMessage: Message) => {
      const messageExists = this.messages.some(msg => msg.id === newMessage.id);
      if (!messageExists) {
        this.messages.push(newMessage);
        this.shouldScrollToBottom = true;
      }
    });

    const statusSub = this.socketIOService.connectionStatus$.subscribe(status => {
      this.connectionStatus = status;
      if (!status && this.currentUser) { // Solo mostrar error si no es el logout inicial
        this.error = "Conexión en tiempo real perdida. Intentando reconectar...";
      } else if (status) {
        this.error = ""; // Limpiar error al reconectar
      }
    });

    this.subscriptions.add(messagesSub);
    this.subscriptions.add(statusSub);
  }

  sendMessage(): void {
    if (this.messageForm.invalid || !this.connectionStatus) return;

    const content = this.messageForm.value.content.trim();
    if (content) {
      this.socketIOService.sendMessage(this.roomId, content);
      this.messageForm.reset();
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];
      this.uploadFile();
    }
  }

  private uploadFile(): void {
    if (!this.selectedFile || !this.roomId) {
      return;
    }
    
    // SIMPLIFICADO: La lógica de enviar mensaje se elimina, el backend lo hace.
    this.uploadProgress = 1;
    const uploadSub = this.fileUploadService.uploadFile(this.selectedFile, String(this.roomId))
      .subscribe({
        next: (progressEvent) => {
          this.uploadProgress = progressEvent.progress;
          if (progressEvent.file) {
            console.log('Subida completa, el backend emitirá el mensaje.', progressEvent.file);
            this.uploadProgress = 0;
            this.selectedFile = null;
          }
        },
        error: (err) => {
          this.error = 'Error al subir el archivo.';
          this.uploadProgress = 0;
          this.selectedFile = null;
        }
      });
    this.subscriptions.add(uploadSub);
    
    // Resetear el input para permitir subir el mismo archivo de nuevo
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  private scrollToBottom(): void {
    try {
      this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
    } catch (err) {}
  }

  goBack(): void {
    this.router.navigate(['/rooms']);
  }

  formatMessageTime(timestamp: string): string {
    return new Date(timestamp).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatMessageDate(timestamp: string): string {
    const date = new Date(timestamp);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) return 'Hoy';
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return 'Ayer';
    
    return date.toLocaleDateString('es-ES');
  }

  isNewDay(currentIndex: number): boolean {
    if (currentIndex === 0) return true;
    const current = new Date(this.messages[currentIndex].created_at).toDateString();
    const previous = new Date(this.messages[currentIndex - 1].created_at).toDateString();
    return current !== previous;
  }

  isOwnMessage(message: Message): boolean {
    // CORRECCIÓN: Lógica más robusta para mensajes iniciales y de WebSocket
    return message.sender?.id === this.currentUser?.id || message.user_id === this.currentUser?.id;
  }

// Add this method inside your ChatComponent class
onKeyPress(event: KeyboardEvent): void {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    this.sendMessage();
  }
}
}

