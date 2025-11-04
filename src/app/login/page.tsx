"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getClientAuth, getGoogleProvider } from "@/lib/firebaseClient";
import { signInWithEmailAndPassword, signInWithPopup, getIdToken } from "firebase/auth";
import Link from "next/link";
import { toast } from "sonner";
import { FcGoogle } from "react-icons/fc";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setLoading(true);
      const auth = getClientAuth();
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      // asegurar usuario en Firestore
      const token = await getIdToken(cred.user, true);
      await fetch('/api/users/ensure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: cred.user.email, displayName: cred.user.displayName }),
      }).catch(() => {});
      toast.success("¡Bienvenido!");
      router.push("/");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "No se pudo iniciar sesión";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    try {
      setLoading(true);
      const auth = getClientAuth();
      const provider = getGoogleProvider();
      const cred = await signInWithPopup(auth, provider);
      // asegurar usuario en Firestore
      const token = await getIdToken(cred.user, true);
      await fetch('/api/users/ensure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: cred.user.email, displayName: cred.user.displayName }),
      }).catch(() => {});
      toast.success("¡Bienvenido!");
      router.push("/");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "No se pudo iniciar sesión con Google";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 pt-28 pb-10 px-4">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">Iniciar sesión</h1>
        <p className="text-sm text-gray-600 mb-6 text-center">Accede a tu cuenta</p>

        {/* Botón de Google */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full mb-4 flex items-center justify-center gap-3 rounded-md bg-white border-2 border-gray-300 text-gray-700 py-2.5 font-medium hover:bg-gray-50 hover:border-gray-400 disabled:opacity-60 transition-all duration-200"
        >
          <FcGoogle className="text-xl" />
          Continuar con Google
        </button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">O continúa con email</span>
          </div>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700">Correo</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="tucorreo@ejemplo.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-indigo-600 text-white py-2 font-medium hover:bg-indigo-700 disabled:opacity-60 transition-colors duration-200"
          >
            {loading ? "Ingresando…" : "Ingresar"}
          </button>
        </form>

        <p className="text-sm text-gray-600 mt-4 text-center">
          ¿No tienes cuenta? {" "}
          <Link href="/register" className="text-indigo-600 hover:underline font-medium">Crear cuenta</Link>
        </p>
      </div>
    </div>
  );
}
