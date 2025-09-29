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
