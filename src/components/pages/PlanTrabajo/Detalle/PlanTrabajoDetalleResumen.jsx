import React from "react";

import {
  Box,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";

// =========================================================
// HELPERS
// =========================================================

const obtenerTextoPrioridad = (valor) => {
  const opciones = {
    baja: "Baja",
    media: "Media",
    alta: "Alta",
    urgente: "Urgente",
  };

  return opciones[valor] || valor || "-";
};

const obtenerColorPrioridad = (valor) => {
  switch (valor) {
    case "urgente":
      return "error";

    case "alta":
      return "warning";

    case "media":
      return "info";

    default:
      return "default";
  }
};

const formatearFecha = (fecha) => {
  if (!fecha) {
    return "-";
  }

  const valor = String(fecha).slice(0, 10);

  const [anio, mes, dia] =
    valor.split("-");

  if (!anio || !mes || !dia) {
    return "-";
  }

  return `${dia}/${mes}/${anio}`;
};

const formatearTiempo = (segundos) => {
  const total =
    Number(segundos) || 0;

  if (total <= 0) {
    return "0 min";
  }

  const horas =
    Math.floor(total / 3600);

  const minutos =
    Math.floor(
      (total % 3600) / 60,
    );

  if (horas > 0) {
    return `${horas} h ${minutos} min`;
  }

  return `${minutos} min`;
};

// =========================================================
// COMPONENTE
// =========================================================

const PlanTrabajoDetalleResumen = ({
  tarea,
  cambiandoEstatus,
  onCambiarEstatus,
}) => {
  if (!tarea) {
    return null;
  }

  return (
    <>
      {/* =====================================================
          TÍTULO
      ====================================================== */}

      <Box>
        <Typography
          sx={{
            fontSize: "1.15rem",
            fontWeight: 700,
            color: "#263238",
          }}
        >
          {tarea.titulo}
        </Typography>

        {tarea.origen && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mt: 0.5,
            }}
          >
            Origen: {tarea.origen}
          </Typography>
        )}
      </Box>

      {/* =====================================================
          ESTATUS Y PRIORIDAD
      ====================================================== */}

      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 2,
        }}
      >
        <FormControl
          size="small"
          sx={{
            minWidth: 170,
          }}
        >
          <InputLabel>
            Estatus
          </InputLabel>

          <Select
            value={
              tarea.estatus ||
              "pendiente"
            }
            label="Estatus"
            onChange={(event) =>
              onCambiarEstatus(
                event.target.value,
              )
            }
            disabled={
              cambiandoEstatus
            }
          >
            <MenuItem value="pendiente">
              Pendiente
            </MenuItem>

            <MenuItem value="en_proceso">
              En proceso
            </MenuItem>

            <MenuItem value="bloqueada">
              Bloqueada
            </MenuItem>

            <MenuItem value="finalizada">
              Finalizada
            </MenuItem>

            <MenuItem value="cancelada">
              Cancelada
            </MenuItem>
          </Select>
        </FormControl>

        <Chip
          label={`Prioridad: ${obtenerTextoPrioridad(
            tarea.prioridad,
          )}`}
          color={obtenerColorPrioridad(
            tarea.prioridad,
          )}
          size="small"
          variant="outlined"
        />
      </Box>

      {/* =====================================================
          INFORMACIÓN GENERAL
      ====================================================== */}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(3, 1fr)",
          },
          gap: 2,
        }}
      >
        <Box>
          <Typography
            variant="caption"
            color="text.secondary"
          >
            Fecha objetivo
          </Typography>

          <Typography
            variant="body2"
            fontWeight={600}
          >
            {formatearFecha(
              tarea.fecha_objetivo,
            )}
          </Typography>
        </Box>

        <Box>
          <Typography
            variant="caption"
            color="text.secondary"
          >
            Orden
          </Typography>

          <Typography
            variant="body2"
            fontWeight={600}
          >
            {tarea.orden ?? "-"}
          </Typography>
        </Box>

        <Box>
          <Typography
            variant="caption"
            color="text.secondary"
          >
            Tiempo trabajado
          </Typography>

          <Typography
            variant="body2"
            fontWeight={600}
          >
            {formatearTiempo(
              tarea.tiempo_total_segundos,
            )}
          </Typography>
        </Box>
      </Box>
    </>
  );
};

export default PlanTrabajoDetalleResumen;