import { User } from './user.interface';

export interface Room {
  id: number;
  name: string;
  description?: string | null;
  is_private?: boolean;
  created_at: string;
  creator?: {
    id?: number;
    username?: string;
    full_name?: string;
  };
  members?: User[];  // Para conversaciones privadas
}

export interface RoomCreate {
  name: string;
  description?: string;
}

export interface RoomUpdate {
  name?: string;
  description?: string;
  is_private?: boolean;
}

// Nueva interfaz para crear conversaciones privadas
export interface ConversationCreate {
  recipient_id: number;
}

export interface ConversationResponse {
  message: string;
  room: Room;
}