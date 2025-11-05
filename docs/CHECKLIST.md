# ✅ Checklist de Configuración - FocusMeet AI

Usa este checklist para asegurarte de que todo esté correctamente configurado antes de usar la aplicación.

## 📋 Configuración Inicial

### 1. Instalación de Dependencias
- [ ] Ejecutar `npm install`
- [ ] Verificar que no haya errores de instalación

### 2. Variables de Entorno

#### Firebase Client (Frontend)
- [ ] `NEXT_PUBLIC_FIREBASE_API_KEY` configurada
- [ ] `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` configurada
- [ ] `NEXT_PUBLIC_FIREBASE_PROJECT_ID` configurada

#### Firebase Admin (Backend)
- [ ] `FIREBASE_PROJECT_ID` configurada
- [ ] `FIREBASE_CLIENT_EMAIL` configurada
- [ ] `FIREBASE_PRIVATE_KEY` configurada (con comillas y `\n`)

#### Groq API
- [ ] `GROQ_API_KEY` configurada

**Archivo:** `.env.local` en la raíz del proyecto

### 3. Firebase Console

#### Firestore Database
- [ ] Base de datos Firestore creada
- [ ] Modo seleccionado (Production o Test)
- [ ] Ubicación del servidor seleccionada
- [ ] Reglas de seguridad configuradas

#### Authentication
- [ ] Authentication habilitado
- [ ] Método Email/Password activado

#### Service Account
- [ ] Clave privada descargada (archivo JSON)
- [ ] Credenciales copiadas a `.env.local`

### 4. Índices de Firestore

- [ ] Índice para `patients` (userId + createdAt)
- [ ] Índice para `reports` (userId + createdAt)
- [ ] Índice para `reports` (patientId + userId + createdAt)

**Nota:** Puedes crearlos automáticamente cuando hagas tu primera query.

## 🧪 Verificación

### 1. Servidor de Desarrollo
```bash
npm run dev
```
- [ ] El servidor inicia sin errores
- [ ] No hay warnings de variables de entorno faltantes

### 2. Test de Firestore
Abre: `http://localhost:3000/api/test-firestore`

- [ ] Respuesta: `"success": true`
- [ ] `"firestoreConnected": true`
- [ ] No hay errores en la consola

### 3. Página Principal
Abre: `http://localhost:3000`

- [ ] La página carga correctamente
- [ ] El navbar se muestra
- [ ] No hay errores en la consola del navegador

### 4. Autenticación
- [ ] Puedes acceder a `/register`
- [ ] Puedes crear una cuenta nueva
- [ ] Puedes iniciar sesión en `/login`
- [ ] El navbar muestra tu email/nombre

### 5. Gestión de Pacientes
Abre: `http://localhost:3000/pacientes`

- [ ] La página carga correctamente
- [ ] No hay advertencias de Firestore
- [ ] Puedes hacer clic en "Nuevo Paciente"
- [ ] El modal se abre correctamente

### 6. Crear Paciente
- [ ] Completa el formulario con datos de prueba
- [ ] Haz clic en "Crear Paciente"
- [ ] El paciente aparece en la lista
- [ ] No hay errores en la consola

### 7. Ver Ficha del Paciente
- [ ] Haz clic en "Ver Ficha" de un paciente
- [ ] La página `/pacientes/[id]` carga correctamente
- [ ] Se muestran los datos del paciente
- [ ] La sección de reportes está vacía (por ahora)

### 8. Crear Reporte para Paciente
- [ ] Desde la ficha del paciente, haz clic en "Nuevo Reporte"
- [ ] Eres redirigido a `/` con el banner del paciente
- [ ] Sube un archivo de audio/video de prueba (.mp3 o .mp4)
- [ ] El análisis se completa sin errores
- [ ] El reporte se guarda correctamente
- [ ] Eres redirigido de vuelta a la ficha del paciente
- [ ] El reporte aparece en la lista del paciente

### 9. Editar Reporte
- [ ] Haz clic en "Editar" en un reporte
- [ ] La página de edición carga con los datos
- [ ] Puedes modificar los campos
- [ ] Los cambios se guardan correctamente

### 10. Eliminar Reporte
- [ ] Haz clic en "Eliminar" en un reporte
- [ ] Aparece el diálogo de confirmación
- [ ] El reporte se elimina correctamente

### 11. Editar Paciente
- [ ] Desde la ficha del paciente, haz clic en "Editar"
- [ ] El modal se abre con los datos actuales
- [ ] Puedes modificar los campos
- [ ] Los cambios se guardan correctamente

### 12. Eliminar Paciente
- [ ] Desde la lista de pacientes, haz clic en "Eliminar"
- [ ] Aparece el diálogo de confirmación
- [ ] El paciente se elimina correctamente
- [ ] Los reportes asociados también se eliminan

## 🐛 Solución de Problemas

### Si el test de Firestore falla:

1. **Verifica las variables de entorno:**
   ```bash
   # En la consola del servidor, deberías ver:
   # "Firestore configured" (no "Firestore NOT configured")
   ```

2. **Revisa el formato de FIREBASE_PRIVATE_KEY:**
   - Debe estar entre comillas dobles
   - Debe contener `\n` literales (no saltos de línea reales)
   - Ejemplo: `"-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"`

3. **Verifica permisos en Firebase:**
   - La cuenta de servicio debe tener permisos de "Firebase Admin SDK Administrator Service Agent"

4. **Reinicia el servidor:**
   ```bash
   # Ctrl+C para detener
   npm run dev
   ```

### Si no puedes crear pacientes:

1. **Verifica que estés autenticado:**
   - Debes haber iniciado sesión
   - El navbar debe mostrar tu email

2. **Revisa las reglas de Firestore:**
   - Deben permitir escritura cuando `request.auth.uid == request.resource.data.userId`

3. **Verifica la consola del navegador:**
   - Busca errores de red o permisos
   - Anota el mensaje de error completo

### Si las queries fallan por falta de índices:

1. **Haz clic en el enlace del error:**
   - Firestore te dará un enlace directo para crear el índice

2. **Espera a que el índice se construya:**
   - Puede tardar 1-5 minutos
   - Refresca la página después

## 📚 Recursos de Ayuda

- **Guía de configuración completa:** [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)
- **Índices de Firestore:** [FIRESTORE_INDEXES.md](./FIRESTORE_INDEXES.md)
- **README principal:** [README.md](./README.md)
- **Documentación de Firebase:** https://firebase.google.com/docs
- **Documentación de Groq:** https://console.groq.com/docs

## ✨ Todo Listo

Si todos los checkboxes están marcados, ¡tu aplicación está completamente configurada y lista para usar!

Puedes empezar a:
- 👥 Gestionar pacientes
- 📊 Generar reportes con IA
- 🎙️ Transcribir reuniones
- 📝 Editar y organizar información

**¡Disfruta de FocusMeet AI!** 🚀
