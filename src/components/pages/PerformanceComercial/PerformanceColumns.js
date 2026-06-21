// PerformanceColumns.js

import React from "react";
import { Button, Chip } from "@mui/material";

export const getPerformanceColumns = (
  abrirDetalleMrp,
  formatoMoneda,
) => [
  {
    field: "semana",
    headerName: "Semana",
    width: 100,
  },

  {
    field: "title",
    headerName: "Producto",
    flex: 2,
    minWidth: 320,

    renderCell: (params) =>
      params.row.permalink ? (
        <a
          href={params.row.permalink}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: "#1976d2",
            textDecoration: "none",
            fontWeight: 500,
          }}
        >
          {params.value}
        </a>
      ) : (
        params.value
      ),
  },

  {
    field: "sku",
    headerName: "SKU",
    minWidth: 150,
    flex: 1,
  },

  {
    field: "proveedor",
    headerName: "Proveedor",
    minWidth: 180,
  },

  {
    field: "proyeccion",
    headerName: "Proyección",
    width: 120,
    align: "center",
    headerAlign: "center",
  },

  {
    field: "ventas_reales",
    headerName: "Ventas",
    width: 100,
    align: "center",
    headerAlign: "center",
  },

  {
    field: "diferencia",
    headerName: "Diferencia",
    width: 120,
    align: "center",
    headerAlign: "center",

    renderCell: ({ value }) => (
      <Chip
        label={value}
        size="small"
        color={Number(value) < 0 ? "error" : "success"}
      />
    ),
  },

  {
    field: "cumplimiento",
    headerName: "Cumplimiento",
    width: 140,
    align: "center",
    headerAlign: "center",

    renderCell: ({ value }) =>
      `${Number(value || 0).toFixed(2)}%`,
  },

  {
    field: "venta_pagada",
    headerName: "Venta Pagada",
    width: 150,

    renderCell: ({ value }) =>
      formatoMoneda(value),
  },

  {
    field: "comisiones",
    headerName: "Comisiones",
    width: 140,

    renderCell: ({ value }) =>
      formatoMoneda(value),
  },

  {
    field: "envios",
    headerName: "Envíos",
    width: 130,

    renderCell: ({ value }) =>
      formatoMoneda(value),
  },

  {
    field: "costo_total",
    headerName: "Costo Total",
    width: 150,

    renderCell: ({ value }) =>
      formatoMoneda(value),
  },

  {
    field: "ganancia_real",
    headerName: "Ganancia Real",
    width: 160,

    renderCell: ({ value }) =>
      formatoMoneda(value),
  },

  {
    field: "stock_total",
    headerName: "Stock",
    width: 100,
    align: "center",
    headerAlign: "center",
  },

  {
    field: "detalleMrp",
    headerName: "MRP",
    width: 110,
    sortable: false,
    filterable: false,

    renderCell: (params) => (
      <Button
        size="small"
        variant="contained"
        onClick={() =>
          abrirDetalleMrp(params.row)
        }
      >
        Ver
      </Button>
    ),
  },
];