// [MULTICUENTA-ML] Piezas visuales comunes (estilo Aphelios) de las pantallas multicuenta.
import React from "react";
import { Box, Chip, Paper, Stack, Typography } from "@mui/material";

export const GRID_HEIGHT = 520;
export const PAGE_SIZE_OPTIONS = [100];
export const PAGINACION_INICIAL = { pagination: { paginationModel: { pageSize: 100, page: 0 } } };
export const LOCALE_TEXT_GRID = {
  toolbarColumns: "Columnas",
  toolbarDensity: "Densidad",
  toolbarExport: "Exportar",
  toolbarFilters: "Filtros",
  filterPanelOperator: "Operador",
  toolbarFiltersTooltipHide: "Ocultar filtros",
  toolbarFiltersTooltipShow: "Mostrar filtros",
  footerTotalVisibleRows: (visibleCount, totalCount) => `${visibleCount} de ${totalCount}`,
  footerPaginationRowsPerPage: "Filas por página",
};

export const gridSx = {
  fontFamily: "Montserrat",
  borderRadius: 2,
  "& .MuiDataGrid-columnHeaders": { backgroundColor: "#f5f7fa", fontWeight: "bold", fontSize: 13 },
  "& .MuiDataGrid-columnHeader": { backgroundColor: "#f5f7fa" },
  "& .MuiDataGrid-columnHeaderTitle": { fontWeight: 700 },
  "& .MuiDataGrid-cell": { borderBottom: "1px solid #eee", fontSize: 13 },
  "& .MuiDataGrid-row:hover": { backgroundColor: "#f9fafb" },
};

export const botonSx = { borderRadius: 2, textTransform: "none", fontWeight: 600 };

export const SectionCard = ({ icon: Icon, title, subtitle, count, actions, children }) => (
  <Paper elevation={2} sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 3 }}>
    <Stack direction="row" flexWrap="wrap" gap={1.5} alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="subtitle1" sx={{ display: "flex", alignItems: "center", gap: 1, fontWeight: 700 }}>
          <Icon color="primary" /> {title}
          {count != null && (
            <Chip size="small" label={count} sx={{ fontWeight: 700, bgcolor: "#e3f2fd", color: "primary.main", height: 22 }} />
          )}
        </Typography>
        {subtitle && (
          <Typography variant="caption" sx={{ color: "text.secondary", display: "block", ml: 4 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {actions && (
        <Stack direction="row" flexWrap="wrap" gap={1} alignItems="center">
          {actions}
        </Stack>
      )}
    </Stack>
    {children}
  </Paper>
);

export const KpiCard = ({ icon: Icon, color, label, children }) => (
  <Paper elevation={2} sx={{ p: 2, borderRadius: 3, display: "flex", gap: 1.5, alignItems: "flex-start" }}>
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
      <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
        {label}
      </Typography>
      {children}
    </Box>
  </Paper>
);

export const KpiValor = ({ valor, detalle }) => (
  <>
    <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
      {valor}
    </Typography>
    {detalle && (
      <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
        {detalle}
      </Typography>
    )}
  </>
);

export const kpiGridSx = {
  display: "grid",
  gap: 2,
  gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
};

/** Chip con color suave a partir de un mapa { valor: { label, color } } */
export const EstadoChip = ({ valor, mapa }) => {
  const e = mapa[valor] || { label: valor || "—", color: "default" };
  return <Chip size="small" label={e.label} color={e.color} sx={{ fontWeight: 600 }} />;
};

export const CuentaChip = ({ nombre, principal }) => (
  <Chip
    size="small"
    label={nombre}
    sx={{
      fontWeight: 600,
      bgcolor: principal ? "#e3f2fd" : "#f3e5f5",
      color: principal ? "#1565c0" : "#6a1b9a",
      border: `1px solid ${principal ? "#90caf9" : "#ce93d8"}`,
    }}
  />
);
