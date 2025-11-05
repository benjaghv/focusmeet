import { NextResponse } from 'next/server';
import { getDb, verifyRequestAndGetUid } from '@/lib/firebaseAdmin';

// Tipos compartidos para reportes
interface ReportTask { description: string; responsible: string }
interface ReportAnalysis {
  shortSummary?: string;
  detailedSummary?: string;
  keyPoints?: string[];
  decisions?: string[];
  tasks?: ReportTask[];
}

export async function POST(request: Request) {
  try {
    // Requiere autenticación
    const uid = await verifyRequestAndGetUid(request);
    if (!uid) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { analysis, meta, patientId, format } = body || {};

    if (!analysis) {
      return NextResponse.json(
        { error: 'No se proporcionó el análisis a guardar' },
        { status: 400 }
      );
    }

    if (!patientId) {
      return NextResponse.json(
        { error: 'Debe asociar el reporte a un paciente' },
        { status: 400 }
      );
    }

    const createdAt = new Date();

    // Generar un título humano a partir del análisis
    interface ReportTask { description: string; responsible: string }
    interface ReportAnalysis {
      shortSummary?: string;
      detailedSummary?: string;
      keyPoints?: string[];
      decisions?: string[];
      tasks?: ReportTask[];
    }
    const deriveTitle = (a: ReportAnalysis | null | undefined): string => {
      if (!a) return 'Reporte sin título';
      const s: string = a.shortSummary || '';
      if (s) {
        const firstSentence = s.split(/[\.\!\?]/)[0]?.trim();
        if (firstSentence) return firstSentence.slice(0, 80);
      }
      const kp: string[] = Array.isArray(a.keyPoints) ? a.keyPoints : [];
      if (kp.length) return kp[0].slice(0, 80);
      const dec: string[] = Array.isArray(a.decisions) ? a.decisions : [];
      if (dec.length) return dec[0].slice(0, 80);
      return 'Reporte de reunión';
    };

    const title = deriveTitle(analysis);

    const payload = {
      createdAt: createdAt.toISOString(),
      analysis,
      meta: meta || {},
      userId: uid,
      title,
      version: 1,
      patientId,
      format: format || 'soap',
    };

    // Guardar SOLO en Firestore (sin archivos locales)
    const db = getDb();
    console.log('getDb() result:', db ? 'Firestore configured' : 'Firestore NOT configured');
    
    if (!db) {
      return NextResponse.json(
        { error: 'Firestore no está configurado' },
        { status: 500 }
      );
    }

    try {
      console.log('Attempting to save to Firestore...');
      const docRef = await db.collection('reports').add(payload);
      const firestoreId = docRef.id;
      console.log('Successfully saved to Firestore with ID:', firestoreId);
      
      return NextResponse.json({ ok: true, filename: firestoreId, id: firestoreId, title });
    } catch (e) {
      console.error('Error al guardar en Firestore:', e);
      return NextResponse.json(
        { error: 'No se pudo guardar el reporte en Firestore' },
        { status: 500 }
      );
    }
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

    // Listar SOLO desde Firestore
    const db = getDb();
    console.log('GET reports - getDb() result:', db ? 'Firestore configured' : 'Firestore NOT configured');
    
    if (!db) {
      return NextResponse.json(
        { error: 'Firestore no está configurado' },
        { status: 500 }
      );
    }

    try {
      console.log('Attempting to list from Firestore for user:', uid);
      const snap = await db
        .collection('reports')
        .where('userId', '==', uid)
        .limit(100)
        .get();
      
      type ReportDoc = {
        createdAt?: string;
        title?: string | null;
        analysis?: ReportAnalysis;
        decisions?: string[];
        tasks?: ReportTask[];
        meta?: Record<string, unknown>;
        format?: string;
        patientId?: string;
      };
      
      // Obtener nombres de pacientes
      const patientIds = new Set<string>();
      snap.docs.forEach(doc => {
        const data = doc.data() as ReportDoc;
        if (data.patientId) patientIds.add(data.patientId);
      });
      
      const patientNames: Record<string, string> = {};
      if (patientIds.size > 0) {
        try {
          const patientsSnap = await db.collection('patients').where('__name__', 'in', Array.from(patientIds)).get();
          patientsSnap.docs.forEach(doc => {
            const data = doc.data();
            patientNames[doc.id] = data.nombre || 'Paciente sin nombre';
          });
        } catch (e) {
          console.warn('Error al obtener nombres de pacientes:', e);
        }
      }
      
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
          format: data.format || 'soap',
          patientId: data.patientId || null,
          patientName: data.patientId ? patientNames[data.patientId] || null : null,
        };
      }).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      
      return NextResponse.json(items);
    } catch (e) {
      console.error('Error al listar reportes desde Firestore:', e);
      return NextResponse.json(
        { error: 'Error al listar reportes' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error al listar reportes:', error);
    return NextResponse.json(
      { error: 'Error al listar reportes' },
      { status: 500 }
    );
  }
}
