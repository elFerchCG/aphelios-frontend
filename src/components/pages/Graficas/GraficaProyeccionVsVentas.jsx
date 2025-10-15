import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

const currency = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 2,
});

// ---- Mock (solo para pruebas locales si tú quieres) ----
function buildMockData(weeks = 5) {
  const base = 1_500_000;
  return Array.from({ length: weeks }, (_, i) => {
    const idx = i + 1;
    const tendencia = base + i * 200_000;
    const proyeccion = Math.round(tendencia * (0.95 + 0.15 * Math.random()));
    const ventas = Math.round(proyeccion * (0.9 + 0.2 * Math.random()));
    return { semana: `S${idx}`, proyeccion, ventas };
  });
}

// Adapta el payload del backend a [{ semana, proyeccion, ventas }]
function adaptBackendToSeries(payload) {
  // Legacy: { data: [{ semana, proyeccion, ventas }, ...] }
  if (Array.isArray(payload?.data)) return payload.data;

  // Nuevo formato: { labels, datasets: { proyeccion, vendidos|ventas } }
  const labels = payload?.labels ?? [];
  const proy = payload?.datasets?.proyeccion ?? [];
  const vend = payload?.datasets?.vendidos ?? payload?.datasets?.ventas ?? [];

  return labels.map((sem, i) => ({
    semana: sem,
    proyeccion: Number(proy[i] ?? 0),
    ventas: Number(vend[i] ?? 0),
  }));
}

export default function GraficaProyeccionVsVentas({
  weeks = 5,
  apiUrl, 
  useBackend = true, // true para pegarle al backend
  compactWeekLabel = true, // "2025-S01" -> "S1"
}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    setData([]); 
    try {
      if (useBackend && apiUrl) {
        const { data: resp } = await axios.get(
          `${apiUrl}/analiticas/proyeccionVSventas`, 
          { params: { weeks } }
        );
        let series = adaptBackendToSeries(resp);
        if (compactWeekLabel) {
          series = series.map((d) => ({
            ...d,
            semana:
              typeof d.semana === "string" && d.semana.includes("-S")
                ? `S${
                    (d.semana.split("-S")[1] || "").replace(/^0+/, "") ||
                    d.semana
                  }`
                : d.semana,
          }));
        }
        setData(series);
      } else {
        // setData(buildMockData(weeks));
      }
    } catch (e) {
      console.error("Error en fetchData Proyección vs Ventas:", e);
      setError(e?.response?.data?.message || e.message || "Error de red");

      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [weeks, apiUrl, useBackend]);

  // margen superior para evitar que se “pisen” las etiquetas
  const domainMax = useMemo(() => {
    const max = Math.max(
      0,
      ...data.flatMap((d) => [d.proyeccion || 0, d.ventas || 0])
    );
    return Math.ceil(max * 1.15);
  }, [data]);

  return (
    <section className="meli-card meli-card--accent">
      <header className="meli-header">
        <div>
          <h2 className="meli-title">
            Proyección vs Ventas (últimas {weeks} semanas)
          </h2>
          <p className="meli-subtitle">
            P = Proyección · V = Ventas · Fuente: MRP
          </p>
        </div>
        <div className="meli-filters">
          <button
            className="meli-button"
            onClick={fetchData}
            disabled={loading}
          >
            {loading ? "Cargando…" : "Actualizar"}
          </button>
        </div>
      </header>

      {error && <div className="meli-alert">⚠️ {error}</div>}

      <div className="meli-chart" style={{ height: 420 }}>
        {loading && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(255,255,255,0.65)",
              zIndex: 1,
              fontWeight: 600,
            }}
          >
            Cargando…
          </div>
        )}

        <ResponsiveContainer>
          <BarChart
            data={data}
            barGap={6}
            barCategoryGap="28%"
            margin={{ top: 8, right: 40, bottom: 16, left: 110 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="semana" />
            <YAxis
              width={120}
              tickFormatter={(v) => currency.format(v)}
              domain={[0, domainMax]}
            />
            <Tooltip formatter={(v, n) => [currency.format(v), n]} />
            <Legend />
            <Bar
              dataKey="proyeccion"
              name="Proyección (P)"
              fill="#6366f1"
              radius={[6, 6, 0, 0]}
            />
            <Bar
              dataKey="ventas"
              name="Ventas (V)"
              fill="#22c55e"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
