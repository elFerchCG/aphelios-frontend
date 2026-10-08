// helpers/soporteHelpers.js

export const formatearFechaHora = (fecha) => {
  if (!fecha) {
    return "-";
  }

  const date = new Date(fecha);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const obtenerTextoEstatus = (estatus) => {
  const opciones = {
    abierto: "Abierto",
    en_revision: "En revisión",
    en_desarrollo: "En desarrollo",
    esperando_usuario: "Esperando usuario",
    resuelto: "Resuelto",
    cerrado: "Cerrado",
    cancelado: "Cancelado",
  };

  return opciones[estatus] || estatus || "-";
};

export const obtenerColorEstatus = (estatus) => {
  switch (estatus) {
    case "abierto":
      return "info";

    case "en_revision":
      return "primary";

    case "en_desarrollo":
    case "esperando_usuario":
      return "warning";

    case "resuelto":
      return "success";

    case "cancelado":
      return "error";

    case "cerrado":
    default:
      return "default";
  }
};

export const obtenerTextoPrioridad = (prioridad) => {
  const opciones = {
    baja: "Baja",
    normal: "Normal",
    alta: "Alta",
    critica: "Crítica",
  };

  return opciones[prioridad] || prioridad || "-";
};

export const obtenerColorPrioridad = (prioridad) => {
  switch (prioridad) {
    case "normal":
      return "info";

    case "alta":
      return "warning";

    case "critica":
      return "error";

    case "baja":
    default:
      return "default";
  }
};