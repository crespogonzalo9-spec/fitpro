# FitPro - AI Assistant Context

## Project Overview

FitPro is a comprehensive gym management system built with React and Firebase. It provides a complete platform for managing gyms, members, classes, workouts, and performance tracking.

**Tech Stack:**
- React 18.2.0
- Firebase 10.7.0 (Authentication, Firestore)
- React Router 6.20.0
- Tailwind CSS
- Lucide React (icons)
- Recharts (data visualization)
- date-fns (date utilities)

## Architecture

### Context Providers (Nested Order)
```
ToastProvider
└── AuthProvider
    └── GymProvider
        └── ThemeProvider
            └── AppRoutes
```

### Core Contexts
1. **AuthContext** (`src/contexts/AuthContext.js`) - User authentication and user data
2. **GymContext** (`src/contexts/GymContext.js`) - Gym selection and gym-related data
3. **ToastContext** (`src/contexts/ToastContext.js`) - Toast notifications
4. **ThemeContext** (`src/contexts/ThemeContext.js`) - Theme management (dark mode support)

### Routing Structure
- **Public Routes:** `/login`, `/register`
- **Protected Routes:** All require authentication
- **Role-based Access:**
  - `sysadmin`: Can access `/gyms`, `/users`
  - `admin`: Can access `/profesores`, `/invites`, `/members`, `/classes`, etc.
  - `profesor`: Can access `/members`, `/classes`, `/exercises`, etc.
  - `alumno`: Can access `/schedule`, `/my-classes`, `/my-routines`, `/my-prs`

## User Roles Hierarchy

1. **Sysadmin** - System administrator (special email: `crespo.gonzalo9@gmail.com`)
   - Can manage all gyms and users
   - Access to gyms and users management pages

2. **Admin** - Gym administrator
   - Manages their specific gym
   - Can invite users, manage profesores, members, classes

3. **Profesor** - Instructor/Trainer
   - Manages classes, exercises, routines, WODs
   - Can view and manage members

4. **Alumno** - Member/Student
   - Can view schedule, attend classes
   - Track personal records and routines

## Key Features

### For Admins/Profesores:
- Member management
- Class scheduling
- Exercise library
- Routine creation
- WOD (Workout of the Day) management
- Personal records tracking
- Rankings and leaderboards
- News/announcements
- Calendar integration

### For Alumnos:
- View class schedule
- Book classes
- View assigned routines
- Track personal records
- View gym information

### System Features:
- Multi-gym support
- Invitation system (invite codes)
- User blocking functionality
- PWA support (offline capability)
- Dark mode support
- Responsive design

## Firebase Structure

### Collections:
- `users` - User profiles and roles
- `gyms` - Gym information
- `invites` - Invitation codes
- `members` - Gym members
- `classes` - Class schedules
- `exercises` - Exercise library
- `routines` - Workout routines
- `wods` - Workout of the Day
- `prs` - Personal records
- `news` - Announcements

### Security Rules:
- All reads/writes require authentication
- See `FIREBASE_RULES.md` for detailed rules

## Important Files

### Configuration:
- `.env` - Firebase configuration (not in repo, see `.env.example`)
- `src/firebase.js` - Firebase initialization
- `tailwind.config.js` - Tailwind configuration
- `public/manifest.json` - PWA manifest

### Core Components:
- `src/App.js` - Main routing and app structure
- `src/components/Common/Layout.js` - Main layout with sidebar and header
- `src/components/Common/Header.js` - Top navigation bar
- `src/components/Common/Sidebar.js` - Side navigation menu
- `src/components/Common/BlockedScreen.js` - Shown when user is blocked
- `src/components/Common/GymRequired.js` - Wrapper requiring gym selection
- `src/components/Auth/Login.js` - Login page
- `src/components/Auth/Register.js` - Registration page

### Pages:
- `src/pages/Dashboard.js` - Main dashboard
- `src/pages/Gyms.js` - Gym management (sysadmin only)
- `src/pages/Users.js` - User management (sysadmin only)
- `src/pages/Members.js` - Member management
- `src/pages/Profesores.js` - Instructor management
- `src/pages/Classes.js` - Class management
- `src/pages/Exercises.js` - Exercise library
- `src/pages/Routines.js` - Routine management
- `src/pages/WODs.js` - WOD management
- `src/pages/PRs.js` - Personal records
- `src/pages/Rankings.js` - Leaderboards
- `src/pages/Schedule.js` - Class schedule (alumno view)
- `src/pages/MyClasses.js` - My booked classes (alumno)
- `src/pages/Calendar.js` - Calendar view
- `src/pages/News.js` - News/announcements
- `src/pages/Invites.js` - Invitation management
- `src/pages/Settings.js` - User settings
- `src/pages/GymInfo.js` - Gym information
- `src/pages/Profile.js` - User profile

### Utilities:
- `src/utils/helpers.js` - Helper functions
- `src/utils/constants.js` - App constants
- `src/utils/imageUtils.js` - Image handling utilities

## Development Guidelines

### Code Style:
- Use functional components with hooks
- Use Tailwind CSS for styling
- Keep components modular and reusable
- Use contexts for global state management

### Common Patterns:
- Check user roles before rendering admin features
- Use `isBlocked()` from AuthContext to check if user is blocked
- Use `useToast()` for user notifications
- Use `useAuth()` for user data and authentication state
- Use `useGym()` for selected gym data

### State Management:
- User state: AuthContext
- Gym state: GymContext
- UI notifications: ToastContext
- Theme: ThemeContext
- Page-specific state: Local component state or Firebase real-time listeners

### Firebase Patterns:
- Use Firestore real-time listeners for data subscriptions
- Clean up listeners in useEffect cleanup functions
- Handle loading states while fetching data
- Handle errors gracefully with try-catch and toast notifications

### Security:
- Always verify user authentication before data access
- Check user roles before allowing actions
- Use Firebase Security Rules as the primary security layer
- Never trust client-side validation alone

## Environment Setup

1. Install dependencies: `npm install`
2. Create `.env` file with Firebase credentials (see `.env.example`)
3. Set up Firebase project with Authentication and Firestore
4. Deploy Firebase Security Rules
5. Run development server: `npm start`
6. Build for production: `npm build`

## PWA Features

- Offline support via service worker
- App manifest for installation
- Offline fallback page
- Install prompt component

## Deployment

- Optimized for Vercel deployment
- Requires environment variables to be set in deployment platform
- Firebase configuration must be added as environment variables

## Special Notes

- **Sysadmin Access:** User with email `crespo.gonzalo9@gmail.com` automatically gets sysadmin role
- **Invitation System:** Users can be invited via invite codes linked to specific gyms
- **Multi-tenancy:** Each gym operates independently with its own members and data
- **Blocking:** Admins can block users from accessing the system
- **Dark Mode:** Fully supported throughout the application

## Common Tasks

### Adding a new page:
1. Create component in `src/pages/`
2. Add route in `src/App.js`
3. Add navigation item in `src/components/Common/Sidebar.js` or `Header.js`
4. Add role-based protection if needed

### Adding a new role-based feature:
1. Check `userData.roles` array in component
2. Use `ProtectedRoute` with `allowedRoles` prop
3. Update UI to hide/show features based on roles

### Adding a new Firebase collection:
1. Create collection in Firestore
2. Update security rules in Firebase Console
3. Add CRUD operations in relevant components
4. Use real-time listeners for live data updates

## Contact

Developer: Gonzalo Crespo
Email: crespo.gonzalo9@gmail.com
