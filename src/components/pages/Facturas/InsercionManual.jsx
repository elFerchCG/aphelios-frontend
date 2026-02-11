import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  TextField,
  Divider,
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";

const statusChip = (status) => {
  const s = (status || "").toLowerCase();
  if (s === "active") return <Chip size="small" label="Activo" />;
  if (s === "paused") return <Chip size="small" label="Pausado" />;
  return <Chip size="small" label={status || "Sin status"} />;
};

/**
 * Props:
 * - open: boolean
 * - sku: string
 * - productos: array [{producto_id, title, status}]
 * - onClose: () => void
 * - onConfirm: (productoId:number) => void  // el main hace el POST
 */
export default function InsercionManual({
  open,
  sku = "",
  productos = [],
  onClose,
  onConfirm,
}) {
  const [productoSel, setProductoSel] = useState(null);

  // reset al abrir/cerrar
  useEffect(() => {
    if (!open) setProductoSel(null);
  }, [open]);

  const productosOrdenados = useMemo(() => {
    const arr = Array.isArray(productos) ? [...productos] : [];
    arr.sort((a, b) => {
      const aAct = a?.status === "active" ? 1 : 0;
      const bAct = b?.status === "active" ? 1 : 0;
      if (aAct !== bAct) return bAct - aAct;
      return Number(b?.producto_id || 0) - Number(a?.producto_id || 0);
    });
    return arr;
  }, [productos]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ fontWeight: 800 }}>
        Selecciona el producto destino
        {sku ? (
          <Typography variant="body2" sx={{ mt: 0.5, color: "text.secondary" }}>
            SKU: <b>{sku}</b>
          </Typography>
        ) : null}
      </DialogTitle>

      <DialogContent>
        <Autocomplete
          options={productosOrdenados}
          value={productoSel}
          onChange={(e, v) => setProductoSel(v)}
          getOptionLabel={(o) =>
            o ? `#${o.producto_id} - ${o.title || ""}` : ""
          }
          isOptionEqualToValue={(a, b) =>
            a?.producto_id === b?.producto_id
          }
          renderInput={(params) => (
            <TextField
              {...params}
              label="Buscar producto"
              placeholder="Escribe parte del título o el ID"
            />
          )}
          renderOption={(props, option) => (
            <Box
              component="li"
              {...props}
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 0.5,
                py: 1,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography sx={{ fontWeight: 700 }}>
                  Producto #{option.producto_id}
                </Typography>
                {statusChip(option.status)}
              </Box>

              <Typography
                variant="body2"
                sx={{
                  color: "text.secondary",
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
          sx={{ mt: 1 }}
        />

        <Divider sx={{ my: 2 }} />

        {/* Preview */}
        <Box
          sx={{
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
            p: 2,
            backgroundColor: "action.hover",
            minHeight: 76,
          }}
        >
          {!productoSel ? (
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Selecciona un producto para ver el detalle.
            </Typography>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography sx={{ fontWeight: 800 }}>
                  Producto #{productoSel.producto_id}
                </Typography>
                {statusChip(productoSel.status)}
              </Box>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                {productoSel.title || "Sin título"}
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined">
          Cancelar
        </Button>

        <Button
          variant="contained"
          disabled={!productoSel}
          onClick={() => onConfirm?.(Number(productoSel.producto_id))}
        >
          Continuar
        </Button>
      </DialogActions>
    </Dialog>
  );
}