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
      next: (response: any) => {
        console.log('✅ Respuesta completa del backend:', response);
        
        // El backend podría devolver directamente un array o { data: array }
        let roomsArray: Room[] = [];
        if (Array.isArray(response)) {
          // Backend devuelve directamente un array
          roomsArray = response;
          console.log('✅ Salas cargadas (array directo):', roomsArray.length);
        } else if (response && response.data && Array.isArray(response.data)) {
          // Backend devuelve { data: array }
          roomsArray = response.data;
          console.log('✅ Salas cargadas (objeto con data):', roomsArray.length);
        } else {
          // Respuesta inesperada
          console.warn('⚠️ Respuesta inesperada del backend:', response);
          roomsArray = [];
        }
        
        console.log('🔍 Datos de salas:', roomsArray);
        
        // Procesar salas para asegurar integridad de datos
        const processedRooms = roomsArray.map((room: any) => {
          // Asegurar que el creador tenga la estructura correcta
          if (!room.creator || typeof room.creator !== 'object') {
            room.creator = { username: 'Desconocido' };
          } else if (!room.creator.username) {
            room.creator.username = 'Desconocido';
          }
          
          // Asegurar que members sea un array
          if (!Array.isArray(room.members)) {
            room.members = [];
          }
          
          return room;
        });
        
        if (processedRooms.length === 0) {
          console.log('📝 No hay salas disponibles');
        } else {
          processedRooms.forEach((room: Room, index: number) => {
            console.log(`🏠 Sala ${index + 1}: ID=${room.id}, Nombre="${room.name}", Creador="${room.creator?.username}"`);
          });
        }
        
        // Separar salas públicas y privadas
        this.publicRooms = processedRooms.filter((room: Room) => !room.is_private);
        this.userRooms = processedRooms.filter((room: Room) => 
          room.is_private && room.members?.some((member: any) => member.id === this.currentUser?.id)
        );
        this.loading = false;
      },
      error: (error: any) => {
        console.error('❌ Error cargando salas:', error);
        console.error('❌ Status:', error.status);
        console.error('❌ Message:', error.message);
        console.error('❌ Error detail:', error.error);
        this.error = `Error al cargar salas: ${error.status} - ${error.message}`;
        this.loading = false;
      }
    });
  }

  joinRoom(roomId: number): void {
    // Navegar directamente a la sala
    console.log('Navegando a sala con ID:', roomId);
    this.router.navigate(['/chat', roomId]);
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
        next: (response) => {
          console.log('Sala creada exitosamente:', response.data);
          this.toggleCreateForm();
          this.loadRooms();
          this.creatingRoom = false;
        },
        error: (error: any) => {
          console.error('Error creando sala:', error);
          this.error = 'Error al crear la sala';
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
    if (!this.currentUser || !room.creator) return false;
    return room.creator.id === this.currentUser.id;
  }

  logout(): void {
    this.authService.logout();
  }

  refreshRooms(): void {
    this.loadRooms();
  }
}