"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/useAuth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FaUser, FaPlus, FaEdit, FaTrash, FaEye } from "react-icons/fa";
import FirestoreStatus from "../components/FirestoreStatus";

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

export default function PacientesPage() {
  const { user, loading: authLoading, getToken } = useAuth();
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    nombre: "",
    edad: "",
    telefono: "",
    email: "",
    diagnostico: "",
    notas: "",
  });

  const loadPatients = useCallback(async () => {
    try {
      if (!loaded) setLoading(true);
      const token = await getToken();
      if (!token) {
        setPatients([]);
        setError(null);
        setLoading(false);
        setLoaded(true);
        return;
      }

      const res = await fetch("/api/patients", {
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        setPatients([]);
        setError(null);
        setLoaded(true);
        return;
      }

      const data = await res.json();
      setPatients(data || []);
      setError(null);
    } catch {
      setPatients([]);
      setError(null);
    } finally {
      setLoaded(true);
      setLoading(false);
    }
  }, [getToken, loaded]);

  useEffect(() => {
    if (!authLoading) {
      loadPatients();
    }
  }, [authLoading, loadPatients]);

  const handleOpenModal = (patient?: Patient) => {
    if (patient) {
      setEditingPatient(patient);
      setFormData({
        nombre: patient.nombre,
        edad: patient.edad?.toString() || "",
        telefono: patient.telefono || "",
        email: patient.email || "",
        diagnostico: patient.diagnostico || "",
        notas: patient.notas || "",
      });
    } else {
      setEditingPatient(null);
      setFormData({
        nombre: "",
        edad: "",
        telefono: "",
        email: "",
        diagnostico: "",
        notas: "",
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPatient(null);
    setFormData({
      nombre: "",
      edad: "",
      telefono: "",
      email: "",
      diagnostico: "",
      notas: "",
    });
  };

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

      const url = editingPatient
        ? `/api/patients/${editingPatient.id}`
        : "/api/patients";
      
      const method = editingPatient ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Error al guardar paciente");
      }

      toast.success(
        editingPatient
          ? "Paciente actualizado exitosamente"
          : "Paciente creado exitosamente"
      );
      
      handleCloseModal();
      await loadPatients();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error desconocido");
    }
  };

  const handleDeletePatient = async (id: string, nombre: string) => {
    try {
      const ok = confirm(
        `¿Eliminar al paciente "${nombre}"? Esta acción eliminará también todos sus reportes asociados y no se puede deshacer.`
      );
      if (!ok) return;

      const token = await getToken();
      if (!token) {
        toast.error("Debes iniciar sesión");
        return;
      }

      const res = await fetch(`/api/patients/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("No se pudo eliminar el paciente");

      toast.success("Paciente eliminado exitosamente");
      await loadPatients();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error desconocido");
    }
  };

  const formatDate = (iso?: string) => {
    if (!iso) return "Fecha desconocida";
    try {
      const d = new Date(iso);
      return d.toLocaleDateString();
    } catch {
      return iso;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 pt-28 pb-12 overflow-x-hidden">
      <FirestoreStatus />
      
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Mis Pacientes</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={loadPatients}
            className="px-3 py-2 text-sm font-medium rounded-md ring-1 ring-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Actualizar
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2 text-sm font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-500 flex items-center gap-2"
          >
            <FaPlus /> Nuevo Paciente
          </button>
        </div>
      </div>

      {/* Si no hay sesión */}
      {!authLoading && !user && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Inicia sesión para ver tus pacientes
          </h3>
          <p className="mt-1 text-gray-500">
            Debes estar autenticado para gestionar pacientes.
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

      {loaded && !authLoading && user && !error && (patients?.length ?? 0) === 0 && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <FaUser className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">No hay pacientes</h3>
          <p className="mt-1 text-gray-500">Comienza agregando tu primer paciente.</p>
          <button
            onClick={() => handleOpenModal()}
            className="mt-4 px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-500 text-sm font-medium inline-flex items-center gap-2"
          >
            <FaPlus /> Nuevo Paciente
          </button>
        </div>
      )}

      {loaded && !authLoading && user && !error && (patients?.length ?? 0) > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
          {patients!.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-lg shadow p-5 flex flex-col gap-3 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {p.nombre}
                  </h3>
                  {p.edad && (
                    <p className="text-sm text-gray-600">{p.edad} años</p>
                  )}
                  {p.diagnostico && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {p.diagnostico}
                    </p>
                  )}
                </div>
              </div>

              {(p.telefono || p.email) && (
                <div className="text-xs text-gray-600 space-y-1">
                  {p.telefono && <p>📞 {p.telefono}</p>}
                  {p.email && <p>✉️ {p.email}</p>}
                </div>
              )}

              <p className="text-xs text-gray-400">
                Creado: {formatDate(p.createdAt)}
              </p>

              <div className="mt-2 flex items-center gap-2">
                <button
                  onClick={() => router.push(`/pacientes/${p.id}`)}
                  className="flex-1 px-3 py-2 text-sm font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-500 flex items-center justify-center gap-1"
                >
                  <FaEye /> Ver Ficha
                </button>
                <button
                  onClick={() => handleOpenModal(p)}
                  className="px-3 py-2 text-sm font-medium rounded-md bg-gray-100 text-gray-800 hover:bg-gray-200"
                  title="Editar"
                >
                  <FaEdit />
                </button>
                <button
                  onClick={() => handleDeletePatient(p.id, p.nombre)}
                  className="px-3 py-2 text-sm font-medium rounded-md bg-red-600 text-white hover:bg-red-500"
                  title="Eliminar"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal para crear/editar paciente */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {editingPatient ? "Editar Paciente" : "Nuevo Paciente"}
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
                    placeholder="Ej: Juan Pérez"
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
                      placeholder="Ej: 35"
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
                      placeholder="Ej: +54 11 1234-5678"
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
                    placeholder="Ej: juan@ejemplo.com"
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
                    placeholder="Notas, observaciones, historial..."
                  />
                </div>
              </div>

              <div className="mt-6 flex items-center gap-3">
                <button
                  onClick={handleSavePatient}
                  className="flex-1 px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-500 font-medium"
                >
                  {editingPatient ? "Guardar Cambios" : "Crear Paciente"}
                </button>
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 rounded-md ring-1 ring-gray-300 text-gray-700 hover:bg-gray-50 font-medium"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
