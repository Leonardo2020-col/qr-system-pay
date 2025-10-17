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
    return new Promise((resolve, reject) => {
      if (!GOOGLE_CONFIG.clientId || !GOOGLE_CONFIG.apiKey) {
        console.warn('⚠️ Credenciales de Google Sheets no configuradas');
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
        console.log('✅ Autenticado con Google');
      },
    });
  }

  // Iniciar sesión
  signIn() {
    return new Promise((resolve, reject) => {
      if (!this.isInitialized || !this.tokenClient) {
        reject(new Error('Google Sheets no inicializado'));
        return;
      }

      const originalCallback = this.tokenClient.callback;
      
      this.tokenClient.callback = (response) => {
        if (response.error) {
          reject(response);
          return;
        }

        this.accessToken = response.access_token;
        this.isSignedIn = true;
        
        window.gapi.client.setToken({
          access_token: this.accessToken,
        });

        this.tokenClient.callback = originalCallback;
        resolve(true);
      };

      this.tokenClient.requestAccessToken({ prompt: 'select_account' });
    });
  }

  // Cerrar sesión
  signOut() {
    if (this.accessToken) {
      window.google.accounts.oauth2.revoke(this.accessToken, () => {
        console.log('✅ Token de Google revocado');
      });
    }

    this.accessToken = null;
    this.isSignedIn = false;
    if (window.gapi?.client) {
      window.gapi.client.setToken(null);
    }
  }

  // Verificar estado de autenticación
  isAuthenticated() {
    return this.isSignedIn && this.accessToken !== null;
  }

  // Sincronizar datos de Supabase a Google Sheets
  async sincronizarAGoogleSheets(personas) {
    if (!this.isAuthenticated()) {
      throw new Error('No autenticado con Google');
    }

    if (!GOOGLE_CONFIG.spreadsheetId) {
      throw new Error('SPREADSHEET_ID no configurado');
    }

    try {
      // Limpiar hoja (mantener headers)
      await this.limpiarHoja();

      // Preparar datos
      const valores = personas.map(p => [
        p.nombre,
        p.dni,
        p.email || '',
        p.telefono,
        p.empadronado ? 'SÍ' : 'NO',
        parseFloat(p.monto || 0).toFixed(2),
        p.foto_url || '',
        new Date(p.created_at).toLocaleDateString('es-PE')
      ]);

      // Escribir datos
      if (valores.length > 0) {
        await window.gapi.client.sheets.spreadsheets.values.update({
          spreadsheetId: GOOGLE_CONFIG.spreadsheetId,
          range: `${SHEET_NAME}!A2:H${valores.length + 1}`,
          valueInputOption: 'USER_ENTERED',
          resource: { values: valores },
        });
      }

      console.log('✅ Datos sincronizados a Google Sheets');
      return true;
    } catch (error) {
      console.error('❌ Error sincronizando con Google Sheets:', error);
      throw error;
    }
  }

  // Limpiar hoja (mantener headers)
  async limpiarHoja() {
    try {
      // Primero verificar si existe el header
      const response = await window.gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: GOOGLE_CONFIG.spreadsheetId,
        range: `${SHEET_NAME}!A1:H1`,
      });

      // Si no existe header, crearlo
      if (!response.result.values || response.result.values.length === 0) {
        await this.crearHeaders();
      }

      // Limpiar datos (desde fila 2 en adelante)
      await window.gapi.client.sheets.spreadsheets.values.clear({
        spreadsheetId: GOOGLE_CONFIG.spreadsheetId,
        range: `${SHEET_NAME}!A2:H1000`,
      });

      console.log('✅ Hoja limpiada');
    } catch (error) {
      console.error('❌ Error limpiando hoja:', error);
      throw error;
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

      // Formatear headers (negrita)
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
                  backgroundColor: { red: 0.8, green: 0.8, blue: 0.8 }
                }
              },
              fields: 'userEnteredFormat(textFormat,backgroundColor)'
            }
          }]
        }
      });

      console.log('✅ Headers creados en Google Sheets');
    } catch (error) {
      console.error('❌ Error creando headers:', error);
    }
  }

  // Leer datos de Google Sheets (opcional)
  async leerDatosDeGoogleSheets() {
    if (!this.isAuthenticated()) {
      throw new Error('No autenticado con Google');
    }

    try {
      const response = await window.gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: GOOGLE_CONFIG.spreadsheetId,
        range: `${SHEET_NAME}!A2:H`,
      });

      const rows = response.result.values || [];
      
      return rows.map((row, index) => ({
        id: index + 1,
        nombre: row[0] || '',
        dni: row[1] || '',
        email: row[2] || '',
        telefono: row[3] || '',
        empadronado: row[4] === 'SÍ',
        monto: parseFloat(row[5]) || 0,
        foto_url: row[6] || '',
        created_at: row[7] || '',
      }));
    } catch (error) {
      console.error('❌ Error leyendo Google Sheets:', error);
      throw error;
    }
  }
}

const googleSheetsSync = new GoogleSheetsSync();
export default googleSheetsSync;