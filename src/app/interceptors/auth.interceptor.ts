import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  // Obtener el token del servicio de autenticación
  const token = authService.getToken();
  
  console.log('🔍 Interceptor - URL:', req.url);
  console.log('🔍 Interceptor - Token disponible:', !!token);
  console.log('🔍 Interceptor - Es petición API:', isApiRequest(req.url));
  console.log('🔍 Interceptor - Requiere autenticación:', requiresAuthentication(req.url));
  
  // Si hay un token y la petición requiere autenticación, añadir el header de autorización
  if (token && isApiRequest(req.url) && requiresAuthentication(req.url)) {
    console.log('✅ Añadiendo token a la petición:', req.url);
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('🔍 Headers enviados:', authReq.headers.keys());
    
    return next(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('❌ Error en petición autenticada:', error.status, error.message);
        // Si es un error 401 (no autorizado), redirigir al login
        if (error.status === 401) {
          authService.logout();
          router.navigate(['/login']);
        }
        return throwError(() => error);
      })
    );
  }
  
  if (requiresAuthentication(req.url)) {
    console.log('⚠️ Petición sin token (requiere auth):', req.url);
  } else {
    console.log('📢 Petición pública (sin auth requerida):', req.url);
  }
  // Si no hay token o no requiere autenticación, continuar sin modificar
  return next(req);
};

function isApiRequest(url: string): boolean {
  // Verificar si la URL es una petición a nuestra API
  return url.includes('/api/');
}

function requiresAuthentication(url: string): boolean {
  // Endpoints que NO requieren autenticación (según análisis del backend)
  const publicEndpoints = [
    '/api/users/register',
    '/api/users/login',
    '/api/rooms/?',  // Solo GET salas públicas
    '/health',
    '/docs',
    '/openapi.json'
  ];
  
  // Si es un GET a /api/rooms/ sin ID específico, no requiere auth
  if (url.match(/\/api\/rooms\/\?.*/) || url === '/api/rooms/') {
    return false;
  }
  
  // Verificar endpoints públicos
  return !publicEndpoints.some(endpoint => url.includes(endpoint));
}