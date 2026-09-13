import { supabase } from "./supabase";

/**
 * Obtener todos los clientes activos
 */
export async function obtenerClientes() {
  const { data, error } = await supabase
    .from("clientes")
    .select("*")
    .eq("activo", true)
    .order("nombre", { ascending: true });

  if (error) {
    console.error("Error al obtener clientes:", error);
    throw error;
  }

  return data || [];
}

/**
 * Obtener un cliente por ID
 */
export async function obtenerClientePorId(id) {
  const { data, error } = await supabase
    .from("clientes")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error al obtener cliente:", error);
    throw error;
  }

  return data;
}

/**
 * Crear cliente
 */
export async function crearCliente(cliente) {
  const { data, error } = await supabase
    .from("clientes")
    .insert([cliente])
    .select()
    .single();

  if (error) {
    console.error("Error al crear cliente:", error);
    throw error;
  }

  return data;
}

/**
 * Actualizar cliente
 */
export async function actualizarCliente(id, cambios) {
  const { data, error } = await supabase
    .from("clientes")
    .update(cambios)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error al actualizar cliente:", error);
    throw error;
  }

  return data;
}

/**
 * Desactivar cliente
 */
export async function desactivarCliente(id) {
  const { error } = await supabase
    .from("clientes")
    .update({ activo: false })
    .eq("id", id);

  if (error) {
    console.error("Error al desactivar cliente:", error);
    throw error;
  }

  return true;
}