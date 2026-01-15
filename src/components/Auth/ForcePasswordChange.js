import React, { useState } from 'react';
import { Lock, Eye, EyeOff, Shield, Loader2 } from 'lucide-react';
import { updatePassword } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';

const ForcePasswordChange = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { success, error: showError } = useToast();
  const { userData, logout } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      return showError('Completá todos los campos');
    }

    if (newPassword.length < 6) {
      return showError('La contraseña debe tener al menos 6 caracteres');
    }

    if (newPassword !== confirmPassword) {
      return showError('Las contraseñas no coinciden');
    }

    setLoading(true);
    try {
      // Actualizar contraseña en Firebase Auth
      await updatePassword(auth.currentUser, newPassword);

      // Marcar que ya no necesita cambiar contraseña
      await updateDoc(doc(db, 'users', userData.id), {
        requiresPasswordChange: false,
        temporaryPassword: null
      });

      success('Contraseña actualizada exitosamente');

      // Recargar la página para actualizar el estado
      window.location.reload();
    } catch (err) {
      console.error('Error updating password:', err);
      if (err.code === 'auth/requires-recent-login') {
        showError('Por seguridad, necesitás cerrar sesión y volver a entrar');
        setTimeout(() => {
          logout();
        }, 2000);
      } else {
        showError('Error al actualizar la contraseña');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-800 border border-gray-700 rounded-2xl p-6 shadow-2xl">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-500/20 rounded-full mb-4">
            <Shield size={32} className="text-yellow-500" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Cambio de Contraseña Requerido</h2>
          <p className="text-sm text-gray-400">
            Tu contraseña fue restablecida por un administrador. Por seguridad, debés cambiarla antes de continuar.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm text-gray-300">Nueva Contraseña</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full pl-10 pr-10 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm text-gray-300">Confirmar Contraseña</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repetir contraseña"
                className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3">
            <p className="text-xs text-blue-400">
              <strong>Tip:</strong> Usá una contraseña segura que incluya letras, números y símbolos.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Actualizando...
              </>
            ) : (
              'Cambiar Contraseña'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForcePasswordChange;
