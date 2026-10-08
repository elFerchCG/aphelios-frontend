import React, { useEffect, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import InsightsOutlinedIcon from "@mui/icons-material/InsightsOutlined";
import ScienceOutlinedIcon from "@mui/icons-material/ScienceOutlined";

// =====================================================================
// Diálogo "Generar pedidos".
// Ventas: siempre las últimas 5 semanas completas (lunes a domingo, sin
// la semana en curso) que deja calculadas el proceso de la 1:00 am en
// ventas_tendencia. El pedido ya no recalcula tendencias (las opciones de
// rango personalizado y últimos 35 días se dejaron de usar porque
// recalcular en horario laboral alentaba los demás procesos).
// Solo se elige si es una simulación.
// =====================================================================

export const MODOS_VENTAS = {
  SEMANAS_COMPLETAS: "SEMANAS_COMPLETAS",
};

const fmt = (f) => (f ? dayjs(f).format("DD/MM/YYYY") : "—");

const getAuthHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

export default function GenerarPedidoDialog({ open, onClose, onConfirm, apiUrl, proveedor, backorder }) {
  const [simulacion, setSimulacion] = useState(false);
  const [ventana, setVentana] = useState(null);

  // Al abrir: reinicia y trae las fechas de las 5 semanas (solo informativo).
  useEffect(() => {
    if (!open) return;
    setSimulacion(false);
    let cancel = false;
    (async () => {
      try {
        const { data } = await axios.get(`${apiUrl}/mrp/ventana-ventas`, {
          ...getAuthHeaders(),
          params: { modo: MODOS_VENTAS.SEMANAS_COMPLETAS },
        });
        if (!cancel) setVentana(data?.ventana || null);
      } catch (e) {
        if (!cancel) setVentana(null);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [open, apiUrl]);

  const confirmar = () => {
    onConfirm({
      modo_ventas: MODOS_VENTAS.SEMANAS_COMPLETAS,
      simulacion,
      descripcion: ventana?.descripcion || null,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="subtitle1" component="div" sx={{ display: "flex", alignItems: "center", gap: 1, fontWeight: 700, flexWrap: "wrap" }}>
          <ShoppingCartOutlinedIcon color="primary" /> Generar pedido
          {proveedor && (
            <Chip size="small" label={proveedor} sx={{ fontWeight: 700, bgcolor: "#e3f2fd", color: "primary.main" }} />
          )}
        </Typography>
        <Typography variant="caption" sx={{ color: "text.secondary", display: "block", ml: 4 }}>
          Backorder: {backorder ? "Sí (se mantienen los pendientes abiertos)" : "No (se cierran los pendientes antes de generar)"}
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2.5}>
          <Box>
            <Typography variant="subtitle2" sx={{ display: "flex", alignItems: "center", gap: 1, fontWeight: 700, mb: 1 }}>
              <InsightsOutlinedIcon color="primary" fontSize="small" /> Ventas consideradas
            </Typography>
            <Alert severity="info" variant="outlined">
              Últimas 5 semanas completas de lunes a domingo, sin contar la semana en curso
              {ventana ? (
                <>
                  : <strong>del {fmt(ventana.fechaInicio)} al {fmt(ventana.fechaFin)}</strong>
                </>
              ) : null}
              . Se usa la tendencia que calcula el proceso de la 1:00 am.
            </Alert>
          </Box>

          <Box>
            <FormControlLabel
              control={<Switch checked={simulacion} onChange={(e) => setSimulacion(e.target.checked)} color="warning" />}
              label={
                <Typography variant="body2" sx={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 1 }}>
                  <ScienceOutlinedIcon fontSize="small" color={simulacion ? "warning" : "action"} /> Modo simulación
                </Typography>
              }
            />
            {simulacion && (
              <Alert severity="warning" variant="outlined" sx={{ mt: 1 }}>
                Se ejecuta el pedido completo para calcular la orden de compra, se genera el Excel y se guarda en S3
                (lo puedes descargar al terminar o después desde <strong>Procesos → Archivos MRP</strong>). Al final{" "}
                <strong>se revierte todo</strong>: no se crean pedidos, líneas de pedido, órdenes de compra ni órdenes de
                producción, no se cierran pendientes y los cálculos del MRP quedan como estaban.
              </Alert>
            )}
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 1.5 }}>
        <Button onClick={onClose} sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          color={simulacion ? "warning" : "primary"}
          onClick={confirmar}
          startIcon={simulacion ? <ScienceOutlinedIcon /> : <ShoppingCartOutlinedIcon />}
          sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
        >
          {simulacion ? "Ejecutar simulación" : "Generar pedido"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
