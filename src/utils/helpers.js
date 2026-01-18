// Formatear fecha
export const formatDate = (timestamp) => {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

// Formatear fecha relativa
export const formatRelativeDate = (timestamp) => {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Ahora';
  if (minutes < 60) return `Hace ${minutes} min`;
  if (hours < 24) return `Hace ${hours}h`;
  if (days < 7) return `Hace ${days} días`;
  return formatDate(timestamp);
};

// Obtener nombre de rol
export const getRoleName = (role) => {
  const roles = {
    sysadmin: 'Sysadmin',
    admin: 'Admin',
    profesor: 'Profesor',
    miembro: 'Miembro'
  };
  return roles[role] || role;
};

// Obtener nombres de roles múltiples
export const getRolesNames = (roles) => {
  if (!roles || roles.length === 0) return 'Miembro';
  return roles.map(r => getRoleName(r)).join(', ');
};

// Obtener color de rol (el más alto)
export const getRoleColor = (roles) => {
  const roleArray = Array.isArray(roles) ? roles : [roles];
  if (roleArray.includes('sysadmin')) return 'bg-yellow-500/20 text-yellow-400';
  if (roleArray.includes('admin')) return 'bg-blue-500/20 text-blue-400';
  if (roleArray.includes('profesor')) return 'bg-purple-500/20 text-purple-400';
  return 'bg-gray-500/20 text-gray-400';
};

// Obtener estado de PR
export const getPRStatusName = (status) => {
  const statuses = {
    pending: 'Pendiente',
    validated: 'Validado',
    rejected: 'Rechazado'
  };
  return statuses[status] || status;
};

export const getPRStatusColor = (status) => {
  const colors = {
    pending: 'bg-yellow-500/20 text-yellow-400',
    validated: 'bg-green-500/20 text-green-400',
    rejected: 'bg-red-500/20 text-red-400'
  };
  return colors[status] || 'bg-gray-500/20 text-gray-400';
};

// Formatear valor con unidad
export const formatTimeValue = (value, unit) => {
  if (!value) return '-';
  
  if (unit === 'tiempo' || unit === 'time') {
    const totalSeconds = parseFloat(value);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return minutes > 0 ? `${minutes}:${seconds.toString().padStart(2, '0')}` : `${seconds}s`;
  }
  
  return `${value} ${unit || 'kg'}`;
};

// Generar iniciales
export const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

// Generar color consistente basado en string
export const stringToColor = (str) => {
  if (!str) return '#6B7280';
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#14B8A6', '#3B82F6', '#8B5CF6', '#EC4899'];
  return colors[Math.abs(hash) % colors.length];
};
