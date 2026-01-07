import React from 'react';
import { Card } from '../components/Common';

const MemberProgress = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Progreso del Alumno</h1>
        <p className="text-gray-400">Seguimiento del progreso individual de cada alumno</p>
      </div>

      <Card>
        <div className="flex flex-col items-center justify-center py-20">
          <h2 className="text-xl font-bold mb-2">Próximamente</h2>
          <p className="text-gray-400 text-center">
            Esta funcionalidad estará disponible pronto para hacer seguimiento detallado del progreso de los alumnos.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default MemberProgress;
