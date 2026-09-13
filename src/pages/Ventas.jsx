import { useEffect, useMemo, useState } from "react";
import { obtenerProductos } from "../services/productosService";
import {
  obtenerVentas,
  obtenerVentaPorId,
  procesarVenta,
  anularVenta,
} from "../services/ventasService";
import { generarComprobanteVentaPDF } from "../services/pdfService";

function Ventas() {
  const [productos, setProductos] = useState([]);
  const [ventas, setVentas] = useState([]);

  const [busqueda, setBusqueda] = useState("");
  const [carrito, setCarrito] = useState([]);

  const [cliente, setCliente] = useState("");
  const [metodoPago, setMetodoPago] =
    useState("efectivo");

  const [descuento, setDescuento] = useState(0);
  const [observaciones, setObservaciones] =
    useState("");

  const [cargando, setCargando] = useState(true);
  const [cargandoVentas, setCargandoVentas] =
    useState(true);

  const [guardando, setGuardando] = useState(false);
  const [anulandoVenta, setAnulandoVenta] =
    useState(false);

  const [cargandoDetalle, setCargandoDetalle] =
    useState(false);

  const [ventaSeleccionada, setVentaSeleccionada] =
    useState(null);

  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [ultimaVenta, setUltimaVenta] =
    useState(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    await Promise.all([
      cargarProductos(),
      cargarVentas(),
    ]);
  }

  async function cargarProductos() {
    try {
      setCargando(true);
      setError("");

      const datos = await obtenerProductos();

      setProductos(datos);
    } catch (err) {
      console.error(err);

      setError(
        "No fue posible cargar los productos para realizar la venta."
      );
    } finally {
      setCargando(false);
    }
  }

  async function cargarVentas() {
    try {
      setCargandoVentas(true);

      const datos = await obtenerVentas();

      setVentas(datos);
    } catch (err) {
      console.error(
        "Error cargando historial de ventas:",
        err
      );
    } finally {
      setCargandoVentas(false);
    }
  }

  const formatoMoneda = (valor) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(Number(valor) || 0);
  };

  const formatoCantidad = (valor) => {
    const numero = Number(valor);

    if (Number.isNaN(numero)) {
      return "0";
    }

    return numero.toLocaleString("es-CO", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  const formatoFecha = (fecha) => {
    if (!fecha) {
      return "Sin fecha";
    }

    const fechaObj = new Date(fecha);

    if (Number.isNaN(fechaObj.getTime())) {
      return "Sin fecha";
    }

    return fechaObj.toLocaleString("es-CO", {
      dateStyle: "short",
      timeStyle: "short",
    });
  };

  const textoMetodoPago = (metodo) => {
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
  };

  const textoUnidad = (unidad) => {
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
  };

  const productosDisponibles = useMemo(() => {
    const texto = busqueda
      .trim()
      .toLowerCase();

    if (!texto) {
      return [];
    }

    return productos
      .filter((producto) => {
        const nombre =
          producto.nombre?.toLowerCase() || "";

        const codigo =
          producto.codigo?.toLowerCase() || "";

        return (
          nombre.includes(texto) ||
          codigo.includes(texto)
        );
      })
      .slice(0, 8);
  }, [productos, busqueda]);

  const agregarAlCarrito = (producto) => {
    setMensaje("");
    setError("");

    const stockDisponible = Number(
      producto.stock || 0
    );

    if (stockDisponible <= 0) {
      setError(
        `"${producto.nombre}" no tiene stock disponible.`
      );

      return;
    }

    setCarrito((anterior) => {
      const existente = anterior.find(
        (item) =>
          item.producto.id === producto.id
      );

      if (existente) {
        if (
          existente.cantidad >=
          stockDisponible
        ) {
          return anterior;
        }

        return anterior.map((item) => {
          if (
            item.producto.id !== producto.id
          ) {
            return item;
          }

          return {
            ...item,
            cantidad: item.cantidad + 1,
          };
        });
      }

      return [
        ...anterior,
        {
          producto,
          cantidad: 1,
        },
      ];
    });

    setBusqueda("");
  };

  const cambiarCantidad = (
    productoId,
    cantidad
  ) => {
    const producto = productos.find(
      (item) => item.id === productoId
    );

    if (!producto) {
      return;
    }

    const stockDisponible = Number(
      producto.stock || 0
    );

    let nuevaCantidad = Number(cantidad);

    if (Number.isNaN(nuevaCantidad)) {
      nuevaCantidad = 1;
    }

    if (nuevaCantidad < 1) {
      nuevaCantidad = 1;
    }

    if (
      nuevaCantidad > stockDisponible
    ) {
      nuevaCantidad = stockDisponible;
    }

    setCarrito((anterior) =>
      anterior.map((item) =>
        item.producto.id === productoId
          ? {
              ...item,
              cantidad: nuevaCantidad,
            }
          : item
      )
    );
  };

  const eliminarDelCarrito = (
    productoId
  ) => {
    setCarrito((anterior) =>
      anterior.filter(
        (item) =>
          item.producto.id !== productoId
      )
    );
  };

  const limpiarVenta = () => {
    if (guardando) {
      return;
    }

    setCarrito([]);
    setCliente("");
    setMetodoPago("efectivo");
    setDescuento(0);
    setObservaciones("");
    setBusqueda("");
    setError("");
    setMensaje("");
    setUltimaVenta(null);
  };

  const subtotal = carrito.reduce(
    (total, item) =>
      total +
      Number(
        item.producto.precio_venta || 0
      ) *
        Number(item.cantidad || 0),
    0
  );

  const descuentoNumerico = Math.max(
    Number(descuento) || 0,
    0
  );

  const total = Math.max(
    subtotal - descuentoNumerico,
    0
  );

  const confirmarVenta = async () => {
    if (guardando) {
      return;
    }

    setError("");
    setMensaje("");

    if (carrito.length === 0) {
      setError(
        "Agrega al menos un producto a la venta."
      );

      return;
    }

    if (
      descuentoNumerico > subtotal
    ) {
      setError(
        "El descuento no puede ser mayor que el subtotal."
      );

      return;
    }

    if (
      metodoPago === "credito" &&
      !cliente.trim()
    ) {
      setError(
        "Para una venta a crédito debes indicar el cliente."
      );

      return;
    }

    for (const item of carrito) {
      const productoActual = productos.find(
        (producto) =>
          producto.id === item.producto.id
      );

      if (!productoActual) {
        setError(
          `El producto "${item.producto.nombre}" ya no está disponible.`
        );

        return;
      }

      const stockActual = Number(
        productoActual.stock || 0
      );

      if (
        Number(item.cantidad) >
        stockActual
      ) {
        setError(
          `Stock insuficiente para "${item.producto.nombre}". Disponible: ${stockActual}.`
        );

        return;
      }
    }

    try {
      setGuardando(true);

      const detalles = carrito.map(
        (item) => {
          const precioUnitario =
            Number(
              item.producto.precio_venta || 0
            );

          const cantidad =
            Number(item.cantidad || 0);

          return {
            producto_id:
              item.producto.id,

            nombre_producto:
              item.producto.nombre,

            codigo_producto:
              item.producto.codigo || "",

            unidad_producto:
              item.producto.unidad ||
              "unidad",

            cantidad,

            precio_unitario:
              precioUnitario,

            descuento: 0,

            subtotal:
              precioUnitario *
              cantidad,
          };
        }
      );

      const fechaVenta = new Date();

      const ventaId =
        await procesarVenta({
          cliente:
            cliente.trim(),

          metodoPago,

          subtotal,

          descuento:
            descuentoNumerico,

          total,

          observaciones:
            observaciones.trim(),

          detalles,
        });

      const datosUltimaVenta = {
        id: ventaId,
        fecha: fechaVenta.toISOString(),
        cliente:
          cliente.trim(),
        metodoPago,
        subtotal,
        descuento:
          descuentoNumerico,
        total,
        observaciones:
          observaciones.trim(),
        detalles,
      };

      setUltimaVenta(
        datosUltimaVenta
      );

      setCarrito([]);
      setCliente("");
      setMetodoPago("efectivo");
      setDescuento(0);
      setObservaciones("");
      setBusqueda("");

      await cargarProductos();
      await cargarVentas();

      setMensaje(
        `Venta #${ventaId} registrada correctamente por ${formatoMoneda(total)}.`
      );
    } catch (err) {
      console.error(err);

      let mensajeError =
        "No fue posible registrar la venta.";

      if (err?.message) {
        mensajeError =
          err.message;
      }

      setError(mensajeError);
    } finally {
      setGuardando(false);
    }
  };

  const manejarAnulacionVenta = async (
    venta
  ) => {
    if (
      anulandoVenta ||
      venta.estado === "anulada"
    ) {
      return;
    }

    const confirmar = window.confirm(
      `¿Deseas anular la venta #${venta.id}?\n\nEl inventario será restaurado y la venta quedará registrada como anulada.`
    );

    if (!confirmar) {
      return;
    }

    try {
      setAnulandoVenta(true);
      setError("");
      setMensaje("");

      await anularVenta(venta.id);

      if (
        ventaSeleccionada?.id === venta.id
      ) {
        setVentaSeleccionada(null);
      }

      await cargarProductos();
      await cargarVentas();

      setMensaje(
        `Venta #${venta.id} anulada correctamente. El inventario fue restaurado.`
      );
    } catch (err) {
      console.error(err);

      setError(
        err?.message ||
          "No fue posible anular la venta."
      );
    } finally {
      setAnulandoVenta(false);
    }
  };

  const verDetalleVenta = async (venta) => {
    try {
      setCargandoDetalle(true);
      setError("");

      const detalle =
        await obtenerVentaPorId(
          venta.id
        );

      setVentaSeleccionada(detalle);
    } catch (err) {
      console.error(err);

      setError(
        "No fue posible cargar los detalles de la venta."
      );
    } finally {
      setCargandoDetalle(false);
    }
  };

  const generarPDFUltimaVenta = () => {
    if (!ultimaVenta) {
      return;
    }

    generarComprobanteVentaPDF({
      ventaId: ultimaVenta.id,
      fecha: ultimaVenta.fecha,
      cliente: ultimaVenta.cliente,
      metodoPago:
        ultimaVenta.metodoPago,
      detalles:
        ultimaVenta.detalles,
      subtotal:
        ultimaVenta.subtotal,
      descuento:
        ultimaVenta.descuento,
      total:
        ultimaVenta.total,
      observaciones:
        ultimaVenta.observaciones,
    });
  };

  const generarPDFVenta = async (venta) => {
    try {
      setError("");

      const ventaCompleta =
        await obtenerVentaPorId(
          venta.id
        );

      generarComprobanteVentaPDF({
        ventaId: ventaCompleta.id,
        fecha: ventaCompleta.fecha,
        cliente:
          ventaCompleta.cliente,
        metodoPago:
          ventaCompleta.metodo_pago,
        detalles:
          ventaCompleta.venta_detalles ||
          [],
        subtotal:
          ventaCompleta.subtotal,
        descuento:
          ventaCompleta.descuento,
        total:
          ventaCompleta.total,
        observaciones:
          ventaCompleta.observaciones,
      });
    } catch (err) {
      console.error(err);

      setError(
        "No fue posible generar el comprobante de esta venta."
      );
    }
  };

  return (
    <div>
      {/* ==========================================
          ENCABEZADO
      ========================================== */}

      <div className="page-section-header">
        <div>
          <h2>Ventas</h2>

          <p>
            Registra las ventas y consulta el
            historial de Ferretería 7A.
          </p>
        </div>

        {carrito.length > 0 && (
          <button
            className="secondary-button"
            onClick={limpiarVenta}
            disabled={guardando}
          >
            Limpiar venta
          </button>
        )}
      </div>

      {/* ==========================================
          MENSAJE DE ÉXITO
      ========================================== */}

      {mensaje && (
        <div className="venta-mensaje-exito">
          <span>✓</span>

          <div>
            <strong>
              Operación realizada
            </strong>

            <p>{mensaje}</p>

            {ultimaVenta && (
              <button
                type="button"
                className="secondary-button"
                onClick={
                  generarPDFUltimaVenta
                }
                style={{
                  marginTop: "10px",
                }}
              >
                📄 Generar comprobante PDF
              </button>
            )}
          </div>
        </div>
      )}

      {/* ==========================================
          ERROR
      ========================================== */}

      {error && (
        <div className="venta-mensaje-error">
          <span>!</span>

          <div>
            <strong>
              No se pudo completar la operación
            </strong>

            <p>{error}</p>
          </div>
        </div>
      )}

      {/* ==========================================
          CARGANDO PRODUCTOS
      ========================================== */}

      {cargando && (
        <div className="panel">
          <div className="empty-inventory">
            <div className="empty-icon">
              ⏳
            </div>

            <h3>
              Cargando productos...
            </h3>

            <p>
              Estamos preparando el
              inventario para realizar la
              venta.
            </p>
          </div>
        </div>
      )}

      {/* ==========================================
          NUEVA VENTA
      ========================================== */}

      {!cargando && (
        <>
          <div className="ventas-layout">
            {/* PRODUCTOS */}

            <section className="panel venta-productos-panel">
              <div className="panel-header">
                <div>
                  <h3>
                    Agregar productos
                  </h3>

                  <span>
                    Busca por nombre o código
                  </span>
                </div>
              </div>

              <div className="venta-busqueda">
                <span>🔍</span>

                <input
                  type="text"
                  placeholder="Buscar producto..."
                  value={busqueda}
                  onChange={(e) =>
                    setBusqueda(
                      e.target.value
                    )
                  }
                />
              </div>

              {busqueda.trim() && (
                <div className="resultados-productos">
                  {productosDisponibles.length ===
                  0 ? (
                    <div className="sin-resultados">
                      No encontramos productos
                      con esa búsqueda.
                    </div>
                  ) : (
                    productosDisponibles.map(
                      (producto) => {
                        const stock =
                          Number(
                            producto.stock ||
                              0
                          );

                        const agotado =
                          stock <= 0;

                        return (
                          <button
                            type="button"
                            className={`resultado-producto ${
                              agotado
                                ? "producto-agotado"
                                : ""
                            }`}
                            key={
                              producto.id
                            }
                            onClick={() =>
                              agregarAlCarrito(
                                producto
                              )
                            }
                            disabled={
                              agotado
                            }
                          >
                            <div className="resultado-icon">
                              ▣
                            </div>

                            <div className="resultado-info">
                              <strong>
                                {
                                  producto.nombre
                                }
                              </strong>

                              <span>
                                {producto.codigo
                                  ? `Código: ${producto.codigo}`
                                  : "Sin código"}
                              </span>
                            </div>

                            <div className="resultado-datos">
                              <strong>
                                {formatoMoneda(
                                  Number(
                                    producto.precio_venta ||
                                      0
                                  )
                                )}
                              </strong>

                              <span>
                                Stock:{" "}
                                {formatoCantidad(
                                  stock
                                )}{" "}
                                {textoUnidad(
                                  producto.unidad
                                )}
                              </span>
                            </div>
                          </button>
                        );
                      }
                    )
                  )}
                </div>
              )}

              {!busqueda.trim() && (
                <div className="venta-ayuda">
                  <div className="venta-ayuda-icon">
                    +
                  </div>

                  <h3>
                    Busca un producto para
                    comenzar
                  </h3>

                  <p>
                    Escribe el nombre o código
                    del producto en el
                    buscador.
                  </p>
                </div>
              )}
            </section>

            {/* CARRITO */}

            <section className="panel carrito-panel">
              <div className="panel-header">
                <div>
                  <h3>
                    Carrito de venta
                  </h3>

                  <span>
                    {carrito.length}{" "}
                    producto
                    {carrito.length !== 1
                      ? "s"
                      : ""}
                  </span>
                </div>
              </div>

              {carrito.length === 0 ? (
                <div className="venta-carrito-vacio">
                  <div className="empty-icon">
                    🛒
                  </div>

                  <h3>
                    El carrito está vacío
                  </h3>

                  <p>
                    Agrega productos para
                    preparar una venta.
                  </p>
                </div>
              ) : (
                <>
                  <div className="carrito-lista">
                    {carrito.map(
                      (item) => {
                        const precio =
                          Number(
                            item.producto
                              .precio_venta ||
                              0
                          );

                        const cantidad =
                          Number(
                            item.cantidad ||
                              0
                          );

                        const subtotalProducto =
                          precio *
                          cantidad;

                        return (
                          <div
                            className="carrito-item"
                            key={
                              item.producto
                                .id
                            }
                          >
                            <div className="carrito-producto">
                              <div className="carrito-producto-icon">
                                ▣
                              </div>

                              <div>
                                <strong>
                                  {
                                    item
                                      .producto
                                      .nombre
                                  }
                                </strong>

                                <span>
                                  {formatoMoneda(
                                    precio
                                  )}{" "}
                                  /{" "}
                                  {textoUnidad(
                                    item
                                      .producto
                                      .unidad
                                  )}
                                </span>
                              </div>
                            </div>

                            <div className="carrito-cantidad">
                              <button
                                type="button"
                                onClick={() =>
                                  cambiarCantidad(
                                    item
                                      .producto
                                      .id,
                                    cantidad -
                                      1
                                  )
                                }
                                disabled={
                                  guardando ||
                                  cantidad <=
                                    1
                                }
                              >
                                −
                              </button>

                              <input
                                type="number"
                                min="1"
                                max={Number(
                                  item
                                    .producto
                                    .stock ||
                                    0
                                )}
                                step="0.01"
                                value={
                                  cantidad
                                }
                                disabled={
                                  guardando
                                }
                                onChange={(
                                  e
                                ) =>
                                  cambiarCantidad(
                                    item
                                      .producto
                                      .id,
                                    e.target
                                      .value
                                  )
                                }
                              />

                              <button
                                type="button"
                                onClick={() =>
                                  cambiarCantidad(
                                    item
                                      .producto
                                      .id,
                                    cantidad +
                                      1
                                  )
                                }
                                disabled={
                                  guardando ||
                                  cantidad >=
                                    Number(
                                      item
                                        .producto
                                        .stock ||
                                        0
                                    )
                                }
                              >
                                +
                              </button>
                            </div>

                            <strong className="carrito-subtotal">
                              {formatoMoneda(
                                subtotalProducto
                              )}
                            </strong>

                            <button
                              type="button"
                              className="carrito-eliminar"
                              onClick={() =>
                                eliminarDelCarrito(
                                  item
                                    .producto
                                    .id
                                )
                              }
                              disabled={
                                guardando
                              }
                              title="Eliminar producto"
                            >
                              ×
                            </button>
                          </div>
                        );
                      }
                    )}
                  </div>

                  <div className="venta-datos">
                    <div className="venta-campo">
                      <label htmlFor="cliente">
                        Cliente
                      </label>

                      <input
                        id="cliente"
                        type="text"
                        placeholder="Nombre del cliente"
                        value={cliente}
                        disabled={
                          guardando
                        }
                        onChange={(e) =>
                          setCliente(
                            e.target.value
                          )
                        }
                      />
                    </div>

                    <div className="venta-campo">
                      <label htmlFor="metodo-pago">
                        Método de pago
                      </label>

                      <select
                        id="metodo-pago"
                        value={
                          metodoPago
                        }
                        disabled={
                          guardando
                        }
                        onChange={(e) =>
                          setMetodoPago(
                            e.target.value
                          )
                        }
                      >
                        <option value="efectivo">
                          Efectivo
                        </option>

                        <option value="transferencia">
                          Transferencia
                        </option>

                        <option value="tarjeta">
                          Tarjeta
                        </option>

                        <option value="credito">
                          Crédito
                        </option>
                      </select>
                    </div>

                    <div className="venta-campo">
                      <label htmlFor="descuento">
                        Descuento
                      </label>

                      <input
                        id="descuento"
                        type="number"
                        min="0"
                        step="100"
                        value={
                          descuento
                        }
                        disabled={
                          guardando
                        }
                        onChange={(e) =>
                          setDescuento(
                            e.target.value
                          )
                        }
                      />
                    </div>
                  </div>

                  <div className="venta-campo venta-observaciones">
                    <label htmlFor="observaciones">
                      Observaciones
                    </label>

                    <textarea
                      id="observaciones"
                      placeholder="Observaciones de la venta (opcional)"
                      value={
                        observaciones
                      }
                      disabled={
                        guardando
                      }
                      onChange={(e) =>
                        setObservaciones(
                          e.target.value
                        )
                      }
                      rows="2"
                    />
                  </div>

                  <div className="venta-resumen">
                    <div>
                      <span>
                        Subtotal
                      </span>

                      <strong>
                        {formatoMoneda(
                          subtotal
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Descuento
                      </span>

                      <strong>
                        -{" "}
                        {formatoMoneda(
                          descuentoNumerico
                        )}
                      </strong>
                    </div>

                    <div className="venta-total">
                      <span>
                        Total
                      </span>

                      <strong>
                        {formatoMoneda(
                          total
                        )}
                      </strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="primary-button venta-confirmar"
                    onClick={
                      confirmarVenta
                    }
                    disabled={
                      guardando ||
                      carrito.length ===
                        0
                    }
                  >
                    {guardando
                      ? "Procesando venta..."
                      : "Confirmar venta"}
                  </button>
                </>
              )}
            </section>
          </div>

          {/* ==========================================
              HISTORIAL DE VENTAS
          ========================================== */}

          <section
            className="panel historial-ventas-panel"
            style={{
              marginTop: "20px",
            }}
          >
            <div className="panel-header">
              <div>
                <h3>
                  Historial de ventas
                </h3>

                <span>
                  Todas las ventas registradas
                </span>
              </div>

              <button
                type="button"
                className="secondary-button"
                onClick={cargarVentas}
                disabled={
                  cargandoVentas ||
                  anulandoVenta
                }
              >
                {cargandoVentas
                  ? "Actualizando..."
                  : "Actualizar"}
              </button>
            </div>

            {cargandoVentas ? (
              <div className="historial-ventas-cargando">
                <div className="empty-icon">
                  ⏳
                </div>

                <h3>
                  Cargando ventas...
                </h3>

                <p>
                  Estamos consultando las
                  ventas registradas.
                </p>
              </div>
            ) : ventas.length === 0 ? (
              <div className="historial-ventas-vacio">
                <div className="empty-icon">
                  🧾
                </div>

                <h3>
                  Todavía no hay ventas
                </h3>

                <p>
                  Las ventas que registres
                  aparecerán aquí.
                </p>
              </div>
            ) : (
              <div className="tabla-ventas-contenedor">
                <table className="tabla-ventas">
                  <thead>
                    <tr>
                      <th>Venta</th>
                      <th>Fecha</th>
                      <th>Cliente</th>
                      <th>Pago</th>
                      <th>Total</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>

                  <tbody>
                    {ventas.map(
                      (venta) => {
                        const estaAnulada =
                          venta.estado ===
                          "anulada";

                        return (
                          <tr
                            key={venta.id}
                            className={
                              estaAnulada
                                ? "venta-fila-anulada"
                                : ""
                            }
                          >
                            <td>
                              <strong>
                                #
                                {venta.id}
                              </strong>
                            </td>

                            <td>
                              {formatoFecha(
                                venta.fecha
                              )}
                            </td>

                            <td>
                              {venta.cliente ||
                                "Cliente general"}
                            </td>

                            <td>
                              <span className="venta-metodo">
                                {textoMetodoPago(
                                  venta.metodo_pago
                                )}
                              </span>
                            </td>

                            <td>
                              <strong>
                                {formatoMoneda(
                                  venta.total
                                )}
                              </strong>
                            </td>

                            <td>
                              <span
                                className={`venta-estado ${
                                  estaAnulada
                                    ? "venta-estado-anulada"
                                    : ""
                                }`}
                              >
                                {estaAnulada
                                  ? "Anulada"
                                  : venta.estado ||
                                    "Completada"}
                              </span>
                            </td>

                            <td>
                              <div className="venta-acciones">
                                <button
                                  type="button"
                                  className="venta-accion-btn"
                                  onClick={() =>
                                    verDetalleVenta(
                                      venta
                                    )
                                  }
                                  title="Ver detalles"
                                >
                                  👁
                                </button>

                                <button
                                  type="button"
                                  className="venta-accion-btn"
                                  onClick={() =>
                                    generarPDFVenta(
                                      venta
                                    )
                                  }
                                  title="Generar comprobante PDF"
                                >
                                  📄
                                </button>

                                {!estaAnulada && (
                                  <button
                                    type="button"
                                    className="venta-accion-btn venta-accion-anular"
                                    onClick={() =>
                                      manejarAnulacionVenta(
                                        venta
                                      )
                                    }
                                    disabled={
                                      anulandoVenta
                                    }
                                    title="Anular venta"
                                  >
                                    ↩
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      {/* ==========================================
          MODAL DETALLE DE VENTA
      ========================================== */}

      {ventaSeleccionada && (
        <div
          className="venta-modal-fondo"
          onClick={() =>
            setVentaSeleccionada(null)
          }
        >
          <div
            className="venta-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <div className="venta-modal-header">
              <div>
                <h3>
                  Venta #
                  {ventaSeleccionada.id}
                </h3>

                <span>
                  {formatoFecha(
                    ventaSeleccionada.fecha
                  )}
                </span>
              </div>

              <button
                type="button"
                className="venta-modal-cerrar"
                onClick={() =>
                  setVentaSeleccionada(
                    null
                  )
                }
              >
                ×
              </button>
            </div>

            <div className="venta-modal-info">
              <div>
                <span>Cliente</span>

                <strong>
                  {ventaSeleccionada.cliente ||
                    "Cliente general"}
                </strong>
              </div>

              <div>
                <span>Método de pago</span>

                <strong>
                  {textoMetodoPago(
                    ventaSeleccionada.metodo_pago
                  )}
                </strong>
              </div>

              <div>
                <span>Estado</span>

                <strong>
                  {ventaSeleccionada.estado ===
                  "anulada"
                    ? "Anulada"
                    : ventaSeleccionada.estado ||
                      "Completada"}
                </strong>
              </div>
            </div>

            <div className="venta-detalle-lista">
              <h4>
                Productos vendidos
              </h4>

              {ventaSeleccionada
                .venta_detalles
                ?.length ? (
                ventaSeleccionada.venta_detalles.map(
                  (detalle) => (
                    <div
                      className="venta-detalle-item"
                      key={
                        detalle.id
                      }
                    >
                      <div>
                        <strong>
                          {
                            detalle.nombre_producto
                          }
                        </strong>

                        <span>
                          Código:{" "}
                          {detalle.codigo_producto ||
                            "Sin código"}
                        </span>

                        <span>
                          Cantidad:{" "}
                          {formatoCantidad(
                            detalle.cantidad
                          )}{" "}
                          {textoUnidad(
                            detalle.unidad_producto
                          )}
                        </span>

                        <span>
                          Precio unitario:{" "}
                          {formatoMoneda(
                            detalle.precio_unitario
                          )}
                        </span>
                      </div>

                      <strong>
                        {formatoMoneda(
                          detalle.subtotal
                        )}
                      </strong>
                    </div>
                  )
                )
              ) : (
                <p>
                  No hay detalles disponibles.
                </p>
              )}
            </div>

            <div className="venta-modal-resumen">
              <div>
                <span>
                  Subtotal
                </span>

                <strong>
                  {formatoMoneda(
                    ventaSeleccionada.subtotal
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Descuento
                </span>

                <strong>
                  -{" "}
                  {formatoMoneda(
                    ventaSeleccionada.descuento
                  )}
                </strong>
              </div>

              <div className="venta-modal-total">
                <span>
                  Total
                </span>

                <strong>
                  {formatoMoneda(
                    ventaSeleccionada.total
                  )}
                </strong>
              </div>
            </div>

            {ventaSeleccionada.observaciones && (
              <div className="venta-modal-observaciones">
                <strong>
                  Observaciones
                </strong>

                <p>
                  {
                    ventaSeleccionada.observaciones
                  }
                </p>
              </div>
            )}

            <div className="venta-modal-footer">
              <button
                type="button"
                className="secondary-button"
                onClick={() =>
                  generarPDFVenta(
                    ventaSeleccionada
                  )
                }
              >
                📄 Generar comprobante PDF
              </button>

              {ventaSeleccionada.estado !==
                "anulada" && (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    manejarAnulacionVenta(
                      ventaSeleccionada
                    )
                  }
                  disabled={
                    anulandoVenta
                  }
                >
                  {anulandoVenta
                    ? "Anulando..."
                    : "↩ Anular venta"}
                </button>
              )}

              <button
                type="button"
                className="primary-button"
                onClick={() =>
                  setVentaSeleccionada(
                    null
                  )
                }
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {cargandoDetalle && (
        <div className="venta-detalle-cargando">
          Cargando detalle de la venta...
        </div>
      )}
    </div>
  );
}

export default Ventas;