import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";
import axios from "axios";

const currency = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 2,
});

const apiUrl =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_URL
    : process.env.REACT_APP_API_URL_LOCAL;

// --- helpers de UI ---
const COLORS = {
  rojo: "#ef4444",
  amarillo: "#f59e0b",
  verde: "#10b981",
  azul: "#3b82f6",
};

const NOMBRE = {
  rojo: "Rojo (≤ Seguridad)",
  amarillo: "Amarillo (≤ Reorden)",
  verde: "Verde (≤ Máximo)",
  azul: "Azul (> Máximo)",
};

// Mock temporal por si no hay backend
function buildMockStock() {
  const rojo = Math.round(0.14 * 1_000_000 + Math.random() * 100_000);
  const amarillo = Math.round(0.27 * 1_000_000 + Math.random() * 100_000);
  const verde = Math.round(0.31 * 1_000_000 + Math.random() * 100_000);
  const azul = Math.round(0.28 * 1_000_000 + Math.random() * 100_000);
  return [
    { key: "rojo", name: NOMBRE.rojo, value: rojo, color: COLORS.rojo },
    { key: "amarillo", name: NOMBRE.amarillo, value: amarillo, color: COLORS.amarillo },
    { key: "verde", name: NOMBRE.verde, value: verde, color: COLORS.verde },
    { key: "azul", name: NOMBRE.azul, value: azul, color: COLORS.azul },
  ];
}

export default function GraficaStockPastel() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Total para el centro del donut
  const total = useMemo(
    () => data.reduce((acc, d) => acc + (Number(d.value) || 0), 0),
    [data]
  );

  const fetchData = async () => {
    setLoading(true);
    try {
      if (!apiUrl) {
        setData(buildMockStock());
        return;
      }

      // Respuesta esperada del backend:
      // { data: [{ bucket, valor_mxn, items, unidades }, ...], total_mxn }
      const { data: resp } = await axios.get(
        `${apiUrl}/analiticas/stock/buckets`,
        { params: { soloConStock: 1 } } 
      );

      const series = (resp?.data ?? []).map((b) => ({
        key: b.bucket,
        name: NOMBRE[b.bucket] ?? b.bucket,
        value: Number(b.valor_mxn || 0),
        color: COLORS[b.bucket] ?? "#999999",
      }));

      setData(series.length ? series : buildMockStock());
    } catch (e) {
      console.error("Error cargando buckets de stock:", e);
      setData(buildMockStock());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []); // carga inicial

  return (
    <section className="meli-card meli-card--accent">
      <header className="meli-header">
        <div>
          <h2 className="meli-title">Distribución de Stock</h2>
          <p className="meli-subtitle">
            Por valor de inventario — Rojo/Amarillo/Verde/Azul
          </p>
        </div>
        <div className="meli-filters">
          <button className="meli-button" onClick={fetchData} disabled={loading}>
            {loading ? "Cargando…" : "Actualizar"}
          </button>
        </div>
      </header>

      <div className="meli-chart">
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
          <PieChart margin={{ top: 8, right: 16, bottom: 40, left: 16 }}>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="50%"
              outerRadius="80%"
              startAngle={90}
              endAngle={-270}
              labelLine={false}
            >
              {data.map((d) => (
                <Cell key={d.key} fill={d.color} />
              ))}
            </Pie>

            {/* Centro: total inventario */}
            <text
              x="50%"
              y="50%"
              textAnchor="middle"
              dominantBaseline="middle"
              style={{ fontWeight: 800, fontSize: 16, pointerEvents: "none" }}
            >
              {currency.format(total)}
            </text>
            <text
              x="50%"
              y="50%"
              dy="18"
              textAnchor="middle"
              dominantBaseline="middle"
              style={{ fill: "#6b7280", fontSize: 12, pointerEvents: "none" }}
            >
              Inventario total
            </text>

            <Tooltip formatter={(v, n) => [currency.format(v), n]} />
            <Legend
              layout="horizontal"
              verticalAlign="bottom"
              align="center"
              formatter={(value, entry) =>
                `${value} — ${currency.format(entry?.payload?.value ?? 0)}`
              }
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
