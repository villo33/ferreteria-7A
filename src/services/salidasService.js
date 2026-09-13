import { supabase } from "./supabase";

/**
 * Obtener todas las salidas
 */
export async function obtenerSalidas() {
  const { data, error } = await supabase
    .from("salidas")
    .select("*")
    .order("fecha", { ascending: false });

  if (error) {
    console.error("Error al obtener salidas:", error);
    throw error;
  }

  return data || [];
}

/**
 * Obtener una salida específica con sus detalles
 */
export async function obtenerSalidaPorId(id) {
  const { data, error } = await supabase
    .from("salidas")
    .select(`
      *,
      salida_detalles (*)
    `)
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error al obtener la salida:", error);
    throw error;
  }

  return data;
}

/**
 * Obtener los detalles de una salida
 */
export async function obtenerDetallesSalida(salidaId) {
  const { data, error } = await supabase
    .from("salida_detalles")
    .select("*")
    .eq("salida_id", salidaId)
    .order("id", { ascending: true });

  if (error) {
    console.error(
      "Error al obtener detalles de salida:",
      error
    );
    throw error;
  }

  return data || [];
}

/**
 * Procesar una salida completa.
 *
 * La operación se realiza mediante PostgreSQL
 * para mantener sincronizados:
 *
 * - salida
 * - detalles
 * - inventario
 * - movimientos de inventario
 */
export async function procesarSalida({
  tipo,
  responsable,
  observaciones,
  detalles,
}) {
  const { data, error } = await supabase.rpc(
    "procesar_salida",
    {
      p_tipo: tipo,
      p_responsable: responsable || "",
      p_observaciones: observaciones || "",
      p_detalles: detalles,
    }
  );

  if (error) {
    console.error(
      "Error al procesar salida:",
      error
    );

    throw error;
  }

  return data;
}