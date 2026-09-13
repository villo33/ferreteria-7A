import { useEffect, useMemo, useState } from "react";

import {
  obtenerProductos,
} from "../services/productosService";

import {
  obtenerEntradas,
  obtenerEntradaPorId,
  procesarEntrada,
} from "../services/entradasService";

import "../styles/entradas.css";

function Entradas() {
  const [productos, setProductos] = useState([]);
  const [entradas, setEntradas] = useState([]);

  const [busqueda, setBusqueda] = useState("");
  const [carrito, setCarrito] = useState([]);

  const [proveedor, setProveedor] = useState("");
  const [numeroFactura, setNumeroFactura] = useState("");
  const [descuento, setDescuento] = useState(0);
  const [observaciones, setObservaciones] = useState("");

  const [cargando, setCargando] = useState(true);
  const [cargandoEntradas, setCargandoEntradas] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);

  const [entradaSeleccionada, setEntradaSeleccionada] =
    useState(null);

  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [ultimaEntrada, setUltimaEntrada] = useState(null);

  useEffect(() => {
    cargarProductos();
    cargarEntradas();
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

  async function cargarEntradas() {
    try {
      setCargandoEntradas(true);

      const data = await obtenerEntradas();

      setEntradas(data);
    } catch (err) {
      console.error(err);

      setError(
        "No fue posible cargar el historial de entradas."
      );
    } finally {
      setCargandoEntradas(false);
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
      cambiarCantidad(
        producto.id,
        String(
          Number(existente.cantidad || 0) + 1
        )
      );

      setBusqueda("");

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
        precioCompra: String(
          Number(producto.precio_compra || 0)
        ),
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

  function cambiarPrecio(id, precio) {
    setCarrito((actual) =>
      actual.map((item) =>
        item.id === id
          ? {
              ...item,
              precioCompra: precio,
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

  const subtotal = useMemo(() => {
    return carrito.reduce(
      (total, item) => {
        const cantidad =
          Number(item.cantidad) || 0;

        const precio =
          Number(item.precioCompra) || 0;

        return total + cantidad * precio;
      },
      0
    );
  }, [carrito]);

  const descuentoNumerico = Math.max(
    0,
    Number(descuento) || 0
  );

  const total = Math.max(
    0,
    subtotal - descuentoNumerico
  );

  function formatoMoneda(valor) {
    return new Intl.NumberFormat(
      "es-CO",
      {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0,
      }
    ).format(Number(valor || 0));
  }

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
      return "unidad";
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

  async function confirmarEntrada() {
    setError("");
    setMensaje("");

    if (carrito.length === 0) {
      setError(
        "Agrega al menos un producto a la entrada."
      );

      return;
    }

    const productosInvalidos = carrito.some(
      (item) => {
        const cantidad =
          Number(item.cantidad);

        const precio =
          Number(item.precioCompra);

        return (
          !Number.isFinite(cantidad) ||
          cantidad <= 0 ||
          !Number.isFinite(precio) ||
          precio < 0
        );
      }
    );

    if (productosInvalidos) {
      setError(
        "Revisa las cantidades y precios de compra."
      );

      return;
    }

    try {
      setGuardando(true);

      const detalles = carrito.map((item) => {
        const cantidad = Number(
          item.cantidad
        );

        const precioUnitario = Number(
          item.precioCompra
        );

        const subtotalDetalle =
          cantidad * precioUnitario;

        return {
          producto_id: item.id,
          cantidad,
          precio_unitario: precioUnitario,
          descuento: 0,
          subtotal: subtotalDetalle,
          unidad_producto:
            item.unidad || "unidad",
        };
      });

      const entradaId =
        await procesarEntrada({
          proveedor,
          numeroFactura,
          subtotal,
          descuento: descuentoNumerico,
          total,
          observaciones,
          detalles,
        });

      setUltimaEntrada(entradaId);

      setCarrito([]);
      setProveedor("");
      setNumeroFactura("");
      setDescuento(0);
      setObservaciones("");
      setBusqueda("");

      await Promise.all([
        cargarProductos(),
        cargarEntradas(),
      ]);

      setMensaje(
        `Entrada #${entradaId} registrada correctamente. El inventario fue actualizado.`
      );
    } catch (err) {
      console.error(err);

      setError(
        err?.message ||
          "No fue posible registrar la entrada."
      );
    } finally {
      setGuardando(false);
    }
  }

  async function verDetalleEntrada(id) {
    try {
      setCargandoDetalle(true);
      setError("");

      const data =
        await obtenerEntradaPorId(id);

      setEntradaSeleccionada(data);
    } catch (err) {
      console.error(err);

      setError(
        "No fue posible consultar el detalle de la entrada."
      );
    } finally {
      setCargandoDetalle(false);
    }
  }

  return (
    <div className="entradas-page">
      <div className="entradas-header">
        <div>
          <h2>Entradas de mercancía</h2>

          <p>
            Registra compras y aumenta automáticamente
            el inventario.
          </p>
        </div>
      </div>

      {error && (
        <div className="entrada-alerta entrada-alerta-error">
          {error}
        </div>
      )}

      {mensaje && (
        <div className="entrada-alerta entrada-alerta-success">
          {mensaje}
        </div>
      )}

      <section className="entrada-layout">
        <div className="panel entrada-form-panel">
          <div className="panel-header">
            <div>
              <h3>Nueva entrada</h3>

              <span>
                Registra los productos recibidos.
              </span>
            </div>
          </div>

          <div className="entrada-datos-grid">
            <div className="entrada-campo">
              <label>Proveedor</label>

              <input
                type="text"
                value={proveedor}
                onChange={(e) =>
                  setProveedor(e.target.value)
                }
                placeholder="Nombre del proveedor"
              />
            </div>

            <div className="entrada-campo">
              <label>Número de factura</label>

              <input
                type="text"
                value={numeroFactura}
                onChange={(e) =>
                  setNumeroFactura(e.target.value)
                }
                placeholder="Ej. FAC-00125"
              />
            </div>
          </div>

          <div className="entrada-productos">
            <label>Agregar productos</label>

            <div className="entrada-buscador">
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
              <div className="entrada-resultados">
                {cargando ? (
                  <div className="entrada-sin-resultados">
                    Cargando productos...
                  </div>
                ) : productosFiltrados.length === 0 ? (
                  <div className="entrada-sin-resultados">
                    No se encontraron productos.
                  </div>
                ) : (
                  productosFiltrados.map(
                    (producto) => (
                      <button
                        key={producto.id}
                        type="button"
                        className="entrada-resultado"
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
                          {formatoMoneda(
                            producto.precio_compra
                          )}
                        </span>
                      </button>
                    )
                  )
                )}
              </div>
            )}
          </div>

          <div className="entrada-carrito">
            {carrito.length === 0 ? (
              <div className="entrada-carrito-vacio">
                <div className="entrada-vacio-icono">
                  ↓
                </div>

                <strong>
                  No hay productos agregados
                </strong>

                <span>
                  Busca un producto para agregarlo
                  a la entrada.
                </span>
              </div>
            ) : (
              <div className="entrada-tabla-wrapper">
                <table className="entrada-tabla">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Unidad</th>
                      <th>Cantidad</th>
                      <th>Precio compra</th>
                      <th>Total</th>
                      <th></th>
                    </tr>
                  </thead>

                  <tbody>
                    {carrito.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <div className="entrada-producto-nombre">
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
                          <input
                            className="entrada-input-numero"
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={item.cantidad}
                            onChange={(e) =>
                              cambiarCantidad(
                                item.id,
                                e.target.value
                              )
                            }
                          />
                        </td>

                        <td>
                          <input
                            className="entrada-input-precio"
                            type="number"
                            min="0"
                            step="1"
                            value={
                              item.precioCompra
                            }
                            onChange={(e) =>
                              cambiarPrecio(
                                item.id,
                                e.target.value
                              )
                            }
                          />
                        </td>

                        <td>
                          <strong>
                            {formatoMoneda(
                              Number(
                                item.cantidad
                              ) *
                                Number(
                                  item.precioCompra
                                )
                            )}
                          </strong>
                        </td>

                        <td>
                          <button
                            type="button"
                            className="entrada-eliminar"
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
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="entrada-observaciones">
            <label>Observaciones</label>

            <textarea
              value={observaciones}
              onChange={(e) =>
                setObservaciones(
                  e.target.value
                )
              }
              placeholder="Observaciones de la compra..."
              rows="3"
            />
          </div>
        </div>

        <aside className="panel entrada-resumen-panel">
          <div className="panel-header">
            <div>
              <h3>Resumen</h3>

              <span>
                Total de la entrada
              </span>
            </div>
          </div>

          <div className="entrada-resumen-linea">
            <span>Productos</span>

            <strong>
              {carrito.length}
            </strong>
          </div>

          <div className="entrada-resumen-linea">
            <span>Subtotal</span>

            <strong>
              {formatoMoneda(subtotal)}
            </strong>
          </div>

          <div className="entrada-resumen-linea">
            <span>Descuento</span>

            <input
              className="entrada-descuento"
              type="number"
              min="0"
              step="1"
              value={descuento}
              onChange={(e) =>
                setDescuento(
                  e.target.value
                )
              }
            />
          </div>

          <div className="entrada-total">
            <span>Total</span>

            <strong>
              {formatoMoneda(total)}
            </strong>
          </div>

          <button
            type="button"
            className="entrada-btn-guardar"
            onClick={confirmarEntrada}
            disabled={
              guardando ||
              carrito.length === 0
            }
          >
            {guardando
              ? "Registrando..."
              : "Registrar entrada"}
          </button>

          {ultimaEntrada && (
            <div className="entrada-ultima">
              Última entrada registrada:
              <strong>
                #{ultimaEntrada}
              </strong>
            </div>
          )}
        </aside>
      </section>

      <section className="panel entradas-historial">
        <div className="panel-header">
          <div>
            <h3>Historial de entradas</h3>

            <span>
              Compras registradas recientemente.
            </span>
          </div>

          <span>
            {entradas.length} entradas
          </span>
        </div>

        {cargandoEntradas ? (
          <div className="entrada-historial-vacio">
            Cargando historial...
          </div>
        ) : entradas.length === 0 ? (
          <div className="entrada-historial-vacio">
            <strong>
              No hay entradas registradas.
            </strong>

            <span>
              Las compras aparecerán aquí.
            </span>
          </div>
        ) : (
          <div className="entrada-tabla-wrapper">
            <table className="entrada-tabla historial">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Fecha</th>
                  <th>Proveedor</th>
                  <th>Factura</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {entradas.map((entrada) => (
                  <tr key={entrada.id}>
                    <td>
                      <strong>
                        #{entrada.id}
                      </strong>
                    </td>

                    <td>
                      {formatoFecha(
                        entrada.fecha
                      )}
                    </td>

                    <td>
                      {entrada.proveedor ||
                        "Sin proveedor"}
                    </td>

                    <td>
                      {entrada.numero_factura ||
                        "Sin factura"}
                    </td>

                    <td>
                      <strong>
                        {formatoMoneda(
                          entrada.total
                        )}
                      </strong>
                    </td>

                    <td>
                      <span className="entrada-estado">
                        {entrada.estado ||
                          "recibida"}
                      </span>
                    </td>

                    <td>
                      <button
                        type="button"
                        className="entrada-btn-detalle"
                        onClick={() =>
                          verDetalleEntrada(
                            entrada.id
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

      {entradaSeleccionada && (
        <div
          className="entrada-modal-overlay"
          onClick={() =>
            setEntradaSeleccionada(null)
          }
        >
          <div
            className="entrada-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <div className="entrada-modal-header">
              <div>
                <h3>
                  Entrada #
                  {entradaSeleccionada.id}
                </h3>

                <span>
                  {formatoFecha(
                    entradaSeleccionada.fecha
                  )}
                </span>
              </div>

              <button
                type="button"
                className="entrada-modal-cerrar"
                onClick={() =>
                  setEntradaSeleccionada(null)
                }
              >
                ×
              </button>
            </div>

            {cargandoDetalle ? (
              <div className="entrada-modal-cargando">
                Cargando detalle...
              </div>
            ) : (
              <>
                <div className="entrada-modal-datos">
                  <div>
                    <span>Proveedor</span>

                    <strong>
                      {entradaSeleccionada.proveedor ||
                        "Sin proveedor"}
                    </strong>
                  </div>

                  <div>
                    <span>Factura</span>

                    <strong>
                      {entradaSeleccionada.numero_factura ||
                        "Sin factura"}
                    </strong>
                  </div>
                </div>

                <div className="entrada-modal-tabla">
                  <table className="entrada-tabla">
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th>Cantidad</th>
                        <th>Unidad</th>
                        <th>Precio</th>
                        <th>Total</th>
                      </tr>
                    </thead>

                    <tbody>
                      {(
                        entradaSeleccionada.entrada_detalles ||
                        []
                      ).map((detalle) => (
                        <tr key={detalle.id}>
                          <td>
                            <div className="entrada-producto-nombre">
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
                              detalle.cantidad
                            )}
                          </td>

                          <td>
                            {textoUnidad(
                              detalle.unidad_producto
                            )}
                          </td>

                          <td>
                            {formatoMoneda(
                              detalle.precio_unitario
                            )}
                          </td>

                          <td>
                            <strong>
                              {formatoMoneda(
                                detalle.subtotal
                              )}
                            </strong>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="entrada-modal-total">
                  <span>Total</span>

                  <strong>
                    {formatoMoneda(
                      entradaSeleccionada.total
                    )}
                  </strong>
                </div>

                {entradaSeleccionada.observaciones && (
                  <div className="entrada-modal-observaciones">
                    <span>
                      Observaciones
                    </span>

                    <p>
                      {
                        entradaSeleccionada.observaciones
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

export default Entradas;