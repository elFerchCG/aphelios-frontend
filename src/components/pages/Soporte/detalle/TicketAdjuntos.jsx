import React from "react";

import {
  Box,
  Chip,
  Stack,
  Typography,
} from "@mui/material";

import AttachFileOutlinedIcon from "@mui/icons-material/AttachFileOutlined";

// ============================================================
// HELPERS
// ============================================================

const formatearBytes = (bytes) => {
  const numero = Number(bytes || 0);

  if (numero < 1024) {
    return `${numero} B`;
  }

  if (numero < 1024 * 1024) {
    return `${(
      numero / 1024
    ).toFixed(1)} KB`;
  }

  return `${(
    numero /
    (1024 * 1024)
  ).toFixed(1)} MB`;
};

// ============================================================
// COMPONENTE
// ============================================================

const TicketAdjuntos = ({
  adjuntos = [],
}) => {
  return (
    <Box>
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        sx={{ mb: 1.5 }}
      >
        <AttachFileOutlinedIcon
          fontSize="small"
        />

        <Typography
          variant="subtitle1"
          fontWeight={700}
        >
          Adjuntos
        </Typography>

        <Chip
          size="small"
          label={adjuntos.length}
        />
      </Stack>

      {adjuntos.length === 0 ? (
        <Typography
          variant="body2"
          color="text.secondary"
        >
          Este ticket no tiene archivos
          adjuntos.
        </Typography>
      ) : (
        <Stack spacing={1}>
          {adjuntos.map(
            (adjunto) => (
              <Box
                key={adjunto.id}
                sx={{
                  px: 2,
                  py: 1.5,

                  border: 1,

                  borderColor:
                    "divider",

                  borderRadius: 2,

                  display: "flex",

                  justifyContent:
                    "space-between",

                  alignItems:
                    "center",

                  gap: 2,
                }}
              >
                <Box
                  sx={{
                    minWidth: 0,
                  }}
                >
                  <Typography
                    variant="body2"
                    fontWeight={600}
                    noWrap
                  >
                    {
                      adjunto.nombre_original
                    }
                  </Typography>

                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    {formatearBytes(
                      adjunto.tamanio_bytes,
                    )}
                  </Typography>
                </Box>

                <Chip
                  size="small"
                  variant="outlined"
                  label={
                    adjunto.mime_type ===
                    "application/pdf"
                      ? "PDF"
                      : "Imagen"
                  }
                />
              </Box>
            ),
          )}
        </Stack>
      )}
    </Box>
  );
};

export default TicketAdjuntos;