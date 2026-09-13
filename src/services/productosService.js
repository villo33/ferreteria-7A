import { supabase } from "./supabase";

/**
 * Obtener todos los productos activos
 */
export async function obtenerProductos() {
  const { data, error } = await supabase
    .from("productos")
    .select("*")
    .eq("activo", true)
    .order("nombre", { ascending: true });

  if (error) {
    console.error("Error al obtener productos:", error);
    throw error;
  }

  return data || [];
}

/**
 * Crear un nuevo producto
 */
export async function crearProducto(producto) {
  const { data, error } = await supabase
    .from("productos")
    .insert([producto])
    .select()
    .single();

  if (error) {
    console.error("Error al crear producto:", error);
    throw error;
  }

  return data;
}

/**
 * Actualizar un producto
 */
export async function actualizarProducto(id, cambios) {
  const { data, error } = await supabase
    .from("productos")
    .update(cambios)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error al actualizar producto:", error);
    throw error;
  }

  return data;
}

/**
 * Desactivar un producto
 */
export async function desactivarProducto(id) {
  const { error } = await supabase
    .from("productos")
    .update({ activo: false })
    .eq("id", id);

  if (error) {
    console.error("Error al desactivar producto:", error);
    throw error;
  }

  return true;
}