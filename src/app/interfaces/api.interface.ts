// src/app/interfaces/api.interface.ts
import { User } from './user.interface';

// Interfaz genérica para respuestas de API
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
}

// Respuesta del registro (solo devuelve user, no access_token)
export interface RegisterResponse {
  message: string;
  user: User;
}

// Respuesta del login (incluye access_token y user)
export interface LoginResponse {
  message: string;
  access_token: string;
  user: User;
}

// Se mantiene Token para compatibilidad
export interface Token {
  access_token: string;
}