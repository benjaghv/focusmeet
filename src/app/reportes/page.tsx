"use client";

import { useEffect, useState } from "react";
import AnalysisModal from "../components/AnalysisModal";

type ReportListItem = {
  filename: string;
  createdAt: string | null;
  summary: string;
  decisions: string[];
  tasksCount: number;
  meta: Record<string, unknown>;
};

export default function ReportesPage() {
  const [reports, setReports] = useState<ReportListItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalAnalysis, setModalAnalysis] = useState<{
    summary: string;
    keyPoints: string[];
    decisions: string[];
    tasks: { description: string; responsible: string }[];
  } | null>(null);

  const loadReports = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/reports", { cache: "no-store" });
      if (!res.ok) throw new Error("No se pudieron cargar los reportes");
      const data = await res.json();
      setReports(data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

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
      const res = await fetch(`/api/reports/${encodeURIComponent(filename)}`, { cache: "no-store" });
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

  return (
    <div className="max-w-6xl mx-auto px-4 pt-28 pb-12">{/* pt-28 empuja debajo del Navbar fijo */}
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

      {loading && (
        <div className="bg-white rounded-lg shadow p-8 text-center">Cargando…</div>
      )}

      {!loading && error && (
        <div className="bg-red-50 text-red-700 rounded-md p-4">{error}</div>
      )}

      {!loading && !error && (reports?.length ?? 0) === 0 && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">No hay reportes</h3>
          <p className="mt-1 text-gray-500">Aún no has generado ningún reporte.</p>
        </div>
      )}

      {!loading && !error && (reports?.length ?? 0) > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reports!.map((r) => (
            <div key={r.filename} className="bg-white rounded-lg shadow p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 truncate" title={r.filename}>
                    {r.filename}
                  </h3>
                  <p className="text-sm text-gray-500">{formatDate(r.createdAt)}</p>
                </div>
                <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                  {r.tasksCount} tareas
                </span>
              </div>

              {r.summary && (
                <p className="text-gray-700 text-sm line-clamp-3">{r.summary}</p>
              )}

              {r.decisions && r.decisions.length > 0 && (
                <div className="text-xs text-gray-600">
                  <span className="font-medium">Decisiones:</span> {r.decisions.slice(0, 3).join(" • ")}
                  {r.decisions.length > 3 ? " …" : ""}
                </div>
              )}

              <div className="mt-2 flex items-center gap-2">
                <a
                  href={`/api/reports/${encodeURIComponent(r.filename)}`}
                  target="_blank"
                  className="px-3 py-2 text-sm font-medium rounded-md bg-gray-100 text-gray-800 hover:bg-gray-200"
                >
                  Ver JSON
                </a>
                <button
                  onClick={() => handleViewReport(r.filename)}
                  className="px-3 py-2 text-sm font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-500"
                >
                  Ver reporte
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