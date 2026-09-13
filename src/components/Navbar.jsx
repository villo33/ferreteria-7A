function Navbar({ paginaActual, cambiarPagina }) {
  const opciones = [
    { id: "inicio", icono: "⌂", nombre: "Inicio" },
    { id: "inventario", icono: "▣", nombre: "Inventario" },
    { id: "ventas", icono: "▤", nombre: "Ventas" },
    { id: "entradas", icono: "↓", nombre: "Entradas" },
    { id: "salidas", icono: "↑", nombre: "Salidas" },
    { id: "proveedores", icono: "♧", nombre: "Proveedores" },
    { id: "clientes", icono: "♙", nombre: "Clientes" },
    { id: "reportes", icono: "▥", nombre: "Reportes" },
  ];

  return (
    <aside className="sidebar">
      <div className="logo-container">
        <div className="logo-7a">7A</div>

        <div>
          <h1>7A</h1>
          <span>Ferretería</span>
        </div>
      </div>

      <nav className="menu">
        <div className="menu-label">MENÚ PRINCIPAL</div>

        {opciones.map((opcion) => (
          <button
            key={opcion.id}
            className={`menu-item ${
              paginaActual === opcion.id ? "activo" : ""
            }`}
            onClick={() => cambiarPagina(opcion.id)}
          >
            <span className="menu-icon">{opcion.icono}</span>
            <span>{opcion.nombre}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <div className="usuario-card">
          <div className="usuario-avatar">A</div>

          <div className="usuario-info">
            <strong>Administrador</strong>
            <span>Panel de control</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Navbar;