// components/soporteColumns.jsx

import React from "react";

import {
  Chip,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";

import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";

import {
  formatearFechaHora,
  obtenerColorEstatus,
  obtenerColorPrioridad,
  obtenerTextoEstatus,
  obtenerTextoPrioridad,
} from "../helpers/soporteHelpers";

export const crearColumnasSoporte = ({
  vista,
  onVerTicket,
}) => {
  const columnas = [
    {
      field: "folio",
      headerName: "Folio",
      minWidth: 135,
      flex: 0.7,

      renderCell: (params) => (
        <Typography
          variant="body2"
          sx={{
            fontWeight: 700,
            color: "#1e293b",
          }}
        >
          {params.value || `#${params.row.id}`}
        </Typography>
      ),
    },
  ];

  // =========================================================
  // USUARIO
  // =========================================================

  if (vista !== "mis") {
    columnas.push({
      field: "usuario_nombre",
      headerName: "Usuario",
      minWidth: 180,
      flex: 1,

      valueGetter: (_value, row) =>
        row?.usuario_nombre || "-",
    });
  }

  // =========================================================
  // INFORMACIÓN PRINCIPAL
  // =========================================================

  columnas.push(
    {
      field: "asunto",
      headerName: "Asunto",
      minWidth: 250,
      flex: 1.5,
    },

    {
      field: "categoria_nombre",
      headerName: "Categoría",
      minWidth: 180,
      flex: 1,

      valueGetter: (_value, row) =>
        row?.categoria_nombre ||
        row?.categoria ||
        "-",
    },

    {
      field: "area_nombre",
      headerName: "Área",
      minWidth: 180,
      flex: 1,

      valueGetter: (_value, row) =>
        row?.area_nombre ||
        row?.area ||
        "-",
    },
  );

  // =========================================================
  // PRIORIDAD
  // =========================================================

  if (vista !== "mis") {
    columnas.push({
      field: "prioridad",
      headerName: "Prioridad",
      minWidth: 130,
      flex: 0.7,

      renderCell: (params) => (
        <Chip
          label={obtenerTextoPrioridad(params.value)}
          color={obtenerColorPrioridad(params.value)}
          size="small"
          variant="outlined"
          sx={{
            fontWeight: 500,
          }}
        />
      ),
    });
  }

  // =========================================================
  // ESTATUS
  // =========================================================

  columnas.push({
    field: "estatus",
    headerName: "Estatus",
    minWidth: 175,
    flex: 0.9,

    renderCell: (params) => (
      <Chip
        label={obtenerTextoEstatus(params.value)}
        color={obtenerColorEstatus(params.value)}
        size="small"
        variant="outlined"
        sx={{
          fontWeight: 500,
        }}
      />
    ),
  });

  // =========================================================
  // ASIGNADO
  // =========================================================

  if (vista === "todos") {
    columnas.push({
      field: "asignado_nombre",
      headerName: "Asignado a",
      minWidth: 180,
      flex: 1,

      valueGetter: (_value, row) =>
        row?.asignado_nombre || "Sin asignar",
    });
  }

  // =========================================================
  // ACTIVIDAD
  // =========================================================

  columnas.push({
    field: "fecha_ultima_actividad",
    headerName: "Última actividad",
    minWidth: 190,
    flex: 1,

    valueGetter: (_value, row) =>
      formatearFechaHora(
        row?.fecha_ultima_actividad ||
          row?.fecha_actualizacion,
      ),
  });

  // =========================================================
  // ACCIONES
  // =========================================================

  columnas.push({
    field: "acciones",
    headerName: "Acciones",
    width: 100,

    sortable: false,
    filterable: false,

    align: "center",
    headerAlign: "center",

    renderCell: (params) => (
      <Tooltip title="Ver ticket">
        <IconButton
          size="small"
          onClick={() => onVerTicket(params.row)}
          sx={{
            color: "primary.main",

            backgroundColor:
              "rgba(25, 118, 210, 0.06)",

            "&:hover": {
              backgroundColor:
                "rgba(25, 118, 210, 0.12)",
            },
          }}
        >
          <VisibilityOutlinedIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    ),
  });

  return columnas;
};