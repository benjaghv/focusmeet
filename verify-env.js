// Script para verificar el archivo .env.local
// Ejecutar con: node verify-env.js

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando archivo .env.local...\n');

const envPath = path.join(__dirname, '.env.local');

if (!fs.existsSync(envPath)) {
  console.log('❌ ERROR: No se encontró el archivo .env.local');
  console.log('📝 Solución: Copia env.example a .env.local');
  console.log('   Comando: copy env.example .env.local\n');
  process.exit(1);
}

console.log('✅ Archivo .env.local encontrado\n');

// Leer el contenido
const content = fs.readFileSync(envPath, 'utf-8');
const lines = content.split('\n');

// Variables requeridas
const required = {
  'NEXT_PUBLIC_FIREBASE_API_KEY': 'Firebase API Key (Frontend)',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN': 'Firebase Auth Domain (Frontend)',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID': 'Firebase Project ID (Frontend)',
  'FIREBASE_PROJECT_ID': 'Firebase Project ID (Backend)',
  'FIREBASE_CLIENT_EMAIL': 'Firebase Client Email (Backend)',
  'FIREBASE_PRIVATE_KEY': 'Firebase Private Key (Backend)',
  'GROQ_API_KEY': 'Groq API Key (para transcripción)',
};

const found = {};
const missing = [];

// Parsear el archivo
lines.forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...valueParts] = trimmed.split('=');
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').trim();
      found[key.trim()] = value;
    }
  }
});

console.log('📋 Estado de las variables:\n');

// Verificar cada variable requerida
Object.keys(required).forEach(key => {
  const value = found[key];
  const description = required[key];
  
  if (!value || value === 'tu_api_key_aqui' || value === 'tu_proyecto_id' || value.includes('tu_')) {
    console.log(`❌ ${key}`);
    console.log(`   ${description}`);
    console.log(`   Estado: ${value ? 'Valor por defecto (cambiar)' : 'No configurada'}\n`);
    missing.push(key);
  } else {
    console.log(`✅ ${key}`);
    console.log(`   ${description}`);
    if (key === 'FIREBASE_PRIVATE_KEY') {
      const hasQuotes = value.startsWith('"') && value.endsWith('"');
      const hasBegin = value.includes('BEGIN PRIVATE KEY');
      const hasEnd = value.includes('END PRIVATE KEY');
      console.log(`   Formato: ${hasQuotes ? '✅ Comillas' : '❌ Sin comillas'} | ${hasBegin && hasEnd ? '✅ Válida' : '❌ Incompleta'}`);
    } else {
      console.log(`   Valor: ${value.substring(0, 20)}...`);
    }
    console.log();
  }
});

console.log('='.repeat(70));

if (missing.length === 0) {
  console.log('✅ ¡Todas las variables están configuradas!');
  console.log('\n📝 Próximos pasos:');
  console.log('1. Reinicia el servidor: npm run dev');
  console.log('2. Prueba el login en: http://localhost:3000/login');
  console.log('3. Revisa la consola del servidor para ver si hay errores');
} else {
  console.log(`❌ Faltan ${missing.length} variable(s) por configurar:`);
  missing.forEach(key => console.log(`   - ${key}`));
  console.log('\n📝 Pasos para obtener las credenciales:');
  console.log('1. Ve a: https://console.firebase.google.com/');
  console.log('2. Selecciona tu proyecto');
  console.log('3. Project Settings > General (para variables NEXT_PUBLIC_*)');
  console.log('4. Project Settings > Service Accounts > Generate new private key');
  console.log('\n📚 Más info en: SOLUCION_ERROR_500.md');
}

console.log('='.repeat(70));
