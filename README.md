# IzpoChat Frontend

Frontend en Angular para la aplicación de chat IzpoChat. Interfaz moderna y responsive para chat en tiempo real con soporte para salas públicas y privadas.

## 🚀 Características

- **Autenticación**: Login y registro de usuarios
- **Chat en tiempo real**: Mensajes instantáneos usando WebSocket
- **Salas**: Crear y unirse a salas públicas y privadas
- **Usuarios online**: Ver quién está conectado en cada sala
- **Indicador de escritura**: Ver cuando otros usuarios están escribiendo
- **Responsive**: Diseño adaptable para móviles y escritorio

## 🛠️ Tecnologías

- Angular 18+ (Standalone Components)
- TypeScript
- WebSocket para comunicación en tiempo real
- HTTP Client para API REST
- Reactive Forms
- CSS3 con diseño responsive

## 📋 Prerrequisitos

- Node.js 18+ 
- npm o yarn
- Backend IzpoChat ejecutándose en `http://localhost:8000`

## 🔧 Instalación

1. **Instalar dependencias**
   ```bash
   npm install
   ```

2. **Configurar variables de entorno**
   
   El archivo `src/environments/environment.ts` ya está configurado para desarrollo:
   ```typescript
   export const environment = {
     production: false,
     apiUrl: 'http://localhost:8000/api',
     wsUrl: 'ws://localhost:8000/api/ws'
   };
   ```

3. **Ejecutar en modo desarrollo**
   ```bash
   npm start
   # o
   ng serve
   ```

   La aplicación estará disponible en `http://localhost:4200`

## 🏗️ Estructura del Proyecto

```
src/
├── app/
│   ├── guards/
│   │   └── auth.guard.ts          # Guard para rutas protegidas
│   ├── interfaces/
│   │   ├── api.interface.ts       # Interfaces para API
│   │   ├── message.interface.ts   # Interfaces para mensajes
│   │   ├── room.interface.ts      # Interfaces para salas
│   │   └── user.interface.ts      # Interfaces para usuarios
│   ├── pages/
│   │   ├── chat/                  # Componente principal del chat
│   │   ├── login/                 # Página de login
│   │   ├── register/              # Página de registro
│   │   └── rooms/                 # Lista de salas
│   ├── services/
│   │   ├── auth.service.ts        # Servicio de autenticación
│   │   ├── chat.service.ts        # Servicio para API REST
│   │   └── websocket.service.ts   # Servicio WebSocket
│   ├── app.config.ts              # Configuración de la app
│   ├── app.routes.ts              # Rutas de la aplicación
│   └── app.ts                     # Componente principal
└── environments/
    ├── environment.ts             # Variables de desarrollo
    └── environment.prod.ts        # Variables de producción
```

## 🔐 Autenticación

El sistema utiliza JWT (JSON Web Tokens) para la autenticación:

1. **Registro**: Los usuarios pueden crear una cuenta nueva
2. **Login**: Autenticación con username/password
3. **Token**: Se almacena en localStorage y se incluye en headers HTTP
4. **Guard**: Las rutas protegidas requieren autenticación

## 💬 Funcionalidades del Chat

### Salas
- **Crear salas**: Públicas o privadas
- **Unirse a salas**: Automático para salas públicas
- **Lista de miembros**: Ver quién está en cada sala
- **Propietario**: El creador puede administrar la sala

### Mensajes
- **Tiempo real**: Mensajes instantáneos vía WebSocket
- **Historial**: Cargar mensajes anteriores
- **Indicadores**: Ver cuando otros escriben
- **Timestamps**: Hora y fecha de cada mensaje

### Usuarios Online
- **Estado en tiempo real**: Ver quién está conectado
- **Notificaciones**: Cuando usuarios se unen/salen

## 🌐 API Backend

Este frontend se conecta al backend IzpoChat que debe estar ejecutándose en:
- **HTTP API**: `http://localhost:8000/api`
- **WebSocket**: `ws://localhost:8000/api/ws`

### Endpoints principales:
- `POST /users/register` - Registro de usuario
- `POST /users/login` - Login
- `GET /rooms` - Lista de salas públicas
- `GET /users/me/rooms` - Mis salas
- `POST /rooms` - Crear sala
- `POST /rooms/{id}/join` - Unirse a sala
- `GET /rooms/{id}/messages` - Mensajes de sala
- `WS /ws/{room_id}?token={jwt}` - WebSocket del chat

## 🚀 Compilación para Producción

1. **Build de producción**
   ```bash
   npm run build
   ```

2. **Configurar variables de producción**
   
   Editar `src/environments/environment.prod.ts`:
   ```typescript
   export const environment = {
     production: true,
     apiUrl: 'https://tu-api-produccion.com/api',
     wsUrl: 'wss://tu-api-produccion.com/api/ws'
   };
   ```

## 🔄 Scripts Disponibles

```bash
npm start          # Servidor de desarrollo (ng serve)
npm run build      # Build de producción
npm run watch      # Build en modo watch
npm test           # Ejecutar tests
```

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
