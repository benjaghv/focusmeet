"use client";

import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import {
  FaUser,
  FaBirthdayCake,
  FaPhone,
  FaEnvelope,
  FaStethoscope,
  FaStickyNote,
  FaFileMedical,
  FaEdit,
  FaTrash,
} from "react-icons/fa";
import type { Patient } from "@/types/patient";

interface PatientDetailsModalProps {
  patient: Patient | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (patient: Patient) => void;
  onDelete: (patient: Patient) => Promise<void> | void;
  onCreateReport: (patient: Patient) => void;
  deletingId?: string | null;
}

const formatDateTime = (iso?: string) => {
  if (!iso) return "Fecha desconocida";
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso;
  }
};

export default function PatientDetailsModal({
  patient,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onCreateReport,
  deletingId,
}: PatientDetailsModalProps) {
  if (!patient || !isOpen) return null;

  const deleting = deletingId === patient.id;

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
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
                <div className="absolute right-0 top-0 pr-4 pt-4">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
                    onClick={onClose}
                  >
                    <span className="sr-only">Cerrar</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="sm:flex sm:items-start">
                  <div className="mt-3 w-full sm:mt-0">
                    <Dialog.Title as="h3" className="text-xl font-semibold leading-6 text-gray-900 flex items-center gap-3">
                      <FaUser className="text-indigo-600" />
                      {patient.nombre}
                    </Dialog.Title>

                    <p className="mt-2 text-sm text-gray-500">
                      Registrado el {formatDateTime(patient.createdAt)}
                    </p>

                    <div className="mt-6 space-y-4">
                      {patient.edad !== undefined && (
                        <div className="flex items-center gap-3 text-gray-700">
                          <FaBirthdayCake className="text-indigo-500" />
                          <span>{patient.edad} años</span>
                        </div>
                      )}

                      {patient.telefono && (
                        <div className="flex items-center gap-3 text-gray-700">
                          <FaPhone className="text-indigo-500" />
                          <span>{patient.telefono}</span>
                        </div>
                      )}

                      {patient.email && (
                        <div className="flex items-center gap-3 text-gray-700">
                          <FaEnvelope className="text-indigo-500" />
                          <span>{patient.email}</span>
                        </div>
                      )}

                      {patient.diagnostico && (
                        <div className="flex items-start gap-3 text-gray-700">
                          <FaStethoscope className="mt-1 text-indigo-500" />
                          <span>{patient.diagnostico}</span>
                        </div>
                      )}

                      {patient.notas && (
                        <div className="flex items-start gap-3 text-gray-700">
                          <FaStickyNote className="mt-1 text-indigo-500" />
                          <span className="whitespace-pre-wrap">{patient.notas}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => onCreateReport(patient)}
                      className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-500"
                    >
                      <FaFileMedical /> Crear reporte
                    </button>
                    <button
                      onClick={() => onEdit(patient)}
                      className="inline-flex items-center gap-2 rounded-md bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-200"
                    >
                      <FaEdit /> Editar
                    </button>
                  </div>
                  <button
                    onClick={() => onDelete(patient)}
                    disabled={deleting}
                    className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white shadow ${
                      deleting ? "bg-red-300 cursor-not-allowed" : "bg-red-600 hover:bg-red-500"
                    }`}
                  >
                    <FaTrash /> {deleting ? "Eliminando..." : "Eliminar"}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
