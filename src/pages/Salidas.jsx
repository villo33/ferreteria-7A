import { useEffect, useMemo, useState } from "react";

import {
  obtenerProductos,
} from "../services/productosService";

import {
  obtenerSalidas,
  obtenerSalidaPorId,
  procesarSalida,
} from "../services/salidasService";

import "../styles/salidas.css";

function Salidas() {
  const [productos, setProductos] = useState([]);
  const [salidas, setSalidas] = useState([]);

  const [busqueda, setBusqueda] = useState("");
  const [carrito, setCarrito] = useState([]);

  const [tipo, setTipo] = useState("ajuste");
  const [responsable, setResponsable] = useState("");
  const [observaciones, setObservaciones] = useState("");

  const [cargando, setCargando] = useState(true);
  const [cargandoSalidas, setCargandoSalidas] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);

  const [salidaSeleccionada, setSalidaSeleccionada] =
    useState(null);

  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [ultimaSalida, setUltimaSalida] = useState(null);

  const tiposSalida = [
    {
      valor: "dañado",
      nombre: "Producto dañado",
    },
    {
      valor: "perdida",
      nombre: "Pérdida",
    },
    {
      valor: "uso_interno",
      nombre: "Uso interno",
    },
    {
      valor: "devolucion_proveedor",
      nombre: "Devolución a proveedor",
    },
    {
      valor: "ajuste",
      nombre: "Ajuste de inventario",
    },
    {
      valor: "muestra",
      nombre: "Muestra / regalo",
    },
  ];

  useEffect(() => {
    cargarProductos();
    cargarSalidas();
  }, []);

  async function cargarProductos() {
    try {
      setCargando(true);
      setError("");

      const data = await obtenerProductos();

      setProductos(data);
    } catch (err) {
      console.error(err);

      setError(
        "No fue posible cargar los productos."
      );
    } finally {
      setCargando(false);
    }
  }

  async function cargarSalidas() {
    try {
      setCargandoSalidas(true);

      const data = await obtenerSalidas();

      setSalidas(data);
    } catch (err) {
      console.error(err);

      setError(
        "No fue posible cargar el historial de salidas."
      );
    } finally {
      setCargandoSalidas(false);
    }
  }

  const productosFiltrados = useMemo(() => {
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

        const categoria =
          producto.categoria?.toLowerCase() || "";

        return (
          nombre.includes(texto) ||
          codigo.includes(texto) ||
          categoria.includes(texto)
        );
      })
      .slice(0, 10);
  }, [productos, busqueda]);

  function agregarProducto(producto) {
    setMensaje("");
    setError("");

    const existente = carrito.find(
      (item) => item.id === producto.id
    );

    if (existente) {
      const cantidadActual =
        Number(existente.cantidad) || 0;

      const stockDisponible =
        Number(producto.stock) || 0;

      if (
        cantidadActual + 1 >
        stockDisponible
      ) {
        setError(
          `No puedes superar el stock disponible de ${producto.nombre}.`
        );

        return;
      }

      cambiarCantidad(
        producto.id,
        String(cantidadActual + 1)
      );

      setBusqueda("");

      return;
    }

    const stockDisponible =
      Number(producto.stock) || 0;

    if (stockDisponible <= 0) {
      setError(
        `${producto.nombre} no tiene stock disponible.`
      );

      return;
    }

    setCarrito((actual) => [
      ...actual,
      {
        id: producto.id,
        nombre: producto.nombre,
        codigo: producto.codigo,
        unidad: producto.unidad || "unidad",
        cantidad: "1",
        stock: stockDisponible,
      },
    ]);

    setBusqueda("");
  }

  function cambiarCantidad(id, cantidad) {
    setCarrito((actual) =>
      actual.map((item) =>
        item.id === id
          ? {
              ...item,
              cantidad,
            }
          : item
      )
    );
  }

  function eliminarProducto(id) {
    setCarrito((actual) =>
      actual.filter(
        (item) => item.id !== id
      )
    );
  }

  const cantidadTotal = useMemo(() => {
    return carrito.reduce(
      (total, item) =>
        total +
        (Number(item.cantidad) || 0),
      0
    );
  }, [carrito]);

  function formatoCantidad(valor) {
    return new Intl.NumberFormat(
      "es-CO",
      {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }
    ).format(Number(valor || 0));
  }

  function formatoFecha(fecha) {
    if (!fecha) {
      return "";
    }

    return new Intl.DateTimeFormat(
      "es-CO",
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    ).format(new Date(fecha));
  }

  function textoUnidad(unidad) {
    if (!unidad) {
      return "Unidad";
    }

    const unidades = {
      unidad: "Unidad",
      metro: "Metro",
      kilo: "Kilo",
      caja: "Caja",
      galon: "Galón",
      litro: "Litro",
      bulto: "Bulto",
      rollo: "Rollo",
      par: "Par",
    };

    return (
      unidades[unidad.toLowerCase()] ||
      unidad
    );
  }

  function nombreTipoSalida(valor) {
    const tipoEncontrado =
      tiposSalida.find(
        (item) => item.valor === valor
      );

    return (
      tipoEncontrado?.nombre ||
      valor ||
      "Salida"
    );
  }

  async function confirmarSalida() {
    setError("");
    setMensaje("");

    if (carrito.length === 0) {
      setError(
        "Agrega al menos un producto a la salida."
      );

      return;
    }

    const productosInvalidos =
      carrito.some((item) => {
        const cantidad =
          Number(item.cantidad);

        const stock =
          Number(item.stock);

        return (
          !Number.isFinite(cantidad) ||
          cantidad <= 0 ||
          cantidad > stock
        );
      });

    if (productosInvalidos) {
      setError(
        "Revisa las cantidades. No puedes retirar más productos de los disponibles."
      );

      return;
    }

    try {
      setGuardando(true);

      const detalles = carrito.map((item) => ({
        producto_id: item.id,
        cantidad: Number(item.cantidad),
        motivo: tipo,
      }));

      const salidaId =
        await procesarSalida({
          tipo,
          responsable,
          observaciones,
          detalles,
        });

      setUltimaSalida(salidaId);

      setCarrito([]);
      setTipo("ajuste");
      setResponsable("");
      setObservaciones("");
      setBusqueda("");

      await Promise.all([
        cargarProductos(),
        cargarSalidas(),
      ]);

      setMensaje(
        `Salida #${salidaId} registrada correctamente. El inventario fue actualizado.`
      );
    } catch (err) {
      console.error(err);

      setError(
        err?.message ||
          "No fue posible registrar la salida."
      );
    } finally {
      setGuardando(false);
    }
  }

  async function verDetalleSalida(id) {
    try {
      setCargandoDetalle(true);
      setError("");

      const data =
        await obtenerSalidaPorId(id);

      setSalidaSeleccionada(data);
    } catch (err) {
      console.error(err);

      setError(
        "No fue posible consultar el detalle de la salida."
      );
    } finally {
      setCargandoDetalle(false);
    }
  }

  return (
    <div className="salidas-page">
      <div className="salidas-header">
        <div>
          <h2>Salidas de mercancía</h2>

          <p>
            Registra retiros y descuenta automáticamente
            el inventario.
          </p>
        </div>
      </div>

      {error && (
        <div className="salida-alerta salida-alerta-error">
          {error}
        </div>
      )}

      {mensaje && (
        <div className="salida-alerta salida-alerta-success">
          {mensaje}
        </div>
      )}

      <section className="salida-layout">
        <div className="panel salida-form-panel">
          <div className="panel-header">
            <div>
              <h3>Nueva salida</h3>

              <span>
                Selecciona el motivo y los productos que
                salen del inventario.
              </span>
            </div>
          </div>

          <div className="salida-datos-grid">
            <div className="salida-campo">
              <label>Tipo de salida</label>

              <select
                value={tipo}
                onChange={(e) =>
                  setTipo(e.target.value)
                }
              >
                {tiposSalida.map((item) => (
                  <option
                    key={item.valor}
                    value={item.valor}
                  >
                    {item.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="salida-campo">
              <label>Responsable</label>

              <input
                type="text"
                value={responsable}
                onChange={(e) =>
                  setResponsable(
                    e.target.value
                  )
                }
                placeholder="Nombre del responsable"
              />
            </div>
          </div>

          <div className="salida-productos">
            <label>Agregar productos</label>

            <div className="salida-buscador">
              <input
                type="text"
                value={busqueda}
                onChange={(e) =>
                  setBusqueda(e.target.value)
                }
                placeholder="Buscar por nombre, código o categoría..."
              />
            </div>

            {busqueda.trim() && (
              <div className="salida-resultados">
                {cargando ? (
                  <div className="salida-sin-resultados">
                    Cargando productos...
                  </div>
                ) : productosFiltrados.length === 0 ? (
                  <div className="salida-sin-resultados">
                    No se encontraron productos.
                  </div>
                ) : (
                  productosFiltrados.map(
                    (producto) => (
                      <button
                        key={producto.id}
                        type="button"
                        className="salida-resultado"
                        onClick={() =>
                          agregarProducto(
                            producto
                          )
                        }
                      >
                        <div>
                          <strong>
                            {producto.nombre}
                          </strong>

                          <span>
                            {producto.codigo ||
                              "Sin código"}
                            {" · "}
                            {textoUnidad(
                              producto.unidad
                            )}
                          </span>
                        </div>

                        <span>
                          Stock:{" "}
                          {formatoCantidad(
                            producto.stock
                          )}
                        </span>
                      </button>
                    )
                  )
                )}
              </div>
            )}
          </div>

          <div className="salida-carrito">
            {carrito.length === 0 ? (
              <div className="salida-carrito-vacio">
                <div className="salida-vacio-icono">
                  ↑
                </div>

                <strong>
                  No hay productos agregados
                </strong>

                <span>
                  Busca un producto para agregarlo
                  a la salida.
                </span>
              </div>
            ) : (
              <div className="salida-tabla-wrapper">
                <table className="salida-tabla">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Unidad</th>
                      <th>Stock</th>
                      <th>Cantidad</th>
                      <th>Stock final</th>
                      <th></th>
                    </tr>
                  </thead>

                  <tbody>
                    {carrito.map((item) => {
                      const cantidad =
                        Number(
                          item.cantidad
                        ) || 0;

                      const stock =
                        Number(
                          item.stock
                        ) || 0;

                      const stockFinal =
                        Math.max(
                          0,
                          stock - cantidad
                        );

                      return (
                        <tr key={item.id}>
                          <td>
                            <div className="salida-producto-nombre">
                              <strong>
                                {item.nombre}
                              </strong>

                              <span>
                                {item.codigo ||
                                  "Sin código"}
                              </span>
                            </div>
                          </td>

                          <td>
                            {textoUnidad(
                              item.unidad
                            )}
                          </td>

                          <td>
                            <span className="salida-stock-disponible">
                              {formatoCantidad(
                                stock
                              )}
                            </span>
                          </td>

                          <td>
                            <input
                              className="salida-input-numero"
                              type="text"
                              inputMode="decimal"
                              value={
                                item.cantidad
                              }
                              onChange={(e) =>
                                cambiarCantidad(
                                  item.id,
                                  e.target.value
                                    .replace(
                                      ",",
                                      "."
                                    )
                                    .replace(
                                      /[^0-9.]/g,
                                      ""
                                    )
                                )
                              }
                            />
                          </td>

                          <td>
                            <strong
                              className={
                                stockFinal === 0
                                  ? "salida-stock-cero"
                                  : ""
                              }
                            >
                              {formatoCantidad(
                                stockFinal
                              )}
                            </strong>
                          </td>

                          <td>
                            <button
                              type="button"
                              className="salida-eliminar"
                              onClick={() =>
                                eliminarProducto(
                                  item.id
                                )
                              }
                              title="Eliminar producto"
                            >
                              ×
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="salida-observaciones">
            <label>Observaciones</label>

            <textarea
              value={observaciones}
              onChange={(e) =>
                setObservaciones(
                  e.target.value
                )
              }
              placeholder="Observaciones de la salida..."
              rows="3"
            />
          </div>
        </div>

        <aside className="panel salida-resumen-panel">
          <div className="panel-header">
            <div>
              <h3>Resumen</h3>

              <span>
                Productos que saldrán
              </span>
            </div>
          </div>

          <div className="salida-resumen-linea">
            <span>Productos</span>

            <strong>
              {carrito.length}
            </strong>
          </div>

          <div className="salida-resumen-linea">
            <span>Cantidad total</span>

            <strong>
              {formatoCantidad(
                cantidadTotal
              )}
            </strong>
          </div>

          <div className="salida-tipo-resumen">
            <span>Motivo</span>

            <strong>
              {nombreTipoSalida(tipo)}
            </strong>
          </div>

          <div className="salida-total">
            <span>Stock será actualizado</span>

            <strong>
              Automáticamente
            </strong>
          </div>

          <button
            type="button"
            className="salida-btn-guardar"
            onClick={confirmarSalida}
            disabled={
              guardando ||
              carrito.length === 0
            }
          >
            {guardando
              ? "Registrando..."
              : "Registrar salida"}
          </button>

          {ultimaSalida && (
            <div className="salida-ultima">
              Última salida registrada:

              <strong>
                #{ultimaSalida}
              </strong>
            </div>
          )}
        </aside>
      </section>

      <section className="panel salidas-historial">
        <div className="panel-header">
          <div>
            <h3>Historial de salidas</h3>

            <span>
              Retiros registrados recientemente.
            </span>
          </div>

          <span>
            {salidas.length} salidas
          </span>
        </div>

        {cargandoSalidas ? (
          <div className="salida-historial-vacio">
            Cargando historial...
          </div>
        ) : salidas.length === 0 ? (
          <div className="salida-historial-vacio">
            <strong>
              No hay salidas registradas.
            </strong>

            <span>
              Los retiros aparecerán aquí.
            </span>
          </div>
        ) : (
          <div className="salida-tabla-wrapper">
            <table className="salida-tabla historial">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th>Responsable</th>
                  <th>Observaciones</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {salidas.map((salida) => (
                  <tr key={salida.id}>
                    <td>
                      <strong>
                        #{salida.id}
                      </strong>
                    </td>

                    <td>
                      {formatoFecha(
                        salida.fecha
                      )}
                    </td>

                    <td>
                      <span className="salida-estado">
                        {nombreTipoSalida(
                          salida.tipo
                        )}
                      </span>
                    </td>

                    <td>
                      {salida.responsable ||
                        "Sin responsable"}
                    </td>

                    <td>
                      {salida.observaciones ||
                        "Sin observaciones"}
                    </td>

                    <td>
                      <button
                        type="button"
                        className="salida-btn-detalle"
                        onClick={() =>
                          verDetalleSalida(
                            salida.id
                          )
                        }
                      >
                        Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {salidaSeleccionada && (
        <div
          className="salida-modal-overlay"
          onClick={() =>
            setSalidaSeleccionada(null)
          }
        >
          <div
            className="salida-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <div className="salida-modal-header">
              <div>
                <h3>
                  Salida #
                  {salidaSeleccionada.id}
                </h3>

                <span>
                  {formatoFecha(
                    salidaSeleccionada.fecha
                  )}
                </span>
              </div>

              <button
                type="button"
                className="salida-modal-cerrar"
                onClick={() =>
                  setSalidaSeleccionada(null)
                }
              >
                ×
              </button>
            </div>

            {cargandoDetalle ? (
              <div className="salida-modal-cargando">
                Cargando detalle...
              </div>
            ) : (
              <>
                <div className="salida-modal-datos">
                  <div>
                    <span>Tipo</span>

                    <strong>
                      {nombreTipoSalida(
                        salidaSeleccionada.tipo
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>Responsable</span>

                    <strong>
                      {salidaSeleccionada.responsable ||
                        "Sin responsable"}
                    </strong>
                  </div>
                </div>

                <div className="salida-modal-tabla">
                  <table className="salida-tabla">
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th>Stock anterior</th>
                        <th>Cantidad</th>
                        <th>Stock nuevo</th>
                        <th>Unidad</th>
                      </tr>
                    </thead>

                    <tbody>
                      {(
                        salidaSeleccionada.salida_detalles ||
                        []
                      ).map((detalle) => (
                        <tr key={detalle.id}>
                          <td>
                            <div className="salida-producto-nombre">
                              <strong>
                                {
                                  detalle.nombre_producto
                                }
                              </strong>

                              <span>
                                {detalle.codigo_producto ||
                                  "Sin código"}
                              </span>
                            </div>
                          </td>

                          <td>
                            {formatoCantidad(
                              detalle.stock_anterior
                            )}
                          </td>

                          <td>
                            <strong>
                              {formatoCantidad(
                                detalle.cantidad
                              )}
                            </strong>
                          </td>

                          <td>
                            {formatoCantidad(
                              detalle.stock_nuevo
                            )}
                          </td>

                          <td>
                            {textoUnidad(
                              detalle.unidad_producto
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="salida-modal-total">
                  <span>
                    Cantidad total
                  </span>

                  <strong>
                    {formatoCantidad(
                      (
                        salidaSeleccionada.salida_detalles ||
                        []
                      ).reduce(
                        (total, detalle) =>
                          total +
                          Number(
                            detalle.cantidad ||
                              0
                          ),
                        0
                      )
                    )}
                  </strong>
                </div>

                {salidaSeleccionada.observaciones && (
                  <div className="salida-modal-observaciones">
                    <span>
                      Observaciones
                    </span>

                    <p>
                      {
                        salidaSeleccionada.observaciones
                      }
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Salidas;