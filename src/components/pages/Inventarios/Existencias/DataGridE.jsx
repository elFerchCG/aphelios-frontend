import React from "react";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { Avatar, Box, Chip, Paper, Stack, Typography } from "@mui/material";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";

// Mismo helper que DataGridTInventario.jsx / Excedentes.jsx: si `thumbnail`
// ya es URL completa se usa tal cual; si es un ID corto de Mercado Libre se
// arma la URL del CDN de MLStatic.
const getThumbnailUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `https://http2.mlstatic.com/D_${url}-I.jpg`;
};

const toNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

// Ancho fijo de "Producto": la columna va fija por CSS (sticky) y ese truco
// depende de que su ancho no cambie.
const PRODUCTO_WIDTH = 700;

// Grid puramente presentacional: filas y estado de carga los resuelve
// Existencias.jsx (contenedor con filtros y fetch paginado).
const DataGridE = ({ rows, loading, columnVisibilityModel, onColumnVisibilityModelChange }) => {
  const numberCol = {
    type: "number",
    headerAlign: "center",
    align: "center",
    valueGetter: (value) => toNumber(value),
  };

  const columns = [
    {
      field: "title",
      headerName: "Producto",
      width: PRODUCTO_WIDTH,
      resizable: false,
      disableReorder: true,
      renderCell: (params) => {
        const row = params.row;
        const thumbSrc = getThumbnailUrl(row.thumbnail);
        const detalle = `SKU: ${row.sku || "N/A"} · ML: ${row.inventory_id || "N/A"} · MLM: ${row.mlm || "N/A"}${row.catalog_id ? ` · Catálogo: ${row.catalog_id}` : ""
          }`;
        return (
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ py: 0.75, width: "100%" }}>
            <Avatar
              component={row.permalink ? "a" : "div"}
              href={row.permalink || undefined}
              target="_blank"
              rel="noopener noreferrer"
              variant="rounded"
              src={thumbSrc || undefined}
              alt={row.title}
              sx={{
                width: 40,
                height: 40,
                bgcolor: "#f5f5f5",
                border: "1px solid #e0e0e0",
                flexShrink: 0,
              }}
            >
              <Inventory2OutlinedIcon sx={{ fontSize: 18, color: "#9e9e9e" }} />
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                component={row.permalink ? "a" : "p"}
                href={row.permalink || undefined}
                target="_blank"
                rel="noopener noreferrer"
                variant="body2"
                noWrap
                title={row.title}
                sx={{ fontWeight: 600, textDecoration: "none", color: "inherit", display: "block" }}
              >
                {row.title || "Sin título"}
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }} noWrap title={detalle}>
                {detalle}
              </Typography>
            </Box>
          </Stack>
        );
      },
    },
    { field: "localidad_descripcion", headerName: "Ubicación", flex: 2 },
    {
      field: "existencia_actual", headerName: "Cantidad Actual", flex: 1, ...numberCol, renderHeader: () => (
        <Box sx={{ lineHeight: 1.2, textAlign: "center", fontWeight: 500 }}>
          Cantidad
          <br />
          Actual
        </Box>
      ),
    },
    { field: "total_reservado", headerName: "Reservada", flex: 1, ...numberCol },
    { field: "total_por_recibir", headerName: "Por Ingresar", flex: 1, ...numberCol },
    {
      field: "disponible",
      headerName: "Disponible",
      width: 125,
      ...numberCol,
      renderCell: (params) => {
        const valor = toNumber(params.value);
        const sinStock = valor <= 0;
        const color = sinStock ? "#d32f2f" : "#2e7d32";
        return (
          <Chip
            label={valor}
            size="small"
            sx={{
              bgcolor: sinStock ? "#ffebee" : "#e8f5e9",
              color,
              fontWeight: 700,
              border: `1px solid ${color}`,
              minWidth: 48,
            }}
          />
        );
      },
    },
    { field: "id", headerName: "ID", type: "number", width: 90 },
    { field: "producto_id", headerName: "Producto ID", flex: 1, minWidth: 110 },
    { field: "mlm", headerName: "MLM", flex: 1, minWidth: 130 },
    { field: "catalog_id", headerName: "# Catálogo", flex: 1, minWidth: 130 },
    { field: "sku", headerName: "SKU", flex: 1, minWidth: 130 },
    { field: "inventory_id", headerName: "ML", flex: 1, minWidth: 110 },
    { field: "localidad_id", headerName: "Ubicación ID", type: "number", width: 110 },
  ];

  return (
    <Paper elevation={2} sx={{ p: { xs: 1, sm: 2 }, borderRadius: 3 }}>
      <Box sx={{ height: { xs: 480, md: 500 }, width: "100%" }}>
        <DataGrid
          sx={{
            fontFamily: "Montserrat",
            // "Producto" fija al hacer scroll horizontal. @mui/x-data-grid
            // Community no trae pinnedColumns (exclusivo de DataGridPro), así
            // que se replica con position: sticky, igual que en
            // DataGridTInventario.jsx.
            "& .MuiDataGrid-columnHeader[data-field='title'], & .MuiDataGrid-cell[data-field='title']": {
              position: "sticky",
              left: 0,
              zIndex: 2,
              backgroundColor: "#fff",
              boxShadow: "4px 0 6px -4px rgba(0,0,0,0.35)",
            },
          }}
          rows={rows}
          columns={columns}
          loading={loading}
          getRowHeight={() => "auto"}
          getRowId={(row) => row.id}
          showCellVerticalBorder
          showColumnVerticalBorder
          disableRowSelectionOnClick
          columnVisibilityModel={columnVisibilityModel}
          onColumnVisibilityModelChange={onColumnVisibilityModelChange}
          initialState={{
            pagination: { paginationModel: { pageSize: 25 } },
            sorting: { sortModel: [{ field: "existencia_actual", sort: "desc" }] },
          }}
          pageSizeOptions={[25, 50, 100]}
          slots={{ toolbar: GridToolbar }}
          slotProps={{
            toolbar: { csvOptions: { fileName: "existencias", utf8WithBom: true } },
          }}
          localeText={{
            toolbarColumns: "Columnas",
            toolbarDensity: "Densidad",
            toolbarExport: "Exportar",
            toolbarFilters: "Filtros",
            filterPanelOperator: "Operador",
            toolbarFiltersTooltipHide: "Ocultar filtros",
            toolbarFiltersTooltipShow: "Mostrar filtros",
            footerRowSelected: (count) => `${count} fila(s) seleccionada(s)`,
            footerTotalVisibleRows: (visibleCount, totalCount) => `${visibleCount} de ${totalCount}`,
            footerPaginationRowsPerPage: "Filas por página",
            noRowsLabel: "No hay existencias para mostrar.",
          }}
        />
      </Box>
    </Paper>
  );
};

export default DataGridE;
