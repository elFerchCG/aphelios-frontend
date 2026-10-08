import React from "react";

import {
  Box,
  Stack,
  Typography,
} from "@mui/material";

import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";

import {
  formatearFechaHora,
} from "../helpers/soporteHelpers";

// ============================================================
// COMPONENTE
// ============================================================

const TicketHistorial = ({
  historial = [],
}) => {
  return (
    <Box>
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        sx={{ mb: 2 }}
      >
        <HistoryOutlinedIcon
          fontSize="small"
        />

        <Typography
          variant="subtitle1"
          fontWeight={700}
        >
          Historial
        </Typography>
      </Stack>

      {historial.length === 0 ? (
        <Typography
          variant="body2"
          color="text.secondary"
        >
          No hay movimientos registrados.
        </Typography>
      ) : (
        <Stack spacing={1.5}>
          {historial.map(
            (evento) => (
              <Box
                key={evento.id}
                sx={{
                  pl: 2,

                  borderLeft: 2,

                  borderColor:
                    "divider",
                }}
              >
                <Typography
                  variant="body2"
                  fontWeight={600}
                >
                  {evento.tipo_evento}
                </Typography>

                {evento.detalle && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    {evento.detalle}
                  </Typography>
                )}

                <Typography
                  variant="caption"
                  color="text.secondary"
                >
                  {evento.usuario_nombre
                    ? `${evento.usuario_nombre} · `
                    : ""}

                  {formatearFechaHora(
                    evento.fecha_creacion,
                  )}
                </Typography>
              </Box>
            ),
          )}
        </Stack>
      )}
    </Box>
  );
};

export default TicketHistorial;