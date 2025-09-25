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
    // Suscribirse al usuario actual para mantenerlo actualizado
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
    
    this.loadRooms();
  }

  loadRooms(): void {
    this.loading = true;
    this.error = '';

    console.log('🏠 Cargando salas...');
    console.log('🔐 Usuario autenticado:', this.authService.isAuthenticated());
    console.log('👤 Usuario actual:', this.currentUser);

    // Cargar salas públicas
    this.chatService.getRooms().subscribe({
      next: (rooms) => {
        console.log('✅ Salas públicas cargadas:', rooms.length);
        console.log('🔍 Datos de salas:', rooms);
        rooms.forEach((room, index) => {
          console.log(`🏠 Sala ${index + 1}: ID=${room.id}, Nombre="${room.name}"`);
        });
        this.publicRooms = rooms;
      },
      error: (error: any) => {
        console.error('❌ Error cargando salas públicas:', error);
        console.error('❌ Status:', error.status);
        console.error('❌ Message:', error.message);
        console.error('❌ Error detail:', error.error);
        this.error = `Error al cargar salas públicas: ${error.status} - ${error.message}`;
      }
    });

    // Cargar salas del usuario si está autenticado
    if (this.authService.isAuthenticated()) {
      this.chatService.getRooms().subscribe({
        next: (rooms) => {
          console.log('✅ Salas del usuario cargadas:', rooms.length);
          this.userRooms = rooms;
          this.loading = false;
        },
        error: (error) => {
          console.error('❌ Error cargando salas del usuario:', error);
          this.error = 'Error al cargar tus salas';
          this.loading = false;
        }
      });
    } else {
      this.loading = false;
    }
  }

  joinRoom(roomId: number): void {
    this.chatService.joinRoom(roomId).subscribe({
      next: () => {
        console.log('Te uniste a la sala exitosamente');
        this.loadRooms(); // Recargar para actualizar la lista
      },
      error: (error : any) => {
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
    console.log('🚪 Navegando a sala con ID:', roomId);
    console.log('🔍 Tipo de roomId:', typeof roomId);
    console.log('🔍 Es número válido:', !isNaN(roomId) && roomId > 0);
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
    if (!this.currentUser || !room.members) return false;
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