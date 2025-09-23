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
    return this.http.get<Room[]>(`${this.apiUrl}/rooms?skip=${skip}&limit=${limit}`);
  }

  getRoom(roomId: number): Observable<Room> {
    return this.http.get<Room>(`${this.apiUrl}/rooms/${roomId}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  createRoom(roomData: RoomCreate): Observable<Room> {
    return this.http.post<Room>(`${this.apiUrl}/rooms`, roomData, {
      headers: this.authService.getAuthHeaders()
    });
  }

  updateRoom(roomId: number, roomData: RoomUpdate): Observable<Room> {
    return this.http.put<Room>(`${this.apiUrl}/rooms/${roomId}`, roomData, {
      headers: this.authService.getAuthHeaders()
    });
  }

  joinRoom(roomId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/rooms/${roomId}/join`, {}, {
      headers: this.authService.getAuthHeaders()
    });
  }

  leaveRoom(roomId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/rooms/${roomId}/leave`, {}, {
      headers: this.authService.getAuthHeaders()
    });
  }

  getRoomMembers(roomId: number): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/rooms/${roomId}/members`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // ==================== MESSAGES ====================

  getRoomMessages(roomId: number, skip: number = 0, limit: number = 50): Observable<Message[]> {
    return this.http.get<Message[]>(`${this.apiUrl}/rooms/${roomId}/messages?skip=${skip}&limit=${limit}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  sendMessage(roomId: number, messageData: MessageCreate): Observable<Message> {
    return this.http.post<Message>(`${this.apiUrl}/rooms/${roomId}/messages`, messageData, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // ==================== USER ROOMS ====================

  getUserRooms(): Observable<Room[]> {
    return this.http.get<Room[]>(`${this.apiUrl}/users/me/rooms`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // ==================== ONLINE USERS ====================

  getOnlineUsers(roomId: number): Observable<{room_id: number, online_users: User[], count: number}> {
    return this.http.get<{room_id: number, online_users: User[], count: number}>(
      `${this.apiUrl}/ws/rooms/${roomId}/online`, {
        headers: this.authService.getAuthHeaders()
      }
    );
  }

  // ==================== USERS ====================

  getUsers(skip: number = 0, limit: number = 100): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users?skip=${skip}&limit=${limit}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  getUserById(userId: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/${userId}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  getUserByUsername(username: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/username/${username}`, {
      headers: this.authService.getAuthHeaders()
    });
  }
}