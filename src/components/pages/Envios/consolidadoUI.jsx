import React from "react";
import { Box, Chip, LinearProgress, Typography } from "@mui/material";

import { palette, tono } from "./consolidadoPalette";

// Piezas visuales compartidas por los consolidados de Envíos
// (ConsolidadoDrawer = proformas, RetirosConsolidadoDrawer = retiros), para
// que ambos se vean y se comporten igual.

// Ficha de resumen (misma línea visual que StatTile de ProductoRow).
export const ResumenTile = ({ label, value, tone: toneName, children }) => {
    const c = tono(toneName);
    return (
        <Box
            sx={{
                minWidth: 120,
                flex: "1 1 120px",
                px: 1.5,
                py: 1,
                bgcolor: c.bg,
                border: `1px solid ${c.border}`,
                borderRadius: 2
            }}
        >
            <Typography
                variant="caption"
                sx={{ color: palette.textSecondary, fontWeight: 600, letterSpacing: 0.3, textTransform: "uppercase", display: "block" }}
            >
                {label}
            </Typography>
            <Typography sx={{ color: c.text, fontWeight: 700, fontSize: 20, lineHeight: 1.2 }}>
                {value}
            </Typography>
            {children}
        </Box>
    );
};

// Fila de resumen estándar: A enviar / Empacado / Pendiente / Avance.
// `extra` permite anteponer fichas propias de cada consolidado.
export const ResumenConsolidado = ({ aEnviar, empacado, pendiente, pct, extra = null }) => (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1.5 }}>
        {extra}
        <ResumenTile label="A enviar" value={Math.round(aEnviar)} tone="primary" />
        <ResumenTile label="Empacado" value={Math.round(empacado)} tone="success" />
        <ResumenTile
            label="Pendiente"
            value={Math.round(pendiente)}
            tone={pendiente > 0 ? "warning" : "success"}
        />
        <ResumenTile label="Avance" value={`${pct}%`} tone={pct >= 100 ? "success" : "primary"}>
            <LinearProgress
                variant="determinate"
                value={pct}
                color={pct >= 100 ? "success" : "primary"}
                sx={{ height: 6, borderRadius: 4, mt: 0.5 }}
            />
        </ResumenTile>
    </Box>
);

// Totales de una lista de productos del consolidado.
export const calcularResumen = (lista) => {
    const aEnviar = lista.reduce((s, p) => s + Number(p.cantidad_a_enviar || 0), 0);
    const empacado = lista.reduce((s, p) => s + Number(p.cantidad_empacada || 0), 0);
    const pendiente = lista.reduce((s, p) => s + Number(p.cantidad_pendiente || 0), 0);
    const pct = aEnviar > 0 ? Math.min(100, Math.round((empacado / aEnviar) * 100)) : 0;
    return { aEnviar, empacado, pendiente, pct };
};

// Chip suave con tono de la paleta del consolidado.
export const ToneChip = ({ label, tone: toneName, icon, sx = {} }) => {
    const c = tono(toneName);
    return (
        <Chip
            size="small"
            icon={icon}
            label={label}
            sx={{
                bgcolor: c.bg,
                color: c.text,
                border: `1px solid ${c.border}`,
                fontWeight: 600,
                "& .MuiChip-icon": { color: c.text },
                ...sx
            }}
        />
    );
};

// Texto indexado para el buscador (SKU, título, ML, MLM, OP, producto).
export const textoBusqueda = (p) =>
    [p.title, p.sku, p.inventory_id, p.publicacion_id, p.orden_id, p.producto_id]
        .filter((v) => v != null)
        .join(" ")
        .toLowerCase();
