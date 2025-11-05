import { NextResponse } from 'next/server';
import { analyzeTranscription } from '@/lib/audioAnalysis';
import { GroqModel } from '@/lib/groq';

export async function POST(request: Request) {
  try {
    const { text, model = 'llama-3.3-70b-versatile', format = 'soap' } = await request.json();
    
    if (!text) {
      return NextResponse.json(
        { error: 'No se proporcionó texto para analizar' },
        { status: 400 }
      );
    }

    console.log(`Analizando con formato: ${format}`);

    const analysis = await analyzeTranscription(
      {
        text,
        speakers: [],
        segments: []
      },
      model as GroqModel,
      format as 'hpi_ros' | 'soap'
    );

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Error en el análisis:', error);
    return NextResponse.json(
      { 
        error: 'Error al analizar la transcripción',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}