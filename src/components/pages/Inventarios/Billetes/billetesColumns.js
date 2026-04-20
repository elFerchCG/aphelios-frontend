import React from "react";
import { GridActionsCellItem, GridDeleteIcon, GridEditInputCell } from "@mui/x-data-grid";
import { Tooltip } from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";

export const getBilletesColumns = ({
  onOpenDetalle,
  onDeleteBillete,
}) => [
  {
    field: "billete_id",
    headerName: "ID",
    type: "number",
    flex: 1,
    headerAlign: "center",
  },
  {
    field: "producto_id",
    headerName: "# De producto",
    type: "number",
    flex: 1,
    headerAlign: "center",
  },
  {
    field: "componente_id",
    headerName: "# De componente",
    type: "text",
    flex: 1,
    headerAlign: "center",
  },
  {
    field: "sku",
    headerName: "SKU Componente",
    type: "text",
    flex: 1,
    headerAlign: "center",
  },
  {
    field: "descripcion",
    headerName: "Descripción",
    type: "text",
    flex: 1.5,
    headerAlign: "center",
  },
  {
    field: "cantidad",
    headerName: "Cantidad",
    type: "number",
    flex: 1,
    headerAlign: "center",
    editable: true,
    cellClassName: "celdaEditable",
    renderEditCell: (params) => {
      return (
        <GridEditInputCell
          {...params}
          type="number"
          inputProps={{
            min: 1,
          }}
          onWheel={(e) => e.target.blur()}
        />
      );
    },
    preProcessEditCellProps: (params) => {
      const { props } = params;
      const value = Math.max(1, props.value);
      const isValid = /^[1-9]+$/.test(value);

      return {
        ...props,
        value,
        error: !isValid,
      };
    },
  },
  {
    field: "tipo",
    headerName: "Tipo",
    type: "text",
    flex: 1,
    headerAlign: "center",
  },
  {
    field: "actions",
    headerName: "Acciones",
    type: "actions",
    getActions: (params) => [
      <Tooltip title="Ver detalles del billete" key={`details-${params.id}`}>
        <GridActionsCellItem
          icon={<InfoIcon />}
          label="Detalles"
          onClick={onOpenDetalle(params.row)}
        />
      </Tooltip>,
      <Tooltip
        title="Borrar componente del billete"
        key={`delete-${params.row.billete_id}`}
      >
        <GridActionsCellItem
          icon={<GridDeleteIcon />}
          sx={{ color: "red" }}
          onClick={onDeleteBillete(params.row.billete_id)}
          label="Eliminar"
        />
      </Tooltip>,
    ],
  },
];