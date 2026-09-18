import { useEffect, useState } from "react";

import Navbar from "./components/Navbar";

import Inventario from "./pages/Inventario";
import Ventas from "./pages/Ventas";
import Entradas from "./pages/Entradas";
import Salidas from "./pages/Salidas";
import Proveedores from "./pages/Proveedores";
import Clientes from "./pages/Clientes";
import Reportes from "./pages/Reportes";

import { supabase } from "./services/supabase";

import "./styles/App.css";


function App() {
  const [paginaActual, setPaginaActual] = useState("inicio");

  const cambiarPagina = (pagina) => {
    setPaginaActual(pagina);
  };

  return (
    <div className="app">

      <Navbar
        paginaActual={paginaActual}
        cambiarPagina={cambiarPagina}
      />

      <main className="main-content">

        <header className="topbar">

          <div className="page-title">

            <div className="page-title-badge">
              7A
            </div>

            <div>
              <h2>
                {paginaActual === "inicio"
                  ? "Panel principal"
                  : paginaActual.charAt(0).toUpperCase() +
                    paginaActual.slice(1)}
              </h2>

              <p>
                Bienvenido al sistema de gestión de Ferretería 7A
              </p>
            </div>

          </div>

          <div className="topbar-actions">

            <button
              className="notification-button"
              title="Notificaciones"
            >
              ♧
            </button>

            <div className="date-badge">

              <span className="date-icon">
                ◷
              </span>

              {new Date().toLocaleDateString("es-CO", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}

            </div>

          </div>

        </header>


        {paginaActual === "inicio" && <Dashboard />}

        {paginaActual === "inventario" && (
          <Inventario />
        )}

        {paginaActual === "ventas" && (
          <Ventas />
        )}

        {paginaActual === "entradas" && (
          <Entradas />
        )}

        {paginaActual === "salidas" && (
          <Salidas />
        )}

        {paginaActual === "proveedores" && (
          <Proveedores />
        )}

        {paginaActual === "clientes" && (
          <Clientes />
        )}

        {paginaActual === "reportes" && (
          <Reportes />
        )}


        {paginaActual !== "inicio" &&
          paginaActual !== "inventario" &&
          paginaActual !== "ventas" &&
          paginaActual !== "entradas" &&
          paginaActual !== "salidas" &&
          paginaActual !== "proveedores" &&
          paginaActual !== "clientes" &&
          paginaActual !== "reportes" && (

            <div className="panel">

              <h3>
                Módulo de {paginaActual}
              </h3>

              <p
                style={{
                  marginTop: "10px",
                  color: "#6b7280",
                  fontSize: "13px",
                }}
              >
                Este módulo lo construiremos paso a paso.
              </p>

            </div>

          )}

      </main>

    </div>
  );
}


function Dashboard() {

  const [ventasHoy, setVentasHoy] = useState(0);
  const [productos, setProductos] = useState([]);
  const [stockBajo, setStockBajo] = useState([]);
  const [valorInventario, setValorInventario] = useState(0);

  const [actividad, setActividad] = useState([]);

  const [cargando, setCargando] = useState(true);


  const formatearMoneda = (valor) => {

    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(Number(valor) || 0);

  };


  const formatearFecha = (fecha) => {

    if (!fecha) {
      return "";
    }

    return new Date(fecha).toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  };


  const cargarDashboard = async () => {

    try {

      setCargando(true);

      const hoy = new Date();

      const inicioHoy = new Date(hoy);
      inicioHoy.setHours(0, 0, 0, 0);

      const finHoy = new Date(hoy);
      finHoy.setHours(23, 59, 59, 999);


      const [
        { data: ventasData, error: ventasError },
        { data: productosData, error: productosError },
        { data: entradasData, error: entradasError },
        { data: salidasData, error: salidasError },
      ] = await Promise.all([

        supabase
          .from("ventas")
          .select("*")
          .gte("fecha", inicioHoy.toISOString())
          .lte("fecha", finHoy.toISOString())
          .neq("estado", "anulada")
          .order("fecha", {
            ascending: false,
          }),

        supabase
          .from("productos")
          .select("*")
          .eq("activo", true)
          .order("nombre", {
            ascending: true,
          }),

        supabase
          .from("entradas")
          .select("*")
          .order("fecha", {
            ascending: false,
          })
          .limit(10),

        supabase
          .from("salidas")
          .select("*")
          .order("fecha", {
            ascending: false,
          })
          .limit(10),

      ]);


      if (ventasError) {
        throw ventasError;
      }

      if (productosError) {
        throw productosError;
      }

      if (entradasError) {
        throw entradasError;
      }

      if (salidasError) {
        throw salidasError;
      }


      const listaProductos = productosData || [];
      const listaVentas = ventasData || [];
      const listaEntradas = entradasData || [];
      const listaSalidas = salidasData || [];


      const totalVentasHoy = listaVentas.reduce(
        (total, venta) => {
          return total + Number(venta.total || 0);
        },
        0
      );

      setVentasHoy(totalVentasHoy);

      setProductos(listaProductos);


      const productosConStockBajo =
        listaProductos.filter((producto) => {

          return (
            Number(producto.stock || 0) <=
            Number(producto.stock_minimo || 0)
          );

        });

      setStockBajo(productosConStockBajo);


      const valorTotalInventario =
        listaProductos.reduce(
          (total, producto) => {

            const stock =
              Number(producto.stock || 0);

            const precioCompra =
              Number(producto.precio_compra || 0);

            return total + stock * precioCompra;

          },
          0
        );

      setValorInventario(valorTotalInventario);


      const actividades = [];


      listaVentas.forEach((venta) => {

        actividades.push({

          tipo: "venta",

          icono: "▤",

          titulo: `Venta #${venta.id}`,

          descripcion:
            `${formatearMoneda(venta.total)} · ${
              venta.cliente || "Consumidor final"
            }`,

          fecha: venta.fecha,

        });

      });


      listaEntradas.forEach((entrada) => {

        actividades.push({

          tipo: "entrada",

          icono: "↓",

          titulo: `Entrada #${entrada.id}`,

          descripcion:
            `${entrada.proveedor || "Sin proveedor"} · ${
              formatearMoneda(entrada.total)
            }`,

          fecha: entrada.fecha,

        });

      });


      listaSalidas.forEach((salida) => {

        actividades.push({

          tipo: "salida",

          icono: "↑",

          titulo: `Salida #${salida.id}`,

          descripcion:
            salida.tipo || "Movimiento de inventario",

          fecha: salida.fecha,

        });

      });


      actividades.sort(
        (a, b) =>
          new Date(b.fecha) -
          new Date(a.fecha)
      );


      setActividad(
        actividades.slice(0, 6)
      );


    } catch (error) {

      console.error(
        "Error al cargar dashboard:",
        error
      );

    } finally {

      setCargando(false);

    }

  };


  useEffect(() => {

    cargarDashboard();

  }, []);


  if (cargando) {

    return (

      <div className="dashboard-loading">

        <div className="dashboard-spinner"></div>

        <p>
          Cargando información...
        </p>

      </div>

    );

  }


  return (

    <div className="dashboard">

      {/* =========================
          BIENVENIDA
      ========================= */}

      <section className="dashboard-welcome">

        <div>

          <span className="welcome-label">
            RESUMEN DEL DÍA
          </span>

          <h1>
            Todo bajo control.
          </h1>

          <p>
            Consulta rápidamente el estado de tu
            ferretería y sus movimientos recientes.
          </p>

        </div>

        <div className="welcome-decoration">

          <div className="welcome-logo">
            7A
          </div>

        </div>

      </section>


      {/* =========================
          INDICADORES
      ========================= */}

      <section className="dashboard-grid">

        <div className="stat-card stat-card-primary">

          <div className="stat-header">

            <div>

              <span className="stat-title">
                VENTAS DE HOY
              </span>

              <span className="stat-caption">
                Ingresos registrados
              </span>

            </div>

            <div className="stat-icon">
              $
            </div>

          </div>

          <div className="stat-value">
            {formatearMoneda(ventasHoy)}
          </div>

          <div className="stat-footer">

            <span className="status-dot"></span>

            {ventasHoy > 0
              ? "Ventas realizadas hoy"
              : "Sin ventas registradas"}

          </div>

        </div>


        <div className="stat-card">

          <div className="stat-header">

            <div>

              <span className="stat-title">
                PRODUCTOS
              </span>

              <span className="stat-caption">
                Catálogo activo
              </span>

            </div>

            <div className="stat-icon stat-icon-blue">
              ▣
            </div>

          </div>

          <div className="stat-value">
            {productos.length}
          </div>

          <div className="stat-footer">
            Productos registrados
          </div>

        </div>


        <div className="stat-card">

          <div className="stat-header">

            <div>

              <span className="stat-title">
                STOCK BAJO
              </span>

              <span className="stat-caption">
                Revisión necesaria
              </span>

            </div>

            <div className="stat-icon stat-icon-red">
              !
            </div>

          </div>

          <div className="stat-value">
            {stockBajo.length}
          </div>

          <div className="stat-footer">

            {stockBajo.length > 0 ? (
              <>
                <span className="status-dot status-dot-red"></span>
                Requieren reposición
              </>
            ) : (
              <>
                <span className="status-dot"></span>
                Inventario en buen nivel
              </>
            )}

          </div>

        </div>


        <div className="stat-card">

          <div className="stat-header">

            <div>

              <span className="stat-title">
                INVENTARIO
              </span>

              <span className="stat-caption">
                Valor de mercancía
              </span>

            </div>

            <div className="stat-icon stat-icon-purple">
              ◈
            </div>

          </div>

          <div className="stat-value">
            {formatearMoneda(valorInventario)}
          </div>

          <div className="stat-footer">
            Valor total a precio de compra
          </div>

        </div>

      </section>


      {/* =========================
          CONTENIDO PRINCIPAL
      ========================= */}

      <section className="dashboard-sections">


        {/* STOCK */}

        <div className="panel dashboard-panel">

          <div className="panel-header">

            <div>

              <span className="panel-kicker">
                INVENTARIO
              </span>

              <h3>
                Productos con stock bajo
              </h3>

            </div>

            <span className="panel-count">
              {stockBajo.length}
            </span>

          </div>


          <div className="stock-list">

            {stockBajo.length === 0 ? (

              <div className="empty-state">

                <div className="empty-icon">
                  ✓
                </div>

                <div>

                  <strong>
                    Inventario en buen estado
                  </strong>

                  <span>
                    No hay productos que necesiten reposición.
                  </span>

                </div>

              </div>

            ) : (

              stockBajo
                .slice(0, 6)
                .map((producto) => (

                  <div
                    className="stock-item"
                    key={producto.id}
                  >

                    <div className="product-info">

                      <div className="product-icon">
                        ▣
                      </div>

                      <div className="product-data">

                        <div className="product-name">
                          {producto.nombre}
                        </div>

                        <div className="product-category">

                          {producto.codigo ||
                            "Sin código"}

                          <span>•</span>

                          {producto.categoria ||
                            "Sin categoría"}

                        </div>

                      </div>

                    </div>


                    <div className="stock-number">

                      <strong>
                        {producto.stock}
                      </strong>

                      <span>
                        disponibles
                      </span>

                    </div>

                  </div>

                ))

            )}

          </div>

        </div>


        {/* ACTIVIDAD */}

        <div className="panel dashboard-panel">

          <div className="panel-header">

            <div>

              <span className="panel-kicker">
                MOVIMIENTOS
              </span>

              <h3>
                Actividad reciente
              </h3>

            </div>

            <span className="panel-count">
              {actividad.length}
            </span>

          </div>


          <div className="activity-list">

            {actividad.length === 0 ? (

              <div className="empty-state">

                <div className="empty-icon">
                  ◷
                </div>

                <div>

                  <strong>
                    Sin movimientos todavía
                  </strong>

                  <span>
                    Las actividades aparecerán aquí.
                  </span>

                </div>

              </div>

            ) : (

              actividad.map((item, index) => (

                <div
                  className={`activity activity-${item.tipo}`}
                  key={`${item.tipo}-${item.fecha}-${index}`}
                >

                  <div className="activity-icon">
                    {item.icono}
                  </div>

                  <div className="activity-text">

                    <strong>
                      {item.titulo}
                    </strong>

                    <span>
                      {item.descripcion}
                    </span>

                  </div>

                  <time>
                    {formatearFecha(item.fecha)}
                  </time>

                </div>

              ))

            )}

          </div>

        </div>

      </section>

    </div>

  );

}


export default App;
