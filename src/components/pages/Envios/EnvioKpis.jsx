import React from "react";
import { Box, LinearProgress, Paper, Typography } from "@mui/material";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";

// Fila de indicadores del envío, compartida por EnviosProgresoEmpaque.jsx
// (dashboard) y EnvioDetalle.jsx (tarimas/cajas), para que ambas visuales
// muestren exactamente lo mismo.

const KpiCard = ({ icon: Icon, color, label, children }) => (
    <Paper
        elevation={2}
        sx={{ p: 2, borderRadius: 3, display: "flex", gap: 1.5, alignItems: "flex-start" }}
    >
        <Box
            sx={{
                width: 42,
                height: 42,
                borderRadius: 2,
                bgcolor: `${color}1A`,
                color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
            }}
        >
            <Icon />
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
                variant="caption"
                sx={{ color: "text.secondary", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}
            >
                {label}
            </Typography>
            {children}
        </Box>
    </Paper>
);

const plural = (n, singular, pluralTxt) => `${n} ${n === 1 ? singular : pluralTxt}`;

// Resumen de lo que hay cargado en el envío, sin hablar de órdenes de
// producción: productos distintos, proformas, facturas y retiros.
//  - ordenesFacturas / ordenesRetiros: arrays de getPiezasYFacturas
//  - retiros: totalOrdenRetiro de getPiezasYFacturas
//  - agrupaciones: respuesta de /empaque/envio/:id/agrupaciones (opcional;
//    si no viene, las proformas se sacan de ordenesFacturas y las
//    facturas quedan en null = no se muestran)
export const calcularContenidoEnvio = ({
    ordenesFacturas = [],
    ordenesRetiros = [],
    retiros = [],
    agrupaciones = null,
}) => {
    const productos = new Set(
        [...ordenesFacturas, ...ordenesRetiros]
            .map((r) => r.producto_id)
            .filter((v) => v != null)
            .map(String)
    ).size;

    let proformas;
    let facturas = null;

    if (Array.isArray(agrupaciones) && agrupaciones.length > 0) {
        proformas = agrupaciones.length;
        const idsFacturas = new Set();
        agrupaciones.forEach((g) =>
            (g.facturas || []).forEach((f) => {
                if (f?.factura_id != null) idsFacturas.add(String(f.factura_id));
            })
        );
        facturas = idsFacturas.size;
    } else {
        const idsProformas = new Set();
        ordenesFacturas.forEach((r) => {
            String(r.proformas_ids ?? r.proforma_id ?? "")
                .split(",")
                .map((v) => v.trim())
                .filter(Boolean)
                .forEach((id) => idsProformas.add(id));
        });
        proformas = idsProformas.size;
    }

    return { productos, proformas, facturas, retiros: retiros.length };
};

export default function EnvioKpis({
    envioId,
    folioInternoEnvio,
    totalPiezas = 0,
    totalPiezasEmpacadas = 0,
    contenido,
}) {
    const total = Number(totalPiezas) || 0;
    const empacadas = Number(totalPiezasEmpacadas) || 0;
    const pct = total > 0 ? Math.min(100, Math.round((empacadas / total) * 100)) : 0;
    const pendientes = Math.max(0, total - empacadas);

    const detalleContenido = [
        plural(contenido?.proformas ?? 0, "proforma", "proformas"),
        contenido?.facturas != null ? plural(contenido.facturas, "factura", "facturas") : null,
        plural(contenido?.retiros ?? 0, "retiro", "retiros"),
    ]
        .filter(Boolean)
        .join(" · ");

    return (
        <Box
            sx={{
                display: "grid",
                gap: 2,
                gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
            }}
        >
            <KpiCard icon={LocalShippingOutlinedIcon} color="#1976d2" label="Envío">
                <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.3 }} noWrap>
                    {folioInternoEnvio || `ID: ${envioId}`}
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    ID interno: {envioId}
                </Typography>
            </KpiCard>

            <KpiCard icon={TrendingUpOutlinedIcon} color="#2e7d32" label="Progreso del envío">
                <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
                    {pct}%
                </Typography>
                <LinearProgress
                    variant="determinate"
                    value={pct}
                    color={pct >= 100 ? "success" : "primary"}
                    sx={{ height: 8, borderRadius: 4, mt: 0.75 }}
                />
            </KpiCard>

            <KpiCard icon={Inventory2OutlinedIcon} color="#ed6c02" label="Piezas">
                <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
                    {Math.round(empacadas)} / {Math.round(total)}
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    Empacadas · {Math.round(pendientes)} pendiente(s)
                </Typography>
            </KpiCard>

            <KpiCard icon={CategoryOutlinedIcon} color="#6a1b9a" label="Contenido del envío">
                <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
                    {plural(contenido?.productos ?? 0, "producto", "productos")}
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    {detalleContenido}
                </Typography>
            </KpiCard>
        </Box>
    );
}
