import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import axios from "axios";

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";

import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";

import ProductoDetalleGeneral from "./ProductoApheliosDetalleModal/ProductoDetalleGeneral";
import ProductoDetalleMercadoLibre from "./ProductoApheliosDetalleModal/ProductoDetalleMercadoLibre";
import ProductoDetalleStock from "./ProductoApheliosDetalleModal/ProductoDetalleStock";
import ProductoDetalleAtributos from "./ProductoApheliosDetalleModal/ProductoDetalleAtributos";

const apiUrl =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_URL
    : process.env.REACT_APP_API_URL_LOCAL;

const ProductoApheliosDetalleModal = ({
  open,
  onClose,
  productoId,
}) => {
  // =====================================================
  // ESTADOS
  // =====================================================

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [detalle, setDetalle] =
    useState(null);

  const [tab, setTab] =
    useState(0);

  const [
    relacionSeleccionadaId,
    setRelacionSeleccionadaId,
  ] = useState(null);

  // =====================================================
  // OBTENER DETALLE
  // =====================================================

  useEffect(() => {
    if (
      !open ||
      !productoId
    ) {
      return;
    }

    const obtenerDetalle =
      async () => {
        try {
          setLoading(true);
          setError("");
          setDetalle(null);

          const token =
            localStorage.getItem(
              "token",
            );

          const response =
            await axios.get(
              `${apiUrl}/productosAphelios/${productoId}`,
              {
                headers: {
                  Authorization:
                    `Bearer ${token}`,
                },
              },
            );

          const data =
            response.data;

          setDetalle(data);

          const relaciones =
            Array.isArray(
              data?.mercado_libre,
            )
              ? data.mercado_libre
              : [];

          setRelacionSeleccionadaId(
            relaciones[0]
              ?.relacion_id ??
              null,
          );
        } catch (error) {
          console.error(
            "Error al obtener Producto Aphelios:",
            error,
          );

          setError(
            error.response?.data
              ?.message ||
              "No se pudo cargar el producto.",
          );
        } finally {
          setLoading(false);
        }
      };

    obtenerDetalle();
  }, [
    open,
    productoId,
  ]);

  // =====================================================
  // RESET
  // =====================================================

  useEffect(() => {
    if (!open) {
      setTab(0);
      setDetalle(null);
      setError("");

      setRelacionSeleccionadaId(
        null,
      );
    }
  }, [open]);

  // =====================================================
  // DATOS
  // =====================================================

  const producto =
    detalle?.producto || null;

  const relaciones =
    useMemo(() => {
      return Array.isArray(
        detalle?.mercado_libre,
      )
        ? detalle.mercado_libre
        : [];
    }, [detalle]);

  const relacionSeleccionada =
    useMemo(() => {
      if (!relaciones.length) {
        return null;
      }

      return (
        relaciones.find(
          (relacion) =>
            String(
              relacion.relacion_id,
            ) ===
            String(
              relacionSeleccionadaId,
            ),
        ) || relaciones[0]
      );
    }, [
      relaciones,
      relacionSeleccionadaId,
    ]);

  // =====================================================
  // CAMBIAR RELACIÓN
  // =====================================================

  const handleSeleccionarRelacion = (
    relacion,
  ) => {
    setRelacionSeleccionadaId(
      relacion.relacion_id,
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
      maxWidth="lg"
      PaperProps={{
        sx: {
          minHeight: "72vh",
          maxHeight: "90vh",
        },
      }}
    >
      {loading ? (
        <Box
          sx={{
            minHeight: 420,

            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CircularProgress />
        </Box>
      ) : error ? (
        <>
          <DialogTitle>
            Producto Aphelios
          </DialogTitle>

          <DialogContent>
            <Alert severity="error">
              {error}
            </Alert>
          </DialogContent>

          <DialogActions>
            <Button
              variant="outlined"
              onClick={onClose}
            >
              Cerrar
            </Button>
          </DialogActions>
        </>
      ) : producto ? (
        <>
          {/* ===============================================
              HEADER
          =============================================== */}

          <DialogTitle
            sx={{
              pr: 7,
              pb: 2,
            }}
          >
            <Typography
              variant="h5"
              component="div"
              sx={{
                color:
                  "primary.dark",

                fontWeight: 700,
              }}
            >
              {producto.sku}
            </Typography>

            <Typography
              variant="body1"
              color="text.secondary"
              sx={{
                mt: 0.5,
              }}
            >
              {producto.nombre}
            </Typography>

            <IconButton
              onClick={onClose}
              sx={{
                position:
                  "absolute",

                right: 16,
                top: 16,
              }}
            >
              <CloseOutlinedIcon />
            </IconButton>
          </DialogTitle>

          <Divider />

          <DialogContent
            sx={{
              px: 3,
              py: 2,
            }}
          >
            {/* =============================================
                RESUMEN
            ============================================= */}

            <Stack
              direction="row"
              spacing={1}
              useFlexGap
              flexWrap="wrap"
              sx={{
                mb: 2,
              }}
            >
              <Chip
                label={
                  producto.producto_obsoleto
                    ? "Obsoleto"
                    : "Activo"
                }
                color={
                  producto.producto_obsoleto
                    ? "default"
                    : "success"
                }
                variant="outlined"
                size="small"
              />

              <Chip
                icon={
                  <Inventory2OutlinedIcon />
                }
                label={`Stock ML: ${
                  producto.stock_ml_total ??
                  0
                }`}
                variant="outlined"
                size="small"
              />

              <Chip
                icon={
                  <StorefrontOutlinedIcon />
                }
                label={`${
                  producto.items_ml_total ??
                  0
                } Items`}
                variant="outlined"
                size="small"
              />

              <Chip
                icon={
                  <AccountTreeOutlinedIcon />
                }
                label={`${
                  producto
                    .cantidad_relaciones_ml ??
                  relaciones.length
                } ${
                  (
                    producto
                      .cantidad_relaciones_ml ??
                    relaciones.length
                  ) === 1
                    ? "relación"
                    : "relaciones"
                }`}
                variant="outlined"
                size="small"
              />
            </Stack>

            {/* =============================================
                TABS
            ============================================= */}

            <Tabs
              value={tab}
              onChange={(
                event,
                value,
              ) =>
                setTab(value)
              }
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                borderBottom: 1,
                borderColor:
                  "divider",
                mb: 3,
              }}
            >
              <Tab label="General" />

              <Tab label="Mercado Libre" />

              <Tab label="Stock" />

              <Tab label="Atributos" />
            </Tabs>

            {/* =============================================
                GENERAL
            ============================================= */}

            {tab === 0 && (
              <ProductoDetalleGeneral
                producto={
                  producto
                }
                relaciones={
                  relaciones
                }
              />
            )}

            {/* =============================================
                MERCADO LIBRE
            ============================================= */}

            {tab === 1 && (
              <ProductoDetalleMercadoLibre
                relaciones={
                  relaciones
                }
                relacion={
                  relacionSeleccionada
                }
                onSeleccionarRelacion={
                  handleSeleccionarRelacion
                }
              />
            )}

            {/* =============================================
                STOCK
            ============================================= */}

            {tab === 2 && (
              <ProductoDetalleStock
                relaciones={
                  relaciones
                }
                relacion={
                  relacionSeleccionada
                }
                onSeleccionarRelacion={
                  handleSeleccionarRelacion
                }
              />
            )}

            {/* =============================================
                ATRIBUTOS
            ============================================= */}

            {tab === 3 && (
              <ProductoDetalleAtributos
                relaciones={
                  relaciones
                }
                relacion={
                  relacionSeleccionada
                }
                onSeleccionarRelacion={
                  handleSeleccionarRelacion
                }
              />
            )}
          </DialogContent>

          <Divider />

          <DialogActions
            sx={{
              px: 3,
              py: 2,
            }}
          >
            <Button
              variant="outlined"
              onClick={onClose}
            >
              Cerrar
            </Button>
          </DialogActions>
        </>
      ) : null}
    </Dialog>
  );
};

export default ProductoApheliosDetalleModal;