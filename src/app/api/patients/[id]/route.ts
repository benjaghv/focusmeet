import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { getDb, verifyRequestAndGetUid } from '@/lib/firebaseAdmin';
import type { Patient } from '../route';

export const runtime = 'nodejs';

const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
const patientsDir = path.join(process.cwd(), 'patients');

type StoredPatient = Patient & { id: string };

async function readPatientsFromFs(uid: string): Promise<StoredPatient[]> {
  try {
    await fs.mkdir(patientsDir, { recursive: true });
    const filePath = path.join(patientsDir, `${uid}.json`);
    const content = await fs.readFile(filePath, 'utf-8').catch(() => '[]');
    const parsed = JSON.parse(content) as StoredPatient[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writePatientsToFs(uid: string, patients: StoredPatient[]) {
  await fs.mkdir(patientsDir, { recursive: true });
  const filePath = path.join(patientsDir, `${uid}.json`);
  await fs.writeFile(filePath, JSON.stringify(patients, null, 2), 'utf-8');
}

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
      if (isProd) {
        return NextResponse.json({ error: 'Base de datos no configurada' }, { status: 500 });
      }
      const patients = await readPatientsFromFs(uid);
      const patient = patients.find((p) => p.id === id);
      if (!patient) {
        return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 });
      }
      if (patient.userId !== uid) {
        return NextResponse.json({ error: 'Prohibido' }, { status: 403 });
      }
      return NextResponse.json(patient);
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
    if (db) {
      const ref = db.collection('patients').doc(id);
      const snap = await ref.get();

      if (!snap.exists) {
        return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 });
      }

      const data = snap.data() as PatientDoc;
      
      if (data.userId && data.userId !== uid) {
        return NextResponse.json({ error: 'Prohibido' }, { status: 403 });
      }

      const updateData: Record<string, unknown> = {
        nombre: nombre.trim(),
        updatedAt: new Date().toISOString(),
      };
      
      if (edad) updateData.edad = parseInt(edad);
      if (telefono?.trim()) updateData.telefono = telefono.trim();
      if (email?.trim()) updateData.email = email.trim();
      if (diagnostico?.trim()) updateData.diagnostico = diagnostico.trim();
      if (notas?.trim()) updateData.notas = notas.trim();

      await ref.update(updateData);
      
      return NextResponse.json({ ok: true });
    }

    if (isProd) {
      return NextResponse.json({ error: 'Base de datos no configurada' }, { status: 500 });
    }

    const patients = await readPatientsFromFs(uid);
    const idx = patients.findIndex((p) => p.id === id);
    if (idx === -1) {
      return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 });
    }
    if (patients[idx].userId !== uid) {
      return NextResponse.json({ error: 'Prohibido' }, { status: 403 });
    }

    const updated: StoredPatient = {
      ...patients[idx],
      nombre: nombre.trim(),
      edad: edad ? parseInt(edad) : undefined,
      telefono: telefono?.trim() || undefined,
      email: email?.trim() || undefined,
      diagnostico: diagnostico?.trim() || undefined,
      notas: notas?.trim() || undefined,
      updatedAt: new Date().toISOString(),
    };
    patients[idx] = updated;
    await writePatientsToFs(uid, patients);

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
    
    if (db) {
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
    }

    if (isProd) {
      return NextResponse.json({ error: 'Base de datos no configurada' }, { status: 500 });
    }

    const patients = await readPatientsFromFs(uid);
    const patient = patients.find((p) => p.id === id);
    if (!patient) {
      return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 });
    }
    if (patient.userId !== uid) {
      return NextResponse.json({ error: 'Prohibido' }, { status: 403 });
    }

    const remaining = patients.filter((p) => p.id !== id);
    await writePatientsToFs(uid, remaining);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error al eliminar paciente:', error);
    return NextResponse.json({ error: 'No se pudo eliminar' }, { status: 500 });
  }
}
