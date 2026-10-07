import React from "react";
import { Avatar, Box, Stack, Typography } from "@mui/material";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";

// =====================================================================
// Tablas compactas de Envíos + columna única de producto (formato de la
// tabla de Existencias). Compartido por EnviosProgresoEmpaque.jsx y
// RevisionMrpProformaDialog.jsx para que todas se vean igual.
// Requiere en cada fila: title, sku, inventory_id, mlm y, opcionalmente,
// catalog_id, thumbnail y permalink.
// =====================================================================

// ------------------------------------------------------------
// Tablas compactas: filas y encabezados más bajos y contenido más pequeño
// (texto, chips, botones, barras de avance, iconos). Se pasa por props/sx
// locales a AppDataGrid, sin tocar common/ (regla 9 del manual).
// Si una tabla necesita su propio sx, combinarlo: sx={{ ...gridCompactoSx, ...local }}.
// ------------------------------------------------------------
export const GRID_ROW_HEIGHT = 44;
export const GRID_HEADER_HEIGHT = 40;

export const gridCompactoSx = {
    "& .MuiDataGrid-columnHeaderTitle": { fontSize: "0.8rem", fontWeight: 600 },
    // OJO: AppDataGrid hace merge superficial de sx; al redefinir esta
    // llave hay que repetir display/alignItems del común (si no, se pierde
    // el centrado vertical de las celdas).
    "& .MuiDataGrid-cell": { fontSize: "0.78rem", display: "flex", alignItems: "center" },
    "& .MuiDataGrid-cell .MuiChip-root": { height: 20, fontSize: "0.7rem" },
    "& .MuiDataGrid-cell .MuiChip-label": { px: 0.75 },
    "& .MuiDataGrid-cell .MuiChip-icon": { fontSize: "0.95rem" },
    "& .MuiDataGrid-cell .MuiLinearProgress-root": { height: 4 },
    "& .MuiDataGrid-cell .MuiTypography-caption": { fontSize: "0.68rem", lineHeight: 1.2 },
    "& .MuiDataGrid-cell .MuiIconButton-root": { p: 0.5 },
    "& .MuiDataGrid-cell .MuiIconButton-root .MuiSvgIcon-root": { fontSize: "1.15rem" },
    "& .MuiDataGrid-cell .MuiTypography-body2": { fontSize: "0.78rem" },
    "& .MuiDataGrid-cell .MuiButton-root": { py: 0.25, px: 1, minWidth: 0, fontSize: "0.72rem", lineHeight: 1.4 },
    "& .MuiDataGrid-cell .MuiButton-startIcon": { mr: 0.5 },
    "& .MuiDataGrid-cell .MuiButton-startIcon .MuiSvgIcon-root": { fontSize: "0.95rem" },
};

// Props compactas comunes para todas las tablas de esta pantalla.
export const gridCompactoProps = {
    rowHeight: GRID_ROW_HEIGHT,
    columnHeaderHeight: GRID_HEADER_HEIGHT,
    sx: gridCompactoSx,
};

// ------------------------------------------------------------
// Columna única de producto (mismo formato que la tabla de Existencias:
// miniatura + título + "SKU · ML · MLM · Catálogo"), en versión compacta.
// ------------------------------------------------------------

// Mismo helper que DataGridE.jsx / Excedentes.jsx: si `thumbnail` ya es URL
// completa se usa tal cual; si es un ID corto de Mercado Libre se arma la
// URL del CDN de MLStatic.
export const getThumbnailUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `https://http2.mlstatic.com/D_${url}-I.jpg`;
};

export const detalleProducto = (row) =>
    `SKU: ${row.sku || "N/A"} · ML: ${row.inventory_id || "N/A"} · MLM: ${row.mlm || "N/A"}${row.catalog_id ? ` · Catálogo: ${row.catalog_id}` : ""}`;

export const columnaProducto = {
    field: "title",
    headerName: "Producto",
    flex: 3,
    minWidth: 340,
    // Para filtrar/buscar también por SKU, ML, MLM o catálogo desde esta
    // misma columna (el orden sigue siendo por título).
    valueGetter: (value, row) => `${row.title || ""} · ${detalleProducto(row)}`,
    renderCell: ({ row }) => {
        const thumbSrc = getThumbnailUrl(row.thumbnail);
        const detalle = detalleProducto(row);
        return (
            <Stack direction="row" spacing={1} alignItems="center" sx={{ width: "100%", minWidth: 0 }}>
                <Avatar
                    component={row.permalink ? "a" : "div"}
                    href={row.permalink || undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="rounded"
                    src={thumbSrc || undefined}
                    alt={row.title}
                    sx={{ width: 30, height: 30, bgcolor: "#f5f5f5", border: "1px solid #e0e0e0", flexShrink: 0 }}
                >
                    <Inventory2OutlinedIcon sx={{ fontSize: 15, color: "#9e9e9e" }} />
                </Avatar>
                <Box sx={{ minWidth: 0, lineHeight: 1.2 }}>
                    <Typography
                        component={row.permalink ? "a" : "p"}
                        href={row.permalink || undefined}
                        target="_blank"
                        rel="noopener noreferrer"
                        noWrap
                        title={row.title}
                        sx={{ fontSize: "0.78rem", fontWeight: 600, textDecoration: "none", color: "inherit", display: "block", lineHeight: 1.25 }}
                    >
                        {row.title || "Sin título"}
                    </Typography>
                    <Typography
                        variant="caption"
                        noWrap
                        title={detalle}
                        sx={{ color: "text.secondary", display: "block" }}
                    >
                        {detalle}
                    </Typography>
                </Box>
            </Stack>
        );
    },
};

// Columnas individuales (ocultas por defecto): siguen disponibles desde
// "Columnas" y para exportar a CSV.
export const columnasProductoDetalle = [
    { field: "mlm", headerName: "MLM", flex: 1, minWidth: 120 },
    { field: "sku", headerName: "SKU", flex: 1, minWidth: 120 },
    { field: "inventory_id", headerName: "ML", flex: 1, minWidth: 110 },
    { field: "catalog_id", headerName: "# Catálogo", flex: 1, minWidth: 120 },
];
