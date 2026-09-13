import { useEffect, useState } from "react";
import {
  crearProducto,
  actualizarProducto,
} from "../services/productosService";

function ModalProducto({
  cerrar,
  productoCreado,
  productoEditar,
  productoActualizado,
}) {
  const [formulario, setFormulario] = useState({
    codigo: "",
    nombre: "",
    categoria: "",
    marca: "",
    unidad: "unidad",
    precio_compra: "",
    precio_venta: "",
    stock: "",
    stock_minimo: "",
    proveedor: "",
    ubicacion: "",
  });

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const modoEdicion = Boolean(productoEditar);

  useEffect(() => {
    if (productoEditar) {
      setFormulario({
        codigo: productoEditar.codigo || "",
        nombre: productoEditar.nombre || "",
        categoria: productoEditar.categoria || "",
        marca: productoEditar.marca || "",
        unidad: productoEditar.unidad || "unidad",
        precio_compra:
          productoEditar.precio_compra ?? "",
        precio_venta:
          productoEditar.precio_venta ?? "",
        stock: productoEditar.stock ?? "",
        stock_minimo:
          productoEditar.stock_minimo ?? "",
        proveedor: productoEditar.proveedor || "",
        ubicacion: productoEditar.ubicacion || "",
      });
    } else {
      setFormulario({
        codigo: "",
        nombre: "",
        categoria: "",
        marca: "",
        unidad: "unidad",
        precio_compra: "",
        precio_venta: "",
        stock: "",
        stock_minimo: "",
        proveedor: "",
        ubicacion: "",
      });
    }

    setError("");
  }, [productoEditar]);

  const cambiarCampo = (e) => {
    const { name, value } = e.target;

    setFormulario((anterior) => ({
      ...anterior,
      [name]: value,
    }));
  };

  const guardarProducto = async (e) => {
    e.preventDefault();

    setError("");

    if (!formulario.nombre.trim()) {
      setError(
        "El nombre del producto es obligatorio."
      );
      return;
    }

    if (!formulario.unidad) {
      setError(
        "Selecciona la unidad del producto."
      );
      return;
    }

    try {
      setGuardando(true);

      const producto = {
        codigo:
          formulario.codigo.trim() || null,

        nombre:
          formulario.nombre.trim(),

        categoria:
          formulario.categoria.trim() || null,

        marca:
          formulario.marca.trim() || null,

        unidad:
          formulario.unidad,

        precio_compra:
          Number(formulario.precio_compra) || 0,

        precio_venta:
          Number(formulario.precio_venta) || 0,

        stock:
          Number(formulario.stock) || 0,

        stock_minimo:
          Number(formulario.stock_minimo) || 0,

        proveedor:
          formulario.proveedor.trim() || null,

        ubicacion:
          formulario.ubicacion.trim() || null,

        activo: true,
      };

      if (modoEdicion) {
        const productoGuardado =
          await actualizarProducto(
            productoEditar.id,
            producto
          );

        productoActualizado(productoGuardado);
      } else {
        const nuevoProducto =
          await crearProducto(producto);

        productoCreado(nuevoProducto);
      }

      cerrar();
    } catch (err) {
      console.error(err);

      setError(
        modoEdicion
          ? "No fue posible actualizar el producto. Verifica la conexión con Supabase."
          : "No fue posible guardar el producto. Verifica la conexión con Supabase."
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={cerrar}
    >
      <div
        className="modal-producto"
        onClick={(e) =>
          e.stopPropagation()
        }
      >
        <div className="modal-header">
          <div>
            <h2>
              {modoEdicion
                ? "Editar producto"
                : "Nuevo producto"}
            </h2>

            <p>
              {modoEdicion
                ? "Actualiza la información del producto en el inventario de Ferretería 7A."
                : "Registra un producto en el inventario de Ferretería 7A."}
            </p>
          </div>

          <button
            type="button"
            className="modal-close"
            onClick={cerrar}
            disabled={guardando}
          >
            ×
          </button>
        </div>

        <form
          className="producto-form"
          onSubmit={guardarProducto}
        >
          <div className="form-section">
            <h3>
              Información del producto
            </h3>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="codigo">
                  Código / SKU
                </label>

                <input
                  id="codigo"
                  name="codigo"
                  type="text"
                  placeholder="Ej. FER-001"
                  value={formulario.codigo}
                  onChange={cambiarCampo}
                />
              </div>

              <div className="form-group form-group-large">
                <label htmlFor="nombre">
                  Nombre del producto *
                </label>

                <input
                  id="nombre"
                  name="nombre"
                  type="text"
                  placeholder="Ej. Martillo de 16 oz"
                  value={formulario.nombre}
                  onChange={cambiarCampo}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="categoria">
                  Categoría
                </label>

                <input
                  id="categoria"
                  name="categoria"
                  type="text"
                  placeholder="Ej. Herramientas"
                  value={formulario.categoria}
                  onChange={cambiarCampo}
                />
              </div>

              <div className="form-group">
                <label htmlFor="marca">
                  Marca
                </label>

                <input
                  id="marca"
                  name="marca"
                  type="text"
                  placeholder="Ej. Stanley"
                  value={formulario.marca}
                  onChange={cambiarCampo}
                />
              </div>

              <div className="form-group">
                <label htmlFor="unidad">
                  Unidad *
                </label>

                <select
                  id="unidad"
                  name="unidad"
                  value={formulario.unidad}
                  onChange={cambiarCampo}
                  required
                >
                  <option value="unidad">
                    Unidad
                  </option>

                  <option value="metro">
                    Metro
                  </option>

                  <option value="kilo">
                    Kilo
                  </option>

                  <option value="gramo">
                    Gramo
                  </option>

                  <option value="litro">
                    Litro
                  </option>

                  <option value="galon">
                    Galón
                  </option>

                  <option value="caja">
                    Caja
                  </option>

                  <option value="paquete">
                    Paquete
                  </option>

                  <option value="rollo">
                    Rollo
                  </option>

                  <option value="bulto">
                    Bulto
                  </option>

                  <option value="par">
                    Par
                  </option>
                </select>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>
              Precios y existencias
            </h3>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="precio_compra">
                  Precio de compra
                </label>

                <input
                  id="precio_compra"
                  name="precio_compra"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  value={
                    formulario.precio_compra
                  }
                  onChange={cambiarCampo}
                />
              </div>

              <div className="form-group">
                <label htmlFor="precio_venta">
                  Precio de venta
                </label>

                <input
                  id="precio_venta"
                  name="precio_venta"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  value={
                    formulario.precio_venta
                  }
                  onChange={cambiarCampo}
                />
              </div>

              <div className="form-group">
                <label htmlFor="stock">
                  Stock inicial
                </label>

                <input
                  id="stock"
                  name="stock"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  value={formulario.stock}
                  onChange={cambiarCampo}
                />
              </div>

              <div className="form-group">
                <label htmlFor="stock_minimo">
                  Stock mínimo
                </label>

                <input
                  id="stock_minimo"
                  name="stock_minimo"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  value={
                    formulario.stock_minimo
                  }
                  onChange={cambiarCampo}
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>
              Ubicación y proveedor
            </h3>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="proveedor">
                  Proveedor
                </label>

                <input
                  id="proveedor"
                  name="proveedor"
                  type="text"
                  placeholder="Nombre del proveedor"
                  value={
                    formulario.proveedor
                  }
                  onChange={cambiarCampo}
                />
              </div>

              <div className="form-group">
                <label htmlFor="ubicacion">
                  Ubicación
                </label>

                <input
                  id="ubicacion"
                  name="ubicacion"
                  type="text"
                  placeholder="Ej. Estante A1"
                  value={
                    formulario.ubicacion
                  }
                  onChange={cambiarCampo}
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="form-error">
              {error}
            </div>
          )}

          <div className="modal-footer">
            <button
              type="button"
              className="secondary-button"
              onClick={cerrar}
              disabled={guardando}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="primary-button"
              disabled={guardando}
            >
              {guardando
                ? modoEdicion
                  ? "Actualizando..."
                  : "Guardando..."
                : modoEdicion
                ? "Guardar cambios"
                : "Guardar producto"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ModalProducto;