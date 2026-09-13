import { supabase } from "./supabase";

/**
 * Obtener todas las entradas
 */
export async function obtenerEntradas() {
  const { data, error } = await supabase
    .from("entradas")
    .select("*")
    .order("fecha", { ascending: false });

  if (error) {
    console.error("Error al obtener entradas:", error);
    throw error;
  }

  return data || [];
}

/**
 * Obtener una entrada específica con sus detalles
 */
export async function obtenerEntradaPorId(id) {
  const { data, error } = await supabase
    .from("entradas")
    .select(`
      *,
      entrada_detalles (*)
    `)
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error al obtener la entrada:", error);
    throw error;
  }

  return data;
}

/**
 * Obtener detalles de una entrada
 */
export async function obtenerDetallesEntrada(entradaId) {
  const { data, error } = await supabase
    .from("entrada_detalles")
    .select("*")
    .eq("entrada_id", entradaId)
    .order("id", { ascending: true });

  if (error) {
    console.error(
      "Error al obtener detalles de entrada:",
      error
    );

    throw error;
  }

  return data || [];
}

/**
 * Procesar una entrada completa.
 *
 * La operación se realiza mediante una función
 * de PostgreSQL para mantener sincronizados:
 *
 * - entrada
 * - detalles
 * - inventario
 * - movimientos de inventario
 */
export async function procesarEntrada({
  proveedor,
  numeroFactura,
  subtotal,
  descuento,
  total,
  observaciones,
  detalles,
}) {
  const { data, error } = await supabase.rpc(
    "procesar_entrada",
    {
      p_proveedor: proveedor || "",
      p_numero_factura: numeroFactura || "",
      p_subtotal: subtotal,
      p_descuento: descuento,
      p_total: total,
      p_observaciones: observaciones || "",
      p_detalles: detalles,
    }
  );

  if (error) {
    console.error(
      "Error al procesar entrada:",
      error
    );

    throw error;
  }

  return data;
}