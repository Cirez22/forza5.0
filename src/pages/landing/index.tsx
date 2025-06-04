import React from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="w-full px-6 py-4 flex justify-between items-center">
        <div className="text-xl font-medium">FORZA</div>
        <nav className="hidden md:flex space-x-6 text-sm">
          <a href="#manifesto" className="hover:text-gray-600">MANIFESTO</a>
          <span>/</span>
          <a href="#proyectos" className="hover:text-gray-600">PROYECTOS</a>
          <span>/</span>
          <a href="#nosotros" className="hover:text-gray-600">NOSOTROS</a>
          <span>/</span>
          <a href="#contacto" className="hover:text-gray-600">CONTACTO</a>
        </nav>
        <button 
          onClick={() => navigate('/login')} 
          className="px-4 py-2 bg-black text-white text-sm rounded-md hover:bg-gray-900"
        >
          COMENZAR
        </button>
      </div>

      {/* Hero Section */}
      <section className="relative h-screen border-2 border-black">
        <div className="absolute inset-0">
          <img
            src="https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg"
            alt="Modern architecture"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-50" />
        </div>
        
        <div className="relative h-full flex items-center px-8">
          <div className="max-w-3xl text-white">
            <h1 className="text-[8rem] leading-none font-bold mb-8">
              FORZA
            </h1>
            <div className="space-y-4 text-xl">
              <p>
                Gestión total para proyectos de construcción, arquitectura, diseño y remodelación.
              </p>
              <p>
                Una plataforma pensada para profesionales y clientes que quieren trabajar de forma organizada, colaborativa y transparente.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="min-h-screen px-8 py-24 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Manifesto */}
        <div className="bg-blue-600 text-white p-12 rounded-lg relative">
          <h2 className="text-4xl font-bold mb-8">MANIFESTO</h2>
          <div className="absolute bottom-6 left-6">
            <div className="w-2 h-2 bg-white rounded-full" />
          </div>
        </div>

        {/* Mission */}
        <div className="bg-gray-100 p-12 rounded-lg">
          <div className="space-y-6 text-lg">
            <p>En FORZA creemos que los grandes proyectos merecen grandes herramientas.</p>
            <p>Nuestro compromiso es con la claridad, la eficiencia y el profesionalismo en cada etapa de una obra.</p>
            <p>Creamos esta plataforma para empoderar a los profesionales y simplificar la experiencia para los clientes.</p>
            <p>FORZA es sinónimo de confianza, seguimiento y excelencia.</p>
          </div>
        </div>

        {/* Projects */}
        <div className="bg-gray-900 text-white p-12 rounded-lg relative">
          <h2 className="text-4xl font-bold mb-8">PROYECTOS</h2>
          <ul className="space-y-4 text-lg">
            <li>- Crear y gestionar proyectos desde cero</li>
            <li>- Compartir avances con tus clientes</li>
            <li>- Cargar archivos, notas, presupuestos</li>
          </ul>
          <div className="absolute bottom-6 right-6">
            <div className="w-2 h-2 bg-white rounded-full" />
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="bg-black text-white px-8 py-24">
        <div className="max-w-4xl">
          <h2 className="text-4xl font-bold mb-8">CONTACTO</h2>
          <div className="space-y-6 text-xl">
            <p>
              Somos un equipo de emprendedores con experiencia en tecnología, diseño y construcción.
            </p>
            <p>
              FORZA nace de una necesidad real: la falta de una herramienta completa y fácil de usar para profesionales del mundo de la arquitectura, la construcción y el diseño.
            </p>
            <p>
              Nuestra visión es convertirnos en la app que todos eligen para llevar adelante sus proyectos, sin importar el tamaño ni el rubro.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;