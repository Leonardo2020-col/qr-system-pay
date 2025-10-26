// src/services/qrService.js

export const generarQRCode = async (persona, empadronado) => {
  // Crear datos del QR SIN la foto
  const datosQR = {
    id: persona.id,
    nombre: persona.nombre,
    dni: persona.dni,
    email: persona.email || '',
    telefono: persona.telefono,
    empadronado: empadronado,
    monto: persona.monto,
    estado: empadronado ? 'EMPADRONADO' : 'NO EMPADRONADO',
    fechaGeneracion: new Date().toISOString(),
  };

  const textoQR = JSON.stringify(datosQR);
  console.log('📊 Generando QR con', textoQR.length, 'caracteres');

  try {
    // Usar QR Server API (gratis, rápido)
    const encodedData = encodeURIComponent(textoQR);
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodedData}&color=4F46E5&bgcolor=FFFFFF`;
    
    console.log('✅ QR generado correctamente');
    return qrUrl;
  } catch (error) {
    console.error('❌ Error generando QR:', error);
    throw error;
  }
};

export const descargarQR = async (qrUrl, nombreArchivo) => {
  try {
    // Crear un canvas para convertir la imagen a blob
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = nombreArchivo;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 'image/png');
    };
    
    img.onerror = () => {
      // Fallback: abrir en nueva pestaña
      window.open(qrUrl, '_blank');
    };
    
    img.src = qrUrl;
  } catch (error) {
    console.error('Error descargando QR:', error);
    // Fallback: abrir en nueva pestaña
    window.open(qrUrl, '_blank');
  }
};

export const leerDatosQR = (textoQR) => {
  try {
    return JSON.parse(textoQR);
  } catch (error) {
    console.error('Error al leer QR:', error);
    return null;
  }
};