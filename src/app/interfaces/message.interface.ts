import { User } from './user.interface';
import { Room } from './room.interface';

export interface FileUpload {
  id: number;
  original_filename: string;
  stored_filename: string;
  file_size: number;
  content_type: string;
  public_url: string;
  uploader_id: number;
  uploaded_at: string;
  uploader: User;
}

export interface Message {
  id: number;
  content: string;
  sender_id: number;
  room_id: number;
  file_id?: number;
  created_at: string;
  sender: User;
  room: Room;
  file?: FileUpload;
}

export interface MessageCreate {
  content: string;
  room_id: number;
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