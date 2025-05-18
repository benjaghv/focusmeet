"use client";

import Image from "next/image";
import { useRef } from "react";
import { FaCloudUploadAlt } from "react-icons/fa";
import Navbar from "./components/Navbar";

export default function Home() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      alert(`Archivo seleccionado: ${file.name}`);
    }
  };

  return (
    <>
      <Navbar />
      <div
        className="min-h-screen flex flex-col items-center justify-center pt-16"
        style={{
          background: "linear-gradient(135deg, #e0e7ff 0%, #f0fdfa 100%)",
        }}
      >
        <div className="flex flex-col items-center gap-6">
          <h1 className="text-4xl font-bold text-[#22223b] drop-shadow-sm">FocusMeet</h1>
          <p className="text-lg text-[#4a4e69] max-w-md text-center">
            Analiza tus reuniones de Meet o Zoom de forma inteligente. Sube tu grabación y obtén insights clave en segundos.
          </p>
          <button
            onClick={handleButtonClick}
            className="mt-8 flex items-center gap-3 px-8 py-4 bg-[#22223b] text-white rounded-full shadow-lg text-lg font-semibold transition-transform duration-200 hover:scale-105 hover:bg-[#4a4e69] focus:outline-none focus:ring-2 focus:ring-[#9a8c98] group cursor-pointer"
          >
            <FaCloudUploadAlt className="text-2xl group-hover:animate-bounce" />
            Subir archivo (.mp3 o .mp4)
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".mp3,.mp4"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>
    </>
  );
}