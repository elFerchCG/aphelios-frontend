import React from "react";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { Avatar, Box, Chip, Paper, Stack, Typography } from "@mui/material";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";

// Mismo helper que ya usa Excedentes.jsx para resolver la miniatura de un
// producto: si `thumbnail` ya es una URL completa se usa tal cual, si es un
// ID corto de Mercado Libre se arma la URL del CDN de MLStatic.
const getThumbnailUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `https://http2.mlstatic.com/D_${url}-I.jpg`;
};

const formatFecha = (fechaISO) => {
  if (!fechaISO) return "";
  const date = new Date(fechaISO);
  if (isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const fmtNA = (v) => (v == null || v === "" ? "N/A" : v);

// Configuración visual por tipo de transacción (mismo patrón que
// ESTATUS_CONFIG en TableOrdenes.jsx: color + texto centralizados).
const TIPO_CONFIG = {
  entrada: { label: "Entrada", color: "#2e7d32", bg: "#e8f5e9" },
  salida: { label: "Salida", color: "#ed6c02", bg: "#fff3e0" },
  transferencia_entrada: {
    label: "Transferencia (entrada)",
    color: "#0288d1",
    bg: "#e1f5fe",
  },
  transferencia_salida: {
    label: "Transferencia (salida)",
    color: "#6a1b9a",
    bg: "#f3e5f5",
  },
};
const getTipoInfo = (tipo) =>
  TIPO_CONFIG[tipo] || { label: tipo || "N/A", color: "#616161", bg: "#f5f5f5" };

// Grid puramente presentacional: recibe filas y estado de carga ya
// resueltos por TransaccionesI.jsx (contenedor con los filtros y el fetch).
const DataGridTInventario = ({
  rows,
  loading,
  columnVisibilityModel,
  onColumnVisibilityModelChange,
}) => {
  const columns = [
    {
      field: "title",
      headerName: "Producto",
      // Ancho fijo (no flex) y sin resize: la columna va "fijada" por CSS
      // (ver sticky más abajo) y ese truco depende de que su ancho no
      // cambie, si no se desalinea con la columna "# Orden" que va justo
      // después. 420px porque el título puede llegar a tener ~60 caracteres.
      width: 520,
      resizable: false,
      disableReorder: true,
      renderCell: (params) => {
        const row = params.row;
        const thumbSrc = getThumbnailUrl(row.thumbnail);
        return (
          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
            sx={{ py: 0.75, width: "100%" }}
          >
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
                sx={{
                  fontWeight: 600,
                  textDecoration: "none",
                  color: "inherit",
                  display: "block",
                }}
              >
                {row.title || "Sin título"}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: "text.secondary" }}
                noWrap
                title={`SKU: ${row.sku || "N/A"} · ML: ${row.inventory_id || "N/A"} · MLM: ${row.mlm_id || "N/A"}`}
              >
                SKU: {row.sku || "N/A"} · ML: {row.inventory_id || "N/A"} · MLM: {row.mlm_id || "N/A"}
              </Typography>
            </Box>
          </Stack>
        );
      },
    },
    { field: "transaccion_id", headerName: "Folio", type: "number", width: 90 },
    {
      field: "orden_id",
      headerName: "# Orden",
      type: "number",
      // Mismo motivo que "Producto": ancho fijo y sin resize para que el
      // truco de sticky (ver sx del DataGrid) no se desalinee.
      width: 130,
      resizable: false,
      disableReorder: true,
    },
    {
      field: "tipo",
      headerName: "Tipo",
      width: 190,
      renderCell: (params) => {
        const info = getTipoInfo(params.value);
        return (
          <Chip
            label={info.label}
            size="small"
            sx={{
              bgcolor: info.bg,
              color: info.color,
              fontWeight: 600,
              border: `1px solid ${info.color}`,
            }}
          />
        );
      },
    },
    { field: "localidad_descripcion", headerName: "Ubicación", flex: 1, minWidth: 120 },
    {
      field: "cantidad",
      headerName: "Cantidad",
      type: "number",
      width: 100,
      headerAlign: "center",
      align: "center",
    },
    {
      field: "inventario_inicial",
      headerName: "Inv. Inicial",
      type: "number",
      width: 110,
      headerAlign: "center",
      align: "center",
    },
    {
      field: "inventario_final",
      headerName: "Inv. Final",
      type: "number",
      width: 110,
      headerAlign: "center",
      align: "center",
    },
    {
      field: "fecha_transaccion",
      headerName: "Fecha",
      width: 115,
      renderCell: (params) => formatFecha(params.value),
    },
    { field: "usuario_transaccion", headerName: "Usuario", flex: 1, minWidth: 130, valueFormatter: fmtNA },
    { field: "agregado_por", headerName: "Agregó", flex: 1, minWidth: 130, valueFormatter: fmtNA },
    { field: "orden_confirmado_por", headerName: "Confirmó", flex: 1, minWidth: 130, valueFormatter: fmtNA },
    { field: "orden_procesado_por", headerName: "Procesó", flex: 1, minWidth: 130, valueFormatter: fmtNA },
    { field: "sku", headerName: "SKU", flex: 1 },
    { field: "inventory_id", headerName: "ML", flex: 1 },
    { field: "producto_id", headerName: "Producto ID", type: "number", flex: 1 },
    { field: "localidad_id", headerName: "Localidad ID", type: "number", flex: 1 },
  ];

  return (
    <Paper elevation={2} sx={{ p: { xs: 1, sm: 2 }, borderRadius: 3 }}>
      <Box sx={{ height: { xs: 480, md: 500 }, width: "100%" }}>
        <DataGrid
          sx={{
            fontFamily: "Montserrat",
            // "Producto" y "# Orden" fijas al hacer scroll horizontal.
            // @mui/x-data-grid (Community, la versión que usa este
            // proyecto) no trae columnas ancladas de verdad: eso es
            // "pinnedColumns", exclusivo de DataGridPro (de paga). Este es
            // el equivalente con CSS puro: position: sticky sobre las
            // celdas de esos 2 campos. El left:420 de "# Orden" tiene que
            // coincidir con el width fijo de "Producto" (por eso ambas
            // columnas tienen resizable: false — si el ancho cambiara se
            // desalinearían).
            "& .MuiDataGrid-columnHeader[data-field='title'], & .MuiDataGrid-cell[data-field='title']": {
              position: "sticky",
              left: 0,
              zIndex: 2,
              backgroundColor: "#fff",
            },
            "& .MuiDataGrid-columnHeader[data-field='orden_id'], & .MuiDataGrid-cell[data-field='orden_id']": {
              position: "sticky",
              left: 520,
              zIndex: 2,
              backgroundColor: "#fff",
              boxShadow: "4px 0 6px -4px rgba(0,0,0,0.35)",
            },
          }}
          rows={rows}
          columns={columns}
          loading={loading}
          getRowHeight={() => "auto"}
          getRowId={(row) => row.transaccion_id}
          showCellVerticalBorder
          showColumnVerticalBorder
          disableRowSelectionOnClick
          pageSize={25}
          columnVisibilityModel={columnVisibilityModel}
          onColumnVisibilityModelChange={onColumnVisibilityModelChange}
          slots={{ toolbar: GridToolbar }}
          sortModel={[{ field: "fecha_transaccion", sort: "desc" }]}
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
            noRowsLabel: "No hay transacciones para mostrar.",
          }}
        />
      </Box>
    </Paper>
  );
};

export default DataGridTInventario;
