import { useEffect, useState } from "react";
import axios from "axios";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LabelList,
  Cell,
} from "recharts";

import './styles/meliVentas.css';

const currency = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 2,
});

export default function GraficaMeliVentas() {
  const [anio, setAnio] = useState(2025);
  const [mes, setMes] = useState(1);
  const [detalle, setDetalle] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

      const r =
        (res.data?.raw || [])[0] || {
          ventas_netas: 0,
          costo: 0,
          comision: 0,
          envio: 0,
          utilidad: 0,
        };

      setDetalle([
        { name: "Ventas (sin IVA)", value: r.ventas_netas },
        { name: "Costo", value: r.costo },
        { name: "Comisión", value: r.comision },
        { name: "Envío", value: r.envio },
      ]);
    } catch (e) {
      setError(e?.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anio, mes]);

  const colors = ["#2563eb", "#16a34a", "#f59e0b", "#ef4444", "#0ea5e9"];
  const maxValue = Math.max(0, ...detalle.map((d) => d.value || 0));
  const domainMax = Math.ceil(maxValue * 1.15);

  return (
    <section className="meli-card meli-card--accent">
      {/* Header */}
      <header className="meli-header">
        <div>
          <h2 className="meli-title">Ventas MeLi por mes</h2>
          <p className="meli-subtitle">Montos en MXN — Ventas sin IVA</p>
        </div>

        {/* Filtros */}
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
            data={detalle}
            layout="vertical"
            margin={{ top: 8, right: 220, bottom: 8, left: 16 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              type="number"
              domain={[0, domainMax]}
              tickFormatter={(v) => currency.format(v)}
            />
            <YAxis type="category" dataKey="name" width={160} />
            <Tooltip formatter={(v, n) => [currency.format(v), n]} />
            <Bar dataKey="value" name="Monto">
              {detalle.map((_, i) => (
                <Cell key={i} fill={colors[i % colors.length]} />
              ))}
              <LabelList
                dataKey="value"
                position="right"
                offset={10}
                formatter={(v) => currency.format(v)}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
