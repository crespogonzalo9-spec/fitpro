import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const COLOR_PALETTES = [
  { id: 'emerald', name: 'Esmeralda', primary: '16, 185, 129', hex: '#10B981' },
  { id: 'blue', name: 'Azul', primary: '59, 130, 246', hex: '#3B82F6' },
  { id: 'purple', name: 'Púrpura', primary: '139, 92, 246', hex: '#8B5CF6' },
  { id: 'red', name: 'Rojo', primary: '239, 68, 68', hex: '#EF4444' },
  { id: 'orange', name: 'Naranja', primary: '249, 115, 22', hex: '#F97316' },
  { id: 'pink', name: 'Rosa', primary: '236, 72, 153', hex: '#EC4899' },
  { id: 'cyan', name: 'Cian', primary: '6, 182, 212', hex: '#06B6D4' },
  { id: 'yellow', name: 'Amarillo', primary: '234, 179, 8', hex: '#EAB308' },
];

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(true);
  const [paletteId, setPaletteId] = useState('emerald');
  const [gymLogo, setGymLogo] = useState(null);
  const [currentGymId, setCurrentGymId] = useState(null);

  // Escuchar cambios del gimnasio actual
  useEffect(() => {
    if (!currentGymId) return;

    const unsubscribe = onSnapshot(doc(db, 'gyms', currentGymId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        // Aplicar paleta del gimnasio
        if (data.colorPalette) {
          setPaletteId(data.colorPalette);
        }
        // Aplicar modo oscuro/claro del gimnasio
        if (data.darkMode !== undefined) {
          setIsDark(data.darkMode);
        }
        // Logo del gimnasio
        if (data.logo) {
          setGymLogo(data.logo);
        } else {
          setGymLogo(null);
        }
      }
    });

    return () => unsubscribe();
  }, [currentGymId]);

  // Aplicar estilos al DOM
  useEffect(() => {
    const palette = COLOR_PALETTES.find(p => p.id === paletteId) || COLOR_PALETTES[0];
    const root = document.documentElement;
    
    // CSS Variables para el color primario
    root.style.setProperty('--color-primary', palette.primary);
    root.style.setProperty('--color-primary-hex', palette.hex);
    
    // Modo oscuro/claro
    if (isDark) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, [isDark, paletteId]);

  const toggleTheme = () => setIsDark(!isDark);

  // Guardar configuración del gimnasio en Firebase
  const saveGymTheme = async (gymId, newPaletteId, newDarkMode) => {
    try {
      await updateDoc(doc(db, 'gyms', gymId), {
        colorPalette: newPaletteId,
        darkMode: newDarkMode
      });
      return { success: true };
    } catch (error) {
      console.error('Error saving theme:', error);
      return { success: false, error: error.message };
    }
  };

  const saveGymLogo = async (gymId, logoUrl) => {
    try {
      await updateDoc(doc(db, 'gyms', gymId), { logo: logoUrl });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Función para que el Layout actualice el gymId actual
  const setGymId = (gymId) => {
    setCurrentGymId(gymId);
  };

  const colorPalette = COLOR_PALETTES.find(p => p.id === paletteId) || COLOR_PALETTES[0];

  return (
    <ThemeContext.Provider value={{
      isDark,
      toggleTheme,
      paletteId,
      setPaletteId,
      colorPalette,
      gymLogo,
      setGymId,
      saveGymTheme,
      saveGymLogo
    }}>
      {children}
    </ThemeContext.Provider>
  );
};
