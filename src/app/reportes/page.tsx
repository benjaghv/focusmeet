"use client";

import { useEffect, useState, useCallback } from "react";
import AnalysisModal from "../components/AnalysisModal";
import { useAuth } from "@/lib/useAuth";

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
  }, [getToken, loaded]); // 👈 dependencia estable

  useEffect(() => {
    if (!authLoading) {
      loadReports();
    }
  }, [authLoading, loadReports]); // 👈 ya no da warning

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
        setError("Debes iniciar sesión para abrir el reporte");
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
      setError(e instanceof Error ? e.message : "Error desconocido al abrir el reporte");
    }
  };

  const handleDeleteReport = async (filename: string) => {
    try {
      const ok = confirm("¿Eliminar este reporte? Esta acción no se puede deshacer.");
      if (!ok) return;
      const token = await getToken();
      if (!token) {
        setError("Debes iniciar sesión para eliminar reportes");
        return;
      }
      const res = await fetch(`/api/reports/${encodeURIComponent(filename)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("No se pudo eliminar el reporte");
      await loadReports();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido al eliminar");
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 pt-28 pb-12 overflow-x-hidden">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Reportes guardados</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={loadReports}
            className="px-3 py-2 text-sm font-medium rounded-md ring-1 ring-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Actualizar
          </button>
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
              className="bg-white rounded-lg shadow p-5 flex flex-col gap-3 overflow-hidden"
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
                  className="px-3 py-2 text-sm font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-500"
                >
                  Ver reporte
                </button>
                <a
                  href={`/reportes/${encodeURIComponent(r.filename)}`}
                  className="px-3 py-2 text-sm font-medium rounded-md bg-gray-100 text-gray-800 hover:bg-gray-200"
                >
                  Editar
                </a>
                <button
                  onClick={() => handleDeleteReport(r.filename)}
                  className="px-3 py-2 text-sm font-medium rounded-md bg-red-600 text-white hover:bg-red-500"
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
    </div>
  );
}
