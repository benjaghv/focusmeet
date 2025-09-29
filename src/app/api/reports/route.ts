import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { analysis, meta } = body || {};

    if (!analysis) {
      return NextResponse.json(
        { error: 'No se proporcionó el análisis a guardar' },
        { status: 400 }
      );
    }

    const reportsDir = path.join(process.cwd(), 'reports');
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
      version: 1,
    };

    await fs.writeFile(filePath, JSON.stringify(payload, null, 2), 'utf-8');

    return NextResponse.json({ ok: true, filename });
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

export async function GET() {
  try {
    const reportsDir = path.join(process.cwd(), 'reports');
    await fs.mkdir(reportsDir, { recursive: true });

    const files = await fs.readdir(reportsDir);
    const jsonFiles = files.filter(f => f.endsWith('.json'));

    const reports = await Promise.all(
      jsonFiles.map(async (filename) => {
        try {
          const fullPath = path.join(reportsDir, filename);
          const content = await fs.readFile(fullPath, 'utf-8');
          const data = JSON.parse(content) as {
            createdAt?: string;
            analysis?: {
              shortSummary?: string;
              keyPoints?: string[];
              decisions?: string[];
              tasks?: Array<{ description: string; responsible: string }>;
            };
            meta?: Record<string, unknown>;
            version?: number;
          };
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
