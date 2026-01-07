import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Dumbbell, Users, Calendar, Trophy, Clock, MapPin,
  Mail, Phone, ChevronRight, Star, ArrowRight, Menu, X
} from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { LoadingState } from '../components/Common';

const GymLanding = () => {
  const { gymSlug } = useParams();
  const navigate = useNavigate();
  const [gym, setGym] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scrollY, setScrollY] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Parallax scroll effect
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Load gym data
  useEffect(() => {
    const loadGym = async () => {
      try {
        const q = query(collection(db, 'gyms'), where('slug', '==', gymSlug));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          navigate('/login');
          return;
        }

        const gymData = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
        setGym(gymData);
      } catch (err) {
        console.error('Error loading gym:', err);
        navigate('/login');
      }
      setLoading(false);
    };

    loadGym();
  }, [gymSlug, navigate]);

  if (loading) {
    return <LoadingState message="Cargando..." />;
  }

  if (!gym) {
    return null;
  }

  return (
    <div className="bg-slate-900 min-h-screen">
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-lg border-b border-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              {gym.logoBase64 ? (
                <img src={gym.logoBase64} alt={gym.name} className="w-10 h-10 rounded-lg object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Dumbbell size={24} className="text-primary" />
                </div>
              )}
              <span className="text-xl font-bold text-white">{gym.name}</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              <a href="#inicio" className="text-gray-300 hover:text-white transition-colors">Inicio</a>
              <a href="#servicios" className="text-gray-300 hover:text-white transition-colors">Servicios</a>
              <a href="#horarios" className="text-gray-300 hover:text-white transition-colors">Horarios</a>
              <a href="#contacto" className="text-gray-300 hover:text-white transition-colors">Contacto</a>
              <button
                onClick={() => navigate('/login')}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              >
                Iniciar Sesión
              </button>
              <button
                onClick={() => navigate('/register')}
                className="px-6 py-2 bg-gradient-to-r from-primary to-primary/80 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-primary/50 transition-all"
              >
                Registrate
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-white"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-800 border-t border-gray-700">
            <div className="container mx-auto px-4 py-4 space-y-2">
              <a href="#inicio" className="block py-2 text-gray-300 hover:text-white">Inicio</a>
              <a href="#servicios" className="block py-2 text-gray-300 hover:text-white">Servicios</a>
              <a href="#horarios" className="block py-2 text-gray-300 hover:text-white">Horarios</a>
              <a href="#contacto" className="block py-2 text-gray-300 hover:text-white">Contacto</a>
              <button
                onClick={() => navigate('/login')}
                className="block w-full text-left py-2 text-gray-300 hover:text-white"
              >
                Iniciar Sesión
              </button>
              <button
                onClick={() => navigate('/register')}
                className="block w-full mt-2 px-6 py-2 bg-gradient-to-r from-primary to-primary/80 text-white rounded-lg font-medium text-center"
              >
                Registrate
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section with Parallax */}
      <section id="inicio" className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Parallax Background Layers */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
          style={{
            transform: `translateY(${scrollY * 0.5}px)`,
          }}
        />
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1920)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            transform: `translateY(${scrollY * 0.3}px)`,
          }}
        />

        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-4 text-center">
          <div
            style={{
              transform: `translateY(${scrollY * 0.2}px)`,
              opacity: 1 - scrollY / 500,
            }}
          >
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              Transformá tu <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">Cuerpo</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Entrená con los mejores profesionales en {gym.name}. Tu mejor versión te está esperando.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/register')}
                className="group px-8 py-4 bg-gradient-to-r from-primary to-emerald-500 text-white rounded-xl font-semibold text-lg hover:shadow-2xl hover:shadow-primary/50 transition-all flex items-center justify-center gap-2"
              >
                Comenzar Ahora
                <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
              </button>
              <button
                onClick={() => document.getElementById('servicios').scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-4 bg-slate-800/80 backdrop-blur text-white rounded-xl font-semibold text-lg hover:bg-slate-700 transition-all"
              >
                Ver Más
              </button>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronRight className="rotate-90 text-gray-400" size={32} />
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-slate-800/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatCard icon={Users} number="500+" label="Miembros Activos" />
            <StatCard icon={Trophy} number="50+" label="Clases por Semana" />
            <StatCard icon={Dumbbell} number="200m²" label="Espacio de Entrenamiento" />
            <StatCard icon={Star} number="4.9" label="Calificación Promedio" />
          </div>
        </div>
      </section>

      {/* Services Section with Parallax */}
      <section id="servicios" className="py-20 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=1920)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            transform: `translateY(${(scrollY - 800) * 0.2}px)`,
          }}
        />
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Nuestros Servicios</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Todo lo que necesitás para alcanzar tus objetivos fitness
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <ServiceCard
              icon={Dumbbell}
              title="Entrenamiento Funcional"
              description="Mejorá tu fuerza, resistencia y movilidad con entrenamientos diseñados por profesionales."
            />
            <ServiceCard
              icon={Users}
              title="Clases Grupales"
              description="Entrená en grupo con energía motivadora y el apoyo de nuestros instructores."
            />
            <ServiceCard
              icon={Calendar}
              title="Planes Personalizados"
              description="Rutinas adaptadas a tus objetivos y nivel físico. Seguimiento continuo."
            />
          </div>
        </div>
      </section>

      {/* Schedule Section */}
      <section id="horarios" className="py-20 bg-slate-800/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Horarios</h2>
            <p className="text-gray-400 text-lg">Encontrá el horario que mejor se adapte a vos</p>
          </div>

          <div className="max-w-4xl mx-auto bg-slate-800/50 backdrop-blur rounded-2xl p-8 border border-gray-700">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <Clock size={24} className="text-primary" />
                  Lunes a Viernes
                </h3>
                <div className="space-y-2 text-gray-300">
                  <p>Mañana: 6:00 AM - 12:00 PM</p>
                  <p>Tarde: 3:00 PM - 10:00 PM</p>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <Clock size={24} className="text-primary" />
                  Sábados y Domingos
                </h3>
                <div className="space-y-2 text-gray-300">
                  <p>Mañana: 8:00 AM - 1:00 PM</p>
                  <p>Tarde: 4:00 PM - 8:00 PM</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contacto" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Contacto</h2>
            <p className="text-gray-400 text-lg">¿Tenés dudas? Estamos para ayudarte</p>
          </div>

          <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-8">
            {gym.address && (
              <ContactCard
                icon={MapPin}
                title="Ubicación"
                info={gym.address}
              />
            )}
            {gym.email && (
              <ContactCard
                icon={Mail}
                title="Email"
                info={gym.email}
                link={`mailto:${gym.email}`}
              />
            )}
            {gym.phone && (
              <ContactCard
                icon={Phone}
                title="Teléfono"
                info={gym.phone}
                link={`tel:${gym.phone}`}
              />
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary/20 to-emerald-500/20 backdrop-blur">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            ¿Listo para Empezar?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Unite a nuestra comunidad y comenzá tu transformación hoy mismo
          </p>
          <button
            onClick={() => navigate('/register')}
            className="px-10 py-4 bg-gradient-to-r from-primary to-emerald-500 text-white rounded-xl font-bold text-lg hover:shadow-2xl hover:shadow-primary/50 transition-all"
          >
            Registrate Gratis
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-gray-800 py-8">
        <div className="container mx-auto px-4 text-center text-gray-400">
          <p>&copy; 2026 {gym.name}. Todos los derechos reservados.</p>
          <p className="text-sm mt-2">by <span className="text-gray-300 font-medium">Gonzalo Crespo</span></p>
        </div>
      </footer>
    </div>
  );
};

// Component: Stat Card
const StatCard = ({ icon: Icon, number, label }) => (
  <div className="text-center">
    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/20 mb-4">
      <Icon className="text-primary" size={32} />
    </div>
    <div className="text-3xl md:text-4xl font-bold text-white mb-2">{number}</div>
    <div className="text-gray-400">{label}</div>
  </div>
);

// Component: Service Card
const ServiceCard = ({ icon: Icon, title, description }) => (
  <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-8 border border-gray-700 hover:border-primary/50 transition-all hover:transform hover:scale-105">
    <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center mb-6">
      <Icon className="text-primary" size={28} />
    </div>
    <h3 className="text-xl font-semibold text-white mb-3">{title}</h3>
    <p className="text-gray-400">{description}</p>
  </div>
);

// Component: Contact Card
const ContactCard = ({ icon: Icon, title, info, link }) => {
  const content = (
    <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-6 border border-gray-700 hover:border-primary/50 transition-all text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/20 mb-4">
        <Icon className="text-primary" size={24} />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-300 break-words">{info}</p>
    </div>
  );

  if (link) {
    return (
      <a href={link} className="block hover:transform hover:scale-105 transition-transform">
        {content}
      </a>
    );
  }

  return content;
};

export default GymLanding;
