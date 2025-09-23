// Configuración de la aplicación
export const APP_CONFIG = {
  // Configuración de chat
  chat: {
    maxMessageLength: 1000,
    messageHistoryLimit: 50,
    typingTimeout: 3000,
    reconnectAttempts: 5,
    reconnectInterval: 3000,
    heartbeatInterval: 30000
  },
  
  // Configuración de tokens
  auth: {
    tokenKey: 'token',
    userKey: 'user',
    tokenExpiry: 30 // minutos
  },
  
  // Configuración de UI
  ui: {
    loadingTimeout: 10000,
    toastDuration: 3000,
    animationDuration: 300
  },
  
  // Límites de validación
  validation: {
    username: {
      minLength: 3,
      maxLength: 50
    },
    password: {
      minLength: 6,
      maxLength: 100
    },
    roomName: {
      minLength: 3,
      maxLength: 50
    },
    roomDescription: {
      maxLength: 200
    },
    fullName: {
      maxLength: 100
    }
  }
};