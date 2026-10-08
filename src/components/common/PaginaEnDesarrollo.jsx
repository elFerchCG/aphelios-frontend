
import React from "react";

import {
  Box,
  Paper,
  Typography,
  Chip,
  Stack,
  Button,
} from "@mui/material";

import ConstructionOutlinedIcon from "@mui/icons-material/ConstructionOutlined";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";

import { useNavigate } from "react-router-dom";

const PaginaEnDesarrollo = ({
  titulo = "Módulo en desarrollo",
  descripcion = "Estamos trabajando en esta sección. Próximamente estará disponible.",
}) => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 180px)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        p: 3,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: "100%",
          maxWidth: 580,
          p: { xs: 3, sm: 5 },
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
          textAlign: "center",
        }}
      >
        <Stack spacing={3} alignItems="center">
          <Box
            sx={{
              width: 90,
              height: 90,
              borderRadius: "50%",
              backgroundColor: "#E8F1FB",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ConstructionOutlinedIcon
              sx={{
                fontSize: 46,
                color: "#1976D2",
              }}
            />
          </Box>

          <Chip
            label="PRÓXIMAMENTE"
            size="small"
            sx={{
              backgroundColor: "#E8F1FB",
              color: "#1565C0",
              fontWeight: 700,
              letterSpacing: 1,
            }}
          />

          <Box>
            <Typography
              variant="h4"
              fontWeight={800}
              sx={{
                color: "#1A237E",
                mb: 1.5,
              }}
            >
              {titulo}
            </Typography>

            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ lineHeight: 1.8 }}
            >
              {descripcion}
            </Typography>
          </Box>

          <Button
            variant="contained"
            startIcon={<ArrowBackOutlinedIcon />}
            onClick={() => navigate("/soporte")}
            sx={{
              backgroundColor: "#1976D2",
              textTransform: "none",
              fontWeight: 600,
              borderRadius: 2,
              px: 3,
              py: 1.2,
              "&:hover": {
                backgroundColor: "#1565C0",
              },
            }}
          >
            Volver a Mis Tickets
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
};

export default PaginaEnDesarrollo;
