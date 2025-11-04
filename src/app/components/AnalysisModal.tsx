"use client";

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';

interface AnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: {
    summary: string;
    keyPoints: string[];
    decisions: string[];
    tasks: { description: string; responsible: string }[];
  };
  onSave?: () => void | Promise<void>;
  saving?: boolean;
}

export default function AnalysisModal({ isOpen, onClose, analysis, onSave, saving = false }: AnalysisModalProps) {
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
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                      Análisis de la Reunión
                    </Dialog.Title>
                    
                    <div className="mt-4 space-y-6">
                      {/* Resumen */}
                      <div>
                        <h3 className="text-md font-medium text-gray-900">Resumen</h3>
                        <p className="mt-1 text-gray-600">{analysis.summary || 'No hay resumen disponible'}</p>
                      </div>

                      {/* Puntos Clave */}
                      <div>
                        <h3 className="text-md font-medium text-gray-900">Puntos Clave</h3>
                        <ul className="mt-1 list-disc pl-5 space-y-1">
                          {analysis.keyPoints?.length > 0 ? (
                            analysis.keyPoints.map((point, index) => (
                              <li key={index} className="text-gray-600">{point}</li>
                            ))
                          ) : (
                            <li className="text-gray-600">No se identificaron puntos clave</li>
                          )}
                        </ul>
                      </div>

                      {/* Decisiones */}
                      <div>
                        <h3 className="text-md font-medium text-gray-900">Decisiones Tomadas</h3>
                        <ul className="mt-1 list-disc pl-5 space-y-1">
                          {analysis.decisions?.length > 0 ? (
                            analysis.decisions.map((decision, index) => (
                              <li key={index} className="text-gray-600">{decision}</li>
                            ))
                          ) : (
                            <li className="text-gray-600">No se identificaron decisiones</li>
                          )}
                        </ul>
                      </div>

                      {/* Tareas */}
                      <div>
                        <h3 className="text-md font-medium text-gray-900">Tareas Asignadas</h3>
                        {analysis.tasks?.length > 0 ? (
                          <div className="mt-2 border rounded-md divide-y">
                            {analysis.tasks.map((task, index) => (
                              <div key={index} className="px-4 py-2">
                                <p className="font-medium">{task.description}</p>
                                <p className="text-sm text-gray-500">Responsable: {task.responsible}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-1 text-gray-600">No se identificaron tareas</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer actions */}
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 ring-1 ring-gray-300 hover:bg-gray-50"
                    onClick={onClose}
                  >
                    Cerrar
                  </button>
                  {onSave && (
                    <button
                      type="button"
                      className={`inline-flex justify-center rounded-md px-4 py-2 text-sm font-semibold text-white shadow-sm ${saving ? 'bg-indigo-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500'}`}
                      onClick={() => onSave()}
                      disabled={saving}
                    >
                      {saving ? 'Guardando...' : 'Guardar reporte'}
                    </button>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}