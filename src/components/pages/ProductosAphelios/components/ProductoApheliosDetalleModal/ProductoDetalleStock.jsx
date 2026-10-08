import React from "react";

import {
  Alert,
  Box,
  Paper,
  Typography,
} from "@mui/material";

import DetailField from "./DetailField";
import RelacionMercadoLibreSelector from "./RelacionMercadoLibreSelector";

import {
  formatearFecha,
  getNombreCuenta,
} from "./productoDetalleHelpers";

const ProductoDetalleStock = ({
  relaciones = [],
  relacion,
  onSeleccionarRelacion,
}) => {
  if (!relaciones.length) {
    return (
      <Alert severity="info">
        No existe una relación de
        Mercado Libre para consultar
        stock.
      </Alert>
    );
  }

  if (!relacion) {
    return null;
  }

  const stock =
    relacion?.stock || {};

  const ubicaciones =
    Array.isArray(
      stock?.ubicaciones,
    )
      ? stock.ubicaciones
      : [];

  return (
    <Box>
      <Typography
        variant="h6"
        sx={{
          mb: 0.5,
          fontWeight: 600,
        }}
      >
        Stock por User Product
      </Typography>

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{
          mb: 2,
        }}
      >
        Selecciona la relación de
        Mercado Libre que deseas
        consultar.
      </Typography>

      <RelacionMercadoLibreSelector
        relaciones={relaciones}
        relacionSeleccionada={
          relacion
        }
        onSeleccionar={
          onSeleccionarRelacion
        }
      />

      <Alert
        severity="info"
        sx={{
          mb: 3,
        }}
      >
        Mostrando stock de{" "}
        <strong>
          {getNombreCuenta(
            relacion,
          )}
        </strong>{" "}
        para el User Product{" "}
        <strong>
          {relacion?.user_product
            ?.user_product_id ||
            "—"}
        </strong>
        .
      </Alert>

      <Box
        sx={{
          display: "grid",

          gridTemplateColumns: {
            xs: "1fr",
            md: "repeat(3, 1fr)",
          },

          gap: 3,
        }}
      >
        <DetailField
          label="Stock físico total"
          value={
            stock?.total ?? 0
          }
        />

        <DetailField
          label="Stock mode"
          value={
            stock?.stock_mode
          }
        />

        <DetailField
          label="Última actualización ML"
          value={formatearFecha(
            stock
              ?.fecha_actualizacion_ml,
          )}
        />

        <DetailField
          label="Fecha de liberación"
          value={formatearFecha(
            stock
              ?.product_release_date,
          )}
        />

        <DetailField
          label="Ubicaciones"
          value={
            ubicaciones.length
          }
        />
      </Box>

      <Typography
        variant="h6"
        sx={{
          mt: 4,
          mb: 2,
          fontWeight: 600,
        }}
      >
        Ubicaciones
      </Typography>

      {!ubicaciones.length ? (
        <Alert severity="info">
          No hay ubicaciones de stock
          registradas para este User
          Product.
        </Alert>
      ) : (
        <Box
          sx={{
            display: "grid",

            gridTemplateColumns: {
              xs: "1fr",
              sm:
                "repeat(2, 1fr)",
              md:
                "repeat(3, 1fr)",
            },

            gap: 2,
          }}
        >
          {ubicaciones.map(
            (ubicacion) => (
              <Paper
                key={
                  ubicacion.id
                }
                variant="outlined"
                sx={{
                  p: 2,
                }}
              >
                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  {ubicacion.tipo ||
                    "Ubicación"}
                </Typography>

                <Typography
                  variant="h5"
                  sx={{
                    mt: 0.5,
                    fontWeight: 700,
                  }}
                >
                  {Number(
                    ubicacion.quantity ||
                      0,
                  )}
                </Typography>

                {ubicacion.availability_type && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    {
                      ubicacion.availability_type
                    }
                  </Typography>
                )}
              </Paper>
            ),
          )}
        </Box>
      )}
    </Box>
  );
};

export default ProductoDetalleStock;