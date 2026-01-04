import React from 'react';
import { ShieldX, LogOut, Phone, Mail } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useGym } from '../../contexts/GymContext';

const BlockedScreen = () => {
  const { userData, logout } = useAuth();
  const { currentGym } = useGym();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="w-full max-w-md text-center">
        {/* Icono */}
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-red-500/20 mb-6">
          <ShieldX className="text-red-500" size={48} />
        </div>

        {/* Título */}
        <h1 className="text-2xl font-bold text-white mb-2">Cuenta Suspendida</h1>
        
        {/* Mensaje */}
        <p className="text-gray-400 mb-8">
          Tu cuenta ha sido suspendida temporalmente. 
          Por favor, comunicate con el administrador del gimnasio para más información.
        </p>

        {/* Info del gimnasio */}
        {currentGym && (
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 mb-6 text-left">
            <h3 className="font-medium text-white mb-3">Contacto del gimnasio</h3>
            <p className="text-lg font-semibold text-primary mb-2">{currentGym.name}</p>
            
            {currentGym.phone && (
              <a 
                href={`tel:${currentGym.phone}`}
                className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors py-2"
              >
                <Phone size={18} />
                <span>{currentGym.phone}</span>
              </a>
            )}
            
            {currentGym.email && (
              <a 
                href={`mailto:${currentGym.email}`}
                className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors py-2"
              >
                <Mail size={18} />
                <span>{currentGym.email}</span>
              </a>
            )}

            {currentGym.address && (
              <p className="text-sm text-gray-500 mt-2">{currentGym.address}</p>
            )}
          </div>
        )}

        {/* Usuario actual */}
        <div className="text-sm text-gray-500 mb-6">
          Sesión iniciada como: <span className="text-gray-400">{userData?.email}</span>
        </div>

        {/* Botón cerrar sesión */}
        <button
          onClick={handleLogout}
          className="w-full py-3 px-4 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <LogOut size={18} />
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
};

export default BlockedScreen;
