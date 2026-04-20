import React from "react";
import { Button } from "@mui/material";

export const getComponentesBilleteColumns = ({
  rowsComponentes,
  onSelectRow,
}) => [
  {
    field: "select",
    headerName: "Seleccionar",
    width: 150,
    renderCell: (params) => (
      <Button
        variant="contained"
        color="primary"
        size="small"
        disabled={
          !rowsComponentes.some(
            (component) => component.componente_id === params.row.componente_id
          )
        }
        onClick={() => onSelectRow(params)}
      >
        Seleccionar
      </Button>
    ),
    sortable: false,
    filterable: false,
  },
  {
    field: "componente_id",
    headerName: "ID Componente",
    type: "number",
    flex: 1,
  },
  {
    field: "sku",
    headerName: "SKU",
    type: "text",
    flex: 2,
    headerClassName: "header-wrap",
    headerAlign: "center",
  },
  {
    field: "descripcion",
    headerName: "Descripción",
    type: "text",
    flex: 3,
  },
  {
    field: "proveedor_principal",
    headerName: "Proveedor principal",
    type: "text",
    flex: 2,
    renderCell: ({ row }) => row?.proveedor_principal || "—",
  },
  {
    field: "proveedor_secundario",
    headerName: "Proveedor secundario",
    type: "text",
    flex: 2,
    renderCell: ({ row }) => row?.proveedor_secundario || "—",
  },
];