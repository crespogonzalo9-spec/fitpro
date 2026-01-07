/**
 * Utilidades para generar y manejar slugs de gimnasios
 */

/**
 * Genera un slug válido desde un nombre de gimnasio
 * Ejemplo: "CrossFit Buenos Aires" => "crossfit-buenos-aires"
 */
export const generateSlug = (name) => {
  if (!name) return '';

  return name
    .toLowerCase()
    .trim()
    // Reemplazar acentos y caracteres especiales
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Reemplazar espacios y caracteres no alfanuméricos con guiones
    .replace(/[^a-z0-9]+/g, '-')
    // Eliminar guiones al principio y al final
    .replace(/^-+|-+$/g, '')
    // Limitar longitud a 50 caracteres
    .substring(0, 50)
    // Eliminar guión final si se cortó a la mitad
    .replace(/-$/, '');
};

/**
 * Valida que un slug sea válido
 */
export const isValidSlug = (slug) => {
  if (!slug) return false;
  // Solo letras minúsculas, números y guiones
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug);
};

/**
 * Obtiene un slug único agregando un número al final si es necesario
 */
export const getUniqueSlug = (baseSlug, existingSlugs) => {
  let slug = baseSlug;
  let counter = 1;

  while (existingSlugs.includes(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
};

/**
 * Formatea un slug para mostrarlo como título
 * Ejemplo: "crossfit-buenos-aires" => "Crossfit Buenos Aires"
 */
export const slugToTitle = (slug) => {
  if (!slug) return '';

  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};
