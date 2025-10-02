# Guía de Configuración de Firebase y Firestore

Esta guía te ayudará a configurar Firebase y Firestore para que funcione la creación de pacientes y reportes.

## 📋 Requisitos Previos

- Cuenta de Google/Firebase
- Proyecto de Firebase creado

## 🚀 Paso 1: Crear Proyecto en Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Haz clic en "Agregar proyecto" o selecciona un proyecto existente
3. Sigue los pasos del asistente:
   - Nombre del proyecto
   - (Opcional) Habilitar Google Analytics
4. Espera a que se cree el proyecto

## 🔐 Paso 2: Obtener Credenciales del Cliente (Frontend)

### 2.1 Configuración Web

1. En Firebase Console, ve a **Project Settings** (⚙️ icono de engranaje)
2. En la pestaña **General**, baja hasta **Your apps**
3. Haz clic en el icono **</>** (Web)
4. Registra tu app:
   - Nombre: `FocusMeet Web`
   - (Opcional) Marca "Firebase Hosting"
5. Copia las credenciales que aparecen:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto-id",
  // ... otros campos
};
```

### 2.2 Agregar a .env.local

Crea o edita el archivo `.env.local` en la raíz del proyecto:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu-proyecto-id
```

## 🔑 Paso 3: Obtener Credenciales del Admin (Backend)

### 3.1 Generar Clave Privada

1. En Firebase Console, ve a **Project Settings** → **Service Accounts**
2. Haz clic en **Generate new private key**
3. Confirma haciendo clic en **Generate key**
4. Se descargará un archivo JSON con este formato:

```json
{
  "type": "service_account",
  "project_id": "tu-proyecto-id",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@tu-proyecto.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "...",
  "token_uri": "...",
  "auth_provider_x509_cert_url": "...",
  "client_x509_cert_url": "..."
}
```

### 3.2 Agregar a .env.local

Agrega estas líneas a tu archivo `.env.local`:

```env
FIREBASE_PROJECT_ID=tu-proyecto-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@tu-proyecto.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nTu_clave_privada_completa_aqui\n-----END PRIVATE KEY-----\n"
```

**⚠️ IMPORTANTE:**
- La `FIREBASE_PRIVATE_KEY` debe estar entre comillas dobles
- Mantén los `\n` tal como aparecen en el JSON
- Copia toda la clave desde `-----BEGIN PRIVATE KEY-----` hasta `-----END PRIVATE KEY-----`

## 🗄️ Paso 4: Habilitar Firestore

### 4.1 Crear Base de Datos

1. En Firebase Console, ve a **Firestore Database** en el menú lateral
2. Haz clic en **Create database**
3. Selecciona el modo:
   - **Production mode** (recomendado para producción)
   - **Test mode** (solo para desarrollo - permite acceso sin autenticación por 30 días)
4. Selecciona la ubicación del servidor (ej: `us-central`, `southamerica-east1`)
5. Haz clic en **Enable**

### 4.2 Configurar Reglas de Seguridad

Ve a la pestaña **Rules** y configura las reglas de seguridad:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Regla para pacientes
    match /patients/{patientId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
    
    // Regla para reportes
    match /reports/{reportId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
  }
}
```

Haz clic en **Publish** para aplicar las reglas.

## 🔥 Paso 5: Habilitar Authentication

### 5.1 Activar Email/Password

1. En Firebase Console, ve a **Authentication** en el menú lateral
2. Haz clic en **Get started**
3. Ve a la pestaña **Sign-in method**
4. Haz clic en **Email/Password**
5. Habilita **Email/Password**
6. (Opcional) Habilita **Email link (passwordless sign-in)**
7. Haz clic en **Save**

## 📊 Paso 6: Crear Índices de Firestore

### 6.1 Opción Automática (Recomendada)

Cuando ejecutes la aplicación y hagas tu primera query, Firestore te mostrará un error con un enlace para crear el índice automáticamente. Simplemente haz clic en ese enlace.

### 6.2 Opción Manual

Ve a **Firestore Database** → **Indexes** y crea estos índices:

#### Índice 1: Pacientes por usuario
- Collection ID: `patients`
- Fields indexed:
  - `userId` (Ascending)
  - `createdAt` (Descending)
- Query scope: Collection

#### Índice 2: Reportes por usuario
- Collection ID: `reports`
- Fields indexed:
  - `userId` (Ascending)
  - `createdAt` (Descending)
- Query scope: Collection

#### Índice 3: Reportes por paciente
- Collection ID: `reports`
- Fields indexed:
  - `patientId` (Ascending)
  - `userId` (Ascending)
  - `createdAt` (Descending)
- Query scope: Collection

**Nota:** Los índices pueden tardar unos minutos en construirse.

## 🔧 Paso 7: Obtener API Key de Groq

1. Ve a [Groq Console](https://console.groq.com/)
2. Crea una cuenta o inicia sesión
3. Ve a **API Keys**
4. Haz clic en **Create API Key**
5. Copia la clave y agrégala a `.env.local`:

```env
GROQ_API_KEY=gsk_...
```

## ✅ Paso 8: Verificar Configuración

### 8.1 Verificar archivo .env.local

Tu archivo `.env.local` debe verse así:

```env
# Firebase Client
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu-proyecto-id

# Firebase Admin
FIREBASE_PROJECT_ID=tu-proyecto-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@tu-proyecto.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Groq API
GROQ_API_KEY=gsk_...
```

### 8.2 Reiniciar el servidor de desarrollo

```bash
# Detén el servidor (Ctrl+C)
# Inicia nuevamente
npm run dev
```

### 8.3 Probar la conexión

Abre en tu navegador: `http://localhost:3000/api/test-firestore`

Deberías ver un JSON con `"success": true` si todo está configurado correctamente.

## 🐛 Solución de Problemas

### Error: "Firebase Admin no está configurado"
- Verifica que todas las variables de entorno estén en `.env.local`
- Asegúrate de que no haya espacios extra o comillas incorrectas
- Reinicia el servidor de desarrollo

### Error: "PERMISSION_DENIED"
- Verifica las reglas de seguridad en Firestore
- Asegúrate de estar autenticado en la aplicación
- Verifica que el `userId` coincida con el usuario autenticado

### Error: "The query requires an index"
- Haz clic en el enlace del error para crear el índice automáticamente
- O crea los índices manualmente siguiendo el Paso 6

### Error con FIREBASE_PRIVATE_KEY
- Asegúrate de que esté entre comillas dobles: `"-----BEGIN..."`
- Mantén los `\n` literales (no los reemplaces por saltos de línea reales)
- Copia la clave completa desde el archivo JSON descargado

## 📚 Recursos Adicionales

- [Documentación de Firebase](https://firebase.google.com/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Groq API Documentation](https://console.groq.com/docs)

## 🎉 ¡Listo!

Una vez completados todos los pasos, tu aplicación estará lista para:
- ✅ Crear y gestionar pacientes
- ✅ Generar reportes asociados a pacientes
- ✅ Transcribir y analizar audio/video con IA
- ✅ Autenticar usuarios de forma segura
