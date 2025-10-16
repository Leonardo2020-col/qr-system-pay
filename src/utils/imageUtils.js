// src/utils/imageUtils.js

export const comprimirImagen = (file, maxWidth = 200, quality = 0.7) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        
        // Calcular nuevas dimensiones manteniendo aspect ratio
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convertir a Base64 con compresión
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        
        console.log('📊 Tamaño original:', file.size, 'bytes');
        console.log('📊 Tamaño comprimido:', compressedBase64.length, 'caracteres');
        
        resolve(compressedBase64);
      };
      
      img.onerror = reject;
      img.src = e.target.result;
    };
    
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const validarTamañoImagen = (base64String, maxSizeKB = 30) => {
  // Calcular tamaño aproximado en KB
  const sizeInBytes = (base64String.length * 3) / 4;
  const sizeInKB = sizeInBytes / 1024;
  
  return sizeInKB <= maxSizeKB;
};