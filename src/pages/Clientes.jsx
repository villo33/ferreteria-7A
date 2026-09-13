import { useEffect, useMemo, useState } from "react";

import {
  obtenerClientes,
  crearCliente,
  actualizarCliente,
  desactivarCliente,
} from "../services/clientesService";

import "../styles/clientes.css";

function Clientes() {
  const [clientes, setClientes] = useState([]);

  const [busqueda, setBusqueda] = useState("");

  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] =
    useState(null);

  const [formulario, setFormulario] = useState({
    nombre: "",
    identificacion: "",
    telefono: "",
    correo: "",
    direccion: "",
    observaciones: "",
  });

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    cargarClientes();
  }, []);

  async function cargarClientes() {
    try {
      setCargando(true);
      setError("");

      const data = await obtenerClientes();

      setClientes(data);
    } catch (err) {
      console.error(err);

      setError(
        "No fue posible cargar los clientes."
      );
    } finally {
      setCargando(false);
    }
  }

  const clientesFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    if (!texto) {
      return clientes;
    }

    return clientes.filter((cliente) => {
      const nombre =
        cliente.nombre?.toLowerCase() || "";

      const identificacion =
        cliente.identificacion?.toLowerCase() || "";

      const telefono =
        cliente.telefono?.toLowerCase() || "";

      const correo =
        cliente.correo?.toLowerCase() || "";

      return (
        nombre.includes(texto) ||
        identificacion.includes(texto) ||
        telefono.includes(texto) ||
        correo.includes(texto)
      );
    });
  }, [clientes, busqueda]);

  function abrirNuevoCliente() {
    setModoEdicion(false);
    setClienteSeleccionado(null);

    setFormulario({
      nombre: "",
      identificacion: "",
      telefono: "",
      correo: "",
      direccion: "",
      observaciones: "",
    });

    setError("");
    setMensaje("");
    setModalAbierto(true);
  }

  function abrirEditarCliente(cliente) {
    setModoEdicion(true);
    setClienteSeleccionado(cliente);

    setFormulario({
      nombre: cliente.nombre || "",
      identificacion:
        cliente.identificacion || "",
      telefono: cliente.telefono || "",
      correo: cliente.correo || "",
      direccion: cliente.direccion || "",
      observaciones:
        cliente.observaciones || "",
    });

    setError("");
    setMensaje("");
    setModalAbierto(true);
  }

  function cerrarModal() {
    if (guardando) return;

    setModalAbierto(false);
    setClienteSeleccionado(null);
  }

  function cambiarCampo(campo, valor) {
    setFormulario((actual) => ({
      ...actual,
      [campo]: valor,
    }));
  }

  async function guardarCliente() {
    setError("");
    setMensaje("");

    const nombre = formulario.nombre.trim();

    if (!nombre) {
      setError(
        "El nombre del cliente es obligatorio."
      );
      return;
    }

    try {
      setGuardando(true);

      const datos = {
        nombre,
        identificacion:
          formulario.identificacion.trim(),
        telefono:
          formulario.telefono.trim(),
        correo:
          formulario.correo.trim(),
        direccion:
          formulario.direccion.trim(),
        observaciones:
          formulario.observaciones.trim(),
      };

      if (
        modoEdicion &&
        clienteSeleccionado
      ) {
        await actualizarCliente(
          clienteSeleccionado.id,
          datos
        );

        setMensaje(
          "Cliente actualizado correctamente."
        );
      } else {
        await crearCliente(datos);

        setMensaje(
          "Cliente creado correctamente."
        );
      }

      setModalAbierto(false);
      setClienteSeleccionado(null);

      await cargarClientes();
    } catch (err) {
      console.error(err);

      setError(
        err?.message ||
          "No fue posible guardar el cliente."
      );
    } finally {
      setGuardando(false);
    }
  }

  async function manejarDesactivar(cliente) {
    const confirmar = window.confirm(
      `¿Deseas desactivar al cliente "${cliente.nombre}"?`
    );

    if (!confirmar) {
      return;
    }

    try {
      setError("");
      setMensaje("");

      await desactivarCliente(cliente.id);

      setMensaje(
        "Cliente desactivado correctamente."
      );

      await cargarClientes();
    } catch (err) {
      console.error(err);

      setError(
        err?.message ||
          "No fue posible desactivar el cliente."
      );
    }
  }

  return (
    <div className="clientes-page">
      <div className="clientes-header">
        <div>
          <h2>Clientes</h2>

          <p>
            Administra los clientes de la ferretería.
          </p>
        </div>

        <button
          type="button"
          className="cliente-btn-nuevo"
          onClick={abrirNuevoCliente}
        >
          + Nuevo cliente
        </button>
      </div>

      {error && (
        <div className="cliente-alerta cliente-alerta-error">
          {error}
        </div>
      )}

      {mensaje && (
        <div className="cliente-alerta cliente-alerta-success">
          {mensaje}
        </div>
      )}

      <section className="panel clientes-panel">
        <div className="clientes-toolbar">
          <div>
            <strong>
              Lista de clientes
            </strong>

            <span>
              {clientes.length} clientes registrados
            </span>
          </div>

          <div className="cliente-buscador">
            <input
              type="text"
              value={busqueda}
              onChange={(e) =>
                setBusqueda(e.target.value)
              }
              placeholder="Buscar cliente..."
            />
          </div>
        </div>

        {cargando ? (
          <div className="cliente-vacio">
            Cargando clientes...
          </div>
        ) : clientesFiltrados.length === 0 ? (
          <div className="cliente-vacio">
            <div className="cliente-vacio-icono">
              ♙
            </div>

            <strong>
              {busqueda
                ? "No se encontraron clientes"
                : "No hay clientes registrados"}
            </strong>

            <span>
              {busqueda
                ? "Prueba con otro término de búsqueda."
                : "Agrega tu primer cliente para comenzar."}
            </span>

            {!busqueda && (
              <button
                type="button"
                className="cliente-btn-vacio"
                onClick={abrirNuevoCliente}
              >
                + Agregar cliente
              </button>
            )}
          </div>
        ) : (
          <div className="cliente-tabla-wrapper">
            <table className="cliente-tabla">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Identificación</th>
                  <th>Teléfono</th>
                  <th>Correo</th>
                  <th>Dirección</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {clientesFiltrados.map(
                  (cliente) => (
                    <tr key={cliente.id}>
                      <td>
                        <div className="cliente-nombre">
                          <div className="cliente-avatar">
                            {(
                              cliente.nombre?.charAt(
                                0
                              ) || "C"
                            ).toUpperCase()}
                          </div>

                          <div>
                            <strong>
                              {cliente.nombre}
                            </strong>

                            <span>
                              Cliente #{cliente.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        {cliente.identificacion ||
                          "Sin identificación"}
                      </td>

                      <td>
                        {cliente.telefono ||
                          "Sin teléfono"}
                      </td>

                      <td>
                        {cliente.correo ||
                          "Sin correo"}
                      </td>

                      <td>
                        {cliente.direccion ||
                          "Sin dirección"}
                      </td>

                      <td>
                        <span className="cliente-estado">
                          Activo
                        </span>
                      </td>

                      <td>
                        <div className="cliente-acciones">
                          <button
                            type="button"
                            className="cliente-btn-editar"
                            onClick={() =>
                              abrirEditarCliente(
                                cliente
                              )
                            }
                          >
                            Editar
                          </button>

                          <button
                            type="button"
                            className="cliente-btn-desactivar"
                            onClick={() =>
                              manejarDesactivar(
                                cliente
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
          className="cliente-modal-overlay"
          onClick={cerrarModal}
        >
          <div
            className="cliente-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <div className="cliente-modal-header">
              <div>
                <h3>
                  {modoEdicion
                    ? "Editar cliente"
                    : "Nuevo cliente"}
                </h3>

                <span>
                  Completa la información del cliente.
                </span>
              </div>

              <button
                type="button"
                className="cliente-modal-cerrar"
                onClick={cerrarModal}
                disabled={guardando}
              >
                ×
              </button>
            </div>

            <div className="cliente-formulario">
              <div className="cliente-campo cliente-campo-completo">
                <label>
                  Nombre del cliente *
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
                  placeholder="Nombre completo o razón social"
                />
              </div>

              <div className="cliente-campo">
                <label>
                  Identificación
                </label>

                <input
                  type="text"
                  value={
                    formulario.identificacion
                  }
                  onChange={(e) =>
                    cambiarCampo(
                      "identificacion",
                      e.target.value
                    )
                  }
                  placeholder="Cédula o NIT"
                />
              </div>

              <div className="cliente-campo">
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

              <div className="cliente-campo">
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
                  placeholder="correo@ejemplo.com"
                />
              </div>

              <div className="cliente-campo">
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
                  placeholder="Dirección del cliente"
                />
              </div>

              <div className="cliente-campo cliente-campo-completo">
                <label>Observaciones</label>

                <textarea
                  value={
                    formulario.observaciones
                  }
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

            <div className="cliente-modal-footer">
              <button
                type="button"
                className="cliente-btn-cancelar"
                onClick={cerrarModal}
                disabled={guardando}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="cliente-btn-guardar"
                onClick={guardarCliente}
                disabled={guardando}
              >
                {guardando
                  ? "Guardando..."
                  : modoEdicion
                  ? "Guardar cambios"
                  : "Crear cliente"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Clientes;