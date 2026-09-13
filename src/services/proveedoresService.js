import { supabase } from "./supabase";

/**
 * Obtener todos los proveedores activos
 */
export async function obtenerProveedores() {
  const { data, error } = await supabase
    .from("proveedores")
    .select("*")
    .eq("activo", true)
    .order("nombre", { ascending: true });

  if (error) {
    console.error("Error al obtener proveedores:", error);
    throw error;
  }

  return data || [];
}

/**
 * Obtener un proveedor por ID
 */
export async function obtenerProveedorPorId(id) {
  const { data, error } = await supabase
    .from("proveedores")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error al obtener proveedor:", error);
    throw error;
  }

  return data;
}

/**
 * Crear proveedor
 */
export async function crearProveedor(proveedor) {
  const { data, error } = await supabase
    .from("proveedores")
    .insert([proveedor])
    .select()
    .single();

  if (error) {
    console.error("Error al crear proveedor:", error);
    throw error;
  }

  return data;
}

/**
 * Actualizar proveedor
 */
export async function actualizarProveedor(id, cambios) {
  const { data, error } = await supabase
    .from("proveedores")
    .update(cambios)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error al actualizar proveedor:", error);
    throw error;
  }

  return data;
}

/**
 * Desactivar proveedor
 */
export async function desactivarProveedor(id) {
  const { error } = await supabase
    .from("proveedores")
    .update({ activo: false })
    .eq("id", id);

  if (error) {
    console.error("Error al desactivar proveedor:", error);
    throw error;
  }

  return true;
}