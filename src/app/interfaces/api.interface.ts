export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

export interface Token {
  access_token: string;
  token_type: string;
}

export interface TokenData {
  username?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

export interface MessageResponse {
  success: boolean;
  message: string;
  data?: any;
}

export interface RoomMemberAction {
  room_id: number;
  user_id: number;
}