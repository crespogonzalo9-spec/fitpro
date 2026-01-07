import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { GymProvider, useGym } from './contexts/GymContext';
import { ToastProvider } from './contexts/ToastContext';
import { ThemeProvider } from './contexts/ThemeContext';

// Auth
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';

// Layout
import Layout from './components/Common/Layout';
import PWAInstallPrompt from './components/Common/PWAInstallPrompt';
import BlockedScreen from './components/Common/BlockedScreen';
import { SuspendedGymScreen } from './components/Common';
import GymRouteHandler from './components/Common/GymRouteHandler';

// Pages
import Dashboard from './pages/Dashboard';
import Gyms from './pages/Gyms';
import UsersPage from './pages/Users';
import Members from './pages/Members';
import Profesores from './pages/Profesores';
import Classes from './pages/Classes';
import Exercises from './pages/Exercises';
import Routines from './pages/Routines';
import WODs from './pages/WODs';
import PRs from './pages/PRs';
import Rankings from './pages/Rankings';
import Schedule from './pages/Schedule';
import MyClasses from './pages/MyClasses';
import Calendar from './pages/Calendar';
import News from './pages/News';
import Invites from './pages/Invites';
import Settings from './pages/Settings';
import GymInfo from './pages/GymInfo';
import Profile from './pages/Profile';
import MemberProgress from './pages/MemberProgress';
import SelectGym from './pages/SelectGym';

const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-900">
    <div className="w-8 h-8 border-2 border-gray-700 border-t-emerald-500 rounded-full animate-spin" />
  </div>
);

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, userData, loading, isBlocked, logout } = useAuth();
  const { isGymSuspended } = useGym();

  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />;

  // Si está bloqueado, cerrar sesión automáticamente
  if (isBlocked()) {
    logout();
    return <BlockedScreen />;
  }

  // Si el gimnasio está suspendido, mostrar pantalla de suspensión
  if (isGymSuspended && isGymSuspended()) {
    return <SuspendedGymScreen />;
  }

  // Verificar roles múltiples
  if (allowedRoles && userData?.roles) {
    const hasPermission = allowedRoles.some(role => userData.roles.includes(role));
    if (!hasPermission) {
      return <Navigate to="/select-gym" replace />;
    }
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (user) return <Navigate to="/select-gym" replace />;

  return children;
};

// Componente para manejar la ruta raíz y detectar invitaciones
const RootRedirect = () => {
  const { user, loading, userData } = useAuth();
  const { availableGyms, loading: gymLoading } = useGym();
  const location = useLocation();

  if (loading || gymLoading) return <LoadingSpinner />;

  // Si hay código de invitación, ir a registro
  const params = new URLSearchParams(location.search);
  if (params.get('invite')) {
    return <Navigate to={`/register${location.search}`} replace />;
  }

  // Si está logueado
  if (user) {
    // Si solo tiene un gimnasio, redirigir directamente
    if (availableGyms.length === 1 && availableGyms[0].slug) {
      return <Navigate to={`/${availableGyms[0].slug}/dashboard`} replace />;
    }
    // Si tiene múltiples gimnasios o ninguno, ir a selección
    return <Navigate to="/select-gym" replace />;
  }

  // Si no está logueado, ir a login
  return <Navigate to="/login" replace />;
};

const ComingSoon = ({ title }) => (
  <div className="flex flex-col items-center justify-center py-20">
    <h2 className="text-2xl font-bold mb-2">{title}</h2>
    <p className="text-gray-400">Próximamente</p>
  </div>
);

function AppRoutes() {
  return (
    <Routes>
      {/* Ruta raíz - detecta invitaciones y redirige */}
      <Route path="/" element={<RootRedirect />} />

      {/* Auth routes - sin gymSlug */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

      {/* Selección de gimnasio - sin gymSlug */}
      <Route path="/select-gym" element={<ProtectedRoute><SelectGym /></ProtectedRoute>} />

      {/* Rutas especiales para Sysadmin - sin gymSlug (vista global) */}
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="gyms" element={<ProtectedRoute allowedRoles={['sysadmin']}><Gyms /></ProtectedRoute>} />
        <Route path="users" element={<ProtectedRoute allowedRoles={['sysadmin']}><UsersPage /></ProtectedRoute>} />
        <Route path="dashboard" element={<Dashboard />} /> {/* Vista global para sysadmin */}
      </Route>

      {/* Rutas con gymSlug - todas las rutas específicas de gimnasio */}
      <Route path="/:gymSlug" element={<ProtectedRoute><GymRouteHandler><Layout /></GymRouteHandler></ProtectedRoute>}>
        <Route path="dashboard" element={<Dashboard />} />

        {/* Admin only */}
        <Route path="profesores" element={<ProtectedRoute allowedRoles={['admin', 'sysadmin']}><Profesores /></ProtectedRoute>} />
        <Route path="invites" element={<ProtectedRoute allowedRoles={['admin', 'sysadmin']}><Invites /></ProtectedRoute>} />

        {/* Admin & Profesor */}
        <Route path="members" element={<ProtectedRoute allowedRoles={['sysadmin', 'admin', 'profesor']}><Members /></ProtectedRoute>} />
        <Route path="member-progress" element={<ProtectedRoute allowedRoles={['sysadmin', 'admin', 'profesor']}><MemberProgress /></ProtectedRoute>} />
        <Route path="classes" element={<ProtectedRoute allowedRoles={['sysadmin', 'admin', 'profesor']}><Classes /></ProtectedRoute>} />
        <Route path="exercises" element={<ProtectedRoute allowedRoles={['sysadmin', 'admin', 'profesor']}><Exercises /></ProtectedRoute>} />
        <Route path="routines" element={<ProtectedRoute allowedRoles={['sysadmin', 'admin', 'profesor']}><Routines /></ProtectedRoute>} />
        <Route path="prs" element={<ProtectedRoute allowedRoles={['sysadmin', 'admin', 'profesor']}><PRs /></ProtectedRoute>} />
        <Route path="rankings" element={<ProtectedRoute allowedRoles={['sysadmin', 'admin', 'profesor']}><Rankings /></ProtectedRoute>} />

        {/* Todos los usuarios autenticados */}
        <Route path="wods" element={<ProtectedRoute><WODs /></ProtectedRoute>} />
        <Route path="calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
        <Route path="news" element={<ProtectedRoute><News /></ProtectedRoute>} />

        {/* Alumno */}
        <Route path="schedule" element={<Schedule />} />
        <Route path="my-classes" element={<MyClasses />} />
        <Route path="my-routines" element={<Routines />} />
        <Route path="my-prs" element={<PRs />} />

        {/* Common */}
        <Route path="profile" element={<Profile />} />
        <Route path="gym-info" element={<GymInfo />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to="/select-gym" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <ToastProvider>
        <AuthProvider>
          <GymProvider>
            <ThemeProvider>
              <AppRoutes />
              <PWAInstallPrompt />
            </ThemeProvider>
          </GymProvider>
        </AuthProvider>
      </ToastProvider>
    </Router>
  );
}

export default App;
