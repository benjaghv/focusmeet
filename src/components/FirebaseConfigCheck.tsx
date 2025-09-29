"use client";

import { useAuth } from "@/lib/useAuth";

interface Props {
  children: React.ReactNode;
}

export default function FirebaseConfigCheck({ children }: Props) {
  const { loading, error } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-indigo-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Inicializando...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Configuración Requerida
          </h2>
          <p className="text-gray-600 mb-4">
            Firebase no está configurado correctamente para desarrollo local.
          </p>
          <div className="bg-gray-50 rounded-md p-4 text-left text-sm">
            <p className="font-medium text-gray-900 mb-2">Para desarrollo local, crea un archivo <code>.env.local</code> con:</p>
            <pre className="text-xs text-gray-700 whitespace-pre-wrap">
{`NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key_aqui
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_project_id

# Variables del servidor (ya configuradas en Vercel)
FIREBASE_PROJECT_ID=tu_project_id
FIREBASE_CLIENT_EMAIL=tu_service_account_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\ntu_private_key\\n-----END PRIVATE KEY-----"

GROQ_API_KEY=tu_groq_api_key`}
            </pre>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            En producción (Vercel), estas variables ya están configuradas.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
