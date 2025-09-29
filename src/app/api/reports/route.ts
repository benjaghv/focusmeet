import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { getDb, verifyRequestAndGetUid } from '@/lib/firebaseAdmin';

// Asegura el runtime Node.js para permitir acceso al filesystem en App Router
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    // Requiere autenticación
    const uid = await verifyRequestAndGetUid(request);
    if (!uid) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { analysis, meta } = body || {};

    if (!analysis) {
      return NextResponse.json(
        { error: 'No se proporcionó el análisis a guardar' },
        { status: 400 }
      );
    }

    const reportsDir = path.join(process.cwd(), 'reports', uid);
    await fs.mkdir(reportsDir, { recursive: true });

    const createdAt = new Date();
    const timestamp = createdAt
      .toISOString()
      .replace(/[:.]/g, '-')
      .replace('T', '_')
      .replace('Z', '');

    const filename = `reporte_${timestamp}.json`;
    const filePath = path.join(reportsDir, filename);

    const payload = {
      createdAt: createdAt.toISOString(),
      analysis,
      meta: meta || {},
      userId: uid,
      version: 1,
    };

    // Intentar guardar en Firestore si está configurado
    let firestoreId: string | null = null;
    try {
      const db = getDb();
      if (db) {
        const docRef = await db.collection('reports').add(payload);
        firestoreId = docRef.id;
      }
    } catch (e) {
      console.warn('No se pudo guardar en Firestore, se mantiene sólo FS:', e);
    }

    // Guardar siempre en filesystem como fallback local
    await fs.writeFile(filePath, JSON.stringify(payload, null, 2), 'utf-8');

    return NextResponse.json({ ok: true, filename, id: firestoreId });
  } catch (error) {
    console.error('Error al guardar el reporte:', error);
    return NextResponse.json(
      {
        error: 'Error al guardar el reporte',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    // Requiere autenticación
    const uid = await verifyRequestAndGetUid(request);
    if (!uid) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Intentar listar desde Firestore (solo del usuario)
    const db = getDb();
    if (db) {
      try {
        const snap = await db
          .collection('reports')
          .where('userId', '==', uid)
          .orderBy('createdAt', 'desc')
          .limit(50)
          .get();
        const items = snap.docs.map((doc) => {
          const data = doc.data() as any;
          return {
            filename: doc.id,
            createdAt: data.createdAt || null,
            summary: data.analysis?.shortSummary || '',
            decisions: data.analysis?.decisions || [],
            tasksCount: data.analysis?.tasks?.length || 0,
            meta: data.meta || {},
          };
        });
        return NextResponse.json(items);
      } catch (e) {
        console.warn('Fallo al listar Firestore, fallback a FS:', e);
      }
    }

    // Fallback: listar desde filesystem local por usuario
    const reportsDir = path.join(process.cwd(), 'reports', uid);
    await fs.mkdir(reportsDir, { recursive: true });
    const files = await fs.readdir(reportsDir).catch(() => [] as string[]);
    const jsonFiles = files.filter(f => f.endsWith('.json'));
    const reports = await Promise.all(
      jsonFiles.map(async (filename) => {
        try {
          const fullPath = path.join(reportsDir, filename);
          const content = await fs.readFile(fullPath, 'utf-8');
          const data = JSON.parse(content) as any;
          return {
            filename,
            createdAt: data.createdAt || null,
            summary: data.analysis?.shortSummary || '',
            decisions: data.analysis?.decisions || [],
            tasksCount: data.analysis?.tasks?.length || 0,
            meta: data.meta || {},
          };
        } catch (e) {
          console.warn('No se pudo leer un reporte:', filename, e);
          return null;
        }
      })
    );
    const cleaned = reports.filter(Boolean);
    return NextResponse.json(cleaned);
  } catch (error) {
    console.error('Error al listar reportes:', error);
    return NextResponse.json(
      { error: 'Error al listar reportes' },
      { status: 500 }
    );
  }
}
