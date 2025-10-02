import { NextRequest, NextResponse } from 'next/server';
import { getDb, verifyRequestAndGetUid } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';

type PatientDoc = {
  userId?: string;
  nombre?: string;
  edad?: number;
  telefono?: string;
  email?: string;
  diagnostico?: string;
  notas?: string;
  createdAt?: string;
  updatedAt?: string;
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const uid = await verifyRequestAndGetUid(request);
    if (!uid) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const db = getDb();
    if (!db) {
      return NextResponse.json({ error: 'Base de datos no configurada' }, { status: 500 });
    }

    const doc = await db.collection('patients').doc(id).get();
    
    if (!doc.exists) {
      return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 });
    }

    const data = doc.data() as PatientDoc;
    
    if (data.userId && data.userId !== uid) {
      return NextResponse.json({ error: 'Prohibido' }, { status: 403 });
    }

    return NextResponse.json({ id: doc.id, ...data });
  } catch (error) {
    console.error('Error al obtener paciente:', error);
    return NextResponse.json(
      { error: 'No se pudo obtener el paciente' },
      { status: 404 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const uid = await verifyRequestAndGetUid(request);
    if (!uid) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { nombre, edad, telefono, email, diagnostico, notas } = body;

    if (!nombre || nombre.trim() === '') {
      return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 });
    }

    const db = getDb();
    if (!db) {
      return NextResponse.json({ error: 'Base de datos no configurada' }, { status: 500 });
    }

    const ref = db.collection('patients').doc(id);
    const snap = await ref.get();

    if (!snap.exists) {
      return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 });
    }

    const data = snap.data() as PatientDoc;
    
    if (data.userId && data.userId !== uid) {
      return NextResponse.json({ error: 'Prohibido' }, { status: 403 });
    }

    const updateData: Partial<PatientDoc> = {
      nombre: nombre.trim(),
      edad: edad ? parseInt(edad) : undefined,
      telefono: telefono?.trim() || undefined,
      email: email?.trim() || undefined,
      diagnostico: diagnostico?.trim() || undefined,
      notas: notas?.trim() || undefined,
      updatedAt: new Date().toISOString(),
    };

    await ref.update(updateData);
    
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error al actualizar paciente:', error);
    return NextResponse.json({ error: 'No se pudo actualizar' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const uid = await verifyRequestAndGetUid(request);
    if (!uid) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const db = getDb();
    
    if (!db) {
      return NextResponse.json({ error: 'Base de datos no configurada' }, { status: 500 });
    }

    const ref = db.collection('patients').doc(id);
    const snap = await ref.get();

    if (!snap.exists) {
      return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 });
    }

    const data = snap.data() as PatientDoc;
    
    if (data.userId && data.userId !== uid) {
      return NextResponse.json({ error: 'Prohibido' }, { status: 403 });
    }

    // Eliminar también todos los reportes asociados
    const reportsSnap = await db
      .collection('reports')
      .where('patientId', '==', id)
      .where('userId', '==', uid)
      .get();

    const batch = db.batch();
    reportsSnap.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    batch.delete(ref);
    await batch.commit();

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error al eliminar paciente:', error);
    return NextResponse.json({ error: 'No se pudo eliminar' }, { status: 500 });
  }
}
