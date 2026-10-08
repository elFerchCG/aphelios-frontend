import React from "react";

import {
  Alert,
  Box,
  Chip,
  Divider,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";

import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";

import DetailField from "./DetailField";
import RelacionMercadoLibreSelector from "./RelacionMercadoLibreSelector";

import {
  formatearMoneda,
  getNombreCuenta,
  getItemsRelacion,
} from "./productoDetalleHelpers";

const ProductoDetalleMercadoLibre = ({
  relaciones = [],
  relacion,
  onSeleccionarRelacion,
}) => {
  if (!relaciones.length) {
    return (
      <Alert severity="info">
        Este producto no tiene relaciones con Mercado Libre.
      </Alert>
    );
  }

  if (!relacion) {
    return null;
  }

  const userProduct = relacion?.user_product || {};

  const familia = relacion?.familia || {};

  const cuenta = relacion?.cuenta || {};

  const items = getItemsRelacion(relacion);

  const nombreCuenta = getNombreCuenta(relacion);

  // =====================================================
  // TODAS LAS PUBLICACIONES DEL PRODUCTO APHELIOS
  // =====================================================

  const relacionesConItems = relaciones
    .map((relacionMl) => ({
      relacion: relacionMl,
      items: getItemsRelacion(relacionMl),
    }))
    .filter((grupo) => grupo.items.length > 0);

  const totalPublicaciones = relacionesConItems.reduce(
    (total, grupo) => total + grupo.items.length,
    0,
  );

  return (
    <Box>
      {/* ===============================================
          SELECTOR
      =============================================== */}

      <Typography
        variant="h6"
        sx={{
          mb: 0.5,
          fontWeight: 600,
        }}
      >
        Relaciones de Mercado Libre
      </Typography>

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{
          mb: 2,
        }}
      >
        Selecciona la cuenta y User Product que deseas consultar.
      </Typography>

      <RelacionMercadoLibreSelector
        relaciones={relaciones}
        relacionSeleccionada={relacion}
        onSeleccionar={onSeleccionarRelacion}
      />

      {/* ===============================================
          CUENTA
      =============================================== */}

      <Paper
        variant="outlined"
        sx={{
          p: 2,
          mb: 3,
        }}
      >
        <Stack
          direction={{
            xs: "column",
            sm: "row",
          }}
          justifyContent="space-between"
          spacing={2}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <StorefrontOutlinedIcon color="primary" />

            <Box>
              <Typography
                sx={{
                  fontWeight: 700,
                }}
              >
                {nombreCuenta}
              </Typography>

              <Typography variant="body2" color="text.secondary">
                {cuenta?.canal_nombre || "Mercado Libre"}
              </Typography>
            </Box>
          </Stack>

          <Chip
            label="Conectado"
            color="success"
            variant="outlined"
            size="small"
          />
        </Stack>
      </Paper>

      {/* ===============================================
          USER PRODUCT
      =============================================== */}

      <Typography
        variant="h6"
        sx={{
          mb: 2,
          fontWeight: 600,
        }}
      >
        User Product
      </Typography>

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
          label="User Product"
          value={userProduct?.user_product_id}
        />

        <DetailField label="Family" value={familia?.family_id} />

        <DetailField label="Nombre de familia" value={familia?.family_name} />

        <DetailField label="Domain" value={userProduct?.domain_id} />

        <DetailField
          label="Catalog Product"
          value={userProduct?.catalog_product_id}
        />

        <DetailField label="Site" value={userProduct?.site_id} />

        <DetailField label="Seller ID" value={cuenta?.seller_id} />

        <DetailField label="Tipo de cuenta" value={cuenta?.tipo} />

        <DetailField label="Items" value={items.length} />
      </Box>

      {/* ===============================================
          CONFIGURACIÓN COMERCIAL
      =============================================== */}

      <Divider
        sx={{
          my: 3,
        }}
      />

      <Typography
        variant="h6"
        sx={{
          mb: 2,
          fontWeight: 600,
        }}
      >
        Configuración comercial
      </Typography>

      <Box
        sx={{
          display: "grid",

          gridTemplateColumns: {
            xs: "1fr",
            md: "repeat(4, 1fr)",
          },

          gap: 3,
        }}
      >
        <DetailField
          label="Permitir FULL"
          value={relacion.permitir_full ? "Sí" : "No"}
        />

        <DetailField
          label="Costo de envío"
          value={formatearMoneda(relacion.costo_envio)}
        />

        <DetailField
          label="Comisión"
          value={`${Number(relacion.porcentaje_comision || 0)}%`}
        />

        <DetailField
          label="Costo publicación"
          value={formatearMoneda(relacion.costo_publicacion)}
        />
      </Box>

      {/* ===============================================
    PUBLICACIONES
=============================================== */}

      <Divider
        sx={{
          my: 3,
        }}
      />

      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        spacing={2}
        sx={{
          mb: 2,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
          }}
        >
          Publicaciones
        </Typography>

        <Chip
          label={`${totalPublicaciones} ${
            totalPublicaciones === 1 ? "publicación" : "publicaciones"
          }`}
          size="small"
          color="primary"
          variant="outlined"
        />
      </Stack>

      {totalPublicaciones === 0 ? (
        <Alert severity="info">
          Este Producto Aphelios no tiene publicaciones registradas en Mercado
          Libre.
        </Alert>
      ) : (
        <Stack spacing={3}>
          {relacionesConItems.map(
            ({ relacion: relacionMl, items: itemsRelacion }) => {
              const nombreCuentaRelacion = getNombreCuenta(relacionMl);

              const mlmu =
                relacionMl?.user_product?.user_product_id || "Sin MLMU";

              return (
                <Box key={relacionMl.relacion_id}>
                  {/* =====================================
                ENCABEZADO DE CUENTA / MLMU
            ===================================== */}

                  <Stack
                    direction={{
                      xs: "column",
                      sm: "row",
                    }}
                    justifyContent="space-between"
                    alignItems={{
                      xs: "flex-start",
                      sm: "center",
                    }}
                    spacing={1}
                    sx={{
                      mb: 1.5,
                    }}
                  >
                    <Stack direction="row" spacing={1} alignItems="center">
                      <StorefrontOutlinedIcon
                        color="primary"
                        fontSize="small"
                      />

                      <Box>
                        <Typography
                          sx={{
                            fontWeight: 700,
                          }}
                        >
                          {nombreCuentaRelacion}
                        </Typography>

                        <Typography variant="body2" color="text.secondary">
                          {mlmu}
                        </Typography>
                      </Box>
                    </Stack>

                    <Chip
                      label={`${itemsRelacion.length} ${
                        itemsRelacion.length === 1
                          ? "publicación"
                          : "publicaciones"
                      }`}
                      size="small"
                      variant="outlined"
                    />
                  </Stack>

                  {/* =====================================
                ITEMS DE ESTA RELACIÓN
            ===================================== */}

                  <Stack spacing={1.5}>
                    {itemsRelacion.map((item) => (
                      <Paper
                        key={item.id || item.item_id}
                        variant="outlined"
                        sx={{
                          p: 2,
                        }}
                      >
                        <Stack
                          direction={{
                            xs: "column",
                            md: "row",
                          }}
                          spacing={2}
                          justifyContent="space-between"
                          alignItems={{
                            xs: "stretch",
                            md: "center",
                          }}
                        >
                          <Stack
                            direction="row"
                            spacing={2}
                            alignItems="center"
                          >
                            {/* IMAGEN */}

                            {item.thumbnail_url ? (
                              <Box
                                component="img"
                                src={item.thumbnail_url}
                                alt={item.title || item.item_id}
                                sx={{
                                  width: 56,
                                  height: 56,

                                  objectFit: "contain",

                                  border: "1px solid",

                                  borderColor: "divider",

                                  borderRadius: 1,
                                }}
                              />
                            ) : (
                              <Box
                                sx={{
                                  width: 56,
                                  height: 56,

                                  border: "1px solid",

                                  borderColor: "divider",

                                  borderRadius: 1,

                                  display: "flex",

                                  alignItems: "center",

                                  justifyContent: "center",

                                  color: "text.disabled",
                                }}
                              >
                                <ImageOutlinedIcon />
                              </Box>
                            )}

                            {/* INFORMACIÓN */}

                            <Box>
                              <Typography
                                sx={{
                                  fontWeight: 600,
                                }}
                              >
                                {item.title || item.item_id}
                              </Typography>

                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {item.item_id}
                              </Typography>

                              <Stack
                                direction="row"
                                spacing={1}
                                useFlexGap
                                flexWrap="wrap"
                                sx={{
                                  mt: 0.75,
                                }}
                              >
                                <Chip
                                  label={item.status || "Sin estado"}
                                  size="small"
                                  variant="outlined"
                                />

                                <Chip
                                  label={`Stock: ${
                                    item.available_quantity ?? 0
                                  }`}
                                  size="small"
                                  variant="outlined"
                                />

                                {item.price !== null &&
                                  item.price !== undefined && (
                                    <Chip
                                      label={formatearMoneda(item.price)}
                                      size="small"
                                      variant="outlined"
                                    />
                                  )}
                              </Stack>
                            </Box>
                          </Stack>

                          {/* ABRIR ML */}

                          {item.permalink && (
                            <Tooltip title="Abrir en Mercado Libre">
                              <IconButton
                                color="primary"
                                onClick={() =>
                                  window.open(
                                    item.permalink,
                                    "_blank",
                                    "noopener,noreferrer",
                                  )
                                }
                              >
                                <OpenInNewOutlinedIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                </Box>
              );
            },
          )}
        </Stack>
      )}
    </Box>
  );
};

export default ProductoDetalleMercadoLibre;
