import React, { useEffect, useMemo, useState } from "react";

import {
  Autocomplete,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Paper,
  TextField,
  Typography,
} from "@mui/material";

import {
  modalTitleSx,
  modalContentSx,
  modalActionsSx,
  modalPrimaryButtonSx,
  modalSecondaryButtonSx,
} from "../../../common/modalStyles";

const statusChip = (status) => {
  const s = String(status || "").toLowerCase();

  if (s === "active") {
    return (
      <Chip
        size="small"
        label="Activo"
        color="success"
        variant="outlined"
      />
    );
  }

  if (s === "paused") {
    return (
      <Chip
        size="small"
        label="Pausado"
        color="warning"
        variant="outlined"
      />
    );
  }

  return (
    <Chip
      size="small"
      label={status || "Sin status"}
      variant="outlined"
    />
  );
};

/**
 * Props:
 * - open: boolean
 * - sku: string
 * - productos: array [{ producto_id, title, status }]
 * - onClose: () => void
 * - onConfirm: (productoId: number) => void
 */
export default function InsercionManual({
  open,
  sku = "",
  productos = [],
  onClose,
  onConfirm,
}) {
  const [productoSel, setProductoSel] = useState(null);

  // =====================================================
  // RESET
  // =====================================================
  useEffect(() => {
    if (!open) {
      setProductoSel(null);
    }
  }, [open]);

  // =====================================================
  // ORDENAR PRODUCTOS
  //
  // Activos primero.
  // Después, producto_id descendente.
  // =====================================================
  const productosOrdenados = useMemo(() => {
    const arr = Array.isArray(productos)
      ? [...productos]
      : [];

    arr.sort((a, b) => {
      const aAct =
        String(a?.status || "").toLowerCase() === "active"
          ? 1
          : 0;

      const bAct =
        String(b?.status || "").toLowerCase() === "active"
          ? 1
          : 0;

      if (aAct !== bAct) {
        return bAct - aAct;
      }

      return (
        Number(b?.producto_id || 0) -
        Number(a?.producto_id || 0)
      );
    });

    return arr;
  }, [productos]);

  // =====================================================
  // CONFIRMAR
  // =====================================================
  const handleConfirm = () => {
    if (!productoSel) return;

    onConfirm?.(
      Number(productoSel.producto_id),
    );
  };

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
      <DialogTitle sx={modalTitleSx}>
        Seleccionar producto

        {sku && (
          <Typography
            variant="body2"
            sx={{
              mt: 0.5,
              color: "text.secondary",
              fontWeight: 400,
            }}
          >
            SKU del componente:{" "}
            <Box
              component="span"
              sx={{
                fontWeight: 700,
                color: "text.primary",
              }}
            >
              {sku}
            </Box>
          </Typography>
        )}
      </DialogTitle>

      {/* =================================================
          CONTENT
      ================================================= */}
      <DialogContent sx={modalContentSx}>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 2 }}
        >
          Este componente pertenece a más de una publicación.
          Selecciona el producto al que deseas asociar la
          inserción manual.
        </Typography>

        {/* =================================================
            AUTOCOMPLETE
        ================================================= */}
        <Autocomplete
          options={productosOrdenados}
          value={productoSel}
          onChange={(event, value) => {
            setProductoSel(value);
          }}
          getOptionLabel={(option) => {
            if (!option) return "";

            return `#${option.producto_id} - ${
              option.title || "Sin título"
            }`;
          }}
          isOptionEqualToValue={(option, value) =>
            Number(option?.producto_id) ===
            Number(value?.producto_id)
          }
          noOptionsText="No se encontraron productos"
          renderInput={(params) => (
            <TextField
              {...params}
              label="Buscar producto"
              placeholder="Escribe el título o ID del producto"
              fullWidth
            />
          )}
          renderOption={(props, option) => (
            <Box
              component="li"
              {...props}
              key={option.producto_id}
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start !important",
                gap: 0.5,
                py: 1.25,
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
                <Typography
                  variant="body2"
                  fontWeight={700}
                >
                  Producto #{option.producto_id}
                </Typography>

                {statusChip(option.status)}
              </Box>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
                title={option.title || ""}
              >
                {option.title || "Sin título"}
              </Typography>
            </Box>
          )}
        />

        <Divider sx={{ my: 2.5 }} />

        {/* =================================================
            PRODUCTO SELECCIONADO
        ================================================= */}
        <Typography
          variant="subtitle2"
          sx={{ mb: 1 }}
        >
          Producto seleccionado
        </Typography>

        {!productoSel ? (
          <Paper
            variant="outlined"
            sx={{
              borderRadius: 2,
              p: 2,
              textAlign: "center",
            }}
          >
            <Typography
              variant="body2"
              color="text.secondary"
            >
              Selecciona un producto para ver el detalle.
            </Typography>
          </Paper>
        ) : (
          <Paper
            variant="outlined"
            sx={{
              borderRadius: 2,
              p: 2,
              borderColor: "primary.main",
              borderWidth: 2,
              bgcolor: "action.hover",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                flexWrap: "wrap",
                mb: 0.75,
              }}
            >
              <Typography
                variant="body1"
                fontWeight={700}
              >
                Producto #{productoSel.producto_id}
              </Typography>

              {statusChip(productoSel.status)}
            </Box>

            <Typography
              variant="body2"
              color="text.secondary"
            >
              {productoSel.title || "Sin título"}
            </Typography>
          </Paper>
        )}
      </DialogContent>

      {/* =================================================
          ACTIONS
      ================================================= */}
      <DialogActions sx={modalActionsSx}>
        <Button
          variant="outlined"
          sx={modalSecondaryButtonSx}
          onClick={onClose}
        >
          Cancelar
        </Button>

        <Button
          variant="contained"
          sx={modalPrimaryButtonSx}
          disabled={!productoSel}
          onClick={handleConfirm}
        >
          Continuar
        </Button>
      </DialogActions>
    </Dialog>
  );
}