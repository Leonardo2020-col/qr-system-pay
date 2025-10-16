// src/services/googleSheets.js

import { GOOGLE_CONFIG, DATA_RANGE, SHEET_NAME } from '../config/googleConfig';

class GoogleSheetsService {
  constructor() {
    this.isInitialized = false;
    this.isSignedIn = false;
    this.accessToken = null;
    this.tokenClient = null;
  }

  // Inicializar la API de Google
  initialize() {
    return new Promise((resolve, reject) => {
      // Verificar credenciales
      if (!GOOGLE_CONFIG.clientId || !GOOGLE_CONFIG.apiKey) {
        const error = 'Faltan credenciales en .env';
        console.error('❌', error);
        reject(new Error(error));
        return;
      }

      console.log('🔄 Inicializando Google API con nueva librería...');

      // Esperar a que gapi esté disponible
      const initGapi = () => {
        if (typeof window.gapi === 'undefined') {
          console.log('⏳ Esperando gapi...');
          setTimeout(initGapi, 100);
          return;
        }

        window.gapi.load('client', async () => {
          try {
            await window.gapi.client.init({
              apiKey: GOOGLE_CONFIG.apiKey,
              discoveryDocs: GOOGLE_CONFIG.discoveryDocs,
            });

            console.log('✅ GAPI Client inicializado');

            // Inicializar el nuevo cliente de autenticación
            this.initTokenClient();
            this.isInitialized = true;
            resolve(true);
          } catch (error) {
            console.error('❌ Error inicializando:', error);
            reject(error);
          }
        });
      };

      initGapi();
    });
  }

  // Inicializar el cliente de tokens (nueva API)
  initTokenClient() {
    if (typeof window.google === 'undefined') {
      console.log('⏳ Esperando Google Identity Services...');
      setTimeout(() => this.initTokenClient(), 100);
      return;
    }

    this.tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CONFIG.clientId,
      scope: GOOGLE_CONFIG.scope,
      callback: (response) => {
        if (response.error) {
          console.error('❌ Error en callback:', response);
          return;
        }
        this.accessToken = response.access_token;
        this.isSignedIn = true;
        console.log('✅ Token obtenido correctamente');
      },
    });

    console.log('✅ Token client inicializado');
  }

  // Iniciar sesión
  signIn() {
    return new Promise((resolve, reject) => {
      if (!this.isInitialized || !this.tokenClient) {
        reject(new Error('Google API no inicializada'));
        return;
      }

      console.log('🔐 Solicitando autenticación...');

      // Modificar el callback temporalmente para esta promesa
      const originalCallback = this.tokenClient.callback;
      
      this.tokenClient.callback = (response) => {
        if (response.error) {
          console.error('❌ Error de autenticación:', response);
          reject(response);
          return;
        }

        this.accessToken = response.access_token;
        this.isSignedIn = true;
        
        // Configurar el token en gapi
        window.gapi.client.setToken({
          access_token: this.accessToken,
        });

        console.log('✅ Autenticación exitosa');
        
        // Restaurar callback original
        this.tokenClient.callback = originalCallback;
        resolve(true);
      };

      // Solicitar el token
      this.tokenClient.requestAccessToken({ prompt: 'select_account' });
    });
  }

  // Cerrar sesión
  signOut() {
    return new Promise((resolve) => {
      if (this.accessToken) {
        window.google.accounts.oauth2.revoke(this.accessToken, () => {
          console.log('✅ Token revocado');
        });
      }

      this.accessToken = null;
      this.isSignedIn = false;
      window.gapi.client.setToken(null);
      
      console.log('✅ Sesión cerrada');
      resolve(true);
    });
  }

  // Verificar estado
  checkSignInStatus() {
    return this.isSignedIn && this.accessToken !== null;
  }

  // Leer personas con fotos
  async leerPersonas() {
  if (!GOOGLE_CONFIG.spreadsheetId) {
    throw new Error('Falta SPREADSHEET_ID en .env');
  }

  if (!this.isSignedIn) {
    throw new Error('No autenticado');
  }

  try {
    const response = await window.gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: GOOGLE_CONFIG.spreadsheetId,
      range: DATA_RANGE,
    });

    const rows = response.result.values || [];
    
    return rows.map((row, index) => ({
      id: index + 1,
      nombre: row[0] || '',
      dni: row[1] || '',
      email: row[2] || '',
      telefono: row[3] || '',
      ultimoPago: row[4] || '',
      monto: parseFloat(row[5]) || 0,
      foto: row[6] || '',  // Nueva columna foto
    }));
  } catch (error) {
    console.error('❌ Error leyendo datos:', error);
    throw error;
  }
}

  // Agregar persona
async agregarPersona(persona) {
  const values = [
    [
      persona.nombre,
      persona.dni,
      persona.email,
      persona.telefono,
      persona.ultimoPago,
      persona.monto,
      persona.foto || '',  // Nueva columna foto
    ],
  ];

  try {
    const response = await window.gapi.client.sheets.spreadsheets.values.append({
      spreadsheetId: GOOGLE_CONFIG.spreadsheetId,
      range: `${SHEET_NAME}!A:G`,  // Cambiado de A:F a A:G
      valueInputOption: 'USER_ENTERED',
      resource: { values },
    });

    console.log('✅ Persona agregada');
    return response.result;
  } catch (error) {
    console.error('❌ Error agregando persona:', error);
    throw error;
  }
}

  // Actualizar persona
  async actualizarPersona(rowIndex, persona) {
  const values = [
    [
      persona.nombre,
      persona.dni,
      persona.email,
      persona.telefono,
      persona.ultimoPago,
      persona.monto,
      persona.foto || '',  // Nueva columna foto
    ],
  ];

  const range = `${SHEET_NAME}!A${rowIndex + 2}:G${rowIndex + 2}`;  // Cambiado de F a G

  try {
    const response = await window.gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId: GOOGLE_CONFIG.spreadsheetId,
      range: range,
      valueInputOption: 'USER_ENTERED',
      resource: { values },
    });

    console.log('✅ Persona actualizada');
    return response.result;
  } catch (error) {
    console.error('❌ Error actualizando persona:', error);
    throw error;
  }
}

  // Eliminar persona
  async eliminarPersona(rowIndex) {
    const request = {
      deleteDimension: {
        range: {
          sheetId: 0,
          dimension: 'ROWS',
          startIndex: rowIndex + 1,
          endIndex: rowIndex + 2,
        },
      },
    };

    try {
      const response = await window.gapi.client.sheets.spreadsheets.batchUpdate({
        spreadsheetId: GOOGLE_CONFIG.spreadsheetId,
        resource: { requests: [request] },
      });

      console.log('✅ Persona eliminada');
      return response.result;
    } catch (error) {
      console.error('❌ Error eliminando persona:', error);
      throw error;
    }
  }
}

const googleSheetsService = new GoogleSheetsService();
export default googleSheetsService;