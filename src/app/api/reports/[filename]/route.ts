import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    if (!filename || !filename.endsWith('.json')) {
      return NextResponse.json({ error: 'Nombre de archivo inválido' }, { status: 400 });
    }

    const reportsDir = path.join(process.cwd(), 'reports');
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
