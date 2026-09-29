// Utilidades compartidas del módulo de Recepción de pedidos.

export const getAuthHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

export const ESTATUS_RECEPCION = {
  pendiente: { label: "Pendiente", color: "#ed6c02", bg: "#fff3e0" },
  en_recepcion: { label: "En recepción", color: "#0288d1", bg: "#e1f5fe" },
  recibido: { label: "Recibido", color: "#2e7d32", bg: "#e8f5e9" },
};

export const getEstatusInfo = (estatus) =>
  ESTATUS_RECEPCION[estatus] || { label: estatus || "—", color: "#616161", bg: "#f5f5f5" };

export const TIPOS_DOCUMENTO = {
  numero_proveedor: { label: "# Pedido proveedor", corto: "PO", color: "#37474f", bg: "#eceff1" },
  nota_entrega: { label: "Nota de entrega", corto: "Nota", color: "#6a1b9a", bg: "#f3e5f5" },
  factura: { label: "Factura", corto: "Factura", color: "#1565c0", bg: "#e3f2fd" },
};

// sx de un Chip con los colores del tipo de documento.
export const chipDocumentoSx = (tipo, extra = {}) => {
  const info = TIPOS_DOCUMENTO[tipo] || { color: "#616161", bg: "#f5f5f5" };
  return { bgcolor: info.bg, color: info.color, fontWeight: 600, ...extra };
};

export const getTipoDocumentoInfo = (tipo) =>
  TIPOS_DOCUMENTO[tipo] || { label: tipo || "—", corto: tipo || "—", color: "#616161", bg: "#f5f5f5" };

const normalizar = (v) => String(v ?? "").trim().toLowerCase();

// Mismas reglas que el backend (authorizeFresh). El backend es quien valida
// de verdad; esto solo decide qué botones se muestran.
export const puedeRegistrarRecepcion = (user) => {
  const rol = normalizar(user?.rol_descripcion);
  if (rol === "administrador") return true;
  return rol === "almacenista" && normalizar(user?.permisos) === "supervisor";
};

export const puedeEditarPedido = (user) => {
  const rol = normalizar(user?.rol_descripcion);
  return rol === "administrador" || rol === "planeador";
};

export const getUsuarioSesion = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
};

export const formatFechaHora = (valor) => {
  if (!valor) return "—";
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return "—";
  return fecha.toLocaleString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatFecha = (valor) => {
  if (!valor) return "—";
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return "—";
  return fecha.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
};

export const fmtNum = (v) => Number(v ?? 0).toLocaleString("es-MX");

const pad = (n) => String(n).padStart(2, "0");

// "YYYY-MM-DDTHH:mm" en hora local (para inputs datetime-local).
export const aInputFechaHora = (valor) => {
  const d = valor ? new Date(valor) : new Date();
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}`;
};

export const ahoraLocalInput = () => aInputFechaHora(null);

// "YYYY-MM-DD" en hora local (para inputs date).
export const aInputFecha = (valor) => {
  if (!valor) return "";
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const hoyISO = () => ahoraLocalInput().slice(0, 10);

// Compromiso vencido: la fecha ya pasó y el pedido aún no está recibido.
export const compromisoVencido = (pedido) => {
  if (!pedido?.fecha_compromiso || pedido.estatus_recepcion === "recibido") return false;
  return aInputFecha(pedido.fecha_compromiso) < hoyISO();
};
