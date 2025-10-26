// src/utils/googleDiagnostic.js

export const diagnosticarGoogleSheets = () => {
  console.log('🔍 === DIAGNÓSTICO DE GOOGLE SHEETS ===');
  
  // 1. Verificar variables de entorno
  console.log('\n📋 Variables de entorno:');
  console.log('CLIENT_ID:', process.env.REACT_APP_GOOGLE_CLIENT_ID ? '✅ Configurado' : '❌ Falta');
  console.log('API_KEY:', process.env.REACT_APP_GOOGLE_API_KEY ? '✅ Configurado' : '❌ Falta');
  console.log('SPREADSHEET_ID:', process.env.REACT_APP_GOOGLE_SPREADSHEET_ID ? '✅ Configurado' : '❌ Falta');
  
  if (process.env.REACT_APP_GOOGLE_CLIENT_ID) {
    console.log('CLIENT_ID value:', process.env.REACT_APP_GOOGLE_CLIENT_ID.substring(0, 20) + '...');
  }
  if (process.env.REACT_APP_GOOGLE_API_KEY) {
    console.log('API_KEY value:', process.env.REACT_APP_GOOGLE_API_KEY.substring(0, 10) + '...');
  }
  if (process.env.REACT_APP_GOOGLE_SPREADSHEET_ID) {
    console.log('SPREADSHEET_ID value:', process.env.REACT_APP_GOOGLE_SPREADSHEET_ID);
  }
  
  // 2. Verificar scripts de Google
  console.log('\n🌐 Scripts de Google:');
  console.log('window.gapi:', typeof window.gapi !== 'undefined' ? '✅ Cargado' : '❌ No cargado');
  console.log('window.google:', typeof window.google !== 'undefined' ? '✅ Cargado' : '❌ No cargado');
  
  // 3. Verificar GOOGLE_SHEETS_ENABLED
  const enabled = !!(
    process.env.REACT_APP_GOOGLE_CLIENT_ID && 
    process.env.REACT_APP_GOOGLE_API_KEY && 
    process.env.REACT_APP_GOOGLE_SPREADSHEET_ID
  );
  console.log('\n⚙️ Google Sheets Habilitado:', enabled ? '✅ SÍ' : '❌ NO');
  
  console.log('\n=== FIN DEL DIAGNÓSTICO ===\n');
  
  return {
    hasClientId: !!process.env.REACT_APP_GOOGLE_CLIENT_ID,
    hasApiKey: !!process.env.REACT_APP_GOOGLE_API_KEY,
    hasSpreadsheetId: !!process.env.REACT_APP_GOOGLE_SPREADSHEET_ID,
    hasGapi: typeof window.gapi !== 'undefined',
    hasGoogleIdentity: typeof window.google !== 'undefined',
    enabled
  };
};