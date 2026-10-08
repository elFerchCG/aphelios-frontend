import React from "react";

import {
  Box,
  Chip,
} from "@mui/material";

import {
  getNombreCuenta,
} from "./productoDetalleHelpers";

const RelacionMercadoLibreSelector = ({
  relaciones = [],
  relacionSeleccionada,
  onSeleccionar,
}) => {
  if (!relaciones.length) {
    return null;
  }

  return (
    <Box
      sx={{
        display: "flex",
        gap: 1,
        flexWrap: "wrap",
        mb: 3,
      }}
    >
      {relaciones.map(
        (relacion) => {
          const selected =
            String(
              relacion.relacion_id,
            ) ===
            String(
              relacionSeleccionada
                ?.relacion_id,
            );

          const nombreCuenta =
            getNombreCuenta(
              relacion,
            );

          const mlmu =
            relacion
              ?.user_product
              ?.user_product_id ||
            "Sin MLMU";

          return (
            <Chip
              key={
                relacion.relacion_id
              }
              clickable
              color={
                selected
                  ? "primary"
                  : "default"
              }
              variant={
                selected
                  ? "filled"
                  : "outlined"
              }
              label={`${nombreCuenta} · ${mlmu}`}
              onClick={() =>
                onSeleccionar(
                  relacion,
                )
              }
            />
          );
        },
      )}
    </Box>
  );
};

export default RelacionMercadoLibreSelector;