import jsPDF from "jspdf";

const LOGO_PATH = "/logo192.png";

const COLOR_PRINCIPAL = [23, 32, 51];
const COLOR_SECUNDARIO = [71, 85, 105];
const COLOR_CLARO = [241, 245, 249];
const COLOR_LINEA = [226, 232, 240];
const COLOR_TEXTO = [30, 41, 59];
const COLOR_ROJO = [185, 28, 28];

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
  if (!fecha) return "";

  const fechaObj = new Date(fecha);

  if (Number.isNaN(fechaObj.getTime())) {
    return "";
  }

  return fechaObj.toLocaleString("es-CO", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function formatoFechaCorta(fecha) {
  if (!fecha) return "-";

  const fechaObj = new Date(fecha);

  if (Number.isNaN(fechaObj.getTime())) {
    return "-";
  }

  return fechaObj.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function textoMetodoPago(metodo) {
  const metodos = {
    efectivo: "Efectivo",
    transferencia: "Transferencia",
    tarjeta: "Tarjeta",
    credito: "Crédito",
  };

  return metodos[metodo] || metodo || "No especificado";
}

function textoUnidad(unidad) {
  if (!unidad) return "unidad";

  const unidades = {
    unidad: "unidad",
    unidades: "unidades",
    metro: "metro",
    metros: "metros",
    kilo: "kilo",
    kilos: "kilos",
    gramo: "gramo",
    gramos: "gramos",
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
    par: "par",
    pares: "pares",
  };

  return unidades[String(unidad).toLowerCase()] || unidad;
}

async function cargarLogo() {
  try {
    const respuesta = await fetch(LOGO_PATH);

    if (!respuesta.ok) {
      throw new Error("No fue posible cargar el logo.");
    }

    const blob = await respuesta.blob();

    return await new Promise((resolve, reject) => {
      const lector = new FileReader();

      lector.onloadend = () => resolve(lector.result);
      lector.onerror = reject;

      lector.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn(
      "No se pudo cargar el logo. El PDF continuará sin logo.",
      error
    );

    return null;
  }
}

function dibujarEncabezadoVenta(
  doc,
  logo,
  margen,
  anchoPagina
) {
  const alto = 35;

  doc.setFillColor(...COLOR_PRINCIPAL);

  doc.roundedRect(
    margen,
    12,
    anchoPagina - margen * 2,
    alto,
    4,
    4,
    "F"
  );

  if (logo) {
    try {
      doc.addImage(
        logo,
        "PNG",
        margen + 5,
        16,
        25,
        25
      );
    } catch (error) {
      console.warn("No se pudo insertar el logo.", error);
    }
  }

  const xTexto = logo ? margen + 36 : margen + 7;

  doc.setTextColor(255, 255, 255);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);

  doc.text(
    "FERRETERÍA 7A",
    xTexto,
    25
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  doc.text(
    "Sistema de gestión de ferretería",
    xTexto,
    32
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);

  doc.text(
    "COMPROBANTE DE VENTA",
    anchoPagina - margen - 6,
    25,
    {
      align: "right",
    }
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);

  doc.text(
    "Documento generado automáticamente",
    anchoPagina - margen - 6,
    32,
    {
      align: "right",
    }
  );

  doc.setTextColor(...COLOR_TEXTO);
}

function dibujarEncabezadoReporte(
  doc,
  logo,
  margen,
  anchoPagina,
  fechaInicio,
  fechaFin
) {
  doc.setFillColor(...COLOR_PRINCIPAL);

  doc.roundedRect(
    margen,
    12,
    anchoPagina - margen * 2,
    43,
    4,
    4,
    "F"
  );

  if (logo) {
    try {
      doc.addImage(
        logo,
        "PNG",
        margen + 5,
        18,
        29,
        29
      );
    } catch (error) {
      console.warn("No se pudo insertar el logo.", error);
    }
  }

  const xTexto = logo ? margen + 40 : margen + 7;

  doc.setTextColor(255, 255, 255);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);

  doc.text(
    "FERRETERÍA 7A",
    xTexto,
    27
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  doc.text(
    "Reporte general de gestión",
    xTexto,
    35
  );

  doc.setFontSize(8);

  doc.text(
    `Período: ${formatoFechaCorta(
      fechaInicio
    )} - ${formatoFechaCorta(fechaFin)}`,
    xTexto,
    43
  );

  doc.text(
    `Generado: ${formatoFechaCorta(new Date())}`,
    xTexto,
    50
  );

  doc.setTextColor(...COLOR_TEXTO);
}

function dibujarPiePagina(
  doc,
  numeroPagina,
  totalPaginas,
  textoDerecho
) {
  const anchoPagina =
    doc.internal.pageSize.getWidth();

  const altoPagina =
    doc.internal.pageSize.getHeight();

  const margen = 18;

  doc.setDrawColor(...COLOR_LINEA);

  doc.line(
    margen,
    altoPagina - 19,
    anchoPagina - margen,
    altoPagina - 19
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);

  doc.setTextColor(...COLOR_SECUNDARIO);

  doc.text(
    "Ferretería 7A",
    margen,
    altoPagina - 12
  );

  doc.text(
    "Sistema de gestión",
    anchoPagina / 2,
    altoPagina - 12,
    {
      align: "center",
    }
  );

  doc.text(
    textoDerecho ||
      `Página ${numeroPagina} de ${totalPaginas}`,
    anchoPagina - margen,
    altoPagina - 12,
    {
      align: "right",
    }
  );

  doc.setTextColor(...COLOR_TEXTO);
}

function agregarPiesDePagina(
  doc,
  textoDerecho
) {
  const totalPaginas =
    doc.internal.getNumberOfPages();

  for (
    let pagina = 1;
    pagina <= totalPaginas;
    pagina++
  ) {
    doc.setPage(pagina);

    dibujarPiePagina(
      doc,
      pagina,
      totalPaginas,
      textoDerecho
    );
  }
}

export async function generarComprobanteVentaPDF({
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

  const logo = await cargarLogo();

  const margen = 18;

  const anchoPagina =
    doc.internal.pageSize.getWidth();

  const altoPagina =
    doc.internal.pageSize.getHeight();

  const anchoUtil =
    anchoPagina - margen * 2;

  let y = 56;

  dibujarEncabezadoVenta(
    doc,
    logo,
    margen,
    anchoPagina
  );

  doc.setFillColor(...COLOR_CLARO);

  doc.roundedRect(
    margen,
    y,
    anchoUtil,
    35,
    3,
    3,
    "F"
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);

  doc.setTextColor(...COLOR_PRINCIPAL);

  doc.text(
    `Venta #${ventaId}`,
    margen + 6,
    y + 9
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);

  doc.setTextColor(...COLOR_TEXTO);

  doc.text(
    `Fecha: ${formatoFecha(fecha)}`,
    margen + 6,
    y + 17
  );

  doc.text(
    `Cliente: ${
      cliente?.trim() || "Cliente general"
    }`,
    margen + 6,
    y + 26
  );

  doc.text(
    `Método de pago: ${textoMetodoPago(
      metodoPago
    )}`,
    112,
    y + 17
  );

  doc.text(
    "Estado: Completada",
    112,
    y + 26
  );

  y += 46;

  const columnas = {
    producto: margen + 3,
    cantidad: 105,
    unidad: 123,
    precio: 150,
    total: 177,
  };

  const dibujarEncabezadoTabla = () => {
    doc.setFillColor(...COLOR_PRINCIPAL);

    doc.roundedRect(
      margen,
      y - 5,
      anchoUtil,
      10,
      2,
      2,
      "F"
    );

    doc.setTextColor(255, 255, 255);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);

    doc.text(
      "PRODUCTO",
      columnas.producto,
      y + 1
    );

    doc.text(
      "CANT.",
      columnas.cantidad,
      y + 1
    );

    doc.text(
      "UNIDAD",
      columnas.unidad,
      y + 1
    );

    doc.text(
      "PRECIO",
      columnas.precio,
      y + 1
    );

    doc.text(
      "TOTAL",
      columnas.total,
      y + 1
    );

    y += 11;

    doc.setTextColor(...COLOR_TEXTO);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
  };

  dibujarEncabezadoTabla();

  if (
    !Array.isArray(detalles) ||
    detalles.length === 0
  ) {
    doc.setFontSize(9);
    doc.setTextColor(...COLOR_SECUNDARIO);

    doc.text(
      "No hay productos registrados en esta venta.",
      margen,
      y
    );

    y += 10;
  } else {
    for (const detalle of detalles) {
      const nombre =
        detalle?.nombre_producto ||
        detalle?.nombre ||
        "Producto";

      const cantidad =
        Number(detalle?.cantidad) || 0;

      const precio =
        Number(detalle?.precio_unitario) || 0;

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
        9,
        lineasProducto.length * 4.2
      );

      if (
        y + altoFila >
        altoPagina - 40
      ) {
        doc.addPage();

        y = 24;

        dibujarEncabezadoTabla();
      }

      doc.setFillColor(
        248,
        250,
        252
      );

      doc.rect(
        margen,
        y - 5,
        anchoUtil,
        altoFila,
        "F"
      );

      doc.setTextColor(...COLOR_TEXTO);
      doc.setFontSize(8);

      doc.text(
        lineasProducto,
        columnas.producto,
        y
      );

      doc.text(
        formatoCantidad(cantidad),
        columnas.cantidad,
        y
      );

      doc.text(
        unidad,
        columnas.unidad,
        y
      );

      doc.text(
        formatoMoneda(precio),
        columnas.precio,
        y
      );

      doc.setFont("helvetica", "bold");

      doc.text(
        formatoMoneda(subtotalProducto),
        columnas.total,
        y
      );

      doc.setFont("helvetica", "normal");

      y += altoFila;

      doc.setDrawColor(...COLOR_LINEA);

      doc.line(
        margen,
        y - 2,
        anchoPagina - margen,
        y - 2
      );
    }
  }

  y += 10;

  if (
    y + 55 >
    altoPagina - 35
  ) {
    doc.addPage();
    y = 25;
  }

  const resumenX = 127;
  const valorX = anchoPagina - margen;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...COLOR_SECUNDARIO);

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

  doc.setDrawColor(...COLOR_LINEA);

  doc.line(
    resumenX,
    y - 4,
    valorX,
    y - 4
  );

  doc.setFillColor(...COLOR_PRINCIPAL);

  doc.roundedRect(
    resumenX - 4,
    y,
    anchoPagina - margen - resumenX + 4,
    15,
    2,
    2,
    "F"
  );

  doc.setTextColor(255, 255, 255);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);

  doc.text(
    "TOTAL",
    resumenX + 3,
    y + 10
  );

  doc.text(
    formatoMoneda(total),
    valorX - 3,
    y + 10,
    {
      align: "right",
    }
  );

  y += 24;

  if (observaciones?.trim()) {
    if (
      y + 30 >
      altoPagina - 35
    ) {
      doc.addPage();
      y = 25;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);

    doc.setTextColor(...COLOR_PRINCIPAL);

    doc.text(
      "Observaciones",
      margen,
      y
    );

    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);

    doc.setTextColor(...COLOR_TEXTO);

    const lineas =
      doc.splitTextToSize(
        observaciones.trim(),
        anchoUtil
      );

    doc.text(
      lineas,
      margen,
      y
    );
  }

  agregarPiesDePagina(
    doc,
    `Venta #${ventaId}`
  );

  doc.save(
    `Comprobante-Venta-${ventaId}.pdf`
  );
}

export async function generarReportePDF({
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

  const logo = await cargarLogo();

  const margen = 15;

  const anchoPagina =
    doc.internal.pageSize.getWidth();

  const altoPagina =
    doc.internal.pageSize.getHeight();

  const anchoUtil =
    anchoPagina - margen * 2;

  let y = 64;

  const valorInventario =
    productos.reduce(
      (total, producto) =>
        total +
        Number(producto.stock || 0) *
          Number(producto.precio_compra || 0),
      0
    );

  const productosStockBajo =
    productos.filter(
      (producto) =>
        Number(producto.stock || 0) <=
        Number(producto.stock_minimo || 0)
    );

  const totalOperaciones =
    ventas.length +
    entradas.length +
    salidas.length;

  dibujarEncabezadoReporte(
    doc,
    logo,
    margen,
    anchoPagina,
    fechaInicio,
    fechaFin
  );

  const agregarTituloSeccion = (
    titulo,
    subtitulo = ""
  ) => {
    if (
      y + 22 >
      altoPagina - 30
    ) {
      doc.addPage();
      y = 20;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);

    doc.setTextColor(...COLOR_PRINCIPAL);

    doc.text(
      titulo,
      margen,
      y
    );

    y += 5;

    if (subtitulo) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);

      doc.setTextColor(...COLOR_SECUNDARIO);

      doc.text(
        subtitulo,
        margen,
        y
      );

      y += 7;
    } else {
      y += 7;
    }
  };

  agregarTituloSeccion(
    "Resumen del período",
    "Indicadores principales de la operación"
  );

  const tarjetas = [
    {
      titulo: "VENTAS",
      valor: formatoMoneda(totalVentas),
    },
    {
      titulo: "ENTRADAS",
      valor: formatoMoneda(totalEntradas),
    },
    {
      titulo: "OPERACIONES",
      valor: String(totalOperaciones),
    },
    {
      titulo: "PRODUCTOS",
      valor: String(productos.length),
    },
  ];

  const anchoTarjeta =
    (anchoUtil - 9) / 4;

  tarjetas.forEach(
    (tarjeta, index) => {
      const x =
        margen +
        index * (anchoTarjeta + 3);

      doc.setFillColor(...COLOR_CLARO);

      doc.roundedRect(
        x,
        y,
        anchoTarjeta,
        25,
        2,
        2,
        "F"
      );

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);

      doc.setTextColor(...COLOR_SECUNDARIO);

      doc.text(
        tarjeta.titulo,
        x + 4,
        y + 7
      );

      doc.setFontSize(9.5);

      doc.setTextColor(...COLOR_PRINCIPAL);

      doc.text(
        tarjeta.valor,
        x + 4,
        y + 18
      );
    }
  );

  y += 35;

  agregarTituloSeccion(
    "Estado del inventario"
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  doc.setTextColor(...COLOR_TEXTO);

  doc.text(
    `Valor del inventario: ${formatoMoneda(
      valorInventario
    )}`,
    margen,
    y
  );

  doc.text(
    `Stock bajo: ${productosStockBajo.length} producto(s)`,
    110,
    y
  );

  y += 14;

  agregarTituloSeccion(
    "Ventas del período",
    `Total vendido: ${formatoMoneda(totalVentas)}`
  );

  if (ventas.length === 0) {
    doc.setFontSize(9);
    doc.setTextColor(...COLOR_SECUNDARIO);

    doc.text(
      "No hay ventas registradas en este período.",
      margen,
      y
    );

    y += 10;
  } else {
    doc.setFillColor(...COLOR_PRINCIPAL);

    doc.roundedRect(
      margen,
      y - 5,
      anchoUtil,
      9,
      2,
      2,
      "F"
    );

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);

    doc.text("ID", margen + 2, y + 1);
    doc.text("FECHA", 30, y + 1);
    doc.text("CLIENTE", 62, y + 1);
    doc.text("MÉTODO", 130, y + 1);
    doc.text("TOTAL", 174, y + 1);

    y += 10;

    for (
      const venta of ventas.slice(0, 30)
    ) {
      if (y > altoPagina - 30) {
        doc.addPage();
        y = 20;
      }

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(...COLOR_TEXTO);

      doc.text(
        `#${venta.id}`,
        margen + 2,
        y
      );

      doc.text(
        formatoFechaCorta(venta.fecha),
        30,
        y
      );

      doc.text(
        (
          venta.cliente ||
          "Consumidor final"
        ).substring(0, 30),
        62,
        y
      );

      doc.text(
        textoMetodoPago(
          venta.metodo_pago
        ),
        130,
        y
      );

      doc.setFont("helvetica", "bold");

      doc.text(
        formatoMoneda(venta.total),
        174,
        y
      );

      y += 6;

      doc.setDrawColor(...COLOR_LINEA);

      doc.line(
        margen,
        y - 2,
        anchoPagina - margen,
        y - 2
      );
    }
  }

  y += 7;

  agregarTituloSeccion(
    "Entradas del período",
    `Total recibido: ${formatoMoneda(totalEntradas)}`
  );

  if (entradas.length === 0) {
    doc.setFontSize(9);
    doc.setTextColor(...COLOR_SECUNDARIO);

    doc.text(
      "No hay entradas registradas en este período.",
      margen,
      y
    );

    y += 10;
  } else {
    doc.setFillColor(...COLOR_PRINCIPAL);

    doc.roundedRect(
      margen,
      y - 5,
      anchoUtil,
      9,
      2,
      2,
      "F"
    );

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);

    doc.text("ID", margen + 2, y + 1);
    doc.text("FECHA", 30, y + 1);
    doc.text("PROVEEDOR", 70, y + 1);
    doc.text("TOTAL", 174, y + 1);

    y += 10;

    for (
      const entrada of entradas.slice(0, 30)
    ) {
      if (y > altoPagina - 30) {
        doc.addPage();
        y = 20;
      }

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(...COLOR_TEXTO);

      doc.text(
        `#${entrada.id}`,
        margen + 2,
        y
      );

      doc.text(
        formatoFechaCorta(entrada.fecha),
        30,
        y
      );

      doc.text(
        (
          entrada.proveedor ||
          "Sin proveedor"
        ).substring(0, 40),
        70,
        y
      );

      doc.setFont("helvetica", "bold");

      doc.text(
        formatoMoneda(entrada.total),
        174,
        y
      );

      y += 6;

      doc.setDrawColor(...COLOR_LINEA);

      doc.line(
        margen,
        y - 2,
        anchoPagina - margen,
        y - 2
      );
    }
  }

  y += 7;

  agregarTituloSeccion(
    "Salidas del período"
  );

  if (salidas.length === 0) {
    doc.setFontSize(9);
    doc.setTextColor(...COLOR_SECUNDARIO);

    doc.text(
      "No hay salidas registradas en este período.",
      margen,
      y
    );

    y += 10;
  } else {
    doc.setFillColor(...COLOR_PRINCIPAL);

    doc.roundedRect(
      margen,
      y - 5,
      anchoUtil,
      9,
      2,
      2,
      "F"
    );

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);

    doc.text("ID", margen + 2, y + 1);
    doc.text("FECHA", 30, y + 1);
    doc.text("TIPO", 70, y + 1);
    doc.text("RESPONSABLE", 125, y + 1);

    y += 10;

    for (
      const salida of salidas.slice(0, 30)
    ) {
      if (y > altoPagina - 30) {
        doc.addPage();
        y = 20;
      }

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(...COLOR_TEXTO);

      doc.text(
        `#${salida.id}`,
        margen + 2,
        y
      );

      doc.text(
        formatoFechaCorta(salida.fecha),
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

      y += 6;

      doc.setDrawColor(...COLOR_LINEA);

      doc.line(
        margen,
        y - 2,
        anchoPagina - margen,
        y - 2
      );
    }
  }

  if (productosStockBajo.length > 0) {
    y += 8;

    agregarTituloSeccion(
      "Productos con stock bajo",
      "Productos que requieren revisión o reposición"
    );

    doc.setFillColor(...COLOR_ROJO);

    doc.roundedRect(
      margen,
      y - 5,
      anchoUtil,
      9,
      2,
      2,
      "F"
    );

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);

    doc.text(
      "PRODUCTO",
      margen + 2,
      y + 1
    );

    doc.text(
      "CÓDIGO",
      105,
      y + 1
    );

    doc.text(
      "STOCK",
      145,
      y + 1
    );

    doc.text(
      "MÍNIMO",
      174,
      y + 1
    );

    y += 10;

    for (
      const producto of productosStockBajo.slice(
        0,
        25
      )
    ) {
      if (y > altoPagina - 30) {
        doc.addPage();
        y = 20;
      }

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(...COLOR_TEXTO);

      doc.text(
        String(
          producto.nombre || "Producto"
        ).substring(0, 38),
        margen + 2,
        y
      );

      doc.text(
        String(
          producto.codigo || "-"
        ).substring(0, 15),
        105,
        y
      );

      doc.text(
        formatoCantidad(producto.stock),
        145,
        y
      );

      doc.text(
        formatoCantidad(
          producto.stock_minimo
        ),
        174,
        y
      );

      y += 6;
    }
  }

  agregarPiesDePagina(
    doc,
    `${formatoFechaCorta(
      fechaInicio
    )} - ${formatoFechaCorta(fechaFin)}`
  );

  doc.save(
    `Reporte-Ferreteria-7A-${fechaInicio}-${fechaFin}.pdf`
  );
}