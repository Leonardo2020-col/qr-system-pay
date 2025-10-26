// src/services/supabaseService.js

import { supabase } from '../config/supabaseConfig';

class SupabaseService {
  // ==========================================
  // MÉTODOS DE PERSONAS
  // ==========================================
  
  async obtenerPersonas() {
    try {
      const { data, error } = await supabase
        .from('personas')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log('✅ Personas obtenidas:', data.length);
      return data;
    } catch (error) {
      console.error('❌ Error obteniendo personas:', error);
      throw error;
    }
  }

  async agregarPersona(persona) {
    try {
      let fotoUrl = null;

      if (persona.foto && persona.foto.startsWith('data:image')) {
        fotoUrl = await this.subirFoto(persona.foto, persona.dni);
      }

      const { data, error } = await supabase
        .from('personas')
        .insert([
          {
            nombre: persona.nombre,
            dni: persona.dni,
            email: persona.email || null,
            telefono: persona.telefono,
            empadronado: persona.empadronado || false,
            monto: parseFloat(persona.monto),
            foto_url: fotoUrl,
          },
        ])
        .select();

      if (error) throw error;
      
      // ✅ Crear registros de estatus mensuales para el año actual
      if (data && data[0]) {
        await this.inicializarEstatusMensuales(data[0].id);
      }
      
      console.log('✅ Persona agregada:', data[0]);
      return data[0];
    } catch (error) {
      console.error('❌ Error agregando persona:', error);
      throw error;
    }
  }

  async actualizarPersona(id, persona) {
    try {
      let fotoUrl = persona.foto_url;

      if (persona.foto && persona.foto.startsWith('data:image')) {
        fotoUrl = await this.subirFoto(persona.foto, persona.dni);
      }

      const { data, error } = await supabase
        .from('personas')
        .update({
          nombre: persona.nombre,
          email: persona.email || null,
          telefono: persona.telefono,
          empadronado: persona.empadronado,
          monto: parseFloat(persona.monto),
          foto_url: fotoUrl,
        })
        .eq('id', id)
        .select();

      if (error) throw error;
      console.log('✅ Persona actualizada:', data[0]);
      return data[0];
    } catch (error) {
      console.error('❌ Error actualizando persona:', error);
      throw error;
    }
  }

  async eliminarPersona(id) {
    try {
      const { data: persona } = await supabase
        .from('personas')
        .select('foto_url')
        .eq('id', id)
        .single();

      if (persona?.foto_url) {
        await this.eliminarFoto(persona.foto_url);
      }

      const { error } = await supabase
        .from('personas')
        .delete()
        .eq('id', id);

      if (error) throw error;
      console.log('✅ Persona eliminada');
      return true;
    } catch (error) {
      console.error('❌ Error eliminando persona:', error);
      throw error;
    }
  }

  async buscarPorDNI(dni) {
    try {
      console.log('🔍 Buscando persona con DNI:', dni);
      
      const { data, error } = await supabase
        .from('personas')
        .select('*')
        .eq('dni', dni);

      if (error) {
        console.error('❌ Error en query:', error);
        throw error;
      }
      
      if (data && data.length > 0) {
        console.log('✅ Persona encontrada:', data[0]);
        return data[0];
      }
      
      console.log('⚠️ No se encontró persona con DNI:', dni);
      return null;
    } catch (error) {
      console.error('❌ Error buscando persona:', error.message);
      return null;
    }
  }

  // ==========================================
  // MÉTODOS DE ESTATUS MENSUALES
  // ==========================================

  // Inicializar estatus mensuales para una persona (todos en false/X)
  async inicializarEstatusMensuales(personaId, anio = new Date().getFullYear()) {
    try {
      const estatusData = [];
      for (let mes = 1; mes <= 12; mes++) {
        estatusData.push({
          persona_id: personaId,
          anio: anio,
          mes: mes,
          estatus: false
        });
      }

      const { error } = await supabase
        .from('estatus_mensuales')
        .insert(estatusData);

      if (error && error.code !== '23505') { // Ignorar error de duplicado
        throw error;
      }

      console.log('✅ Estatus mensuales inicializados para persona:', personaId);
      return true;
    } catch (error) {
      console.error('❌ Error inicializando estatus:', error);
      return false;
    }
  }

  // Obtener estatus mensuales de una persona para un año
  async obtenerEstatusMensuales(personaId, anio = new Date().getFullYear()) {
    try {
      const { data, error } = await supabase
        .from('estatus_mensuales')
        .select('*')
        .eq('persona_id', personaId)
        .eq('anio', anio)
        .order('mes', { ascending: true });

      if (error) throw error;

      // Si no hay datos, inicializar
      if (!data || data.length === 0) {
        await this.inicializarEstatusMensuales(personaId, anio);
        return await this.obtenerEstatusMensuales(personaId, anio);
      }

      console.log('✅ Estatus obtenidos:', data.length);
      return data;
    } catch (error) {
      console.error('❌ Error obteniendo estatus:', error);
      throw error;
    }
  }

  // Obtener estatus de todas las personas para un año
  async obtenerTodosEstatusMensuales(anio = new Date().getFullYear()) {
    try {
      const { data, error } = await supabase
        .from('estatus_mensuales')
        .select('*')
        .eq('anio', anio)
        .order('persona_id', { ascending: true })
        .order('mes', { ascending: true });

      if (error) throw error;
      
      console.log('✅ Todos los estatus obtenidos');
      return data;
    } catch (error) {
      console.error('❌ Error obteniendo todos los estatus:', error);
      throw error;
    }
  }

  // Actualizar estatus de un mes específico
  async actualizarEstatusMensual(personaId, anio, mes, nuevoEstatus, observaciones = '') {
    try {
      const { data, error } = await supabase
        .from('estatus_mensuales')
        .update({
          estatus: nuevoEstatus,
          observaciones: observaciones
        })
        .eq('persona_id', personaId)
        .eq('anio', anio)
        .eq('mes', mes)
        .select();

      if (error) throw error;

      console.log('✅ Estatus actualizado:', data[0]);
      return data[0];
    } catch (error) {
      console.error('❌ Error actualizando estatus:', error);
      throw error;
    }
  }

  // Alternar estatus (true ↔ false)
  async toggleEstatusMensual(personaId, anio, mes) {
    try {
      // Primero obtener el estatus actual
      const { data: estatusActual, error: errorGet } = await supabase
        .from('estatus_mensuales')
        .select('estatus')
        .eq('persona_id', personaId)
        .eq('anio', anio)
        .eq('mes', mes)
        .single();

      if (errorGet) throw errorGet;

      // Alternar el estatus
      const nuevoEstatus = !estatusActual.estatus;

      return await this.actualizarEstatusMensual(personaId, anio, mes, nuevoEstatus);
    } catch (error) {
      console.error('❌ Error alternando estatus:', error);
      throw error;
    }
  }

  // Obtener estatus de un mes específico
  async obtenerEstatusMes(personaId, anio, mes) {
    try {
      const { data, error } = await supabase
        .from('estatus_mensuales')
        .select('*')
        .eq('persona_id', personaId)
        .eq('anio', anio)
        .eq('mes', mes)
        .single();

      if (error) {
        // Si no existe, crearlo
        if (error.code === 'PGRST116') {
          const { data: nuevo, error: errorInsert } = await supabase
            .from('estatus_mensuales')
            .insert({
              persona_id: personaId,
              anio: anio,
              mes: mes,
              estatus: false
            })
            .select()
            .single();

          if (errorInsert) throw errorInsert;
          return nuevo;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('❌ Error obteniendo estatus del mes:', error);
      throw error;
    }
  }

  // ==========================================
  // MÉTODOS DE STORAGE (Fotos)
  // ==========================================

  async subirFoto(base64, dni) {
    try {
      const base64Data = base64.split(',')[1];
      const mimeType = base64.split(',')[0].match(/:(.*?);/)[1];
      const blob = this.base64ToBlob(base64Data, mimeType);

      const fileName = `${dni}-${Date.now()}.jpg`;

      const { data, error } = await supabase.storage
        .from('fotos-personas')
        .upload(fileName, blob, {
          contentType: mimeType,
          upsert: true,
        });

      if (error) throw error;

      const { data: publicData } = supabase.storage
        .from('fotos-personas')
        .getPublicUrl(fileName);

      console.log('✅ Foto subida:', publicData.publicUrl);
      return publicData.publicUrl;
    } catch (error) {
      console.error('❌ Error subiendo foto:', error);
      return null;
    }
  }

  async eliminarFoto(fotoUrl) {
    try {
      const fileName = fotoUrl.split('/').pop();
      
      const { error } = await supabase.storage
        .from('fotos-personas')
        .remove([fileName]);

      if (error) throw error;
      console.log('✅ Foto eliminada');
    } catch (error) {
      console.error('❌ Error eliminando foto:', error);
    }
  }

  base64ToBlob(base64, mimeType) {
    const byteCharacters = atob(base64);
    const byteArrays = [];

    for (let i = 0; i < byteCharacters.length; i++) {
      byteArrays.push(byteCharacters.charCodeAt(i));
    }

    return new Blob([new Uint8Array(byteArrays)], { type: mimeType });
  }
}

export default new SupabaseService();