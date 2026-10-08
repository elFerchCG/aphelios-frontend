import React from "react";

import {
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";

import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";

import {
  modalTitleSx,
  modalContentSx,
  modalActionsSx,
  modalSecondaryButtonSx,
} from "../../../common/modalStyles";

// =====================================================
// HELPERS
// =====================================================

const formatMoney = (value) => {
  if (
    value === null ||
    value === undefined
  ) {
    return "—";
  }

  return `$${Number(
    value,
  ).toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const getStatusLabel = (status) => {
  switch (status) {
    case "active":
      return "Activo";

    case "paused":
      return "Pausado";

    case "under_review":
      return "En revisión";

    case "closed":
      return "Cerrado";

    default:
      return status || "Sin estado";
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case "active":
      return "success";

    case "paused":
      return "warning";

    case "under_review":
      return "info";

    default:
      return "default";
  }
};

const getNombreCuenta = (relacion) => {
  return (
    relacion?.cuenta
      ?.cuenta_ecommerce_nombre ||
    relacion?.cuenta?.nombre ||
    "Mercado Libre"
  );
};

// =====================================================
// COMPONENTE
// =====================================================

const SeleccionarPublicacionModal = ({
  open,
  onClose,
  producto,
}) => {
  // =====================================================
  // RELACIONES
  // =====================================================

  const relaciones = Array.isArray(
    producto?.mercado_libre,
  )
    ? producto.mercado_libre
    : [];

  // =====================================================
  // TOTAL PUBLICACIONES
  // =====================================================

  const totalPublicaciones =
    relaciones.reduce(
      (total, relacion) => {
        const items =
          Array.isArray(
            relacion?.items,
          )
            ? relacion.items
            : [];

        return total + items.length;
      },
      0,
    );

  // =====================================================
  // TOTAL CUENTAS
  // =====================================================

  const cuentasUnicas =
    new Set(
      relaciones
        .map(
          (relacion) =>
            relacion?.cuenta
              ?.cuenta_ml_id,
        )
        .filter(Boolean),
    );

  const totalCuentas =
    cuentasUnicas.size;

  // =====================================================
  // ABRIR PUBLICACIÓN
  // =====================================================

  const handleAbrirPublicacion = (
    item,
  ) => {
    if (!item?.permalink) {
      return;
    }

    window.open(
      item.permalink,
      "_blank",
      "noopener,noreferrer",
    );
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
    >
      {/* =================================================
          HEADER
      ================================================= */}

      <DialogTitle
        sx={modalTitleSx}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
          }}
        >
          <StorefrontOutlinedIcon
            color="primary"
          />

          <Box>
            <Typography
              variant="h6"
              fontWeight={600}
            >
              Seleccionar publicación
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
            >
              {producto?.sku ||
                "Producto"}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      {/* =================================================
          CONTENIDO
      ================================================= */}

      <DialogContent
        sx={{
          ...modalContentSx,

          paddingTop:
            "20px !important",
        }}
      >
        {/* =================================================
            PRODUCTO
        ================================================= */}

        <Box
          sx={{
            mb: 3,
          }}
        >
          <Typography
            variant="body1"
            fontWeight={600}
          >
            {producto?.nombre ||
              "Producto"}
          </Typography>

          <Stack
            direction="row"
            spacing={1}
            useFlexGap
            flexWrap="wrap"
            sx={{
              mt: 1.5,
            }}
          >
            <Chip
              icon={
                <StorefrontOutlinedIcon />
              }
              label={`${totalPublicaciones} ${
                totalPublicaciones === 1
                  ? "publicación"
                  : "publicaciones"
              }`}
              size="small"
              variant="outlined"
            />

            <Chip
              icon={
                <AccountTreeOutlinedIcon />
              }
              label={`${relaciones.length} ${
                relaciones.length === 1
                  ? "relación"
                  : "relaciones"
              }`}
              size="small"
              variant="outlined"
            />

            <Chip
              label={`${totalCuentas} ${
                totalCuentas === 1
                  ? "cuenta"
                  : "cuentas"
              }`}
              size="small"
              color="primary"
              variant="outlined"
            />
          </Stack>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mt: 1.5,
            }}
          >
            Este Producto Aphelios
            tiene varias publicaciones.
            Están agrupadas por cuenta
            y User Product para que
            puedas identificar de dónde
            proviene cada una.
          </Typography>
        </Box>

        {/* =================================================
            RELACIONES / CUENTAS
        ================================================= */}

        <Stack spacing={3}>
          {relaciones.map(
            (relacion) => {
              const items =
                Array.isArray(
                  relacion?.items,
                )
                  ? relacion.items
                  : [];

              const nombreCuenta =
                getNombreCuenta(
                  relacion,
                );

              const mlmu =
                relacion
                  ?.user_product
                  ?.user_product_id ||
                "Sin MLMU";

              const family =
                relacion?.familia
                  ?.family_id ||
                "Sin Family";

              return (
                <Box
                  key={
                    relacion.relacion_id
                  }
                >
                  {/* =====================================
                      ENCABEZADO RELACIÓN
                  ===================================== */}

                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,

                      mb: 1.5,

                      bgcolor:
                        "action.hover",
                    }}
                  >
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
                      spacing={2}
                    >
                      <Box>
                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="center"
                        >
                          <StorefrontOutlinedIcon
                            color="primary"
                            fontSize="small"
                          />

                          <Typography
                            fontWeight={700}
                          >
                            {nombreCuenta}
                          </Typography>
                        </Stack>

                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            mt: 0.75,
                          }}
                        >
                          User Product:{" "}
                          <strong>
                            {mlmu}
                          </strong>
                        </Typography>

                        <Typography
                          variant="body2"
                          color="text.secondary"
                        >
                          Family:{" "}
                          <strong>
                            {family}
                          </strong>
                        </Typography>
                      </Box>

                      <Chip
                        label={`${items.length} ${
                          items.length === 1
                            ? "publicación"
                            : "publicaciones"
                        }`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </Stack>
                  </Paper>

                  {/* =====================================
                      PUBLICACIONES DE LA RELACIÓN
                  ===================================== */}

                  <Stack spacing={1.5}>
                    {items.map(
                      (item) => (
                        <Paper
                          key={
                            item.id ||
                            item.item_id
                          }
                          variant="outlined"
                          sx={{
                            p: 2,

                            borderRadius: 2,

                            transition:
                              "border-color 0.15s ease, box-shadow 0.15s ease",

                            "&:hover": {
                              borderColor:
                                "primary.main",

                              boxShadow: 1,
                            },
                          }}
                        >
                          <Box
                            sx={{
                              display:
                                "flex",

                              alignItems:
                                "center",

                              gap: 2,
                            }}
                          >
                            {/* =========================
                                IMAGEN
                            ========================= */}

                            <Avatar
                              src={
                                item.thumbnail_url ||
                                relacion
                                  ?.user_product
                                  ?.thumbnail_url
                              }
                              variant="rounded"
                              sx={{
                                width: 72,
                                height: 72,

                                flexShrink: 0,
                              }}
                            />

                            {/* =========================
                                INFORMACIÓN
                            ========================= */}

                            <Box
                              sx={{
                                flex: 1,
                                minWidth: 0,
                              }}
                            >
                              <Box
                                sx={{
                                  display:
                                    "flex",

                                  alignItems:
                                    "center",

                                  gap: 1,

                                  flexWrap:
                                    "wrap",
                                }}
                              >
                                <Typography
                                  fontWeight={
                                    600
                                  }
                                >
                                  {
                                    item.item_id
                                  }
                                </Typography>

                                <Chip
                                  label={getStatusLabel(
                                    item.status,
                                  )}
                                  color={getStatusColor(
                                    item.status,
                                  )}
                                  size="small"
                                  variant="outlined"
                                />
                              </Box>

                              <Tooltip
                                title={
                                  item.title ||
                                  ""
                                }
                                arrow
                              >
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  noWrap
                                  sx={{
                                    mt: 0.5,
                                  }}
                                >
                                  {item.title ||
                                    "Sin título"}
                                </Typography>
                              </Tooltip>

                              <Stack
                                direction="row"
                                spacing={1}
                                useFlexGap
                                flexWrap="wrap"
                                sx={{
                                  mt: 1,
                                }}
                              >
                                <Typography
                                  variant="body2"
                                  fontWeight={
                                    600
                                  }
                                >
                                  {formatMoney(
                                    item.price,
                                  )}
                                </Typography>

                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  Stock:{" "}
                                  {item.available_quantity ??
                                    0}
                                </Typography>
                              </Stack>
                            </Box>

                            {/* =========================
                                SEPARADOR
                            ========================= */}

                            <Divider
                              orientation="vertical"
                              flexItem
                            />

                            {/* =========================
                                ABRIR ML
                            ========================= */}

                            <Tooltip title="Abrir en Mercado Libre">
                              <IconButton
                                color="primary"
                                onClick={() =>
                                  handleAbrirPublicacion(
                                    item,
                                  )
                                }
                              >
                                <OpenInNewOutlinedIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Paper>
                      ),
                    )}
                  </Stack>
                </Box>
              );
            },
          )}
        </Stack>
      </DialogContent>

      {/* =================================================
          ACCIONES
      ================================================= */}

      <DialogActions
        sx={modalActionsSx}
      >
        <Button
          variant="outlined"
          onClick={onClose}
          sx={
            modalSecondaryButtonSx
          }
        >
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SeleccionarPublicacionModal;