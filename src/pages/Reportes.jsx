import { useEffect, useMemo, useState } from "react";
import { supabase } from "../services/supabase";
import { generarReportePDF } from "../services/pdfService";
import "../styles/reportes.css";

function Reportes() {
  const [ventas, setVentas] = useState([]);
  const [entradas, setEntradas] = useState([]);
  const [salidas, setSalidas] = useState([]);
  const [productos, setProductos] = useState([]);

  const [filtro, setFiltro] = useState("mes");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  async function cargarDatos() {
    try {
      setCargando(true);
      setError("");

      const [
        { data: ventasData, error: ventasError },
        { data: entradasData, error: entradasError },
        { data: salidasData, error: salidasError },
        { data: productosData, error: productosError },
      ] = await Promise.all([
        supabase
          .from("ventas")
          .select("*")
          .order("fecha", { ascending: false }),

        supabase
          .from("entradas")
          .select("*")
          .order("fecha", { ascending: false }),

        supabase
          .from("salidas")
          .select("*")
          .order("fecha", { ascending: false }),

        supabase
          .from("productos")
          .select("*")
          .eq("activo", true)
          .order("nombre", { ascending: true }),
      ]);

      if (ventasError) throw ventasError;
      if (entradasError) throw entradasError;
      if (salidasError) throw salidasError;
      if (productosError) throw productosError;

      setVentas(ventasData || []);
      setEntradas(entradasData || []);
      setSalidas(salidasData || []);
      setProductos(productosData || []);
    } catch (err) {
      console.error("Error al cargar reportes:", err);
      setError("No fue posible cargar la información de reportes.");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarDatos();
  }, []);

  function obtenerFechaLocal() {
    const fechaLocal = new Date();

    fechaLocal.setHours(0, 0, 0, 0);

    return fechaLocal;
  }

  function convertirFechaTexto(fecha) {
    if (!fecha) return "";

    const partes = fecha.split("-");

    if (partes.length !== 3) return "";

    return new Date(
      Number(partes[0]),
      Number(partes[1]) - 1,
      Number(partes[2])
    );
  }

  function aplicarFiltro(tipo) {
    const hoy = obtenerFechaLocal();

    let inicio = new Date(hoy);
    let fin = new Date(hoy);

    if (tipo === "hoy") {
      inicio = new Date(hoy);
      fin = new Date(hoy);
    }

    if (tipo === "semana") {
      const dia = hoy.getDay();
      const diferencia = dia === 0 ? 6 : dia - 1;

      inicio.setDate(hoy.getDate() - diferencia);

      fin = new Date(inicio);
      fin.setDate(inicio.getDate() + 6);
    }

    if (tipo === "mes") {
      inicio = new Date(
        hoy.getFullYear(),
        hoy.getMonth(),
        1
      );

      fin = new Date(
        hoy.getFullYear(),
        hoy.getMonth() + 1,
        0
      );
    }

    const formatearInput = (fecha) => {
      const año = fecha.getFullYear();
      const mes = String(fecha.getMonth() + 1).padStart(2, "0");
      const dia = String(fecha.getDate()).padStart(2, "0");

      return `${año}-${mes}-${dia}`;
    };

    setFechaInicio(formatearInput(inicio));
    setFechaFin(formatearInput(fin));
    setFiltro(tipo);
  }

  useEffect(() => {
    aplicarFiltro("mes");
  }, []);

  function fechaDentroDelRango(fecha) {
    if (!fechaInicio || !fechaFin || !fecha) {
      return true;
    }

    const fechaRegistro = new Date(fecha);
    fechaRegistro.setHours(0, 0, 0, 0);

    const inicio = convertirFechaTexto(fechaInicio);
    const fin = convertirFechaTexto(fechaFin);

    if (!inicio || !fin) {
      return true;
    }

    inicio.setHours(0, 0, 0, 0);
    fin.setHours(23, 59, 59, 999);

    return fechaRegistro >= inicio && fechaRegistro <= fin;
  }

  const ventasFiltradas = useMemo(() => {
    return ventas.filter((venta) => {
      if (venta.estado === "anulada") return false;

      return fechaDentroDelRango(venta.fecha);
    });
  }, [ventas, fechaInicio, fechaFin]);

  const entradasFiltradas = useMemo(() => {
    return entradas.filter((entrada) =>
      fechaDentroDelRango(entrada.fecha)
    );
  }, [entradas, fechaInicio, fechaFin]);

  const salidasFiltradas = useMemo(() => {
    return salidas.filter((salida) =>
      fechaDentroDelRango(salida.fecha)
    );
  }, [salidas, fechaInicio, fechaFin]);

  const totalVentas = ventasFiltradas.reduce(
    (total, venta) =>
      total + Number(venta.total || 0),
    0
  );

  const totalEntradas = entradasFiltradas.reduce(
    (total, entrada) =>
      total + Number(entrada.total || 0),
    0
  );

  const totalOperaciones =
    ventasFiltradas.length +
    entradasFiltradas.length +
    salidasFiltradas.length;

  const totalProductos = productos.length;

  const productosStockBajo = productos.filter(
    (producto) =>
      Number(producto.stock || 0) <=
      Number(producto.stock_minimo || 0)
  );

  const valorInventario = productos.reduce(
    (total, producto) =>
      total +
      Number(producto.stock || 0) *
        Number(producto.precio_compra || 0),
    0
  );

  const formatearMoneda = (valor) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(valor);
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return "-";

    return new Date(fecha).toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  function exportarPDF() {
    try {
      generarReportePDF({
        fechaInicio,
        fechaFin,
        ventas: ventasFiltradas,
        entradas: entradasFiltradas,
        salidas: salidasFiltradas,
        productos,
        totalVentas,
        totalEntradas,
      });
    } catch (err) {
      console.error("Error al generar reporte PDF:", err);
      setError("No fue posible generar el reporte PDF.");
    }
  }

  if (cargando) {
    return (
      <div className="reportes-page">
        <div className="reportes-cargando">
          <div className="reportes-spinner"></div>
          <p>Cargando reportes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="reportes-page">

      <div className="reportes-header">
        <div>
          <span className="reportes-etiqueta">
            ANÁLISIS DEL NEGOCIO
          </span>

          <h1>Reportes</h1>

          <p>
            Consulta el estado general de ventas, compras e inventario.
          </p>
        </div>

        <div className="reportes-acciones">

          <button
            className="btn-exportar-reportes"
            onClick={exportarPDF}
          >
            📄 Exportar PDF
          </button>

          <button
            className="btn-actualizar-reportes"
            onClick={cargarDatos}
          >
            ↻ Actualizar
          </button>

        </div>
      </div>

      {error && (
        <div className="reporte-alerta">
          {error}
        </div>
      )}

      <section className="reportes-filtros">

        <div className="filtros-titulo">
          <strong>Período del reporte</strong>

          <span>
            Selecciona las fechas que deseas consultar
          </span>
        </div>

        <div className="filtros-rapidos">

          <button
            className={filtro === "hoy" ? "activo" : ""}
            onClick={() => aplicarFiltro("hoy")}
          >
            Hoy
          </button>

          <button
            className={filtro === "semana" ? "activo" : ""}
            onClick={() => aplicarFiltro("semana")}
          >
            Esta semana
          </button>

          <button
            className={filtro === "mes" ? "activo" : ""}
            onClick={() => aplicarFiltro("mes")}
          >
            Este mes
          </button>

          <button
            className={filtro === "personalizado" ? "activo" : ""}
            onClick={() => setFiltro("personalizado")}
          >
            Personalizado
          </button>

        </div>

        <div className="filtros-fechas">

          <div className="campo-fecha">
            <label>Desde</label>

            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => {
                setFechaInicio(e.target.value);
                setFiltro("personalizado");
              }}
            />
          </div>

          <div className="campo-fecha">
            <label>Hasta</label>

            <input
              type="date"
              value={fechaFin}
              onChange={(e) => {
                setFechaFin(e.target.value);
                setFiltro("personalizado");
              }}
            />
          </div>

        </div>

      </section>

      <section className="reportes-resumen">

        <div className="reporte-card reporte-ventas">
          <div className="reporte-card-icono">▤</div>

          <div>
            <span>Ventas del período</span>

            <strong>
              {formatearMoneda(totalVentas)}
            </strong>
          </div>
        </div>

        <div className="reporte-card reporte-entradas">
          <div className="reporte-card-icono">↓</div>

          <div>
            <span>Entradas del período</span>

            <strong>
              {formatearMoneda(totalEntradas)}
            </strong>
          </div>
        </div>

        <div className="reporte-card reporte-productos">
          <div className="reporte-card-icono">▣</div>

          <div>
            <span>Operaciones</span>

            <strong>
              {totalOperaciones}
            </strong>
          </div>
        </div>

        <div className="reporte-card reporte-inventario">
          <div className="reporte-card-icono">◆</div>

          <div>
            <span>Valor del inventario</span>

            <strong>
              {formatearMoneda(valorInventario)}
            </strong>
          </div>
        </div>

      </section>

      <section className="reportes-grid">

        <div className="reporte-panel">

          <div className="reporte-panel-header">

            <div>
              <h2>Ventas del período</h2>

              <p>
                Ventas realizadas entre las fechas seleccionadas
              </p>
            </div>

            <span className="reporte-contador">
              {ventasFiltradas.length}
            </span>

          </div>

          {ventasFiltradas.length === 0 ? (

            <div className="reporte-vacio">
              No hay ventas en este período.
            </div>

          ) : (

            <div className="reporte-tabla-wrapper">

              <table className="reporte-tabla">

                <thead>
                  <tr>
                    <th>Venta</th>
                    <th>Fecha</th>
                    <th>Cliente</th>
                    <th>Método</th>
                    <th>Total</th>
                  </tr>
                </thead>

                <tbody>
                  {ventasFiltradas
                    .slice(0, 10)
                    .map((venta) => (

                      <tr key={venta.id}>

                        <td>
                          <strong>
                            #{venta.id}
                          </strong>
                        </td>

                        <td>
                          {formatearFecha(venta.fecha)}
                        </td>

                        <td>
                          {venta.cliente ||
                            "Consumidor final"}
                        </td>

                        <td>
                          <span className="reporte-metodo">
                            {venta.metodo_pago ||
                              "efectivo"}
                          </span>
                        </td>

                        <td>
                          <strong>
                            {formatearMoneda(
                              venta.total
                            )}
                          </strong>
                        </td>

                      </tr>

                    ))}
                </tbody>

              </table>

            </div>

          )}

        </div>

        <div className="reporte-panel">

          <div className="reporte-panel-header">

            <div>
              <h2>Stock bajo</h2>

              <p>
                Productos que requieren atención
              </p>
            </div>

            <span className="reporte-contador reporte-contador-alerta">
              {productosStockBajo.length}
            </span>

          </div>

          {productosStockBajo.length === 0 ? (

            <div className="reporte-vacio reporte-vacio-ok">
              ✓ No hay productos con stock bajo.
            </div>

          ) : (

            <div className="stock-lista">

              {productosStockBajo
                .slice(0, 10)
                .map((producto) => (

                  <div
                    className="stock-item"
                    key={producto.id}
                  >

                    <div className="stock-info">

                      <strong>
                        {producto.nombre}
                      </strong>

                      <span>
                        {producto.codigo ||
                          "Sin código"}
                      </span>

                    </div>

                    <div className="stock-cantidad">

                      <strong>
                        {producto.stock}
                      </strong>

                      <span>
                        mínimo {producto.stock_minimo}
                      </span>

                    </div>

                  </div>

                ))}

            </div>

          )}

        </div>

      </section>

      <section className="reportes-grid reportes-grid-inferior">

        <div className="reporte-panel">

          <div className="reporte-panel-header">

            <div>
              <h2>Entradas del período</h2>

              <p>
                Compras y abastecimiento
              </p>
            </div>

            <span className="reporte-contador">
              {entradasFiltradas.length}
            </span>

          </div>

          {entradasFiltradas.length === 0 ? (

            <div className="reporte-vacio">
              No hay entradas en este período.
            </div>

          ) : (

            <div className="reporte-tabla-wrapper">

              <table className="reporte-tabla">

                <thead>
                  <tr>
                    <th>Entrada</th>
                    <th>Fecha</th>
                    <th>Proveedor</th>
                    <th>Total</th>
                  </tr>
                </thead>

                <tbody>

                  {entradasFiltradas
                    .slice(0, 10)
                    .map((entrada) => (

                      <tr key={entrada.id}>

                        <td>
                          <strong>
                            #{entrada.id}
                          </strong>
                        </td>

                        <td>
                          {formatearFecha(
                            entrada.fecha
                          )}
                        </td>

                        <td>
                          {entrada.proveedor ||
                            "Sin proveedor"}
                        </td>

                        <td>
                          <strong>
                            {formatearMoneda(
                              entrada.total
                            )}
                          </strong>
                        </td>

                      </tr>

                    ))}

                </tbody>

              </table>

            </div>

          )}

        </div>

        <div className="reporte-panel">

          <div className="reporte-panel-header">

            <div>
              <h2>Salidas del período</h2>

              <p>
                Movimientos de inventario
              </p>
            </div>

            <span className="reporte-contador">
              {salidasFiltradas.length}
            </span>

          </div>

          {salidasFiltradas.length === 0 ? (

            <div className="reporte-vacio">
              No hay salidas en este período.
            </div>

          ) : (

            <div className="salidas-resumen">

              {salidasFiltradas
                .slice(0, 10)
                .map((salida) => (

                  <div
                    className="salida-item"
                    key={salida.id}
                  >

                    <div>

                      <strong>
                        {salida.tipo ||
                          "Ajuste"}
                      </strong>

                      <span>
                        {formatearFecha(
                          salida.fecha
                        )}
                      </span>

                    </div>

                    <span className="salida-badge">
                      #{salida.id}
                    </span>

                  </div>

                ))}

            </div>

          )}

        </div>

      </section>

    </div>
  );
}

export default Reportes;