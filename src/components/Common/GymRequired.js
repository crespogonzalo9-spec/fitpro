import React from 'react';
import { Building2, Globe } from 'lucide-react';
import { Card, Button } from './index';
import { useGym, ALL_GYMS_ID } from '../../contexts/GymContext';
import { useAuth } from '../../contexts/AuthContext';

// Componente para páginas que requieren un gimnasio específico seleccionado
const GymRequired = ({ children, allowAllGyms = false }) => {
  const { currentGym, viewAllGyms, availableGyms, selectGym } = useGym();
  const { isSysadmin } = useAuth();

  // Si está en modo "todos los gimnasios"
  if (viewAllGyms && !allowAllGyms) {
    return (
      <div className="space-y-6 animate-fadeIn">
        <Card className="bg-blue-500/10 border-blue-500/30">
          <div className="flex flex-col items-center text-center py-8">
            <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mb-4">
              <Globe className="text-blue-400" size={32} />
            </div>
            <h3 className="text-lg font-semibold text-blue-400 mb-2">
              Seleccioná un gimnasio
            </h3>
            <p className="text-gray-400 mb-6 max-w-md">
              Esta sección requiere que selecciones un gimnasio específico para ver y gestionar sus datos.
            </p>
            
            {availableGyms.length > 0 && (
              <div className="grid gap-2 w-full max-w-md">
                {availableGyms.slice(0, 5).map(gym => (
                  <Button
                    key={gym.id}
                    variant="secondary"
                    onClick={() => selectGym(gym.id)}
                    className="justify-start"
                  >
                    <Building2 size={16} className="mr-2" />
                    {gym.name}
                  </Button>
                ))}
                {availableGyms.length > 5 && (
                  <p className="text-xs text-gray-500 mt-2">
                    +{availableGyms.length - 5} gimnasios más...
                  </p>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  }

  // Sin gimnasio seleccionado
  if (!currentGym) {
    return (
      <div className="space-y-6 animate-fadeIn">
        <Card className="bg-yellow-500/10 border-yellow-500/30">
          <div className="flex flex-col items-center text-center py-8">
            <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center mb-4">
              <Building2 className="text-yellow-400" size={32} />
            </div>
            <h3 className="text-lg font-semibold text-yellow-400 mb-2">
              Sin gimnasio
            </h3>
            <p className="text-gray-400 max-w-md">
              {isSysadmin() 
                ? 'Seleccioná un gimnasio desde el menú lateral para ver esta sección.'
                : 'Necesitás estar asociado a un gimnasio para ver esta sección.'
              }
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return children;
};

export default GymRequired;
