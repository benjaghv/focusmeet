// src/lib/audioAnalysis.ts
import axios from 'axios';
import { GroqModel } from './groq';

export interface AnalysisResult {
  shortSummary: string;
  detailedSummary: string;
  keyPoints: string[];
  decisions: string[];
  tasks: Array<{ description: string; responsible: string }>;
  sentiment?: 'positivo' | 'neutral' | 'negativo';
}

// Supported audio formats
export const SUPPORTED_AUDIO_FORMATS = [
  'audio/mp3',
  'audio/wav',
  'audio/mpeg',
  'audio/ogg',
  'audio/webm',
  'audio/m4a',
  'audio/mp4',
  'audio/x-m4a',
  'audio/aac',
  'audio/x-flac',
  'video/mp4',
  'video/quicktime'
];

type AudioProvider = 'assemblyai' | 'whisper' | 'deepgram';

interface TranscriptionResult {
  text: string;
  speakers: Array<{ id: string; name?: string }>;
  segments: Array<{
    text: string;
    start: number;
    end: number;
    speaker: string;
    confidence: number;
  }>;
}

interface TranscriptUtterance {
  speaker: string;
  text: string;
  start: number;
  end: number;
  confidence: number;
}

interface TranscriptResponse {
  id: string;
  status: string;
  text?: string;
  utterances?: TranscriptUtterance[];
  error?: string;
}

// Whisper/OpenAI segment type (subset used)
interface WhisperSegment {
  text: string;
  start: number;
  end: number;
  confidence?: number;
}

// Deepgram word type (subset used)
interface DeepgramWord {
  speaker?: number;
  punctuated_word?: string;
  word: string;
  start: number;
  end: number;
  confidence?: number;
}

export async function transcribeAudio(
  audioBuffer: ArrayBuffer,
  mimeType: string,
  provider: AudioProvider = 'assemblyai'
): Promise<TranscriptionResult> {
  console.log(`Iniciando transcripción con proveedor: ${provider}`);
  
  try {
    const normalizedMimeType = mimeType.toLowerCase();
    if (!SUPPORTED_AUDIO_FORMATS.includes(normalizedMimeType)) {
      throw new Error(`Formato de audio no soportado: ${mimeType}. Formatos soportados: ${SUPPORTED_AUDIO_FORMATS.join(', ')}`);
    }

    if (!audioBuffer || audioBuffer.byteLength === 0) {
      throw new Error('El buffer de audio está vacío');
    }

    const processedAudio = await preprocessAudio(audioBuffer);
    console.log(`Audio preprocesado. Tamaño: ${processedAudio.byteLength} bytes`);

    switch (provider) {
      case 'assemblyai':
        return await transcribeWithAssemblyAI(processedAudio);
      case 'whisper':
        return await transcribeWithWhisper(processedAudio);
      case 'deepgram':
        return await transcribeWithDeepgram(processedAudio);
      default:
        throw new Error(`Proveedor de transcripción no válido: ${provider}`);
    }
  } catch (error) {
    console.error('Error en transcribeAudio:', error);
    throw new Error(`No se pudo procesar el audio: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

async function preprocessAudio(
  buffer: ArrayBuffer
): Promise<ArrayBuffer> {
  // Implementar preprocesamiento de audio si es necesario
  return buffer;
}

async function transcribeWithAssemblyAI(audioBuffer: ArrayBuffer): Promise<TranscriptionResult> {
  try {
    if (!process.env.NEXT_PUBLIC_ASSEMBLYAI_API_KEY) {
      throw new Error('No se encontró la API key de AssemblyAI');
    }

    const API_KEY = process.env.NEXT_PUBLIC_ASSEMBLYAI_API_KEY;
    console.log('Iniciando transcripción con AssemblyAI...');

    // 1. Subir el archivo
    console.log('Subiendo archivo...');
    const uploadResponse = await axios.post<{ upload_url: string }>(
      'https://api.assemblyai.com/v2/upload',
      audioBuffer,
      {
        headers: {
          'Authorization': API_KEY,
          'Content-Type': 'application/octet-stream',
          'Transfer-Encoding': 'chunked'
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity
      }
    );

    const uploadUrl = uploadResponse.data.upload_url;
    if (!uploadUrl) {
      throw new Error('No se pudo obtener la URL del archivo subido');
    }

    // 2. Iniciar transcripción
    console.log('Iniciando transcripción...');
    const transcriptResponse = await axios.post<TranscriptResponse>(
      'https://api.assemblyai.com/v2/transcript',
      {
        audio_url: uploadUrl,
        language_code: 'es',
        speaker_labels: true,
        punctuate: true,
        format_text: true
      },
      {
        headers: {
          'Authorization': API_KEY,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    const transcriptId = transcriptResponse.data.id;
    if (!transcriptId) {
      throw new Error('No se pudo obtener el ID de la transcripción');
    }

    // 3. Esperar a que esté lista
    let transcriptData: TranscriptResponse | null = null;
    let attempts = 0;
    const maxAttempts = 30;

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const statusResponse = await axios.get<TranscriptResponse>(
        `https://api.assemblyai.com/v2/transcript/${transcriptId}`,
        {
          headers: {
            'Authorization': API_KEY,
            'Content-Type': 'application/json'
          }
        }
      );

      transcriptData = statusResponse.data;
      console.log(`Estado (${attempts + 1}/${maxAttempts}):`, transcriptData.status);

      if (transcriptData.status === 'completed') {
        break;
      } else if (transcriptData.status === 'error') {
        throw new Error(`Error en la transcripción: ${transcriptData.error || 'Error desconocido'}`);
      }

      attempts++;
    }

    // Verificar si se obtuvo una respuesta
    if (!transcriptData) {
      throw new Error('No se pudo obtener la respuesta de la transcripción');
    }

    // Verificar el estado final
    if (transcriptData.status !== 'completed') {
      throw new Error(`La transcripción no se completó. Estado final: ${transcriptData.status}`);
    }

    // 4. Procesar la respuesta
    const utterances = transcriptData.utterances || [];
    const speakerIds = new Set(utterances.map(u => u.speaker));
    
    return {
      text: transcriptData.text || '',
      speakers: Array.from(speakerIds).map(id => ({ id, name: `Participante ${id}` })),
      segments: utterances.map(u => ({
        text: u.text,
        start: u.start / 1000,
        end: u.end / 1000,
        speaker: u.speaker,
        confidence: u.confidence || 1.0
      }))
    };

  } catch (error) {
    console.error('Error en transcribeWithAssemblyAI:', error);
    throw new Error(`Error al transcribir con AssemblyAI: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

async function transcribeWithWhisper(audioBuffer: ArrayBuffer): Promise<TranscriptionResult> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('No se encontró la API key de OpenAI');
    }

    const formData = new FormData();
    formData.append('file', new Blob([audioBuffer], { type: 'audio/wav' }), 'audio.wav');
    formData.append('model', 'whisper-1');
    formData.append('response_format', 'verbose_json');
    formData.append('timestamp_granularities[]', 'segment');

    const response = await axios.post(
      'https://api.openai.com/v1/audio/transcriptions',
      formData,
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'multipart/form-data'
        }
      }
    );

    const data = response.data;
    return {
      text: data.text || '',
      speakers: [{ id: 'speaker_0' }],
      segments: (data.segments || []).map((s: WhisperSegment) => ({
        text: s.text,
        start: s.start,
        end: s.end,
        speaker: 'speaker_0',
        confidence: s.confidence || 1.0
      }))
    };
  } catch (error) {
    console.error('Error en transcribeWithWhisper:', error);
    throw new Error(`Error al transcribir con Whisper: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

async function transcribeWithDeepgram(audioBuffer: ArrayBuffer): Promise<TranscriptionResult> {
  try {
    if (!process.env.DEEPGRAM_API_KEY) {
      throw new Error('No se encontró la API key de Deepgram');
    }

    const response = await axios.post(
      'https://api.deepgram.com/v1/listen?model=nova-2&punctuate=true&diarize=true&language=es',
      audioBuffer,
      {
        headers: {
          'Authorization': `Token ${process.env.DEEPGRAM_API_KEY}`,
          'Content-Type': 'audio/wav'
        }
      }
    );

    const data = response.data;
    const speakers = new Set<string>();
    type Segment = TranscriptionResult['segments'][number];
    const segments: Segment[] = [];

    (data.results?.channels?.[0]?.alternatives?.[0]?.words || []).forEach((word: DeepgramWord) => {
      const speaker = `speaker_${word.speaker || 0}`;
      speakers.add(speaker);
      
      segments.push({
        text: word.punctuated_word || word.word,
        start: word.start,
        end: word.end,
        speaker,
        confidence: word.confidence || 1.0
      });
    });

    return {
      text: data.results?.channels?.[0]?.alternatives?.[0]?.transcript || '',
      speakers: Array.from(speakers).map(id => ({ id })),
      segments
    };
  } catch (error) {
    console.error('Error en transcribeWithDeepgram:', error);
    throw new Error(`Error al transcribir con Deepgram: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

export async function analyzeTranscription(
  transcription: TranscriptionResult,
  model: GroqModel = 'llama-3.3-70b-versatile',
  format: 'hpi_ros' | 'soap' = 'soap'
): Promise<AnalysisResult> {
  try {
    const API_KEY = process.env.GROQ_API_KEY;
    if (!API_KEY) {
      throw new Error('No se encontró la clave de API de Groq');
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://focusmeet-ai.vercel.app';
    const apiUrl = `${baseUrl}/api/chat`;

    const systemPrompt = format === 'soap' 
      ? `Eres un asistente médico especializado en generar reportes clínicos siguiendo el formato SOAP (Subjetivo, Objetivo, Análisis, Plan).

Analiza la transcripción de la consulta médica y genera un reporte estructurado en formato JSON.

ESTRUCTURA DEL detailedSummary (OBLIGATORIO):
Debe seguir EXACTAMENTE este formato con las 4 secciones SOAP claramente separadas:

S (SUBJETIVO):
- Motivo de consulta principal
- Síntomas reportados por el paciente
- Historia de la enfermedad actual
- Duración y evolución de los síntomas
- Factores que mejoran o empeoran los síntomas

O (OBJETIVO):
- Signos vitales (PA, FC, temperatura, peso, etc.)
- Hallazgos del examen físico
- Resultados de laboratorio o estudios (si se mencionan)
- Observaciones clínicas del médico

A (ANÁLISIS):
- Impresión diagnóstica principal
- Diagnósticos diferenciales
- Evaluación del estado del paciente
- Interpretación de hallazgos

P (PLAN):
- Tratamiento farmacológico (medicamentos, dosis, frecuencia)
- Tratamiento no farmacológico
- Estudios complementarios solicitados
- Seguimiento programado
- Recomendaciones al paciente

FORMATO JSON REQUERIDO:
{
  "shortSummary": "Resumen ejecutivo de 2-3 líneas con diagnóstico principal y plan",
  "detailedSummary": "S (SUBJETIVO):\\n[Información subjetiva]\\n\\nO (OBJETIVO):\\n[Información objetiva]\\n\\nA (ANÁLISIS):\\n[Diagnóstico e interpretación]\\n\\nP (PLAN):\\n[Tratamiento y seguimiento]",
  "keyPoints": ["Hallazgo relevante 1", "Hallazgo relevante 2", "Hallazgo relevante 3"],
  "decisions": ["Decisión clínica 1", "Decisión clínica 2"],
  "sentiment": "positivo" | "neutral" | "negativo"
}

REGLAS ESTRICTAS:
1. El detailedSummary DEBE tener las 4 secciones: S, O, A, P
2. Cada sección debe estar claramente etiquetada
3. Usa saltos de línea (\\n) para separar secciones
4. Si falta información en alguna sección, escribe "No documentado" en esa sección
5. Sé específico con medicamentos (nombre, dosis, frecuencia)
6. En keyPoints incluye los hallazgos más importantes
7. En decisions incluye las decisiones clínicas tomadas
8. NO incluyas campo "tasks" en este formato
9. Usa terminología médica profesional
10. NO inventes información que no esté en la transcripción`
      : `Eres un asistente médico especializado en generar reportes clínicos siguiendo el formato HPI/ROS + PE + A/P (Historia, Examen Físico, Diagnóstico y Plan).

Este formato es ideal para consultas iniciales o exploraciones complejas en especialidades médicas.

ESTRUCTURA DEL detailedSummary (OBLIGATORIO):
Debe seguir EXACTAMENTE este formato con las 4 secciones claramente separadas:

HPI (HISTORIA DE LA ENFERMEDAD ACTUAL):
- Motivo de consulta principal
- Inicio de los síntomas (cuándo comenzaron)
- Evolución temporal (cómo han progresado)
- Características de los síntomas (localización, intensidad, duración)
- Factores que mejoran o empeoran los síntomas
- Tratamientos previos y su efectividad
- Impacto en actividades diarias

ROS (REVISIÓN POR SISTEMAS):
Solo documentar sistemas mencionados o explorados:
- General: Fiebre, escalofríos, pérdida de peso, fatiga, sudoración
- Cardiovascular: Dolor torácico, palpitaciones, edema, ortopnea
- Respiratorio: Disnea, tos, expectoración, sibilancias, hemoptisis
- Gastrointestinal: Náuseas, vómitos, diarrea, estreñimiento, dolor abdominal, sangrado
- Genitourinario: Disuria, hematuria, frecuencia, urgencia, incontinencia
- Musculoesquelético: Dolor articular, rigidez, limitación de movimiento
- Neurológico: Cefalea, mareos, debilidad, parestesias, alteraciones visuales
- Psiquiátrico: Estado de ánimo, sueño, ansiedad, estrés
- Piel: Erupciones, lesiones, cambios de color

PE (EXAMEN FÍSICO):
- Signos vitales: PA, FC, FR, temperatura, saturación O2, peso, talla
- Apariencia general y estado mental
- Hallazgos por sistemas examinados (cabeza, cuello, tórax, abdomen, extremidades, etc.)
- Hallazgos positivos y negativos relevantes

A/P (ANÁLISIS Y PLAN):
- Impresión diagnóstica principal
- Diagnósticos diferenciales (si aplica)
- Plan terapéutico:
  * Medicamentos (nombre, dosis, vía, frecuencia, duración)
  * Procedimientos o intervenciones
  * Estudios complementarios solicitados
  * Interconsultas
- Seguimiento programado
- Educación al paciente
- Pronóstico

FORMATO JSON REQUERIDO:
{
  "shortSummary": "Resumen ejecutivo de 2-3 líneas con diagnóstico principal y plan",
  "detailedSummary": "HPI (HISTORIA DE LA ENFERMEDAD ACTUAL):\\n[Información detallada]\\n\\nROS (REVISIÓN POR SISTEMAS):\\n[Sistemas explorados]\\n\\nPE (EXAMEN FÍSICO):\\n[Hallazgos del examen]\\n\\nA/P (ANÁLISIS Y PLAN):\\n[Diagnóstico y tratamiento]",
  "keyPoints": ["Hallazgo relevante 1", "Hallazgo relevante 2", "Hallazgo relevante 3"],
  "decisions": ["Decisión clínica 1", "Decisión clínica 2"],
  "sentiment": "positivo" | "neutral" | "negativo"
}

REGLAS ESTRICTAS:
1. El detailedSummary DEBE tener las 4 secciones: HPI, ROS, PE, A/P
2. Cada sección debe estar claramente etiquetada
3. Usa saltos de línea (\\n) para separar secciones
4. Si falta información en alguna sección, escribe "No documentado en la consulta"
5. Sé específico con medicamentos (nombre genérico, dosis, vía, frecuencia)
6. En keyPoints incluye los hallazgos clínicos más importantes
7. En decisions incluye las decisiones terapéuticas tomadas
8. NO incluyas campo "tasks" en este formato
9. Usa terminología médica profesional
10. NO inventes información que no esté en la transcripción
11. Para ROS, si un sistema no fue explorado, no lo menciones
12. Sé exhaustivo en HPI, es la sección más importante`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          { 
            role: 'user', 
            content: `Analiza esta transcripción y genera el reporte en formato JSON:

Transcripción:
${transcription.text}

Recuerda: Responde SOLO con el objeto JSON, sin texto adicional.`
          }
        ],
        model,
        temperature: 0.3,
        max_tokens: 3000
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Error al analizar la transcripción');
    }

    const data = await response.json();
    
    // Asegurarse de que la respuesta tenga el formato esperado
    if (typeof data === 'object' && data !== null) {
      return data as AnalysisResult;
    }

    // Si la respuesta es un string, intentar parsearla como JSON
    if (typeof data === 'string') {
      try {
        const parsedData = JSON.parse(data);
        return parsedData as AnalysisResult;
      } catch (parseError) {
        console.error('Error al analizar la respuesta JSON:', parseError);
      }
    }

    throw new Error('Formato de respuesta inesperado del servidor');

  } catch (error) {
    console.error('Error en analyzeTranscription:', error);
    throw new Error(`No se pudo analizar la transcripción: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}