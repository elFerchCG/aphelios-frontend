import { useEffect, useState, useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LabelList,
} from "recharts";

const currency = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 2,
});

// ---- Mock generator (mientras no hay backend) ----
function buildMockData(weeks = 5) {
  // Simula tendencia y ruido. P = proyección, V = ventas reales.
  // Semana 1 = la más antigua; Semana 5 = la más reciente.
  const base = 1500000; // cambia si quieres otro orden de magnitud
  return Array.from({ length: weeks }, (_, i) => {
    const idx = i + 1;
    const tendencia = base + i * 200000; // va subiendo cada semana
    const proyeccion = Math.round(tendencia * (0.95 + 0.15 * Math.random()));
    const ventas = Math.round(proyeccion * (0.9 + 0.2 * Math.random()));
    return {
      semana: `S${idx}`, // etiqueta: S1..S5
      proyeccion,
      ventas,
    };
  });
}

export default function GraficaProyeccionVsVentas({
  weeks = 5,
  useBackend = false,          // cuando tengas API, ponlo en true y llama a tu endpoint
  apiUrl,                      // p.ej. `${process.env.REACT_APP_API_URL}/analytics/mrp/proyeccion-vs-ventas`
}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Carga datos (mock por ahora)
  const fetchData = async () => {
    setLoading(true);
    try {
      if (useBackend && apiUrl) {
        const res = await fetch(`${apiUrl}?weeks=${weeks}`);
        const json = await res.json();
        // Espera un arreglo con objetos: { semana: 'S1', proyeccion: number, ventas: number }
        setData(json?.data ?? []);
      } else {
        setData(buildMockData(weeks));
      }
    } catch (e) {
      setData(buildMockData(weeks)); // fallback a mock
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); /* eslint-disable-next-line */ }, [weeks, apiUrl, useBackend]);

  // Headroom para etiquetas arriba de las barras
  const domainMax = useMemo(() => {
    const max = Math.max(0, ...data.flatMap(d => [d.proyeccion || 0, d.ventas || 0]));
    return Math.ceil(max * 1.15);
  }, [data]);

  return (
    <section className="meli-card meli-card--accent">
      <header className="meli-header">
        <div>
          <h2 className="meli-title">Proyección vs Ventas (últimas 5 semanas)</h2>
          <p className="meli-subtitle">P = Proyección · V = Ventas · Fuente: MRP</p>
        </div>
        <div className="meli-filters">
          <button className="meli-button" onClick={fetchData} disabled={loading}>
            {loading ? "Cargando…" : "Actualizar"}
          </button>
        </div>
      </header>

      <div className="meli-chart" style={{ height: 420 }}>
<ResponsiveContainer>
  <BarChart
    data={data}
    barGap={6}
    barCategoryGap="28%"
    margin={{ top: 8, right: 40, bottom: 16, left: 110 }}  // ⬅️ más espacio a la izquierda
  >
    <CartesianGrid strokeDasharray="3 3" />

    {/* Formato compacto para el eje (opcional) */}
    {/*
    const formatAxis = (v) => v >= 1e6 ? `${(v/1e6).toFixed(2)}M` : currency.format(v);
    */}
    <XAxis dataKey="semana" />
    <YAxis
      width={120}                                   // ⬅️ reserva ancho para ticks
      tickFormatter={(v) => currency.format(v)}     // o usa formatAxis si prefieres compactar
      domain={[0, domainMax]}
    />

    <Tooltip formatter={(v, n) => [currency.format(v), n]} />
    <Legend />

    <Bar dataKey="proyeccion" name="Proyección (P)" fill="#6366f1" radius={[6,6,0,0]}>
    </Bar>

    <Bar dataKey="ventas" name="Ventas (V)" fill="#22c55e" radius={[6,6,0,0]}>
    </Bar>
  </BarChart>
</ResponsiveContainer>
      </div>
    </section>
  );
}
