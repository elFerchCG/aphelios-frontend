import React from "react";

import {
  Box,
  Stack,
  Typography,
} from "@mui/material";

import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import GridViewOutlinedIcon from "@mui/icons-material/GridViewOutlined";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";

import {
  formatearFechaHora,
} from "../helpers/soporteHelpers";

// ============================================================
// INFO ITEM
// ============================================================

const InfoItem = ({
  icon,
  label,
  value,
}) => (
  <Box
    sx={{
      display: "flex",
      gap: 1.25,
      minWidth: 0,
    }}
  >
    <Box
      sx={{
        color: "text.secondary",
        mt: 0.15,
      }}
    >
      {icon}
    </Box>

    <Box sx={{ minWidth: 0 }}>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{
          display: "block",
        }}
      >
        {label}
      </Typography>

      <Typography
        variant="body2"
        fontWeight={600}
      >
        {value || "-"}
      </Typography>
    </Box>
  </Box>
);

// ============================================================
// COMPONENTE
// ============================================================

const TicketInfo = ({
  ticket,
}) => {
  if (!ticket) {
    return null;
  }

  return (
    <Stack spacing={3}>
      {/* =====================================================
          INFORMACIÓN GENERAL
      ===================================================== */}

      <Box>
        <Typography
          variant="subtitle1"
          fontWeight={700}
          sx={{ mb: 2 }}
        >
          Información
        </Typography>

        <Box
          sx={{
            display: "grid",

            gridTemplateColumns: {
              xs: "1fr",
              sm: "1fr 1fr",
              md: "repeat(3, 1fr)",
            },

            gap: 2.5,
          }}
        >
          <InfoItem
            icon={
              <PersonOutlineOutlinedIcon
                fontSize="small"
              />
            }
            label="Usuario"
            value={
              ticket.usuario?.nombre
            }
          />

          <InfoItem
            icon={
              <CategoryOutlinedIcon
                fontSize="small"
              />
            }
            label="Categoría"
            value={
              ticket.categoria?.nombre
            }
          />

          <InfoItem
            icon={
              <GridViewOutlinedIcon
                fontSize="small"
              />
            }
            label="Área"
            value={
              ticket.area?.nombre
            }
          />

          <InfoItem
            icon={
              <PersonOutlineOutlinedIcon
                fontSize="small"
              />
            }
            label="Asignado a"
            value={
              ticket.asignado?.nombre ||
              "Sin asignar"
            }
          />

          <InfoItem
            icon={
              <ScheduleOutlinedIcon
                fontSize="small"
              />
            }
            label="Fecha de creación"
            value={formatearFechaHora(
              ticket.fechas?.creacion,
            )}
          />

          <InfoItem
            icon={
              <ScheduleOutlinedIcon
                fontSize="small"
              />
            }
            label="Última actividad"
            value={formatearFechaHora(
              ticket.fechas
                ?.ultimaActividad,
            )}
          />
        </Box>
      </Box>

      {/* =====================================================
          DESCRIPCIÓN
      ===================================================== */}

      <Box>
        <Typography
          variant="subtitle1"
          fontWeight={700}
          sx={{ mb: 1.5 }}
        >
          Descripción
        </Typography>

        <Box
          sx={{
            p: 2,
            border: 1,
            borderColor: "divider",
            borderRadius: 2,
            bgcolor:
              "background.default",
          }}
        >
          <Typography
            variant="body2"
            sx={{
              whiteSpace: "pre-wrap",
              overflowWrap: "anywhere",
              lineHeight: 1.8,
            }}
          >
            {ticket.descripcion}
          </Typography>
        </Box>
      </Box>

      {/* =====================================================
          IMPACTO
      ===================================================== */}

      {ticket.detalleImpacto && (
        <Box>
          <Typography
            variant="subtitle2"
            fontWeight={700}
            sx={{ mb: 1 }}
          >
            Personas o áreas afectadas
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              whiteSpace: "pre-wrap",
            }}
          >
            {ticket.detalleImpacto}
          </Typography>
        </Box>
      )}
    </Stack>
  );
};

export default TicketInfo;