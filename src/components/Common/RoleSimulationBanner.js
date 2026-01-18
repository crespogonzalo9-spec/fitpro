import React from 'react';
import { X, AlertTriangle, Eye } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

const RoleSimulationBanner = () => {
  const { simulatedRole, stopRoleSimulation, isSimulating } = useAuth();
  const { success } = useToast();

  if (!isSimulating()) return null;

  const getRoleName = () => {
    switch (simulatedRole) {
      case 'admin':
        return 'Administrador';
      case 'profesor':
        return 'Profesor';
      case 'miembro':
        return 'Miembro';
      default:
        return simulatedRole;
    }
  };

  const handleStop = () => {
    stopRoleSimulation();
    success('Volviste a tu vista de Sysadmin');
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 animate-fadeIn">
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-3 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle size={20} className="animate-pulse" />
              <Eye size={20} />
            </div>
            <div>
              <p className="font-semibold text-sm">
                Modo Simulación Activo
              </p>
              <p className="text-xs opacity-90">
                Estás viendo la aplicación como: <strong>{getRoleName()}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={handleStop}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm font-medium whitespace-nowrap"
          >
            <X size={16} />
            Volver a Vista Normal
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoleSimulationBanner;
