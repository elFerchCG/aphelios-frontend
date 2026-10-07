import React from "react";

import {
  Alert,
  Box,
  Chip,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";

import DetailField from "./DetailField";

import {
  formatearMoneda,
  getNombreCuenta,
} from "./productoDetalleHelpers";

const ProductoDetalleGeneral = ({
  producto,
  relaciones = [],
}) => {
  return (
    <Box>
      {/* ===============================================
          DATOS GENERALES
      =============================================== */}

      <Box
        sx={{
          display: "grid",

          gridTemplateColumns: {
            xs: "1fr",
            md: "repeat(3, 1fr)",
          },

          gap: 4,
        }}
      >
        <DetailField
          label="SKU"
          value={producto?.sku}
        />

        <DetailField
          label="Costo"
          value={formatearMoneda(
            producto?.costo,
          )}
        />

        <DetailField
          label="Inventario de seguridad"
          value={
            producto?.inv_seguridad
          }
        />

        <DetailField
          label="Inventario máximo"
          value={
            producto?.inv_maximo
          }
        />

        <DetailField
          label="Costo fijo"
          value={formatearMoneda(
            producto?.costo_fijo,
          )}
        />

        <DetailField
          label="Cantidad excedente"
          value={
            producto?.cantidad_excedente
          }
        />

        <DetailField
          label="Relaciones Mercado Libre"
          value={
            producto
              ?.cantidad_relaciones_ml ??
            relaciones.length
          }
        />

        <DetailField
          label="Cuentas Mercado Libre"
          value={
            producto
              ?.cantidad_cuentas_ml ??
            0
          }
        />

        <DetailField
          label="Stock ML total"
          value={
            producto?.stock_ml_total ??
            0
          }
        />

        <DetailField
          label="Items ML"
          value={
            producto?.items_ml_total ??
            0
          }
        />

        <DetailField
          label="Items activos"
          value={
            producto
              ?.items_ml_activos ??
            0
          }
        />

        <DetailField
          label="Estado"
          value={
            producto
              ?.producto_obsoleto
              ? "Obsoleto"
              : "Activo"
          }
        />
      </Box>

      <Divider
        sx={{
          my: 4,
        }}
      />

      {/* ===============================================
          RELACIONES
      =============================================== */}

      <Typography
        variant="h6"
        sx={{
          mb: 2,
          fontWeight: 600,
        }}
      >
        Vinculación con Mercado Libre
      </Typography>

      {!relaciones.length ? (
        <Alert severity="info">
          Este Producto Aphelios
          todavía no tiene relaciones
          con Mercado Libre.
        </Alert>
      ) : (
        <Box
          sx={{
            display: "grid",

            gridTemplateColumns: {
              xs: "1fr",
              md:
                "repeat(2, minmax(0, 1fr))",
            },

            gap: 2,
          }}
        >
          {relaciones.map(
            (relacion) => {
              const nombreCuenta =
                getNombreCuenta(
                  relacion,
                );

              const items =
                Array.isArray(
                  relacion?.items,
                )
                  ? relacion.items
                  : [];

              return (
                <Paper
                  key={
                    relacion.relacion_id
                  }
                  variant="outlined"
                  sx={{
                    p: 2,
                  }}
                >
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="flex-start"
                    spacing={2}
                  >
                    <Box>
                      <Typography
                        sx={{
                          fontWeight: 700,
                        }}
                      >
                        {nombreCuenta}
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        {relacion
                          ?.user_product
                          ?.user_product_id ||
                          "Sin MLMU"}
                      </Typography>
                    </Box>

                    <Chip
                      icon={
                        <CheckCircleOutlineOutlinedIcon />
                      }
                      label="Vinculado"
                      color="success"
                      variant="outlined"
                      size="small"
                    />
                  </Stack>

                  <Box
                    sx={{
                      mt: 2,

                      display: "grid",

                      gridTemplateColumns:
                        "repeat(2, minmax(0, 1fr))",

                      gap: 2,
                    }}
                  >
                    <DetailField
                      label="Stock"
                      value={
                        relacion
                          ?.stock
                          ?.total ?? 0
                      }
                    />

                    <DetailField
                      label="Items"
                      value={
                        items.length
                      }
                    />

                    <DetailField
                      label="Family"
                      value={
                        relacion
                          ?.familia
                          ?.family_id
                      }
                    />

                    <DetailField
                      label="Cuenta"
                      value={
                        nombreCuenta
                      }
                    />
                  </Box>
                </Paper>
              );
            },
          )}
        </Box>
      )}
    </Box>
  );
};

export default ProductoDetalleGeneral;