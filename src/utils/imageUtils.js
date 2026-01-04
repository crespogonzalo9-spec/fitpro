// Convertir archivo a Base64
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    // Validar tamaño (max 500KB para Firestore)
    if (file.size > 500 * 1024) {
      reject(new Error('La imagen no puede superar 500KB'));
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

// Comprimir imagen con tamaño específico
export const compressImage = (file, maxWidth = 256, maxHeight = 256, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calcular nuevas dimensiones manteniendo aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Convertir a Base64 con compresión
        const base64 = canvas.toDataURL('image/jpeg', quality);
        resolve(base64);
      };
      img.onerror = () => reject(new Error('Error al procesar imagen'));
    };
    reader.onerror = () => reject(new Error('Error al leer archivo'));
  });
};

// Comprimir imagen antes de convertir a Base64
export const compressAndConvertToBase64 = (file, maxWidth = 400, quality = 0.7) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Redimensionar si es muy grande
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Convertir a Base64 con compresión
        const base64 = canvas.toDataURL('image/jpeg', quality);
        resolve(base64);
      };
      img.onerror = () => reject(new Error('Error al procesar imagen'));
    };
    reader.onerror = () => reject(new Error('Error al leer archivo'));
  });
};
