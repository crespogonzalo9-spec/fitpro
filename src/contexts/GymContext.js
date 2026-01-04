import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, collection, onSnapshot } from 'firebase/firestore';
import { useAuth } from './AuthContext';

const GymContext = createContext();

export const useGym = () => useContext(GymContext);

// Constante para "todos los gimnasios"
export const ALL_GYMS_ID = '__ALL_GYMS__';

export const GymProvider = ({ children }) => {
  const { userData, isSysadmin } = useAuth();
  const [currentGym, setCurrentGymState] = useState(null);
  const [availableGyms, setAvailableGyms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewAllGyms, setViewAllGyms] = useState(false);

  useEffect(() => {
    if (!userData) {
      setCurrentGymState(null);
      setAvailableGyms([]);
      setLoading(false);
      return;
    }

    // Sysadmin puede ver todos los gimnasios
    if (isSysadmin && isSysadmin()) {
      const unsubscribe = onSnapshot(collection(db, 'gyms'), (snapshot) => {
        const gymList = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        gymList.sort((a, b) => a.name?.localeCompare(b.name));
        setAvailableGyms(gymList);
        
        // Recuperar gimnasio guardado en localStorage
        const savedGymId = localStorage.getItem('fitpro-selected-gym');
        
        if (savedGymId === ALL_GYMS_ID) {
          setViewAllGyms(true);
          setCurrentGymState(null);
        } else {
          const savedGym = gymList.find(g => g.id === savedGymId);
          if (savedGym) {
            setCurrentGymState(savedGym);
            setViewAllGyms(false);
          } else if (gymList.length > 0) {
            // Si no hay guardado, seleccionar el primero
            setCurrentGymState(gymList[0]);
            setViewAllGyms(false);
            localStorage.setItem('fitpro-selected-gym', gymList[0].id);
          }
        }
        setLoading(false);
      });
      return () => unsubscribe();
    }

    // Otros usuarios ven solo su gimnasio asignado
    if (userData.gymId) {
      const unsubscribe = onSnapshot(doc(db, 'gyms', userData.gymId), (docSnap) => {
        if (docSnap.exists()) {
          const gym = { id: docSnap.id, ...docSnap.data() };
          setCurrentGymState(gym);
          setAvailableGyms([gym]);
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      // Usuario sin gimnasio
      setCurrentGymState(null);
      setAvailableGyms([]);
      setLoading(false);
    }
  }, [userData, isSysadmin]);

  // Función para seleccionar gimnasio (solo sysadmin)
  const selectGym = (gymId) => {
    if (gymId === ALL_GYMS_ID) {
      setCurrentGymState(null);
      setViewAllGyms(true);
      localStorage.setItem('fitpro-selected-gym', ALL_GYMS_ID);
    } else {
      const gym = availableGyms.find(g => g.id === gymId);
      if (gym) {
        setCurrentGymState(gym);
        setViewAllGyms(false);
        localStorage.setItem('fitpro-selected-gym', gymId);
      }
    }
  };

  // Función para verificar si el gimnasio actual está suspendido
  const isGymSuspended = () => {
    if (!currentGym) return false;
    // Sysadmin nunca está suspendido
    if (isSysadmin && isSysadmin()) return false;
    return currentGym.suspended === true;
  };

  const value = {
    currentGym,
    availableGyms,
    selectGym,
    loading,
    viewAllGyms,
    isGymSuspended,
    // Helper para saber si debe filtrar por gym
    shouldFilterByGym: !viewAllGyms && currentGym?.id,
    // ID del gym actual o null si es "todos"
    currentGymId: viewAllGyms ? null : currentGym?.id
  };

  return (
    <GymContext.Provider value={value}>
      {children}
    </GymContext.Provider>
  );
};
