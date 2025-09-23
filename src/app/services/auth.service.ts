import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { Router } from '@angular/router';

import { User, UserCreate, UserLogin } from '../interfaces/user.interface';
import { Token } from '../interfaces/api.interface';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private tokenSubject = new BehaviorSubject<string | null>(null);

  public currentUser$ = this.currentUserSubject.asObservable();
  public token$ = this.tokenSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Cargar token y usuario del localStorage al inicializar (solo en el navegador)
    if (isPlatformBrowser(this.platformId)) {
      this.loadStoredAuth();
    }
  }

  private loadStoredAuth(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      this.tokenSubject.next(token);
      this.currentUserSubject.next(JSON.parse(user));
    }
  }

  register(userData: UserCreate): Observable<User> {
    console.log('Register URL:', `${this.apiUrl}/users/register`);
    console.log('Register data:', userData);
    
    return this.http.post<User>(`${this.apiUrl}/users/register`, userData);
  }

  login(credentials: UserLogin): Observable<Token> {
    return this.http.post<Token>(`${this.apiUrl}/users/login`, credentials)
      .pipe(
        tap(response => {
          // Guardar token
          this.setToken(response.access_token);
          
          // Obtener información del usuario
          this.getCurrentUserInfo().subscribe(user => {
            this.setUser(user);
          });
        })
      );
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    this.tokenSubject.next(null);
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  getCurrentUserInfo(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/me`, {
      headers: this.getAuthHeaders()
    });
  }

  updateCurrentUser(userData: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/users/me`, userData, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(updatedUser => {
        this.setUser(updatedUser);
      })
    );
  }

  private setToken(token: string): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('token', token);
    }
    this.tokenSubject.next(token);
  }

  private setUser(user: User): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('user', JSON.stringify(user));
    }
    this.currentUserSubject.next(user);
  }

  getToken(): string | null {
    return this.tokenSubject.value || 
           (isPlatformBrowser(this.platformId) ? localStorage.getItem('token') : null);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // Método para refrescar información del usuario
  refreshUserInfo(): Observable<User> {
    return this.getCurrentUserInfo().pipe(
      tap(user => this.setUser(user))
    );
  }

  // Método de prueba de conectividad
  testConnection(): Observable<any> {
    console.log('Testing connection to:', `${this.apiUrl.replace('/api', '')}/health`);
    return this.http.get(`${this.apiUrl.replace('/api', '')}/health`);
  }

  // Método para obtener la URL de la API (para debugging)
  getApiUrl(): string {
    return this.apiUrl;
  }
}