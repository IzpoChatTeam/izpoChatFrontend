import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, interval } from 'rxjs';

import { ChatService } from '../../services/chat.service';
import { AuthService } from '../../services/auth.service';
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

  // Propiedades actualizadas para nueva estructura
  room: Room | null = null;
  messages: Message[] = [];
  currentUser: User | null = null;
  messageForm: FormGroup;
  loading = true;
  error = '';
  selectedFile: File | null = null;
  lastMessageCount = 0;
  connectionStatus = true; // Siempre true para el modo HTTP
  uploadProgress = 0; // Para el progreso de subida de archivos

  private subscriptions = new Subscription();
  private roomId: number = 0;
  private shouldScrollToBottom = true;
  private refreshInterval: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private chatService: ChatService,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.messageForm = this.fb.group({
      content: ['', [Validators.required, Validators.maxLength(1000)]]
    });
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();

    const paramsSub = this.route.params.subscribe(params => {
      this.roomId = +params['id'];
      if (this.roomId) {
        this.loadInitialData();
        this.startMessagePolling();
      }
    });
    this.subscriptions.add(paramsSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
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
      next: (response: any) => {
        // Manejar respuesta flexible del backend
        if (response && response.data) {
          this.room = response.data;
        } else {
          this.room = response;
        }
        this.loadMessages();
      },
      error: (err: any) => {
        this.error = 'No se pudo cargar la información de la sala.';
        this.loading = false;
      }
    });
  }

  private loadMessages(): void {
    this.chatService.getRoomMessages(this.roomId).subscribe({
      next: (response: any) => {
        // Manejar respuesta flexible del backend
        let messagesArray: Message[] = [];
        if (Array.isArray(response)) {
          messagesArray = response;
        } else if (response && response.data && Array.isArray(response.data)) {
          messagesArray = response.data;
        } else {
          console.warn('⚠️ Respuesta inesperada de mensajes:', response);
          messagesArray = [];
        }
        
        this.messages = messagesArray.sort((a: any, b: any) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        this.lastMessageCount = this.messages.length;
        this.loading = false;
        this.shouldScrollToBottom = true;
      },
      error: (err: any) => {
        this.error = 'Error al cargar mensajes.';
        this.loading = false;
      }
    });
  }

  private startMessagePolling(): void {
    // Refrescar mensajes cada 3 segundos para simular tiempo real
    this.refreshInterval = setInterval(() => {
      this.checkForNewMessages();
    }, 3000);
  }

  private checkForNewMessages(): void {
    this.chatService.getRoomMessages(this.roomId).subscribe({
      next: (response: any) => {
        // Manejar respuesta flexible del backend
        let messagesArray: Message[] = [];
        if (Array.isArray(response)) {
          messagesArray = response;
        } else if (response && response.data && Array.isArray(response.data)) {
          messagesArray = response.data;
        } else {
          messagesArray = [];
        }
        
        const newMessages = messagesArray.sort((a: any, b: any) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        
        if (newMessages.length > this.lastMessageCount) {
          this.messages = newMessages;
          this.lastMessageCount = newMessages.length;
          this.shouldScrollToBottom = true;
        }
      },
      error: () => {
        // Error silencioso en el polling
      }
    });
  }

  sendMessage(): void {
    if (this.messageForm.invalid) return;

    const content = this.messageForm.value.content.trim();
    if (content && this.room) {
      // Mostrar el mensaje inmediatamente de forma optimista
      const optimisticMessage: Message = {
        id: Date.now(), // ID temporal
        content: content,
        username: this.currentUser?.username || 'Usuario',
        sender: {
          id: this.currentUser?.id || 0,
          username: this.currentUser?.username || 'Usuario',
          full_name: this.currentUser?.full_name || this.currentUser?.username || 'Usuario'
        },
        user_id: this.currentUser?.id || 0,
        room_id: this.roomId,
        created_at: new Date().toISOString()
      };
      
      this.messages.push(optimisticMessage);
      this.shouldScrollToBottom = true;
      this.messageForm.reset();
      
      // Actualizar mensajes desde el servidor después de un momento
      setTimeout(() => {
        this.checkForNewMessages();
      }, 1000);
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
    
    this.chatService.uploadFile(this.selectedFile).subscribe({
      next: (response) => {
        console.log('Archivo subido:', response.data);
        // Aquí podrías enviar un mensaje con el archivo
        this.selectedFile = null;
      },
      error: (err: any) => {
        this.error = 'Error al subir el archivo.';
        this.selectedFile = null;
      }
    });
    
    // Resetear el input
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
    // Comprobar tanto sender.id como user_id para compatibilidad
    return message.sender?.id === this.currentUser?.id || message.user_id === this.currentUser?.id;
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }
}

