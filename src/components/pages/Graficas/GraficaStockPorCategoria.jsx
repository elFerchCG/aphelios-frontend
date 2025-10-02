import { useEffect, useMemo, useState } from "react";
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

// ---------- MOCK (mientras no hay backend) ----------
function buildMockCategorias() {
  // Crea 4 categorías con valores por bucket (MXN)
  const mk = (base) => ({
    rojo:     Math.round(base * (0.10 + Math.random() * 0.12)),
    amarillo: Math.round(base * (0.22 + Math.random() * 0.12)),
    verde:    Math.round(base * (0.35 + Math.random() * 0.12)),
    azul:     Math.round(base * (0.20 + Math.random() * 0.12)),
  });
  const C1 = mk(900_000);
  const C2 = mk(1_050_000);
  const C3 = mk(980_000);
  const C4 = mk(1_250_000);

  return [
    { categoria: "C1", ...C1 },
    { categoria: "C2", ...C2 },
    { categoria: "C3", ...C3 },
    { categoria: "C4", ...C4 },
  ];
}

// Colores consistentes con la dona de stock:
const COLORS = {
  rojo: "#ef4444",
  amarillo: "#f59e0b",
  verde: "#10b981",
  azul: "#3b82f6",
};

export default function GraficaStockPorCategoria() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  // vista: porcentaje (100% stacked) o valor absoluto
  const [vista, setVista] = useState("percent"); // 'percent' | 'valor'

  const fetchData = async () => {
    setLoading(true);
    try {
      // Cuando tengas API:
      // const res = await fetch(`${apiUrl}/analytics/stock/por-categoria`);
      // const json = await res.json();
      // setData(json.data);
      setData(buildMockCategorias());
    } catch (e) {
      setData(buildMockCategorias());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Para labels en modo % (mostrar solo si el segmento es ≥10%)
  const labelIfBigEnough = ({ value }) =>
    value >= 0.10 ? `${(value * 100).toFixed(0)}%` : "";

  // Dominios / formato eje Y según vista
  const yTickFormatter =
    vista === "percent"
      ? (v) => `${Math.round(v * 100)}%`
      : (v) => currency.format(v);

  const yWidth = vista === "percent" ? 52 : 110;

  // Máximo para vista "valor"
  const domainMax = useMemo(() => {
    if (!data?.length || vista === "percent") return "auto";
    const max = Math.max(
      ...data.map((d) => d.rojo + d.amarillo + d.verde + d.azul)
    );
    return Math.ceil(max * 1.15);
  }, [data, vista]);

  return (
    <section className="meli-card meli-card--accent">
      <header className="meli-header">
        <div>
          <h2 className="meli-title">Stock por categoría</h2>
          <p className="meli-subtitle">
            Barras apiladas por bucket: Rojo / Amarillo / Verde / Azul
          </p>
        </div>

        <div className="meli-filters">
          <label className="meli-field">
            <span>Vista</span>
            <select
              className="meli-select"
              value={vista}
              onChange={(e) => setVista(e.target.value)}
            >
              <option value="percent">% (proporción)</option>
              <option value="valor">Valor (MXN)</option>
            </select>
          </label>

          <button className="meli-button" onClick={fetchData} disabled={loading}>
            {loading ? "Cargando…" : "Actualizar"}
          </button>
        </div>
      </header>

      <div className="meli-chart">
        <ResponsiveContainer>
          <BarChart
            data={data}
            stackOffset={vista === "percent" ? "expand" : undefined}
            margin={{ top: 8, right: 24, bottom: 16, left: yWidth + 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="categoria" />
            <YAxis
              width={yWidth}
              domain={vista === "percent" ? [0, 1] : [0, domainMax]}
              tickFormatter={yTickFormatter}
            />
            <Tooltip
              formatter={(val, name) =>
                vista === "percent"
                  ? [`${(val * 100).toFixed(1)}%`, name]
                  : [currency.format(val), name]
              }
              labelFormatter={(cat) => `Categoría: ${cat}`}
            />
            <Legend />

            {/* ROJO */}
            <Bar dataKey="rojo" name="Rojo (≤ Seguridad)" stackId="a" fill={COLORS.rojo}>
              {vista === "percent" && (
                <LabelList dataKey="rojo" position="center" formatter={labelIfBigEnough} />
              )}
            </Bar>
            {/* AMARILLO */}
            <Bar dataKey="amarillo" name="Amarillo (≤ Reorden)" stackId="a" fill={COLORS.amarillo}>
              {vista === "percent" && (
                <LabelList dataKey="amarillo" position="center" formatter={labelIfBigEnough} />
              )}
            </Bar>
            {/* VERDE */}
            <Bar dataKey="verde" name="Verde (≤ Máximo)" stackId="a" fill={COLORS.verde}>
              {vista === "percent" && (
                <LabelList dataKey="verde" position="center" formatter={labelIfBigEnough} />
              )}
            </Bar>
            {/* AZUL */}
            <Bar dataKey="azul" name="Azul (> Máximo)" stackId="a" fill={COLORS.azul}>
              {vista === "percent" && (
                <LabelList dataKey="azul" position="center" formatter={labelIfBigEnough} />
              )}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
