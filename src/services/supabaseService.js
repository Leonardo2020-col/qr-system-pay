// src/services/supabaseService.js

import { supabase } from '../config/supabaseConfig';

const supabaseService = {
  // Obtener todas las personas
  async obtenerPersonas() {
    const { data, error } = await supabase
      .from('personas')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Buscar persona por DNI
  async buscarPorDNI(dni) {
    const { data, error } = await supabase
      .from('personas')
      .select('*')
      .eq('dni', dni)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  },

  // Agregar nueva persona
  async agregarPersona(persona) {
    const { data, error } = await supabase
      .from('personas')
      .insert([
        {
          nombre: persona.nombre,
          dni: persona.dni,
          asociacion: persona.asociacion || 'Sin asociación',
          empadronado: persona.empadronado || false,
          foto_url: persona.foto_url || null,
        },
      ])
      .select();

    if (error) throw error;
    return data[0];
  },

  // Actualizar persona
  async actualizarPersona(id, persona) {
    const { data, error } = await supabase
      .from('personas')
      .update({
        nombre: persona.nombre,
        dni: persona.dni,
        asociacion: persona.asociacion,
        empadronado: persona.empadronado,
        foto_url: persona.foto_url,
      })
      .eq('id', id)
      .select();

    if (error) throw error;
    return data[0];
  },

  // Eliminar persona
  async eliminarPersona(id) {
    const { error: errorMeses } = await supabase
      .from('estatus_mensual')
      .delete()
      .eq('persona_id', id);

    if (errorMeses) throw errorMeses;

    const { error } = await supabase
      .from('personas')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  // Obtener estatus mensual de una persona
  async obtenerEstatusMensual(personaId, anio) {
    const { data, error } = await supabase
      .from('estatus_mensual')
      .select('*')
      .eq('persona_id', personaId)
      .eq('anio', anio)
      .order('mes', { ascending: true });

    if (error) throw error;

    const estatusPorMes = {};
    data.forEach(item => {
      estatusPorMes[item.mes] = item.estatus;
    });

    return estatusPorMes;
  },

  // Obtener estatus de un mes específico
  async obtenerEstatusMes(personaId, anio, mes) {
    const { data, error } = await supabase
      .from('estatus_mensual')
      .select('*')
      .eq('persona_id', personaId)
      .eq('anio', anio)
      .eq('mes', mes)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { estatus: false };
      }
      throw error;
    }

    return data;
  },

  // Actualizar estatus mensual
  async actualizarEstatusMensual(personaId, anio, mes, estatus) {
    const { data: existing, error: checkError } = await supabase
      .from('estatus_mensual')
      .select('id')
      .eq('persona_id', personaId)
      .eq('anio', anio)
      .eq('mes', mes)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    if (existing) {
      const { data, error } = await supabase
        .from('estatus_mensual')
        .update({ estatus })
        .eq('id', existing.id)
        .select();

      if (error) throw error;
      return data[0];
    } else {
      const { data, error } = await supabase
        .from('estatus_mensual')
        .insert([
          {
            persona_id: personaId,
            anio,
            mes,
            estatus,
          },
        ])
        .select();

      if (error) throw error;
      return data[0];
    }
  },

  // Subir foto
  async subirFoto(file, dni) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${dni}_${Date.now()}.${fileExt}`;
    const filePath = `fotos/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('fotos-personas')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('fotos-personas')
      .getPublicUrl(filePath);

    return data.publicUrl;
  },
};

export default supabaseService;