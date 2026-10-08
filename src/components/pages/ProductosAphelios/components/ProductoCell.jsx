import React from "react";

import { Box, Tooltip, Typography } from "@mui/material";

import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";

import {
  getImagenProducto,
  getItemsMercadoLibre,
} from "../utils/productosApheliosHelpers";

const ProductoCell = ({ producto, onClickImagen }) => {
  const imagen = getImagenProducto(producto);

  const items = getItemsMercadoLibre(producto);

  const itemsConLink = items.filter((item) => item?.permalink);

  let tooltipImagen = "Sin publicaciones";

  if (itemsConLink.length === 1) {
    tooltipImagen = "Ver en Mercado Libre";
  }

  if (itemsConLink.length > 1) {
    tooltipImagen = `Elegir entre ${itemsConLink.length} publicaciones`;
  }

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",

        display: "flex",
        alignItems: "center",

        gap: 1.5,
        minWidth: 0,
      }}
    >
      {/* ===============================================
          IMAGEN
      =============================================== */}

      <Tooltip title={tooltipImagen} arrow>
        {imagen ? (
          <Box
            component="img"
            src={imagen}
            alt={producto.nombre || producto.sku}
            onClick={() => onClickImagen(producto)}
            sx={{
              width: 52,
              height: 52,

              flexShrink: 0,

              objectFit: "contain",

              borderRadius: 1,

              border: "1px solid",
              borderColor: "divider",

              cursor: itemsConLink.length > 0 ? "pointer" : "default",

              transition: "transform 0.15s ease, box-shadow 0.15s ease",

              "&:hover": {
                transform: itemsConLink.length > 0 ? "scale(1.06)" : "none",

                boxShadow: itemsConLink.length > 0 ? 2 : "none",
              },
            }}
          />
        ) : (
          <Box
            sx={{
              width: 52,
              height: 52,

              flexShrink: 0,

              border: "1px solid",
              borderColor: "divider",

              borderRadius: 1,

              display: "flex",
              alignItems: "center",
              justifyContent: "center",

              color: "text.disabled",
            }}
          >
            <ImageOutlinedIcon fontSize="small" />
          </Box>
        )}
      </Tooltip>

      {/* ===============================================
          INFORMACIÓN
      =============================================== */}

      <Box
        sx={{
          minWidth: 0,
          flex: 1,
        }}
      >
        {/* TÍTULO */}

        <Tooltip title={producto.nombre || ""} arrow placement="top">
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              color: "text.primary",

              lineHeight: 1.3,
              mb: 0.4,

              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {producto.nombre || "—"}
          </Typography>
        </Tooltip>

        {/* SKU */}

        <Tooltip title={producto.sku || ""} arrow>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 700,
              color: "primary.main",

              lineHeight: 1.25,

              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {producto.sku || "—"}
          </Typography>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default ProductoCell;
