# Índices de Firestore Requeridos

Para que la aplicación funcione correctamente en producción, necesitas crear los siguientes índices compuestos en Firestore.

## Índices para la colección `patients`

### 1. Índice para listar pacientes por usuario
- **Colección**: `patients`
- **Campos**:
  - `userId` (Ascending)
  - `createdAt` (Descending)

**Comando de Firebase CLI:**
```bash
firebase firestore:indexes:create patients userId ASC createdAt DESC
```

## Índices para la colección `reports`

### 1. Índice para listar reportes por usuario
- **Colección**: `reports`
- **Campos**:
  - `userId` (Ascending)
  - `createdAt` (Descending)

**Comando de Firebase CLI:**
```bash
firebase firestore:indexes:create reports userId ASC createdAt DESC
```

### 2. Índice para listar reportes por paciente
- **Colección**: `reports`
- **Campos**:
  - `patientId` (Ascending)
  - `userId` (Ascending)
  - `createdAt` (Descending)

**Comando de Firebase CLI:**
```bash
firebase firestore:indexes:create reports patientId ASC userId ASC createdAt DESC
```

## Creación Manual en Firebase Console

Si prefieres crear los índices manualmente:

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Ve a **Firestore Database** → **Indexes**
4. Haz clic en **Create Index**
5. Configura cada índice según las especificaciones anteriores

## Nota Importante

Cuando ejecutes la aplicación por primera vez y hagas queries que requieran estos índices, Firestore te mostrará un error con un enlace directo para crear el índice automáticamente. Puedes hacer clic en ese enlace para crear el índice de forma rápida.

Los índices pueden tardar unos minutos en construirse después de crearlos.
