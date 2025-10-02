import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { getDb, verifyRequestAndGetUid } from '@/lib/firebaseAdmin';

// Asegura el runtime Node.js para permitir acceso al filesystem en App Router
export const runtime = 'nodejs';

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
    const { analysis, meta, patientId } = body || {};

    if (!analysis) {
      return NextResponse.json(
        { error: 'No se proporcionó el análisis a guardar' },
        { status: 400 }
      );
    }

    const createdAt = new Date();
    const timestamp = createdAt
      .toISOString()
      .replace(/[:.]/g, '-')
      .replace('T', '_')
      .replace('Z', '');

    const filename = `reporte_${timestamp}.json`;
    
    // Solo crear directorios y rutas en desarrollo
    const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
    let filePath = '';
    if (!isProd) {
      const reportsDir = path.join(process.cwd(), 'reports', uid);
      await fs.mkdir(reportsDir, { recursive: true });
      filePath = path.join(reportsDir, filename);
    }

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
      ...(patientId ? { patientId } : {}),
    };

    // Intentar guardar en Firestore si está configurado
    let firestoreId: string | null = null;
    try {
      const db = getDb();
      console.log('getDb() result:', db ? 'Firestore configured' : 'Firestore NOT configured');
      if (db) {
        console.log('Attempting to save to Firestore...');
        const docRef = await db.collection('reports').add(payload);
        firestoreId = docRef.id;
        console.log('Successfully saved to Firestore with ID:', firestoreId);
      } else {
        console.log('Firestore not configured, will use filesystem only');
      }
    } catch (e) {
      console.warn('No se pudo guardar en Firestore, se mantiene sólo FS:', e);
    }

    // Guardar en filesystem como fallback local (solo en desarrollo)
    if (!isProd && filePath) {
      await fs.writeFile(filePath, JSON.stringify(payload, null, 2), 'utf-8');
    }

    // En producción, requerir que Firestore esté configurado
    if (isProd && !firestoreId) {
      return NextResponse.json(
        { error: 'Error de configuración: no se pudo guardar el reporte' },
        { status: 500 }
      );
    }
    
    // Si no hay Firestore configurado, usar el filename del filesystem
    const responseId = firestoreId || filename;
    return NextResponse.json({ ok: true, filename, id: responseId, title });
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
    console.log('GET reports - getDb() result:', db ? 'Firestore configured' : 'Firestore NOT configured');
    if (db) {
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
        }).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        return NextResponse.json(items);
      } catch (e) {
        console.warn('Fallo al listar Firestore, fallback a FS:', e);
      }
    }

    // Fallback: listar desde filesystem local por usuario (solo en desarrollo)
    const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
    if (isProd) {
      // En producción, si no hay Firestore, devolvemos lista vacía segura
      return NextResponse.json([]);
    }
    const reportsDir = path.join(process.cwd(), 'reports', uid);
    await fs.mkdir(reportsDir, { recursive: true });
    const files = await fs.readdir(reportsDir).catch(() => [] as string[]);
    const jsonFiles = files.filter(f => f.endsWith('.json'));
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

    const reports = await Promise.all(
      jsonFiles.map(async (filename) => {
        try {
          const fullPath = path.join(reportsDir, filename);
          const content = await fs.readFile(fullPath, 'utf-8');
          const data = JSON.parse(content) as {
            createdAt?: string;
            title?: string | null;
            analysis?: ReportAnalysis;
            meta?: Record<string, unknown>;
          };
          return {
            filename,
            createdAt: data.createdAt || null,
            title: data.title || deriveTitle(data.analysis),
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
