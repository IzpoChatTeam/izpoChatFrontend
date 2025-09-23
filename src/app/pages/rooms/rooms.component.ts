import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { ChatService } from '../../services/chat.service';
import { AuthService } from '../../services/auth.service';
import { Room, RoomCreate } from '../../interfaces/room.interface';
import { User } from '../../interfaces/user.interface';

@Component({
  selector: 'app-rooms',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './rooms.component.html',
  styleUrl: './rooms.component.css'
})
export class RoomsComponent implements OnInit {
  publicRooms: Room[] = [];
  userRooms: Room[] = [];
  currentUser: User | null = null;
  loading = false;
  error = '';
  
  showCreateForm = false;
  createRoomForm: FormGroup;
  creatingRoom = false;

  constructor(
    private chatService: ChatService,
    private authService: AuthService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.createRoomForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      description: ['', [Validators.maxLength(200)]],
      is_private: [false]
    });
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadRooms();
  }

  loadRooms(): void {
    this.loading = true;
    this.error = '';

    // Cargar salas públicas
    this.chatService.getPublicRooms().subscribe({
      next: (rooms) => {
        this.publicRooms = rooms;
      },
      error: (error) => {
        console.error('Error cargando salas públicas:', error);
        this.error = 'Error al cargar salas públicas';
      }
    });

    // Cargar salas del usuario
    this.chatService.getUserRooms().subscribe({
      next: (rooms) => {
        this.userRooms = rooms;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error cargando salas del usuario:', error);
        this.error = 'Error al cargar tus salas';
        this.loading = false;
      }
    });
  }

  joinRoom(roomId: number): void {
    this.chatService.joinRoom(roomId).subscribe({
      next: () => {
        console.log('Te uniste a la sala exitosamente');
        this.loadRooms(); // Recargar para actualizar la lista
      },
      error: (error) => {
        console.error('Error uniéndose a la sala:', error);
        if (error.error?.detail) {
          alert('Error: ' + error.error.detail);
        } else {
          alert('Error al unirse a la sala');
        }
      }
    });
  }

  enterRoom(roomId: number): void {
    this.router.navigate(['/chat', roomId]);
  }

  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    if (!this.showCreateForm) {
      this.createRoomForm.reset();
    }
  }

  createRoom(): void {
    if (this.createRoomForm.valid) {
      this.creatingRoom = true;
      
      const roomData: RoomCreate = this.createRoomForm.value;
      
      this.chatService.createRoom(roomData).subscribe({
        next: (room) => {
          console.log('Sala creada exitosamente:', room);
          this.toggleCreateForm();
          this.loadRooms();
          this.creatingRoom = false;
        },
        error: (error) => {
          console.error('Error creando sala:', error);
          alert('Error al crear la sala');
          this.creatingRoom = false;
        }
      });
    }
  }

  isUserInRoom(room: Room): boolean {
    if (!this.currentUser) return false;
    return room.members.some(member => member.id === this.currentUser!.id);
  }

  isUserOwner(room: Room): boolean {
    if (!this.currentUser) return false;
    return room.owner_id === this.currentUser.id;
  }

  logout(): void {
    this.authService.logout();
  }

  refreshRooms(): void {
    this.loadRooms();
  }
}