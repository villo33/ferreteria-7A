import { useEffect, useMemo, useState } from "react";
import {
  obtenerProductos,
  desactivarProducto,
} from "../services/productosService";
import ModalProducto from "../components/ModalProducto";

function Inventario() {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState("");
  const [estado, setEstado] = useState("");

  const [mostrarModal, setMostrarModal] = useState(false);
  const [productoEditar, setProductoEditar] = useState(null);

  const [desactivando, setDesactivando] = useState(null);

  useEffect(() => {
    cargarProductos();
  }, []);

  async function cargarProductos() {
    try {
      setCargando(true);
      setError("");

      const datos = await obtenerProductos();

      setProductos(datos);
    } catch (err) {
      console.error(err);
      setError("No fue posible cargar los productos.");
    } finally {
      setCargando(false);
    }
  }

  const categorias = useMemo(() => {
    return [
      ...new Set(
        productos
          .map((producto) => producto.categoria)
          .filter(Boolean)
      ),
    ].sort();
  }, [productos]);

  const productosFiltrados = useMemo(() => {
    return productos.filter((producto) => {
      const texto = busqueda.trim().toLowerCase();

      const coincideBusqueda =
        !texto ||
        producto.nombre?.toLowerCase().includes(texto) ||
        producto.codigo?.toLowerCase().includes(texto) ||
        producto.marca?.toLowerCase().includes(texto);

      const coincideCategoria =
        !categoria ||
        producto.categoria === categoria;

      let coincideEstado = true;

      const stock = Number(producto.stock || 0);
      const stockMinimo = Number(
        producto.stock_minimo || 0
      );

      if (estado === "Disponible") {
        coincideEstado = stock > stockMinimo;
      }

      if (estado === "Stock bajo") {
        coincideEstado =
          stock > 0 && stock <= stockMinimo;
      }

      if (estado === "Agotado") {
        coincideEstado = stock <= 0;
      }

      return (
        coincideBusqueda &&
        coincideCategoria &&
        coincideEstado
      );
    });
  }, [productos, busqueda, categoria, estado]);

  const totalProductos = productos.length;

  const productosStockBajo = productos.filter(
    (producto) => {
      const stock = Number(producto.stock || 0);

      const minimo = Number(
        producto.stock_minimo || 0
      );

      return stock > 0 && stock <= minimo;
    }
  ).length;

  const productosAgotados = productos.filter(
    (producto) =>
      Number(producto.stock || 0) <= 0
  ).length;

  const valorInventario = productos.reduce(
    (total, producto) =>
      total +
      Number(producto.precio_compra || 0) *
        Number(producto.stock || 0),
    0
  );

  const formatoMoneda = (valor) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(valor);
  };

  const agregarProducto = (nuevoProducto) => {
    setProductos((anteriores) => [
      nuevoProducto,
      ...anteriores,
    ]);
  };

  const abrirNuevoProducto = () => {
    setProductoEditar(null);
    setMostrarModal(true);
  };

  const abrirEditarProducto = (producto) => {
    setProductoEditar(producto);
    setMostrarModal(true);
  };

  const cerrarModal = () => {
    setMostrarModal(false);
    setProductoEditar(null);
  };

  const productoActualizado = (productoActualizado) => {
    setProductos((anteriores) =>
      anteriores.map((producto) =>
        producto.id === productoActualizado.id
          ? productoActualizado
          : producto
      )
    );
  };

  const manejarDesactivar = async (producto) => {
    const confirmar = window.confirm(
      `¿Deseas desactivar el producto "${producto.nombre}"?\n\nEl producto dejará de aparecer en el inventario, pero no será eliminado de la base de datos.`
    );

    if (!confirmar) {
      return;
    }

    try {
      setDesactivando(producto.id);

      await desactivarProducto(producto.id);

      setProductos((anteriores) =>
        anteriores.filter(
          (item) => item.id !== producto.id
        )
      );
    } catch (err) {
      console.error(err);

      window.alert(
        "No fue posible desactivar el producto."
      );
    } finally {
      setDesactivando(null);
    }
  };

  return (
    <div>
      <div className="page-section-header">
        <div>
          <h2>Inventario</h2>

          <p>
            Administra los productos y el stock de
            Ferretería 7A.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={abrirNuevoProducto}
        >
          + Nuevo producto
        </button>
      </div>

      <div className="inventory-toolbar">
        <div className="search-box">
          🔍

          <input
            type="text"
            placeholder="Buscar producto..."
            value={busqueda}
            onChange={(e) =>
              setBusqueda(e.target.value)
            }
          />
        </div>

        <select
          className="filter-select"
          value={categoria}
          onChange={(e) =>
            setCategoria(e.target.value)
          }
        >
          <option value="">
            Todas las categorías
          </option>

          {categorias.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <select
          className="filter-select"
          value={estado}
          onChange={(e) =>
            setEstado(e.target.value)
          }
        >
          <option value="">
            Todos los estados
          </option>

          <option value="Disponible">
            Disponible
          </option>

          <option value="Stock bajo">
            Stock bajo
          </option>

          <option value="Agotado">
            Agotado
          </option>
        </select>
      </div>

      <div className="inventory-stats">
        <div className="mini-stat">
          <span>PRODUCTOS</span>
          <strong>{totalProductos}</strong>
        </div>

        <div className="mini-stat">
          <span>STOCK BAJO</span>
          <strong>{productosStockBajo}</strong>
        </div>

        <div className="mini-stat">
          <span>AGOTADOS</span>
          <strong>{productosAgotados}</strong>
        </div>

        <div className="mini-stat">
          <span>VALOR INVENTARIO</span>

          <strong>
            {formatoMoneda(valorInventario)}
          </strong>
        </div>
      </div>

      <div className="panel inventory-panel">
        <div className="panel-header">
          <div>
            <h3>Productos registrados</h3>

            <span>
              {productos.length} producto
              {productos.length !== 1 ? "s" : ""} activo
              {productos.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {cargando && (
          <div className="empty-inventory">
            <div className="empty-icon">
              ⏳
            </div>

            <h3>Cargando inventario...</h3>

            <p>
              Estamos consultando los productos
              registrados en Supabase.
            </p>
          </div>
        )}

        {!cargando && error && (
          <div className="empty-inventory">
            <div className="empty-icon">
              ⚠
            </div>

            <h3>
              No se pudo cargar el inventario
            </h3>

            <p>{error}</p>

            <button
              className="primary-button"
              onClick={cargarProductos}
            >
              Intentar nuevamente
            </button>
          </div>
        )}

        {!cargando &&
          !error &&
          productosFiltrados.length === 0 && (
            <div className="empty-inventory">
              <div className="empty-icon">
                📦
              </div>

              <h3>
                {productos.length === 0
                  ? "No hay productos registrados"
                  : "No encontramos productos"}
              </h3>

              <p>
                {productos.length === 0
                  ? "Cuando agreguemos productos, aparecerán aquí junto con su stock, precio y categoría."
                  : "Prueba cambiando la búsqueda o los filtros seleccionados."}
              </p>

              {productos.length === 0 && (
                <button
                  className="primary-button"
                  onClick={abrirNuevoProducto}
                >
                  + Agregar primer producto
                </button>
              )}
            </div>
          )}

        {!cargando &&
          !error &&
          productosFiltrados.length > 0 && (
            <div className="productos-tabla">
              <div className="productos-encabezado">
                <span>PRODUCTO</span>
                <span>CATEGORÍA</span>
                <span>STOCK</span>
                <span>PRECIO VENTA</span>
                <span>ESTADO</span>
                <span>ACCIONES</span>
              </div>

              {productosFiltrados.map((producto) => {
                const stock = Number(
                  producto.stock || 0
                );

                const stockMinimo = Number(
                  producto.stock_minimo || 0
                );

                let estadoProducto =
                  "Disponible";

                if (stock <= 0) {
                  estadoProducto = "Agotado";
                } else if (
                  stock <= stockMinimo
                ) {
                  estadoProducto = "Stock bajo";
                }

                return (
                  <div
                    className="producto-fila"
                    key={producto.id}
                  >
                    <div>
                      <strong>
                        {producto.nombre}
                      </strong>

                      <span>
                        {producto.codigo
                          ? `Código: ${producto.codigo}`
                          : "Sin código"}
                      </span>
                    </div>

                    <div>
                      <span>Categoría</span>

                      <strong>
                        {producto.categoria ||
                          "Sin categoría"}
                      </strong>
                    </div>

                    <div>
                      <span>Stock</span>

                      <strong>
                        {stock}{" "}
                        {producto.unidad || ""}
                      </strong>
                    </div>

                    <div>
                      <span>Precio venta</span>

                      <strong>
                        {formatoMoneda(
                          Number(
                            producto.precio_venta || 0
                          )
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>Estado</span>

                      <strong
                        className={`estado-producto estado-${estadoProducto
                          .toLowerCase()
                          .replace(" ", "-")}`}
                      >
                        {estadoProducto}
                      </strong>
                    </div>

                    <div className="producto-acciones">
                      <button
                        type="button"
                        className="accion-editar"
                        onClick={() =>
                          abrirEditarProducto(
                            producto
                          )
                        }
                        title="Editar producto"
                      >
                        ✎
                      </button>

                      <button
                        type="button"
                        className="accion-desactivar"
                        onClick={() =>
                          manejarDesactivar(
                            producto
                          )
                        }
                        disabled={
                          desactivando ===
                          producto.id
                        }
                        title="Desactivar producto"
                      >
                        {desactivando ===
                        producto.id
                          ? "..."
                          : "×"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
      </div>

      {mostrarModal && (
        <ModalProducto
          cerrar={cerrarModal}
          productoCreado={agregarProducto}
          productoEditar={productoEditar}
          productoActualizado={
            productoActualizado
          }
        />
      )}
    </div>
  );
}

export default Inventario;