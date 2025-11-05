# Configuración de Autenticación con Google en Firebase

Esta guía te ayudará a configurar la autenticación con Google en tu proyecto FocusMeet.

## Pasos para Configurar Google Auth en Firebase

### 1. Acceder a Firebase Console

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto FocusMeet

### 2. Habilitar Google como Proveedor de Autenticación

1. En el menú lateral, haz clic en **Authentication** (Autenticación)
2. Ve a la pestaña **Sign-in method** (Método de inicio de sesión)
3. Busca **Google** en la lista de proveedores
4. Haz clic en **Google** para expandir las opciones
5. Activa el interruptor para **Enable** (Habilitar)
6. Configura los siguientes campos:
   - **Project support email**: Selecciona tu email de soporte
   - **Project public-facing name**: "FocusMeet" (o el nombre que prefieras)
7. Haz clic en **Save** (Guardar)

### 3. Configurar el Dominio Autorizado

Firebase automáticamente autoriza `localhost` para desarrollo. Para producción:

1. En la misma sección de **Authentication > Sign-in method**
2. Desplázate hasta **Authorized domains** (Dominios autorizados)
3. Agrega tu dominio de producción (ejemplo: `focusmeet.com`)
4. Haz clic en **Add domain** (Agregar dominio)

### 4. Verificar Variables de Entorno

Asegúrate de que tu archivo `.env.local` tenga las siguientes variables configuradas:

```env
# Firebase Client (Frontend)
NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_proyecto_id

# Firebase Admin (Backend)
FIREBASE_PROJECT_ID=tu_proyecto_id
FIREBASE_CLIENT_EMAIL=tu_service_account_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### 5. Configurar Firestore para Usuarios

Los usuarios autenticados con Google se guardarán automáticamente en Firestore en la colección `users`. Asegúrate de tener las siguientes reglas de seguridad:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /feedback/{feedbackId} {
      allow create: if request.auth != null;
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
    }
  }
}
```

### 6. Probar la Autenticación

1. Inicia tu servidor de desarrollo:
   ```bash
   npm run dev
   ```

2. Ve a `http://localhost:3000/login` o `http://localhost:3000/register`

3. Haz clic en el botón **"Continuar con Google"**

4. Selecciona tu cuenta de Google

5. Deberías ser redirigido a la página principal autenticado

## Características Implementadas

### ✅ Login con Google
- Botón de "Continuar con Google" en la página de login
- Popup de autenticación de Google
- Creación automática de usuario en Firestore

### ✅ Registro con Google
- Botón de "Continuar con Google" en la página de registro
- Mismo flujo que el login (Google maneja el registro automáticamente)

### ✅ Gestión de Sesión
- Token de autenticación almacenado automáticamente
- Sincronización con Firestore para datos del usuario
- Cierre de sesión disponible en el Navbar

## Solución de Problemas

### Error: "This domain is not authorized"

**Solución**: Agrega tu dominio a los dominios autorizados en Firebase Console:
1. Authentication > Sign-in method > Authorized domains
2. Agrega tu dominio

### Error: "popup_closed_by_user"

**Solución**: El usuario cerró el popup antes de completar la autenticación. Es un comportamiento normal, no requiere acción.

### Error: "auth/account-exists-with-different-credential"

**Solución**: El email ya está registrado con otro método (email/password). El usuario debe usar el método original o vincular las cuentas.

### Error: "Firebase: Error (auth/popup-blocked)"

**Solución**: El navegador bloqueó el popup. Pide al usuario que permita popups para tu sitio.

## Seguridad

### Mejores Prácticas Implementadas

1. **Tokens de Autenticación**: Se usan tokens JWT de Firebase para todas las peticiones al backend
2. **Validación Server-Side**: Todos los endpoints validan el token antes de procesar
3. **Reglas de Firestore**: Solo los usuarios autenticados pueden acceder a sus propios datos
4. **HTTPS en Producción**: Asegúrate de usar HTTPS en producción

## Datos del Usuario en Firestore

Cuando un usuario se autentica con Google, se crea/actualiza un documento en `users/{userId}`:

```javascript
{
  email: "usuario@gmail.com",
  displayName: "Nombre Usuario",
  createdAt: "2024-01-01T00:00:00.000Z",
  lastLogin: "2024-01-01T00:00:00.000Z"
}
```

## Recursos Adicionales

- [Documentación oficial de Firebase Auth](https://firebase.google.com/docs/auth)
- [Google Sign-In para Web](https://developers.google.com/identity/sign-in/web)
- [Firebase Security Rules](https://firebase.google.com/docs/firestore/security/get-started)

## Soporte

Si encuentras problemas, revisa:
1. La consola del navegador para errores de JavaScript
2. Los logs de Firebase Console
3. Las reglas de seguridad de Firestore
