import jsPDF from "jspdf";

function formatoMoneda(valor) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(Number(valor) || 0);
}

function formatoCantidad(valor) {
  const numero = Number(valor);

  if (Number.isNaN(numero)) {
    return "0";
  }

  return numero.toLocaleString("es-CO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function formatoFecha(fecha) {
  if (!fecha) {
    return "";
  }

  const fechaObj = new Date(fecha);

  if (Number.isNaN(fechaObj.getTime())) {
    return "";
  }

  return fechaObj.toLocaleString("es-CO", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function textoMetodoPago(metodo) {
  const metodos = {
    efectivo: "Efectivo",
    transferencia: "Transferencia",
    tarjeta: "Tarjeta",
    credito: "Crédito",
  };

  return (
    metodos[metodo] ||
    metodo ||
    "No especificado"
  );
}

function textoUnidad(unidad) {
  if (!unidad) {
    return "unidad";
  }

  const unidades = {
    unidad: "unidad",
    unidades: "unidades",
    metro: "metro",
    metros: "metros",
    kilo: "kilo",
    kilos: "kilos",
    caja: "caja",
    cajas: "cajas",
    galon: "galón",
    galones: "galones",
    litro: "litro",
    litros: "litros",
    libra: "libra",
    libras: "libras",
    bulto: "bulto",
    bultos: "bultos",
    rollo: "rollo",
    rollos: "rollos",
    paquete: "paquete",
    paquetes: "paquetes",
  };

  return (
    unidades[String(unidad).toLowerCase()] ||
    unidad
  );
}

export function generarComprobanteVentaPDF({
  ventaId,
  fecha,
  cliente,
  metodoPago,
  detalles = [],
  subtotal = 0,
  descuento = 0,
  total = 0,
  observaciones = "",
}) {
  const doc = new jsPDF({
    unit: "mm",
    format: "a4",
  });

  const margenIzquierdo = 18;
  const anchoPagina = 210;
  const anchoUtil =
    anchoPagina - margenIzquierdo * 2;

  let y = 18;

  // ==========================================
  // ENCABEZADO
  // ==========================================

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);

  doc.text(
    "FERRETERÍA 7A",
    margenIzquierdo,
    y
  );

  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  doc.text(
    "Comprobante de venta",
    margenIzquierdo,
    y
  );

  doc.setDrawColor(180, 180, 180);

  doc.line(
    margenIzquierdo,
    y + 5,
    anchoPagina - margenIzquierdo,
    y + 5
  );

  y += 15;

  // ==========================================
  // INFORMACIÓN DE LA VENTA
  // ==========================================

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);

  doc.text(
    `Venta #${ventaId}`,
    margenIzquierdo,
    y
  );

  y += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  doc.text(
    `Fecha: ${formatoFecha(fecha)}`,
    margenIzquierdo,
    y
  );

  y += 6;

  doc.text(
    `Cliente: ${
      cliente?.trim() || "Cliente general"
    }`,
    margenIzquierdo,
    y
  );

  y += 6;

  doc.text(
    `Método de pago: ${textoMetodoPago(
      metodoPago
    )}`,
    margenIzquierdo,
    y
  );

  y += 12;

  // ==========================================
  // TABLA DE PRODUCTOS
  // ==========================================

  const columnas = {
    producto: margenIzquierdo,
    cantidad: 103,
    unidad: 122,
    precio: 143,
    total: 174,
  };

  const dibujarEncabezadoTabla = () => {
    doc.setFillColor(235, 238, 243);

    doc.rect(
      margenIzquierdo,
      y - 5,
      anchoUtil,
      9,
      "F"
    );

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);

    doc.text(
      "Producto",
      columnas.producto,
      y
    );

    doc.text(
      "Cant.",
      columnas.cantidad,
      y
    );

    doc.text(
      "Unidad",
      columnas.unidad,
      y
    );

    doc.text(
      "Precio",
      columnas.precio,
      y
    );

    doc.text(
      "Total",
      columnas.total,
      y
    );

    y += 9;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
  };

  dibujarEncabezadoTabla();

  // ==========================================
  // DETALLES DE TODOS LOS PRODUCTOS
  // ==========================================

  if (
    !Array.isArray(detalles) ||
    detalles.length === 0
  ) {
    doc.setFontSize(9);

    doc.text(
      "No hay productos registrados en esta venta.",
      margenIzquierdo,
      y
    );

    y += 10;
  } else {
    for (const detalle of detalles) {
      const nombre =
        detalle?.nombre_producto ||
        detalle?.nombre ||
        "Producto";

      const cantidad = Number(
        detalle?.cantidad || 0
      );

      const precio = Number(
        detalle?.precio_unitario || 0
      );

      const subtotalProducto =
        Number(detalle?.subtotal) ||
        precio * cantidad;

      const unidad = textoUnidad(
        detalle?.unidad_producto ||
          detalle?.unidad ||
          "unidad"
      );

      const codigo =
        detalle?.codigo_producto ||
        detalle?.codigo ||
        "";

      // ========================================
      // INFORMACIÓN DEL PRODUCTO
      // ========================================

      let textoProducto = nombre;

      if (codigo.trim()) {
        textoProducto += `\nCódigo: ${codigo}`;
      }

      const lineasProducto =
        doc.splitTextToSize(
          textoProducto,
          78
        );

      const altoFila = Math.max(
        8,
        lineasProducto.length * 4.5
      );

      // ========================================
      // SALTO DE PÁGINA
      // ========================================

      if (y + altoFila > 270) {
        doc.addPage();

        y = 20;

        dibujarEncabezadoTabla();
      }

      // ========================================
      // PRODUCTO
      // ========================================

      doc.text(
        lineasProducto,
        columnas.producto,
        y
      );

      // ========================================
      // CANTIDAD
      // ========================================

      doc.text(
        formatoCantidad(cantidad),
        columnas.cantidad,
        y
      );

      // ========================================
      // UNIDAD
      // ========================================

      doc.text(
        unidad,
        columnas.unidad,
        y
      );

      // ========================================
      // PRECIO UNITARIO
      // ========================================

      doc.text(
        formatoMoneda(precio),
        columnas.precio,
        y
      );

      // ========================================
      // TOTAL PRODUCTO
      // ========================================

      doc.text(
        formatoMoneda(subtotalProducto),
        columnas.total,
        y
      );

      y += altoFila;

      // ========================================
      // LÍNEA SEPARADORA
      // ========================================

      doc.setDrawColor(
        225,
        225,
        225
      );

      doc.line(
        margenIzquierdo,
        y - 2,
        anchoPagina - margenIzquierdo,
        y - 2
      );
    }
  }

  y += 8;

  // ==========================================
  // RESUMEN
  // ==========================================

  const resumenX = 125;
  const valorX = 172;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  doc.text(
    "Subtotal:",
    resumenX,
    y
  );

  doc.text(
    formatoMoneda(subtotal),
    valorX,
    y,
    {
      align: "right",
    }
  );

  y += 7;

  doc.text(
    "Descuento:",
    resumenX,
    y
  );

  doc.text(
    `- ${formatoMoneda(descuento)}`,
    valorX,
    y,
    {
      align: "right",
    }
  );

  y += 9;

  doc.setDrawColor(
    120,
    120,
    120
  );

  doc.line(
    resumenX,
    y - 4,
    anchoPagina - margenIzquierdo,
    y - 4
  );

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(13);

  doc.text(
    "TOTAL:",
    resumenX,
    y + 4
  );

  doc.text(
    formatoMoneda(total),
    valorX,
    y + 4,
    {
      align: "right",
    }
  );

  y += 15;

  // ==========================================
  // OBSERVACIONES
  // ==========================================

  if (observaciones?.trim()) {
    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(9);

    doc.text(
      "Observaciones:",
      margenIzquierdo,
      y
    );

    y += 5;

    doc.setFont(
      "helvetica",
      "normal"
    );

    const observacionesLineas =
      doc.splitTextToSize(
        observaciones.trim(),
        anchoUtil
      );

    doc.text(
      observacionesLineas,
      margenIzquierdo,
      y
    );

    y +=
      observacionesLineas.length *
        4.5 +
      8;
  }

  // ==========================================
  // PIE DEL COMPROBANTE
  // ==========================================

  const altoPagina = 297;

  doc.setDrawColor(
    200,
    200,
    200
  );

  doc.line(
    margenIzquierdo,
    altoPagina - 25,
    anchoPagina - margenIzquierdo,
    altoPagina - 25
  );

  doc.setFont(
    "helvetica",
    "normal"
  );

  doc.setFontSize(8);

  doc.text(
    "Ferretería 7A",
    margenIzquierdo,
    altoPagina - 18
  );

  doc.text(
    "Comprobante generado por el sistema de gestión",
    anchoPagina / 2,
    altoPagina - 18,
    {
      align: "center",
    }
  );

  doc.text(
    `Venta #${ventaId}`,
    anchoPagina - margenIzquierdo,
    altoPagina - 18,
    {
      align: "right",
    }
  );

  // ==========================================
  // GENERAR PDF
  // ==========================================

  doc.save(
    `Comprobante-Venta-${ventaId}.pdf`
  );
}

export function generarReportePDF({
  fechaInicio,
  fechaFin,
  ventas = [],
  entradas = [],
  salidas = [],
  productos = [],
  totalVentas = 0,
  totalEntradas = 0,
}) {
  const doc = new jsPDF({
    unit: "mm",
    format: "a4",
  });

  const margen = 15;
  const anchoPagina = 210;
  const anchoUtil = anchoPagina - margen * 2;

  let y = 18;

  const moneda = (valor) => {
    return formatoMoneda(valor);
  };

  const fechaCorta = (valor) => {
    if (!valor) return "-";

    const fecha = new Date(valor);

    if (Number.isNaN(fecha.getTime())) {
      return "-";
    }

    return fecha.toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const agregarTituloSeccion = (titulo, subtitulo = "") => {
    if (y > 260) {
      doc.addPage();
      y = 18;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);

    doc.text(titulo, margen, y);

    y += 5;

    if (subtitulo) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);

      doc.text(subtitulo, margen, y);

      y += 7;
    } else {
      y += 7;
    }
  };

  const valorInventario = productos.reduce(
    (total, producto) =>
      total +
      Number(producto.stock || 0) *
        Number(producto.precio_compra || 0),
    0
  );

  const productosStockBajo = productos.filter(
    (producto) =>
      Number(producto.stock || 0) <=
      Number(producto.stock_minimo || 0)
  );

  const totalOperaciones =
    ventas.length +
    entradas.length +
    salidas.length;

  // ==========================================
  // ENCABEZADO
  // ==========================================

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);

  doc.text(
    "FERRETERÍA 7A",
    margen,
    y
  );

  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);

  doc.text(
    "Reporte general de gestión",
    margen,
    y
  );

  y += 7;

  doc.setFontSize(9);

  doc.text(
    `Período: ${fechaCorta(fechaInicio)} - ${fechaCorta(fechaFin)}`,
    margen,
    y
  );

  y += 5;

  doc.text(
    `Generado: ${fechaCorta(new Date())}`,
    margen,
    y
  );

  y += 9;

  doc.setDrawColor(180, 180, 180);

  doc.line(
    margen,
    y,
    anchoPagina - margen,
    y
  );

  y += 12;

  // ==========================================
  // RESUMEN
  // ==========================================

  agregarTituloSeccion(
    "Resumen del período"
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  doc.text(
    `Ventas: ${moneda(totalVentas)}`,
    margen,
    y
  );

  doc.text(
    `Entradas: ${moneda(totalEntradas)}`,
    105,
    y
  );

  y += 7;

  doc.text(
    `Ventas realizadas: ${ventas.length}`,
    margen,
    y
  );

  doc.text(
    `Entradas registradas: ${entradas.length}`,
    105,
    y
  );

  y += 7;

  doc.text(
    `Salidas registradas: ${salidas.length}`,
    margen,
    y
  );

  doc.text(
    `Total operaciones: ${totalOperaciones}`,
    105,
    y
  );

  y += 7;

  doc.text(
    `Productos activos: ${productos.length}`,
    margen,
    y
  );

  doc.text(
    `Productos con stock bajo: ${productosStockBajo.length}`,
    105,
    y
  );

  y += 7;

  doc.text(
    `Valor actual del inventario: ${moneda(valorInventario)}`,
    margen,
    y
  );

  y += 13;

  // ==========================================
  // VENTAS
  // ==========================================

  agregarTituloSeccion(
    "Ventas del período",
    `Total: ${moneda(totalVentas)}`
  );

  if (ventas.length === 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);

    doc.text(
      "No hay ventas registradas en este período.",
      margen,
      y
    );

    y += 10;
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);

    doc.text("ID", margen, y);
    doc.text("Fecha", 30, y);
    doc.text("Cliente", 63, y);
    doc.text("Método", 130, y);
    doc.text("Total", 174, y);

    y += 5;

    doc.setFont("helvetica", "normal");

    for (const venta of ventas.slice(0, 30)) {
      if (y > 275) {
        doc.addPage();
        y = 18;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);

        doc.text(
          "Ventas del período",
          margen,
          y
        );

        y += 8;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);

        doc.text("ID", margen, y);
        doc.text("Fecha", 30, y);
        doc.text("Cliente", 63, y);
        doc.text("Método", 130, y);
        doc.text("Total", 174, y);

        y += 5;

        doc.setFont("helvetica", "normal");
      }

      const cliente =
        venta.cliente?.trim() ||
        "Consumidor final";

      doc.text(
        `#${venta.id}`,
        margen,
        y
      );

      doc.text(
        fechaCorta(venta.fecha),
        30,
        y
      );

      doc.text(
        cliente.substring(0, 30),
        63,
        y
      );

      doc.text(
        textoMetodoPago(venta.metodo_pago),
        130,
        y
      );

      doc.text(
        moneda(venta.total),
        174,
        y
      );

      y += 5;

      doc.setDrawColor(230, 230, 230);

      doc.line(
        margen,
        y - 2,
        anchoPagina - margen,
        y - 2
      );
    }

    if (ventas.length > 30) {
      y += 3;

      doc.setFontSize(8);

      doc.text(
        `Se muestran 30 de ${ventas.length} ventas.`,
        margen,
        y
      );

      y += 8;
    }
  }

  // ==========================================
  // ENTRADAS
  // ==========================================

  agregarTituloSeccion(
    "Entradas del período",
    `Total: ${moneda(totalEntradas)}`
  );

  if (entradas.length === 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);

    doc.text(
      "No hay entradas registradas en este período.",
      margen,
      y
    );

    y += 10;
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);

    doc.text("ID", margen, y);
    doc.text("Fecha", 30, y);
    doc.text("Proveedor", 70, y);
    doc.text("Total", 174, y);

    y += 5;

    doc.setFont("helvetica", "normal");

    for (const entrada of entradas.slice(0, 30)) {
      if (y > 275) {
        doc.addPage();
        y = 18;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);

        doc.text(
          "Entradas del período",
          margen,
          y
        );

        y += 8;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);

        doc.text("ID", margen, y);
        doc.text("Fecha", 30, y);
        doc.text("Proveedor", 70, y);
        doc.text("Total", 174, y);

        y += 5;

        doc.setFont("helvetica", "normal");
      }

      doc.text(
        `#${entrada.id}`,
        margen,
        y
      );

      doc.text(
        fechaCorta(entrada.fecha),
        30,
        y
      );

      doc.text(
        (
          entrada.proveedor ||
          "Sin proveedor"
        ).substring(0, 38),
        70,
        y
      );

      doc.text(
        moneda(entrada.total),
        174,
        y
      );

      y += 5;

      doc.setDrawColor(230, 230, 230);

      doc.line(
        margen,
        y - 2,
        anchoPagina - margen,
        y - 2
      );
    }

    if (entradas.length > 30) {
      y += 3;

      doc.setFontSize(8);

      doc.text(
        `Se muestran 30 de ${entradas.length} entradas.`,
        margen,
        y
      );

      y += 8;
    }
  }

  // ==========================================
  // SALIDAS
  // ==========================================

  agregarTituloSeccion(
    "Salidas del período"
  );

  if (salidas.length === 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);

    doc.text(
      "No hay salidas registradas en este período.",
      margen,
      y
    );

    y += 10;
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);

    doc.text("ID", margen, y);
    doc.text("Fecha", 30, y);
    doc.text("Tipo", 70, y);
    doc.text("Responsable", 125, y);

    y += 5;

    doc.setFont("helvetica", "normal");

    for (const salida of salidas.slice(0, 30)) {
      if (y > 275) {
        doc.addPage();
        y = 18;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);

        doc.text(
          "Salidas del período",
          margen,
          y
        );

        y += 8;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);

        doc.text("ID", margen, y);
        doc.text("Fecha", 30, y);
        doc.text("Tipo", 70, y);
        doc.text("Responsable", 125, y);

        y += 5;

        doc.setFont("helvetica", "normal");
      }

      doc.text(
        `#${salida.id}`,
        margen,
        y
      );

      doc.text(
        fechaCorta(salida.fecha),
        30,
        y
      );

      doc.text(
        (
          salida.tipo ||
          "Ajuste"
        ).substring(0, 22),
        70,
        y
      );

      doc.text(
        (
          salida.responsable ||
          "Sin responsable"
        ).substring(0, 28),
        125,
        y
      );

      y += 5;

      doc.setDrawColor(230, 230, 230);

      doc.line(
        margen,
        y - 2,
        anchoPagina - margen,
        y - 2
      );
    }

    if (salidas.length > 30) {
      y += 3;

      doc.setFontSize(8);

      doc.text(
        `Se muestran 30 de ${salidas.length} salidas.`,
        margen,
        y
      );
    }
  }

  // ==========================================
  // STOCK BAJO
  // ==========================================

  if (productosStockBajo.length > 0) {
    y += 12;

    agregarTituloSeccion(
      "Productos con stock bajo"
    );

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);

    doc.text(
      "Producto",
      margen,
      y
    );

    doc.text(
      "Código",
      105,
      y
    );

    doc.text(
      "Stock",
      145,
      y
    );

    doc.text(
      "Mínimo",
      174,
      y
    );

    y += 5;

    doc.setFont("helvetica", "normal");

    for (const producto of productosStockBajo.slice(0, 25)) {
      if (y > 275) {
        doc.addPage();
        y = 18;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);

        doc.text(
          "Productos con stock bajo",
          margen,
          y
        );

        y += 8;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);

        doc.text(
          "Producto",
          margen,
          y
        );

        doc.text(
          "Código",
          105,
          y
        );

        doc.text(
          "Stock",
          145,
          y
        );

        doc.text(
          "Mínimo",
          174,
          y
        );

        y += 5;

        doc.setFont("helvetica", "normal");
      }

      doc.text(
        String(producto.nombre || "Producto")
          .substring(0, 38),
        margen,
        y
      );

      doc.text(
        String(producto.codigo || "-")
          .substring(0, 15),
        105,
        y
      );

      doc.text(
        formatoCantidad(producto.stock),
        145,
        y
      );

      doc.text(
        formatoCantidad(producto.stock_minimo),
        174,
        y
      );

      y += 5;
    }
  }

  // ==========================================
  // PIE
  // ==========================================

  if (y > 265) {
    doc.addPage();
  }

  const altoPagina = 297;

  doc.setDrawColor(
    200,
    200,
    200
  );

  doc.line(
    margen,
    altoPagina - 25,
    anchoPagina - margen,
    altoPagina - 25
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);

  doc.text(
    "Ferretería 7A",
    margen,
    altoPagina - 18
  );

  doc.text(
    "Reporte generado por el sistema de gestión",
    anchoPagina / 2,
    altoPagina - 18,
    {
      align: "center",
    }
  );

  doc.text(
    `${fechaCorta(fechaInicio)} - ${fechaCorta(fechaFin)}`,
    anchoPagina - margen,
    altoPagina - 18,
    {
      align: "right",
    }
  );

  // ==========================================
  // GUARDAR
  // ==========================================

  doc.save(
    `Reporte-Ferreteria-7A-${fechaInicio}-${fechaFin}.pdf`
  );
}