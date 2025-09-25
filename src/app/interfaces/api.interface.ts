// src/app/interfaces/api.interface.ts
import { User } from './user.interface';

// CAMBIO: Se añade la interfaz para la respuesta del registro
export interface RegisterResponse {
  message: string;
  access_token: string;
  user: User;
}

// CAMBIO: Se ajusta la interfaz del login para que coincida con la respuesta real
export interface LoginResponse {
  message: string;
  access_token: string;
  user: User;
}

// Se mantiene Token, pero LoginResponse es más descriptivo
export interface Token {
  access_token: string;
}