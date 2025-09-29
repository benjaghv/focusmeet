import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { getDb, verifyRequestAndGetUid } from '@/lib/firebaseAdmin';
 
export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const uid = await verifyRequestAndGetUid(request);
    if (!uid) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const { filename } = await params;
    if (!filename) {
      return NextResponse.json({ error: 'Nombre de recurso inválido' }, { status: 400 });
    }

    // Primero intenta desde Firestore asumiendo que `filename` es el docId
    const db = getDb();
    if (db) {
      try {
        const doc = await db.collection('reports').doc(filename).get();
        if (doc.exists) {
          const data: any = doc.data();
          if (data.userId && data.userId !== uid) {
            return NextResponse.json({ error: 'Prohibido' }, { status: 403 });
          }
          const url = new URL(request.url);
          const download = url.searchParams.get('download');
          const body = JSON.stringify(data, null, 2);

          const headers: Record<string, string> = {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store',
          };
          if (download) {
            headers['Content-Disposition'] = `attachment; filename=${filename}.json`;
          }

          return new NextResponse(body, { status: 200, headers });
        }
      } catch (e) {
        console.warn('Fallo al leer doc Firestore, probar FS:', e);
      }
    }

    // Fallback: leer archivo local (espera nombre con .json)
    if (!filename.endsWith('.json')) {
      return NextResponse.json({ error: 'Nombre de archivo inválido' }, { status: 400 });
    }
    const reportsDir = path.join(process.cwd(), 'reports', uid);
    const filePath = path.join(reportsDir, filename);

    const content = await fs.readFile(filePath, 'utf-8');
    const url = new URL(request.url);
    const download = url.searchParams.get('download');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    };
    if (download) {
      headers['Content-Disposition'] = `attachment; filename=${filename}`;
    }

    return new NextResponse(content, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Error al obtener reporte:', error);
    return NextResponse.json(
      { error: 'No se pudo obtener el reporte solicitado' },
      { status: 404 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const uid = await verifyRequestAndGetUid(request);
    if (!uid) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const { filename } = await params;
    const body = await request.json().catch(() => ({}));
    const { analysis, meta } = body || {};
    if (!analysis && !meta) {
      return NextResponse.json({ error: 'Nada para actualizar' }, { status: 400 });
    }

    const db = getDb();
    if (db) {
      const ref = db.collection('reports').doc(filename);
      const snap = await ref.get();
      if (snap.exists) {
        const data = snap.data() as any;
        if (data.userId && data.userId !== uid) return NextResponse.json({ error: 'Prohibido' }, { status: 403 });
        await ref.update({
          ...(analysis ? { analysis } : {}),
          ...(meta ? { meta } : {}),
          updatedAt: new Date().toISOString(),
        });
        return NextResponse.json({ ok: true, source: 'firestore' });
      }
    }

    // Fallback FS
    if (!filename.endsWith('.json')) return NextResponse.json({ error: 'Nombre de archivo inválido' }, { status: 400 });
    const reportsDir = path.join(process.cwd(), 'reports', uid);
    const filePath = path.join(reportsDir, filename);
    const content = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(content);
    const updated = {
      ...data,
      ...(analysis ? { analysis } : {}),
      ...(meta ? { meta } : {}),
      updatedAt: new Date().toISOString(),
    };
    await fs.writeFile(filePath, JSON.stringify(updated, null, 2), 'utf-8');
    return NextResponse.json({ ok: true, source: 'fs' });
  } catch (error) {
    console.error('PATCH reporte error:', error);
    return NextResponse.json({ error: 'No se pudo actualizar' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const uid = await verifyRequestAndGetUid(request);
    if (!uid) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const { filename } = await params;

    const db = getDb();
    if (db) {
      const ref = db.collection('reports').doc(filename);
      const snap = await ref.get();
      if (snap.exists) {
        const data = snap.data() as any;
        if (data.userId && data.userId !== uid) return NextResponse.json({ error: 'Prohibido' }, { status: 403 });
        await ref.delete();
        return NextResponse.json({ ok: true, source: 'firestore' });
      }
    }

    if (!filename.endsWith('.json')) return NextResponse.json({ error: 'Nombre de archivo inválido' }, { status: 400 });
    const reportsDir = path.join(process.cwd(), 'reports', uid);
    const filePath = path.join(reportsDir, filename);
    await fs.unlink(filePath);
    return NextResponse.json({ ok: true, source: 'fs' });
  } catch (error) {
    console.error('DELETE reporte error:', error);
    return NextResponse.json({ error: 'No se pudo eliminar' }, { status: 500 });
  }
}
