import { useEffect, useMemo, useState } from "react";

import {
  obtenerProveedores,
  crearProveedor,
  actualizarProveedor,
  desactivarProveedor,
} from "../services/proveedoresService";

import "../styles/proveedores.css";

function Proveedores() {
  const [proveedores, setProveedores] = useState([]);

  const [busqueda, setBusqueda] = useState("");

  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [proveedorSeleccionado, setProveedorSeleccionado] =
    useState(null);

  const [formulario, setFormulario] = useState({
    nombre: "",
    nit: "",
    telefono: "",
    correo: "",
    direccion: "",
    contacto: "",
    observaciones: "",
  });

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    cargarProveedores();
  }, []);

  async function cargarProveedores() {
    try {
      setCargando(true);
      setError("");

      const data = await obtenerProveedores();

      setProveedores(data);
    } catch (err) {
      console.error(err);

      setError(
        "No fue posible cargar los proveedores."
      );
    } finally {
      setCargando(false);
    }
  }

  const proveedoresFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    if (!texto) {
      return proveedores;
    }

    return proveedores.filter((proveedor) => {
      const nombre =
        proveedor.nombre?.toLowerCase() || "";

      const nit =
        proveedor.nit?.toLowerCase() || "";

      const telefono =
        proveedor.telefono?.toLowerCase() || "";

      const correo =
        proveedor.correo?.toLowerCase() || "";

      const contacto =
        proveedor.contacto?.toLowerCase() || "";

      return (
        nombre.includes(texto) ||
        nit.includes(texto) ||
        telefono.includes(texto) ||
        correo.includes(texto) ||
        contacto.includes(texto)
      );
    });
  }, [proveedores, busqueda]);

  function abrirNuevoProveedor() {
    setModoEdicion(false);
    setProveedorSeleccionado(null);

    setFormulario({
      nombre: "",
      nit: "",
      telefono: "",
      correo: "",
      direccion: "",
      contacto: "",
      observaciones: "",
    });

    setError("");
    setMensaje("");
    setModalAbierto(true);
  }

  function abrirEditarProveedor(proveedor) {
    setModoEdicion(true);
    setProveedorSeleccionado(proveedor);

    setFormulario({
      nombre: proveedor.nombre || "",
      nit: proveedor.nit || "",
      telefono: proveedor.telefono || "",
      correo: proveedor.correo || "",
      direccion: proveedor.direccion || "",
      contacto: proveedor.contacto || "",
      observaciones: proveedor.observaciones || "",
    });

    setError("");
    setMensaje("");
    setModalAbierto(true);
  }

  function cerrarModal() {
    if (guardando) return;

    setModalAbierto(false);
    setProveedorSeleccionado(null);
  }

  function cambiarCampo(campo, valor) {
    setFormulario((actual) => ({
      ...actual,
      [campo]: valor,
    }));
  }

  async function guardarProveedor() {
    setError("");
    setMensaje("");

    const nombre = formulario.nombre.trim();

    if (!nombre) {
      setError(
        "El nombre del proveedor es obligatorio."
      );
      return;
    }

    try {
      setGuardando(true);

      const datos = {
        nombre,
        nit: formulario.nit.trim(),
        telefono: formulario.telefono.trim(),
        correo: formulario.correo.trim(),
        direccion: formulario.direccion.trim(),
        contacto: formulario.contacto.trim(),
        observaciones:
          formulario.observaciones.trim(),
      };

      if (modoEdicion && proveedorSeleccionado) {
        await actualizarProveedor(
          proveedorSeleccionado.id,
          datos
        );

        setMensaje(
          "Proveedor actualizado correctamente."
        );
      } else {
        await crearProveedor(datos);

        setMensaje(
          "Proveedor creado correctamente."
        );
      }

      setModalAbierto(false);
      setProveedorSeleccionado(null);

      await cargarProveedores();
    } catch (err) {
      console.error(err);

      setError(
        err?.message ||
          "No fue posible guardar el proveedor."
      );
    } finally {
      setGuardando(false);
    }
  }

  async function manejarDesactivar(proveedor) {
    const confirmar = window.confirm(
      `¿Deseas desactivar al proveedor "${proveedor.nombre}"?`
    );

    if (!confirmar) {
      return;
    }

    try {
      setError("");
      setMensaje("");

      await desactivarProveedor(proveedor.id);

      setMensaje(
        "Proveedor desactivado correctamente."
      );

      await cargarProveedores();
    } catch (err) {
      console.error(err);

      setError(
        err?.message ||
          "No fue posible desactivar el proveedor."
      );
    }
  }

  return (
    <div className="proveedores-page">
      <div className="proveedores-header">
        <div>
          <h2>Proveedores</h2>

          <p>
            Administra los proveedores de la ferretería.
          </p>
        </div>

        <button
          type="button"
          className="proveedor-btn-nuevo"
          onClick={abrirNuevoProveedor}
        >
          + Nuevo proveedor
        </button>
      </div>

      {error && (
        <div className="proveedor-alerta proveedor-alerta-error">
          {error}
        </div>
      )}

      {mensaje && (
        <div className="proveedor-alerta proveedor-alerta-success">
          {mensaje}
        </div>
      )}

      <section className="panel proveedores-panel">
        <div className="proveedores-toolbar">
          <div>
            <strong>
              Lista de proveedores
            </strong>

            <span>
              {proveedores.length} proveedores registrados
            </span>
          </div>

          <div className="proveedor-buscador">
            <input
              type="text"
              value={busqueda}
              onChange={(e) =>
                setBusqueda(e.target.value)
              }
              placeholder="Buscar proveedor..."
            />
          </div>
        </div>

        {cargando ? (
          <div className="proveedor-vacio">
            Cargando proveedores...
          </div>
        ) : proveedoresFiltrados.length === 0 ? (
          <div className="proveedor-vacio">
            <div className="proveedor-vacio-icono">
              ♧
            </div>

            <strong>
              {busqueda
                ? "No se encontraron proveedores"
                : "No hay proveedores registrados"}
            </strong>

            <span>
              {busqueda
                ? "Prueba con otro término de búsqueda."
                : "Agrega tu primer proveedor para comenzar."}
            </span>

            {!busqueda && (
              <button
                type="button"
                className="proveedor-btn-vacio"
                onClick={abrirNuevoProveedor}
              >
                + Agregar proveedor
              </button>
            )}
          </div>
        ) : (
          <div className="proveedor-tabla-wrapper">
            <table className="proveedor-tabla">
              <thead>
                <tr>
                  <th>Proveedor</th>
                  <th>NIT</th>
                  <th>Contacto</th>
                  <th>Teléfono</th>
                  <th>Correo</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {proveedoresFiltrados.map(
                  (proveedor) => (
                    <tr key={proveedor.id}>
                      <td>
                        <div className="proveedor-nombre">
                          <div className="proveedor-avatar">
                            {(
                              proveedor.nombre?.charAt(
                                0
                              ) || "P"
                            ).toUpperCase()}
                          </div>

                          <div>
                            <strong>
                              {proveedor.nombre}
                            </strong>

                            <span>
                              {proveedor.direccion ||
                                "Sin dirección"}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        {proveedor.nit ||
                          "Sin NIT"}
                      </td>

                      <td>
                        {proveedor.contacto ||
                          "Sin contacto"}
                      </td>

                      <td>
                        {proveedor.telefono ||
                          "Sin teléfono"}
                      </td>

                      <td>
                        {proveedor.correo ||
                          "Sin correo"}
                      </td>

                      <td>
                        <span className="proveedor-estado">
                          Activo
                        </span>
                      </td>

                      <td>
                        <div className="proveedor-acciones">
                          <button
                            type="button"
                            className="proveedor-btn-editar"
                            onClick={() =>
                              abrirEditarProveedor(
                                proveedor
                              )
                            }
                          >
                            Editar
                          </button>

                          <button
                            type="button"
                            className="proveedor-btn-desactivar"
                            onClick={() =>
                              manejarDesactivar(
                                proveedor
                              )
                            }
                          >
                            Desactivar
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {modalAbierto && (
        <div
          className="proveedor-modal-overlay"
          onClick={cerrarModal}
        >
          <div
            className="proveedor-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <div className="proveedor-modal-header">
              <div>
                <h3>
                  {modoEdicion
                    ? "Editar proveedor"
                    : "Nuevo proveedor"}
                </h3>

                <span>
                  Completa la información del proveedor.
                </span>
              </div>

              <button
                type="button"
                className="proveedor-modal-cerrar"
                onClick={cerrarModal}
                disabled={guardando}
              >
                ×
              </button>
            </div>

            <div className="proveedor-formulario">
              <div className="proveedor-campo proveedor-campo-completo">
                <label>
                  Nombre del proveedor *
                </label>

                <input
                  type="text"
                  value={formulario.nombre}
                  onChange={(e) =>
                    cambiarCampo(
                      "nombre",
                      e.target.value
                    )
                  }
                  placeholder="Ej. Ferretería Nacional"
                />
              </div>

              <div className="proveedor-campo">
                <label>NIT / Identificación</label>

                <input
                  type="text"
                  value={formulario.nit}
                  onChange={(e) =>
                    cambiarCampo(
                      "nit",
                      e.target.value
                    )
                  }
                  placeholder="Ej. 900123456-7"
                />
              </div>

              <div className="proveedor-campo">
                <label>Contacto</label>

                <input
                  type="text"
                  value={formulario.contacto}
                  onChange={(e) =>
                    cambiarCampo(
                      "contacto",
                      e.target.value
                    )
                  }
                  placeholder="Nombre del contacto"
                />
              </div>

              <div className="proveedor-campo">
                <label>Teléfono</label>

                <input
                  type="text"
                  value={formulario.telefono}
                  onChange={(e) =>
                    cambiarCampo(
                      "telefono",
                      e.target.value
                    )
                  }
                  placeholder="Número de teléfono"
                />
              </div>

              <div className="proveedor-campo">
                <label>Correo</label>

                <input
                  type="email"
                  value={formulario.correo}
                  onChange={(e) =>
                    cambiarCampo(
                      "correo",
                      e.target.value
                    )
                  }
                  placeholder="correo@empresa.com"
                />
              </div>

              <div className="proveedor-campo proveedor-campo-completo">
                <label>Dirección</label>

                <input
                  type="text"
                  value={formulario.direccion}
                  onChange={(e) =>
                    cambiarCampo(
                      "direccion",
                      e.target.value
                    )
                  }
                  placeholder="Dirección del proveedor"
                />
              </div>

              <div className="proveedor-campo proveedor-campo-completo">
                <label>Observaciones</label>

                <textarea
                  value={formulario.observaciones}
                  onChange={(e) =>
                    cambiarCampo(
                      "observaciones",
                      e.target.value
                    )
                  }
                  placeholder="Información adicional..."
                  rows="4"
                />
              </div>
            </div>

            <div className="proveedor-modal-footer">
              <button
                type="button"
                className="proveedor-btn-cancelar"
                onClick={cerrarModal}
                disabled={guardando}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="proveedor-btn-guardar"
                onClick={guardarProveedor}
                disabled={guardando}
              >
                {guardando
                  ? "Guardando..."
                  : modoEdicion
                  ? "Guardar cambios"
                  : "Crear proveedor"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Proveedores;