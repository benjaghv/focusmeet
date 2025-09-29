"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/useAuth";
import { toast } from "sonner";

type Task = { description: string; responsible: string };

type Analysis = {
  shortSummary?: string;
  detailedSummary?: string;
  keyPoints?: string[];
  decisions?: string[];
  tasks?: Task[];
};

export default function ReportEditorPage() {
  const params = useParams();
  const id = useMemo(() => (params?.id as string) || "", [params]);
  const { getToken, user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [shortSummary, setShortSummary] = useState("");
  const [detailedSummary, setDetailedSummary] = useState("");
  const [keyPointsText, setKeyPointsText] = useState("");
  const [decisionsText, setDecisionsText] = useState("");
  const [tasksText, setTasksText] = useState("");

  const parseList = (s: string) =>
    s
      .split("\n")
      .map((x) => x.trim())
      .filter(Boolean);

  const parseTasks = (s: string): Task[] => {
    // Una tarea por línea. Formato: descripcion | responsable
    return s
      .split("\n")
      .map((x) => x.trim())
      .filter(Boolean)
      .map((line) => {
        const [description, responsible] = line.split("|").map((t) => (t || "").trim());
        return { description, responsible };
      });
  };

  const formatTasks = (tasks?: Task[]) =>
    (tasks || [])
      .map((t) => `${t.description || ""} | ${t.responsible || ""}`.trim())
      .join("\n");

  async function loadReport() {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) {
        setError("Debes iniciar sesión para editar reportes");
        setLoading(false);
        return;
      }
      const res = await fetch(`/api/reports/${encodeURIComponent(id)}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (!res.ok) throw new Error("No se pudo cargar el reporte");
      const data = await res.json();
      const a: Analysis = (data && data.analysis) || {};
      setShortSummary(a.shortSummary || "");
      setDetailedSummary(a.detailedSummary || "");
      setKeyPointsText((a.keyPoints || []).join("\n"));
      setDecisionsText((a.decisions || []).join("\n"));
      setTasksText(formatTasks(a.tasks));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!authLoading && id) loadReport();
  }, [authLoading, id]);

  async function handleSave() {
    try {
      const token = await getToken();
      if (!token) {
        toast.info("Inicia sesión para guardar");
        return;
      }
      setSaving(true);
      const analysis: Analysis = {
        shortSummary,
        detailedSummary,
        keyPoints: parseList(keyPointsText),
        decisions: parseList(decisionsText),
        tasks: parseTasks(tasksText),
      };
      const res = await fetch(`/api/reports/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ analysis }),
      });
      if (!res.ok) throw new Error("No se pudo guardar el reporte");
      toast.success("Reporte actualizado");
      router.push("/reportes");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error desconocido al guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 pt-28 pb-12">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Editar reporte</h1>
        <button
          onClick={() => router.push("/reportes")}
          className="px-3 py-2 text-sm rounded-md ring-1 ring-gray-300 text-gray-700 hover:bg-gray-50"
        >
          Volver
        </button>
      </div>

      {loading && <div className="bg-white p-6 rounded-lg shadow">Cargando…</div>}
      {!loading && error && (
        <div className="bg-red-50 text-red-700 rounded-md p-4">{error}</div>
      )}

      {!loading && !error && (
        <div className="bg-white p-6 rounded-lg shadow space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700">Resumen corto</label>
            <textarea
              value={shortSummary}
              onChange={(e) => setShortSummary(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Resumen detallado</label>
            <textarea
              value={detailedSummary}
              onChange={(e) => setDetailedSummary(e.target.value)}
              rows={6}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Puntos clave (uno por línea)</label>
              <textarea
                value={keyPointsText}
                onChange={(e) => setKeyPointsText(e.target.value)}
                rows={6}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Decisiones (una por línea)</label>
              <textarea
                value={decisionsText}
                onChange={(e) => setDecisionsText(e.target.value)}
                rows={6}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Tareas (una por línea: descripcion | responsable)</label>
            <textarea
              value={tasksText}
              onChange={(e) => setTasksText(e.target.value)}
              rows={6}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-60"
            >
              {saving ? "Guardando…" : "Guardar"}
            </button>
            <button
              onClick={() => router.push("/reportes")}
              className="px-4 py-2 rounded-md ring-1 ring-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
