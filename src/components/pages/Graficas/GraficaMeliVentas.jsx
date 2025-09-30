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
      // ⬇️ ajusta la ruta si tu backend usa /analiticas en lugar de /analytics
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

      setDetalle([
        { name: "Ventas (sin IVA)", value: r.ventas_netas },
        { name: "Costo", value: r.costo },
        { name: "Comisión", value: r.comision },
        { name: "Envío", value: r.envio },
        { name: "Utilidad", value: r.utilidad },
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

  // Headroom para que las etiquetas no se salgan del área
  const maxValue = Math.max(0, ...detalle.map((d) => d.value || 0));
  const domainMax = Math.ceil(maxValue * 1.15); // 15% aire a la derecha

  return (
    <div style={{ width: "100%", maxWidth: 1000, margin: "0 auto" }}>
      <h2 style={{ marginBottom: 8 }}>Ventas MeLi por mes</h2>

      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <label>
          Año:&nbsp;
          <select value={anio} onChange={(e) => setAnio(Number(e.target.value))}>
            <option value={2024}>2024</option>
            <option value={2025}>2025</option>
          </select>
        </label>
        <label>
          Mes:&nbsp;
          <select value={mes} onChange={(e) => setMes(Number(e.target.value))}>
            {Array.from({ length: 12 }).map((_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1}
              </option>
            ))}
          </select>
        </label>
        <button onClick={fetchData} disabled={loading}>
          {loading ? "Cargando..." : "Actualizar"}
        </button>
      </div>

      {error && (
        <div style={{ color: "crimson", marginBottom: 8 }}>
          Error: {String(error)}
        </div>
      )}

      <div style={{ width: "100%", height: 420 }}>
        <ResponsiveContainer>
          {/* layout='vertical' = barras horizontales */}
          <BarChart
            data={detalle}
            layout="vertical"
            margin={{ top: 8, right: 160, bottom: 8, left: 16 }} // más espacio a la derecha
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              type="number"
              domain={[0, domainMax]} // headroom
              tickFormatter={(v) => currency.format(v)}
            />
            <YAxis type="category" dataKey="name" width={160} />
            <Tooltip formatter={(v, n) => [currency.format(v), n]} />

            <Bar dataKey="value" name="Monto">
              {detalle.map((_, i) => (
                <Cell key={i} fill={colors[i % colors.length]} />
              ))}
              {/* etiqueta al final; si aún se saliera, cambia a position="insideRight" */}
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
    </div>
  );
}
