// src/services/supabaseService.js

import { supabase } from '../config/supabaseConfig';

class SupabaseService {
  // Obtener todas las personas
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

  // Agregar persona
  async agregarPersona(persona) {
    try {
      let fotoUrl = null;

      // Si hay foto, subirla primero
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
      console.log('✅ Persona agregada:', data[0]);
      return data[0];
    } catch (error) {
      console.error('❌ Error agregando persona:', error);
      throw error;
    }
  }

  // Actualizar persona
  async actualizarPersona(id, persona) {
    try {
      let fotoUrl = persona.foto_url;

      // Si hay nueva foto, subirla
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

  // Eliminar persona
  async eliminarPersona(id) {
    try {
      // Opcional: eliminar foto asociada
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

  // ✅ Buscar persona por DNI (CORREGIDO)
  async buscarPorDNI(dni) {
    try {
      console.log('🔍 Buscando persona con DNI:', dni);
      
      const { data, error } = await supabase
        .from('personas')
        .select('*')
        .eq('dni', dni);
        // ❌ NO usar .single() porque da error si no hay resultados

      if (error) {
        console.error('❌ Error en query:', error);
        throw error;
      }
      
      // ✅ Verificar si hay resultados
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

  // Subir foto a Supabase Storage
  async subirFoto(base64, dni) {
    try {
      // Convertir Base64 a Blob
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

      // Obtener URL pública
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

  // Eliminar foto de Supabase Storage
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

  // Convertir Base64 a Blob
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