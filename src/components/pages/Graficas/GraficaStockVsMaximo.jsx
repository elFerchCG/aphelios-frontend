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

const apiUrl =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_URL
    : process.env.REACT_APP_API_URL_LOCAL;


// Nombres para mostrar
const NOMBRE = {
  critico: "Crítico (sin stock con demanda)",
  bajo: "Inventario Bajo <= Seguridad",
  medio: "Inventario Medio > Seguridad Y <= Punto reorden",
  saludable: "Inventario Saludable > Punto reorden Y <= Máximo",
  sobrestock: "Sobrestock > Máximo",
  sin_demanda: "Sin demanda",
  sin_demanda_con_stock: "Sin demanda (con stock)",
};


// Colores tipo gradiente de salud de inventario
const COLORS = {
  critico: "#dc2626",      // rojo
  bajo: "#f97316",         // naranja
  medio: "#eab308",        // amarillo
  saludable: "#22c55e",    // verde
  sobrestock: "#2563eb",   // azul
  sin_demanda: "#9ca3af",  // gris
  sin_demanda_con_stock: "#4a4d53", // gris oscuro
};


export default function GraficaCoberturaStock() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [proveedores, setProveedores] = useState([]);
  const [proveedorId, setProveedorId] = useState("");

  // Total para el centro del donut
  const total = useMemo(
    () => data.reduce((acc, d) => acc + (Number(d.value) || 0), 0),
    [data]
  );

  // 🔹 Obtener proveedores
  const fetchProveedores = async () => {
    try {
      const { data } = await axios.get(`${apiUrl}/proveedores/`);
      setProveedores(data);
    } catch (e) {
      console.error("Error cargando proveedores:", e);
    }
  };

  const fetchDataGeneral = async () => {
    setLoading(true);
    try {
      const { data: resp } = await axios.get(
        `${apiUrl}/analiticas/stock/maximo_vs_stock`
      );

      const series = (resp?.data ?? []).map((b) => ({
        key: b.bucket,
        name: NOMBRE[b.bucket] ?? b.bucket,
        value: Number(b.items || 0),
        color: COLORS[b.bucket] ?? "#999999",
      }));

      setData(series);
    } catch (e) {
      console.error("Error cargando cobertura general:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchDataProveedor = async () => {
    if (!proveedorId) return;

    setLoading(true);
    try {
      const { data: resp } = await axios.get(
        `${apiUrl}/analiticas/stock-actual/${proveedorId}`
      );

      const series = (resp?.data ?? []).map((b) => ({
        key: b.bucket,
        name: NOMBRE[b.bucket] ?? b.bucket,
        value: Number(b.items || 0),
        color: COLORS[b.bucket] ?? "#999999",
      }));

      setData(series);
    } catch (e) {
      console.error("Error cargando cobertura por proveedor:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProveedores();
    fetchDataGeneral();
  }, []);

  useEffect(() => {
    if (proveedorId) {
      fetchDataProveedor();
    } else {
      fetchDataGeneral();
    }
  }, [proveedorId]);

  return (
    <section className="meli-card meli-card--accent">
      <header className="meli-header">
        <div>
          <h2 className="meli-title">Cobertura de Stock</h2>
          <p className="meli-subtitle">
            Porcentaje de inventario vs ideal (proyectado) por el MRP
          </p>
        </div>

        <div className="meli-filters">
          {/* 🔹 SELECT PROVEEDORES */}
          <select
            className="meli-select"
            value={proveedorId}
            onChange={(e) => setProveedorId(e.target.value)}
          >
            <option value="">Todos los proveedores</option>
            {proveedores.map((p) => (
              <option key={p.id_proveedor} value={p.id_proveedor}>
                {p.razon_social}
              </option>
            ))}
          </select>

          <button
            className="meli-button"
            onClick={() => {
              if (proveedorId) {
                fetchDataProveedor();
              } else {
                fetchDataGeneral();
              }
            }}
            disabled={loading}
          >
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

            {/* Centro del donut */}
            <text
              x="50%"
              y="50%"
              textAnchor="middle"
              dominantBaseline="middle"
              style={{
                fontWeight: 800,
                fontSize: 16,
                pointerEvents: "none",
              }}
            >
              {total}
            </text>

            <text
              x="50%"
              y="50%"
              dy="18"
              textAnchor="middle"
              dominantBaseline="middle"
              style={{
                fill: "#6b7280",
                fontSize: 12,
                pointerEvents: "none",
              }}
            >
              Publicaciones
            </text>

            <Tooltip formatter={(v, n) => [`${v} publicaciones`, n]} />

            <Legend
              layout="horizontal"
              verticalAlign="bottom"
              align="center"
              formatter={(value, entry) =>
                `${value} — ${entry?.payload?.value ?? 0} publicaciones`
              }
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}