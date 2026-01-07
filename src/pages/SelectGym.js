import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, ChevronRight, Globe } from 'lucide-react';
import { Card, LoadingState, EmptyState, Button } from '../components/Common';
import { useGym } from '../contexts/GymContext';
import { useAuth } from '../contexts/AuthContext';

const SelectGym = () => {
  const { availableGyms, loading, selectGym } = useGym();
  const { userData, isSysadmin } = useAuth();
  const navigate = useNavigate();

  const handleSelectGym = (gym) => {
    selectGym(gym.id);
    // Navegar a la dashboard del gimnasio
    navigate(`/${gym.slug}/dashboard`);
  };

  const handleViewAllGyms = () => {
    selectGym('__ALL_GYMS__');
    navigate('/dashboard');
  };

  if (loading) {
    return <LoadingState message="Cargando gimnasios..." />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/50 mb-4">
            <Building2 className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Seleccionar Gimnasio</h1>
          <p className="text-gray-400">
            Hola, {userData?.name}. Elegí el gimnasio al que querés acceder.
          </p>
        </div>

        {availableGyms.length === 0 ? (
          <Card>
            <EmptyState
              icon={Building2}
              title="Sin gimnasios disponibles"
              description="No tenés gimnasios asignados. Contactá con un administrador para obtener acceso."
            />
          </Card>
        ) : (
          <>
            {/* Vista global para sysadmin */}
            {isSysadmin && isSysadmin() && (
              <Card
                onClick={handleViewAllGyms}
                className="mb-4 cursor-pointer hover:border-primary transition-colors"
              >
                <div className="flex items-center justify-between p-2">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-blue-500/20 flex items-center justify-center">
                      <Globe className="text-blue-400" size={28} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Vista Global</h3>
                      <p className="text-sm text-gray-400">Ver todos los gimnasios</p>
                    </div>
                  </div>
                  <ChevronRight size={24} className="text-gray-500" />
                </div>
              </Card>
            )}

            {/* Lista de gimnasios */}
            <div className="grid gap-4 md:grid-cols-2">
              {availableGyms.map(gym => (
                <Card
                  key={gym.id}
                  onClick={() => handleSelectGym(gym)}
                  className="cursor-pointer hover:border-primary transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-gray-700 flex items-center justify-center overflow-hidden">
                        {gym.logoBase64 ? (
                          <img src={gym.logoBase64} alt={gym.name} className="w-full h-full object-cover" />
                        ) : (
                          <Building2 className="text-gray-400" size={24} />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{gym.name}</h3>
                        {gym.address && <p className="text-sm text-gray-400">{gym.address}</p>}
                        {gym.slug && <p className="text-xs text-gray-500 font-mono mt-1">/{gym.slug}</p>}
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-gray-500" />
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* Logout button */}
        <div className="mt-6 text-center">
          <Button variant="ghost" onClick={() => navigate('/settings')}>
            Ir a configuración
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SelectGym;
