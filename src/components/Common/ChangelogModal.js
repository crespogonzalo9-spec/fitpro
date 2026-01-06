import React from 'react';
import { Calendar, Package, CheckCircle } from 'lucide-react';
import { Modal } from './index';
import { changelog, getCurrentVersion } from '../../data/changelog';

const ChangelogModal = ({ isOpen, onClose }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('es-AR', options);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Actualizaciones" size="lg">
      <div className="space-y-6">
        {/* Versión actual */}
        <div className="flex items-center justify-between p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Package className="text-blue-400" size={20} />
            </div>
            <div>
              <p className="font-semibold text-blue-400">Versión Actual</p>
              <p className="text-sm text-gray-400">FitPro v{getCurrentVersion()}</p>
            </div>
          </div>
        </div>

        {/* Historial de actualizaciones */}
        <div className="space-y-6 max-h-96 overflow-y-auto pr-2">
          {changelog.map((release, index) => (
            <div
              key={release.version}
              className={`relative pl-6 pb-6 ${
                index !== changelog.length - 1 ? 'border-l-2 border-gray-700' : ''
              }`}
            >
              {/* Indicador de versión */}
              <div className="absolute left-0 -translate-x-1/2 w-4 h-4 bg-primary rounded-full border-4 border-slate-900"></div>

              <div className="space-y-3">
                {/* Header de la versión */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-lg text-primary">
                      v{release.version}
                    </h3>
                    {index === 0 && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-green-500/20 text-green-400 rounded-full">
                        Actual
                      </span>
                    )}
                  </div>
                  <p className="font-semibold text-white mb-1">{release.title}</p>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Calendar size={14} />
                    <span>{formatDate(release.date)}</span>
                  </div>
                </div>

                {/* Lista de actualizaciones */}
                <ul className="space-y-2">
                  {release.updates.map((update, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                      <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{update}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-gray-700">
          <p className="text-center text-sm text-gray-500">
            ¿Tenés sugerencias? Contactá al desarrollador para nuevas funcionalidades
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default ChangelogModal;
