import React, { useMemo } from "react";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Typography,
} from "@mui/material";

import AppDataGrid from "../../../common/AppDataGrid";

const ResponsablesTable = ({
  responsables = [],
}) => {
  const rows = useMemo(() => {
    return responsables.map((item) => ({
      ...item,

      usuarioId: Number(
        item.usuarioId || 0,
      ),

      activos: Number(
        item.activos || 0,
      ),

      vencidos: Number(
        item.vencidos || 0,
      ),

      seguimientosHoy: Number(
        item.seguimientosHoy || 0,
      ),

      cerrados: Number(
        item.cerrados || 0,
      ),

      cerradosSemana: Number(
        item.cerradosSemana || 0,
      ),

      cumplimiento: Number(
        item.cumplimiento || 0,
      ),
    }));
  }, [responsables]);

  const columns = useMemo(
    () => [
      {
        field: "usuarioId",
        headerName: "ID",
        width: 80,
      },

      {
        field: "nombre",
        headerName: "Responsable",
        flex: 1,
        minWidth: 180,
      },

      {
        field: "rol",
        headerName: "Rol",
        flex: 1,
        minWidth: 160,
      },

      {
        field: "activos",
        headerName: "Activos",
        width: 110,
        type: "number",
      },

      {
        field: "vencidos",
        headerName: "Vencidos",
        width: 120,
        type: "number",

        renderCell: (params) => (
          <Chip
            size="small"
            label={params.value}
            color={
              params.value > 0
                ? "error"
                : "default"
            }
            variant={
              params.value > 0
                ? "filled"
                : "outlined"
            }
          />
        ),
      },

      {
        field: "seguimientosHoy",
        headerName: "Hoy",
        width: 100,
        type: "number",
      },

      {
        field: "cerradosSemana",
        headerName: "Cerrados semana",
        width: 160,
        type: "number",
      },

      {
        field: "cerrados",
        headerName: "Cerrados totales",
        width: 160,
        type: "number",
      },

      {
        field: "cumplimiento",
        headerName: "Cumplimiento",
        width: 160,

        renderCell: (params) => {
          const value = Number(
            params.value || 0,
          );

          let color = "default";

          if (value >= 80) {
            color = "success";
          } else if (value >= 50) {
            color = "warning";
          } else {
            color = "error";
          }

          return (
            <Chip
              size="small"
              label={`${value}%`}
              color={color}
            />
          );
        },
      },
    ],
    [],
  );

  return (
    <Card
      elevation={0}
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 3,
      }}
    >
      <CardContent>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
          }}
        >
          Rendimiento por responsable
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 2,
          }}
        >
          Resumen de Kaizens activos,
          vencidos y cerrados por usuario.
        </Typography>

        <Box
          sx={{
            width: "100%",
          }}
        >
          <AppDataGrid
            rows={rows}
            columns={columns}
            getRowId={(row) =>
              row.usuarioId
            }
            disableRowSelectionOnClick
            exportFileName="marketing_responsables"
            initialColumnVisibilityModel={{
              usuarioId: false,
            }}
            initialState={{
              pagination: {
                paginationModel: {
                  page: 0,
                  pageSize: 10,
                },
              },
            }}
            pageSizeOptions={[
              10,
              25,
              50,
            ]}
          />
        </Box>
      </CardContent>
    </Card>
  );
};

export default ResponsablesTable;