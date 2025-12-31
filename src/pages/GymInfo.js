import React from 'react';
import { Building2, MapPin, Phone, Mail, Globe, Clock, Users, Calendar, Dumbbell, Info } from 'lucide-react';
import { Card, Badge, EmptyState, GymRequired } from '../components/Common';
import { useGym } from '../contexts/GymContext';
import { useTheme } from '../contexts/ThemeContext';

const GymInfoContent = () => {
  const { currentGym } = useGym();
  const { gymLogo } = useTheme();

  if (!currentGym) {
    return <EmptyState icon={Building2} title="Sin gimnasio" description="No hay gimnasio seleccionado" />;
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header con logo y nombre */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <div className="w-24 h-24 rounded-2xl bg-gray-800 flex items-center justify-center overflow-hidden border border-gray-700">
          {gymLogo ? (
            <img src={gymLogo} alt={currentGym.name} className="w-full h-full object-cover" />
          ) : (
            <Building2 size={40} className="text-gray-500" />
          )}
        </div>
        <div>
          <h1 className="text-3xl font-bold">{currentGym.name}</h1>
          {currentGym.slogan && (
            <p className="text-gray-400 mt-1 italic">"{currentGym.slogan}"</p>
          )}
          {currentGym.isActive !== false ? (
            <Badge className="mt-2 bg-green-500/20 text-green-400">Activo</Badge>
          ) : (
            <Badge className="mt-2 bg-red-500/20 text-red-400">Inactivo</Badge>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Información de contacto */}
        <Card>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Info size={20} className="text-primary" />
            Información de Contacto
          </h2>
          <div className="space-y-4">
            {currentGym.address && (
              <div className="flex items-start gap-3">
                <MapPin size={18} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-400">Dirección</p>
                  <p className="font-medium">{currentGym.address}</p>
                </div>
              </div>
            )}
            
            {currentGym.phone && (
              <div className="flex items-start gap-3">
                <Phone size={18} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-400">Teléfono</p>
                  <a href={`tel:${currentGym.phone}`} className="font-medium text-primary hover:underline">
                    {currentGym.phone}
                  </a>
                </div>
              </div>
            )}
            
            {currentGym.email && (
              <div className="flex items-start gap-3">
                <Mail size={18} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-400">Email</p>
                  <a href={`mailto:${currentGym.email}`} className="font-medium text-primary hover:underline">
                    {currentGym.email}
                  </a>
                </div>
              </div>
            )}
            
            {currentGym.website && (
              <div className="flex items-start gap-3">
                <Globe size={18} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-400">Sitio Web</p>
                  <a 
                    href={currentGym.website.startsWith('http') ? currentGym.website : `https://${currentGym.website}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="font-medium text-primary hover:underline"
                  >
                    {currentGym.website}
                  </a>
                </div>
              </div>
            )}
            
            {currentGym.instagram && (
              <div className="flex items-start gap-3">
                <span className="text-gray-400 mt-0.5 flex-shrink-0">📸</span>
                <div>
                  <p className="text-sm text-gray-400">Instagram</p>
                  <a 
                    href={`https://instagram.com/${currentGym.instagram.replace('@', '')}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="font-medium text-primary hover:underline"
                  >
                    @{currentGym.instagram.replace('@', '')}
                  </a>
                </div>
              </div>
            )}

            {!currentGym.address && !currentGym.phone && !currentGym.email && !currentGym.website && !currentGym.instagram && (
              <p className="text-gray-500 text-center py-4">
                No hay información de contacto disponible
              </p>
            )}
          </div>
        </Card>

        {/* Horarios */}
        <Card>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock size={20} className="text-primary" />
            Horarios
          </h2>
          {currentGym.schedule ? (
            <div className="space-y-2">
              {Object.entries(currentGym.schedule).map(([day, hours]) => (
                <div key={day} className="flex justify-between py-2 border-b border-gray-700 last:border-0">
                  <span className="text-gray-400 capitalize">{day}</span>
                  <span className="font-medium">{hours || 'Cerrado'}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">
              No hay horarios configurados
            </p>
          )}
        </Card>
      </div>

      {/* Descripción */}
      {currentGym.description && (
        <Card>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Dumbbell size={20} className="text-primary" />
            Sobre Nosotros
          </h2>
          <p className="text-gray-300 whitespace-pre-line">{currentGym.description}</p>
        </Card>
      )}

      {/* Servicios */}
      {currentGym.services && currentGym.services.length > 0 && (
        <Card>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users size={20} className="text-primary" />
            Servicios
          </h2>
          <div className="flex flex-wrap gap-2">
            {currentGym.services.map((service, i) => (
              <Badge key={i} className="bg-primary/20 text-primary">
                {service}
              </Badge>
            ))}
          </div>
        </Card>
      )}

      {/* Info adicional */}
      <Card className="bg-gray-800/50">
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <Info size={16} />
          <span>
            Si necesitás actualizar la información del gimnasio, contactá con un administrador.
          </span>
        </div>
      </Card>
    </div>
  );
};

const GymInfo = () => (
  <GymRequired>
    <GymInfoContent />
  </GymRequired>
);

export default GymInfo;
