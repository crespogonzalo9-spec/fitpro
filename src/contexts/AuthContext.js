import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [simulatedRole, setSimulatedRole] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          // Normalizar roles a array
          let roles = data.roles || [];
          if (data.role && !roles.includes(data.role)) {
            roles = [data.role, ...roles];
          }
          if (roles.length === 0) roles = ['miembro'];
          setUserData({ id: userDoc.id, ...data, roles });
        } else {
          // Usuario existe en Auth pero no en Firestore (fue eliminado)
          // Crear documento básico para que pueda usar la app
          setUserData({ 
            id: firebaseUser.uid, 
            email: firebaseUser.email,
            name: firebaseUser.displayName || 'Usuario',
            roles: ['miembro'],
            gymId: null,
            needsReregistration: true // Marcar que necesita completar datos
          });
        }
      } else {
        setUser(null);
        setUserData(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        let roles = data.roles || [];
        if (data.role && !roles.includes(data.role)) roles = [data.role, ...roles];
        if (roles.length === 0) roles = ['miembro'];
        setUserData({ id: userDoc.id, ...data, roles });
      } else {
        // Usuario en Auth pero no en Firestore - necesita re-registro
        setUserData({ 
          id: result.user.uid, 
          email: result.user.email,
          roles: ['miembro'],
          gymId: null,
          needsReregistration: true
        });
      }
      return { success: true };
    } catch (error) {
      let message = 'Error al iniciar sesión';
      if (error.code === 'auth/user-not-found') message = 'Usuario no encontrado';
      if (error.code === 'auth/wrong-password') message = 'Contraseña incorrecta';
      if (error.code === 'auth/invalid-credential') message = 'Credenciales inválidas';
      return { success: false, error: message };
    }
  };

  // Registro libre (puede elegir gimnasio o sin gimnasio)
  const register = async (email, password, name, phone = '', gymId = null) => {
    try {
      let userId;
      
      try {
        // Intentar crear nuevo usuario
        const result = await createUserWithEmailAndPassword(auth, email, password);
        userId = result.user.uid;
      } catch (authError) {
        if (authError.code === 'auth/email-already-in-use') {
          // El email ya existe en Auth - intentar login y recrear documento
          try {
            const loginResult = await signInWithEmailAndPassword(auth, email, password);
            userId = loginResult.user.uid;
            
            // Verificar si ya tiene documento
            const existingDoc = await getDoc(doc(db, 'users', userId));
            if (existingDoc.exists() && !existingDoc.data().needsReregistration) {
              return { success: false, error: 'Ya tenés una cuenta. Iniciá sesión.' };
            }
            // Si no tiene documento o necesita re-registro, continuar
          } catch (loginError) {
            return { success: false, error: 'El email ya está registrado con otra contraseña' };
          }
        } else {
          throw authError;
        }
      }
      
      // Los roles se asignan por defecto como miembro
      // NOTA: Para crear un sysadmin, usar la consola de Firebase directamente
      const roles = ['miembro'];

      const newUserData = {
        email: email.toLowerCase(),
        name,
        phone,
        roles,
        gymId: gymId || null,
        isActive: true,
        isBlocked: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(doc(db, 'users', userId), newUserData);
      setUserData({ id: userId, ...newUserData });
      
      return { success: true };
    } catch (error) {
      console.error('[Auth] Register error:', error);
      let message = 'Error al registrar';
      if (error.code === 'auth/email-already-in-use') {
        message = 'Este correo electrónico ya está registrado. Por favor, iniciá sesión o usá otro email.';
      }
      if (error.code === 'auth/weak-password') {
        message = 'La contraseña debe tener al menos 6 caracteres';
      }
      if (error.code === 'auth/invalid-email') {
        message = 'El correo electrónico no es válido';
      }
      return { success: false, error: message };
    }
  };

  // Registro con invitación (asigna gimnasio y roles automáticamente)
  const registerWithInvite = async (email, password, name, phone, gymId, inviteRoles = ['miembro']) => {
    try {
      let userId;

      try {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        userId = result.user.uid;
      } catch (authError) {
        if (authError.code === 'auth/email-already-in-use') {
          try {
            const loginResult = await signInWithEmailAndPassword(auth, email, password);
            userId = loginResult.user.uid;
          } catch (loginError) {
            return { success: false, error: 'El email ya está registrado con otra contraseña' };
          }
        } else {
          throw authError;
        }
      }

      // Asegurar que siempre tenga miembro
      const roles = inviteRoles.includes('miembro') ? inviteRoles : [...inviteRoles, 'miembro'];

      const newUserData = {
        email: email.toLowerCase(),
        name,
        phone,
        roles,
        gymId,
        isActive: true,
        isBlocked: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(doc(db, 'users', userId), newUserData);
      setUserData({ id: userId, ...newUserData });

      return { success: true, userId };
    } catch (error) {
      console.error('[Auth] RegisterWithInvite error:', error);
      let message = 'Error al registrar';
      if (error.code === 'auth/email-already-in-use') {
        message = 'Este correo electrónico ya está registrado. Por favor, iniciá sesión o usá otro email.';
      }
      if (error.code === 'auth/weak-password') {
        message = 'La contraseña debe tener al menos 6 caracteres';
      }
      if (error.code === 'auth/invalid-email') {
        message = 'El correo electrónico no es válido';
      }
      return { success: false, error: message };
    }
  };

  // Completar re-registro (para usuarios que fueron eliminados)
  const completeReregistration = async (name, phone = '', gymId = null) => {
    if (!user) return { success: false, error: 'No hay sesión activa' };
    
    try {
      const newUserData = {
        email: user.email.toLowerCase(),
        name,
        phone,
        roles: ['miembro'],
        gymId: gymId || null,
        isActive: true,
        isBlocked: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(doc(db, 'users', user.uid), newUserData);
      setUserData({ id: user.uid, ...newUserData });
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const updateUserGym = async (userId, gymId) => {
    try {
      await updateDoc(doc(db, 'users', userId), { gymId, updatedAt: serverTimestamp() });
      if (userData?.id === userId) {
        setUserData(prev => ({ ...prev, gymId }));
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setUserData(null);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Error al enviar email' };
    }
  };

  // Refrescar datos del usuario
  const refreshUserData = async () => {
    if (!user) return;
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      let roles = data.roles || [];
      if (roles.length === 0) roles = ['miembro'];
      setUserData({ id: userDoc.id, ...data, roles });
    }
  };

  // =============================================
  // SIMULACIÓN DE ROLES (solo para sysadmin)
  // =============================================

  const startRoleSimulation = (role) => {
    // Solo sysadmin puede simular roles
    if (!userData?.roles?.includes('sysadmin')) return;
    setSimulatedRole(role);
  };

  const stopRoleSimulation = () => {
    setSimulatedRole(null);
  };

  const isSimulating = () => simulatedRole !== null;

  // Obtener el rol efectivo (simulado o real)
  const getEffectiveRoles = () => {
    if (simulatedRole && userData?.roles?.includes('sysadmin')) {
      // Si está simulando, retornar solo el rol simulado
      return [simulatedRole];
    }
    return userData?.roles || [];
  };

  // =============================================
  // SISTEMA DE ROLES MÚLTIPLES
  // =============================================

  const hasRole = (role) => {
    const effectiveRoles = getEffectiveRoles();
    return effectiveRoles.includes(role);
  };

  const isSysadmin = () => {
    // Si está simulando, no tiene permisos de sysadmin
    if (isSimulating()) return false;
    return userData?.roles?.includes('sysadmin') || false;
  };

  const isAdmin = () => hasRole('sysadmin') || hasRole('admin');
  const isProfesor = () => hasRole('sysadmin') || hasRole('admin') || hasRole('profesor');
  const isMiembro = () => hasRole('miembro');
  const isOnlyMiembro = () => {
    const effectiveRoles = getEffectiveRoles();
    return effectiveRoles.length === 1 && effectiveRoles[0] === 'miembro';
  };

  // Verificar si está bloqueado
  const isBlocked = () => userData?.isBlocked === true;

  // =============================================
  // PERMISOS DE ASIGNACIÓN DE ROLES
  // =============================================
  
  const canAssignRole = (targetRole) => {
    if (isSysadmin()) return true;
    if (isAdmin()) return ['admin', 'profesor', 'miembro'].includes(targetRole);
    return false;
  };

  const canRemoveRole = (targetRole) => {
    if (isSysadmin()) return true;
    if (isAdmin()) return ['admin', 'profesor'].includes(targetRole);
    return false;
  };

  // Puede bloquear usuarios (admin y sysadmin)
  const canBlockUsers = () => isAdmin();

  // =============================================
  // PERMISOS DE FUNCIONALIDADES
  // =============================================
  
  const canManageGyms = () => isSysadmin();
  const canManageUsers = () => isSysadmin();
  const canManageClasses = () => isAdmin();
  const canManageExercises = () => isAdmin();
  const canManageProfesores = () => isAdmin();
  const canManageMiembros = () => isProfesor();
  const canCreateRoutines = () => isProfesor();
  const canManageCalendar = () => isAdmin();
  const canManageNews = () => isAdmin();
  const canValidateRankings = () => isProfesor();
  const canCreateRankings = () => isAdmin();
  const canManageInvites = () => isAdmin();
  const canManageGymSettings = () => isAdmin();

  const value = {
    user,
    userData,
    loading,
    login,
    register,
    registerWithInvite,
    completeReregistration,
    logout,
    resetPassword,
    updateUserGym,
    refreshUserData,
    hasRole,
    isSysadmin,
    isAdmin,
    isProfesor,
    isMiembro,
    isOnlyMiembro,
    isBlocked,
    canAssignRole,
    canRemoveRole,
    canBlockUsers,
    canManageGyms,
    canManageUsers,
    canManageClasses,
    canManageExercises,
    canManageProfesores,
    canManageMiembros,
    canCreateRoutines,
    canManageCalendar,
    canManageNews,
    canValidateRankings,
    canCreateRankings,
    canManageInvites,
    canManageGymSettings,
    // Simulación de roles
    simulatedRole,
    startRoleSimulation,
    stopRoleSimulation,
    isSimulating,
    getEffectiveRoles
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
