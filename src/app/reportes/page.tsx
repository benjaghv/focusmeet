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
};

export default function ReportesPage() {
  const { user, loading: authLoading, getToken } = useAuth();
  const [reports, setReports] = useState<ReportListItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false); // se marca tras el primer intento
  const [error, setError] = useState<string | null>(null);
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

  const handleDeleteReport = async (filename: string) => {
    try {
      const ok = confirm("¿Eliminar este reporte? Esta acción no se puede deshacer.");
      if (!ok) return;
      const token = await getToken();
      if (!token) {
        toast.error("Debes iniciar sesión para eliminar reportes");
        return;
      }
      const res = await fetch(`/api/reports/${encodeURIComponent(filename)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("No se pudo eliminar el reporte");
      toast.success("Reporte eliminado exitosamente");
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50">
      <div className="max-w-6xl mx-auto px-4 pt-28 pb-12 overflow-x-hidden">
        <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Reportes guardados</h1>
        <div className="flex items-center gap-3">
          
        </div>
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

      {loaded && !authLoading && user && !error && (reports?.length ?? 0) > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          {reports!.map((r) => (
            <div
              key={r.filename}
              className="bg-white rounded-lg shadow p-5 flex flex-col gap-3 overflow-hidden hover:shadow-xl transition-shadow duration-300"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3
                    className="text-lg font-semibold text-gray-900 truncate break-words"
                    title={r.title || r.filename}
                  >
                    {r.title || r.filename}
                  </h3>
                  <p className="text-sm text-gray-500">{formatDate(r.createdAt)}</p>
                </div>
                <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                  {r.tasksCount} tareas
                </span>
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

              <div className="mt-2 flex items-center gap-2">
                <button
                  onClick={() => handleViewReport(r.filename)}
                  className="px-3 py-2 text-sm font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors duration-200"
                >
                  Ver reporte
                </button>
                <button
                  onClick={() => handleEditReport(r.filename)}
                  className="px-3 py-2 text-sm font-medium rounded-md bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors duration-200"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDeleteReport(r.filename)}
                  className="px-3 py-2 text-sm font-medium rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors duration-200"
                >
                  Eliminar
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
      </div>
    </div>
  );
}
