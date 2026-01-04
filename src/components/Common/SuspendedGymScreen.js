import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useGym } from '../../contexts/GymContext';

const SuspendedGymScreen = () => {
  const { userData, isSysadmin } = useAuth();
  const { currentGym } = useGym();

  const isAdmin = userData?.roles?.includes('admin');
  const isProfesorOrAlumno = userData?.roles?.some(r => ['profesor', 'alumno'].includes(r));

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-md w-full">
        <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-8 border border-red-500/50 shadow-2xl">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center">
              <AlertTriangle className="text-red-500" size={48} />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-white text-center mb-4">
            Gimnasio Suspendido
          </h1>

          {/* Mensaje para Admin */}
          {isAdmin && !isSysadmin() && (
            <div className="space-y-4">
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                <p className="text-red-400 text-center font-medium">
                  El gimnasio <strong>{currentGym?.name}</strong> ha sido suspendido temporalmente.
                </p>
                {currentGym?.suspendedReason && (
                  <p className="text-sm text-gray-300 text-center mt-2">
                    Motivo: {currentGym.suspendedReason}
                  </p>
                )}
              </div>
              <p className="text-gray-400 text-center text-sm">
                Por favor, contactá al soporte de FitPro para regularizar esta situación.
              </p>
              <div className="text-center">
                <a
                  href="mailto:soporte@fitpro.com"
                  className="text-primary hover:text-primary/80 text-sm underline"
                >
                  soporte@fitpro.com
                </a>
              </div>
            </div>
          )}

          {/* Mensaje para Profesor/Alumno */}
          {isProfesorOrAlumno && !isAdmin && !isSysadmin() && (
            <div className="space-y-4">
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                <p className="text-red-400 text-center font-bold text-lg">
                  GIMNASIO SUSPENDIDO
                </p>
                <p className="text-gray-300 text-center mt-2">
                  CONTACTARSE CON ADMINISTRADOR
                </p>
              </div>
              <p className="text-gray-400 text-center text-sm">
                El acceso al gimnasio <strong className="text-white">{currentGym?.name}</strong> está temporalmente suspendido.
              </p>
            </div>
          )}

          {/* Mensaje para Sysadmin (no debería ver esto, pero por seguridad) */}
          {isSysadmin() && (
            <div className="space-y-4">
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                <p className="text-yellow-400 text-center font-medium">
                  Este gimnasio está suspendido. Como sysadmin, podés reactivarlo desde la sección de Gimnasios.
                </p>
              </div>
            </div>
          )}

          <div className="mt-6 text-center">
            <button
              onClick={() => window.location.href = '/'}
              className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors"
            >
              Volver al inicio
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuspendedGymScreen;
