// src/services/googleSheetsSync.js

import { GOOGLE_CONFIG, SHEET_NAME, GOOGLE_SHEETS_ENABLED } from '../config/googleConfig';

class GoogleSheetsSync {
  constructor() {
    this.isInitialized = false;
    this.isSignedIn = false;
    this.accessToken = null;
    this.tokenClient = null;
    this.enabled = GOOGLE_SHEETS_ENABLED;
  }

  initialize() {
    return new Promise((resolve) => {
      if (!this.enabled) {
        console.log('ℹ️ Google Sheets deshabilitado (sin credenciales)');
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
            });

            await window.gapi.client.load('sheets', 'v4');
            
            console.log('✅ Google Sheets API cargada');

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

  signIn() {
    return new Promise((resolve, reject) => {
      if (!this.enabled) {
        reject(new Error('Google Sheets no está configurado'));
        return;
      }

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

  isAuthenticated() {
    return this.isSignedIn && this.accessToken !== null;
  }

  async sincronizarAGoogleSheets(personas) {
    if (!this.enabled) {
      throw new Error('Google Sheets no está configurado. Agrega las credenciales en .env');
    }

    console.log('🔄 Iniciando sincronización...');
    
    if (!this.isAuthenticated()) {
      throw new Error('No autenticado con Google Sheets');
    }

    if (!personas || personas.length === 0) {
      console.warn('⚠️ No hay personas para sincronizar');
      return true;
    }

    try {
      console.log(`📊 Sincronizando ${personas.length} personas...`);
      
      await this.verificarYCrearHeaders();

      const valores = personas.map(p => [
        p.nombre || '',
        p.dni || '',
        p.asociacion || 'Sin asociación',
        p.empadronado ? 'SÍ' : 'NO',
        p.foto_url || '',
        p.created_at ? new Date(p.created_at).toLocaleDateString('es-PE') : ''
      ]);

      console.log('📝 Datos preparados:', valores.length, 'filas');

      await window.gapi.client.sheets.spreadsheets.values.clear({
        spreadsheetId: GOOGLE_CONFIG.spreadsheetId,
        range: `${SHEET_NAME}!A2:F1000`,
      });

      console.log('🧹 Datos anteriores limpiados');

      const response = await window.gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: GOOGLE_CONFIG.spreadsheetId,
        range: `${SHEET_NAME}!A2:F${valores.length + 1}`,
        valueInputOption: 'USER_ENTERED',
        resource: { values: valores },
      });

      console.log('✅ Datos escritos:', response.result.updatedRows, 'filas');
      console.log('✅ Sincronización completada exitosamente');
      
      return true;
    } catch (error) {
      console.error('❌ Error en sincronización:', error);
      throw new Error(`Error sincronizando: ${error.message}`);
    }
  }

  async verificarYCrearHeaders() {
    try {
      const response = await window.gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: GOOGLE_CONFIG.spreadsheetId,
        range: `${SHEET_NAME}!A1:F1`,
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
      try {
        await this.crearHeaders();
      } catch (createError) {
        console.error('❌ No se pudieron crear headers:', createError);
      }
    }
  }

  async crearHeaders() {
    const headers = [
      ['Nombre', 'DNI', 'Asociación', 'Empadronado', 'Foto URL', 'Fecha Registro']
    ];

    try {
      await window.gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: GOOGLE_CONFIG.spreadsheetId,
        range: `${SHEET_NAME}!A1:F1`,
        valueInputOption: 'USER_ENTERED',
        resource: { values: headers },
      });

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