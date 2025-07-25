import React from "react";
import {
  Box,
  Modal,
  Typography,
  Grid,
  Divider,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 650,
  bgcolor: "background.paper",
  boxShadow: 24,
  borderRadius: 3,
  p: 4,
  maxHeight: "90vh",
  overflowY: "auto",
};

const formatFecha = (fecha) =>
  fecha ? new Date(fecha).toLocaleDateString() : "Sin fecha";

const LabelValue = ({ label, value }) => (
  <Grid item xs={6}>
    <Typography variant="subtitle2" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="body1">{value}</Typography>
  </Grid>
);

const DetallePedidoModal = ({ open, handleClose, detalle }) => {
  if (!detalle) return null;

  return (
    <Modal open={open} onClose={() => {}} disableEscapeKeyDown>
      <Box sx={style}>
        <IconButton
          onClick={handleClose}
          sx={{ position: "absolute", top: 10, right: 10, color: "#666" }}
        >
          <CloseIcon />
        </IconButton>

        <Typography variant="h5" align="center" gutterBottom>
          Detalles del Pedido Línea #{detalle.pedido_linea_id} / Pedido #{detalle.pedido_id}
        </Typography>

        <Divider sx={{ mb: 2 }} />

        {/* Resumen del Pedido */}
        <Typography variant="h6" gutterBottom color="primary">
          📦 Resumen del Pedido
        </Typography>
        <Grid container spacing={2}>
          <LabelValue label="Producto:" value={detalle.componente_desc} />
          <LabelValue label="Cantidad Pedida:" value={detalle.cantidad_proveedor} />
          <LabelValue label="Cantidad Recibida:" value={detalle.cantidad_recibida} />
          <LabelValue label="Backorder:" value={detalle.back_order === 1 ? "Sí" : "No"} />
          <LabelValue label="Cantidad Backorder:" value={detalle.cantidad_backorder} />
          <LabelValue label="Fecha Backorder:" value={formatFecha(detalle.fecha_back)} />
          <LabelValue label="Fecha Pedido:" value={formatFecha(detalle.pedido_fecha_creacion)} />
          <LabelValue label="Fecha Compromiso:" value={formatFecha(detalle.pedido_fecha_compromiso)} />
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* Orden de Compra */}
        <Typography variant="h6" gutterBottom color="primary">
          📄 Orden de Compra
        </Typography>
        <Grid container spacing={2}>
          <LabelValue label="ID OC Detalle:" value={detalle.orden_compra_detalle_id || "N/A"} />
          <LabelValue label="Cantidad OC:" value={detalle.orden_compra_cantidad || "N/A"} />
          <LabelValue label="Fecha Recibo OC:" value={formatFecha(detalle.orden_compra_fecha_recibo)} />
          <LabelValue label="Estatus OC:" value={detalle.orden_compra_estatus || "N/A"} />
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* Orden de Producción */}
        <Typography variant="h6" gutterBottom color="primary">
          🏭 Orden de Producción
        </Typography>
        <Grid container spacing={2}>
          <LabelValue label="ID Orden Producción:" value={detalle.orden_produccion_id || "N/A"} />
          <LabelValue label="Tipo:" value={detalle.tipo || "N/A"} />
          <LabelValue label="Fecha Asignación:" value={formatFecha(detalle.fecha_asignacion)} />
          <LabelValue label="Cantidad Billete:" value={detalle.cantidad_billete} />
          <LabelValue label="Cantidad Contada:" value={detalle.cantidad_contada} />
          <LabelValue label="Cantidad Surtida:" value={detalle.cantidad_surtida} />
          <LabelValue label="Cantidad a Producir:" value={detalle.cantidad_a_producir} />
          <LabelValue label="Cantidad Empacada:" value={detalle.cantidad_empacada} />
          <LabelValue label="Cantidad Retiro:" value={detalle.cantidad_retiro} />
          <LabelValue label="Fecha Creación:" value={formatFecha(detalle.orden_produccion_fecha_creacion)} />
          <LabelValue label="Fecha Finalización:" value={formatFecha(detalle.fecha_finalizacion)} />
        </Grid>
      </Box>
    </Modal>
  );
};

export default DetallePedidoModal;
