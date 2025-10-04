"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useRef, useState, useEffect, Suspense } from 'react';
import { FaCloudUploadAlt } from 'react-icons/fa';
import Navbar from './components/Navbar';
import AnalysisModal from './components/AnalysisModal';
import { toast } from 'sonner';
import { ProgressBar } from './components/ProgressBar';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';



// Mover esta interfaz a groq.ts si se usa en otros lugares
interface AnalysisResult {
  shortSummary: string;
  detailedSummary: string;
  keyPoints: string[];
  decisions: string[];
  tasks: { description: string; responsible: string }[];
  sentiment?: string;
}

function PatientParams({ onLoad }: { onLoad: (pid: string) => void }) {
  const searchParams = useSearchParams();
  useEffect(() => {
    const pid = searchParams.get('patientId');
    if (pid) onLoad(pid);
  }, [searchParams, onLoad]);
  return null;
}

export default function Home() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getToken } = useAuth();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [progressStatus, setProgressStatus] = useState('Preparando...');
  const [savingReport, setSavingReport] = useState(false);
  const [patientId, setPatientId] = useState<string | null>(null);
  const [patientName, setPatientName] = useState<string | null>(null);

  // Obtener patientId de la URL si existe
  useEffect(() => {
    const pid = searchParams.get('patientId');
    if (pid) {
      setPatientId(pid);
      // Cargar nombre del paciente
      loadPatientName(pid);
    }
  }, [searchParams]);

  const loadPatientName = async (pid: string) => {
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch(`/api/patients/${pid}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPatientName(data.nombre);
      }
    } catch (e) {
      console.error('Error loading patient:', e);
    }
  };

  const updateProgress = (value: number, status: string) => {
    setProgress(value);
    setProgressStatus(status);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/') && !file.type.startsWith('video/')) {
      toast.error("Por favor, sube un archivo de audio (.mp3) o video (.mp4)");
      return;
    }

    setIsAnalyzing(true);
    updateProgress(10, 'Subiendo archivo...');

    try {
      // 1. Subir y transcribir el archivo
      const formData = new FormData();
      formData.append('file', file);

      updateProgress(30, 'Transcribiendo audio...');
      const transcriptionResponse = await fetch('/api/chat/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!transcriptionResponse.ok) {
        const error = await transcriptionResponse.json();
        throw new Error(error.error || 'Error al transcribir el archivo');
      }

      const transcription = await transcriptionResponse.json();
      updateProgress(60, 'Procesando transcripción...');

      // 2. Analizar la transcripción
      updateProgress(70, 'Analizando contenido...');
      const analysisResponse = await fetch('/api/chat/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: transcription.text,
          model: 'llama-3.3-70b-versatile'
        })
      });

      if (!analysisResponse.ok) {
        const error = await analysisResponse.json();
        throw new Error(error.error || 'Error al analizar la transcripción');
      }

      updateProgress(90, 'Generando informe...');
      const result = await analysisResponse.json();

      setAnalysisResult(result);
      updateProgress(100, '¡Análisis completado!');

      // Pequeño retraso para mostrar el 100%
      await new Promise(resolve => setTimeout(resolve, 500));

      setIsModalOpen(true);
      toast.success("¡Análisis completado exitosamente!");
    } catch (error) {
      console.error("Error en el análisis:", error);
      toast.error(error instanceof Error ? error.message : "Error al procesar el archivo");
    } finally {
      setIsAnalyzing(false);
      // Ocultar la barra después de un retraso
      setTimeout(() => {
        setProgress(0);
      }, 1000);
    }
  };

  const handleSaveReport = async () => {
    if (!analysisResult) return;
    try {
      // exigir login
      const token = await getToken();
      if (!token) {
        toast.info('Inicia sesión para guardar tus reportes');
        router.push('/login');
        return;
      }
      setSavingReport(true);
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          analysis: analysisResult,
          meta: {
            source: 'FocusMeet',
            savedAt: new Date().toISOString(),
          },
          ...(patientId ? { patientId } : {}),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'No se pudo guardar el reporte');
      }
      const data = await res.json();
      toast.success(`Reporte guardado: ${data.filename}`);
      // Si hay paciente, volver a su ficha; sino, ir a reportes
      if (patientId) {
        router.push(`/pacientes/${patientId}`);
      } else {
        router.push('/reportes');
      }
    } catch (e) {
      console.error('Error guardando reporte:', e);
      toast.error(e instanceof Error ? e.message : 'Error desconocido al guardar el reporte');
    } finally {
      setSavingReport(false);
    }
  };

  // Resto del componente se mantiene igual...
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50">
      <Navbar />
      <Suspense fallback={null}>
        <PatientParams
          onLoad={(pid) => {
            setPatientId(pid);
            loadPatientName(pid);
          }}
        />
      </Suspense>
      <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-center max-w-2xl mx-auto">
          {patientName && (
            <div className="mb-6 px-4 py-3 bg-indigo-50 border border-indigo-200 rounded-lg">
              <p className="text-sm text-indigo-800">
                📋 Creando reporte para: <span className="font-semibold">{patientName}</span>
              </p>
            </div>
          )}
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            FocusMeet
          </h1>
          <p className="text-xl text-gray-600 mb-12">
            Analiza tus reuniones de Meet o Zoom de forma inteligente. <br />
            Sube tu grabación y obtén insights clave en segundos.
          </p>

          <div className="relative group">
            <button
              onClick={handleButtonClick}
              disabled={isAnalyzing}
              className={`cursor-pointer px-8 py-4 bg-indigo-900 text-white rounded-full text-lg font-semibold shadow-lg transform transition-all duration-300 ${isAnalyzing
                  ? 'opacity-70 cursor-not-allowed'
                  : 'hover:scale-105 hover:bg-indigo-800 active:scale-95'
                }`}
            >
              <div className="flex items-center gap-3">
                <FaCloudUploadAlt className="text-2xl group-hover:animate-bounce" />
                {isAnalyzing ? 'Analizando...' : 'Subir archivo (.mp3 o .mp4)'}
              </div>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".mp3,.mp4"
              className="hidden"
              onChange={handleFileChange}
              disabled={isAnalyzing}
            />
          </div>
          <div className="mt-8">
            {/* Barra de progreso */}
            <ProgressBar
              progress={progress}
              status={progressStatus}
            />
          </div>
        </div>
      </div>

      <AnalysisModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        analysis={analysisResult ? {
          summary: analysisResult.shortSummary,
          keyPoints: analysisResult.keyPoints,
          decisions: analysisResult.decisions,
          tasks: analysisResult.tasks
        } : {
          summary: "",
          keyPoints: [],
          decisions: [],
          tasks: []
        }}
        onSave={handleSaveReport}
        saving={savingReport}
      />
    </div>
  );
}