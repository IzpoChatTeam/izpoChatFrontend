// src/app/services/auth.service.ts
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, catchError, of } from 'rxjs';
import { Router } from '@angular/router';

import { User, UserCreate, UserLogin } from '../interfaces/user.interface';
// CAMBIO: Se importan las nuevas interfaces de respuesta
import { RegisterResponse, LoginResponse } from '../interfaces/api.interface';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.loadUserFromStorage();
  }

  private loadUserFromStorage(): void {
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('token');
      const userJson = localStorage.getItem('user');
      if (token && userJson) {
        this.currentUserSubject.next(JSON.parse(userJson));
      }
    }
  }

  // Registro - solo devuelve user (sin token automático)
  register(userData: UserCreate): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.apiUrl}/api/users/register`, userData);
  }

  // Login - devuelve token y user
  login(credentials: UserLogin): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/api/users/login`, credentials)
      .pipe(
        tap(response => {
          // Guardar token y usuario de la respuesta
          this.setAuth(response.access_token, response.user);
        })
      );
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  getCurrentUserInfo(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/api/users/me`).pipe(
      tap(user => {
        this.setUser(user);
      })
    );
  }

  private setAuth(token: string, user: User): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    }
    this.currentUserSubject.next(user);
  }

  private setUser(user: User): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('user', JSON.stringify(user));
    }
    this.currentUserSubject.next(user);
  }

  getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('token');
    }
    return null;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    // NOTA: Una mejor verificación podría incluir la validación de la expiración del token aquí
    return !!this.getToken();
  }
}