import { NextResponse } from 'next/server';
import { getDb, verifyRequestAndGetUid } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';

// Tipos para pacientes
export interface Patient {
  id?: string;
  nombre: string;
  edad?: number;
  telefono?: string;
  email?: string;
  diagnostico?: string;
  notas?: string;
  userId: string;
  createdAt: string;
  updatedAt?: string;
}

export async function POST(request: Request) {
  try {
    const uid = await verifyRequestAndGetUid(request);
    if (!uid) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { nombre, edad, telefono, email, diagnostico, notas } = body;

    if (!nombre || nombre.trim() === '') {
      return NextResponse.json(
        { error: 'El nombre del paciente es requerido' },
        { status: 400 }
      );
    }

    const createdAt = new Date().toISOString();
    const patient: Patient = {
      nombre: nombre.trim(),
      edad: edad ? parseInt(edad) : undefined,
      telefono: telefono?.trim() || undefined,
      email: email?.trim() || undefined,
      diagnostico: diagnostico?.trim() || undefined,
      notas: notas?.trim() || undefined,
      userId: uid,
      createdAt,
    };

    // Guardar en Firestore
    const db = getDb();
    if (!db) {
      return NextResponse.json(
        { error: 'Base de datos no configurada' },
        { status: 500 }
      );
    }

    const docRef = await db.collection('patients').add(patient);
    
    return NextResponse.json({ 
      ok: true, 
      id: docRef.id,
      patient: { ...patient, id: docRef.id }
    });
  } catch (error) {
    console.error('Error al crear paciente:', error);
    return NextResponse.json(
      {
        error: 'Error al crear el paciente',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const uid = await verifyRequestAndGetUid(request);
    if (!uid) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const db = getDb();
    if (!db) {
      return NextResponse.json([]);
    }

    const snap = await db
      .collection('patients')
      .where('userId', '==', uid)
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();

    const patients = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json(patients);
  } catch (error) {
    console.error('Error al listar pacientes:', error);
    return NextResponse.json(
      { error: 'Error al listar pacientes' },
      { status: 500 }
    );
  }
}
