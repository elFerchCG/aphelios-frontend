import GraficaMeliVentas from "./GraficaMeliVentas.jsx";
import GraficaMeliDona from "./GraficaMeliDona";
import GraficaProyeccionVsVentas from "./GraficaProyeccionVsVentas";
import GraficaStockPastel from "./GraficaStockPastel";
import GraficaStockPorCategoria from "./GraficaStockPorCategoria";
import "./styles/meliVentas.css";
import GraficaCoberturaStock from "./GraficaStockVsMaximo.jsx";

function DashboardAphelios() {
  const apiUrl =
    process.env.NODE_ENV === "production"
      ? process.env.REACT_APP_API_URL
      : process.env.REACT_APP_API_URL_LOCAL;

  return (
    <div className="dashboard-wrap">
      {/* ======= VENTAS ======= */}
      <section className="board-section">
        <header className="board-header">
          <h1 className="board-title">Gráficas de Ventas</h1>
          <p className="board-subtitle">
            Ventas, composición y proyección (MRP)
          </p>
        </header>

        <div className="score-grid-3">
          <GraficaMeliVentas />
          <GraficaMeliDona />
          <GraficaProyeccionVsVentas
            weeks={5}
            useBackend={true} // ✅ usa backend
            apiUrl={apiUrl} // ✅ base URL, ej: http://localhost:3304
          />
        </div>
      </section>

      {/* ======= STOCK ======= */}
      <section className="board-section">
        <header className="board-header">
          <h1 className="board-title">Gráficas de Stock</h1>
          <p className="board-subtitle">Distribución y estado por categoría</p>
        </header>

        {/* FILA 1 */}
        <div className="score-grid-3">
          <GraficaStockPastel />
        </div>

        {/* FILA 2 */}
        <div className="score-grid-3">
          <GraficaStockPorCategoria />
        </div>

        {/* FILA 3 */}
        <div className="score-grid-3">
          <GraficaCoberturaStock />
        </div>
      </section>
    </div>
  );
}

export default DashboardAphelios;
