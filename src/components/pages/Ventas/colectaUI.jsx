// Piezas comunes de las colectas (Aphelios y Refaccionaria): formato de fecha y
// tarjetas por colecta al estilo de Mercado Libre.
// [MULTICUENTA-ML] Las tarjetas salen del horario de colecta programado de la
// cuenta (/users/{seller}/shipping/schedule/cross_docking): cada envío se acomoda
// en su ventana (desde - hasta) y los que perdieron su colecta pasan a la siguiente.
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Box, Chip, Paper, Stack, Typography } from "@mui/material";
import dayjs from "dayjs";
import "dayjs/locale/es";

const apiUrl = process.env.NODE_ENV === "production" ? process.env.REACT_APP_API_URL : process.env.REACT_APP_API_URL_LOCAL;

/** 2026/octubre/19 (con hora: 2026/octubre/19 14:30 hs) */
export const formatoFecha = (v, conHora = false) => {
  if (!v) return "";
  const d = dayjs(v).locale("es");
  return d.isValid() ? d.format(conHora ? "YYYY/MMMM/DD HH:mm [hs]" : "YYYY/MMMM/DD") : "";
};

const SIN_FECHA = "sin_fecha";

/** Clave por hora exacta del SLA (se usa si no hay horario de colecta). */
export const claveColecta = (v) => (v && dayjs(v).isValid() ? dayjs(v).format("YYYY-MM-DD HH:mm") : SIN_FECHA);

// ---------------------------------------------------------------------------
// Horario de colecta
// ---------------------------------------------------------------------------
const DIAS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]; // índice = dayjs().day()
const PENDIENTES = ["ready_to_print", "etiqueta_impresa", "listo_para_recolectar"];
const cacheHorarios = new Map(); // clave -> Promise

/**
 * Horario de colecta de cada cuenta. claves: ["principal"] o ids de cuentas_ml.
 * Devuelve Map clave -> { dias: { monday: [{desde, hasta}] ... } }; vacío si ML no responde.
 */
export const useHorariosColecta = (claves) => {
  const [horarios, setHorarios] = useState(new Map());
  const firma = [...new Set((claves || []).filter(Boolean).map(String))].sort().join(",");
  useEffect(() => {
    let vivo = true;
    const lista = firma ? firma.split(",") : [];
    Promise.all(
      lista.map((k) => {
        if (!cacheHorarios.has(k)) {
          const params = k === "principal" ? {} : { cuentaMlId: k };
          cacheHorarios.set(
            k,
            axios
              .get(`${apiUrl}/multicuentaML/colecta/horario`, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }, params })
              .then((r) => r.data)
              .catch(() => {
                cacheHorarios.delete(k); // se reintenta en la próxima carga
                return null;
              }),
          );
        }
        return cacheHorarios.get(k).then((h) => [k, h]);
      }),
    ).then((pares) => vivo && setHorarios(new Map(pares.filter(([, h]) => h?.dias))));
    return () => {
      vivo = false;
    };
  }, [firma]);
  return horarios;
};

const ventanasDelDia = (horario, dia) =>
  (horario?.dias?.[DIAS[dia.day()]] || []).map((v) => {
    const [hd, md] = v.desde.split(":").map(Number);
    const [hh, mh] = v.hasta.split(":").map(Number);
    return {
      inicio: dia.hour(hd).minute(md).second(0),
      fin: dia.hour(hh).minute(mh).second(0),
      desde: v.desde,
      hasta: v.hasta,
    };
  });

/** Ventana a la que pertenece una fecha límite: la primera que aún no termina ese día, o la última del día. */
function ventanaDeFecha(horario, fecha) {
  for (let i = 0; i < 8; i++) {
    const dia = fecha.startOf("day").add(i, "day");
    const vs = ventanasDelDia(horario, dia);
    if (!vs.length) continue;
    if (i > 0) return vs[0];
    return vs.find((v) => !fecha.isAfter(v.fin)) || vs[vs.length - 1];
  }
  return null;
}

/** Próxima colecta que todavía no termina. */
function siguienteVentana(horario, ahora) {
  for (let i = 0; i < 8; i++) {
    const vs = ventanasDelDia(horario, ahora.startOf("day").add(i, "day"));
    const v = vs.find((x) => x.fin.isAfter(ahora));
    if (v) return v;
  }
  return null;
}

const claveVentana = (v) => `${v.inicio.format("YYYY-MM-DD")}|${v.desde}|${v.hasta}`;

/**
 * Colecta de cada envío. Con horario: su ventana programada; si ya pasó y sigue
 * pendiente (por imprimir o lista), la siguiente colecta como "colecta anterior".
 * Sin horario: la hora exacta del SLA (como antes).
 */
export const asignarColectas = (envios, horarios, cuentaDe = () => "principal", ahora = dayjs()) => {
  const m = new Map();
  for (const s of envios) {
    const fecha = s.expected_date && dayjs(s.expected_date).isValid() ? dayjs(s.expected_date) : null;
    const horario = horarios.get(String(cuentaDe(s)));
    if (!fecha) {
      m.set(s.shipment_id, { clave: SIN_FECHA, anterior: false });
      continue;
    }
    const propia = horario ? ventanaDeFecha(horario, fecha) : null;
    if (!propia) {
      m.set(s.shipment_id, { clave: claveColecta(s.expected_date), anterior: false, hora: fecha });
      continue;
    }
    let v = propia;
    let anterior = false;
    // Las canceladas también pasan a la colecta en curso, para apartarlas ("No despachar")
    if ((PENDIENTES.includes(s.estado_operativo) || s.estado_operativo === "cancelado") && propia.fin.isBefore(ahora)) {
      v = siguienteVentana(horario, ahora) || propia;
      anterior = v !== propia;
    }
    m.set(s.shipment_id, { clave: claveVentana(v), anterior, ventana: v });
  }
  return m;
};

// ---------------------------------------------------------------------------
// Tarjetas
// ---------------------------------------------------------------------------
const Linea = ({ texto, n, color }) =>
  n > 0 ? (
    <Stack direction="row" justifyContent="space-between" alignItems="center" gap={2}>
      <Typography variant="caption" sx={{ color: "text.secondary" }}>
        {texto}
      </Typography>
      <Chip
        size="small"
        label={n}
        sx={{ height: 18, minWidth: 26, fontWeight: 700, fontSize: 11, bgcolor: color ? `${color}1A` : "transparent", color: color || "text.primary" }}
      />
    </Stack>
  ) : null;

const TarjetaColecta = ({ activa, etiqueta, titulo, detalle, total, desglose, onClick }) => (
  <Paper
    variant="outlined"
    onClick={onClick}
    sx={{
      px: 1.5,
      py: 1,
      minWidth: 230,
      flexShrink: 0,
      cursor: "pointer",
      borderRadius: 2,
      borderLeft: "4px solid",
      borderLeftColor: activa ? "primary.main" : "#e0e0e0",
      bgcolor: activa ? "#f5f9ff" : "background.paper",
      transition: "background-color .15s",
      "&:hover": { bgcolor: "#f5f9ff" },
    }}
  >
    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
      <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
        {etiqueta}
      </Typography>
      <Chip size="small" label={total} sx={{ height: 20, fontWeight: 700, bgcolor: "#eeeeee" }} />
    </Stack>
    <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
      {titulo}
    </Typography>
    {detalle && (
      <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
        {detalle}
      </Typography>
    )}
    {desglose && (
      <Stack gap={0.25} sx={{ mt: 0.75, pt: 0.75, borderTop: "1px solid #eee" }}>
        <Linea texto="Colecta anterior. Despachar" n={desglose.anterior} color="#d32f2f" />
        <Linea texto="Canceladas. No despachar" n={desglose.canceladas} color="#d32f2f" />
        <Linea texto="Por imprimir" n={desglose.porImprimir} color="#ed6c02" />
        <Linea texto="Listas para enviar" n={desglose.listas} />
        <Linea texto="Recolectadas" n={desglose.recolectadas} color="#2e7d32" />
      </Stack>
    )}
  </Paper>
);

const etiquetaDia = (d) => {
  const hoy = dayjs().startOf("day");
  if (d.isSame(hoy, "day")) return "Colecta de hoy";
  if (d.isSame(hoy.add(1, "day"), "day")) return "Colecta de mañana";
  return d.isBefore(hoy) ? "Colecta pasada" : "Próxima colecta";
};

/**
 * Tarjetas por colecta, como en Mercado Libre.
 *   envios      los de la pestaña elegida (para el total de "Todas")
 *   todos       todos los del día elegido, de cualquier estado (para el desglose)
 *   asignacion  resultado de asignarColectas()
 *   valor       "todas" o la clave de una colecta
 */
export const FiltroColecta = ({ envios, todos, asignacion, etiquetaEstado, valor, onChange }) => {
  const base = todos || envios;
  const grupos = useMemo(() => {
    const m = new Map();
    for (const s of base) {
      const a = asignacion?.get(s.shipment_id) || { clave: claveColecta(s.expected_date) };
      if (!m.has(a.clave)) m.set(a.clave, { clave: a.clave, ventana: a.ventana, hora: a.hora, total: 0, anterior: 0, canceladas: 0, porImprimir: 0, listas: 0, recolectadas: 0 });
      const g = m.get(a.clave);
      g.total++;
      if (s.estado_operativo === "cancelado") g.canceladas++;
      else if (a.anterior) g.anterior++;
      else if (s.estado_operativo === "ready_to_print") g.porImprimir++;
      else if (["etiqueta_impresa", "listo_para_recolectar"].includes(s.estado_operativo)) g.listas++;
      else if (s.mostrar_en_recolectados || ["recolectado", "en_camino", "entregado"].includes(s.estado_operativo)) g.recolectadas++;
    }
    return [...m.values()].sort((a, b) => (a.clave === SIN_FECHA ? 1 : b.clave === SIN_FECHA ? -1 : a.clave.localeCompare(b.clave)));
  }, [base, asignacion]);

  if (!base.length) return null;

  return (
    <Box sx={{ display: "flex", gap: 1.5, overflowX: "auto", pb: 1, mb: 1 }}>
      <TarjetaColecta
        activa={valor === "todas"}
        etiqueta={etiquetaEstado}
        titulo="Todas las colectas"
        detalle={`${envios.length} en «${etiquetaEstado}»`}
        total={base.length}
        onClick={() => onChange("todas")}
      />
      {grupos.map((g) => {
        let titulo;
        let detalle;
        if (g.ventana) {
          titulo = `Colecta | ${g.ventana.desde} - ${g.ventana.hasta} hs`;
          detalle = g.ventana.inicio.locale("es").format("dddd D [de] MMMM");
        } else if (g.clave === SIN_FECHA) {
          titulo = "Sin fecha de colecta";
        } else {
          const d = dayjs(g.clave);
          titulo = `Colecta | ${d.format("HH:mm") !== "00:00" ? `hasta ${d.format("HH:mm")} hs` : "todo el día"}`;
          detalle = formatoFecha(d);
        }
        return (
          <TarjetaColecta
            key={g.clave}
            activa={valor === g.clave}
            etiqueta={g.ventana ? etiquetaDia(g.ventana.inicio) : etiquetaEstado}
            titulo={titulo}
            detalle={detalle}
            total={g.total}
            desglose={g}
            onClick={() => onChange(g.clave)}
          />
        );
      })}
    </Box>
  );
};
