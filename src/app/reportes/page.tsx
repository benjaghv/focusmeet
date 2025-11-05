"use client";

import { useEffect, useState, useCallback } from "react";
import AnalysisModal from "../components/AnalysisModal";
import { useAuth } from "@/lib/useAuth";
import ReportEditModal, { ReportAnalysis } from "../components/ReportEditModal";
import { toast } from "sonner";

type ReportListItem = {
  filename: string;
  createdAt: string | null;
  title?: string | null;
  summary: string;
  decisions: string[];
  tasksCount: number;
  meta: Record<string, unknown>;
  format?: string;
  patientId?: string;
  patientName?: string;
};

export default function ReportesPage() {
  const { user, loading: authLoading, getToken } = useAuth();
  const [reports, setReports] = useState<ReportListItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false); // se marca tras el primer intento
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalAnalysis, setModalAnalysis] = useState<{
    summary: string;
    keyPoints: string[];
    decisions: string[];
    tasks: { description: string; responsible: string }[];
  } | null>(null);
  const [editReportId, setEditReportId] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editModalLoading, setEditModalLoading] = useState(false);
  const [editModalSaving, setEditModalSaving] = useState(false);
  const [editModalAnalysis, setEditModalAnalysis] = useState<ReportAnalysis | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<{ filename: string; title: string } | null>(null);

  // 👇 useCallback para que no cambie en cada render
  const loadReports = useCallback(async () => {
    try {
      // Evitar parpadeo: solo mostramos spinner en la primera carga
      if (!loaded) setLoading(true);
      const token = await getToken();
      if (!token) {
        setReports([]);
        setError(null);
        setLoading(false);
        setLoaded(true);
        return;
      }
      const res = await fetch("/api/reports", {
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        // Si el backend no puede listar (p.ej. prod sin Firestore), mostramos vacío sin error
        setReports([]);
        setError(null);
        setLoaded(true);
        return;
      }
      const data = await res.json();
      setReports(data || []);
      setError(null);
    } catch {
      // Ante cualquier fallo de red, mostramos vacío sin error para evitar parpadeos
      setReports([]);
      setError(null);
    } finally {
      // Primero marcamos como cargado para que la UI deje de mostrar spinner
      setLoaded(true);
      setLoading(false);
    }
  }, [getToken, loaded]); 

  useEffect(() => {
    if (!authLoading) {
      loadReports();
    }
  }, [authLoading, loadReports]); 

  const formatDate = (iso?: string | null) => {
    if (!iso) return "Fecha desconocida";
    try {
      const d = new Date(iso);
      return d.toLocaleString();
    } catch {
      return iso;
    }
  };

  const handleViewReport = async (filename: string) => {
    try {
      const token = await getToken();
      if (!token) {
        toast.error("Debes iniciar sesión para abrir el reporte");
        return;
      }
      const res = await fetch(`/api/reports/${encodeURIComponent(filename)}`, {
        cache: "no-store",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("No se pudo abrir el reporte");
      const data = await res.json();
      const analysis = data.analysis || {};
      setModalAnalysis({
        summary: analysis.shortSummary || "",
        keyPoints: analysis.keyPoints || [],
        decisions: analysis.decisions || [],
        tasks: analysis.tasks || [],
      });
      setIsModalOpen(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error desconocido al abrir el reporte");
    }
  };

  const handleExportPDF = async (filename: string) => {
    try {
      const token = await getToken();
      if (!token) {
        toast.error("Debes iniciar sesión para exportar reportes");
        return;
      }
      
      const res = await fetch(`/api/reports/${encodeURIComponent(filename)}`, {
        cache: "no-store",
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) throw new Error("No se pudo cargar el reporte");
      
      const data = await res.json();
      const analysis = data.analysis || {};
      const format = data.format || 'soap';
      const patientName = data.patientName || 'Paciente sin nombre';
      const createdAt = data.createdAt ? new Date(data.createdAt).toLocaleString() : 'Fecha desconocida';
      
      // Crear ventana de impresión
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error("No se pudo abrir la ventana de impresión. Verifica los permisos del navegador.");
        return;
      }
      
      const formatLabel = format === 'soap' ? 'SOAP' : 'HPI/ROS + PE + A/P';
      
      // Procesar detailedSummary para resaltar secciones
      const processDetailedSummary = (text: string) => {
        if (!text) return '';
        
        // Resaltar secciones SOAP o HPI/ROS
        const processed = text
          // SOAP
          .replace(/^S \(SUBJETIVO\):/gm, '<strong>S (SUBJETIVO):</strong>')
          .replace(/^O \(OBJETIVO\):/gm, '<strong>O (OBJETIVO):</strong>')
          .replace(/^A \(ANÁLISIS\):/gm, '<strong>A (ANÁLISIS):</strong>')
          .replace(/^P \(PLAN\):/gm, '<strong>P (PLAN):</strong>')
          // HPI/ROS
          .replace(/^HPI \(HISTORIA DE LA ENFERMEDAD ACTUAL\):/gm, '<strong>HPI (HISTORIA DE LA ENFERMEDAD ACTUAL):</strong>')
          .replace(/^ROS \(REVISIÓN POR SISTEMAS\):/gm, '<strong>ROS (REVISIÓN POR SISTEMAS):</strong>')
          .replace(/^PE \(EXAMEN FÍSICO\):/gm, '<strong>PE (EXAMEN FÍSICO):</strong>')
          .replace(/^A\/P \(ANÁLISIS Y PLAN\):/gm, '<strong>A/P (ANÁLISIS Y PLAN):</strong>');
        
        return processed;
      };
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Reporte - ${data.title || filename}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
            }
            h1 {
              color: #4F46E5;
              border-bottom: 3px solid #4F46E5;
              padding-bottom: 10px;
              margin-bottom: 20px;
            }
            h2 {
              color: #6366F1;
              margin-top: 25px;
              margin-bottom: 10px;
            }
            .header-info {
              background: #F3F4F6;
              padding: 15px;
              border-radius: 8px;
              margin-bottom: 20px;
            }
            .header-info p {
              margin: 5px 0;
            }
            .badge {
              display: inline-block;
              padding: 4px 12px;
              border-radius: 12px;
              font-size: 12px;
              font-weight: 600;
              margin-right: 8px;
            }
            .badge-format {
              background: #EDE9FE;
              color: #7C3AED;
            }
            .badge-patient {
              background: #DBEAFE;
              color: #2563EB;
            }
            .section {
              margin-bottom: 20px;
            }
            .detailed-summary {
              background: #F9FAFB;
              padding: 20px;
              border-left: 4px solid #4F46E5;
              white-space: pre-wrap;
              font-family: 'Georgia', serif;
              font-size: 14px;
              line-height: 1.8;
              border-radius: 4px;
            }
            .detailed-summary strong {
              color: #4F46E5;
              font-weight: 700;
            }
            ul {
              margin: 10px 0;
              padding-left: 25px;
            }
            li {
              margin: 5px 0;
            }
            @media print {
              body {
                padding: 0;
              }
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <h1>📋 ${data.title || filename}</h1>
          
          <div class="header-info">
            <p><strong>Fecha:</strong> ${createdAt}</p>
            <p><strong>Formato:</strong> <span class="badge badge-format">${formatLabel}</span></p>
            <p><strong>Paciente:</strong> <span class="badge badge-patient">👤 ${patientName}</span></p>
          </div>
          
          <div class="section">
            <h2>Resumen Breve</h2>
            <p>${analysis.shortSummary || 'No hay resumen disponible'}</p>
          </div>
          
          ${analysis.detailedSummary ? `
          <div class="section">
            <h2>Formato ${formatLabel}</h2>
            <div class="detailed-summary">${processDetailedSummary(analysis.detailedSummary)}</div>
          </div>
          ` : ''}
          
          ${analysis.keyPoints && analysis.keyPoints.length > 0 ? `
          <div class="section">
            <h2>Puntos Clave</h2>
            <ul>
              ${analysis.keyPoints.map((point: string) => `<li>${point}</li>`).join('')}
            </ul>
          </div>
          ` : ''}
          
          ${analysis.decisions && analysis.decisions.length > 0 ? `
          <div class="section">
            <h2>Decisiones Tomadas</h2>
            <ul>
              ${analysis.decisions.map((decision: string) => `<li>${decision}</li>`).join('')}
            </ul>
          </div>
          ` : ''}
          
          <div class="no-print" style="margin-top: 40px; text-align: center;">
            <button onclick="window.print()" style="padding: 10px 20px; background: #4F46E5; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;">
              Imprimir / Guardar como PDF
            </button>
            <button onclick="window.close()" style="padding: 10px 20px; background: #6B7280; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; margin-left: 10px;">
              Cerrar
            </button>
          </div>
        </body>
        </html>
      `);
      
      printWindow.document.close();
      
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al exportar el reporte");
    }
  };

  const handleDeleteReport = (filename: string, title: string) => {
    setReportToDelete({ filename, title });
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!reportToDelete) return;
    
    try {
      const token = await getToken();
      if (!token) {
        toast.error("Debes iniciar sesión para eliminar reportes");
        return;
      }
      const res = await fetch(`/api/reports/${encodeURIComponent(reportToDelete.filename)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("No se pudo eliminar el reporte");
      toast.success("Reporte eliminado exitosamente");
      setDeleteModalOpen(false);
      setReportToDelete(null);
      await loadReports();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error desconocido al eliminar");
    }
  };

  const handleEditReport = async (filename: string) => {
    try {
      setEditReportId(filename);
      setEditModalOpen(true);
      setEditModalLoading(true);
      setEditModalAnalysis(null);

      const token = await getToken();
      if (!token) {
        toast.error("Debes iniciar sesión para editar reportes");
        setEditModalLoading(false);
        setEditModalOpen(false);
        return;
      }

      const res = await fetch(`/api/reports/${encodeURIComponent(filename)}`, {
        cache: "no-store",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error("No se pudo cargar el reporte para edición");
      }

      const data = await res.json();
      const analysis = (data && data.analysis) || {};
      setEditModalAnalysis({
        shortSummary: analysis.shortSummary || "",
        detailedSummary: analysis.detailedSummary || "",
        keyPoints: analysis.keyPoints || [],
        decisions: analysis.decisions || [],
        tasks: analysis.tasks || [],
      });
    } catch (e) {
      setEditModalOpen(false);
      toast.error(e instanceof Error ? e.message : "Error desconocido al cargar el reporte");
    } finally {
      setEditModalLoading(false);
    }
  };

  const handleSaveReportEdits = async (analysis: ReportAnalysis) => {
    if (!editReportId) return;
    try {
      const token = await getToken();
      if (!token) {
        toast.error("Debes iniciar sesión para guardar reportes");
        return;
      }
      setEditModalSaving(true);
      const res = await fetch(`/api/reports/${encodeURIComponent(editReportId)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ analysis }),
      });
      if (!res.ok) throw new Error("No se pudo guardar el reporte");
      toast.success("Reporte actualizado exitosamente");
      setEditModalOpen(false);
      await loadReports();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error desconocido al guardar");
    } finally {
      setEditModalSaving(false);
    }
  };

  // Filtrar reportes por nombre de paciente
  const filteredReports = reports?.filter(report => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      report.patientName?.toLowerCase().includes(query) ||
      report.title?.toLowerCase().includes(query) ||
      report.summary?.toLowerCase().includes(query)
    );
  }) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50">
      <div className="max-w-6xl mx-auto px-4 pt-28 pb-12 overflow-x-hidden">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Reportes guardados</h1>
          
          {/* Buscador */}
          {loaded && !authLoading && user && reports && reports.length > 0 && (
            <div className="max-w-md">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar por paciente o contenido..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <svg
                  className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              {searchQuery && (
                <p className="mt-2 text-sm text-gray-600">
                  {filteredReports.length} {filteredReports.length === 1 ? 'resultado' : 'resultados'}
                </p>
              )}
            </div>
          )}
        </div>

      {/* Si no hay sesión */}
      {!authLoading && !user && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Inicia sesión para ver tus reportes
          </h3>
          <p className="mt-1 text-gray-500">
            Debes estar autenticado para listar y abrir reportes guardados.
          </p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <a
              href="/login"
              className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-500 text-sm font-medium"
            >
              Iniciar sesión
            </a>
            <a
              href="/register"
              className="px-4 py-2 rounded-md ring-1 ring-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium"
            >
              Crear cuenta
            </a>
          </div>
        </div>
      )}

      {!loaded && (authLoading || loading) && user && (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-indigo-600" />
        </div>
      )}

      {loaded && !authLoading && user && error && (
        <div className="bg-red-50 text-red-700 rounded-md p-4">{error}</div>
      )}

      {loaded && !authLoading && user && !error && (reports?.length ?? 0) === 0 && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">No hay reportes</h3>
          <p className="mt-1 text-gray-500">Aún no has generado ningún reporte.</p>
        </div>
      )}

      {loaded && !authLoading && user && !error && (reports?.length ?? 0) > 0 && filteredReports.length === 0 && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">No se encontraron resultados</h3>
          <p className="mt-1 text-gray-500">No hay reportes que coincidan con &quot;{searchQuery}&quot;</p>
          <button
            onClick={() => setSearchQuery('')}
            className="mt-4 px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 text-sm font-medium"
          >
            Limpiar búsqueda
          </button>
        </div>
      )}

      {loaded && !authLoading && user && !error && filteredReports.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          {filteredReports.map((r) => (
            <div
              key={r.filename}
              className="bg-white rounded-lg shadow p-5 flex flex-col gap-3 overflow-hidden hover:shadow-xl transition-shadow duration-300"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h3
                    className="text-lg font-semibold text-gray-900 truncate break-words"
                    title={r.title || r.filename}
                  >
                    {r.title || r.filename}
                  </h3>
                  <p className="text-sm text-gray-500">{formatDate(r.createdAt)}</p>
                  <div className="flex gap-2 mt-2">
                    {r.format && (
                      <span className="inline-flex items-center rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-medium text-purple-700">
                        {r.format === 'soap' ? 'SOAP' : 'HPI/ROS + PE + A/P'}
                      </span>
                    )}
                    {r.patientName && (
                      <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                        👤 {r.patientName}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {r.summary && (
                <p className="text-gray-700 text-sm line-clamp-3 break-words">{r.summary}</p>
              )}

              {r.decisions && r.decisions.length > 0 && (
                <div className="text-xs text-gray-600 break-words">
                  <span className="font-medium">Decisiones:</span>{" "}
                  {r.decisions.slice(0, 3).join(" • ")}
                  {r.decisions.length > 3 ? " …" : ""}
                </div>
              )}

              <div className="mt-3 flex items-center gap-1">
                <button
                  onClick={() => handleViewReport(r.filename)}
                  className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200"
                  title="Ver reporte completo"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleExportPDF(r.filename)}
                  className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200"
                  title="Exportar a PDF"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleEditReport(r.filename)}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                  title="Editar reporte"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDeleteReport(r.filename, r.title || r.filename)}
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                  title="Eliminar reporte"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

        <AnalysisModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          analysis={modalAnalysis ?? { summary: "", keyPoints: [], decisions: [], tasks: [] }}
        />
        <ReportEditModal
          isOpen={editModalOpen}
          loading={editModalLoading}
          saving={editModalSaving}
          initialAnalysis={editModalAnalysis}
          onClose={() => setEditModalOpen(false)}
          onSave={handleSaveReportEdits}
        />

        {/* Modal de confirmación de eliminación */}
        {deleteModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              {/* Backdrop */}
              <div 
                className="fixed inset-0 bg-black/50 transition-opacity"
                onClick={() => setDeleteModalOpen(false)}
              />
              
              {/* Modal */}
              <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6 transform transition-all">
                {/* Icono de advertencia */}
                <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>

                {/* Contenido */}
                <div className="mt-4 text-center">
                  <h3 className="text-lg font-semibold text-gray-900">
                    ¿Eliminar reporte?
                  </h3>
                  <p className="mt-2 text-sm text-gray-600">
                    Estás a punto de eliminar el reporte:
                  </p>
                  <p className="mt-1 text-sm font-medium text-gray-900 break-words">
                    &quot;{reportToDelete?.title}&quot;
                  </p>
                  <p className="mt-2 text-sm text-red-600 font-medium">
                    Esta acción no se puede deshacer.
                  </p>
                </div>

                {/* Botones */}
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => {
                      setDeleteModalOpen(false);
                      setReportToDelete(null);
                    }}
                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
