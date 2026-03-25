import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Divider,
  Tooltip,
  Alert,
} from "@mui/material";

const BackorderResetModal = ({
  open,
  onClose,
  onConfirm,
  previewData = null,
  loading = false,
}) => {
  const asignaciones = previewData?.asignaciones_a_borrar || [];
  const opsBloqueadas = previewData?.ops_bloqueadas || [];
  const parentId = previewData?.parent_id || null;
  const familiaIds = previewData?.familia_ids || [];
  const facturaDetalleIds = previewData?.factura_detalle_ids_afectados || [];

  const hayBloqueadas = opsBloqueadas.length > 0;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>Reset masivo de backorder</DialogTitle>

      <DialogContent dividers>
        <Typography gutterBottom>
          Este proceso revertirá todas las asignaciones de tipo <b>backorder</b>
          relacionadas con la línea/familia seleccionada.
        </Typography>

        <Typography gutterBottom>
          Ya no se eliminarán hijas ni cadenas. Ahora el reset trabaja sobre las{" "}
          <b>asignaciones reales</b> registradas en factura.
        </Typography>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2">
            <b>Línea base:</b> {parentId || "—"}
          </Typography>
          <Typography variant="body2">
            <b>Líneas de la familia:</b>{" "}
            {familiaIds.length ? familiaIds.join(", ") : "—"}
          </Typography>
          <Typography variant="body2">
            <b>Facturas detalle afectadas:</b>{" "}
            {facturaDetalleIds.length ? facturaDetalleIds.join(", ") : "—"}
          </Typography>
          <Typography variant="body2">
            <b>Asignaciones a revertir:</b> {asignaciones.length}
          </Typography>
        </Box>

        {hayBloqueadas && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Hay órdenes de producción bloqueadas en estatus <b>surtida</b> o{" "}
            <b>empacada</b>. No se puede ejecutar el reset mientras existan esas
            órdenes.
          </Alert>
        )}

        {!hayBloqueadas && asignaciones.length === 0 && (
          <Alert severity="info" sx={{ mb: 2 }}>
            No hay asignaciones de backorder para revertir.
          </Alert>
        )}

        {opsBloqueadas.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Órdenes bloqueadas
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {opsBloqueadas.map((row) => (
                <Box
                  key={`${row.op_detalle_id}-${row.orden_id}`}
                  sx={{
                    p: 1.5,
                    border: "1px solid rgba(211,47,47,0.25)",
                    borderRadius: 1.5,
                    backgroundColor: "rgba(211,47,47,0.04)",
                  }}
                >
                  <Typography variant="body2">
                    <b>OPD:</b> {row.op_detalle_id} · <b>OP:</b> {row.orden_id} ·{" "}
                    <b>Producto:</b> {row.producto_id || "—"}
                  </Typography>
                  <Typography variant="caption" color="error">
                    Estatus bloqueante: <b>{row.estatus}</b>
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {asignaciones.length > 0 && (
          <>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Asignaciones que se revertirán
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {asignaciones.map((row, idx) => (
                <Tooltip
                  key={row.factura_detalle_asignacion_id || idx}
                  title="Asignación backorder"
                  placement="top"
                >
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 1.5,
                      border: "1px solid rgba(0,0,0,0.12)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: 2,
                    }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2">
                        <b>Asignación:</b>{" "}
                        {row.factura_detalle_asignacion_id || "—"}
                      </Typography>

                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block" }}
                      >
                        Factura detalle: <b>{row.factura_detalle_id}</b> · Línea:{" "}
                        <b>{row.pedido_linea_id}</b>
                      </Typography>

                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block" }}
                      >
                        OC: <b>{row.orden_compra_detalle_id || "—"}</b> · OPD:{" "}
                        <b>{row.op_detalle_id || "—"}</b>
                      </Typography>

                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block" }}
                      >
                        Cantidad asignada: <b>{row.cantidad_asignada}</b>
                      </Typography>
                    </Box>

                    <Chip
                      label="Backorder"
                      size="small"
                      color="warning"
                      variant="filled"
                    />
                  </Box>
                </Tooltip>
              ))}
            </Box>
          </>
        )}

        <Typography sx={{ mt: 3 }} variant="body2">
          <b>¿Qué hará este reset?</b>
          <br />• Revertirá las asignaciones backorder encontradas.
          <br />• Restará cantidades facturadas en OC y OPD.
          <br />• Recalculará línea, factura y órdenes relacionadas.
          <br />• <b>No eliminará hijas ni estructuras físicas</b>.
        </Typography>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancelar
        </Button>

        <Button
          onClick={onConfirm}
          color="error"
          variant="contained"
          disabled={loading || hayBloqueadas || asignaciones.length === 0}
        >
          Confirmar reset masivo
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BackorderResetModal;