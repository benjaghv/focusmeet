export default function TareasPage() {
    return (
        <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-sm">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Mis Tareas</h1>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">No hay tareas</h3>
          <p className="mt-1 text-gray-500">Aún no has creado ninguna tarea.</p>
        </div>
      </div>
    </div>
    );
  }