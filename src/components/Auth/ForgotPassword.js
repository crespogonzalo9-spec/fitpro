import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Dumbbell, Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../firebase';
import { useToast } from '../../contexts/ToastContext';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { success, error: showError } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return showError('Ingresá tu email');

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      success('Email enviado! Revisá tu casilla de correo');
      setSent(true);
    } catch (err) {
      console.error('Error sending reset email:', err);
      if (err.code === 'auth/user-not-found') {
        showError('No existe una cuenta con ese email');
      } else if (err.code === 'auth/invalid-email') {
        showError('Email inválido');
      } else {
        showError('Error al enviar el email');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-2xl mb-4">
            <Dumbbell size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">FitPro</h1>
          <p className="text-gray-400 mt-2">Restablecer Contraseña</p>
        </div>

        <div className="bg-slate-800/50 border border-gray-700/50 rounded-2xl p-6">
          {!sent ? (
            <>
              <h2 className="text-xl font-semibold mb-2 text-center">¿Olvidaste tu contraseña?</h2>
              <p className="text-sm text-gray-400 mb-6 text-center">
                Ingresá tu email y te enviaremos un link para restablecer tu contraseña
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-sm text-gray-300">Email</label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@email.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <><Loader2 className="animate-spin" size={20} /> Enviando...</> : 'Enviar Email'}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500/20 rounded-full mb-4">
                <CheckCircle size={32} className="text-emerald-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Email enviado!</h3>
              <p className="text-sm text-gray-400 mb-6">
                Revisá tu casilla de correo y seguí las instrucciones para restablecer tu contraseña
              </p>
              <button
                onClick={() => setSent(false)}
                className="text-sm text-emerald-500 hover:text-emerald-400"
              >
                Reenviar email
              </button>
            </div>
          )}

          <div className="mt-6 text-center">
            <Link to="/login" className="text-sm text-gray-400 hover:text-gray-300 inline-flex items-center gap-1">
              <ArrowLeft size={16} />
              Volver al login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
