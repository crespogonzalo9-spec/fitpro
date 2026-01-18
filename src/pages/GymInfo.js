import React, { useState, useEffect } from 'react';
import { Building2, MapPin, Phone, Mail, Globe, Clock, Users, Dumbbell, Info, Edit, Save, X } from 'lucide-react';
import { Card, Badge, EmptyState, GymRequired, Button, Input, Textarea, Modal } from '../components/Common';
import { useAuth } from '../contexts/AuthContext';
import { useGym } from '../contexts/GymContext';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import { db } from '../firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { compressImage } from '../utils/imageUtils';

const DAYS_OF_WEEK = [
  { id: 'lunes', name: 'Lunes' },
  { id: 'martes', name: 'Martes' },
  { id: 'miercoles', name: 'Miércoles' },
  { id: 'jueves', name: 'Jueves' },
  { id: 'viernes', name: 'Viernes' },
  { id: 'sabado', name: 'Sábado' },
  { id: 'domingo', name: 'Domingo' }
];

const GymInfoContent = () => {
  const { isAdmin, isSysadmin } = useAuth();
  const { currentGym } = useGym();
  const { gymLogo, gymCoverImage } = useTheme();
  const { success, error: showError } = useToast();

  const [showEditModal, setShowEditModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const canEdit = isAdmin() || isSysadmin();

  // Form para editar info general
  const [form, setForm] = useState({
    name: '',
    slogan: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    instagram: '',
    logoBase64: ''
  });

  // Form para horarios
  const [scheduleForm, setScheduleForm] = useState({
    lunes: { open: '', close: '', closed: false },
    martes: { open: '', close: '', closed: false },
    miercoles: { open: '', close: '', closed: false },
    jueves: { open: '', close: '', closed: false },
    viernes: { open: '', close: '', closed: false },
    sabado: { open: '', close: '', closed: false },
    domingo: { open: '', close: '', closed: true }
  });

  useEffect(() => {
    if (currentGym) {
      setForm({
        name: currentGym.name || '',
        slogan: currentGym.slogan || '',
        description: currentGym.description || '',
        address: currentGym.address || '',
        phone: currentGym.phone || '',
        email: currentGym.email || '',
        website: currentGym.website || '',
        instagram: currentGym.instagram || '',
        logoBase64: currentGym.logoBase64 || ''
      });

      // Cargar horarios si existen
      if (currentGym.businessHours) {
        setScheduleForm(currentGym.businessHours);
      }
    }
  }, [currentGym]);

  const handleSaveInfo = async () => {
    if (!form.name.trim()) {
      showError('El nombre es obligatorio');
      return;
    }

    setSaving(true);
    try {
      await updateDoc(doc(db, 'gyms', currentGym.id), {
        name: form.name.trim(),
        slogan: form.slogan || null,
        description: form.description || null,
        address: form.address || null,
        phone: form.phone || null,
        email: form.email || null,
        website: form.website || null,
        instagram: form.instagram || null,
        logoBase64: form.logoBase64 || null,
        updatedAt: serverTimestamp()
      });

      
      success('Información actualizada');
      setShowEditModal(false);
    } catch (err) {
      console.error('Error:', err);
      showError('Error al guardar');
    }
    setSaving(false);
  };

  const handleSaveSchedule = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'gyms', currentGym.id), {
        businessHours: scheduleForm,
        updatedAt: serverTimestamp()
      });

      
      success('Horarios actualizados');
      setShowScheduleModal(false);
    } catch (err) {
      console.error('Error:', err);
      showError('Error al guardar');
    }
    setSaving(false);
  };

  const handleLogoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImage(file, 256, 256, 0.8);
      setForm({ ...form, logoBase64: compressed });
    } catch (err) {
      showError('Error al procesar la imagen');
    }
  };

  const formatSchedule = (schedule) => {
    if (!schedule) return null;
    if (schedule.closed) return 'Cerrado';
    if (schedule.open && schedule.close) {
      return `${schedule.open} - ${schedule.close}`;
    }
    return null;
  };

  if (!currentGym) {
    return <EmptyState icon={Building2} title="Sin gimnasio" description="No hay gimnasio seleccionado" />;
  }

  const hasBusinessHours = currentGym.businessHours && 
    Object.values(currentGym.businessHours).some(h => h.open || h.closed);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Banner / Cover Image */}
      {gymCoverImage && (
        <div className="relative w-full h-48 md:h-64 rounded-2xl overflow-hidden border border-gray-700 -mt-6">
          <img
            src={gymCoverImage}
            alt={`Banner de ${currentGym.name}`}
            className="w-full h-full object-cover"
            style={{ objectPosition: currentGym?.bannerPosition || 'center' }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 to-transparent flex items-end p-6">
            <div className="flex items-center gap-4 w-full">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gray-800 flex items-center justify-center overflow-hidden border-2 border-white shadow-lg">
                {gymLogo ? (
                  <img src={gymLogo} alt={currentGym.name} className="w-full h-full object-cover" />
                ) : (
                  <Building2 size={32} className="text-gray-500" />
                )}
              </div>
              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg">{currentGym.name}</h1>
                {currentGym.slogan && (
                  <p className="text-gray-200 mt-1 italic drop-shadow">"{currentGym.slogan}"</p>
                )}
              </div>
              {canEdit && (
                <Button icon={Edit} onClick={() => setShowEditModal(true)}>
                  Editar Info
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header sin banner (fallback) */}
      {!gymCoverImage && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-2xl bg-gray-800 flex items-center justify-center overflow-hidden border border-gray-700">
              {gymLogo ? (
                <img src={gymLogo} alt={currentGym.name} className="w-full h-full object-cover" />
              ) : (
                <Building2 size={40} className="text-gray-500" />
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold">{currentGym.name}</h1>
              {currentGym.slogan && (
                <p className="text-gray-400 mt-1 italic">"{currentGym.slogan}"</p>
              )}
              {currentGym.isActive !== false ? (
                <Badge className="mt-2 bg-green-500/20 text-green-400">Activo</Badge>
              ) : (
                <Badge className="mt-2 bg-red-500/20 text-red-400">Inactivo</Badge>
              )}
            </div>
          </div>

          {canEdit && (
            <Button icon={Edit} onClick={() => setShowEditModal(true)}>
              Editar Info
            </Button>
          )}
        </div>
      )}

      {/* Badge de estado cuando hay banner */}
      {gymCoverImage && (
        <div className="flex justify-start">
          {currentGym.isActive !== false ? (
            <Badge className="bg-green-500/20 text-green-400">Activo</Badge>
          ) : (
            <Badge className="bg-red-500/20 text-red-400">Inactivo</Badge>
          )}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Información de contacto */}
        <Card>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Info size={20} className="text-primary" />
            Información de Contacto
          </h2>
          <div className="space-y-4">
            {currentGym.address && (
              <div className="flex items-start gap-3">
                <MapPin size={18} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-400">Dirección</p>
                  <p className="font-medium">{currentGym.address}</p>
                </div>
              </div>
            )}
            
            {currentGym.phone && (
              <div className="flex items-start gap-3">
                <Phone size={18} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-400">Teléfono</p>
                  <a href={`tel:${currentGym.phone}`} className="font-medium text-primary hover:underline">
                    {currentGym.phone}
                  </a>
                </div>
              </div>
            )}
            
            {currentGym.email && (
              <div className="flex items-start gap-3">
                <Mail size={18} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-400">Email</p>
                  <a href={`mailto:${currentGym.email}`} className="font-medium text-primary hover:underline">
                    {currentGym.email}
                  </a>
                </div>
              </div>
            )}
            
            {currentGym.website && (
              <div className="flex items-start gap-3">
                <Globe size={18} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-400">Sitio Web</p>
                  <a 
                    href={currentGym.website.startsWith('http') ? currentGym.website : `https://${currentGym.website}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="font-medium text-primary hover:underline"
                  >
                    {currentGym.website}
                  </a>
                </div>
              </div>
            )}
            
            {currentGym.instagram && (
              <div className="flex items-start gap-3">
                <span className="text-gray-400 mt-0.5 flex-shrink-0">📸</span>
                <div>
                  <p className="text-sm text-gray-400">Instagram</p>
                  <a 
                    href={`https://instagram.com/${currentGym.instagram.replace('@', '')}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="font-medium text-primary hover:underline"
                  >
                    @{currentGym.instagram.replace('@', '')}
                  </a>
                </div>
              </div>
            )}

            {!currentGym.address && !currentGym.phone && !currentGym.email && !currentGym.website && !currentGym.instagram && (
              <p className="text-gray-500 text-center py-4">
                No hay información de contacto disponible
              </p>
            )}
          </div>
        </Card>

        {/* Horarios de atención */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Clock size={20} className="text-primary" />
              Horarios de Atención
            </h2>
            {canEdit && (
              <Button size="sm" variant="ghost" icon={Edit} onClick={() => setShowScheduleModal(true)}>
                Editar
              </Button>
            )}
          </div>
          
          {hasBusinessHours ? (
            <div className="space-y-2">
              {DAYS_OF_WEEK.map(day => {
                const schedule = currentGym.businessHours?.[day.id];
                const formatted = formatSchedule(schedule);
                
                return (
                  <div key={day.id} className="flex justify-between py-2 border-b border-gray-700 last:border-0">
                    <span className="text-gray-400">{day.name}</span>
                    <span className={`font-medium ${schedule?.closed ? 'text-red-400' : ''}`}>
                      {formatted || '-'}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500">No hay horarios configurados</p>
              {canEdit && (
                <Button size="sm" className="mt-3" onClick={() => setShowScheduleModal(true)}>
                  Configurar horarios
                </Button>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Descripción */}
      {currentGym.description && (
        <Card>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Dumbbell size={20} className="text-primary" />
            Sobre Nosotros
          </h2>
          <p className="text-gray-300 whitespace-pre-line">{currentGym.description}</p>
        </Card>
      )}

      {/* Servicios */}
      {currentGym.services && currentGym.services.length > 0 && (
        <Card>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users size={20} className="text-primary" />
            Servicios
          </h2>
          <div className="flex flex-wrap gap-2">
            {currentGym.services.map((service, i) => (
              <Badge key={i} className="bg-primary/20 text-primary">
                {service}
              </Badge>
            ))}
          </div>
        </Card>
      )}

      {/* Info adicional - solo mostrar si no es admin */}
      {!canEdit && (
        <Card className="bg-gray-800/50">
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Info size={16} />
            <span>
              Si necesitás actualizar la información del gimnasio, contactá con un administrador.
            </span>
          </div>
        </Card>
      )}

      {/* Modal editar info general */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Editar Información del Gimnasio">
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Logo */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Logo</label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-xl bg-gray-800 flex items-center justify-center overflow-hidden border border-gray-700">
                {form.logoBase64 ? (
                  <img src={form.logoBase64} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <Building2 size={32} className="text-gray-500" />
                )}
              </div>
              <div>
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                  <span className="text-primary hover:underline text-sm">Cambiar logo</span>
                </label>
                {form.logoBase64 && (
                  <button 
                    onClick={() => setForm({ ...form, logoBase64: '' })}
                    className="block text-red-400 hover:underline text-sm mt-1"
                  >
                    Eliminar
                  </button>
                )}
              </div>
            </div>
          </div>

          <Input
            label="Nombre del gimnasio *"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
          />

          <Input
            label="Slogan"
            value={form.slogan}
            onChange={e => setForm({ ...form, slogan: e.target.value })}
            placeholder="Ej: Superá tus límites"
          />

          <Textarea
            label="Descripción"
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            rows={3}
            placeholder="Contá sobre el gimnasio..."
          />

          <Input
            label="Dirección"
            value={form.address}
            onChange={e => setForm({ ...form, address: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Teléfono"
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
            />
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Sitio web"
              value={form.website}
              onChange={e => setForm({ ...form, website: e.target.value })}
              placeholder="www.ejemplo.com"
            />
            <Input
              label="Instagram"
              value={form.instagram}
              onChange={e => setForm({ ...form, instagram: e.target.value })}
              placeholder="@usuario"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowEditModal(false)} className="flex-1">
              Cancelar
            </Button>
            <Button icon={Save} onClick={handleSaveInfo} loading={saving} className="flex-1">
              Guardar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal editar horarios */}
      <Modal isOpen={showScheduleModal} onClose={() => setShowScheduleModal(false)} title="Horarios de Atención">
        <div className="space-y-4">
          <p className="text-sm text-gray-400">Configurá los horarios de atención del gimnasio</p>
          
          {DAYS_OF_WEEK.map(day => (
            <div key={day.id} className="flex items-center gap-4 py-2 border-b border-gray-700 last:border-0">
              <span className="w-24 text-gray-300">{day.name}</span>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={scheduleForm[day.id]?.closed || false}
                  onChange={e => setScheduleForm({
                    ...scheduleForm,
                    [day.id]: { ...scheduleForm[day.id], closed: e.target.checked }
                  })}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-primary focus:ring-primary"
                />
                <span className="text-sm text-gray-400">Cerrado</span>
              </label>
              
              {!scheduleForm[day.id]?.closed && (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="time"
                    value={scheduleForm[day.id]?.open || ''}
                    onChange={e => setScheduleForm({
                      ...scheduleForm,
                      [day.id]: { ...scheduleForm[day.id], open: e.target.value }
                    })}
                    className="px-2 py-1 bg-gray-800 border border-gray-700 rounded text-sm"
                  />
                  <span className="text-gray-500">a</span>
                  <input
                    type="time"
                    value={scheduleForm[day.id]?.close || ''}
                    onChange={e => setScheduleForm({
                      ...scheduleForm,
                      [day.id]: { ...scheduleForm[day.id], close: e.target.value }
                    })}
                    className="px-2 py-1 bg-gray-800 border border-gray-700 rounded text-sm"
                  />
                </div>
              )}
            </div>
          ))}

          <div className="flex gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowScheduleModal(false)} className="flex-1">
              Cancelar
            </Button>
            <Button icon={Save} onClick={handleSaveSchedule} loading={saving} className="flex-1">
              Guardar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

const GymInfo = () => (
  <GymRequired>
    <GymInfoContent />
  </GymRequired>
);

export default GymInfo;
