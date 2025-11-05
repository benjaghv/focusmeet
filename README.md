# FocusMeet AI

Sistema de análisis médico con IA para transcripción y generación de reportes clínicos.

## Características

- 🎙️ Transcripción de audio médico con AssemblyAI
- 🤖 Análisis inteligente con Groq AI (Llama 3.3 70B)
- 📋 Generación de reportes en formato SOAP y HPI/ROS
- 👥 Gestión de pacientes con Firestore
- 🔐 Autenticación con Firebase Auth (Google)
- 📊 Exportación de reportes a PDF

## Tecnologías

- **Frontend**: Next.js 15, React 19, TailwindCSS
- **Backend**: Next.js API Routes, Firebase Admin
- **Base de datos**: Firestore
- **IA**: Groq AI, AssemblyAI
- **Deploy**: Vercel

## Documentación

Toda la documentación técnica está en la carpeta [`/docs`](./docs/).

## Variables de Entorno

Copia `.env.example` a `.env.local` y configura las variables necesarias.

## Desarrollo

```bash
npm install
npm run dev
```

## Deploy

El proyecto se despliega automáticamente en Vercel al hacer push a `main`.
