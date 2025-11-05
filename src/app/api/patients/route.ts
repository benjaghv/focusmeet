import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { getDb, verifyRequestAndGetUid } from '@/lib/firebaseAdmin';

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
      ...(edad ? { edad: parseInt(edad) } : {}),
      ...(telefono?.trim() ? { telefono: telefono.trim() } : {}),
      ...(email?.trim() ? { email: email.trim() } : {}),
      ...(diagnostico?.trim() ? { diagnostico: diagnostico.trim() } : {}),
      ...(notas?.trim() ? { notas: notas.trim() } : {}),
      userId: uid,
      createdAt,
    };

    // Guardar en Firestore
    const db = getDb();
    if (db) {
      try {
        const docRef = await db.collection('patients').add(patient);
        return NextResponse.json({
          ok: true,
          id: docRef.id,
          patient: { ...patient, id: docRef.id },
        });
      } catch (error) {
        console.error('Error al guardar paciente en Firestore:', error);
        if (isProd) {
          return NextResponse.json(
            { error: 'Error al crear el paciente en Firestore' },
            { status: 500 }
          );
        }
        console.warn('Fallback a filesystem en desarrollo');
      }
    }

    if (isProd) {
      return NextResponse.json(
        { error: 'Base de datos no configurada' },
        { status: 500 }
      );
    }

    const existing = await readPatientsFromFs(uid);
    const id = crypto.randomUUID();
    const stored: StoredPatient = { ...patient, id };
    await writePatientsToFs(uid, [stored, ...existing]);
    return NextResponse.json({ ok: true, id, patient: stored, source: 'fs' });
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
    if (db) {
      try {
        const snap = await db
          .collection('patients')
          .where('userId', '==', uid)
          .limit(100)
          .get();

        const patients = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as StoredPatient[];

        // Ordenar por fecha de creación en JavaScript (más recientes primero)
        patients.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();
          return dateB - dateA;
        });

        console.log(`Pacientes encontrados para ${uid}:`, patients.length);
        return NextResponse.json(patients);
      } catch (error) {
        console.error('Error al listar pacientes desde Firestore:', error);
        if (isProd) {
          return NextResponse.json(
            { error: 'Error al listar pacientes desde Firestore' },
            { status: 500 }
          );
        }
        console.warn('Fallback a filesystem en desarrollo');
      }
    }

    if (isProd) {
      return NextResponse.json([]);
    }

    const patients = await readPatientsFromFs(uid);
    return NextResponse.json(patients);
  } catch (error) {
    console.error('Error al listar pacientes:', error);
    return NextResponse.json(
      { error: 'Error al listar pacientes' },
      { status: 500 }
    );
  }
}
