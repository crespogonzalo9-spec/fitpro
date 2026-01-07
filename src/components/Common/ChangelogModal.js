import React from 'react';
import { Modal, Badge } from './index';
import { CheckCircle, Info } from 'lucide-react';
import { CHANGELOG, formatChangelogDate } from '../../utils/changelog';

const ChangelogModal = ({ isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Actualizaciones de FitPro" size="lg">
      <div className="space-y-6">
        {CHANGELOG.map((version, index) => (
          <div key={version.version} className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-gray-700">
              <div className="flex items-center gap-3">
                <Badge className={index === 0 ? 'bg-primary/20 text-primary' : 'bg-gray-500/20 text-gray-400'}>
                  v{version.version}
                </Badge>
                <h3 className="font-semibold text-white">{version.title}</h3>
              </div>
              <span className="text-sm text-gray-500">
                {formatChangelogDate(version.date)}
              </span>
            </div>

            <ul className="space-y-2">
              {version.changes.map((change, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                  <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{change}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl flex items-start gap-3">
        <Info size={20} className="text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-300">
          <p className="font-medium mb-1">¿Encontraste algún problema?</p>
          <p className="text-blue-400/80">
            Contactá a soporte o reportá el issue en el sistema.
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default ChangelogModal;
