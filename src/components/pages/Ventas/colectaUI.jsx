// Piezas comunes de las colectas (Aphelios y Refaccionaria): formato de fecha y
// filtro por colecta al estilo de Mercado Libre.
import React, { useMemo } from "react";
import { Box, Chip, Paper, Stack, Typography } from "@mui/material";
import dayjs from "dayjs";
import "dayjs/locale/es";

/** 2026/octubre/19 (con hora: 2026/octubre/19 14:30 hs) */
export const formatoFecha = (v, conHora = false) => {
  if (!v) return "";
  const d = dayjs(v).locale("es");
  return d.isValid() ? d.format(conHora ? "YYYY/MMMM/DD HH:mm [hs]" : "YYYY/MMMM/DD") : "";
};

const SIN_FECHA = "sin_fecha";

/** Clave de la colecta: día + hora límite que manda Mercado Libre (SLA). */
export const claveColecta = (v) => (v && dayjs(v).isValid() ? dayjs(v).format("YYYY-MM-DD HH:mm") : SIN_FECHA);

const TarjetaColecta = ({ activa, etiqueta, titulo, detalle, total, onClick }) => (
  <Paper
    variant="outlined"
    onClick={onClick}
    sx={{
      px: 1.5,
      py: 1,
      minWidth: 200,
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
      <Typography variant="caption" sx={{ color: "text.secondary" }}>
        {detalle}
      </Typography>
    )}
  </Paper>
);

/**
 * Tarjetas por colecta (día + hora límite) con el número de envíos, como en
 * Mercado Libre. valor = "todas" o una clave de claveColecta().
 */
export const FiltroColecta = ({ envios, campoFecha = "expected_date", etiquetaEstado, valor, onChange }) => {
  const grupos = useMemo(() => {
    const m = new Map();
    for (const s of envios) {
      const k = claveColecta(s[campoFecha]);
      m.set(k, (m.get(k) || 0) + 1);
    }
    return [...m.entries()].sort(([a], [b]) => (a === SIN_FECHA ? 1 : b === SIN_FECHA ? -1 : a.localeCompare(b)));
  }, [envios, campoFecha]);

  if (!envios.length) return null;

  return (
    <Box sx={{ display: "flex", gap: 1.5, overflowX: "auto", pb: 1, mb: 1 }}>
      <TarjetaColecta
        activa={valor === "todas"}
        etiqueta={etiquetaEstado}
        titulo="Todas las colectas"
        total={envios.length}
        onClick={() => onChange("todas")}
      />
      {grupos.map(([k, total]) => {
        const d = k === SIN_FECHA ? null : dayjs(k);
        const hora = d && d.format("HH:mm") !== "00:00" ? d.format("HH:mm") : null;
        return (
          <TarjetaColecta
            key={k}
            activa={valor === k}
            etiqueta={etiquetaEstado}
            titulo={d ? `Colecta | ${hora ? `hasta ${hora} hs` : "todo el día"}` : "Sin fecha de colecta"}
            detalle={d ? formatoFecha(d) : null}
            total={total}
            onClick={() => onChange(k)}
          />
        );
      })}
    </Box>
  );
};
