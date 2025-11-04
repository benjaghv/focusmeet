import { NextRequest, NextResponse } from 'next/server';
import { getDb, getFirebaseApp } from '@/lib/firebaseAdmin';
import { getAuth } from 'firebase-admin/auth';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const app = getFirebaseApp();
    if (!app) {
      return NextResponse.json({ error: 'Firebase no configurado' }, { status: 500 });
    }

    const token = authHeader.substring(7);
    const decodedToken = await getAuth(app).verifyIdToken(token);
    const userId = decodedToken.uid;

    const body = await req.json();
    const { rating, comment } = body;

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating inválido' }, { status: 400 });
    }

    const db = getDb();
    if (!db) {
      return NextResponse.json({ error: 'Base de datos no disponible' }, { status: 500 });
    }

    const feedbackRef = db.collection('feedback').doc();

    await feedbackRef.set({
      userId,
      userEmail: decodedToken.email,
      rating,
      comment: comment || '',
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Feedback guardado exitosamente',
      id: feedbackRef.id 
    });
  } catch (error) {
    console.error('Error guardando feedback:', error);
    return NextResponse.json(
      { error: 'Error al guardar el feedback' },
      { status: 500 }
    );
  }
}
