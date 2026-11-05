// Utilidades compartidas del módulo Cuentas por pagar.

export const getAuthHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

export const getUsuarioSesion = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
};

// Mismas reglas que el backend: solo contabilidad escribe; administrador y Desarrollador consultan.
export const puedeEscribirCxP = (user) =>
  String(user?.rol_descripcion ?? "").trim().toLowerCase() === "contabilidad";

// "YYYY-MM-DD" de hoy en la zona horaria de la empresa.
export const hoyMexico = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/Mexico_City" }).format(new Date());

export const sumarDias = (fecha, dias) => {
  const d = new Date(`${fecha}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + Number(dias || 0));
  return d.toISOString().slice(0, 10);
};

// El backend manda fechas como texto "YYYY-MM-DD" o "YYYY-MM-DD HH:mm"; se formatean sin
// pasar por Date para que no se recorran por zona horaria.
export const fmtFecha = (valor) => {
  if (!valor) return "—";
  const [y, m, d] = String(valor).slice(0, 10).split("-");
  return y && m && d ? `${d}/${m}/${y}` : "—";
};

export const fmtFechaHora = (valor) => {
  if (!valor) return "—";
  const hora = String(valor).slice(11, 16);
  return `${fmtFecha(valor)}${hora ? ` ${hora}` : ""}`;
};

const formatoMoneda = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });
export const fmtMoneda = (v) => formatoMoneda.format(Number(v || 0));

// Dinero en centavos enteros para no acumular errores de redondeo.
export const aCentavos = (v) => Math.round(Number(v || 0) * 100);
export const aPesos = (c) => Number((c / 100).toFixed(2));

export const montoValido = (valor) => {
  const n = Number(valor);
  return valor !== "" && Number.isFinite(n) && n > 0 && Math.abs(n * 100 - Math.round(n * 100)) < 1e-6;
};

// Dígito verificador de CLABE (pesos 3, 7, 1).
export const clabeValida = (clabe) => {
  if (!/^\d{18}$/.test(clabe)) return false;
  const pesos = [3, 7, 1];
  let suma = 0;
  for (let i = 0; i < 17; i += 1) suma += (Number(clabe[i]) * pesos[i % 3]) % 10;
  return (10 - (suma % 10)) % 10 === Number(clabe[17]);
};

export const ESTADOS_FACTURA = {
  vencida: { label: "Vencida", color: "#d32f2f", bg: "#ffebee" },
  pronto_pago: { label: "Pronto pago", color: "#2e7d32", bg: "#e8f5e9" },
  por_vencer: { label: "Por vencer", color: "#ed6c02", bg: "#fff3e0" },
  vigente: { label: "Vigente", color: "#1976d2", bg: "#e3f2fd" },
  sin_terminos: { label: "Sin términos", color: "#616161", bg: "#f5f5f5" },
  pagada: { label: "Pagada", color: "#00695c", bg: "#e0f2f1" },
  pagado_historico: { label: "Pagado histórico", color: "#6a1b9a", bg: "#f3e5f5" },
};

export const getEstadoFactura = (estado) =>
  ESTADOS_FACTURA[estado] || { label: estado || "—", color: "#616161", bg: "#f5f5f5" };

// Filtros de facturas; los KPIs usan los mismos valores.
export const FILTROS_FACTURA = [
  { value: "abiertas", label: "Por pagar (todas)" },
  { value: "vencidas", label: "Vencidas" },
  { value: "por_vencer", label: "Por vencer (7 días)" },
  { value: "pronto_pago", label: "En pronto pago" },
  { value: "sin_terminos", label: "Sin términos" },
  { value: "pagadas", label: "Pagadas" },
  { value: "historico", label: "Pagado histórico" },
  { value: "todas", label: "Todas" },
];

export const ESTATUS_PAGO = {
  aplicado: { label: "Aplicado", color: "#2e7d32", bg: "#e8f5e9" },
  cancelado: { label: "Cancelado", color: "#d32f2f", bg: "#ffebee" },
};

export const getEstatusPago = (estatus) =>
  ESTATUS_PAGO[estatus] || { label: estatus || "—", color: "#616161", bg: "#f5f5f5" };

export const TIPOS_MOVIMIENTO = {
  pago: "Pago (transferencia)",
  descuento_pronto_pago: "Descuento pronto pago",
};

export const chipSuaveSx = (info, extra = {}) => ({
  bgcolor: info.bg,
  color: info.color,
  border: `1px solid ${info.color}`,
  fontWeight: 600,
  ...extra,
});

export const nombreFactura = (f) => {
  const serieFolio = [f?.serie, f?.folio].filter(Boolean).join("-");
  return serieFolio && serieFolio !== f?.numero_factura
    ? `${f?.numero_factura || serieFolio} (${serieFolio})`
    : f?.numero_factura || serieFolio || `#${f?.id}`;
};

// Descuento por pronto pago que se puede aplicar a una factura en la fecha indicada.
export const descuentoAplicable = (factura, fechaPago) => {
  const descuento = aCentavos(factura?.descuento_disponible);
  if (descuento <= 0 || !factura?.fecha_pronto_pago) return 0;
  if (fechaPago > factura.fecha_pronto_pago) return 0;
  if (Number(factura.total_descuento || 0) > 0) return 0;
  if (descuento >= aCentavos(factura.saldo)) return 0;
  return descuento;
};
