import React from "react";

import {
  Box,
  Card,
  CardContent,
  Typography,
} from "@mui/material";

import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";

// =========================================================
// TARJETA DE RESUMEN
// =========================================================

const ResumenCard = ({
  titulo,
  valor,
  descripcion,
  icono,
  color,
  fondo,
}) => {
  return (
    <Card
      variant="outlined"
      sx={{
        minWidth: 0,

        borderRadius: 3,
        borderColor: "#e3e8ef",

        boxShadow:
          "0 2px 10px rgba(15, 23, 42, 0.03)",
      }}
    >
      <CardContent
        sx={{
          p: 2.5,

          "&:last-child": {
            pb: 2.5,
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          {/* ICONO */}

          <Box
            sx={{
              width: 56,
              height: 56,

              flexShrink: 0,

              borderRadius: 2.5,

              display: "flex",
              alignItems: "center",
              justifyContent: "center",

              color,
              backgroundColor: fondo,
            }}
          >
            {icono}
          </Box>

          {/* INFORMACIÓN */}

          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 700,
                color: "#263238",
              }}
            >
              {titulo}
            </Typography>

            <Typography
              sx={{
                mt: 0.25,

                fontSize: "1.65rem",
                lineHeight: 1.2,

                fontWeight: 700,
                color: "#1e293b",
              }}
            >
              {valor}
            </Typography>

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                display: "block",
                mt: 0.25,
              }}
            >
              {descripcion}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

// =========================================================
// RESUMEN DE SOPORTE
// =========================================================

const SoporteResumen = ({ resumen }) => {
  return (
    <Box
      sx={{
        mx: "30px",
        mb: 2,

        display: "grid",

        gridTemplateColumns: {
          xs: "1fr",
          md: "repeat(3, minmax(0, 1fr))",
        },

        gap: 2,
        minWidth: 0,
      }}
    >
      {/* =====================================================
          ACTIVOS
      ====================================================== */}

      <ResumenCard
        titulo="Activos"
        valor={resumen?.activos ?? 0}
        descripcion="Tickets en proceso"
        color="#1976d2"
        fondo="rgba(25, 118, 210, 0.09)"
        icono={
          <AssignmentOutlinedIcon
            sx={{
              fontSize: 30,
            }}
          />
        }
      />

      {/* =====================================================
          ESPERANDO RESPUESTA
      ====================================================== */}

      <ResumenCard
        titulo="Esperando respuesta"
        valor={resumen?.esperando ?? 0}
        descripcion="En espera de tu respuesta"
        color="#ed6c02"
        fondo="rgba(237, 108, 2, 0.09)"
        icono={
          <AccessTimeOutlinedIcon
            sx={{
              fontSize: 30,
            }}
          />
        }
      />

      {/* =====================================================
          RESUELTOS
      ====================================================== */}

      <ResumenCard
        titulo="Resueltos"
        valor={resumen?.resueltos ?? 0}
        descripcion="Tickets solucionados"
        color="#2e7d32"
        fondo="rgba(46, 125, 50, 0.09)"
        icono={
          <CheckCircleOutlineOutlinedIcon
            sx={{
              fontSize: 30,
            }}
          />
        }
      />
    </Box>
  );
};

export default SoporteResumen;