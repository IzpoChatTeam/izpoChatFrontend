import { User } from './user.interface';
import { Room } from './room.interface';

export interface FileUpload {
  id: number;
  filename: string;
  original_filename: string;
  file_size: number;
  content_type: string;
  file_url: string;  // Flask usa file_url
  user_id: number;
  room_id?: number;
  created_at: string;
}

export interface Message {
  id: number;
  content: string;
  user_id: number;
  room_id: number;
  file_url?: string;  // Flask usa file_url directamente
  created_at: string;
  user: User;  // Flask usa 'user' en lugar de 'sender'
  room: Room;
  sender?: User;  // Alias para user para compatibilidad (opcional)
  file?: FileUpload;  // Para archivos adjuntos
}

export interface MessageCreate {
  content: string;
  room_id?: number;
  file_id?: number;
}

export interface WebSocketMessage {
  type: string;
  content?: string;
  room_id?: number;
  user_id?: number;
  username?: string;
  timestamp?: string;
  file?: FileUpload;
  id?: number;
  sender?: User;
  typing?: boolean;
  users?: number[];
  count?: number;
  message?: string;
}