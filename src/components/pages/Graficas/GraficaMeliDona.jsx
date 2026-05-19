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
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  const [anio, setAnio] = useState(anioProp ?? currentYear);
  const [mes, setMes] = useState(mesProp ?? currentMonth);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const years = Array.from(
    { length: currentYear - 2024 + 1 },
    (_, i) => 2024 + i,
  );

  const months = Array.from({ length: 12 }, (_, i) => i + 1).filter((m) => {
    if (anio < currentYear) return true;
    return m <= currentMonth;
  });

  useEffect(() => {
    if (anio === currentYear && mes > currentMonth) {
      setMes(currentMonth);
    }
  }, [anio, mes, currentYear, currentMonth]);

  const apiUrl =
    process.env.NODE_ENV === "production"
      ? process.env.REACT_APP_API_URL
      : process.env.REACT_APP_API_URL_LOCAL;

  const descargarExcel = async () => {
    const res = await axios.get(`${apiUrl}/analiticas/meli/ventas/excel`, {
      params: { anio, mes },
      responseType: "blob",
    });

    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");

    link.href = url;
    link.setAttribute(
      "download",
      `reporte_meli_${anio}_${String(mes).padStart(2, "0")}.xlsx`,
    );

    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${apiUrl}/analiticas/meli/ventas`, {
        params: { anio, mes },
      });

      const r = (res.data?.raw || [])[0] || {
        ventas_netas: 0,
        costo: 0,
        comision: 0,
        envio: 0,
        utilidad: 0,
      };

      const gastos = (r.costo || 0) + (r.comision || 0) + (r.envio || 0);
      const utilidad = r.utilidad ?? r.ventas_netas - gastos;
      setData([
        { name: "Utilidad", value: Math.max(0, utilidad) },
        { name: "Gastos", value: Math.max(0, gastos) },
      ]);
    } catch (e) {
      setError(e?.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [anio, mes]);

  const total = useMemo(
    () => data.reduce((a, b) => a + (b.value || 0), 0),
    [data],
  );

  const COLORS = ["#0ea5e9", "#94a3b8"]; // util + gastos

  return (
    <section className="meli-card meli-card--accent">
      <header className="meli-header">
        <div>
          <h2 className="meli-title">Composición de Ventas</h2>
          <p className="meli-subtitle">
            Utilidad vs Gastos (Costo+Comisión+Envío)
          </p>
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
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>
          <label className="meli-field">
            <span>Mes</span>
            <select
              className="meli-select"
              value={mes}
              onChange={(e) => setMes(Number(e.target.value))}
            >
              {months.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>
          <button
            className="meli-button"
            onClick={fetchData}
            disabled={loading}
          >
            {loading ? "Cargando…" : "Actualizar"}
          </button>

          <button
            className="meli-button"
            onClick={descargarExcel}
            disabled={loading}
          >
            Reporte
          </button>
        </div>
      </header>

      {error && <div className="meli-alert">⚠️ {String(error)}</div>}

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
              innerRadius="60%"
              outerRadius="80%"
              startAngle={90}
              endAngle={-270}
              labelLine={false}
              // etiquetas limpias (solo %), fuera del aro para que no choquen
              label={({ name, percent }) =>
                `${name}: ${(percent * 100).toFixed(1)}%`
              }
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
