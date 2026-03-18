import React from "react";
import {
  Box,
  Modal,
  Typography,
  Grid,
  Divider,
  IconButton,
  Card,
  CardContent,
  Chip,
  Stack,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 820,
  maxWidth: "95vw",
  bgcolor: "background.paper",
  boxShadow: 24,
  borderRadius: 3,
  p: 4,
  maxHeight: "90vh",
  overflowY: "auto",
};

const formatFecha = (fecha) => {
  if (!fecha) return "N/A";
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return fecha;
  return d.toLocaleString("es-MX");
};

const showNA = (v) => (v === null || v === undefined || v === "" ? "N/A" : v);

const LabelValue = ({ label, value, xs = 6 }) => (
  <Grid item xs={12} md={xs}>
    <Typography variant="subtitle2" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="body1">{showNA(value)}</Typography>
  </Grid>
);

const StatusChip = ({ label }) => {
  let color = "default";

  if (label === "planeada") color = "warning";
  if (label === "recibida") color = "success";
  if (label === "surtida") color = "info";
  if (label === "cancelada") color = "error";

  return <Chip size="small" label={showNA(label)} color={color} />;
};

const DetallePedidoModal = ({ open, handleClose, detalle }) => {
  if (!open || !detalle) return null;

  const ordenesCompra = Array.isArray(detalle.ordenes_compra)
    ? detalle.ordenes_compra
    : [];

  const factura = detalle.factura || null;

  return (
    <Modal open={open} onClose={handleClose}>
      <Box sx={style}>
        <IconButton
          onClick={handleClose}
          sx={{ position: "absolute", top: 10, right: 10, color: "#666" }}
        >
          <CloseIcon />
        </IconButton>

        <Typography variant="h5" align="center" gutterBottom>
          Detalle de Pedido Línea #{showNA(detalle.pedido_linea_id)} / Pedido #
          {showNA(detalle.pedido_id)}
        </Typography>

        <Divider sx={{ mb: 2 }} />

        {/* Resumen general */}
        <Typography variant="h6" gutterBottom color="primary">
          📦 Resumen del Pedido
        </Typography>

        <Grid container spacing={2}>
          <LabelValue label="SKU componente" value={detalle.componente_sku} />
          <LabelValue label="Descripción" value={detalle.componente_desc} />
          <LabelValue
            label="Cantidad pedida"
            value={detalle.cantidad_proveedor}
          />
          <LabelValue
            label="Cantidad recibida"
            value={detalle.cantidad_recibida}
          />
          <LabelValue
            label="Backorder"
            value={detalle.back_order === 1 ? "Sí" : "No"}
          />
          <LabelValue
            label="Cantidad backorder"
            value={detalle.cantidad_backorder}
          />
          <LabelValue label="Fecha backorder" value={formatFecha(detalle.fecha_back)} />
          <LabelValue
            label="Estatus línea"
            value={<StatusChip label={detalle.pedido_linea_estatus} />}
          />
          <LabelValue
            label="Fecha pedido"
            value={formatFecha(detalle.pedido_fecha_creacion)}
          />
          <LabelValue
            label="Fecha compromiso"
            value={formatFecha(detalle.pedido_fecha_compromiso)}
          />
        </Grid>

        <Divider sx={{ my: 3 }} />

        {/* Órdenes de compra */}
        <Typography variant="h6" gutterBottom color="primary">
          📄 Órdenes de Compra relacionadas
        </Typography>

        {ordenesCompra.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No hay órdenes de compra relacionadas.
          </Typography>
        ) : (
          <Stack spacing={2}>
            {ordenesCompra.map((oc) => (
              <Card key={oc.orden_compra_detalle_id} variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                    OC Detalle #{showNA(oc.orden_compra_detalle_id)}
                  </Typography>

                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <LabelValue
                      label="Cantidad OC"
                      value={oc.orden_compra_cantidad}
                    />
                    <LabelValue
                      label="Fecha recibo"
                      value={formatFecha(oc.orden_compra_fecha_recibo)}
                    />
                    <LabelValue
                      label="Estatus OC"
                      value={<StatusChip label={oc.orden_compra_estatus} />}
                    />
                  </Grid>

                  <Divider sx={{ mb: 2 }} />

                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Producción relacionada
                  </Typography>

                  {!Array.isArray(oc.produccion) || oc.produccion.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      Esta OC no tiene líneas de producción relacionadas.
                    </Typography>
                  ) : (
                    <Stack spacing={1.5}>
                      {oc.produccion.map((prod) => (
                        <Box
                          key={prod.orden_produccion_detalle_id}
                          sx={{
                            p: 2,
                            border: "1px solid #e0e0e0",
                            borderRadius: 2,
                            bgcolor: "#fafafa",
                          }}
                        >
                          <Typography variant="subtitle2" fontWeight={700}>
                            OP #{showNA(prod.orden_produccion_id)} / OPD #
                            {showNA(prod.orden_produccion_detalle_id)}
                          </Typography>

                          <Grid container spacing={2} sx={{ mt: 0.5 }}>
                            <LabelValue
                              label="Producto ID"
                              value={prod.producto_id}
                            />
                            <LabelValue
                              label="Tipo"
                              value={prod.opd_tipo}
                            />
                            <LabelValue
                              label="Fecha asignación"
                              value={formatFecha(prod.opd_fecha_asignacion)}
                            />
                            <LabelValue
                              label="Cantidad billete"
                              value={prod.cantidad_billete}
                            />
                            <LabelValue
                              label="Cantidad contada"
                              value={prod.cantidad_contada}
                            />
                            <LabelValue
                              label="Cantidad surtida"
                              value={prod.cantidad_surtida}
                            />
                            <LabelValue
                              label="Cantidad a producir"
                              value={prod.cantidad_a_producir}
                            />
                            <LabelValue
                              label="Cantidad empacada"
                              value={prod.cantidad_empacada}
                            />
                            <LabelValue
                              label="Cantidad retiro"
                              value={prod.cantidad_retiro}
                            />
                            <LabelValue
                              label="Estatus OP"
                              value={
                                <StatusChip
                                  label={prod.orden_produccion_estatus}
                                />
                              }
                            />
                            <LabelValue
                              label="Fecha creación OP"
                              value={formatFecha(
                                prod.orden_produccion_fecha_creacion
                              )}
                            />
                            <LabelValue
                              label="Fecha finalización"
                              value={formatFecha(prod.fecha_finalizacion)}
                            />
                          </Grid>
                        </Box>
                      ))}
                    </Stack>
                  )}
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}

        <Divider sx={{ my: 3 }} />

        {/* Factura */}
        <Typography variant="h6" gutterBottom color="primary">
          🧾 Factura asociada
        </Typography>

        {!factura ? (
          <Typography variant="body2" color="text.secondary">
            No hay factura asociada.
          </Typography>
        ) : (
          <Grid container spacing={2}>
            <LabelValue label="Factura ID" value={factura.factura_id} />
            <LabelValue
              label="Factura detalle ID"
              value={factura.factura_detalle_id}
            />
            <LabelValue
              label="Serie / Folio"
              value={
                factura.serie || factura.folio
                  ? `${factura.serie ?? ""} ${factura.folio ?? ""}`.trim()
                  : "N/A"
              }
            />
            <LabelValue
              label="Número factura"
              value={factura.numero_factura}
            />
            <LabelValue
              label="Fecha factura"
              value={formatFecha(factura.fecha_factura)}
            />
            <LabelValue
              label="Fecha arribo"
              value={formatFecha(factura.fecha_arribo)}
            />
            <LabelValue
              label="Estatus factura"
              value={<StatusChip label={factura.factura_estatus} />}
            />
            <LabelValue label="SKU factura" value={factura.factura_sku} />
            <LabelValue
              label="Cantidad factura"
              value={factura.factura_cantidad}
            />
            <LabelValue
              label="Precio detalle"
              value={factura.factura_precio}
            />
            <LabelValue
              label="Total detalle"
              value={factura.factura_total_detalle}
            />
            <LabelValue
              label="Precio Aphelios"
              value={factura.precio_aphelios}
            />
            <LabelValue label="UUID CFDI" value={factura.uuid_cfdi} xs={12} />
          </Grid>
        )}
      </Box>
    </Modal>
  );
};

export default DetallePedidoModal;