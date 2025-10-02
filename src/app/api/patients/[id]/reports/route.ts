import { NextRequest, NextResponse } from 'next/server';
import { getDb, verifyRequestAndGetUid } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';

type ReportTask = { description: string; responsible: string };
type ReportAnalysis = {
  shortSummary?: string;
  detailedSummary?: string;
  keyPoints?: string[];
  decisions?: string[];
  tasks?: ReportTask[];
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

    const { id: patientId } = await params;
    
    const db = getDb();
    if (!db) {
      return NextResponse.json([]);
    }

    // Verificar que el paciente pertenece al usuario
    const patientDoc = await db.collection('patients').doc(patientId).get();
    if (!patientDoc.exists) {
      return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 });
    }

    const patientData = patientDoc.data();
    if (patientData?.userId !== uid) {
      return NextResponse.json({ error: 'Prohibido' }, { status: 403 });
    }

    // Obtener reportes del paciente
    const snap = await db
      .collection('reports')
      .where('patientId', '==', patientId)
      .where('userId', '==', uid)
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();

    type ReportDoc = {
      createdAt?: string;
      title?: string | null;
      analysis?: ReportAnalysis;
      meta?: Record<string, unknown>;
    };

    const items = snap.docs.map((doc) => {
      const data = doc.data() as ReportDoc;
      return {
        filename: doc.id,
        createdAt: data.createdAt || null,
        title: data.title || null,
        summary: data.analysis?.shortSummary || '',
        decisions: data.analysis?.decisions || [],
        tasksCount: data.analysis?.tasks?.length || 0,
        meta: data.meta || {},
      };
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error('Error al listar reportes del paciente:', error);
    return NextResponse.json(
      { error: 'Error al listar reportes' },
      { status: 500 }
    );
  }
}
