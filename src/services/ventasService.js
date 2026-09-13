// src/services/ventasService.js

import { supabase } from "./supabase";

/**
 * Obtener todas las ventas
 */
export async function obtenerVentas() {
  const { data, error } = await supabase
    .from("ventas")
    .select("*")
    .order("fecha", { ascending: false });

  if (error) {
    console.error("Error al obtener ventas:", error);
    throw error;
  }

  return data || [];
}

/**
 * Obtener una venta específica con sus detalles
 */
export async function obtenerVentaPorId(id) {
  const { data, error } = await supabase
    .from("ventas")
    .select(`
      *,
      venta_detalles (*)
    `)
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error al obtener la venta:", error);
    throw error;
  }

  return data;
}

/**
 * Obtener detalles de una venta
 */
export async function obtenerDetallesVenta(ventaId) {
  const { data, error } = await supabase
    .from("venta_detalles")
    .select("*")
    .eq("venta_id", ventaId)
    .order("id", { ascending: true });

  if (error) {
    console.error(
      "Error al obtener detalles de venta:",
      error
    );

    throw error;
  }

  return data || [];
}

/**
 * Procesar una venta completa.
 */
export async function procesarVenta({
  cliente,
  metodoPago,
  subtotal,
  descuento,
  total,
  observaciones,
  detalles,
}) {
  const { data, error } = await supabase.rpc(
    "procesar_venta",
    {
      p_cliente: cliente || "",
      p_metodo_pago: metodoPago,
      p_subtotal: subtotal,
      p_descuento: descuento,
      p_total: total,
      p_observaciones: observaciones || "",
      p_detalles: detalles,
    }
  );

  if (error) {
    console.error(
      "Error al procesar venta:",
      error
    );

    throw error;
  }

  return data;
}

/**
 * Anular una venta y restaurar automáticamente
 * las cantidades al inventario.
 */
export async function anularVenta(ventaId) {
  const { data, error } = await supabase.rpc(
    "anular_venta",
    {
      p_venta_id: ventaId,
    }
  );

  if (error) {
    console.error(
      "Error al anular venta:",
      error
    );

    throw error;
  }

  return data;
}