# Guía de Landing Pages por Gimnasio

## ✨ Características

La landing page con efecto parallax está diseñada para mostrar cada gimnasio de forma profesional y atractiva **antes** de que los usuarios se registren.

### Efectos Visuales
- **Parallax Scrolling**: Múltiples capas que se mueven a diferentes velocidades
- **Hero Section**: Banner principal con gradientes y fondo dinámico
- **Animaciones**: Transiciones suaves en cards y botones
- **Responsive**: Totalmente adaptable a móviles y tablets

### Secciones Incluidas
1. **Hero** - Banner principal con CTAs destacados
2. **Estadísticas** - Métricas del gimnasio (miembros, clases, espacio)
3. **Servicios** - Cards con los principales servicios
4. **Horarios** - Información de horarios de apertura
5. **Contacto** - Ubicación, email, teléfono
6. **CTA Final** - Llamado a la acción para registrarse
7. **Footer** - Créditos y copyright

## 🔗 URLs

### Estructura de URLs
- **Landing pública**: `https://tuapp.com/{gymSlug}`
- **Dashboard privado**: `https://tuapp.com/{gymSlug}/dashboard`

### Comportamiento
- **Usuario NO autenticado** → Ve la landing page
- **Usuario autenticado** → Redirige automáticamente al dashboard

## 🎨 Personalización

### Datos del Gimnasio (Firestore)

La landing page obtiene automáticamente estos datos de Firestore:

```javascript
{
  name: "Nombre del Gym",
  slug: "nombre-del-gym",  // URL amigable
  logoBase64: "data:image/png;base64,..." // Logo del gym
  address: "Calle Ejemplo 123",
  email: "contacto@gym.com",
  phone: "+54 11 1234-5678"
}
```

### Imágenes de Fondo

Actualmente usa imágenes de Unsplash. Para personalizarlas, editá `GymLanding.js`:

```javascript
// Hero Background (línea ~155)
backgroundImage: 'url(https://tu-imagen-hero.jpg)'

// Services Background (línea ~215)
backgroundImage: 'url(https://tu-imagen-servicios.jpg)'
```

### Colores y Estilos

Los colores usan las variables CSS del proyecto:
- `text-primary` - Color principal (emerald-500 por defecto)
- `bg-slate-900` - Fondo oscuro
- `bg-gradient-to-r from-primary to-emerald-500` - Gradientes

## 🚀 Cómo Usar

### 1. Asignar un Slug al Gimnasio

Cada gimnasio necesita un `slug` único:

```javascript
// En Firestore → gyms → {gymId}
{
  name: "CrossFit Central",
  slug: "crossfit-central"  // ← Este será la URL
}
```

### 2. Acceder a la Landing

Los usuarios no registrados pueden acceder directamente:
```
https://fitpro.com/crossfit-central
```

### 3. Registrarse Desde la Landing

Los botones "Registrate" y "Comenzar Ahora" redirigen a:
```
/register
```

### 4. Login Desde la Landing

El botón "Iniciar Sesión" redirige a:
```
/login
```

## 🔒 Seguridad

### Reglas de Firestore (TESTING ONLY)

**⚠️ IMPORTANTE**: Las reglas actuales permiten lectura pública de gimnasios:

```javascript
match /gyms/{gymId} {
  allow read: if true;  // ← Público para landing pages
  allow write: if isAdmin() || isSysadmin();  // ← Protegido
}
```

### Para Producción

Antes de pasar a producción, considerá:

1. **Opción A**: Mantener lectura pública (solo expone info que ya es pública)
2. **Opción B**: Crear una colección `public_gyms` separada
3. **Opción C**: Usar Cloud Functions para servir datos públicos

## 📱 Navegación

### Desktop
- Menú horizontal en el header
- Links a secciones con scroll suave
- Botones de CTA destacados

### Mobile
- Menú hamburguesa
- Drawer lateral con navegación
- CTAs optimizados para touch

## 🎯 Conversión

### Puntos de Conversión (CTAs)

La landing tiene **4 puntos estratégicos** para convertir visitantes:

1. **Hero CTA** - "Comenzar Ahora" (grande y destacado)
2. **Hero Secondary** - "Ver Más" (explorar primero)
3. **Navigation** - "Registrate" (siempre visible)
4. **Final CTA** - "Registrate Gratis" (después de ver todo)

### Métricas Sugeridas

Para trackear conversión, podés agregar eventos de analytics:
- Vista de landing
- Clicks en CTAs
- Scrolls hasta secciones específicas
- Tiempo en página

## 🔧 Desarrollo

### Archivos Relevantes

```
src/
├── pages/
│   ├── GymLanding.js     ← Landing page principal
│   └── SelectGym.js      ← Selector para usuarios autenticados
├── App.js                ← Routing (línea ~143)
└── firestore.rules       ← Permisos (línea ~30)
```

### Testing Local

```bash
# 1. Asegurate de tener un gym con slug en Firestore
# 2. Accedé sin estar logueado:
http://localhost:3000/tu-gym-slug

# 3. Deberías ver la landing page
# 4. Al hacer login, redirige al dashboard
```

## 📊 Contenido Dinámico

### Estadísticas (Actualmente Estáticas)

Para hacer las estadísticas dinámicas, podés agregar estos campos en Firestore:

```javascript
{
  stats: {
    activeMembers: 500,
    weeklyClasses: 50,
    spaceSize: "200m²",
    rating: 4.9
  }
}
```

Luego actualizar en `GymLanding.js`:

```javascript
<StatCard icon={Users} number={gym.stats?.activeMembers || "500+"} label="Miembros Activos" />
```

## 🎨 Personalización Avanzada

### Cambiar Servicios

Editá los `ServiceCard` en `GymLanding.js` (línea ~230):

```javascript
<ServiceCard
  icon={TuIcono}
  title="Tu Servicio"
  description="Descripción personalizada..."
/>
```

### Agregar Secciones

Podés agregar nuevas secciones siguiendo el patrón:

```javascript
<section className="py-20 bg-slate-800/30">
  <div className="container mx-auto px-4">
    {/* Tu contenido aquí */}
  </div>
</section>
```

### Cambiar Horarios

Los horarios son estáticos. Para hacerlos dinámicos, agregá en Firestore:

```javascript
{
  schedule: {
    weekdays: {
      morning: "6:00 AM - 12:00 PM",
      evening: "3:00 PM - 10:00 PM"
    },
    weekends: {
      morning: "8:00 AM - 1:00 PM",
      evening: "4:00 PM - 8:00 PM"
    }
  }
}
```

## 🚀 Próximas Mejoras

Ideas para extender la funcionalidad:

- [ ] Galería de fotos del gimnasio
- [ ] Testimonios de clientes
- [ ] Video de presentación
- [ ] Integración con Google Maps
- [ ] Formulario de contacto directo
- [ ] Chat de WhatsApp
- [ ] Integración con Instagram
- [ ] Plan de precios y membresías
- [ ] Calendario de clases en vivo
- [ ] Reserva de clases desde la landing

---

**Desarrollado por Gonzalo Crespo**
