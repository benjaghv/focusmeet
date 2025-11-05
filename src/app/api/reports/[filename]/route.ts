import { NextRequest, NextResponse } from 'next/server';
import { getDb, verifyRequestAndGetUid } from '@/lib/firebaseAdmin';

type ReportTask = { description: string; responsible: string };
type ReportAnalysis = {
  shortSummary?: string;
  detailedSummary?: string;
  keyPoints?: string[];
  decisions?: string[];
  tasks?: ReportTask[];
};
type ReportDoc = {
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
  title?: string | null;
  analysis?: ReportAnalysis;
  meta?: Record<string, unknown>;
  format?: string;
  patientId?: string;
};

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
          const data = doc.data() as ReportDoc;
          if (data.userId && data.userId !== uid) {
            return NextResponse.json({ error: 'Prohibido' }, { status: 403 });
          }
          
          // Obtener nombre del paciente si existe patientId
          let patientName = null;
          if (data.patientId) {
            try {
              const patientDoc = await db.collection('patients').doc(data.patientId).get();
              if (patientDoc.exists) {
                const patientData = patientDoc.data();
                patientName = patientData?.nombre || null;
              }
            } catch (e) {
              console.warn('Error al obtener nombre del paciente:', e);
            }
          }
          
          const url = new URL(request.url);
          const download = url.searchParams.get('download');
          const responseData = {
            ...data,
            patientName,
          };
          const body = JSON.stringify(responseData, null, 2);

          const headers: Record<string, string> = {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store',
          };
          if (download) {
            headers['Content-Disposition'] = `attachment; filename=${filename}.json`;
          }

          return new NextResponse(body, { status: 200, headers });
        }
        
        // Si no se encontró el documento
        return NextResponse.json({ error: 'Reporte no encontrado' }, { status: 404 });
      } catch (e) {
        console.error('Error al leer reporte desde Firestore:', e);
        return NextResponse.json({ error: 'Error al obtener el reporte' }, { status: 500 });
      }
    }
    
    // Si no hay Firestore configurado
    return NextResponse.json({ error: 'Firestore no está configurado' }, { status: 500 });
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
    if (!db) {
      return NextResponse.json({ error: 'Firestore no está configurado' }, { status: 500 });
    }

    const ref = db.collection('reports').doc(filename);
    const snap = await ref.get();
    
    if (!snap.exists) {
      return NextResponse.json({ error: 'Reporte no encontrado' }, { status: 404 });
    }
    
    const data = snap.data() as ReportDoc;
    if (data.userId && data.userId !== uid) {
      return NextResponse.json({ error: 'Prohibido' }, { status: 403 });
    }
    
    await ref.update({
      ...(analysis ? { analysis } : {}),
      ...(meta ? { meta } : {}),
      updatedAt: new Date().toISOString(),
    });
    
    return NextResponse.json({ ok: true });
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
    if (!db) {
      return NextResponse.json({ error: 'Firestore no está configurado' }, { status: 500 });
    }

    const ref = db.collection('reports').doc(filename);
    const snap = await ref.get();
    
    if (!snap.exists) {
      return NextResponse.json({ error: 'Reporte no encontrado' }, { status: 404 });
    }
    
    const data = snap.data() as ReportDoc;
    if (data.userId && data.userId !== uid) {
      return NextResponse.json({ error: 'Prohibido' }, { status: 403 });
    }
    
    await ref.delete();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('DELETE reporte error:', error);
    return NextResponse.json({ error: 'No se pudo eliminar' }, { status: 500 });
  }
}
