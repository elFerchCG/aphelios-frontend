import React from "react";

import {
  Box,
  Typography,
} from "@mui/material";

import {
  mostrarValor,
} from "./productoDetalleHelpers";

const DetailField = ({
  label,
  value,
}) => {
  return (
    <Box>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{
          mb: 0.5,
        }}
      >
        {label}
      </Typography>

      <Typography
        variant="body1"
        sx={{
          fontWeight: 500,
          wordBreak: "break-word",
        }}
      >
        {mostrarValor(value)}
      </Typography>
    </Box>
  );
};

export default DetailField;