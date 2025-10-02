import GraficaMeliVentas from "./GraficaMeliVentas.jsx";
import GraficaMeliDona from "./GraficaMeliDona";
import GraficaProyeccionVsVentas from "./GraficaProyeccionVsVentas";
import GraficaStockPastel from "./GraficaStockPastel";
import GraficaStockPorCategoria from "./GraficaStockPorCategoria";
import "./styles/meliVentas.css";

function DashboardAphelios() {
return (
    <div className="dashboard-wrap">
      {/* ======= VENTAS ======= */}
      <section className="board-section">
        <header className="board-header">
          <h1 className="board-title">Gráficas de Ventas</h1>
          <p className="board-subtitle">Ventas, composición y proyección (MRP)</p>
        </header>

        <div className="score-grid-3">
          <GraficaMeliVentas />
          <GraficaMeliDona />
          <GraficaProyeccionVsVentas
            weeks={5}
            useBackend={false} // cuando tengas API: true
            // apiUrl={`${process.env.REACT_APP_API_URL_LOCAL}/analytics/mrp/proyeccion-vs-ventas`}
          />
        </div>
      </section>

      {/* ======= STOCK ======= */}
      <section className="board-section">
        <header className="board-header">
          <h1 className="board-title">Gráficas de Stock</h1>
          <p className="board-subtitle">Distribución y estado por categoría</p>
        </header>

        <div className="score-grid-3">
          <GraficaStockPastel />
          <GraficaStockPorCategoria />
        </div>
      </section>
    </div>
  );
}

export default DashboardAphelios;
