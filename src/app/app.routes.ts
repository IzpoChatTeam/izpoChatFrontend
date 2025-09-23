import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  // Ruta por defecto - redirigir a login
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  },
  
  // Rutas públicas (sin autenticación)
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register.component').then(m => m.RegisterComponent)
  },
  
  // Rutas protegidas (requieren autenticación)
  {
    path: 'rooms',
    loadComponent: () => import('./pages/rooms/rooms.component').then(m => m.RoomsComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'chat/:id',
    loadComponent: () => import('./pages/chat/chat.component').then(m => m.ChatComponent),
    canActivate: [AuthGuard]
  },
  
  // Ruta wildcard - 404
  {
    path: '**',
    redirectTo: '/login'
  }
];
