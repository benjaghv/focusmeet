import { NextResponse } from 'next/server';
import { getDb, getFirebaseApp } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';

/**
 * Endpoint de prueba para verificar la conexión con Firestore
 * Accede a: /api/test-firestore
 */
export async function GET() {
  try {
    // Verificar variables de entorno
    const envCheck = {
      FIREBASE_PROJECT_ID: !!process.env.FIREBASE_PROJECT_ID,
      FIREBASE_CLIENT_EMAIL: !!process.env.FIREBASE_CLIENT_EMAIL,
      FIREBASE_PRIVATE_KEY: !!process.env.FIREBASE_PRIVATE_KEY,
      GROQ_API_KEY: !!process.env.GROQ_API_KEY,
    };

    // Verificar Firebase App
    const app = getFirebaseApp();
    if (!app) {
      return NextResponse.json({
        success: false,
        error: 'Firebase Admin no está configurado',
        envCheck,
        message: 'Verifica que todas las variables de entorno estén configuradas en .env.local',
      }, { status: 500 });
    }

    // Verificar Firestore
    const db = getDb();
    if (!db) {
      return NextResponse.json({
        success: false,
        error: 'Firestore no está disponible',
        envCheck,
        message: 'Firebase App está configurado pero Firestore no está disponible',
      }, { status: 500 });
    }

    // Intentar una operación de lectura simple
    try {
      const testCollection = db.collection('_test_connection');
      const snapshot = await testCollection.limit(1).get();
      
      return NextResponse.json({
        success: true,
        message: '✅ Firestore está correctamente configurado y funcionando',
        envCheck,
        firestoreConnected: true,
        documentsInTest: snapshot.size,
        projectId: process.env.FIREBASE_PROJECT_ID,
      });
    } catch (firestoreError) {
      return NextResponse.json({
        success: false,
        error: 'Error al conectar con Firestore',
        envCheck,
        firestoreError: firestoreError instanceof Error ? firestoreError.message : 'Error desconocido',
        message: 'Firebase está configurado pero hay un error al acceder a Firestore. Verifica los permisos de la cuenta de servicio.',
      }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Error general',
      details: error instanceof Error ? error.message : 'Error desconocido',
      message: 'Error al verificar la configuración de Firebase',
    }, { status: 500 });
  }
}
