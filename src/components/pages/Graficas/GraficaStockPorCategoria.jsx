import { useEffect, useMemo, useState } from "react";
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
  LabelList,
} from "recharts";

const COLORS = {
  rojo: "#ef4444",
  amarillo: "#f59e0b",
  verde: "#10b981",
  azul: "#3b82f6",
};

const BUCKET_NAME = {
  rojo: "Rojo (≤ Seguridad)",
  amarillo: "Amarillo (≤ Reorden)",
  verde: "Verde (≤ Máximo)",
  azul: "Azul (> Máximo)",
};

// Leyend con separación
function LegendBuckets({ payload }) {
  if (!payload) return null;
  return (
    <div className="legend-inline">
      {payload.map((entry) => {
        const name = BUCKET_NAME[entry.dataKey] || entry.value;
        const color = COLORS[entry.dataKey] || entry.color;
        return (
          <div key={entry.dataKey} className="legend-item">
            <span className="legend-dot" style={{ background: color }} />
            {name}
          </div>
        );
      })}
    </div>
  );
}

const currency = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 2,
});

// ---------- MOCK (si backend cae) ----------
function buildMockCategorias() {
  const mk = (base) => ({
    rojo_mxn: Math.round(base * (0.1 + Math.random() * 0.12)),
    amarillo_mxn: Math.round(base * (0.22 + Math.random() * 0.12)),
    verde_mxn: Math.round(base * (0.35 + Math.random() * 0.12)),
    azul_mxn: Math.round(base * (0.2 + Math.random() * 0.12)),
  });
  const C1 = mk(900_000);
  const C2 = mk(1_050_000);
  const C3 = mk(980_000);
  const C4 = mk(1_250_000);
  return [
    {
      categoria: "C1",
      total_mxn: Object.values(C1).reduce((a, b) => a + b, 0),
      ...C1,
    },
    {
      categoria: "C2",
      total_mxn: Object.values(C2).reduce((a, b) => a + b, 0),
      ...C2,
    },
    {
      categoria: "C3",
      total_mxn: Object.values(C3).reduce((a, b) => a + b, 0),
      ...C3,
    },
    {
      categoria: "C4",
      total_mxn: Object.values(C4).reduce((a, b) => a + b, 0),
      ...C4,
    },
  ];
}

export default function GraficaStockPorCategoria() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [vista, setVista] = useState("percent");
  const [topN, setTopN] = useState(10);
  const [orderBy, setOrderBy] = useState("total");
  const [error, setError] = useState("");

  const apiUrl =
    process.env.NODE_ENV === "production"
      ? process.env.REACT_APP_API_URL
      : process.env.REACT_APP_API_URL_LOCAL;

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const { data: resp } = await axios.get(
        `${apiUrl}/analiticas/stock/categorias`,
        { params: { soloConStock: 1 } }
      );
      const arr = Array.isArray(resp?.data) ? resp.data : [];
      setRows(arr);
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.message || e.message || "Error de red");
      setRows(buildMockCategorias());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(); /* eslint-disable-next-line */
  }, [apiUrl]);

  // ---- Ordena y colapsa en “Otros” ----
  const collapsed = useMemo(() => {
    if (!rows?.length) return [];

    // 1) define metrica de orden
    const metric = (r) => {
      if (orderBy === "total") return r.total_mxn || 0;
      if (orderBy === "rojo") return r.rojo_mxn || 0;
      if (orderBy === "amarillo") return r.amarillo_mxn || 0;
      if (orderBy === "verde") return r.verde_mxn || 0;
      if (orderBy === "azul") return r.azul_mxn || 0;
      return r.total_mxn || 0;
    };

    // 2) orden desc
    const sorted = [...rows].sort((a, b) => metric(b) - metric(a));

    // 3) topN + otros
    const top = sorted.slice(0, topN);
    const rest = sorted.slice(topN);

    if (rest.length === 0) return top;

    // suma “Otros”
    const otros = rest.reduce(
      (acc, r) => {
        acc.rojo_mxn += r.rojo_mxn || 0;
        acc.amarillo_mxn += r.amarillo_mxn || 0;
        acc.verde_mxn += r.verde_mxn || 0;
        acc.azul_mxn += r.azul_mxn || 0;
        acc.total_mxn += r.total_mxn || 0;
        return acc;
      },
      {
        categoria: "Otros",
        rojo_mxn: 0,
        amarillo_mxn: 0,
        verde_mxn: 0,
        azul_mxn: 0,
        total_mxn: 0,
      }
    );

    return [...top, otros];
  }, [rows, topN, orderBy]);

  // ---- Datos según vista ----
  const data = useMemo(() => {
    if (vista === "percent") {
      return collapsed.map((r) => {
        const tot = r.total_mxn || 1;
        return {
          categoria: r.categoria,
          rojo: (r.rojo_mxn || 0) / tot,
          amarillo: (r.amarillo_mxn || 0) / tot,
          verde: (r.verde_mxn || 0) / tot,
          azul: (r.azul_mxn || 0) / tot,
          total_mxn: r.total_mxn || 0,
        };
      });
    }
    return collapsed.map((r) => ({
      categoria: r.categoria,
      rojo: r.rojo_mxn || 0,
      amarillo: r.amarillo_mxn || 0,
      verde: r.verde_mxn || 0,
      azul: r.azul_mxn || 0,
      total_mxn: r.total_mxn || 0,
    }));
  }, [collapsed, vista]);

  const labelIfBigEnough = ({ value }) =>
    value >= 0.1 ? `${(value * 100).toFixed(0)}%` : "";

  const yTickFormatter =
    vista === "percent"
      ? (v) => `${Math.round(v * 100)}%`
      : (v) => currency.format(v);
  const yWidth = vista === "percent" ? 52 : 110;

  const domainMax = useMemo(() => {
    if (!data?.length || vista === "percent") return "auto";
    const max = Math.max(
      ...data.map(
        (d) =>
          (d.rojo || 0) + (d.amarillo || 0) + (d.verde || 0) + (d.azul || 0)
      )
    );
    return Math.ceil(max * 1.15);
  }, [data, vista]);

  return (
    <section className="meli-card meli-card--accent">
      <header className="meli-header">
        <div>
          <h2 className="meli-title">Stock por categoría</h2>
          <p className="meli-subtitle">
            Barras apiladas por categoria: Rojo / Amarillo / Verde / Azul
          </p>
        </div>

        <div className="meli-filters" style={{ gap: 8, flexWrap: "wrap" }}>
          <label className="meli-field">
            <span>Vista</span>
            <select
              className="meli-select"
              value={vista}
              onChange={(e) => setVista(e.target.value)}
              disabled={loading}
            >
              <option value="percent">% (proporción)</option>
              <option value="valor">$ (MXN)</option>
            </select>
          </label>

          <label className="meli-field">
            <span>Ordenar por</span>
            <select
              className="meli-select"
              value={orderBy}
              onChange={(e) => setOrderBy(e.target.value)}
              disabled={loading}
            >
              <option value="total">Total</option>
              <option value="rojo">Rojo</option>
              <option value="amarillo">Amarillo</option>
              <option value="verde">Verde</option>
              <option value="azul">Azul</option>
            </select>
          </label>

          <label className="meli-field">
            <span>Top N</span>
            <select
              className="meli-select"
              value={topN}
              onChange={(e) => setTopN(Number(e.target.value))}
              disabled={loading}
            >
              {[5, 10, 15, 20, 30].map((n) => (
                <option key={n} value={n}>
                  {n}
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
        </div>
      </header>

      {rows.length > topN && (
        <div
          className="meli-subtitle"
          style={{ marginTop: -8, marginBottom: 8 }}
        >
          Mostrando <strong>Top {topN}</strong> por <strong>{orderBy}</strong> +
          barra <strong>“Otros”</strong>.
        </div>
      )}

      <div className="meli-chart" style={{ height: 420 }}>
        <ResponsiveContainer>
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
          <BarChart
            data={data}
            stackOffset={vista === "percent" ? "expand" : undefined}
            margin={{ top: 8, right: 24, bottom: 68, left: yWidth + 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="categoria" interval={0} angle={-20} dy={10} />
            <YAxis
              width={yWidth}
              domain={vista === "percent" ? [0, 1] : [0, domainMax]}
              tickFormatter={yTickFormatter}
            />
            <Tooltip
              formatter={(val, key, entry) =>
                vista === "percent"
                  ? [`${(val * 100).toFixed(1)}%`, BUCKET_NAME[key]]
                  : [currency.format(val), BUCKET_NAME[key]]
              }
              labelFormatter={(cat, payload) => {
                const tot = payload?.[0]?.payload?.total_mxn ?? 0;
                return vista === "percent"
                  ? `Categoría: ${cat}`
                  : `Categoría: ${cat} — Total: ${currency.format(tot)}`;
              }}
            />
            <Legend
              verticalAlign="bottom"
              align="center"
              content={<LegendBuckets />}
              wrapperStyle={{ paddingTop: 8 }}
            />

            <Bar
              dataKey="rojo"
              stackId="a"
              name={BUCKET_NAME.rojo}
              fill={COLORS.rojo}
            >
              {vista === "percent" && (
                <LabelList
                  dataKey="rojo"
                  position="center"
                  formatter={labelIfBigEnough}
                />
              )}
            </Bar>
            <Bar
              dataKey="amarillo"
              stackId="a"
              name={BUCKET_NAME.amarillo}
              fill={COLORS.amarillo}
            >
              {vista === "percent" && (
                <LabelList
                  dataKey="amarillo"
                  position="center"
                  formatter={labelIfBigEnough}
                />
              )}
            </Bar>
            <Bar
              dataKey="verde"
              stackId="a"
              name={BUCKET_NAME.verde}
              fill={COLORS.verde}
            >
              {vista === "percent" && (
                <LabelList
                  dataKey="verde"
                  position="center"
                  formatter={labelIfBigEnough}
                />
              )}
            </Bar>
            <Bar
              dataKey="azul"
              stackId="a"
              name={BUCKET_NAME.azul}
              fill={COLORS.azul}
            >
              {vista === "percent" && (
                <LabelList
                  dataKey="azul"
                  position="center"
                  formatter={labelIfBigEnough}
                />
              )}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
