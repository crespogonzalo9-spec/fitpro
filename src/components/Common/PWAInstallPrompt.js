import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Share, Plus } from 'lucide-react';

const PWAInstallPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Detectar si ya está instalada como PWA
    const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                       window.navigator.standalone === true;
    setIsStandalone(standalone);

    if (standalone) return; // Ya está instalada, no mostrar nada

    // Detectar plataforma
    const userAgent = navigator.userAgent.toLowerCase();
    const iOS = /iphone|ipad|ipod/.test(userAgent) && !window.MSStream;
    const android = /android/.test(userAgent);
    setIsIOS(iOS);
    setIsAndroid(android);

    // Verificar si es la primera vez o si ya se mostró
    const hasSeenPrompt = localStorage.getItem('fitpro-pwa-seen');
    const dismissCount = parseInt(localStorage.getItem('fitpro-pwa-dismiss') || '0');

    // Si ya rechazó 3 veces, no mostrar más
    if (dismissCount >= 3) return;

    // Para Android/Chrome - escuchar el evento beforeinstallprompt
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Mostrar inmediatamente si es primera vez, o después de 2 segundos si ya lo vio
      const delay = hasSeenPrompt ? 2000 : 500;
      setTimeout(() => {
        setShowPrompt(true);
        localStorage.setItem('fitpro-pwa-seen', 'true');
      }, delay);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Para iOS, mostrar instrucciones inmediatamente si es primera vez
    if (iOS && !standalone) {
      const delay = hasSeenPrompt ? 3000 : 1000;
      setTimeout(() => {
        setShowPrompt(true);
        localStorage.setItem('fitpro-pwa-seen', 'true');
      }, delay);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('[PWA] User accepted install');
        localStorage.removeItem('fitpro-pwa-dismiss');
      }
      
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    const count = parseInt(localStorage.getItem('fitpro-pwa-dismiss') || '0');
    localStorage.setItem('fitpro-pwa-dismiss', (count + 1).toString());
    setShowPrompt(false);
  };

  if (!showPrompt || isStandalone) return null;

  // Modal de pantalla completa para primera instalación
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fadeIn">
      <div className="bg-slate-900 rounded-3xl p-6 max-w-sm w-full border border-slate-700 shadow-2xl animate-slideUp">
        {/* Header con icono */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10 text-white">
              <path d="M6.5 6.5h2v2h-2zM15.5 6.5h2v2h-2zM6.5 15.5h2v2h-2zM15.5 15.5h2v2h-2z" fill="currentColor"/>
              <rect x="5" y="10" width="14" height="4" rx="1" fill="currentColor"/>
              <rect x="3" y="9" width="2" height="6" rx="0.5" fill="currentColor"/>
              <rect x="19" y="9" width="2" height="6" rx="0.5" fill="currentColor"/>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white">Instalar FitPro</h2>
          <p className="text-gray-400 mt-2">
            Agregá la app a tu pantalla de inicio para acceder más rápido
          </p>
        </div>

        {/* Beneficios */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-3 text-sm">
            <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
              <span>⚡</span>
            </div>
            <span className="text-gray-300">Acceso instantáneo desde tu inicio</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
              <span>📱</span>
            </div>
            <span className="text-gray-300">Experiencia de app nativa</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
              <span>🔔</span>
            </div>
            <span className="text-gray-300">Notificaciones de clases y WODs</span>
          </div>
        </div>

        {/* Instrucciones específicas por plataforma */}
        {isIOS ? (
          <>
            <div className="bg-slate-800 rounded-xl p-4 mb-6">
              <p className="text-sm text-gray-400 mb-3">Para instalar en iPhone/iPad:</p>
              <ol className="space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0">1</span>
                  <span className="text-gray-300">
                    Tocá el botón <Share size={16} className="inline text-blue-400 mx-1" /> de compartir abajo
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0">2</span>
                  <span className="text-gray-300">
                    Deslizá y tocá <Plus size={14} className="inline mx-1" /> "Agregar a inicio"
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0">3</span>
                  <span className="text-gray-300">Confirmá tocando "Agregar"</span>
                </li>
              </ol>
            </div>
            <button
              onClick={handleDismiss}
              className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-colors"
            >
              ¡Entendido!
            </button>
          </>
        ) : (
          <>
            <button
              onClick={handleInstall}
              className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 mb-3"
            >
              <Download size={20} />
              Instalar Ahora
            </button>
            <button
              onClick={handleDismiss}
              className="w-full py-3 text-gray-400 hover:text-white transition-colors text-sm"
            >
              Quizás más tarde
            </button>
          </>
        )}

        {/* Botón cerrar */}
        <button 
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-2 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <X size={20} className="text-gray-500" />
        </button>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
