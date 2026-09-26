import React, { useEffect, useState } from "react";
import {
  Alert,
  Avatar,
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
  Link,
  Paper,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from "@mui/material";

import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";

import axios from "axios";

import {
  modalTitleSx,
  modalContentSx,
  modalActionsSx,
  modalSecondaryButtonSx,
} from "../../../common/modalStyles";

const API_URL =
    process.env.NODE_ENV === "production"
      ? process.env.REACT_APP_API_URL
      : process.env.REACT_APP_API_URL_LOCAL;

// =====================================================
// HELPERS
// =====================================================

const formatMoney = (value) => {
  if (value === null || value === undefined) return "—";

  return Number(value).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
  });
};

const mostrarValor = (value) => {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  return value;
};

const getStatusColor = (status) => {
  switch (status) {
    case "active":
      return "success";

    case "paused":
      return "warning";

    case "under_review":
      return "info";

    case "closed":
      return "default";

    default:
      return "default";
  }
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

// =====================================================
// COMPONENTE DE CAMPO
// =====================================================

const InfoField = ({ label, value }) => (
  <Box>
    <Typography
      variant="caption"
      color="text.secondary"
      sx={{ display: "block", mb: 0.3 }}
    >
      {label}
    </Typography>

    <Typography variant="body2" fontWeight={500}>
      {mostrarValor(value)}
    </Typography>
  </Box>
);

// =====================================================
// MODAL
// =====================================================

const ProductoApheliosDetalleModal = ({ open, onClose, productoId }) => {
  const [loading, setLoading] = useState(false);
  const [detalle, setDetalle] = useState(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState(0);

  // =====================================================
  // CARGAR DETALLE
  // =====================================================

  useEffect(() => {
    if (!open || !productoId) return;

    const obtenerDetalle = async () => {
      try {
        setLoading(true);
        setError("");
        setDetalle(null);
        setTab(0);

        const token = localStorage.getItem("token");

        const response = await axios.get(
          `${API_URL}/productosAphelios/${productoId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        setDetalle(response.data);
      } catch (error) {
        console.error("Error al obtener detalle del producto:", error);

        setError(
          error.response?.data?.message ||
            "No se pudo obtener el detalle del producto.",
        );
      } finally {
        setLoading(false);
      }
    };

    obtenerDetalle();
  }, [open, productoId]);

  // =====================================================
  // DATOS
  // =====================================================

  const producto = detalle?.producto;
  const mercadoLibre = detalle?.mercado_libre;

  const userProduct = mercadoLibre?.user_product;
  const familia = mercadoLibre?.familia;
  const stock = mercadoLibre?.stock;

  const items = mercadoLibre?.items || [];
  const atributos = mercadoLibre?.atributos || [];
  const imagenes = mercadoLibre?.imagenes || [];

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      {/* =================================================
          HEADER
      ================================================= */}

      <DialogTitle
        sx={{
          ...modalTitleSx,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h6" fontWeight={600}>
            {producto?.sku || "Detalle del producto"}
          </Typography>

          {producto?.nombre && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.3 }}>
              {producto.nombre}
            </Typography>
          )}
        </Box>
      </DialogTitle>

      {/* =================================================
          CONTENIDO
      ================================================= */}

      <DialogContent sx={modalContentSx}>
        {loading && (
          <Box
            sx={{
              minHeight: 350,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <CircularProgress />
          </Box>
        )}

        {!loading && error && <Alert severity="error">{error}</Alert>}

        {!loading && !error && detalle && (
          <>
            {/* =============================================
                RESUMEN
            ============================================= */}

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                flexWrap: "wrap",
                mt: 2,
                mb: 2,
              }}
            >
              <Chip
                label={producto.producto_obsoleto ? "Obsoleto" : "Activo"}
                color={producto.producto_obsoleto ? "default" : "success"}
                variant="outlined"
                size="small"
              />

              <Chip
                icon={<Inventory2OutlinedIcon />}
                label={`Stock ML: ${stock?.total ?? 0}`}
                variant="outlined"
                size="small"
              />

              <Chip
                icon={<StorefrontOutlinedIcon />}
                label={`${items.length} Item${items.length === 1 ? "" : "s"}`}
                variant="outlined"
                size="small"
              />
            </Box>

            {/* =============================================
                TABS
            ============================================= */}

            <Tabs
              value={tab}
              onChange={(_, newValue) => setTab(newValue)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ mb: 2 }}
            >
              <Tab label="General" />
              <Tab label="Mercado Libre" />
              <Tab label="Stock" />
              <Tab label="Atributos" />
            </Tabs>

            <Divider sx={{ mb: 3 }} />

            {/* =============================================
                TAB GENERAL
            ============================================= */}

            {tab === 0 && (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, 1fr)",
                    md: "repeat(3, 1fr)",
                  },
                  gap: 3,
                }}
              >
                <InfoField label="SKU" value={producto.sku} />

                <InfoField label="Costo" value={formatMoney(producto.costo)} />

                <InfoField
                  label="Inventario de seguridad"
                  value={producto.inv_seguridad}
                />

                <InfoField
                  label="Inventario máximo"
                  value={producto.inv_maximo}
                />

                <InfoField
                  label="Costo fijo"
                  value={formatMoney(producto.costo_fijo)}
                />

                <InfoField
                  label="Cantidad excedente"
                  value={producto.cantidad_excedente}
                />

                <InfoField
                  label="ID legacy principal"
                  value={producto.producto_id_legacy}
                />

                <InfoField
                  label="IDs legacy asociados"
                  value={
                    producto.legacy_ids?.length
                      ? producto.legacy_ids.join(", ")
                      : "—"
                  }
                />
              </Box>
            )}

            {/* =============================================
                TAB MERCADO LIBRE
            ============================================= */}

            {tab === 1 && (
              <Box>
                {/* =====================================================
        ENCABEZADO DEL CANAL
    ====================================================== */}

                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    mb: 3,
                    borderRadius: 2,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 2,
                      flexWrap: "wrap",
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                      }}
                    >
                      <StorefrontOutlinedIcon color="primary" />

                      <Box>
                        <Typography variant="subtitle1" fontWeight={600}>
                          Mercado Libre
                        </Typography>

                        <Typography variant="body2" color="text.secondary">
                          Canal de venta vinculado
                        </Typography>
                      </Box>
                    </Box>

                    <Chip
                      label="Conectado"
                      color="success"
                      variant="outlined"
                      size="small"
                    />
                  </Box>
                </Paper>

                {/* =====================================================
        USER PRODUCT
    ====================================================== */}

                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                  User Product
                </Typography>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      sm: "repeat(2, 1fr)",
                      md: "repeat(3, 1fr)",
                    },
                    gap: 3,
                    mb: 4,
                  }}
                >
                  <InfoField
                    label="User Product"
                    value={userProduct?.user_product_id}
                  />

                  <InfoField label="Family" value={familia?.family_id} />

                  <InfoField
                    label="Nombre de familia"
                    value={familia?.family_name}
                  />

                  <InfoField label="Domain" value={userProduct?.domain_id} />

                  <InfoField
                    label="Catalog Product"
                    value={userProduct?.catalog_product_id}
                  />

                  <InfoField label="Cantidad de Items" value={items.length} />
                </Box>

                <Divider sx={{ mb: 3 }} />

                {/* =====================================================
        CONFIGURACIÓN COMERCIAL
    ====================================================== */}

                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                  Configuración comercial
                </Typography>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      sm: "repeat(2, 1fr)",
                      md: "repeat(4, 1fr)",
                    },
                    gap: 3,
                    mb: 4,
                  }}
                >
                  <InfoField
                    label="Permitir Full"
                    value={mercadoLibre?.permitir_full ? "Sí" : "No"}
                  />

                  <InfoField
                    label="Costo de envío"
                    value={formatMoney(mercadoLibre?.costo_envio)}
                  />

                  <InfoField
                    label="Comisión"
                    value={
                      mercadoLibre?.porcentaje_comision !== null &&
                      mercadoLibre?.porcentaje_comision !== undefined
                        ? `${mercadoLibre.porcentaje_comision}%`
                        : "—"
                    }
                  />

                  <InfoField
                    label="Costo publicación"
                    value={formatMoney(mercadoLibre?.costo_publicacion)}
                  />
                </Box>

                <Divider sx={{ mb: 3 }} />

                {/* =====================================================
        ITEMS
    ====================================================== */}

                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 2,
                    mb: 2,
                  }}
                >
                  <Typography variant="subtitle1" fontWeight={600}>
                    Publicaciones
                  </Typography>

                  <Chip
                    label={`${items.length} ${
                      items.length === 1 ? "Item" : "Items"
                    }`}
                    size="small"
                    variant="outlined"
                  />
                </Box>

                {items.length === 0 ? (
                  <Alert severity="info">
                    Este User Product no tiene publicaciones asociadas
                    actualmente.
                  </Alert>
                ) : (
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                    }}
                  >
                    {items.map((item) => (
                      <Paper
                        key={item.id}
                        variant="outlined"
                        sx={{
                          p: 2,
                          borderRadius: 2,
                        }}
                      >
                        {/* =============================================
                CABECERA ITEM
            ============================================== */}

                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            gap: 2,
                            flexWrap: "wrap",
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              gap: 2,
                              minWidth: 0,
                            }}
                          >
                            {item.thumbnail_url ? (
                              <Avatar
                                src={item.thumbnail_url}
                                variant="rounded"
                                sx={{
                                  width: 64,
                                  height: 64,
                                }}
                              />
                            ) : (
                              <Avatar
                                variant="rounded"
                                sx={{
                                  width: 64,
                                  height: 64,
                                }}
                              >
                                <ImageOutlinedIcon />
                              </Avatar>
                            )}

                            <Box sx={{ minWidth: 0 }}>
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                  flexWrap: "wrap",
                                }}
                              >
                                <Typography fontWeight={600}>
                                  {item.item_id}
                                </Typography>

                                <Chip
                                  size="small"
                                  label={getStatusLabel(item.status)}
                                  color={getStatusColor(item.status)}
                                  variant="outlined"
                                />
                              </Box>

                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mt: 0.5 }}
                              >
                                {item.title}
                              </Typography>
                            </Box>
                          </Box>

                          {item.permalink && (
                            <Tooltip title="Abrir en Mercado Libre">
                              <IconButton
                                component={Link}
                                href={item.permalink}
                                target="_blank"
                                rel="noopener noreferrer"
                                color="primary"
                              >
                                <OpenInNewOutlinedIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>

                        <Divider sx={{ my: 2 }} />

                        {/* =============================================
                INFORMACIÓN ITEM
            ============================================== */}

                        <Box
                          sx={{
                            display: "grid",
                            gridTemplateColumns: {
                              xs: "repeat(2, 1fr)",
                              md: "repeat(4, 1fr)",
                            },
                            gap: 2,
                          }}
                        >
                          <InfoField
                            label="Precio"
                            value={formatMoney(item.price)}
                          />

                          <InfoField
                            label="Disponibles Item"
                            value={item.available_quantity}
                          />

                          <InfoField
                            label="Vendidos"
                            value={item.sold_quantity}
                          />

                          <InfoField
                            label="Tipo publicación"
                            value={item.listing_type_id}
                          />

                          <InfoField
                            label="Inventory ID"
                            value={item.inventory_id}
                          />

                          <InfoField
                            label="Logística"
                            value={item.logistic_type}
                          />

                          <InfoField
                            label="Envío gratis"
                            value={item.free_shipping ? "Sí" : "No"}
                          />

                          <InfoField label="Condición" value={item.condition} />
                        </Box>
                      </Paper>
                    ))}
                  </Box>
                )}
              </Box>
            )}

            {/* =============================================
                TAB STOCK
            ============================================= */}

            {tab === 2 && (
              <Box>
                <Alert severity="info" sx={{ mb: 3 }}>
                  El stock mostrado corresponde al User Product de Mercado Libre
                  y no a la suma de las publicaciones.
                </Alert>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      sm: "repeat(2, 1fr)",
                      md: "repeat(3, 1fr)",
                    },
                    gap: 3,
                    mb: 4,
                  }}
                >
                  <InfoField
                    label="Stock físico total"
                    value={stock?.total ?? 0}
                  />

                  <InfoField label="Stock mode" value={stock?.stock_mode} />

                  <InfoField
                    label="Última actualización ML"
                    value={stock?.fecha_actualizacion_ml}
                  />
                </Box>

                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                  Ubicaciones
                </Typography>

                {!stock?.ubicaciones?.length ? (
                  <Alert severity="info">
                    No hay ubicaciones de stock registradas.
                  </Alert>
                ) : (
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: {
                        xs: "1fr",
                        md: "repeat(2, 1fr)",
                      },
                      gap: 2,
                    }}
                  >
                    {stock.ubicaciones.map((ubicacion) => (
                      <Paper
                        key={ubicacion.id}
                        variant="outlined"
                        sx={{ p: 2 }}
                      >
                        <Box
                          sx={{
                            display: "grid",
                            gridTemplateColumns: "repeat(3, 1fr)",
                            gap: 2,
                          }}
                        >
                          <InfoField label="Tipo" value={ubicacion.tipo} />

                          <InfoField
                            label="Disponibilidad"
                            value={ubicacion.availability_type}
                          />

                          <InfoField
                            label="Cantidad"
                            value={ubicacion.quantity}
                          />
                        </Box>
                      </Paper>
                    ))}
                  </Box>
                )}
              </Box>
            )}

            {/* =============================================
                TAB ATRIBUTOS
            ============================================= */}

            {tab === 3 && (
              <Box>
                {/* IMÁGENES */}

                {imagenes.length > 0 && (
                  <>
                    <Typography
                      variant="subtitle1"
                      fontWeight={600}
                      sx={{ mb: 2 }}
                    >
                      Imágenes
                    </Typography>

                    <Box
                      sx={{
                        display: "flex",
                        gap: 1.5,
                        overflowX: "auto",
                        pb: 2,
                        mb: 3,
                      }}
                    >
                      {imagenes.map((imagen) => (
                        <Box
                          key={imagen.id}
                          component="img"
                          src={imagen.secure_url}
                          alt={imagen.picture_id || "Producto"}
                          sx={{
                            width: 110,
                            height: 110,
                            objectFit: "contain",
                            border: 1,
                            borderColor: "divider",
                            borderRadius: 1,
                            bgcolor: "background.paper",
                          }}
                        />
                      ))}
                    </Box>

                    <Divider sx={{ mb: 3 }} />
                  </>
                )}

                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                  Atributos del User Product
                </Typography>

                {atributos.length === 0 ? (
                  <Alert severity="info">No hay atributos registrados.</Alert>
                ) : (
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: {
                        xs: "1fr",
                        sm: "repeat(2, 1fr)",
                        md: "repeat(3, 1fr)",
                      },
                      gap: 2,
                    }}
                  >
                    {atributos.map((atributo) => (
                      <Paper key={atributo.id} variant="outlined" sx={{ p: 2 }}>
                        <Typography variant="caption" color="text.secondary">
                          {atributo.nombre}
                        </Typography>

                        <Typography
                          variant="body2"
                          fontWeight={500}
                          sx={{ mt: 0.5 }}
                        >
                          {atributo.valor_nombre ??
                            atributo.valor_numerico ??
                            "—"}

                          {atributo.unidad ? ` ${atributo.unidad}` : ""}
                        </Typography>
                      </Paper>
                    ))}
                  </Box>
                )}
              </Box>
            )}
          </>
        )}
      </DialogContent>

      {/* =================================================
          ACCIONES
      ================================================= */}

      <DialogActions sx={modalActionsSx}>
        <Button
          variant="outlined"
          sx={modalSecondaryButtonSx}
          onClick={onClose}
        >
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProductoApheliosDetalleModal;
