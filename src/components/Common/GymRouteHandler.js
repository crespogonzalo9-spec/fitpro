import React, { useEffect } from 'react';
import { useParams, useNavigate, Outlet } from 'react-router-dom';
import { useGym } from '../../contexts/GymContext';
import { LoadingState } from './index';

/**
 * Componente que maneja la resolución del gimnasio desde el slug de la URL
 * Este componente se coloca como wrapper de las rutas que requieren un gimnasio
 */
const GymRouteHandler = ({ children }) => {
  const { gymSlug } = useParams();
  const { availableGyms, currentGym, selectGym, loading } = useGym();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || !availableGyms.length) return;

    // Buscar gimnasio por slug
    const gym = availableGyms.find(g => g.slug === gymSlug);

    if (!gym) {
      // Si no se encuentra el gimnasio, redirigir a selección
      console.warn(`Gimnasio con slug "${gymSlug}" no encontrado`);
      navigate('/select-gym', { replace: true });
      return;
    }

    // Si el gimnasio actual no es el correcto, seleccionarlo
    if (!currentGym || currentGym.id !== gym.id) {
      selectGym(gym.id);
    }
  }, [gymSlug, availableGyms, currentGym, selectGym, loading, navigate]);

  if (loading) {
    return <LoadingState message="Cargando gimnasio..." />;
  }

  // Verificar que el slug coincida con el gimnasio actual
  if (currentGym && currentGym.slug !== gymSlug) {
    return <LoadingState message="Cargando gimnasio..." />;
  }

  if (!currentGym) {
    return <LoadingState message="Cargando gimnasio..." />;
  }

  return children || <Outlet />;
};

export default GymRouteHandler;
