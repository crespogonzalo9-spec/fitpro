import React, { createContext, useContext, useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { db } from '../firebase';
import { doc, collection, onSnapshot, updateDoc } from 'firebase/firestore';
import { useAuth } from './AuthContext';

const GymContext = createContext();

export const useGym = () => useContext(GymContext);

// Constante para "todos los gimnasios"
export const ALL_GYMS_ID = '__ALL_GYMS__';

// Helper para generar slug (mismo que en Gyms.js)
const generateSlug = (name) => {
  if (!name) return null;
  return name
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-'); // Remove multiple hyphens
};

export const GymProvider = ({ children }) => {
  const { userData, isSysadmin } = useAuth();
  const { gymSlug } = useParams();
  const location = useLocation();
  const [currentGym, setCurrentGymState] = useState(null);
  const [availableGyms, setAvailableGyms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewAllGyms, setViewAllGyms] = useState(false);
  const [gymFromSlug, setGymFromSlug] = useState(null);

  useEffect(() => {
    if (!userData) {
      setCurrentGymState(null);
      setAvailableGyms([]);
      setLoading(false);
      return;
    }

    // Sysadmin puede ver todos los gimnasios
    if (isSysadmin && isSysadmin()) {
      const unsubscribe = onSnapshot(collection(db, 'gyms'), async (snapshot) => {
        const gymList = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

        // MIGRACIÓN: Auto-generar slugs para gyms que no tienen
        const migrationsNeeded = [];
        gymList.forEach(gym => {
          if (!gym.slug && gym.name) {
            const slug = generateSlug(gym.name);
            if (slug) {
              migrationsNeeded.push({ id: gym.id, slug });
              gym.slug = slug; // Actualizar en memoria
            }
          }
        });

        // Ejecutar migraciones en segundo plano
        if (migrationsNeeded.length > 0) {
          console.log(`[GymContext] Migrando ${migrationsNeeded.length} gimnasios sin slug`);
          migrationsNeeded.forEach(async ({ id, slug }) => {
            try {
              await updateDoc(doc(db, 'gyms', id), { slug });
              console.log(`[GymContext] Slug generado para gym ${id}: ${slug}`);
            } catch (err) {
              console.error(`[GymContext] Error migrando gym ${id}:`, err);
            }
          });
        }

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
      const unsubscribe = onSnapshot(doc(db, 'gyms', userData.gymId), async (docSnap) => {
        if (docSnap.exists()) {
          const gym = { id: docSnap.id, ...docSnap.data() };

          // MIGRACIÓN: Auto-generar slug si no existe
          if (!gym.slug && gym.name) {
            const slug = generateSlug(gym.name);
            if (slug) {
              try {
                await updateDoc(doc(db, 'gyms', gym.id), { slug });
                gym.slug = slug; // Actualizar en memoria
                console.log(`[GymContext] Slug generado para gym ${gym.id}: ${slug}`);
              } catch (err) {
                console.error(`[GymContext] Error generando slug:`, err);
              }
            }
          }

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

  // Detectar gym desde slug en URL (tiene prioridad sobre localStorage)
  useEffect(() => {
    if (!gymSlug || availableGyms.length === 0) return;

    const gymBySlug = availableGyms.find(g => g.slug === gymSlug);
    if (gymBySlug) {
      setGymFromSlug(gymBySlug);
      setCurrentGymState(gymBySlug);
      setViewAllGyms(false);
      // Guardar en localStorage para mantener selección
      localStorage.setItem('fitpro-selected-gym', gymBySlug.id);
    }
  }, [gymSlug, availableGyms]);

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
    currentGymId: viewAllGyms ? null : currentGym?.id,
    // Slug del gym actual para construir URLs
    currentGymSlug: currentGym?.slug || null
  };

  return (
    <GymContext.Provider value={value}>
      {children}
    </GymContext.Provider>
  );
};
