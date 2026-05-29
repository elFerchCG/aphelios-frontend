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

function adaptBackendToSeries(payload) {
  if (Array.isArray(payload?.data)) return payload.data;

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
  useBackend = true,
  compactWeekLabel = true,
}) {
  const [data, setData] = useState([]);
  const [rawLabels, setRawLabels] = useState([]);
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

        setRawLabels(resp?.labels ?? []);

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
      }
    } catch (e) {
      console.error("Error en fetchData Proyección vs Ventas:", e);
      setError(e?.response?.data?.message || e.message || "Error de red");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const descargarExcel = async () => {
    try {
      setError("");

      const lastRawLabel = rawLabels[rawLabels.length - 1];

      if (!lastRawLabel) {
        setError("No hay semana disponible para descargar.");
        return;
      }

      const [anioStr, semanaStr] = String(lastRawLabel).split("-S");

      const anio = Number(anioStr);
      const semana = Number(semanaStr);

      if (!anio || !semana) {
        setError("No se pudo detectar el año y semana del reporte.");
        return;
      }

      const response = await axios.get(
        `${apiUrl}/analiticas/proyeccionVSventas/productos/excel`,
        {
          params: { anio, semana },
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");

      link.href = url;
      link.setAttribute(
        "download",
        `proyeccion_vs_ventas_${anio}_S${String(semana).padStart(2, "0")}.xlsx`
      );

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Error descargando Excel:", e);
      setError("No se pudo descargar el Excel");
    }
  };

  useEffect(() => {
    fetchData();
  }, [weeks, apiUrl, useBackend]);

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
          <button className="meli-button" onClick={fetchData} disabled={loading}>
            {loading ? "Cargando…" : "Actualizar"}
          </button>

          <button
            className="meli-button"
            onClick={descargarExcel}
            disabled={loading || !rawLabels.length}
          >
            Descargar Reporte
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