import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";

import TabPublicaciones from "./TabPublicaciones";
import TabTareas from "./TabTareas";
import TabMisTareas from "./TabMisTareas";

const PublicacionesMejoras = () => {
  const [tabActiva, setTabActiva] = useState(0);

  const cambiarTab = (event, newValue) => {
    setTabActiva(newValue);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight="bold" mb={2}>
        Mejoras de Publicaciones
      </Typography>

      <Card sx={{ mb: 3, backgroundColor: "#f8f9fa" }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Bitácora de mejoras en publicaciones
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Este módulo permite consultar todas las publicaciones registradas,
            asignar acciones de mejora y documentar los cambios realizados por
            el equipo de marketing.
          </Typography>
        </CardContent>
      </Card>

      <Box sx={{ mb: 3 }}>
        <Tabs
          value={tabActiva}
          onChange={cambiarTab}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Publicaciones" />
          <Tab label="Tareas" />
          <Tab label="Mis tareas" />
        </Tabs>
      </Box>

      {tabActiva === 0 && <TabPublicaciones />}
      {tabActiva === 1 && <TabTareas />}
      {tabActiva === 2 && <TabMisTareas />}
    </Box>
  );
};

export default PublicacionesMejoras;