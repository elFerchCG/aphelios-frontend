import React from "react";

import { Box, Chip } from "@mui/material";

import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";

import { getCuentasMercadoLibre } from "../utils/productosApheliosHelpers";

const ProductoCuentasCell = ({ producto }) => {
  const cuentas = getCuentasMercadoLibre(producto);

  if (!cuentas.length) {
    return (
      <Box
        sx={{
          color: "text.disabled",

          fontSize: "0.875rem",
        }}
      >
        Sin vincular
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.7,

        flexWrap: "nowrap",

        overflow: "hidden",
        py: 0.5,
      }}
    >
      {cuentas.map((cuenta) => (
        <Chip
          key={cuenta.id}
          icon={<StorefrontOutlinedIcon />}
          label={cuenta.nombre}
          size="small"
          variant="outlined"
          color="primary"
          sx={{
            flexShrink: 0,
          }}
        />
      ))}
    </Box>
  );
};

export default ProductoCuentasCell;
