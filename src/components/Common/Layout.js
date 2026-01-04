import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useGym } from '../../contexts/GymContext';
import { useTheme } from '../../contexts/ThemeContext';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { currentGym } = useGym();
  const { setGymId } = useTheme();

  // Sincronizar gymId con ThemeContext
  useEffect(() => {
    if (currentGym?.id) {
      setGymId(currentGym.id);
    }
  }, [currentGym?.id, setGymId]);

  const getPageTitle = () => {
    const titles = {
      '/dashboard': 'Dashboard',
      '/gyms': 'Gimnasios',
      '/users': 'Usuarios',
      '/members': 'Alumnos',
      '/profesores': 'Profesores',
      '/classes': 'Clases',
      '/exercises': 'Ejercicios',
      '/routines': 'Rutinas',
      '/wods': 'WODs',
      '/rankings': 'Rankings',
      '/prs': 'Marcas Personales',
      '/schedule': 'Horarios',
      '/my-classes': 'Mis Clases',
      '/my-routines': 'Mis Rutinas',
      '/my-prs': 'Mis PRs',
      '/calendar': 'Calendario',
      '/news': 'Novedades',
      '/invites': 'Invitaciones',
      '/profile': 'Mi Perfil',
      '/settings': 'Configuración'
    };
    return titles[location.pathname] || 'FitPro';
  };

  return (
    <div className="min-h-screen transition-theme">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      <div className="lg:ml-64">
        <Header 
          title={getPageTitle()} 
          onMenuClick={() => setSidebarOpen(true)} 
        />
        
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
