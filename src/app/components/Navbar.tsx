// components/Navbar.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { FaChartBar, FaClipboardList, FaTags, FaCommentDots } from "react-icons/fa";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="bg-white/80 backdrop-blur-sm fixed w-full top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link href="/" className="text-xl font-bold text-[#22223b]">
                FocusMeet
              </Link>
            </div>
          </div>
          
          {/* Desktop menu */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-4">
              <Link 
                href="/reportes" 
                className="text-[#4a4e69] hover:text-[#22223b] px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors"
              >
                <FaChartBar />
                <span>Reportes</span>
              </Link>
              <Link 
                href="/tareas" 
                className="text-[#4a4e69] hover:text-[#22223b] px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors"
              >
                <FaClipboardList />
                <span>Tareas</span>
              </Link>
              <Link 
                href="/precios" 
                className="text-[#4a4e69] hover:text-[#22223b] px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors"
              >
                <FaTags />
                <span>Precios</span>
              </Link>
              <Link 
                href="/feedback" 
                className="bg-[#22223b] text-white hover:bg-[#4a4e69] px-4 py-2 rounded-full text-sm font-medium flex items-center gap-1.5 transition-colors"
              >
                <FaCommentDots />
                <span>Feedback</span>
              </Link>
            </div>
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-[#4a4e69] hover:text-[#22223b] focus:outline-none"
              aria-expanded="false"
            >
              <span className="sr-only">Abrir menú principal</span>
              {/* Icon when menu is closed */}
              <svg
                className={`${isMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              {/* Icon when menu is open */}
              <svg
                className={`${isMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state */}
      <div className={`${isMenuOpen ? 'block' : 'hidden'} md:hidden bg-white/95 shadow-lg`}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          <Link
            href="/reportes"
            className="text-[#4a4e69] hover:bg-gray-100 block px-3 py-2 rounded-md text-base font-medium flex items-center gap-2"
          >
            <FaChartBar />
            <span>Reportes</span>
          </Link>
          <Link
            href="/tareas"
            className="text-[#4a4e69] hover:bg-gray-100 block px-3 py-2 rounded-md text-base font-medium flex items-center gap-2"
          >
            <FaClipboardList />
            <span>Tareas</span>
          </Link>
          <Link
            href="/precios"
            className="text-[#4a4e69] hover:bg-gray-100 block px-3 py-2 rounded-md text-base font-medium flex items-center gap-2"
          >
            <FaTags />
            <span>Precios</span>
          </Link>
          <Link
            href="/feedback"
            className="text-[#4a4e69] hover:bg-gray-100 block px-3 py-2 rounded-md text-base font-medium flex items-center gap-2"
          >
            <FaCommentDots />
            <span>Feedback</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}