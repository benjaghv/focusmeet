// src/app/components/Navbar.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  FaHome, 
  FaChartBar, 
  FaClipboardList, 
  FaTags, 
  FaCommentDots,
  FaBars,
  FaTimes
} from "react-icons/fa";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

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
            <div className="ml-10 flex items-baseline space-x-4">
              <NavLink href="/">
                <FaHome className="mr-1" /> Inicio
              </NavLink>
              <NavLink href="/reportes">
                <FaChartBar className="mr-1" /> Reportes
              </NavLink>
              <NavLink href="/tareas">
                <FaClipboardList className="mr-1" /> Tareas
              </NavLink>
              <NavLink href="/precios">
                <FaTags className="mr-1" /> Precios
              </NavLink>
              <NavLink href="/feedback">
                <FaCommentDots className="mr-1" /> Feedback
              </NavLink>
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
            <NavLink href="/tareas">
              <FaClipboardList className="mr-2" /> Tareas
            </NavLink>
            <NavLink href="/precios">
              <FaTags className="mr-2" /> Precios
            </NavLink>
            <NavLink href="/feedback">
              <FaCommentDots className="mr-2" /> Feedback
            </NavLink>
          </div>
        </div>
      )}
    </nav>
  );
}