import { NextResponse } from 'next/server';
import { transcribeAudio } from '@/lib/audioAnalysis';

// Configuración para permitir archivos grandes
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutos máximo
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  console.log('Iniciando solicitud de transcripción...');
  
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    
    console.log('Archivo recibido:', file ? {
      name: file.name,
      type: file.type,
      size: file.size
    } : 'Ningún archivo recibido');
    
    if (!file) {
      console.error('Error: No se proporcionó ningún archivo');
      return NextResponse.json(
        { error: 'No se proporcionó ningún archivo' },
        { status: 400 }
      );
    }

    console.log('Leyendo archivo...');
    const arrayBuffer = await file.arrayBuffer();
    console.log('Tamaño del buffer:', arrayBuffer.byteLength, 'bytes');

    console.log('Iniciando transcripción...');
    const transcription = await transcribeAudio(
      arrayBuffer,
      file.type,
      'assemblyai'
    );

    console.log('Transcripción completada exitosamente');
    return NextResponse.json(transcription);
  } catch (error) {
    console.error('Error en la ruta de transcripción:', error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Error desconocido al procesar la solicitud';
    
    console.error('Detalles del error:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'UnknownError'
    });

    return NextResponse.json(
      { 
        error: 'Error al transcribir el audio',
        details: errorMessage,
        stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
      },
      { status: 500 }
    );
  }
}