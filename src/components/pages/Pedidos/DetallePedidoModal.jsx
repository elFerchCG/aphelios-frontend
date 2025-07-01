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

const DetallePedidoModal = ({ open, handleClose, detalle }) => {
  if (!detalle) return null;

  return (
    <Modal open={open} onClose={() => {}} disableEscapeKeyDown>
      <Box sx={style}>
        <IconButton
          onClick={handleClose}
          sx={{
            position: "absolute",
            top: 10,
            right: 10,
            color: "#666",
          }}
        >
          <CloseIcon />
        </IconButton>

        <Typography variant="h5" align="center" gutterBottom>
          Detalles del Pedido Línea #{detalle.pedido_linea_id} / Pedido #
          {detalle.pedido_id}
        </Typography>

        <Divider sx={{ mb: 2 }} />

        <Typography variant="h6" gutterBottom>
          📦 Resumen del Pedido
        </Typography>
        <Grid container spacing={1}>
          <Grid item xs={6}>
            <b>Producto:</b> {detalle.componente_desc}
          </Grid>
          <Grid item xs={6}>
            <b>Cantidad Pedida:</b> {detalle.cantidad_proveedor}
          </Grid>
          <Grid item xs={6}>
            <b>Cantidad Recibida:</b> {detalle.cantidad_recibida}
          </Grid>
          <Grid item xs={6}>
            <b>Backorder:</b> {detalle.back_order === 1 ? "Sí" : "No"}
          </Grid>
          <Grid item xs={6}>
            <b>Cantidad Backorder:</b> {detalle.cantidad_backorder}
          </Grid>
          <Grid item xs={6}>
            <b>Fecha Backorder:</b> {formatFecha(detalle.fecha_back)}
          </Grid>
          <Grid item xs={6}>
            <b>Fecha Pedido:</b> {formatFecha(detalle.pedido_fecha_creacion)}
          </Grid>
          <Grid item xs={6}>
            <b>Fecha Compromiso:</b>{" "}
            {formatFecha(detalle.pedido_fecha_compromiso)}
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        <Typography variant="h6" gutterBottom>
          📄 Orden de Compra
        </Typography>
        <Grid container spacing={1}>
          <Grid item xs={6}>
            <b>ID OC Detalle:</b> {detalle.orden_compra_detalle_id || "N/A"}
          </Grid>
          <Grid item xs={6}>
            <b>Cantidad OC:</b> {detalle.orden_compra_cantidad || "N/A"}
          </Grid>
          <Grid item xs={6}>
            <b>Fecha Recibo OC:</b>{" "}
            {formatFecha(detalle.orden_compra_fecha_recibo)}
          </Grid>
          <Grid item xs={6}>
            <b>Estatus OC:</b> {detalle.orden_compra_estatus || "N/A"}
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        <Typography variant="h6" gutterBottom>
          🏭 Orden de Producción
        </Typography>
        <Grid container spacing={1}>
          <Grid item xs={6}>
            <b>ID Orden Producción:</b> {detalle.orden_produccion_id || "N/A"}
          </Grid>
          <Grid item xs={6}>
            <b>Tipo:</b> {detalle.tipo || "N/A"}
          </Grid>
          <Grid item xs={6}>
            <b>Fecha Asignación:</b> {formatFecha(detalle.fecha_asignacion)}
          </Grid>
          <Grid item xs={6}>
            <b>Cantidad Billete:</b> {detalle.cantidad_billete}
          </Grid>
          <Grid item xs={6}>
            <b>Cantidad Contada:</b> {detalle.cantidad_contada}
          </Grid>
          <Grid item xs={6}>
            <b>Cantidad Surtida:</b> {detalle.cantidad_surtida}
          </Grid>
          <Grid item xs={6}>
            <b>Cantidad a Producir:</b> {detalle.cantidad_a_producir}
          </Grid>
          <Grid item xs={6}>
            <b>Cantidad Empacada:</b> {detalle.cantidad_empacada}
          </Grid>
          <Grid item xs={6}>
            <b>Cantidad Retiro:</b> {detalle.cantidad_retiro}
          </Grid>
          <Grid item xs={6}>
            <b>Fecha Creación:</b>{" "}
            {formatFecha(detalle.orden_produccion_fecha_creacion)}
          </Grid>
          <Grid item xs={6}>
            <b>Fecha Finalización:</b> {formatFecha(detalle.fecha_finalizacion)}
          </Grid>
        </Grid>
      </Box>
    </Modal>
  );
};

export default DetallePedidoModal;
