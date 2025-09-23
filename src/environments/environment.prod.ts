export const environment = {
  production: true,
  apiUrl: 'http://34.72.14.164/api',  // Sin puerto, nginx redirige
  wsUrl: 'ws://34.72.14.164/api/ws'  ,  
  
  //apiUrl: 'http://localhost:8000/api',  // Directo al backend (CORS configurado)
  //wsUrl: 'ws://localhost:8000/api/ws'  // Sin puerto, nginx maneja WebSockets
};