import React from "react";

import {
  Alert,
  Box,
  Divider,
  Paper,
  Typography,
} from "@mui/material";

import RelacionMercadoLibreSelector from "./RelacionMercadoLibreSelector";

import {
  getAtributosRelacion,
  getImagenesRelacion,
  getNombreCuenta,
  mostrarValor,
} from "./productoDetalleHelpers";

const ProductoDetalleAtributos = ({
  relaciones = [],
  relacion,
  onSeleccionarRelacion,
}) => {
  if (!relaciones.length) {
    return (
      <Alert severity="info">
        No existe una relación de
        Mercado Libre para consultar
        atributos.
      </Alert>
    );
  }

  if (!relacion) {
    return null;
  }

  const atributos =
    getAtributosRelacion(
      relacion,
    );

  const imagenes =
    getImagenesRelacion(
      relacion,
    );

  return (
    <Box>
      <Typography
        variant="h6"
        sx={{
          mb: 0.5,
          fontWeight: 600,
        }}
      >
        Atributos del User Product
      </Typography>

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{
          mb: 2,
        }}
      >
        Selecciona la relación de
        Mercado Libre cuyos atributos
        deseas consultar.
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
        Mostrando información de{" "}
        <strong>
          {getNombreCuenta(
            relacion,
          )}
        </strong>{" "}
        ·{" "}
        <strong>
          {relacion?.user_product
            ?.user_product_id ||
            "—"}
        </strong>
      </Alert>

      {/* ===============================================
          ATRIBUTOS
      =============================================== */}

      {!atributos.length ? (
        <Alert severity="info">
          No hay atributos registrados
          para este User Product.
        </Alert>
      ) : (
        <Box
          sx={{
            display: "grid",

            gridTemplateColumns: {
              xs: "1fr",
              md:
                "repeat(2, minmax(0, 1fr))",
              lg:
                "repeat(3, minmax(0, 1fr))",
            },

            gap: 2,
          }}
        >
          {atributos.map(
            (atributo) => {
              let valor =
                atributo.valor_nombre;

              if (
                valor === null ||
                valor === undefined ||
                valor === ""
              ) {
                valor =
                  atributo.valor_numerico;
              }

              if (
                valor !== null &&
                valor !== undefined &&
                valor !== "" &&
                atributo.unidad
              ) {
                valor =
                  `${valor} ${atributo.unidad}`;
              }

              return (
                <Paper
                  key={
                    atributo.id
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
                    {atributo.nombre ||
                      atributo.atributo_id}
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.5,
                      fontWeight: 600,
                      wordBreak:
                        "break-word",
                    }}
                  >
                    {mostrarValor(
                      valor,
                    )}
                  </Typography>

                  <Typography
                    variant="caption"
                    color="text.disabled"
                  >
                    {
                      atributo.atributo_id
                    }
                  </Typography>
                </Paper>
              );
            },
          )}
        </Box>
      )}

      {/* ===============================================
          IMÁGENES
      =============================================== */}

      <Divider
        sx={{
          my: 4,
        }}
      />

      <Typography
        variant="h6"
        sx={{
          mb: 2,
          fontWeight: 600,
        }}
      >
        Imágenes del User Product
      </Typography>

      {!imagenes.length ? (
        <Alert severity="info">
          No hay imágenes registradas
          para este User Product.
        </Alert>
      ) : (
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          {imagenes.map(
            (imagen) => (
              <Paper
                key={
                  imagen.id
                }
                variant="outlined"
                sx={{
                  p: 1,
                }}
              >
                <Box
                  component="img"
                  src={
                    imagen.secure_url
                  }
                  alt={
                    imagen.picture_id ||
                    "Producto"
                  }
                  sx={{
                    width: 120,
                    height: 120,

                    objectFit:
                      "contain",

                    display:
                      "block",
                  }}
                />

                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    display:
                      "block",
                    mt: 0.5,
                    maxWidth: 120,

                    overflow:
                      "hidden",

                    textOverflow:
                      "ellipsis",

                    whiteSpace:
                      "nowrap",
                  }}
                >
                  {imagen.picture_id}
                </Typography>
              </Paper>
            ),
          )}
        </Box>
      )}
    </Box>
  );
};

export default ProductoDetalleAtributos;