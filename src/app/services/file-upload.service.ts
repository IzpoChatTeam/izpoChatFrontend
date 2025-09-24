import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpEventType, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface FileUploadResponse {
  id: number;
  filename: string;
  original_filename: string;
  file_size: number;
  content_type: string;
  file_url: string;
  user_id: number;
  room_id?: number;
  created_at: string;
}

export interface UploadProgress {
  progress: number;
  file?: FileUploadResponse;
}

@Injectable({
  providedIn: 'root'
})
export class FileUploadService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  uploadFile(file: File, roomId?: string): Observable<UploadProgress> {
    const formData = new FormData();
    formData.append('file', file);
    if (roomId) {
      formData.append('room_id', roomId);
    }

    const req = new HttpRequest('POST', `${this.apiUrl}/upload`, formData, {
      reportProgress: true
    });

    return this.http.request<FileUploadResponse>(req).pipe(
      map(event => {
        switch (event.type) {
          case HttpEventType.UploadProgress:
            const progress = Math.round(100 * event.loaded / (event.total || 1));
            return { progress };
          
          case HttpEventType.Response:
            return { 
              progress: 100, 
              file: event.body as FileUploadResponse 
            };
          
          default:
            return { progress: 0 };
        }
      })
    );
  }

  getFileUrl(fileId: number): string {
    return `${this.apiUrl}/files/${fileId}`;
  }

  downloadFile(fileId: number, filename: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/files/${fileId}`, {
      responseType: 'blob'
    });
  }

  getUploadedFiles(): Observable<FileUploadResponse[]> {
    return this.http.get<FileUploadResponse[]>(`${this.apiUrl}/files`);
  }

  getRoomFiles(roomId: number): Observable<FileUploadResponse[]> {
    return this.http.get<FileUploadResponse[]>(`${this.apiUrl}/rooms/${roomId}/files`);
  }

  isImageFile(contentType: string): boolean {
    return contentType.startsWith('image/');
  }

  isVideoFile(contentType: string): boolean {
    return contentType.startsWith('video/');
  }

  isAudioFile(contentType: string): boolean {
    return contentType.startsWith('audio/');
  }

  isPdfFile(contentType: string): boolean {
    return contentType === 'application/pdf';
  }

  getFileIcon(contentType: string): string {
    if (this.isImageFile(contentType)) return '🖼️';
    if (this.isVideoFile(contentType)) return '🎥';
    if (this.isAudioFile(contentType)) return '🎵';
    if (this.isPdfFile(contentType)) return '📄';
    if (contentType.includes('text')) return '📝';
    if (contentType.includes('zip') || contentType.includes('rar')) return '📦';
    return '📁';
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}