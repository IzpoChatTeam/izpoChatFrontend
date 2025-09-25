import { User } from './user.interface';
import { Room } from './room.interface';

export interface FileUpload {
  id: number;
  filename: string;
  file_size: number;
  content_type: string;
  file_url: string;
  user_id: number;
  created_at: string;
}

export interface Message {
  id: number;
  content: string;
  user_id: number;
  username: string;  // Nuevo: el backend devuelve username directamente
  room_id: number;
  file_url?: string | null;
  created_at: string;
  sender?: {         // Información completa del remitente
    id: number;
    username: string;
    full_name: string;
  };
}

export interface MessageCreate {
  content: string;
  room_id?: number;
  file_id?: number;
}

export interface WebSocketMessage {
  type?: string;
  id?: number;
  content?: string;
  user_id?: number;
  username?: string;
  room_id?: number;
  created_at?: string;
  file_url?: string | null;
  sender?: {
    id: number;
    username: string;
    full_name: string;
  };
  status?: string;
  message_id?: number;
  timestamp?: string;
  room_name?: string;
  error?: string;
  code?: string;
}