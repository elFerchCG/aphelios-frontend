import React from "react";

import {
  Box,
  Tab,
  Tabs,
} from "@mui/material";

// =========================================================
// TABS DE SOPORTE
// =========================================================

const SoporteTabs = ({
  vista,
  permisos,
  onChange,
}) => {
  const puedeVerTodos =
    Boolean(permisos?.puedeVerTodos);

  const puedeVerAsignados =
    Boolean(permisos?.puedeVerAsignados);

  // =======================================================
  // USUARIO NORMAL
  //
  // Si solamente tiene acceso a "Mis tickets",
  // no necesitamos mostrar tabs.
  // =======================================================

  if (
    !puedeVerTodos &&
    !puedeVerAsignados
  ) {
    return null;
  }

  return (
    <Box
      sx={{
        mx: "30px",
        mb: 2,

        borderBottom: 1,
        borderColor: "divider",
      }}
    >
      <Tabs
        value={vista}
        onChange={onChange}
        variant="scrollable"
        scrollButtons="auto"
      >
        {/* =================================================
            MIS TICKETS
        ================================================= */}

        <Tab
          value="mis"
          label="Mis tickets"
        />

        {/* =================================================
            TODOS LOS TICKETS
        ================================================= */}

        {puedeVerTodos && (
          <Tab
            value="todos"
            label="Todos los tickets"
          />
        )}

        {/* =================================================
            ASIGNADOS A MÍ
        ================================================= */}

        {puedeVerAsignados && (
          <Tab
            value="asignados"
            label="Asignados a mí"
          />
        )}
      </Tabs>
    </Box>
  );
};

export default SoporteTabs;