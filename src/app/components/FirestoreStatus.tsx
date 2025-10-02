"use client";

import { useEffect, useState } from "react";
import { FaCheckCircle, FaExclamationTriangle, FaSpinner } from "react-icons/fa";

export default function FirestoreStatus() {
  const [status, setStatus] = useState<{
    loading: boolean;
    success: boolean;
    message: string;
    details?: string;
  }>({
    loading: true,
    success: false,
    message: "Verificando conexión con Firestore...",
  });

  useEffect(() => {
    checkFirestore();
  }, []);

  const checkFirestore = async () => {
    try {
      const res = await fetch("/api/test-firestore");
      const data = await res.json();
      
      if (data.success) {
        setStatus({
          loading: false,
          success: true,
          message: "Firestore conectado correctamente",
        });
      } else {
        setStatus({
          loading: false,
          success: false,
          message: data.message || "Error al conectar con Firestore",
          details: data.error || data.firestoreError,
        });
      }
    } catch (error) {
      setStatus({
        loading: false,
        success: false,
        message: "No se pudo verificar la conexión con Firestore",
        details: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  };

  if (status.loading) {
    return (
      <div className="mb-4 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
        <FaSpinner className="animate-spin text-blue-600" />
        <p className="text-sm text-blue-800">{status.message}</p>
      </div>
    );
  }

  if (status.success) {
    return null; // No mostrar nada si todo está bien
  }

  return (
    <div className="mb-4 px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-lg">
      <div className="flex items-start gap-3">
        <FaExclamationTriangle className="text-yellow-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-yellow-800">{status.message}</p>
          {status.details && (
            <p className="text-xs text-yellow-700 mt-1">{status.details}</p>
          )}
          <div className="mt-2">
            <a
              href="/FIREBASE_SETUP.md"
              target="_blank"
              className="text-xs text-yellow-800 underline hover:text-yellow-900"
            >
              Ver guía de configuración de Firebase →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
