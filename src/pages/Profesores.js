import React, { useState, useEffect } from 'react';
import { Plus, UserCheck, MoreVertical, Edit, Trash2, Mail, Phone, Shield } from 'lucide-react';
import { Button, Card, Modal, Input, Select, SearchInput, EmptyState, LoadingState, ConfirmDialog, Badge, Avatar, Dropdown, DropdownItem , GymRequired } from '../components/Common';
import { useAuth } from '../contexts/AuthContext';
import { useGym } from '../contexts/GymContext';
import { useToast } from '../contexts/ToastContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, updateDoc, doc, serverTimestamp, getDocs } from 'firebase/firestore';
import { formatDate } from '../utils/helpers';

const ProfesoresContent = () => {
  const { userData, canManageProfesores } = useAuth();
  const { currentGym } = useGym();
  const { success, error: showError } = useToast();
  
  const [profesores, setProfesores] = useState([]);
  const [alumnos, setAlumnos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [showRemove, setShowRemove] = useState(false);
  const [selected, setSelected] = useState(null);

  const canEdit = canManageProfesores();

  useEffect(() => {
    if (!currentGym?.id) { setLoading(false); return; }

    // Cargar todos los usuarios del gimnasio y filtrar por roles
    const usersQuery = query(collection(db, 'users'), where('gymId', '==', currentGym.id));
    const unsub = onSnapshot(usersQuery, (snap) => {
      const allUsers = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Filtrar profesores (usuarios que tienen rol 'profesor' en el array de roles)
      const profs = allUsers.filter(u =>
        u.roles && u.roles.includes('profesor') && !u.roles.includes('admin') && !u.roles.includes('sysadmin')
      );
      setProfesores(profs);

      // Filtrar alumnos (usuarios que SOLO tienen rol 'alumno')
      const alums = allUsers.filter(u =>
        (!u.roles || u.roles.length === 0 || (u.roles.length === 1 && u.roles.includes('alumno')))
      );
      setAlumnos(alums);

      setLoading(false);
    });

    return () => unsub();
  }, [currentGym]);

  const handleAssign = async (alumnoId) => {
    try {
      // Buscar el alumno
      const alumno = alumnos.find(a => a.id === alumnoId);
      if (!alumno) {
        showError('Alumno no encontrado');
        return;
      }

      // Agregar rol 'profesor' manteniendo 'alumno'
      const currentRoles = alumno.roles || ['alumno'];
      const newRoles = currentRoles.includes('profesor')
        ? currentRoles
        : [...currentRoles, 'profesor'];

      await updateDoc(doc(db, 'users', alumnoId), {
        roles: newRoles,
        updatedAt: serverTimestamp()
      });
      success('Profesor asignado');
      setShowModal(false);
    } catch (err) {
      console.error('Error al asignar profesor:', err);
      showError('Error al asignar');
    }
  };

  const handleRemove = async () => {
    try {
      // Remover rol 'profesor' del array de roles
      const currentRoles = selected.roles || [];
      const newRoles = currentRoles.filter(r => r !== 'profesor');

      // Asegurarse que al menos queda 'alumno'
      if (newRoles.length === 0) {
        newRoles.push('alumno');
      }

      await updateDoc(doc(db, 'users', selected.id), {
        roles: newRoles,
        updatedAt: serverTimestamp()
      });
      success('Rol de profesor removido');
      setShowRemove(false);
      setSelected(null);
    } catch (err) {
      console.error('Error al remover profesor:', err);
      showError('Error al remover');
    }
  };

  const filteredProfesores = profesores.filter(p => !search || p.name?.toLowerCase().includes(search.toLowerCase()) || p.email?.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <LoadingState />;
  if (!currentGym) return <EmptyState icon={UserCheck} title="Sin gimnasio" />;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Profesores</h1>
          <p className="text-gray-400">{filteredProfesores.length} profesores</p>
        </div>
        {canEdit && (
          <Button icon={Plus} onClick={() => setShowModal(true)}>
            Asignar Profesor
          </Button>
        )}
      </div>

      <SearchInput value={search} onChange={setSearch} placeholder="Buscar profesor..." />

      {filteredProfesores.length === 0 ? (
        <EmptyState 
          icon={UserCheck} 
          title="No hay profesores" 
          description="Asigná el rol de profesor a alumnos existentes"
          action={canEdit && <Button icon={Plus} onClick={() => setShowModal(true)}>Asignar</Button>}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProfesores.map(prof => (
            <Card key={prof.id}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar name={prof.name} size="lg" />
                  <div>
                    <h3 className="font-semibold">{prof.name}</h3>
                    <Badge className="mt-1 bg-blue-500/20 text-blue-400">Profesor</Badge>
                  </div>
                </div>
                {canEdit && (
                  <Dropdown trigger={<button className="p-2 hover:bg-gray-700 rounded-lg"><MoreVertical size={18} /></button>}>
                    <DropdownItem icon={Shield} danger onClick={() => { setSelected(prof); setShowRemove(true); }}>
                      Quitar rol
                    </DropdownItem>
                  </Dropdown>
                )}
              </div>
              <div className="mt-4 pt-3 border-t border-gray-700 space-y-1 text-sm text-gray-400">
                <p className="flex items-center gap-2"><Mail size={14} /> {prof.email}</p>
                {prof.phone && <p className="flex items-center gap-2"><Phone size={14} /> {prof.phone}</p>}
                <p className="text-xs">Desde: {formatDate(prof.updatedAt || prof.createdAt)}</p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal asignar profesor */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Asignar Profesor">
        <div className="space-y-4">
          <p className="text-gray-400">Seleccioná un alumno para convertirlo en profesor:</p>
          {alumnos.length === 0 ? (
            <p className="text-center py-4 text-gray-500">No hay alumnos disponibles</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {alumnos.map(alumno => (
                <button
                  key={alumno.id}
                  onClick={() => handleAssign(alumno.id)}
                  className="w-full flex items-center gap-3 p-3 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors text-left"
                >
                  <Avatar name={alumno.name} size="sm" />
                  <div>
                    <p className="font-medium">{alumno.name}</p>
                    <p className="text-sm text-gray-400">{alumno.email}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </Modal>

      <ConfirmDialog 
        isOpen={showRemove} 
        onClose={() => setShowRemove(false)} 
        onConfirm={handleRemove} 
        title="Quitar rol de profesor" 
        message={`¿Quitar el rol de profesor a "${selected?.name}"? Volverá a ser alumno.`}
        confirmText="Quitar rol" 
      />
    </div>
  );
};

const Profesores = () => (<GymRequired><ProfesoresContent /></GymRequired>);
export default Profesores;
