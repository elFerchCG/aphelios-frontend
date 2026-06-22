import React from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Typography,
} from "@mui/material";

const PerformanceMrpDialog = ({ open, onClose, detalle }) => {
  const formatoMoneda = (valor) =>
    Number(valor || 0).toLocaleString("es-MX", {
      style: "currency",
      currency: "MXN",
    });

  if (!detalle) return null;

  const detalleItems = [
    ["Pronóstico semana", detalle.pronostico_semana],
    ["Pendiente semana", detalle.pendiente_semana],
    ["Seguridad", detalle.seguridad],
    ["Punto reorden", detalle.punto_reorden],
    ["Máximo", detalle.maximo],
    ["Stock total proyección", detalle.stock_total_proyeccion],
    ["Stock físico", detalle.stock_fisico_proyeccion],
    ["Stock Mercado Libre", detalle.stock_mercado_libre_proyeccion],
    ["Stock en camino", detalle.stock_en_camino],
    ["Stock pendiente pedido", detalle.stock_pendiente_pedido],
    ["Pedido", detalle.pedido],
    ["Pedido final", detalle.pedido_final],
    ["Retiro", detalle.retiro],
    ["Excedente", detalle.excedente],
    ["Total MXN proyección", formatoMoneda(detalle.total_mxn_proyeccion)],
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle fontWeight="bold">Detalle MRP de la proyección</DialogTitle>

      <DialogContent>
        <Box
          sx={{
            p: 2,
            mb: 2,
            border: "1px solid #e0e0e0",
            borderRadius: 2,
            backgroundColor: "#fafafa",
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Producto
          </Typography>

          <Typography fontWeight="bold">{detalle.title}</Typography>

          <Typography variant="body2" color="text.secondary" mt={0.5}>
            SKU: {detalle.sku} · Semana {detalle.semana} · {detalle.proveedor}
          </Typography>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 1.5,
          }}
        >
          {detalleItems.map(([label, value]) => (
            <Box
              key={label}
              sx={{
                p: 1.5,
                border: "1px solid #e0e0e0",
                borderRadius: 2,
                backgroundColor: "#fff",
              }}
            >
              <Typography variant="caption" color="text.secondary">
                {label}
              </Typography>

              <Typography fontWeight="bold">{value ?? 0}</Typography>
            </Box>
          ))}
        </Box>

        <Divider sx={{ my: 2 }} />

        <Typography variant="body2" color="text.secondary">
          Estos datos representan el contexto MRP usado durante la proyección:
          seguridad, punto de reorden, stock disponible, stock pendiente, pedido
          sugerido y pedido final.
        </Typography>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
};

export default PerformanceMrpDialog;