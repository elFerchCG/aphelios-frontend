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

const FormulaCard = ({ titulo, descripcion, formula }) => (
  <Box
    sx={{
      p: 1.5,
      border: "1px solid #e0e0e0",
      borderRadius: 2,
      backgroundColor: "#fff",
    }}
  >
    <Typography fontWeight="bold">{titulo}</Typography>

    <Typography variant="body2" color="text.secondary" mt={0.5}>
      {descripcion}
    </Typography>

    <Box
      sx={{
        mt: 1,
        p: 1,
        borderRadius: 1,
        backgroundColor: "#f5f5f5",
        fontFamily: "monospace",
        fontSize: 13,
      }}
    >
      {formula}
    </Box>
  </Box>
);

const PerformanceInfoDialog = ({ open, onClose }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle fontWeight="bold">
        ¿Cómo se calculan los indicadores?
      </DialogTitle>

      <DialogContent>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Este reporte compara las proyecciones semanales del MRP contra las
          ventas reales de Mercado Libre.
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 1.5,
          }}
        >
          <FormulaCard
            titulo="Venta Bruta"
            descripcion="Importe original de las ventas antes de descuentos."
            formula="Σ(total_amount)"
          />

          <FormulaCard
            titulo="Venta Pagada"
            descripcion="Importe realmente recibido por la venta."
            formula="Σ(paid_amount)"
          />

          <FormulaCard
            titulo="Comisiones"
            descripcion="Comisiones cobradas por Mercado Libre."
            formula="Σ(sale_fee)"
          />

          <FormulaCard
            titulo="Envíos"
            descripcion="Costo de envío registrado en la venta."
            formula="Σ(shipping_cost)"
          />

          <FormulaCard
            titulo="Costo Unitario"
            descripcion="Costo real del producto según componentes. Si falta costo en algún componente, se usa el costo de la publicación."
            formula="Σ(cantidad componente × último costo)"
          />

          <FormulaCard
            titulo="Costo Total"
            descripcion="Costo de las unidades realmente vendidas."
            formula="Ventas reales × costo unitario"
          />

          <FormulaCard
            titulo="Ganancia Real"
            descripcion="Utilidad aproximada después de comisiones, envíos y costo."
            formula="Venta pagada - comisiones - envíos - costo total"
          />

          <FormulaCard
            titulo="Cumplimiento"
            descripcion="Porcentaje de cumplimiento contra la proyección semanal."
            formula="(Ventas reales / proyección) × 100"
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        <Typography fontWeight="bold" mb={1}>
          Detalle MRP
        </Typography>

        <Typography variant="body2" color="text.secondary">
          El botón <strong>VER</strong> muestra el contexto MRP usado para la
          proyección: pronóstico, pendiente, seguridad, punto de reorden, máximo,
          stocks, pedido, pedido final, retiro y excedente.
        </Typography>

        <Divider sx={{ my: 2 }} />

        <Typography fontWeight="bold" mb={1}>
          Fuentes de información
        </Typography>

        <Typography variant="body2" color="text.secondary">
          Ventas: <strong>ventas_completas</strong> · Proyección:{" "}
          <strong>ventas_tendencia</strong> · MRP histórico:{" "}
          <strong>proyeccion_mrp_semanal_detalle</strong> · Costos:{" "}
          <strong>componentes.ultimo_costo</strong> · Respaldo:{" "}
          <strong>publicaciones.costo</strong>
        </Typography>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
};

export default PerformanceInfoDialog;