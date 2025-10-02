import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

const currency = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 2,
});

// Mock de valores por bucket (puedes hacer que lea de API luego)
function buildMockStock() {
  // valores en MXN (ej. valor inventario por categoría)
  const rojo = Math.round(0.14 * 1_000_000 + Math.random() * 100_000);
  const amarillo = Math.round(0.27 * 1_000_000 + Math.random() * 100_000);
  const verde = Math.round(0.31 * 1_000_000 + Math.random() * 100_000);
  const azul = Math.round(0.28 * 1_000_000 + Math.random() * 100_000);
  return [
    { key: "rojo",     name: "Rojo (≤ Seguridad)",                value: rojo,     color: "#ef4444" },
    { key: "amarillo", name: "Amarillo (≤ Reorden)",               value: amarillo, color: "#f59e0b" },
    { key: "verde",    name: "Verde (≤ Máximo)",                   value: verde,    color: "#10b981" },
    { key: "azul",     name: "Azul (> Máximo)",                    value: azul,     color: "#3b82f6" },
  ];
}

export default function GraficaStockPastel() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const total = useMemo(
    () => data.reduce((a, b) => a + (b.value || 0), 0),
    [data]
  );

  const fetchData = async () => {
    setLoading(true);
    try {
      // Cuando tengas API, reemplaza por:
      // const res = await fetch(`${apiUrl}/analytics/stock/buckets`);
      // const json = await res.json();
      // setData(json.data);
      setData(buildMockStock());
    } catch (e) {
      setData(buildMockStock());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

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
        <ResponsiveContainer>
          <PieChart margin={{ top: 8, right: 16, bottom: 40, left: 16 }}>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="55%"
              outerRadius="82%"
              startAngle={90}
              endAngle={-270}
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
            >
              {data.map((d, i) => (
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
                `${value} — ${currency.format(entry.payload.value)}`
              }
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
