const plans = [
    {
      name: 'Básico',
      price: '$9.99',
      description: 'Perfecto para equipos pequeños',
      features: [
        'Hasta 5 horas de grabación/mes',
        'Análisis básico de reuniones',
        'Hasta 3 usuarios',
        'Soporte por correo electrónico'
      ],
      popular: false
    },
    {
      name: 'Profesional',
      price: '$29.99',
      description: 'Ideal para equipos profesionales',
      features: [
        'Hasta 20 horas de grabación/mes',
        'Análisis avanzado de reuniones',
        'Hasta 10 usuarios',
        'Soporte prioritario',
        'Exportación de informes'
      ],
      popular: true
    },
    {
      name: 'Empresarial',
      price: 'Personalizado',
      description: 'Para grandes equipos',
      features: [
        'Horas ilimitadas',
        'Análisis avanzado y personalizado',
        'Usuarios ilimitados',
        'Soporte 24/7',
        'Integraciones personalizadas',
        'Entrenamiento incluido'
      ],
      popular: false
    }
  ];
  
  export default function PreciosPage() {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Planes de Suscripción</h1>
          <p className="text-xl text-gray-600">Elige el plan que mejor se adapte a tus necesidades</p>
        </div>
  
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div 
              key={index} 
              className={`relative rounded-2xl border ${
                plan.popular 
                  ? 'border-indigo-500 shadow-xl transform md:-translate-y-2' 
                  : 'border-gray-200'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-500 text-white text-xs font-semibold px-4 py-1 rounded-full">
                  MÁS POPULAR
                </div>
              )}
              
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h2>
                <p className="text-gray-600 mb-6">{plan.description}</p>
                
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  {plan.price !== 'Personalizado' && (
                    <span className="text-gray-600">/mes</span>
                  )}
                </div>
  
                <button
                  className={`w-full py-3 px-6 rounded-lg font-medium ${
                    plan.popular
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  Comenzar
                </button>
  
                <ul className="mt-8 space-y-4">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center">
                      <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }