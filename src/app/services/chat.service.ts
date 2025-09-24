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
    return this.http.get<Room[]>(`${this.apiUrl}/rooms`);
  }

  getRoom(roomId: number): Observable<Room> {
    return this.http.get<Room>(`${this.apiUrl}/rooms/${roomId}`);
  }

  createRoom(roomData: RoomCreate): Observable<Room> {
    return this.http.post<Room>(`${this.apiUrl}/rooms`, roomData);
  }

  updateRoom(roomId: number, roomData: RoomUpdate): Observable<Room> {
    return this.http.put<Room>(`${this.apiUrl}/rooms/${roomId}`, roomData);
  }

  joinRoom(roomId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/rooms/${roomId}/join`, {});
  }

  leaveRoom(roomId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/rooms/${roomId}/leave`, {});
  }

  getRoomMembers(roomId: number): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/rooms/${roomId}/members`);
  }

  // ==================== MESSAGES ====================

  getRoomMessages(roomId: number, skip: number = 0, limit: number = 50): Observable<Message[]> {
    return this.http.get<Message[]>(`${this.apiUrl}/rooms/${roomId}/messages`);
  }

  sendMessage(roomId: number, messageData: MessageCreate): Observable<Message> {
    return this.http.post<Message>(`${this.apiUrl}/rooms/${roomId}/messages`, messageData);
  }

  // ==================== USER ROOMS ====================

  getUserRooms(): Observable<Room[]> {
    return this.http.get<Room[]>(`${this.apiUrl}/users/me/rooms`);
  }

  // ==================== ONLINE USERS ====================

  getOnlineUsers(roomId: number): Observable<{room_id: number, online_users: User[], count: number}> {
    return this.http.get<{room_id: number, online_users: User[], count: number}>(
      `/ws/rooms/${roomId}/online`
    );
  }

  // ==================== USERS ====================

  getUsers(skip: number = 0, limit: number = 100): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users`);
  }

  getUserById(userId: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/${userId}`);
  }

  getUserByUsername(username: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/username/${username}`);
  }

  // Método para debugging
  getApiUrl(): string {
    return this.apiUrl;
  }
}