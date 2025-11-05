import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Clinio - BETA",
  description: "Sistema de análisis médico con IA para transcripción y generación de reportes clínicos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-teal-50 overflow-x-hidden`}
      >
        <Toaster 
          position="top-right" 
          richColors 
          closeButton
          duration={4000}
        />
        <Navbar />
        <main className="flex-grow transition-all duration-300 ease-in-out overflow-x-hidden w-full">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}