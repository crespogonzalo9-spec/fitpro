import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const COLOR_PALETTES = [
  // ROJOS (1-4)
  { id: 'crimson', name: 'Carmesí', primary: '220, 38, 38', hex: '#DC2626', bgDark: '69, 10, 10', bgLight: '254, 242, 242', bg900: '69, 10, 10', bg800: '127, 29, 29', bg700: '185, 28, 28', bg200: '254, 202, 202', bg100: '254, 226, 226', bg50: '254, 242, 242' },
  { id: 'rose', name: 'Rosa Coral', primary: '244, 63, 94', hex: '#F43F5E', bgDark: '76, 5, 25', bgLight: '255, 241, 242', bg900: '76, 5, 25', bg800: '136, 19, 55', bg700: '190, 18, 60', bg200: '253, 164, 175', bg100: '255, 228, 230', bg50: '255, 241, 242' },
  { id: 'pink', name: 'Rosa Magenta', primary: '236, 72, 153', hex: '#EC4899', bgDark: '80, 7, 36', bgLight: '253, 242, 248', bg900: '80, 7, 36', bg800: '131, 24, 67', bg700: '190, 24, 93', bg200: '251, 207, 232', bg100: '252, 231, 243', bg50: '253, 242, 248' },
  { id: 'fuchsia', name: 'Fucsia', primary: '217, 70, 239', hex: '#D946EF', bgDark: '74, 4, 78', bgLight: '253, 244, 255', bg900: '74, 4, 78', bg800: '134, 25, 143', bg700: '192, 38, 211', bg200: '245, 208, 254', bg100: '250, 232, 255', bg50: '253, 244, 255' },

  // PÚRPURAS-VIOLETAS (5-8)
  { id: 'purple', name: 'Púrpura', primary: '168, 85, 247', hex: '#A855F7', bgDark: '59, 7, 100', bgLight: '250, 245, 255', bg900: '59, 7, 100', bg800: '107, 33, 168', bg700: '126, 34, 206', bg200: '233, 213, 255', bg100: '243, 232, 255', bg50: '250, 245, 255' },
  { id: 'violet', name: 'Violeta', primary: '139, 92, 246', hex: '#8B5CF6', bgDark: '46, 16, 101', bgLight: '245, 243, 255', bg900: '46, 16, 101', bg800: '91, 33, 182', bg700: '109, 40, 217', bg200: '221, 214, 254', bg100: '237, 233, 254', bg50: '245, 243, 255' },
  { id: 'indigo', name: 'Índigo', primary: '99, 102, 241', hex: '#6366F1', bgDark: '30, 27, 75', bgLight: '238, 242, 255', bg900: '30, 27, 75', bg800: '55, 48, 163', bg700: '67, 56, 202', bg200: '199, 210, 254', bg100: '224, 231, 255', bg50: '238, 242, 255' },
  { id: 'lavender', name: 'Lavanda', primary: '124, 58, 237', hex: '#7C3AED', bgDark: '42, 15, 83', bgLight: '246, 245, 255', bg900: '42, 15, 83', bg800: '76, 29, 149', bg700: '91, 33, 182', bg200: '216, 180, 254', bg100: '233, 213, 255', bg50: '246, 245, 255' },

  // AZULES (9-13)
  { id: 'navy', name: 'Azul Marino', primary: '37, 99, 235', hex: '#2563EB', bgDark: '23, 37, 84', bgLight: '239, 246, 255', bg900: '23, 37, 84', bg800: '30, 58, 138', bg700: '29, 78, 216', bg200: '191, 219, 254', bg100: '219, 234, 254', bg50: '239, 246, 255' },
  { id: 'blue', name: 'Azul Cielo', primary: '59, 130, 246', hex: '#3B82F6', bgDark: '7, 36, 84', bgLight: '239, 246, 255', bg900: '7, 36, 84', bg800: '30, 64, 175', bg700: '37, 99, 235', bg200: '147, 197, 253', bg100: '191, 219, 254', bg50: '239, 246, 255' },
  { id: 'cyan', name: 'Cian', primary: '6, 182, 212', hex: '#06B6D4', bgDark: '8, 51, 68', bgLight: '236, 254, 255', bg900: '8, 51, 68', bg800: '14, 116, 144', bg700: '21, 94, 117', bg200: '165, 243, 252', bg100: '207, 250, 254', bg50: '236, 254, 255' },
  { id: 'sky', name: 'Azul Celeste', primary: '14, 165, 233', hex: '#0EA5E9', bgDark: '8, 47, 73', bgLight: '240, 249, 255', bg900: '8, 47, 73', bg800: '7, 89, 133', bg700: '3, 105, 161', bg200: '186, 230, 253', bg100: '224, 242, 254', bg50: '240, 249, 255' },
  { id: 'teal', name: 'Azul Verdoso', primary: '20, 184, 166', hex: '#14B8A6', bgDark: '4, 47, 46', bgLight: '240, 253, 250', bg900: '4, 47, 46', bg800: '17, 94, 89', bg700: '15, 118, 110', bg200: '153, 246, 228', bg100: '204, 251, 241', bg50: '240, 253, 250' },

  // VERDES (14-18)
  { id: 'emerald', name: 'Esmeralda', primary: '16, 185, 129', hex: '#10B981', bgDark: '6, 78, 59', bgLight: '236, 253, 245', bg900: '6, 78, 59', bg800: '6, 95, 70', bg700: '4, 120, 87', bg200: '167, 243, 208', bg100: '209, 250, 229', bg50: '236, 253, 245' },
  { id: 'green', name: 'Verde Bosque', primary: '34, 197, 94', hex: '#22C55E', bgDark: '5, 46, 22', bgLight: '240, 253, 244', bg900: '5, 46, 22', bg800: '22, 101, 52', bg700: '21, 128, 61', bg200: '187, 247, 208', bg100: '220, 252, 231', bg50: '240, 253, 244' },
  { id: 'lime', name: 'Lima', primary: '132, 204, 22', hex: '#84CC16', bgDark: '26, 46, 5', bgLight: '247, 254, 231', bg900: '26, 46, 5', bg800: '54, 83, 20', bg700: '77, 124, 15', bg200: '217, 249, 157', bg100: '236, 252, 203', bg50: '247, 254, 231' },
  { id: 'mint', name: 'Menta', primary: '52, 211, 153', hex: '#34D399', bgDark: '6, 78, 59', bgLight: '236, 253, 245', bg900: '6, 78, 59', bg800: '6, 120, 89', bg700: '5, 150, 105', bg200: '167, 243, 208', bg100: '209, 250, 229', bg50: '236, 253, 245' },
  { id: 'sage', name: 'Salvia', primary: '74, 222, 128', hex: '#4ADE80', bgDark: '20, 83, 45', bgLight: '240, 253, 244', bg900: '20, 83, 45', bg800: '22, 101, 52', bg700: '22, 163, 74', bg200: '187, 247, 208', bg100: '220, 252, 231', bg50: '240, 253, 244' },

  // AMARILLOS-NARANJAS (19-23)
  { id: 'yellow', name: 'Amarillo', primary: '250, 204, 21', hex: '#FACC15', bgDark: '66, 32, 6', bgLight: '254, 252, 232', bg900: '66, 32, 6', bg800: '133, 77, 14', bg700: '161, 98, 7', bg200: '254, 240, 138', bg100: '254, 249, 195', bg50: '254, 252, 232' },
  { id: 'amber', name: 'Ámbar', primary: '251, 191, 36', hex: '#FBBF24', bgDark: '69, 26, 3', bgLight: '255, 251, 235', bg900: '69, 26, 3', bg800: '146, 64, 14', bg700: '180, 83, 9', bg200: '253, 230, 138', bg100: '254, 243, 199', bg50: '255, 251, 235' },
  { id: 'gold', name: 'Oro', primary: '234, 179, 8', hex: '#EAB308', bgDark: '66, 32, 6', bgLight: '254, 249, 195', bg900: '66, 32, 6', bg800: '113, 63, 18', bg700: '161, 98, 7', bg200: '254, 240, 138', bg100: '254, 249, 195', bg50: '254, 252, 232' },
  { id: 'orange', name: 'Naranja', primary: '249, 115, 22', hex: '#F97316', bgDark: '67, 20, 7', bgLight: '255, 247, 237', bg900: '67, 20, 7', bg800: '124, 45, 18', bg700: '194, 65, 12', bg200: '254, 215, 170', bg100: '255, 237, 213', bg50: '255, 247, 237' },
  { id: 'tangerine', name: 'Mandarina', primary: '251, 146, 60', hex: '#FB923C', bgDark: '67, 20, 7', bgLight: '255, 247, 237', bg900: '67, 20, 7', bg800: '154, 52, 18', bg700: '194, 65, 12', bg200: '254, 215, 170', bg100: '255, 237, 213', bg50: '255, 247, 237' },

  // MARRONES-TIERRA (24-26)
  { id: 'brown', name: 'Marrón', primary: '161, 98, 7', hex: '#A16207', bgDark: '51, 26, 6', bgLight: '254, 252, 232', bg900: '51, 26, 6', bg800: '92, 58, 12', bg700: '120, 75, 10', bg200: '254, 240, 138', bg100: '254, 249, 195', bg50: '254, 252, 232' },
  { id: 'bronze', name: 'Bronce', primary: '217, 119, 6', hex: '#D97706', bgDark: '69, 26, 3', bgLight: '255, 247, 237', bg900: '69, 26, 3', bg800: '146, 64, 14', bg700: '180, 83, 9', bg200: '253, 230, 138', bg100: '254, 243, 199', bg50: '255, 251, 235' },
  { id: 'rust', name: 'Óxido', primary: '194, 65, 12', hex: '#C2410C', bgDark: '67, 20, 7', bgLight: '255, 247, 237', bg900: '67, 20, 7', bg800: '124, 45, 18', bg700: '154, 52, 18', bg200: '254, 215, 170', bg100: '255, 237, 213', bg50: '255, 247, 237' },

  // GRISES-NEUTROS (27-30)
  { id: 'slate', name: 'Pizarra', primary: '100, 116, 139', hex: '#64748B', bgDark: '2, 6, 23', bgLight: '248, 250, 252', bg900: '2, 6, 23', bg800: '30, 41, 59', bg700: '51, 65, 85', bg200: '226, 232, 240', bg100: '241, 245, 249', bg50: '248, 250, 252' },
  { id: 'gray', name: 'Gris', primary: '107, 114, 128', hex: '#6B7280', bgDark: '17, 24, 39', bgLight: '249, 250, 251', bg900: '17, 24, 39', bg800: '31, 41, 55', bg700: '55, 65, 81', bg200: '229, 231, 235', bg100: '243, 244, 246', bg50: '249, 250, 251' },
  { id: 'zinc', name: 'Zinc', primary: '113, 113, 122', hex: '#71717A', bgDark: '24, 24, 27', bgLight: '250, 250, 250', bg900: '24, 24, 27', bg800: '39, 39, 42', bg700: '63, 63, 70', bg200: '228, 228, 231', bg100: '244, 244, 245', bg50: '250, 250, 250' },
  { id: 'charcoal', name: 'Carbón', primary: '82, 82, 91', hex: '#52525B', bgDark: '24, 24, 27', bgLight: '250, 250, 250', bg900: '24, 24, 27', bg800: '39, 39, 42', bg700: '63, 63, 70', bg200: '212, 212, 216', bg100: '228, 228, 231', bg50: '250, 250, 250' },
];

export const ThemeProvider = ({ children }) => {
  // Modo oscuro individual - guardar en localStorage del usuario
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('fitpro-theme-dark');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [paletteId, setPaletteId] = useState('emerald');
  const [secondaryPaletteId, setSecondaryPaletteId] = useState('slate');
  const [gymLogo, setGymLogo] = useState(null);
  const [gymSlogan, setGymSlogan] = useState('');
  const [gymCoverImage, setGymCoverImage] = useState(null);
  const [currentGymId, setCurrentGymId] = useState(null);
  const [visualTheme, setVisualTheme] = useState('glassmorphism');

  // Escuchar cambios del gimnasio actual
  useEffect(() => {
    if (!currentGymId) return;

    const unsubscribe = onSnapshot(doc(db, 'gyms', currentGymId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        // Aplicar paleta primaria del gimnasio
        if (data.colorPrimary) {
          setPaletteId(data.colorPrimary);
        } else if (data.colorPalette) {
          setPaletteId(data.colorPalette);
        }
        // Aplicar paleta secundaria del gimnasio
        if (data.colorSecondary) {
          setSecondaryPaletteId(data.colorSecondary);
        } else if (data.colorPalette) {
          setSecondaryPaletteId(data.colorPalette);
        }
        // YA NO sincronizamos darkMode desde gimnasio - es individual por usuario
        // Logo del gimnasio
        if (data.logo) {
          setGymLogo(data.logo);
        } else {
          setGymLogo(null);
        }
        // Slogan del gimnasio
        if (data.slogan) {
          setGymSlogan(data.slogan);
        } else {
          setGymSlogan('');
        }
        // Cover image del gimnasio - MEJORADO
        setGymCoverImage(data.coverImage || null);
        // Visual theme del gimnasio
        if (data.visualTheme) {
          setVisualTheme(data.visualTheme);
        } else {
          setVisualTheme('glassmorphism');
        }
      }
    });

    return () => unsubscribe();
  }, [currentGymId]);

  // Guardar modo oscuro en localStorage cuando cambie
  useEffect(() => {
    localStorage.setItem('fitpro-theme-dark', JSON.stringify(isDark));
  }, [isDark]);

  // Aplicar estilos al DOM
  useEffect(() => {
    const primaryPalette = COLOR_PALETTES.find(p => p.id === paletteId) || COLOR_PALETTES[0];
    const secondaryPalette = COLOR_PALETTES.find(p => p.id === secondaryPaletteId) || COLOR_PALETTES[0];
    const root = document.documentElement;

    // CSS Variables para el color primario
    root.style.setProperty('--color-primary', primaryPalette.primary);
    root.style.setProperty('--color-primary-hex', primaryPalette.hex);

    // CSS Variables para colores de fondo según modo (usando paleta secundaria)
    if (isDark) {
      // Modo oscuro - usar tonos oscuros del color secundario
      root.style.setProperty('--color-bg-primary', secondaryPalette.bgDark);
      root.style.setProperty('--color-bg-900', secondaryPalette.bg900);
      root.style.setProperty('--color-bg-800', secondaryPalette.bg800);
      root.style.setProperty('--color-bg-700', secondaryPalette.bg700);
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      // Modo claro - usar tonos claros del color secundario
      root.style.setProperty('--color-bg-primary', secondaryPalette.bgLight);
      root.style.setProperty('--color-bg-50', secondaryPalette.bg50);
      root.style.setProperty('--color-bg-100', secondaryPalette.bg100);
      root.style.setProperty('--color-bg-200', secondaryPalette.bg200);
      root.classList.add('light');
      root.classList.remove('dark');
    }

    // Aplicar tema visual (glassmorphism, neon o industrial)
    root.classList.remove('theme-glassmorphism', 'theme-neon', 'theme-industrial');

    if (visualTheme === 'neon') {
      root.classList.add('theme-neon');
    } else if (visualTheme === 'industrial') {
      root.classList.add('theme-industrial');
    } else {
      root.classList.add('theme-glassmorphism');
    }
  }, [isDark, paletteId, secondaryPaletteId, visualTheme]);

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
  const secondaryColorPalette = COLOR_PALETTES.find(p => p.id === secondaryPaletteId) || COLOR_PALETTES[0];

  return (
    <ThemeContext.Provider value={{
      isDark,
      toggleTheme,
      paletteId,
      setPaletteId,
      secondaryPaletteId,
      setSecondaryPaletteId,
      colorPalette,
      secondaryColorPalette,
      gymLogo,
      gymSlogan,
      gymCoverImage,
      visualTheme,
      setVisualTheme,
      setGymId,
      saveGymTheme,
      saveGymLogo
    }}>
      {children}
    </ThemeContext.Provider>
  );
};
