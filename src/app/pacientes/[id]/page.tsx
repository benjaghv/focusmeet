"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/useAuth";
import { toast } from "sonner";
import AnalysisModal from "@/app/components/AnalysisModal";
import { FaArrowLeft, FaEdit, FaPlus, FaTrash, FaFileAlt } from "react-icons/fa";


type Patient = {
  id: string;
  nombre: string;
  edad?: number;
  telefono?: string;
  email?: string;
  diagnostico?: string;
  notas?: string;
  createdAt: string;
};

type ReportListItem = {
  filename: string;
  createdAt: string | null;
  title?: string | null;
  summary: string;
  decisions: string[];
  tasksCount: number;
  meta: Record<string, unknown>;
};

export default function PatientDetailPage() {
  const params = useParams();
  const patientId = useMemo(() => (params?.id as string) || "", [params]);
  const router = useRouter();
  const { user, loading: authLoading, getToken } = useAuth();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [reports, setReports] = useState<ReportListItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalAnalysis, setModalAnalysis] = useState<{
    summary: string;
    keyPoints: string[];
    decisions: string[];
    tasks: { description: string; responsible: string }[];
  } | null>(null);
  // Variables de estado para edición de reportes (comentadas temporalmente)
  // const [editReportId, setEditReportId] = useState<string | null>(null);
  // const [editModalOpen, setEditModalOpen] = useState(false);
  // const [editModalLoading, setEditModalLoading] = useState(false);
  // const [editModalSaving, setEditModalSaving] = useState(false);
  // const [editModalAnalysis, setEditModalAnalysis] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    nombre: "",
    edad: "",
    telefono: "",
    email: "",
    diagnostico: "",
    notas: "",
  });

  const loadPatient = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) {
        setError("Debes iniciar sesión");
        setLoading(false);
        return;
      }

      const res = await fetch(`/api/patients/${patientId}`, {
        cache: "no-store",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("No se pudo cargar el paciente");

      const data = await res.json();
      setPatient(data);
      setFormData({
        nombre: data.nombre,
        edad: data.edad?.toString() || "",
        telefono: data.telefono || "",
        email: data.email || "",
        diagnostico: data.diagnostico || "",
        notas: data.notas || "",
      });
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    }
  }, [patientId, getToken]);

  const loadReports = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const res = await fetch(`/api/patients/${patientId}/reports`, {
        cache: "no-store",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        setReports([]);
        return;
      }

      const data = await res.json();
      setReports(data || []);
    } catch {
      setReports([]);
    }
  }, [patientId, getToken]);

  useEffect(() => {
    if (!authLoading && patientId) {
      Promise.all([loadPatient(), loadReports()]).finally(() =>
        setLoading(false)
      );
    }
  }, [authLoading, patientId, loadPatient, loadReports]);

  const handleSavePatient = async () => {
    try {
      if (!formData.nombre.trim()) {
        toast.error("El nombre es requerido");
        return;
      }

      const token = await getToken();
      if (!token) {
        toast.error("Debes iniciar sesión");
        return;
      }

      const res = await fetch(`/api/patients/${patientId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Error al actualizar paciente");
      }

      toast.success("Paciente actualizado exitosamente");
      setShowEditModal(false);
      await loadPatient();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error desconocido");
    }
  };

  // Función para editar reportes (disponible para uso futuro)
  // const handleEditReport = async (filename: string) => {
  //   try {
  //     setEditReportId(filename);
  //     setEditModalOpen(true);
  //     setEditModalLoading(true);
  //     setEditModalAnalysis(null);

  //     const token = await getToken();
  //     if (!token) {
  //       setError("Debes iniciar sesión para editar reportes");
  //       setEditModalLoading(false);
  //       return;
  //     }

  //     const res = await fetch(`/api/reports/${encodeURIComponent(filename)}`, {
  //       cache: "no-store",
  //       headers: { Authorization: `Bearer ${token}` },
  //     });

  //     if (!res.ok) {
  //       throw new Error("No se pudo cargar el reporte para edición");
  //     }

  //     const data = await res.json();
  //     const analysis = (data && data.analysis) || {};
  //     setEditModalAnalysis({
  //       shortSummary: analysis.shortSummary || "",
  //       detailedSummary: analysis.detailedSummary || "",
  //       keyPoints: analysis.keyPoints || [],
  //       decisions: analysis.decisions || [],
  //       tasks: analysis.tasks || [],
  //     });
  //   } catch (e) {
  //     toast.error(e instanceof Error ? e.message : "Error desconocido al cargar el reporte");
  //     setEditModalOpen(false);
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
      setError(
        e instanceof Error ? e.message : "Error desconocido al abrir el reporte"
      );
    }
  };

  const handleDeleteReport = async (filename: string) => {
    try {
      const ok = confirm(
        "¿Eliminar este reporte? Esta acción no se puede deshacer."
      );
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
      toast.success("Reporte eliminado");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido al eliminar");
    }
  };

  const formatDate = (iso?: string | null) => {
    if (!iso) return "Fecha desconocida";
    try {
      const d = new Date(iso);
      return d.toLocaleString();
    } catch {
      return iso;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 pt-28 pb-12">
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-indigo-600" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-6xl mx-auto px-4 pt-28 pb-12">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Inicia sesión para ver esta ficha
          </h3>
          <a
            href="/login"
            className="mt-4 inline-block px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-500"
          >
            Iniciar sesión
          </a>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 pt-28 pb-12">
        <div className="bg-red-50 text-red-700 rounded-md p-4">{error}</div>
        <button
          onClick={() => router.push("/pacientes")}
          className="mt-4 px-4 py-2 rounded-md bg-gray-100 text-gray-800 hover:bg-gray-200"
        >
          Volver a Pacientes
        </button>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="max-w-6xl mx-auto px-4 pt-28 pb-12">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <h3 className="text-lg font-medium text-gray-900">
            Paciente no encontrado
          </h3>
          <button
            onClick={() => router.push("/pacientes")}
            className="mt-4 px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-500"
          >
            Volver a Pacientes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50">
      <div className="max-w-6xl mx-auto px-4 pt-28 pb-12">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push("/pacientes")}
          className="mb-4 px-3 py-2 text-sm rounded-md ring-1 ring-gray-300 text-gray-700 hover:bg-gray-50 inline-flex items-center gap-2"
        >
          <FaArrowLeft /> Volver a Pacientes
        </button>
      </div>

      {/* Información del Paciente */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{patient.nombre}</h1>
            {patient.edad && (
              <p className="text-lg text-gray-600 mt-1">{patient.edad} años</p>
            )}
          </div>
          <button
            onClick={() => setShowEditModal(true)}
            className="px-3 py-2 text-sm font-medium rounded-md bg-gray-100 text-gray-800 hover:bg-gray-200 inline-flex items-center gap-2"
          >
            <FaEdit /> Editar
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {patient.telefono && (
            <div>
              <span className="text-sm font-medium text-gray-500">Teléfono:</span>
              <p className="text-gray-900">{patient.telefono}</p>
            </div>
          )}
          {patient.email && (
            <div>
              <span className="text-sm font-medium text-gray-500">Email:</span>
              <p className="text-gray-900">{patient.email}</p>
            </div>
          )}
        </div>

        {patient.diagnostico && (
          <div className="mt-4">
            <span className="text-sm font-medium text-gray-500">Diagnóstico:</span>
            <p className="text-gray-900 mt-1">{patient.diagnostico}</p>
          </div>
        )}

        {patient.notas && (
          <div className="mt-4">
            <span className="text-sm font-medium text-gray-500">Notas:</span>
            <p className="text-gray-900 mt-1 whitespace-pre-wrap">{patient.notas}</p>
          </div>
        )}

        <p className="text-xs text-gray-400 mt-4">
          Paciente registrado el {formatDate(patient.createdAt)}
        </p>
      </div>

      {/* Reportes del Paciente */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Reportes</h2>
          <button
            onClick={() => router.push(`/?patientId=${patientId}`)}
            className="px-4 py-2 text-sm font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-500 inline-flex items-center gap-2"
          >
            <FaPlus /> Nuevo Reporte
          </button>
        </div>

        {reports === null && (
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-indigo-600" />
          </div>
        )}

        {reports !== null && reports.length === 0 && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <FaFileAlt className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">
              No hay reportes
            </h3>
            <p className="mt-1 text-gray-500">
              Aún no has generado reportes para este paciente.
            </p>
            <button
              onClick={() => router.push(`/?patientId=${patientId}`)}
              className="mt-4 px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-500 text-sm font-medium inline-flex items-center gap-2"
            >
              <FaPlus /> Crear Primer Reporte
            </button>
          </div>
        )}

        {reports !== null && reports.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reports.map((r) => (
              <div
                key={r.filename}
                className="bg-white rounded-lg shadow p-5 flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3
                      className="text-lg font-semibold text-gray-900 truncate break-words"
                      title={r.title || r.filename}
                    >
                      {r.title || r.filename}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {formatDate(r.createdAt)}
                    </p>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                    {r.tasksCount} tareas
                  </span>
                </div>

                {r.summary && (
                  <p className="text-gray-700 text-sm line-clamp-3 break-words">
                    {r.summary}
                  </p>
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
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Edición */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Editar Paciente
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre completo *
                  </label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) =>
                      setFormData({ ...formData, nombre: e.target.value })
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Edad
                    </label>
                    <input
                      type="number"
                      value={formData.edad}
                      onChange={(e) =>
                        setFormData({ ...formData, edad: e.target.value })
                      }
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={formData.telefono}
                      onChange={(e) =>
                        setFormData({ ...formData, telefono: e.target.value })
                      }
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Diagnóstico
                  </label>
                  <textarea
                    value={formData.diagnostico}
                    onChange={(e) =>
                      setFormData({ ...formData, diagnostico: e.target.value })
                    }
                    rows={3}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notas adicionales
                  </label>
                  <textarea
                    value={formData.notas}
                    onChange={(e) =>
                      setFormData({ ...formData, notas: e.target.value })
                    }
                    rows={3}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="mt-6 flex items-center gap-3">
                <button
                  onClick={handleSavePatient}
                  className="flex-1 px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-500 font-medium"
                >
                  Guardar Cambios
                </button>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-md ring-1 ring-gray-300 text-gray-700 hover:bg-gray-50 font-medium"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

        <AnalysisModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          analysis={
            modalAnalysis ?? {
              summary: "",
              keyPoints: [],
              decisions: [],
              tasks: [],
            }
          }
        />
        {/* Modal de edición de reportes (comentado temporalmente) */}
        {/* <ReportEditModal
          isOpen={editModalOpen}
          loading={editModalLoading}
          saving={editModalSaving}
          initialAnalysis={editModalAnalysis}
          onClose={() => setEditModalOpen(false)}
          onSave={handleSaveReportEdits}
        /> */}
      </div>
    </div>
  );
}
