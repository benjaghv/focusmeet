"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";

export type ReportTask = { description: string; responsible: string };

export type ReportAnalysis = {
  shortSummary?: string;
  detailedSummary?: string;
  keyPoints?: string[];
  decisions?: string[];
  tasks?: ReportTask[];
};

interface ReportEditModalProps {
  isOpen: boolean;
  loading?: boolean;
  saving?: boolean;
  initialAnalysis: ReportAnalysis | null;
  onClose: () => void;
  onSave: (analysis: ReportAnalysis) => void | Promise<void>;
}

const listToTextarea = (values?: string[]) => (values && values.length ? values.join("\n") : "");
const tasksToTextarea = (tasks?: ReportTask[]) =>
  tasks && tasks.length
    ? tasks
        .map((task) => `${task.description || ""}${task.responsible ? ` | ${task.responsible}` : ""}`.trim())
        .join("\n")
    : "";

const textareaToList = (value: string) =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

const textareaToTasks = (value: string): ReportTask[] =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [descriptionRaw, responsibleRaw] = line.split("|");
      const description = (descriptionRaw || "").trim();
      const responsible = (responsibleRaw || "").trim();
      return {
        description,
        responsible,
      };
    })
    .filter((task) => task.description.length > 0 || task.responsible.length > 0);

export default function ReportEditModal({
  isOpen,
  loading = false,
  saving = false,
  initialAnalysis,
  onClose,
  onSave,
}: ReportEditModalProps) {
  const [shortSummary, setShortSummary] = useState("");
  const [detailedSummary, setDetailedSummary] = useState("");
  const [keyPoints, setKeyPoints] = useState("");
  const [decisions, setDecisions] = useState("");
  const [tasks, setTasks] = useState("");

  const isDisabled = saving || loading;

  const safeInitial = useMemo<ReportAnalysis>(() => initialAnalysis || {}, [initialAnalysis]);

  useEffect(() => {
    if (!isOpen) return;
    setShortSummary(safeInitial.shortSummary || "");
    setDetailedSummary(safeInitial.detailedSummary || "");
    setKeyPoints(listToTextarea(safeInitial.keyPoints));
    setDecisions(listToTextarea(safeInitial.decisions));
    setTasks(tasksToTextarea(safeInitial.tasks));
  }, [isOpen, safeInitial]);

  const handleSave = async () => {
    const analysis: ReportAnalysis = {
      shortSummary: shortSummary.trim(),
      detailedSummary: detailedSummary.trim(),
      keyPoints: textareaToList(keyPoints),
      decisions: textareaToList(decisions),
      tasks: textareaToTasks(tasks),
    };
    await onSave(analysis);
  };

  if (!isOpen) return null;

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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-3xl sm:p-6">
                <div className="absolute right-0 top-0 pr-4 pt-4">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
                    onClick={onClose}
                    disabled={saving}
                  >
                    <span className="sr-only">Cerrar</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="sm:flex sm:items-start">
                  <div className="mt-3 w-full text-center sm:mt-0 sm:text-left">
                    <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                      Editar reporte
                    </Dialog.Title>

                    {loading ? (
                      <div className="mt-6 flex items-center justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-indigo-600" />
                      </div>
                    ) : (
                      <div className="mt-6 space-y-5">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Resumen corto</label>
                          <textarea
                            value={shortSummary}
                            onChange={(e) => setShortSummary(e.target.value)}
                            rows={3}
                            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            disabled={isDisabled}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Resumen detallado</label>
                          <textarea
                            value={detailedSummary}
                            onChange={(e) => setDetailedSummary(e.target.value)}
                            rows={6}
                            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            disabled={isDisabled}
                          />
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Puntos clave (uno por línea)
                            </label>
                            <textarea
                              value={keyPoints}
                              onChange={(e) => setKeyPoints(e.target.value)}
                              rows={6}
                              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              disabled={isDisabled}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Decisiones (una por línea)
                            </label>
                            <textarea
                              value={decisions}
                              onChange={(e) => setDecisions(e.target.value)}
                              rows={6}
                              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              disabled={isDisabled}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Tareas (una por línea: descripción | responsable)
                          </label>
                          <textarea
                            value={tasks}
                            onChange={(e) => setTasks(e.target.value)}
                            rows={6}
                            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            disabled={isDisabled}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 ring-1 ring-gray-300 hover:bg-gray-50"
                    onClick={onClose}
                    disabled={saving}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className={`inline-flex justify-center rounded-md px-4 py-2 text-sm font-semibold text-white shadow-sm ${isDisabled ? "bg-indigo-300 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-500"}`}
                    onClick={handleSave}
                    disabled={isDisabled}
                  >
                    {saving ? "Guardando..." : "Guardar"}
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