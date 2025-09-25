import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs'; // 'of' es para métodos aún no implementados

import { Room, RoomCreate } from '../interfaces/room.interface';
import { Message, MessageCreate } from '../interfaces/message.interface';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ==========================================
  // MÉTODOS COMPLETOS Y FUNCIONALES
  // ==========================================

  /**
   * Obtiene todas las salas públicas.
   */
  getRooms(): Observable<Room[]> {
    return this.http.get<Room[]>(`${this.apiUrl}/api/rooms`);
  }

  /**
   * Crea una nueva sala.
   */
  createRoom(roomData: RoomCreate): Observable<Room> {
    return this.http.post<Room>(`${this.apiUrl}/api/rooms`, roomData);
  }
joinRoom(roomId: number): Observable<any> {
    console.warn(`Funcionalidad 'joinRoom' no implementada en el backend para la sala ${roomId}.`);
    // Devolvemos un éxito simulado.
    return of({ success: true, message: 'Joined room successfully (simulated)' });
  }
  /**
   * Obtiene todos los mensajes de una sala específica.
   */
  getRoomMessages(roomId: number): Observable<Message[]> {
    return this.http.get<Message[]>(`${this.apiUrl}/api/rooms/${roomId}/messages`);
  }



  getRoomById(roomId: number): Observable<Room> {
    // Por ahora, lo obtenemos de la lista completa para que funcione.
    // Lo ideal es tener un endpoint específico.
    return this.http.get<Room>(`${this.apiUrl}/api/rooms/${roomId}`);
  }

  /**
   * Permite a un usuario salir de una sala.
   * NOTA: Tu backend necesita un endpoint para esto, por ejemplo: POST /api/rooms/{id}/leave
   */
  leaveRoom(roomId: number): Observable<any> {
    // Devolvemos un éxito simulado. La lógica real debe estar en el backend.
    console.warn(`Funcionalidad 'leaveRoom' no implementada en el backend para la sala ${roomId}.`);
    return of({ success: true, message: 'Left room successfully (simulated)' });
  }

  /**
   * Envía un mensaje a una sala a través de HTTP (como fallback).
   * NOTA: Tu backend actualmente solo maneja mensajes vía WebSocket.
   * Si quieres un fallback HTTP, necesitarías un endpoint POST /api/rooms/{id}/messages
   */
  sendMessage(roomId: number, messageData: MessageCreate): Observable<Message> {
    console.warn(`Funcionalidad 'sendMessage' vía HTTP no implementada en el backend.`);
    // Devolvemos un éxito simulado. El envío real se hace por WebSocket.
    return of({
        id: Date.now(),
        content: messageData.content,
        user_id: 0, // No podemos saber el user_id aquí
        room_id: roomId,
        created_at: new Date().toISOString(),
      } as Message);
  }
}