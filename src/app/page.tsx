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
  const { user, loading: authLoading, getToken } = useAuth();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [progressStatus, setProgressStatus] = useState('Preparando...');
  const [savingReport, setSavingReport] = useState(false);
  const [patientId, setPatientId] = useState<string | null>(null);
  const [patientName, setPatientName] = useState<string | null>(null);
  const [analysisFormat, setAnalysisFormat] = useState<'hpi_ros' | 'soap'>('soap');
  const [patients, setPatients] = useState<Array<{id: string; nombre: string}>>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [loadingPatients, setLoadingPatients] = useState(false);

  const loadPatients = async () => {
    try {
      setLoadingPatients(true);
      const token = await getToken();
      if (!token) {
        console.log('No token, skipping patient load');
        setPatients([]);
        return;
      }
      console.log('Solicitando pacientes...');
      const res = await fetch('/api/patients', {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Respuesta de pacientes:', res.status);
      if (res.ok) {
        const data = await res.json();
        console.log('Datos recibidos:', data);
        console.log('Tipo de datos:', Array.isArray(data) ? 'Array' : typeof data);
        if (Array.isArray(data)) {
          console.log('Primer paciente:', data[0]);
          setPatients(data);
          console.log('Pacientes cargados en estado:', data.length);
        } else {
          console.error('Los datos no son un array:', data);
          setPatients([]);
        }
      } else {
        const errorText = await res.text();
        console.error('Error al cargar pacientes:', res.status, errorText);
      }
    } catch (e) {
      console.error('Error loading patients:', e);
    } finally {
      setLoadingPatients(false);
    }
  };

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
        setSelectedPatientId(pid);
      }
    } catch (e) {
      console.error('Error loading patient:', e);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      loadPatients();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  // Recargar pacientes cuando la ventana vuelve a tener foco
  useEffect(() => {
    const handleFocus = () => {
      console.log('Window focused, reloading patients');
      loadPatients();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debug: Mostrar cuando cambia el estado de pacientes
  useEffect(() => {
    console.log('Estado de pacientes actualizado:', patients);
    console.log('Cantidad de pacientes en estado:', patients.length);
  }, [patients]);

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

    // Validar que haya un paciente seleccionado
    if (!selectedPatientId) {
      toast.error("Debes seleccionar un paciente antes de analizar");
      e.target.value = ''; // Limpiar el input
      return;
    }

    if (!file.type.startsWith('audio/') && !file.type.startsWith('video/')) {
      toast.error("Por favor, sube un archivo de audio (.mp3) o video (.mp4)");
      return;
    }

    setIsAnalyzing(true);
    setPatientId(selectedPatientId); // Asignar el paciente seleccionado
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
      updateProgress(70, `Analizando contenido (formato ${analysisFormat.toUpperCase()})...`);
      const analysisResponse = await fetch('/api/chat/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: transcription.text,
          model: 'llama-3.3-70b-versatile',
          format: analysisFormat
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
          patientId: selectedPatientId || patientId,
          format: analysisFormat,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'No se pudo guardar el reporte');
      }
      const data = await res.json();
      toast.success(`Reporte guardado: ${data.filename}`);
      // Siempre ir a reportes, no a la ficha del paciente
      router.push('/reportes');
    } catch (e) {
      console.error('Error guardando reporte:', e);
      toast.error(e instanceof Error ? e.message : 'Error desconocido al guardar el reporte');
    } finally {
      setSavingReport(false);
    }
  };

  // Resto del componente se mantiene igual...
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 w-full overflow-x-hidden">
      <Navbar />
      <Suspense fallback={null}>
        <PatientParams
          onLoad={(pid) => {
            setPatientId(pid);
            loadPatientName(pid);
          }}
        />
      </Suspense>
      <div className="w-full px-4 sm:px-6 py-20 flex flex-col items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-center w-full max-w-4xl mx-auto">
          {patientName && (
            <div className="mb-6 px-4 py-3 bg-indigo-50 border border-indigo-200 rounded-lg">
              <p className="text-sm text-indigo-800">
                📋 Creando reporte para: <span className="font-semibold">{patientName}</span>
              </p>
            </div>
          )}
          <div className="flex items-center justify-center gap-3 mb-4 px-2">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#00033D]">
              Clinio
            </h1>
            <span className="text-xs sm:text-sm font-semibold text-[#9717FF] bg-[#9717FF]/10 px-3 py-1 rounded-full">BETA</span>
          </div>
          <p className="text-base sm:text-lg text-gray-600 mb-8 sm:mb-12 max-w-2xl mx-auto px-4">
          Analiza tus sesiones médicas de forma inteligente.<br />
          Sube tu grabación y genera reportes clínicos estructurados para seguir la evolución de tus pacientes.
          </p>

          {/* Tarjeta: Selector de formato */}
          <div className="mb-6 bg-white rounded-xl shadow-md p-4 sm:p-6 w-full max-w-2xl mx-auto">
            <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-4 text-left">1. Selecciona el formato de análisis</h3>
            <div className="flex flex-col sm:flex-row bg-gray-50 rounded-lg p-1 border border-gray-200 gap-1 sm:gap-0">
              <button
                onClick={() => setAnalysisFormat('soap')}
                disabled={isAnalyzing}
                className={`px-4 sm:px-6 py-2 rounded-md text-xs sm:text-sm font-medium transition-all duration-200 flex-1 ${
                  analysisFormat === 'soap'
                    ? 'bg-[#0003FF] text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                } ${isAnalyzing ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                SOAP (Médico)
              </button>
              <button
                onClick={() => setAnalysisFormat('hpi_ros')}
                disabled={isAnalyzing}
                className={`px-4 sm:px-6 py-2 rounded-md text-xs sm:text-sm font-medium transition-all duration-200 flex-1 ${
                  analysisFormat === 'hpi_ros'
                    ? 'bg-[#0003FF] text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                } ${isAnalyzing ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                HPI/ROS + PE + A/P
              </button>
            </div>

            {/* Descripción del formato seleccionado */}
            <div className="mt-4 px-4 py-3 bg-indigo-50 rounded-lg border border-indigo-100">
              {analysisFormat === 'soap' ? (
                <p className="text-sm text-gray-700 text-left">
                  <span className="font-semibold text-indigo-700">✓ Formato SOAP:</span> Subjetivo, Objetivo, Análisis y Plan. Ideal para consultas de seguimiento.
                </p>
              ) : (
                <p className="text-sm text-gray-700 text-left">
                  <span className="font-semibold text-indigo-700">✓ Formato HPI/ROS + PE + A/P:</span> Historia detallada, Revisión por Sistemas, Examen Físico y Plan. Ideal para consultas iniciales o exploraciones complejas.
                </p>
              )}
            </div>
          </div>

          {/* Tarjeta: Selector de Paciente */}
          <div className="mb-6 bg-white rounded-xl shadow-md p-4 sm:p-6 w-full max-w-2xl mx-auto">
            <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-4 text-left">
              2. Selecciona el paciente <span className="text-red-500">*</span>
              {patients.length > 0 && <span className="text-xs text-gray-500 ml-2">({patients.length} disponibles)</span>}
            </h3>
            {!authLoading && !user && (
              <div className="mb-4 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  🔐 <strong>Inicia sesión</strong> para ver y seleccionar tus pacientes
                </p>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                disabled={isAnalyzing || loadingPatients}
                className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">
                  {loadingPatients ? 'Cargando pacientes...' : patients.length === 0 ? 'No hay pacientes (crea uno primero)' : 'Selecciona un paciente'}
                </option>
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.nombre}
                  </option>
                ))}
              </select>
              <button
                onClick={() => router.push('/pacientes')}
                className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 text-xs sm:text-sm font-medium whitespace-nowrap"
              >
                + Nuevo Paciente
              </button>
            </div>
            {!selectedPatientId && (
              <p className="mt-3 text-xs text-gray-500 text-left bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
                ⚠️ Debes seleccionar un paciente para poder analizar la sesión
              </p>
            )}
            {loadingPatients && (
              <p className="mt-3 text-xs text-gray-500 text-left">
                Cargando pacientes...
              </p>
            )}
          </div>

          {/* Tarjeta: Botón de subir */}
          <div className="mb-6 bg-white rounded-xl shadow-md p-4 sm:p-6 w-full max-w-2xl mx-auto">
            <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-4 text-left">3. Sube tu archivo de audio o video</h3>
            <div className="relative group">
              <button
                onClick={handleButtonClick}
                disabled={isAnalyzing || !selectedPatientId}
                className={`w-full cursor-pointer px-4 sm:px-8 py-3 sm:py-4 bg-[#0003FF] text-white rounded-lg text-sm sm:text-lg font-semibold shadow-lg transform transition-all duration-300 ${isAnalyzing || !selectedPatientId
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:scale-[1.02] hover:bg-[#00033D] active:scale-[0.98]'
                  }`}
              >
                <div className="flex items-center justify-center gap-2 sm:gap-3">
                  <FaCloudUploadAlt className="text-xl sm:text-2xl" />
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
          </div>

          {/* Barra de progreso */}
          <div className="mt-6 w-full max-w-2xl mx-auto px-2">
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
          detailedSummary: analysisResult.detailedSummary,
          keyPoints: analysisResult.keyPoints,
          decisions: analysisResult.decisions,
          tasks: analysisResult.tasks
        } : {
          summary: "",
          keyPoints: [],
          decisions: [],
          tasks: []
        }}
        format={analysisFormat}
        onSave={handleSaveReport}
        saving={savingReport}
      />
    </div>
  );
}