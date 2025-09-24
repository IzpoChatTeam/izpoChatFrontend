import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Room, RoomCreate, RoomUpdate } from '../interfaces/room.interface';
import { Message, MessageCreate } from '../interfaces/message.interface';
import { User } from '../interfaces/user.interface';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  // ==================== ROOMS ====================

  getPublicRooms(skip: number = 0, limit: number = 100): Observable<Room[]> {
    return this.http.get<Room[]>(`${this.apiUrl}/api/rooms`);
  }

  // TODO: Implementar en Flask backend
  // getRoom(roomId: number): Observable<Room> {
  //   return this.http.get<Room>(`${this.apiUrl}/rooms/${roomId}`);
  // }

  createRoom(roomData: RoomCreate): Observable<Room> {
    return this.http.post<Room>(`${this.apiUrl}/api/rooms`, roomData);
  }

  // TODO: Implementar en Flask backend  
  // updateRoom(roomId: number, roomData: RoomUpdate): Observable<Room> {
  //   return this.http.put<Room>(`${this.apiUrl}/rooms/${roomId}`, roomData);
  // }

  // TODO: Implementar en Flask backend
  // joinRoom(roomId: number): Observable<any> {
  //   return this.http.post(`${this.apiUrl}/rooms/${roomId}/join`, {});
  // }

  // TODO: Implementar en Flask backend
  // leaveRoom(roomId: number): Observable<any> {
  //   return this.http.post(`${this.apiUrl}/rooms/${roomId}/leave`, {});
  // }

  // TODO: Implementar en Flask backend - actualmente no disponible
  // getRoomMembers(roomId: number): Observable<User[]> {
  //   return this.http.get<User[]>(`${this.apiUrl}/rooms/${roomId}/members`);
  // }

  // ==================== MESSAGES ====================

  getRoomMessages(roomId: number, skip: number = 0, limit: number = 50): Observable<Message[]> {
    return this.http.get<Message[]>(`${this.apiUrl}/api/rooms/${roomId}/messages`);
  }

  // TODO: Implementar en Flask backend - actualmente no disponible
  // sendMessage(roomId: number, messageData: MessageCreate): Observable<Message> {
  //   return this.http.post<Message>(`${this.apiUrl}/rooms/${roomId}/messages`, messageData);
  // }

  // ==================== USER ROOMS ====================

  // TODO: Implementar en Flask backend - actualmente no disponible
  // getUserRooms(): Observable<Room[]> {
  //   return this.http.get<Room[]>(`${this.apiUrl}/users/me/rooms`);
  // }

  // ==================== ONLINE USERS ====================

  // TODO: Implementar en Flask backend - actualmente no disponible
  // getOnlineUsers(roomId: number): Observable<{room_id: number, online_users: User[], count: number}> {
  //   return this.http.get<{room_id: number, online_users: User[], count: number}>(
  //     `/ws/rooms/${roomId}/online`
  //   );
  // }

  // ==================== USERS ====================

  // TODO: Implementar en Flask backend - actualmente no disponible
  // getUsers(skip: number = 0, limit: number = 100): Observable<User[]> {
  //   return this.http.get<User[]>(`${this.apiUrl}/users`);
  // }

  // TODO: Implementar en Flask backend - actualmente no disponible  
  // getUserById(userId: number): Observable<User> {
  //   return this.http.get<User>(`${this.apiUrl}/users/${userId}`);
  // }

  // TODO: Implementar en Flask backend - actualmente no disponible
  // getUserByUsername(username: string): Observable<User> {
  //   return this.http.get<User>(`${this.apiUrl}/users/username/${username}`);
  // }

  // ==================== IMPLEMENTACIONES TEMPORALES ====================
  // Para que compile mientras se implementan en el backend Flask

  getRoom(roomId: number): Observable<Room> {
    // Por ahora retornamos un room básico - TODO: implementar endpoint en Flask
    return new Observable(observer => {
      observer.next({
        id: roomId,
        name: 'Sala Temporal',
        created_by: 1,
        created_at: new Date().toISOString(),
        creator: { id: 1, username: 'temp', email: 'temp@temp.com', full_name: 'Temp User' }
      } as Room);
      observer.complete();
    });
  }

  sendMessage(roomId: number, messageData: MessageCreate): Observable<Message> {
    // Envío via WebSocket en lugar de HTTP - TODO: considerar implementar endpoint HTTP
    return new Observable(observer => {
      observer.next({
        id: Date.now(),
        content: messageData.content,
        user_id: 1,
        room_id: roomId,
        created_at: new Date().toISOString(),
        user: { id: 1, username: 'temp', email: 'temp@temp.com', full_name: 'Temp User' },
        room: { id: roomId, name: 'Temp Room', created_by: 1, created_at: new Date().toISOString(), creator: { id: 1, username: 'temp', email: 'temp@temp.com', full_name: 'Temp User' } }
      } as Message);
      observer.complete();
    });
  }

  getUserRooms(): Observable<Room[]> {
    // Por ahora usamos getPublicRooms() - TODO: implementar endpoint específico en Flask
    return this.getPublicRooms();
  }

  joinRoom(roomId: number): Observable<any> {
    // Por ahora simulamos éxito - TODO: implementar en Flask backend
    return new Observable(observer => {
      observer.next({ success: true, message: 'Joined room successfully' });
      observer.complete();
    });
  }

  leaveRoom(roomId: number): Observable<any> {
    // Por ahora simulamos éxito - TODO: implementar en Flask backend
    return new Observable(observer => {
      observer.next({ success: true, message: 'Left room successfully' });
      observer.complete();
    });
  }

  getOnlineUsers(roomId: number): Observable<{room_id: number, online_users: User[], count: number}> {
    // Por ahora retornamos array vacío - TODO: implementar en Flask backend
    return new Observable(observer => {
      observer.next({ room_id: roomId, online_users: [], count: 0 });
      observer.complete();
    });
  }

  // Método para debugging
  getApiUrl(): string {
    return this.apiUrl;
  }
}