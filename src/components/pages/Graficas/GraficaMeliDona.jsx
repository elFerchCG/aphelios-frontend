import { useEffect, useState, useMemo } from "react";
import axios from "axios";
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

export default function GraficaMeliDona({ anio: anioProp, mes: mesProp }) {
  const [anio, setAnio] = useState(anioProp ?? 2025);
  const [mes, setMes] = useState(mesProp ?? 1);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (anioProp != null) setAnio(anioProp);
    if (mesProp != null) setMes(mesProp);
  }, [anioProp, mesProp]);

  const apiUrl =
    process.env.NODE_ENV === "production"
      ? process.env.REACT_APP_API_URL
      : process.env.REACT_APP_API_URL_LOCAL;

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${apiUrl}/analiticas/meli/ventas`, {
        params: { anio, mes },
      });

      const r = (res.data?.raw || [])[0] || {
        ventas_netas: 0, costo: 0, comision: 0, envio: 0, utilidad: 0,
      };

      const gastos = (r.costo || 0) + (r.comision || 0) + (r.envio || 0);
      const utilidad = r.utilidad ?? (r.ventas_netas - gastos);
      setData([
        { name: "Utilidad", value: Math.max(0, utilidad) },
        { name: "Gastos",   value: Math.max(0, gastos) },
      ]);
    } catch (e) {
      setError(e?.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [anio, mes]);

  const total = useMemo(
    () => data.reduce((a, b) => a + (b.value || 0), 0),
    [data]
  );

  const COLORS = ["#0ea5e9", "#94a3b8"]; // util + gastos

  return (
    <section className="meli-card meli-card--accent">
      <header className="meli-header">
        <div>
          <h2 className="meli-title">Composición de Ventas</h2>
          <p className="meli-subtitle">Utilidad vs Gastos (Costo+Comisión+Envío)</p>
        </div>

        {/* Si prefieres sincronizar con la otra card, oculta estos inputs y pasa props */}
        <div className="meli-filters">
          <label className="meli-field">
            <span>Año</span>
            <select
              className="meli-select"
              value={anio}
              onChange={(e) => setAnio(Number(e.target.value))}
            >
              <option value={2024}>2024</option>
              <option value={2025}>2025</option>
            </select>
          </label>
          <label className="meli-field">
            <span>Mes</span>
            <select
              className="meli-select"
              value={mes}
              onChange={(e) => setMes(Number(e.target.value))}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>
          <button className="meli-button" onClick={fetchData} disabled={loading}>
            {loading ? "Cargando…" : "Actualizar"}
          </button>
        </div>
      </header>

      {error && <div className="meli-alert">⚠️ {String(error)}</div>}

      <div className="meli-chart">
        <ResponsiveContainer>
          <PieChart margin={{ top: 8, right: 16, bottom: 40, left: 16 }}>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="60%"
              outerRadius="80%"
              startAngle={90}
              endAngle={-270}
              labelLine={false}
              // etiquetas limpias (solo %), fuera del aro para que no choquen
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>

            {/* Texto al centro (total ventas sin IVA) */}
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
              Ventas (sin IVA)
            </text>

            <Tooltip formatter={(v, n) => [currency.format(v), n]} />
            {/* Legend abajo para que no invada el gráfico */}
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
