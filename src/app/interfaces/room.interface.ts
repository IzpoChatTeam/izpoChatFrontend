import { User } from './user.interface';

export interface Room {
  id: number;
  name: string;
  description?: string;
  created_by: number;  // Flask usa created_by
  created_at: string;
  creator: User;  // Flask usa creator en lugar de owner
  is_private?: boolean;  // Opcional
  members?: User[];      // Opcional
  owner?: User;          // Alias para creator para compatibilidad (opcional)
  owner_id?: number;     // Alias para created_by (opcional)
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