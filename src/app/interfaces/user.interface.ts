export interface User {
  id: number;
  username: string;
  email: string;
  full_name?: string;
  created_at: string;
}

export interface UserCreate {
  username: string;
  email: string;
  full_name: string;
  password: string;
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface UserUpdate {
  username?: string;
  email?: string;
  full_name?: string;
}