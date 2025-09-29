// En src/app/api/chat/route.ts
import { NextResponse } from 'next/server';
import { Groq } from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { messages, model = 'llama3-70b-8192' } = await request.json();
    
    const completion = await groq.chat.completions.create({
      messages,
      model,
      temperature: 0.3,
      max_tokens: 2000,
      response_format: { type: "json_object" }
    });

    const content = completion.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No se recibió contenido en la respuesta');
    }

    // Intentar extraer JSON si está envuelto en markdown
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || 
                     content.match(/(\{[\s\S]*\})/);
    
    const jsonContent = jsonMatch ? jsonMatch[1] || jsonMatch[0] : content;
    const parsedContent = JSON.parse(jsonContent.trim());

    return NextResponse.json(parsedContent);

  } catch (error) {
    console.error('Error en la API de chat:', error);
    return NextResponse.json(
      { 
        error: 'Error al procesar la solicitud',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}