import React, { useState, useEffect } from 'react';
import { User, Mail, Lock, Phone, ArrowRight, Dumbbell, CheckCircle, Building2, ChevronDown, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import { collection, getDocs, query, where, limit, updateDoc, doc, serverTimestamp } from 'firebase/firestore';

const Register = ({ onToggle }) => {
  const { register, registerWithInvite, user } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '', gymId: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Lista de gimnasios disponibles
  
  // Datos de invitación
  const [inviteData, setInviteData] = useState(null);
  const [inviteCode, setInviteCode] = useState('');
  const [checkingInvite, setCheckingInvite] = useState(true);
  const [inviteError, setInviteError] = useState('');

  // Obtener código de invitación de la URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('invite');
    if (code) {
      setInviteCode(code);
    }
    setCheckingInvite(false);
  }, []);

  // Verificar invitación cuando hay código
  useEffect(() => {
    if (!inviteCode) return;

    const checkInvite = async () => {
      setInviteError('');

      try {
        // ✅ SEGURIDAD: Query específica por código en lugar de leer todas las invitaciones
        const q = query(
          collection(db, 'invites'),
          where('code', '==', inviteCode),
          limit(1)
        );
        const invitesSnap = await getDocs(q);

        if (invitesSnap.empty) {
          setInviteError('Código de invitación inválido');
          return;
        }

        const docSnap = invitesSnap.docs[0];
        const foundInvite = { id: docSnap.id, ...docSnap.data() };

        // BACKWARD COMPATIBILITY: Verificar formato antiguo y nuevo
        const isUsed = foundInvite.used || (foundInvite.usedCount && foundInvite.usedCount > 0);

        // Verificar si ya fue usada
        if (isUsed) {
          setInviteError('Esta invitación ya fue utilizada');
          return;
        }

        // Verificar expiración
        if (foundInvite.expiresAt) {
          const expiresAt = foundInvite.expiresAt?.toDate?.() || new Date(foundInvite.expiresAt);
          if (expiresAt < new Date()) {
            setInviteError('Esta invitación ha expirado');
            return;
          }
        }

        // Validar que la invitación tenga los datos necesarios
        if (!foundInvite.gymName || !foundInvite.gymId) {
          setInviteError('Invitación incompleta. Contactá al administrador.');
          return;
        }

        // Invitación válida
        setInviteData(foundInvite);
        setForm(prev => ({
          ...prev,
          email: foundInvite.email || prev.email,
          gymId: foundInvite.gymId || ''
        }));
      } catch (err) {
        // Si el error es por falta de índice, Firebase mostrará un link en consola
        console.error('Error al verificar invitación:', err);
        setInviteError('Error al verificar invitación. Podés registrarte manualmente.');
      }
    };

    checkInvite();
  }, [inviteCode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim()) {
      setError('El nombre es requerido');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    // Validación mejorada de contraseñas
    if (form.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    // Validar complejidad: al menos 1 mayúscula, 1 minúscula, 1 número
    const hasUpperCase = /[A-Z]/.test(form.password);
    const hasLowerCase = /[a-z]/.test(form.password);
    const hasNumber = /[0-9]/.test(form.password);

    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      setError('La contraseña debe contener al menos: 1 mayúscula, 1 minúscula y 1 número');
      return;
    }

    setLoading(true);

    let result;

    if (inviteData && inviteData.gymId) {
      // VALIDACIÓN DE EMAIL: Si la invitación tiene un email específico, verificar que coincida
      if (inviteData.email && inviteData.email.toLowerCase() !== form.email.toLowerCase()) {
        setError('Esta invitación es para ' + inviteData.email + '. Por favor, usá ese email.');
        setLoading(false);
        return;
      }

      result = await registerWithInvite(
        form.email,
        form.password,
        form.name,
        form.phone,
        inviteData.gymId,
        inviteData.roles || ['alumno']
      );

      if (result.success) {
        try {
          // Marcar invitación como usada (uso único)
          await updateDoc(doc(db, 'invites', inviteData.id), {
            used: true,
            usedAt: serverTimestamp(),
            registeredUser: {
              name: form.name,
              email: form.email,
              userId: result.userId,
              registeredAt: new Date(),
              gymId: inviteData.gymId,
              gymName: inviteData.gymName
            }
          });
          window.history.replaceState({}, document.title, window.location.pathname);
        } catch (err) {
          // Error silencioso - no es crítico si falla la actualización de la invitación
          console.error('Error al actualizar invitación:', err);
        }
      }
    } else {
      result = await register(form.email, form.password, form.name, form.phone, form.gymId || null);
    }

    if (!result.success) {
      setError(result.error);
    }
    
    setLoading(false);
  };

  // Buscar gimnasio manualmente por código
  const handleManualInvite = async () => {
    const code = prompt('Ingresá el código de invitación:');
    if (code) {
      setInviteCode(code.trim().toUpperCase());
    }
  };

  if (checkingInvite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/50 mb-4">
            <Dumbbell className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-white">FitPro</h1>
          <p className="text-gray-400 mt-2">Gestión de gimnasios</p>
        </div>

        {/* Card */}
        <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-8 border border-slate-700">
          <h2 className="text-xl font-semibold text-white mb-6">Crear cuenta</h2>

          {/* Indicador de invitación válida */}
          {inviteData && (
            <div className="mb-4 p-4 bg-green-500/20 border border-green-500/30 rounded-xl">
              <div className="flex items-center gap-3">
                <CheckCircle className="text-green-400 flex-shrink-0" size={24} />
                <div>
                  <p className="text-green-400 font-medium">Invitación válida</p>
                  <p className="text-sm text-gray-300 mt-1">
                    Te unirás a <strong>{inviteData.gymName || 'el gimnasio'}</strong>
                  </p>
                  {inviteData.roles && inviteData.roles.filter(r => r !== 'alumno').length > 0 && (
                    <p className="text-xs text-gray-400 mt-1">
                      Roles: {inviteData.roles.join(', ')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Error de invitación (advertencia, no bloquea registro) */}
          {inviteError && !inviteData && (
            <div className="mb-4 p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-yellow-400 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="text-yellow-400 text-sm">{inviteError}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Podés registrarte eligiendo un gimnasio manualmente o sin gimnasio.
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Nombre completo *</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary"
                  placeholder="Tu nombre"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={`w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary ${inviteData?.email ? 'opacity-60' : ''}`}
                  placeholder="tu@email.com"
                  required
                  disabled={!!inviteData?.email}
                />
              </div>
            </div>

            {/* Teléfono */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Teléfono (opcional)</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary"
                  placeholder="+54 11 1234-5678"
                />
              </div>
            </div>

            {/* Gimnasio */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Gimnasio</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" size={20} />
                {inviteData ? (
                  <div className="w-full pl-10 pr-4 py-3 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 font-medium">
                    🔒 {inviteData.gymName || 'Gimnasio asignado'}
                  </div>
                ) : (
                  <div className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-gray-400">
                    Sin gimnasio (registrarme solo)
                  </div>
                )}
              </div>
              {!inviteData && (
                <p className="text-xs text-gray-500 mt-1">
                  Usá un código de invitación para unirte a un gimnasio
                </p>
              )}
            </div>

            {/* Código de invitación manual */}
            {!inviteData && (
              <button
                type="button"
                onClick={handleManualInvite}
                className="w-full text-sm text-primary hover:text-primary/80 transition-colors"
              >
                ¿Tenés un código de invitación? Click acá
              </button>
            )}

            {/* Contraseña */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Contraseña *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary"
                  placeholder="••••••••"
                  required
                  minLength={8}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Mínimo 8 caracteres, con mayúsculas, minúsculas y números
              </p>
            </div>

            {/* Confirmar contraseña */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Confirmar contraseña *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-primary hover:bg-primary/90 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Registrando...' : 'Crear cuenta'}
              <ArrowRight size={18} />
            </button>
          </form>

          <p className="mt-6 text-center text-gray-400">
            ¿Ya tenés cuenta?{' '}
            <button onClick={onToggle} className="text-primary hover:underline">
              Iniciar sesión
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
