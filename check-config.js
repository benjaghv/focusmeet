// Script de diagnóstico para verificar la configuración de Firebase
// Ejecutar con: node check-config.js

console.log('🔍 Verificando configuración de Firebase...\n');

// Verificar variables de entorno del cliente
console.log('📱 Variables del Cliente (Frontend):');
console.log('NEXT_PUBLIC_FIREBASE_API_KEY:', process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? '✅ Configurada' : '❌ Falta');
console.log('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:', process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? '✅ Configurada' : '❌ Falta');
console.log('NEXT_PUBLIC_FIREBASE_PROJECT_ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? '✅ Configurada' : '❌ Falta');

console.log('\n🔐 Variables del Admin (Backend):');
console.log('FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID ? '✅ Configurada' : '❌ Falta');
console.log('FIREBASE_CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL ? '✅ Configurada' : '❌ Falta');
console.log('FIREBASE_PRIVATE_KEY:', process.env.FIREBASE_PRIVATE_KEY ? '✅ Configurada' : '❌ Falta');

console.log('\n🤖 Otras APIs:');
console.log('GROQ_API_KEY:', process.env.GROQ_API_KEY ? '✅ Configurada' : '❌ Falta');

// Verificar si el archivo .env.local existe
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env.local');
const envExists = fs.existsSync(envPath);

console.log('\n📄 Archivo .env.local:', envExists ? '✅ Existe' : '❌ No existe');

if (!envExists) {
  console.log('\n⚠️  PROBLEMA: No se encontró el archivo .env.local');
  console.log('   Solución: Copia env.example a .env.local y completa los valores');
  console.log('   Comando: copy env.example .env.local');
}

// Verificar formato de FIREBASE_PRIVATE_KEY
if (process.env.FIREBASE_PRIVATE_KEY) {
  const key = process.env.FIREBASE_PRIVATE_KEY;
  const hasBegin = key.includes('BEGIN PRIVATE KEY');
  const hasEnd = key.includes('END PRIVATE KEY');
  const hasNewlines = key.includes('\\n');
  
  console.log('\n🔑 Formato de FIREBASE_PRIVATE_KEY:');
  console.log('   Tiene BEGIN:', hasBegin ? '✅' : '❌');
  console.log('   Tiene END:', hasEnd ? '✅' : '❌');
  console.log('   Tiene \\n:', hasNewlines ? '✅' : '❌');
  
  if (!hasBegin || !hasEnd || !hasNewlines) {
    console.log('\n⚠️  PROBLEMA: FIREBASE_PRIVATE_KEY tiene formato incorrecto');
    console.log('   Debe estar entre comillas y mantener los \\n');
    console.log('   Ejemplo: "-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"');
  }
}

console.log('\n' + '='.repeat(60));
console.log('💡 Pasos para solucionar errores 500:');
console.log('='.repeat(60));
console.log('1. Asegúrate de que .env.local existe y tiene todas las variables');
console.log('2. Verifica que FIREBASE_PRIVATE_KEY esté entre comillas');
console.log('3. Reinicia el servidor de desarrollo (npm run dev)');
console.log('4. Revisa la consola del servidor para ver errores específicos');
console.log('5. Verifica que Google Auth esté habilitado en Firebase Console');
console.log('='.repeat(60));
