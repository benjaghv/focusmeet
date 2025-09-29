
'use client';

import { useState } from 'react';
import { FaStar, FaPaperPlane } from 'react-icons/fa';

export default function FeedbackPage() {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      alert('Por favor califica tu experiencia');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Aquí podrías enviar el feedback a tu backend
      console.log({ rating, comment });
      // Simulamos un envío
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsSubmitted(true);
    } catch (error) {
      console.error('Error al enviar el feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="bg-white p-8 rounded-lg shadow-md">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="mt-6 text-2xl font-extrabold text-gray-900">
              ¡Gracias por tu feedback!
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Tu opinión es muy valiosa para mejorar FocusMeet.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">Envíanos tu Feedback</h1>
          <p className="mt-2 text-sm text-gray-600">
            Ayúdanos a mejorar FocusMeet con tus comentarios
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ¿Cómo calificarías tu experiencia con FocusMeet?
              </label>
              <div className="flex justify-center space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={`text-2xl ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
                    onClick={() => setRating(star)}
                  >
                    <FaStar className="h-8 w-8" />
                  </button>
                ))}
              </div>
              <div className="flex justify-between mt-1 text-xs text-gray-500">
                <span>Mala</span>
                <span>Excelente</span>
              </div>
            </div>

            <div>
              <label htmlFor="comment" className="block text-sm font-medium text-gray-700">
                Cuéntanos más sobre tu experiencia
              </label>
              <div className="mt-1">
                <textarea
                  id="comment"
                  name="comment"
                  rows={4}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2"
                  placeholder="¿Qué te gustó o qué podríamos mejorar?"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 cursor-pointer"
              >
                {isSubmitting ? (
                  'Enviando...'
                ) : (
                  <>
                    <FaPaperPlane className="mr-2 h-4 w-4" />
                    Enviar Feedback
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}