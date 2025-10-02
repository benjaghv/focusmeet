// src/app/components/Navbar.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  FaHome, 
  FaChartBar, 
  FaUser, 
  FaTags, 
  FaCommentDots,
  FaBars,
  FaTimes
} from "react-icons/fa";
import { useAuth } from "@/lib/useAuth";
import { signOut } from "firebase/auth";
import { getClientAuth } from "@/lib/firebaseClient";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user } = useAuth();

  // Cerrar el menú cuando cambia la ruta
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isMenuOpen && !target.closest('.mobile-menu') && !target.closest('.menu-button')) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
    <Link
      href={href}
      className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${
        pathname === href ? 'text-indigo-600' : 'text-gray-700 hover:text-indigo-600'
      }`}
    >
      {children}
    </Link>
  );

  return (
    <nav className="bg-white/80 backdrop-blur-sm fixed w-full top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link 
                href="/" 
                className="text-xl font-bold text-[#22223b] hidden md:block"
              >
                FocusMeet
              </Link>
              <Link 
                href="/" 
                className="text-xl font-bold text-[#22223b] md:hidden"
                onClick={() => setIsMenuOpen(false)}
              >
                FocusMeet
              </Link>
            </div>
          </div>
          
          {/* Desktop menu */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-4">
              <NavLink href="/">
                <FaHome className="mr-1" /> Inicio
              </NavLink>
              <NavLink href="/reportes">
                <FaChartBar className="mr-1" /> Reportes
              </NavLink>
              <NavLink href="/pacientes">
                <FaUser className="mr-1" /> Pacientes
              </NavLink>
              <NavLink href="/precios">
                <FaTags className="mr-1" /> Precios
              </NavLink>
              <NavLink href="/feedback">
                <FaCommentDots className="mr-1" /> Feedback
              </NavLink>

              {/* Auth actions */}
              <div className="ml-6 flex items-center gap-3">
                {!user ? (
                  <>
                    <Link href="/login" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 ring-1 ring-gray-300 hover:bg-gray-50">Iniciar sesión</Link>
                    <Link href="/register" className="px-3 py-2 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500">Crear cuenta</Link>
                  </>
                ) : (
                  <>
                    <span className="text-sm text-gray-700 hidden lg:inline max-w-[220px] truncate">
                      {user.displayName || user.email}
                    </span>
                    <button
                      title="Cerrar sesión"
                      className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 ring-1 ring-gray-300 hover:bg-gray-50"
                      onClick={async () => { await signOut(getClientAuth()); }}
                    >
                      Salir
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="menu-button inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-indigo-600 focus:outline-none"
              aria-label="Menú"
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="mobile-menu md:hidden bg-white/95 backdrop-blur-sm shadow-lg">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <NavLink href="/">
              <FaHome className="mr-2" /> Inicio
            </NavLink>
            <NavLink href="/reportes">
              <FaChartBar className="mr-2" /> Reportes
            </NavLink>
            <NavLink href="/pacientes">
              <FaUser className="mr-2" /> Pacientes
            </NavLink>
            <NavLink href="/precios">
              <FaTags className="mr-2" /> Precios
            </NavLink>
            <NavLink href="/feedback">
              <FaCommentDots className="mr-2" /> Feedback
            </NavLink>

            {/* Auth actions mobile */}
            {!user ? (
              <div className="mt-2 flex items-center gap-2">
                <Link href="/login" className="flex-1 text-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 ring-1 ring-gray-300 hover:bg-gray-50">Iniciar sesión</Link>
                <Link href="/register" className="flex-1 text-center px-3 py-2 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500">Crear cuenta</Link>
              </div>
            ) : (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-sm text-gray-700 truncate">{user.displayName || user.email}</span>
                <button
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 ring-1 ring-gray-300 hover:bg-gray-50"
                  onClick={async () => { await signOut(getClientAuth()); setIsMenuOpen(false); }}
                >Salir</button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}