# 🔴 Solución de Error 500 - Internal Server Error

## Problema Identificado

Cuando inicias sesión o creas una cuenta, te redirige a `localhost:3000` pero obtienes un error 500.

## ✅ Solución Paso a Paso

### 1. Detener el Servidor Actual

Si tienes el servidor corriendo, detenlo:
- Presiona `Ctrl + C` en la terminal donde corre `npm run dev`

### 2. Verificar Variables de Entorno

Asegúrate de que tu archivo `.env.local` tiene TODAS estas variables:

```env
# Firebase Client (Frontend)
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu-proyecto-id

# Firebase Admin (Backend)
FIREBASE_PROJECT_ID=tu-proyecto-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@tu-proyecto.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"

# Groq API
GROQ_API_KEY=gsk_...
```

⚠️ **IMPORTANTE**: 
- `FIREBASE_PRIVATE_KEY` debe estar entre comillas dobles
- Debe mantener los `\n` (saltos de línea literales)
- No debe tener espacios extra al inicio o final

### 3. Reiniciar el Servidor

```bash
npm run dev
```

### 4. Verificar en la Consola del Servidor

Cuando inicies sesión, revisa la terminal donde corre el servidor. Deberías ver:

```
[users/ensure] created user in Firestore { uid: '...', email: '...', displayName: '...' }
```

O si hay error, verás el mensaje específico.

## 🔍 Diagnóstico Adicional

### Verificar que Firebase Admin está configurado

Abre la consola del navegador (F12) y revisa:

1. **Network tab**: Busca la petición a `/api/users/ensure`
2. Si falla con 500, ve a la **Response** para ver el error específico

### Errores Comunes

#### Error: "Firebase Admin not initialized"
**Causa**: Variables de entorno del admin no están configuradas
**Solución**: Verifica `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`

#### Error: "Invalid private key"
**Causa**: `FIREBASE_PRIVATE_KEY` tiene formato incorrecto
**Solución**: 
1. Debe estar entre comillas: `"-----BEGIN..."`
2. Debe tener `\n` literales, no saltos de línea reales
3. Copia directamente del JSON de Firebase

#### Error: "auth/popup-closed-by-user"
**Causa**: Usuario cerró el popup de Google
**Solución**: Normal, no es error del servidor

## 📝 Cómo Obtener las Credenciales

### Firebase Client (Frontend)

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Ve a **Project Settings** (⚙️ icono)
4. En la sección **General**, busca "Your apps"
5. Si no tienes una app web, haz clic en **Add app** > Web
6. Copia los valores de `firebaseConfig`:
   - `apiKey` → `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `authDomain` → `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `projectId` → `NEXT_PUBLIC_FIREBASE_PROJECT_ID`

### Firebase Admin (Backend)

1. En Firebase Console, ve a **Project Settings** > **Service Accounts**
2. Haz clic en **Generate new private key**
3. Se descargará un archivo JSON
4. Abre el JSON y copia:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (entre comillas)

**Ejemplo de cómo copiar la private key:**

Del JSON:
```json
{
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBA...\n-----END PRIVATE KEY-----\n"
}
```

A tu `.env.local`:
```env
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBA...\n-----END PRIVATE KEY-----\n"
```

## 🧪 Probar la Configuración

### Opción 1: Usar el Script de Diagnóstico

```bash
node check-config.js
```

Todas las variables deben mostrar ✅

### Opción 2: Probar Manualmente

1. Inicia el servidor: `npm run dev`
2. Ve a `http://localhost:3000/login`
3. Haz clic en "Continuar con Google"
4. Selecciona tu cuenta
5. Deberías ser redirigido a la página principal sin errores

## 🐛 Si Aún Tienes Errores

### Ver Logs Detallados del Servidor

En la terminal donde corre `npm run dev`, busca mensajes como:

```
ensure user error: Error: ...
```

Esto te dirá exactamente qué está fallando.

### Verificar Google Auth en Firebase

1. Ve a Firebase Console > Authentication
2. Pestaña **Sign-in method**
3. Verifica que **Google** esté **Enabled** (verde)

### Verificar Dominios Autorizados

1. En Authentication > Sign-in method
2. Scroll hasta **Authorized domains**
3. Debe incluir `localhost`

## ✅ Checklist Final

- [ ] Archivo `.env.local` existe
- [ ] Todas las variables están configuradas
- [ ] `FIREBASE_PRIVATE_KEY` está entre comillas
- [ ] Servidor reiniciado después de cambiar `.env.local`
- [ ] Google Auth habilitado en Firebase Console
- [ ] `localhost` en dominios autorizados
- [ ] Sin errores en la consola del servidor

## 📞 Ayuda Adicional

Si después de seguir estos pasos aún tienes errores:

1. **Copia el error exacto** de la consola del servidor
2. **Copia el error** de la consola del navegador (F12)
3. Verifica que tu proyecto de Firebase esté en el plan **Blaze** (si usas Firestore)

---

**Nota**: El error del favicon (`favicon.ico 500`) es secundario y no afecta la funcionalidad. Se puede ignorar por ahora.
