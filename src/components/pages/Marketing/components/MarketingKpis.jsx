import React from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
} from "@mui/material";

const MarketingKpis = ({
  kpis = {
    activos: 0,
    seguimientosHoy: 0,
    vencidos: 0,
    cerradosSemana: 0,
  },
}) => {
  const metricas = [
    {
      titulo: "Activos",
      valor: kpis.activos,
      descripcion: "Kaizens abiertos",
    },
    {
      titulo: "Hoy",
      valor: kpis.seguimientosHoy,
      descripcion: "Seguimientos programados",
    },
    {
      titulo: "Vencidos",
      valor: kpis.vencidos,
      descripcion: "Requieren atención",
    },
    {
      titulo: "Cerrados",
      valor: kpis.cerradosSemana,
      descripcion: "Esta semana",
    },
  ];

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          sm: "repeat(2, 1fr)",
          lg: "repeat(4, 1fr)",
        },
        gap: 2,
      }}
    >
      {metricas.map((metrica) => (
        <Card
          key={metrica.titulo}
          elevation={0}
          sx={{
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 3,
          }}
        >
          <CardContent>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                fontWeight: 600,
              }}
            >
              {metrica.titulo}
            </Typography>

            <Typography
              variant="h3"
              sx={{
                mt: 1,
                mb: 0.5,
                fontWeight: 700,
              }}
            >
              {metrica.valor}
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
            >
              {metrica.descripcion}
            </Typography>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};

export default MarketingKpis;