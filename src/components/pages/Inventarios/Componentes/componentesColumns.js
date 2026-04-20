import React from "react";
import { GridActionsCellItem, GridDeleteIcon } from "@mui/x-data-grid";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { Tooltip } from "@mui/material";

export const getComponentesColumns = ({ onDelete, onEdit }) => [
  {
    field: "componente_id",
    headerName: "ID Componente",
    type: "number",
    flex: 1,
  },
  {
    field: "sku",
    headerName: "SKU Componente",
    type: "string",
    flex: 1.2,
    headerClassName: "header-wrap",
    headerAlign: "center",
  },
  {
    field: "descripcion",
    headerName: "Descripción",
    type: "string",
    flex: 3,
  },
  {
    field: "multiplo",
    headerName: "Múltiplo",
    type: "number",
    flex: 1,
  },
  {
    field: "factor_conversion",
    headerName: "F Conversión",
    type: "number",
    flex: 1,
  },
  {
    field: "proveedor_principal",
    headerName: "Proveedor principal",
    type: "string",
    flex: 1.5,
    renderCell: (params) => params?.row?.proveedor_principal || "—",
  },
  {
    field: "proveedor_secundario",
    headerName: "Proveedor secundario",
    type: "string",
    flex: 1.5,
    renderCell: (params) => params?.row?.proveedor_secundario || "—",
  },
  {
    field: "actions",
    headerName: "Acciones",
    type: "actions",
    getActions: (params) => [
      <Tooltip
        title="Borrar componente"
        key={`delete-${params.row.componente_id}`}
      >
        <GridActionsCellItem
          icon={<GridDeleteIcon />}
          sx={{ color: "red" }}
          onClick={() => onDelete(params.row.componente_id)}
          label="Eliminar"
        />
      </Tooltip>,
      <Tooltip title="Abrir modal" key={`modal-${params.row.componente_id}`}>
        <GridActionsCellItem
          icon={<OpenInNewIcon />}
          sx={{ color: "blue" }}
          onClick={() => onEdit(params.row.componente_id)}
          label="Abrir Modal"
        />
      </Tooltip>,
    ],
  },
];
