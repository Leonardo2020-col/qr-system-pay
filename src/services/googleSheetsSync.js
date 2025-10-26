// src/services/googleSheetsSync.js

import { GOOGLE_CONFIG, SHEET_NAME } from '../config/googleConfig';

class GoogleSheetsSync {
  constructor() {
    this.isInitialized = false;
    this.isSignedIn = false;
    this.accessToken = null;
    this.tokenClient = null;
  }

  // Inicializar Google API
  initialize() {
    return new Promise((resolve) => {
      // ✅ Validar credenciales
      if (!GOOGLE_CONFIG.clientId || !GOOGLE_CONFIG.apiKey || !GOOGLE_CONFIG.spreadsheetId) {
        console.warn('⚠️ Credenciales de Google Sheets no configuradas completamente');
        console.warn('Verifica que tengas en .env:');
        console.warn('- REACT_APP_GOOGLE_CLIENT_ID');
        console.warn('- REACT_APP_GOOGLE_API_KEY');
        console.warn('- REACT_APP_GOOGLE_SPREADSHEET_ID');
        resolve(false);
        return;
      }

      console.log('🔄 Inicializando Google Sheets Sync...');

      const initGapi = () => {
        if (typeof window.gapi === 'undefined') {
          setTimeout(initGapi, 100);
          return;
        }

        window.gapi.load('client', async () => {
          try {
            await window.gapi.client.init({
              apiKey: GOOGLE_CONFIG.apiKey,
              discoveryDocs: GOOGLE_CONFIG.discoveryDocs,
            });

            this.initTokenClient();
            this.isInitialized = true;
            console.log('✅ Google Sheets Sync inicializado');
            resolve(true);
          } catch (error) {
            console.error('❌ Error inicializando Google Sheets:', error);
            resolve(false);
          }
        });
      };

      initGapi();
    });
  }

  // Inicializar cliente de tokens
  initTokenClient() {
    if (typeof window.google === 'undefined') {
      setTimeout(() => this.initTokenClient(), 100);
      return;
    }

    try {
      this.tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CONFIG.clientId,
        scope: GOOGLE_CONFIG.scope,
        callback: (response) => {
          if (response.error) {
            console.error('❌ Error en autenticación:', response);
            return;
          }
          this.accessToken = response.access_token;
          this.isSignedIn = true;
          
          // ✅ Configurar token en gapi inmediatamente
          if (window.gapi?.client) {
            window.gapi.client.setToken({
              access_token: this.accessToken,
            });
          }
          
          console.log('✅ Autenticado con Google');
        },
      });
      
      console.log('✅ Token client configurado');
    } catch (error) {
      console.error('❌ Error configurando token client:', error);
    }
  }

  // Iniciar sesión
  signIn() {
    return new Promise((resolve, reject) => {
      if (!this.isInitialized) {
        reject(new Error('Google Sheets no inicializado'));
        return;
      }

      if (!this.tokenClient) {
        reject(new Error('Token client no disponible'));
        return;
      }

      console.log('🔐 Solicitando autenticación...');

      const originalCallback = this.tokenClient.callback;
      
      this.tokenClient.callback = (response) => {
        if (response.error) {
          console.error('❌ Error de autenticación:', response);
          this.tokenClient.callback = originalCallback;
          reject(new Error(response.error));
          return;
        }

        this.accessToken = response.access_token;
        this.isSignedIn = true;
        
        // ✅ Configurar token
        if (window.gapi?.client) {
          window.gapi.client.setToken({
            access_token: this.accessToken,
          });
          console.log('✅ Token configurado en gapi.client');
        }

        console.log('✅ Autenticación exitosa');
        this.tokenClient.callback = originalCallback;
        resolve(true);
      };

      // ✅ Solicitar token
      try {
        this.tokenClient.requestAccessToken({ 
          prompt: 'select_account' 
        });
      } catch (error) {
        console.error('❌ Error solicitando token:', error);
        this.tokenClient.callback = originalCallback;
        reject(error);
      }
    });
  }

  // Cerrar sesión
  signOut() {
    if (this.accessToken && window.google?.accounts?.oauth2) {
      try {
        window.google.accounts.oauth2.revoke(this.accessToken, () => {
          console.log('✅ Token de Google revocado');
        });
      } catch (error) {
        console.error('Error revocando token:', error);
      }
    }

    this.accessToken = null;
    this.isSignedIn = false;
    
    if (window.gapi?.client) {
      window.gapi.client.setToken(null);
    }
    
    console.log('✅ Sesión cerrada');
  }

  // Verificar estado de autenticación
  isAuthenticated() {
    const authenticated = this.isSignedIn && this.accessToken !== null;
    console.log('🔍 Estado autenticación:', authenticated);
    return authenticated;
  }

  // Sincronizar datos de Supabase a Google Sheets
  async sincronizarAGoogleSheets(personas) {
    console.log('🔄 Iniciando sincronización...');
    
    // ✅ Validaciones
    if (!this.isAuthenticated()) {
      const error = 'No autenticado con Google Sheets';
      console.error('❌', error);
      throw new Error(error);
    }

    if (!GOOGLE_CONFIG.spreadsheetId) {
      const error = 'SPREADSHEET_ID no configurado en .env';
      console.error('❌', error);
      throw new Error(error);
    }

    if (!personas || personas.length === 0) {
      console.warn('⚠️ No hay personas para sincronizar');
      return true;
    }

    try {
      console.log(`📊 Sincronizando ${personas.length} personas...`);
      
      // 1. Crear/verificar headers
      await this.verificarYCrearHeaders();

      // 2. Preparar datos
      const valores = personas.map(p => [
        p.nombre || '',
        p.dni || '',
        p.email || '',
        p.telefono || '',
        p.empadronado ? 'SÍ' : 'NO',
        parseFloat(p.monto || 0).toFixed(2),
        p.foto_url || '',
        p.created_at ? new Date(p.created_at).toLocaleDateString('es-PE') : ''
      ]);

      console.log('📝 Datos preparados:', valores.length, 'filas');

      // 3. Limpiar datos anteriores (mantener headers)
      await window.gapi.client.sheets.spreadsheets.values.clear({
        spreadsheetId: GOOGLE_CONFIG.spreadsheetId,
        range: `${SHEET_NAME}!A2:H1000`,
      });

      console.log('🧹 Datos anteriores limpiados');

      // 4. Escribir nuevos datos
      const response = await window.gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: GOOGLE_CONFIG.spreadsheetId,
        range: `${SHEET_NAME}!A2:H${valores.length + 1}`,
        valueInputOption: 'USER_ENTERED',
        resource: { values: valores },
      });

      console.log('✅ Datos escritos:', response.result.updatedRows, 'filas');
      console.log('✅ Sincronización completada exitosamente');
      
      return true;
    } catch (error) {
      console.error('❌ Error en sincronización:', error);
      console.error('Detalles del error:', {
        message: error.message,
        result: error.result,
        body: error.body
      });
      throw new Error(`Error sincronizando: ${error.message}`);
    }
  }

  // Verificar y crear headers si no existen
  async verificarYCrearHeaders() {
    try {
      // Verificar si existen headers
      const response = await window.gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: GOOGLE_CONFIG.spreadsheetId,
        range: `${SHEET_NAME}!A1:H1`,
      });

      const hasHeaders = response.result.values && response.result.values.length > 0;

      if (!hasHeaders) {
        console.log('📋 Creando headers...');
        await this.crearHeaders();
      } else {
        console.log('✅ Headers ya existen');
      }
    } catch (error) {
      console.error('❌ Error verificando headers:', error);
      // Intentar crear headers de todas formas
      try {
        await this.crearHeaders();
      } catch (createError) {
        console.error('❌ No se pudieron crear headers:', createError);
      }
    }
  }

  // Crear headers en Google Sheets
  async crearHeaders() {
    const headers = [
      ['Nombre', 'DNI', 'Email', 'Teléfono', 'Empadronado', 'Monto', 'Foto URL', 'Fecha Registro']
    ];

    try {
      await window.gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: GOOGLE_CONFIG.spreadsheetId,
        range: `${SHEET_NAME}!A1:H1`,
        valueInputOption: 'USER_ENTERED',
        resource: { values: headers },
      });

      // Formatear headers (negrita y fondo gris)
      await window.gapi.client.sheets.spreadsheets.batchUpdate({
        spreadsheetId: GOOGLE_CONFIG.spreadsheetId,
        resource: {
          requests: [{
            repeatCell: {
              range: {
                sheetId: 0,
                startRowIndex: 0,
                endRowIndex: 1,
              },
              cell: {
                userEnteredFormat: {
                  textFormat: { bold: true },
                  backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 }
                }
              },
              fields: 'userEnteredFormat(textFormat,backgroundColor)'
            }
          }]
        }
      });

      console.log('✅ Headers creados y formateados');
    } catch (error) {
      console.error('❌ Error creando headers:', error);
      throw error;
    }
  }
}

const googleSheetsSync = new GoogleSheetsSync();
export default googleSheetsSync;