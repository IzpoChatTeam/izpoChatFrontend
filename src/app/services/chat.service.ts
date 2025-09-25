import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Room, RoomCreate, ConversationCreate, ConversationResponse } from '../interfaces/room.interface';
import { Message } from '../interfaces/message.interface';
import { ApiResponse } from '../interfaces/api.interface';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // ==========================================
  // MÉTODOS PARA SALAS (ROOMS)
  // ==========================================

  /**
   * Obtiene todas las salas públicas.
   * GET /api/rooms
   */
  getRooms(): Observable<ApiResponse<Room[]>> {
    return this.http.get<ApiResponse<Room[]>>(`${this.apiUrl}/api/rooms`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Crea una nueva sala.
   * POST /api/rooms
   */
  createRoom(roomData: RoomCreate): Observable<ApiResponse<Room>> {
    return this.http.post<ApiResponse<Room>>(`${this.apiUrl}/api/rooms`, roomData, {
      headers: this.getHeaders()
    });
  }

  /**
   * Obtiene una sala específica por ID.
   * GET /api/rooms/:id
   */
  getRoomById(roomId: number): Observable<ApiResponse<Room>> {
    return this.http.get<ApiResponse<Room>>(`${this.apiUrl}/api/rooms/${roomId}`, {
      headers: this.getHeaders()
    });
  }

  // ==========================================
  // MÉTODOS PARA CONVERSACIONES
  // ==========================================

  /**
   * Crea una nueva conversación en una sala.
   * POST /api/conversations
   */
  createConversation(conversationData: ConversationCreate): Observable<ConversationResponse> {
    return this.http.post<ConversationResponse>(`${this.apiUrl}/api/conversations`, conversationData, {
      headers: this.getHeaders()
    });
  }

  // ==========================================
  // MÉTODOS PARA MENSAJES
  // ==========================================

  /**
   * Obtiene todos los mensajes de una sala específica.
   * GET /api/rooms/:id/messages
   */
  getRoomMessages(roomId: number): Observable<ApiResponse<Message[]>> {
    return this.http.get<ApiResponse<Message[]>>(`${this.apiUrl}/api/rooms/${roomId}/messages`, {
      headers: this.getHeaders()
    });
  }

  // ==========================================
  // MÉTODOS PARA ARCHIVOS
  // ==========================================

  /**
   * Sube un archivo.
   * POST /api/upload
   */
  uploadFile(file: File): Observable<ApiResponse<{ filename: string; file_path: string }>> {
    const formData = new FormData();
    formData.append('file', file);

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`
    });

    return this.http.post<ApiResponse<{ filename: string; file_path: string }>>(
      `${this.apiUrl}/api/upload`, 
      formData, 
      { headers }
    );
  }

  /**
   * Obtiene un archivo.
   * GET /api/files/:filename
   */
  getFile(filename: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/api/files/${filename}`, {
      headers: this.getHeaders(),
      responseType: 'blob'
    });
  }
}