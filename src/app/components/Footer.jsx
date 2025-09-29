import React from 'react';
import { FaGithub, FaLinkedin, FaInstagram, FaGlobe } from 'react-icons/fa';
import Image from 'next/image';

export default function Footer() {
    return (
        <footer className="w-full border-t border-gray-300 py-4 bg-white mt-auto">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between text-sm text-gray-600">
                <span className="flex items-center">
                    Creado por Benjamín García-Huidobro 
                    <span className="ml-2">
                        <Image 
                            src="https://flagcdn.com/cl.svg" 
                            alt="Bandera de Chile" 
                            width={20} 
                            height={16} 
                            className="inline-block"
                        />
                    </span>
                </span>
                <div className="flex space-x-4 mt-2 sm:mt-0">
                    <a 
                        href="https://github.com/benjaghv" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        aria-label="GitHub"
                    >
                        <FaGithub className="w-5 h-5 hover:text-gray-900 transition-colors" />
                    </a>
                    <a 
                        href="https://www.linkedin.com/in/benjamínghv" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        aria-label="LinkedIn"
                    >
                        <FaLinkedin className="w-5 h-5 hover:text-blue-600 transition-colors" />
                    </a>
                    <a 
                        href="https://www.instagram.com/benja_ghv" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        aria-label="Instagram"
                    >
                        <FaInstagram className="w-5 h-5 hover:text-pink-500 transition-colors" />
                    </a>
                    <a 
                        href="https://www.benjaminghv.cl" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        aria-label="Portafolio"
                    >
                        <FaGlobe className="w-5 h-5 hover:text-green-500 transition-colors" />
                    </a>
                </div>
            </div>
        </footer>
    );
}