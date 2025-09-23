import { User } from './user.interface';

export interface Room {
  id: number;
  name: string;
  description?: string;
  is_private: boolean;
  owner_id: number;
  created_at: string;
  updated_at?: string;
  owner: User;
  members: User[];
}

export interface RoomCreate {
  name: string;
  description?: string;
  is_private: boolean;
}

export interface RoomUpdate {
  name?: string;
  description?: string;
  is_private?: boolean;
}