import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuración para desarrollo
  experimental: {
    serverActions: {
      allowedOrigins: ['*'], // Permite todos los orígenes en desarrollo
    },
  },
  
  // Configuración de cabeceras para CORS
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { 
            key: 'Access-Control-Allow-Origin', 
            value: '*' 
          },
          { 
            key: 'Access-Control-Allow-Methods', 
            value: 'GET, POST, PUT, DELETE, OPTIONS' 
          },
          { 
            key: 'Access-Control-Allow-Headers', 
            value: 'Content-Type, Authorization' 
          },
        ],
      },
    ]
  },
  
  // Configuración para permitir dominios de imágenes si es necesario
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;