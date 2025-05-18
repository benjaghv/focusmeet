import React from 'react';
import { FaGithub, FaLinkedin, FaInstagram, FaGlobe } from 'react-icons/fa';
import Image from 'next/image';

export default function Footer() {
    return (
        <footer className="w-full border-t border-gray-300 mt-0 py-4 bg-white">
            <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between text-sm text-gray-600">
                <span>Creado por Benjamín García-Huidobro <img src="https://flagcdn.com/cl.svg" alt="Bandera de Chile" className="w-5 h-4 inline-block" /></span>
                <div className="flex space-x-4 mt-2 sm:mt-0">
                    <a href="https://github.com/benjaghv" target="_blank" rel="noopener noreferrer">
                        <FaGithub className="w-5 h-5 hover:text-gray-900" />
                    </a>
                    <a href="https://www.linkedin.com/in/benjamínghv" target="_blank" rel="noopener noreferrer">
                        <FaLinkedin className="w-5 h-5 hover:text-blue-600" />
                    </a>
                    <a href="https://www.instagram.com/benja_ghv" target="_blank" rel="noopener noreferrer">
                        <FaInstagram className="w-5 h-5 hover:text-pink-500" />
                    </a>
                    <a href="https://www.benjaminghv.cl" target="_blank" rel="noopener noreferrer">
                        <FaGlobe className="w-5 h-5 hover:text-green-500" />
                    </a>
                </div>
            </div>
        </footer>
    );
}