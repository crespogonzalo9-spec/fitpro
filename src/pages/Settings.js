import React, { useState, useEffect } from 'react';
import { Palette, Moon, Sun, Image as ImageIcon, Upload, Check, Building2, Save, User, Type, Eye, Monitor, UserCog } from 'lucide-react';
import { Button, Card, Badge, Tabs, Input, Select } from '../components/Common';
import { useAuth } from '../contexts/AuthContext';
import { useGym } from '../contexts/GymContext';
import { useTheme, COLOR_PALETTES } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { compressImage } from '../utils/imageUtils';

const Settings = () => {
  const { userData, canManageGymSettings, isSysadmin, simulatedRole, startRoleSimulation, stopRoleSimulation, isSimulating } = useAuth();
  const { currentGym } = useGym();
  const { isDark, paletteId, secondaryPaletteId, gymLogo, gymSlogan, gymCoverImage } = useTheme();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('general');
  const [selectedPrimaryColor, setSelectedPrimaryColor] = useState(paletteId);
  const [selectedSecondaryColor, setSelectedSecondaryColor] = useState(secondaryPaletteId);
  const [selectedDarkMode, setSelectedDarkMode] = useState(isDark);
  const [slogan, setSlogan] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [bannerPosition, setBannerPosition] = useState('center');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRoleForSimulation, setSelectedRoleForSimulation] = useState('');

  const canEdit = canManageGymSettings();

  useEffect(() => {
    if (currentGym) {
      setSelectedPrimaryColor(currentGym.colorPrimary || currentGym.colorPalette || paletteId);
      setSelectedSecondaryColor(currentGym.colorSecondary || currentGym.colorPalette || secondaryPaletteId);
      setSelectedDarkMode(isDark);
      setSlogan(gymSlogan || '');
      setLogoPreview(gymLogo);
      setCoverPreview(gymCoverImage);
      setBannerPosition(currentGym.bannerPosition || 'center');
    }
  }, [currentGym, paletteId, secondaryPaletteId, isDark, gymSlogan, gymLogo, gymCoverImage]);

  const handleLogoChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('El logo no debe superar 2MB');
        return;
      }
      try {
        // Comprimir y convertir a base64
        const compressed = await compressImage(file, 256, 256, 0.8);
        setLogoFile(compressed);
        setLogoPreview(compressed);
      } catch (error) {
        console.error('Error processing logo:', error);
        toast.error('Error al procesar el logo');
      }
    }
  };

  const handleCoverChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('El banner no debe superar 5MB');
        return;
      }
      try {
        // Comprimir y convertir a base64 (banner más grande: 1200px ancho)
        const compressed = await compressImage(file, 1200, 400, 0.85);
        setCoverFile(compressed);
        setCoverPreview(compressed);
      } catch (error) {
        console.error('Error processing cover:', error);
        toast.error('Error al procesar el banner');
      }
    }
  };

  const handleSave = async () => {
    if (!currentGym || !canEdit) return;

    setIsLoading(true);
    try {
      const updates = {
        colorPalette: selectedPrimaryColor, // Mantener retrocompatibilidad
        colorPrimary: selectedPrimaryColor,
        colorSecondary: selectedSecondaryColor,
        darkMode: selectedDarkMode,
        slogan: slogan.trim(),
        bannerPosition: bannerPosition
      };

      // Guardar logo como base64 si cambió
      if (logoFile) {
        updates.logo = logoFile;
      }

      // Guardar banner como base64 si cambió
      if (coverFile) {
        updates.coverImage = coverFile;
      }

      await updateDoc(doc(db, 'gyms', currentGym.id), updates);

      toast.success('Configuración guardada correctamente');
      setLogoFile(null);
      setCoverFile(null);
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Error al guardar la configuración');
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: User },
    ...(canEdit ? [{ id: 'branding', label: 'Identidad Visual', icon: Palette }] : [])
  ];

  const selectedPrimaryPalette = COLOR_PALETTES.find(p => p.id === selectedPrimaryColor);
  const selectedSecondaryPalette = COLOR_PALETTES.find(p => p.id === selectedSecondaryColor);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold">Configuración</h1>
        <p className="text-gray-400">Personaliza la aplicación y tu gimnasio</p>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* TAB: GENERAL */}
      {activeTab === 'general' && (
        <div className="space-y-6">
          {/* Modo Oscuro/Claro */}
          <Card>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-700 rounded-xl flex items-center justify-center">
                  {selectedDarkMode ? <Moon className="text-blue-400" size={24} /> : <Sun className="text-yellow-400" size={24} />}
                </div>
                <div>
                  <h3 className="font-semibold">Modo {selectedDarkMode ? 'Oscuro' : 'Claro'}</h3>
                  <p className="text-sm text-gray-400">Tema de la interfaz</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDarkMode(!selectedDarkMode)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  selectedDarkMode ? 'bg-primary' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    selectedDarkMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </Card>

          {/* Info del Gimnasio */}
          {currentGym && (
            <Card>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-700 rounded-xl flex items-center justify-center">
                  <Building2 className="text-blue-400" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold">{currentGym.name}</h3>
                  <p className="text-sm text-gray-400">{currentGym.address || 'Sin dirección'}</p>
                </div>
              </div>
            </Card>
          )}

          {/* Info del Usuario */}
          <Card>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-semibold text-lg" style={{ backgroundColor: 'rgba(var(--color-primary), 1)' }}>
                {userData?.name?.charAt(0)}
              </div>
              <div>
                <h3 className="font-semibold">{userData?.name}</h3>
                <p className="text-sm text-gray-400">{userData?.email}</p>
                <Badge className="mt-1 badge-primary">
                  {userData?.role === 'sysadmin' ? '👑 Sysadmin' : userData?.role === 'admin' ? 'Admin' : userData?.role === 'profesor' ? 'Profesor' : 'Alumno'}
                </Badge>
              </div>
            </div>
          </Card>

          {/* Simulador de Roles (Solo para Sysadmin) */}
          {isSysadmin() && (
            <Card>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                  <UserCog className="text-purple-400" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold">Simulador de Roles</h3>
                  <p className="text-sm text-gray-400">Ver la aplicación desde la perspectiva de otros roles</p>
                </div>
              </div>

              {!isSimulating() ? (
                <div className="space-y-3">
                  <Select
                    value={selectedRoleForSimulation}
                    onChange={(e) => setSelectedRoleForSimulation(e.target.value)}
                    options={[
                      { value: 'admin', label: 'Administrador' },
                      { value: 'profesor', label: 'Profesor' },
                      { value: 'alumno', label: 'Alumno' }
                    ]}
                    placeholder="Selecciona un rol para simular"
                  />
                  <Button
                    onClick={() => {
                      if (selectedRoleForSimulation) {
                        startRoleSimulation(selectedRoleForSimulation);
                        toast.success(`Simulando vista de ${selectedRoleForSimulation}`);
                      }
                    }}
                    disabled={!selectedRoleForSimulation}
                    className="w-full"
                    variant="secondary"
                  >
                    Iniciar Simulación
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-3">
                    <p className="text-sm text-purple-300">
                      <strong>Simulando:</strong> {simulatedRole === 'admin' ? 'Administrador' : simulatedRole === 'profesor' ? 'Profesor' : 'Alumno'}
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      stopRoleSimulation();
                      setSelectedRoleForSimulation('');
                      toast.success('Volviste a tu vista de Sysadmin');
                    }}
                    variant="danger"
                    className="w-full"
                  >
                    Detener Simulación
                  </Button>
                </div>
              )}
            </Card>
          )}

          {/* Botón Guardar */}
          {canEdit && selectedDarkMode !== isDark && (
            <Button
              onClick={handleSave}
              icon={Save}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Guardando...' : 'Guardar Configuración'}
            </Button>
          )}
        </div>
      )}

      {/* TAB: IDENTIDAD VISUAL */}
      {activeTab === 'branding' && canEdit && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Panel de Configuración */}
          <div className="space-y-6">
            {/* Color Primario */}
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <Palette className="text-primary" size={20} />
                <h2 className="text-lg font-semibold">Color Primario</h2>
              </div>
              <p className="text-sm text-gray-400 mb-3">Botones, acentos y elementos interactivos</p>
              <div className="grid grid-cols-4 gap-3">
                {COLOR_PALETTES.map((palette) => (
                  <button
                    key={palette.id}
                    onClick={() => setSelectedPrimaryColor(palette.id)}
                    className={`group relative aspect-square rounded-lg transition-all ${
                      selectedPrimaryColor === palette.id
                        ? 'ring-2 ring-white scale-105'
                        : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: palette.hex }}
                    title={palette.name}
                  >
                    {selectedPrimaryColor === palette.id && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-3 h-3 bg-white rounded-full"></div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-400 mt-3">
                Seleccionado: <span className="text-white font-medium">{selectedPrimaryPalette?.name}</span>
              </p>
            </Card>

            {/* Color Secundario */}
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <Palette className="text-primary" size={20} />
                <h2 className="text-lg font-semibold">Color Secundario</h2>
              </div>
              <p className="text-sm text-gray-400 mb-3">Color de fondo (se adapta al modo oscuro/claro)</p>
              <div className="grid grid-cols-4 gap-3">
                {COLOR_PALETTES.map((palette) => (
                  <button
                    key={palette.id}
                    onClick={() => setSelectedSecondaryColor(palette.id)}
                    className={`group relative aspect-square rounded-lg transition-all ${
                      selectedSecondaryColor === palette.id
                        ? 'ring-2 ring-white scale-105'
                        : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: palette.hex }}
                    title={palette.name}
                  >
                    {selectedSecondaryColor === palette.id && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-3 h-3 bg-white rounded-full"></div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-400 mt-3">
                Seleccionado: <span className="text-white font-medium">{selectedSecondaryPalette?.name}</span>
              </p>
            </Card>

            {/* Modo Claro/Oscuro */}
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <Monitor className="text-primary" size={20} />
                <h2 className="text-lg font-semibold">Tema</h2>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {selectedDarkMode ? (
                    <Moon size={20} className="text-primary" />
                  ) : (
                    <Sun size={20} className="text-primary" />
                  )}
                  <div>
                    <p className="font-medium">{selectedDarkMode ? 'Modo Oscuro' : 'Modo Claro'}</p>
                    <p className="text-sm text-gray-400">Tema visual de la aplicación</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedDarkMode(!selectedDarkMode)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    selectedDarkMode ? 'bg-primary' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      selectedDarkMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </Card>

            {/* Slogan */}
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <Type className="text-primary" size={20} />
                <h2 className="text-lg font-semibold">Slogan</h2>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Frase representativa del gimnasio
                </label>
                <Input
                  id="slogan"
                  value={slogan}
                  onChange={(e) => setSlogan(e.target.value)}
                  placeholder="Ej: Tu mejor versión te espera"
                  maxLength={100}
                />
                <p className="text-xs text-gray-400 mt-1">{slogan.length}/100 caracteres</p>
              </div>
            </Card>

            {/* Logo */}
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <ImageIcon className="text-primary" size={20} />
                <h2 className="text-lg font-semibold">Logo</h2>
              </div>
              <div className="space-y-3">
                {logoPreview && (
                  <div className="flex justify-center p-4 bg-gray-800 rounded-lg">
                    <img src={logoPreview} alt="Logo" className="h-24 object-contain" />
                  </div>
                )}
                <label className="block">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                  <div className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg cursor-pointer transition-colors">
                    <Upload size={18} />
                    <span>{logoPreview ? 'Cambiar Logo' : 'Subir Logo'}</span>
                  </div>
                </label>
                <p className="text-xs text-gray-400">Tamaño máximo: 2MB. Formato: PNG, JPG</p>
              </div>
            </Card>

            {/* Banner/Cover */}
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <ImageIcon className="text-primary" size={20} />
                <h2 className="text-lg font-semibold">Banner de Portada</h2>
              </div>
              <div className="space-y-3">
                {coverPreview && (
                  <div className="rounded-lg overflow-hidden bg-gray-800">
                    <img
                      src={coverPreview}
                      alt="Banner"
                      className="w-full h-32 object-cover"
                      style={{ objectPosition: bannerPosition }}
                    />
                  </div>
                )}
                <label className="block">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverChange}
                    className="hidden"
                  />
                  <div className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg cursor-pointer transition-colors">
                    <Upload size={18} />
                    <span>{coverPreview ? 'Cambiar Banner' : 'Subir Banner'}</span>
                  </div>
                </label>
                <p className="text-xs text-gray-400">Tamaño máximo: 5MB. Formato: PNG, JPG. Recomendado: 1920x400px</p>

                {/* Posición del banner */}
                {coverPreview && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Posición de la imagen
                    </label>
                    <Select
                      value={bannerPosition}
                      onChange={(e) => setBannerPosition(e.target.value)}
                      options={[
                        { value: 'center', label: 'Centro' },
                        { value: 'top', label: 'Arriba' },
                        { value: 'bottom', label: 'Abajo' },
                        { value: 'left', label: 'Izquierda' },
                        { value: 'right', label: 'Derecha' },
                        { value: 'left top', label: 'Arriba Izquierda' },
                        { value: 'right top', label: 'Arriba Derecha' },
                        { value: 'left bottom', label: 'Abajo Izquierda' },
                        { value: 'right bottom', label: 'Abajo Derecha' }
                      ]}
                    />
                    <p className="text-xs text-gray-400 mt-1">Ajusta el punto focal de la imagen cuando es más grande que el contenedor</p>
                  </div>
                )}
              </div>
            </Card>

            <Button onClick={handleSave} isLoading={isLoading} className="w-full" icon={Save}>
              Guardar Configuración
            </Button>
          </div>

          {/* Panel de Preview */}
          <div className="lg:sticky lg:top-6 h-fit">
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <Eye className="text-primary" size={20} />
                <h2 className="text-lg font-semibold">Vista Previa</h2>
              </div>

              <div
                className="rounded-lg overflow-hidden border-2 transition-all"
                style={{
                  '--preview-primary': selectedPrimaryPalette?.primary || COLOR_PALETTES[0].primary,
                  '--preview-bg': selectedDarkMode
                    ? `rgb(${selectedSecondaryPalette?.bgDark || COLOR_PALETTES[0].bgDark})`
                    : `rgb(${selectedSecondaryPalette?.bgLight || COLOR_PALETTES[0].bgLight})`,
                  backgroundColor: 'var(--preview-bg)',
                  borderColor: selectedDarkMode ? '#374151' : '#d1d5db'
                }}
              >
                {/* Cover Image Preview */}
                {coverPreview && (
                  <div className="w-full h-32 overflow-hidden">
                    <img
                      src={coverPreview}
                      alt="Cover preview"
                      className="w-full h-full object-cover"
                      style={{ objectPosition: bannerPosition }}
                    />
                  </div>
                )}

                {/* Header Preview */}
                <div className={`p-4 border-b ${selectedDarkMode ? 'border-gray-800' : 'border-gray-300'}`}>
                  <div className="flex items-center gap-3">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo preview" className="h-12 w-12 object-contain" />
                    ) : (
                      <div
                        className="h-12 w-12 rounded-lg flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: `rgb(var(--preview-primary))` }}
                      >
                        {currentGym?.name?.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h3 className={`font-bold ${selectedDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {currentGym?.name || 'Gimnasio'}
                      </h3>
                      {slogan && (
                        <p className={`text-sm ${selectedDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {slogan}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Content Preview */}
                <div className="p-4 space-y-3">
                  <div
                    className={`h-8 rounded ${selectedDarkMode ? 'bg-gray-800' : 'bg-gray-200'}`}
                  ></div>
                  <div
                    className={`h-8 rounded w-3/4 ${selectedDarkMode ? 'bg-gray-800' : 'bg-gray-200'}`}
                  ></div>
                  <div className="flex gap-2">
                    <div
                      className={`h-16 flex-1 rounded ${selectedDarkMode ? 'bg-gray-800' : 'bg-gray-200'}`}
                    ></div>
                    <div
                      className={`h-16 flex-1 rounded ${selectedDarkMode ? 'bg-gray-800' : 'bg-gray-200'}`}
                    ></div>
                  </div>
                </div>

                {/* Button Preview */}
                <div className="p-4 pt-0">
                  <button
                    className="w-full px-4 py-2 rounded-lg text-white font-medium transition-opacity hover:opacity-90"
                    style={{ backgroundColor: `rgb(var(--preview-primary))` }}
                  >
                    Botón de Ejemplo
                  </button>
                </div>
              </div>

              <p className="text-sm text-gray-400 mt-4">
                Esta es una representación de cómo se verá tu gimnasio con la configuración actual.
              </p>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
