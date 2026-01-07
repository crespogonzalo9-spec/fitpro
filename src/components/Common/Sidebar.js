import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Calendar, Dumbbell, ClipboardList,
  Settings, LogOut, Building2, UserCheck, Flame, Trophy,
  TrendingUp, CheckCircle, CheckSquare, User, X, ChevronDown,
  CalendarDays, Megaphone, Link, Globe
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useGym, ALL_GYMS_ID } from '../../contexts/GymContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Avatar, Badge } from './index';
import { NAV_ROUTES } from '../../utils/constants';
import { getRoleName } from '../../utils/helpers';

const iconMap = {
  LayoutDashboard, Users, Calendar, Dumbbell, ClipboardList,
  Settings, Building2, UserCheck, Flame, Trophy, TrendingUp,
  CheckCircle, CheckSquare, User, CalendarDays, Megaphone, Link
};

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { userData, logout, isSysadmin } = useAuth();
  const { currentGym, availableGyms, selectGym, viewAllGyms } = useGym();
  const { gymLogo } = useTheme();
  const navigate = useNavigate();
  const [showGymSelector, setShowGymSelector] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Determinar rutas basado en roles múltiples
  const getRoutes = () => {
    if (!userData?.roles) return NAV_ROUTES.alumno;
    if (userData.roles.includes('sysadmin')) return NAV_ROUTES.sysadmin;
    if (userData.roles.includes('admin')) return NAV_ROUTES.admin;
    if (userData.roles.includes('profesor')) return NAV_ROUTES.profesor;
    return NAV_ROUTES.alumno;
  };

  const routes = getRoutes();

  // Obtener el rol más alto para mostrar
  const getHighestRole = () => {
    if (!userData?.roles) return 'alumno';
    if (userData.roles.includes('sysadmin')) return 'sysadmin';
    if (userData.roles.includes('admin')) return 'admin';
    if (userData.roles.includes('profesor')) return 'profesor';
    return 'alumno';
  };

  const getSelectorLabel = () => {
    if (viewAllGyms) return '🌐 Todos los gimnasios';
    return currentGym?.name || 'Seleccionar gimnasio';
  };

  // Generar ruta con slug del gimnasio
  // Rutas especiales de sysadmin sin gymSlug: /gyms, /users, /dashboard (cuando viewAllGyms)
  const getRoutePath = (routePath) => {
    const sysadminGlobalRoutes = ['/gyms', '/users'];

    // Si es sysadmin viendo todos los gimnasios, usar rutas sin slug
    if (viewAllGyms && sysadminGlobalRoutes.includes(routePath)) {
      return routePath;
    }

    // Si es el dashboard y está en modo "todos los gimnasios", usar /dashboard
    if (viewAllGyms && routePath === '/dashboard') {
      return '/dashboard';
    }

    // Para todas las demás rutas, agregar el slug del gimnasio si existe
    if (currentGym?.slug) {
      return `/${currentGym.slug}${routePath}`;
    }

    // Fallback a la ruta original
    return routePath;
  };

  // Manejar cambio de gimnasio con navegación correcta
  const handleGymChange = (gymIdOrAll) => {
    if (gymIdOrAll === ALL_GYMS_ID) {
      selectGym(ALL_GYMS_ID);
      navigate('/dashboard');
    } else {
      const gym = availableGyms.find(g => g.id === gymIdOrAll);
      if (gym && gym.slug) {
        selectGym(gymIdOrAll);
        navigate(`/${gym.slug}/dashboard`);
      }
    }
    setShowGymSelector(false);
  };

  return (
    <>
      {/* Overlay móvil */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-slate-900 border-r border-gray-800 z-50 transition-transform lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-gray-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {gymLogo ? (
                  <img src={gymLogo} alt="Logo" className="w-10 h-10 rounded-xl object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(var(--color-primary), 1)' }}>
                    <Dumbbell size={20} className="text-white" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h1 className="font-bold text-lg truncate">
                    {currentGym?.name || 'FitPro'}
                  </h1>
                  <Badge className="badge-primary text-xs">{getRoleName(getHighestRole())}</Badge>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="lg:hidden p-1 hover:bg-gray-800 rounded">
                <X size={20} />
              </button>
            </div>

            {/* Selector de gimnasio para sysadmin */}
            {isSysadmin && isSysadmin() && availableGyms && availableGyms.length > 0 && (
              <div className="mt-4 relative">
                <button
                  onClick={() => setShowGymSelector(!showGymSelector)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-colors ${
                    viewAllGyms 
                      ? 'bg-blue-500/20 border border-blue-500/50 text-blue-400' 
                      : 'bg-gray-800 hover:bg-gray-700'
                  }`}
                >
                  <span className="text-sm truncate">{getSelectorLabel()}</span>
                  <ChevronDown size={16} className={`transition-transform ${showGymSelector ? 'rotate-180' : ''}`} />
                </button>
                {showGymSelector && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 rounded-xl shadow-lg border border-gray-700 max-h-64 overflow-y-auto z-50">
                    {/* Opción "Todos los gimnasios" */}
                    <button
                      onClick={() => handleGymChange(ALL_GYMS_ID)}
                      className={`w-full text-left px-3 py-2 hover:bg-gray-700 text-sm flex items-center gap-2 border-b border-gray-700 ${
                        viewAllGyms ? 'text-blue-400 bg-blue-500/10' : ''
                      }`}
                    >
                      <Globe size={14} />
                      <span>Todos los gimnasios</span>
                    </button>

                    {/* Lista de gimnasios */}
                    {availableGyms.map(gym => (
                      <button
                        key={gym.id}
                        onClick={() => handleGymChange(gym.id)}
                        className={`w-full text-left px-3 py-2 hover:bg-gray-700 text-sm ${
                          !viewAllGyms && currentGym?.id === gym.id ? 'text-primary bg-primary/10' : ''
                        }`}
                      >
                        {gym.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Mostrar gimnasio actual para otros roles */}
            {(!isSysadmin || !isSysadmin()) && currentGym && (
              <div className="mt-3 px-3 py-2 bg-gray-800/50 rounded-xl">
                <p className="text-xs text-gray-400">Gimnasio</p>
                <p className="text-sm font-medium truncate">{currentGym.name}</p>
              </div>
            )}
          </div>

          {/* Navegación */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-1">
            {routes.map(route => {
              const Icon = iconMap[route.icon] || LayoutDashboard;
              const routePath = getRoutePath(route.path);
              return (
                <NavLink
                  key={route.path}
                  to={routePath}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                      isActive
                        ? 'nav-link-active font-medium'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`
                  }
                >
                  <Icon size={20} />
                  <span>{route.name}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Usuario y logout */}
          <div className="p-3 border-t border-gray-800">
            <div className="flex items-center gap-3 px-3 py-2 mb-2">
              <Avatar name={userData?.name} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{userData?.name}</p>
                <p className="text-xs text-gray-400 truncate">{userData?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
            >
              <LogOut size={20} />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
