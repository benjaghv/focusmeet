# FocusMeet AI

Aplicación inteligente para analizar reuniones de Meet o Zoom. Sube tu grabación y obtén insights clave, resúmenes, decisiones y tareas automáticamente usando IA.

## 🚀 Características

- **Análisis de Audio/Video**: Transcripción automática y análisis inteligente de reuniones
- **Gestión de Pacientes**: Sistema completo para gestionar pacientes y sus reportes asociados
- **Reportes Detallados**: Generación automática de resúmenes, puntos clave, decisiones y tareas
- **Autenticación**: Sistema de login/registro con Firebase Auth
- **Base de Datos**: Almacenamiento en Firestore con soporte para desarrollo local

## 📋 Estructura del Proyecto

```
src/
├── app/
│   ├── api/              # Endpoints de la API
│   │   ├── patients/     # CRUD de pacientes
│   │   ├── reports/      # CRUD de reportes
│   │   └── chat/         # Transcripción y análisis
│   ├── components/       # Componentes reutilizables
│   ├── pacientes/        # Páginas de gestión de pacientes
│   ├── reportes/         # Páginas de reportes
│   └── page.tsx          # Página principal (upload)
└── lib/
    ├── firebaseClient.ts # Configuración Firebase cliente
    ├── firebaseAdmin.ts  # Configuración Firebase admin
    └── useAuth.ts        # Hook de autenticación
```

## 🛠️ Tecnologías

- **Framework**: Next.js 15 (App Router)
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS
- **Base de Datos**: Firebase Firestore
- **Autenticación**: Firebase Auth
- **IA**: Groq API (Llama 3.3)
- **Transcripción**: Groq Whisper

## ⚙️ Configuración

### 🔥 Configuración Completa de Firebase

**Para configurar Firebase y Firestore desde cero, sigue la guía detallada:**

👉 **[FIREBASE_SETUP.md](./FIREBASE_SETUP.md)** - Guía paso a paso completa

Esta guía incluye:
- Creación de proyecto en Firebase
- Obtención de credenciales (cliente y admin)
- Configuración de Firestore y reglas de seguridad
- Creación de índices compuestos
- Configuración de Authentication
- Solución de problemas comunes

### Variables de Entorno (Resumen)

Crea un archivo `.env.local` con las siguientes variables:

```env
# Firebase Client (públicas)
NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_project_id

# Firebase Admin (privadas)
FIREBASE_PROJECT_ID=tu_project_id
FIREBASE_CLIENT_EMAIL=tu_client_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Groq API
GROQ_API_KEY=tu_groq_api_key
```

**Nota:** Puedes copiar `env.example` como plantilla.

### Verificar Configuración

Después de configurar las variables de entorno, verifica que todo funcione:

```bash
# Inicia el servidor
npm run dev

# Abre en tu navegador
http://localhost:3000/api/test-firestore
```

Deberías ver `"success": true` si Firestore está correctamente configurado.

### Índices de Firestore

Los índices se pueden crear automáticamente cuando hagas tu primera query (Firestore te dará un enlace), o manualmente siguiendo [FIRESTORE_INDEXES.md](./FIRESTORE_INDEXES.md).

## 🚀 Instalación y Desarrollo

Primero, instala las dependencias:

```bash
npm install
```

Luego, ejecuta el servidor de desarrollo:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador para ver la aplicación.

## 📱 Flujo de Uso

### 1. Gestión de Pacientes

1. Ve a `/pacientes`
2. Haz clic en "Nuevo Paciente"
3. Completa los datos del paciente (nombre, edad, diagnóstico, etc.)
4. Guarda el paciente

### 2. Crear Reporte para un Paciente

1. Desde la ficha del paciente (`/pacientes/[id]`), haz clic en "Nuevo Reporte"
2. Serás redirigido a la página principal con el paciente pre-seleccionado
3. Sube un archivo de audio (.mp3) o video (.mp4)
4. Espera a que se complete el análisis
5. Revisa el reporte generado y guárdalo

### 3. Ver y Editar Reportes

- **Por paciente**: En `/pacientes/[id]` verás todos los reportes del paciente
- **Todos los reportes**: En `/reportes` verás todos tus reportes
- **Editar**: Haz clic en "Editar" para modificar cualquier campo del reporte

## 🏗️ Arquitectura

### Modelo de Datos

**Paciente (Patient)**
```typescript
{
  id: string;
  nombre: string;
  edad?: number;
  telefono?: string;
  email?: string;
  diagnostico?: string;
  notas?: string;
  userId: string;
  createdAt: string;
  updatedAt?: string;
}
```

**Reporte (Report)**
```typescript
{
  id: string;
  userId: string;
  patientId?: string;  // Opcional: asocia el reporte a un paciente
  title: string;
  createdAt: string;
  updatedAt?: string;
  analysis: {
    shortSummary: string;
    detailedSummary: string;
    keyPoints: string[];
    decisions: string[];
    tasks: Array<{
      description: string;
      responsible: string;
    }>;
  };
  meta: Record<string, unknown>;
}
```

## 🔐 Seguridad

- Todos los endpoints de API requieren autenticación mediante Firebase Auth
- Los usuarios solo pueden acceder a sus propios pacientes y reportes
- Las reglas de seguridad de Firestore deben configurarse apropiadamente

## 📝 Notas de Desarrollo

- En desarrollo, los reportes se guardan tanto en Firestore como en el filesystem local (`/reports`)
- En producción, solo se usa Firestore
- Los índices de Firestore son necesarios para queries complejas (ver `FIRESTORE_INDEXES.md`)

## 🚀 Deploy en Vercel

1. Conecta tu repositorio a Vercel
2. Configura las variables de entorno en el dashboard de Vercel
3. Asegúrate de crear los índices de Firestore antes del primer uso
4. Deploy automático en cada push a main

## 📄 Licencia

Este proyecto está bajo licencia MIT.
