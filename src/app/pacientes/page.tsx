"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/useAuth";
import { toast } from "sonner";
import { Dialog, Transition } from "@headlessui/react";
import { FaUser, FaEdit, FaTrash, FaEye } from "react-icons/fa";
import FirestoreStatus from "../components/FirestoreStatus";
import PatientDetailsModal from "../components/PatientDetailsModal";
import type { Patient } from "@/types/patient";

export default function PacientesPage() {
  const { user, loading: authLoading, getToken } = useAuth();
  const [patients, setPatients] = useState<Patient[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [viewingPatient, setViewingPatient] = useState<Patient | null>(null);
  const [deletingPatientId, setDeletingPatientId] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    nombre: "",
    edad: "",
    telefono: "",
    email: "",
    diagnostico: "",
    notas: "",
  });

  const loadPatients = useCallback(async (): Promise<Patient[]> => {
    try {
      if (!loaded) setLoading(true);
      const token = await getToken();
      if (!token) {
        setPatients([]);
        setError(null);
        setLoading(false);
        setLoaded(true);
        return [];
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
        return [];
      }

      const data = await res.json();
      const list = Array.isArray(data) ? (data as Patient[]) : [];
      setPatients(list);
      setError(null);
      return list;
    } catch {
      setPatients([]);
      setError(null);
      return [];
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
      const updated = await loadPatients();
      if (editingPatient) {
        const latest = updated.find((p) => p.id === editingPatient.id);
        if (latest) {
          setViewingPatient(latest);
        }
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error desconocido");
    }
  };

  const handleDeletePatient = async (patient: Patient) => {
    try {
      const ok = confirm(
        `¿Eliminar al paciente "${patient.nombre}"? Esta acción eliminará también todos sus reportes asociados y no se puede deshacer.`
      );
      if (!ok) return;

      const token = await getToken();
      if (!token) {
        toast.error("Debes iniciar sesión");
        return;
      }

      setDeletingPatientId(patient.id);

      const res = await fetch(`/api/patients/${patient.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("No se pudo eliminar el paciente");

      toast.success("Paciente eliminado exitosamente");
      await loadPatients();
      setViewingPatient(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setDeletingPatientId(null);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50">
      <div className="max-w-6xl mx-auto px-4 pt-28 pb-12 overflow-x-hidden">
        <FirestoreStatus />
        
        <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Mis Pacientes</h1>
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition-all duration-200 border border-gray-300 text-sm font-medium"
        >
          Nuevo Paciente
        </button>
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
            className="mt-4 px-4 py-2 rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition-all duration-200 border border-gray-300 text-sm font-medium"
          >
            Nuevo Paciente
          </button>
        </div>
      )}

      {loaded && !authLoading && user && !error && (patients?.length ?? 0) > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
          {patients!.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-lg shadow p-5 flex flex-col gap-3 hover:shadow-xl transition-shadow duration-300"
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

              <div className="mt-3 flex items-center gap-1">
                <button
                  onClick={() => setViewingPatient(p)}
                  className="p-2 text-gray-600 hover:text-[#0033FF] hover:bg-[#0033FF]/10 rounded-lg transition-all duration-200"
                  title="Ver ficha completa"
                >
                  <FaEye className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleOpenModal(p)}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                  title="Editar paciente"
                >
                  <FaEdit className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDeletePatient(p)}
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                  title="Eliminar paciente"
                >
                  <FaTrash className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal para crear/editar paciente */}
      <Transition.Root show={showModal} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={handleCloseModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
                  <div>
                    <Dialog.Title as="h2" className="text-2xl font-bold text-gray-900 mb-6">
                      {editingPatient ? "Editar Paciente" : "Nuevo Paciente"}
                    </Dialog.Title>

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
                  className="flex-1 px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 font-medium transition-colors duration-200"
                >
                  {editingPatient ? "Guardar Cambios" : "Crear Paciente"}
                </button>
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 rounded-md ring-1 ring-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition-colors duration-200"
                >
                  Cancelar
                </button>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>

      <PatientDetailsModal
        patient={viewingPatient}
        isOpen={!!viewingPatient}
        onClose={() => setViewingPatient(null)}
        onEdit={handleOpenModal}
        onDelete={handleDeletePatient}
        deletingId={deletingPatientId}
      />
    </div>
    </div> 
  );
}
