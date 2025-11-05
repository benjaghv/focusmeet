# 🔴 Solución Error 413 - Archivo Demasiado Grande

## Problema

Al subir un archivo MP4 para transcripción, obtienes:
- **Error 413**: Request Entity Too Large
- **Error en consola**: "Request En..." is not valid JSON

## ✅ Soluciones Implementadas

### 1. Aumentar Límite en Next.js

He actualizado `next.config.ts` para permitir archivos de hasta **100MB**:

```typescript
experimental: {
  serverActions: {
    bodySizeLimit: '100mb',
  },
}
```

### 2. Configuración del Endpoint de Transcripción

Actualizado `/api/chat/transcribe/route.ts`:
- `maxDuration: 300` - Permite hasta 5 minutos de procesamiento
- `runtime: 'nodejs'` - Usa Node.js runtime
- `dynamic: 'force-dynamic'` - Fuerza ejecución dinámica

## 🚀 Pasos para Aplicar los Cambios

### En Local (Development)

1. **Detén el servidor**:
   ```bash
   Ctrl + C
   ```

2. **Reinicia el servidor**:
   ```bash
   npm run dev
   ```

3. **Prueba con tu archivo MP4**

### En Producción (Vercel/Netlify)

Si estás desplegando en Vercel, necesitas configuración adicional:

#### Opción A: Vercel

Crea o actualiza `vercel.json`:

```json
{
  "functions": {
    "api/chat/transcribe.ts": {
      "maxDuration": 300,
      "memory": 3008
    }
  },
  "api": {
    "bodyParser": {
      "sizeLimit": "100mb"
    }
  }
}
```

#### Opción B: Netlify

Crea o actualiza `netlify.toml`:

```toml
[functions]
  node_bundler = "esbuild"

[[functions]]
  path = "api/chat/transcribe"
  node_bundler = "esbuild"
  
[build]
  functions = "netlify/functions"

[build.environment]
  NODE_VERSION = "18"

[[headers]]
  for = "/api/*"
  [headers.values]
    Access-Control-Allow-Origin = "*"
    Access-Control-Allow-Methods = "GET, POST, PUT, DELETE, OPTIONS"
    Access-Control-Allow-Headers = "Content-Type, Authorization"
```

## 📊 Límites Recomendados por Tamaño de Archivo

| Tamaño de Video | Duración Aprox. | Configuración Recomendada |
|-----------------|-----------------|---------------------------|
| < 50 MB | < 5 min | `bodySizeLimit: '50mb'` |
| 50-100 MB | 5-10 min | `bodySizeLimit: '100mb'` |
| 100-200 MB | 10-20 min | `bodySizeLimit: '200mb'` + plan Pro |
| > 200 MB | > 20 min | Usar almacenamiento externo (S3, etc.) |

## 🔧 Solución Alternativa: Comprimir Video

Si el archivo sigue siendo muy grande, puedes comprimirlo antes de subirlo:

### Usando FFmpeg (Recomendado)

```bash
# Instalar FFmpeg
# Windows: choco install ffmpeg
# Mac: brew install ffmpeg
# Linux: sudo apt install ffmpeg

# Comprimir video manteniendo calidad aceptable
ffmpeg -i input.mp4 -vcodec h264 -acodec aac -b:v 1M -b:a 128k output.mp4
```

### Usando HandBrake (GUI)

1. Descarga [HandBrake](https://handbrake.fr/)
2. Abre tu video
3. Selecciona preset "Fast 1080p30"
4. Ajusta calidad a RF 23-25
5. Exporta

## 🌐 Límites de Plataformas

### Vercel
- **Hobby Plan**: 4.5 MB body size, 10s timeout
- **Pro Plan**: 4.5 MB body size, 60s timeout
- **Enterprise**: Personalizable

⚠️ **Importante**: Vercel tiene límites estrictos. Para archivos grandes, considera:
- Usar Vercel Pro/Enterprise
- Subir archivos a S3/Cloudinary primero
- Procesar en background con webhooks

### Netlify
- **Free**: 125 MB deploy size, 10s timeout
- **Pro**: 125 MB deploy size, 26s timeout
- **Business**: Personalizable

### Railway/Render
- Límites más flexibles
- Mejor para procesamiento de archivos grandes
- Configuración más sencilla

## 🎯 Recomendación: Arquitectura para Archivos Grandes

Para archivos > 100MB, usa esta arquitectura:

```
1. Frontend → Sube archivo a S3/Cloudinary
2. S3 → Genera URL firmada
3. Backend → Descarga de S3 y procesa
4. Backend → Guarda resultado
5. Frontend → Recibe notificación
```

### Ejemplo con Cloudinary

```typescript
// Frontend
const uploadToCloudinary = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'tu_preset');
  
  const res = await fetch(
    'https://api.cloudinary.com/v1_1/tu_cloud/video/upload',
    { method: 'POST', body: formData }
  );
  
  const data = await res.json();
  return data.secure_url; // URL del video
};

// Backend
const transcribeFromUrl = async (videoUrl: string) => {
  // Descargar y procesar
};
```

## 🐛 Otros Errores Relacionados

### Cross-Origin-Opener-Policy Warning

Este warning es de Firebase Auth y no afecta la funcionalidad. Para eliminarlo:

```typescript
// next.config.ts
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        {
          key: 'Cross-Origin-Opener-Policy',
          value: 'same-origin-allow-popups'
        },
        {
          key: 'Cross-Origin-Embedder-Policy',
          value: 'require-corp'
        }
      ]
    }
  ]
}
```

## ✅ Checklist de Solución

- [x] Aumentar `bodySizeLimit` en `next.config.ts`
- [x] Agregar `maxDuration` en route handler
- [ ] Reiniciar servidor de desarrollo
- [ ] Probar con archivo MP4
- [ ] Si falla, verificar tamaño del archivo
- [ ] Si > 100MB, considerar compresión o S3

## 📞 Ayuda Adicional

Si después de aplicar estos cambios aún tienes problemas:

1. **Verifica el tamaño del archivo**:
   ```javascript
   console.log('Tamaño:', file.size / 1024 / 1024, 'MB');
   ```

2. **Revisa los logs del servidor** para ver el error exacto

3. **Considera usar un servicio de almacenamiento externo** para archivos > 100MB

---

**Nota**: Los cambios ya están aplicados. Solo necesitas **reiniciar el servidor** con `npm run dev`.
