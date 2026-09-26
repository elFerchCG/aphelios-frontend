import React from "react";

import {
  Avatar,
  Box,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Paper,
  Tooltip,
  Typography,
  Button,
} from "@mui/material";

import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";

import {
  modalTitleSx,
  modalContentSx,
  modalActionsSx,
  modalSecondaryButtonSx,
} from "../../../common/modalStyles";

const formatMoney = (value) => {
  if (value === null || value === undefined) {
    return "—";
  }

  return `$${Number(value).toLocaleString("es-MX", {
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

const SeleccionarPublicacionModal = ({ open, onClose, producto }) => {
  const mercadoLibre = producto?.mercado_libre;

  const items = mercadoLibre?.items || [];

  const handleAbrirPublicacion = (item) => {
    if (!item?.permalink) {
      return;
    }

    window.open(item.permalink, "_blank", "noopener,noreferrer");
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={modalTitleSx}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
          }}
        >
          <StorefrontOutlinedIcon color="primary" />

          <Box>
            <Typography variant="h6" fontWeight={600}>
              Seleccionar publicación
            </Typography>

            <Typography variant="body2" color="text.secondary">
              {producto?.sku || "Producto"}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent
        sx={{
          ...modalContentSx,
          paddingTop: "20px !important",
        }}
      >
        {/* =====================================================
      INFORMACIÓN DEL PRODUCTO
  ====================================================== */}

        <Box sx={{ mb: 3 }}>
          <Typography variant="body1" fontWeight={500}>
            {producto?.nombre || "Producto"}
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {mercadoLibre?.user_product_id}
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
            Este producto tiene {items.length} publicaciones. Selecciona cuál
            deseas abrir en Mercado Libre.
          </Typography>
        </Box>

        {/* =====================================================
      PUBLICACIONES
  ====================================================== */}

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          {items.map((item) => (
            <Paper
              key={item.id || item.item_id}
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: 2,

                transition: "border-color 0.15s ease, box-shadow 0.15s ease",

                "&:hover": {
                  borderColor: "primary.main",
                  boxShadow: 1,
                },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                {/* IMAGEN */}

                <Avatar
                  src={item.thumbnail_url || mercadoLibre?.thumbnail_url}
                  variant="rounded"
                  sx={{
                    width: 72,
                    height: 72,
                    flexShrink: 0,
                  }}
                />

                {/* INFORMACIÓN */}

                <Box
                  sx={{
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      flexWrap: "wrap",
                    }}
                  >
                    <Typography fontWeight={600}>{item.item_id}</Typography>

                    <Chip
                      label={getStatusLabel(item.status)}
                      color={getStatusColor(item.status)}
                      size="small"
                      variant="outlined"
                    />
                  </Box>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    noWrap
                    sx={{ mt: 0.5 }}
                  >
                    {item.title || "Sin título"}
                  </Typography>

                  <Typography variant="body2" fontWeight={600} sx={{ mt: 1 }}>
                    {formatMoney(item.price)}
                  </Typography>
                </Box>

                {/* SEPARADOR */}

                <Divider orientation="vertical" flexItem />

                {/* ABRIR MERCADO LIBRE */}

                <Tooltip title="Abrir en Mercado Libre">
                  <IconButton
                    color="primary"
                    onClick={() => handleAbrirPublicacion(item)}
                  >
                    <OpenInNewOutlinedIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Paper>
          ))}
        </Box>
      </DialogContent>

      <DialogActions sx={modalActionsSx}>
        <Button
          variant="outlined"
          onClick={onClose}
          sx={modalSecondaryButtonSx}
        >
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SeleccionarPublicacionModal;
