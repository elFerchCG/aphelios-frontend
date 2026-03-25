import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Alert,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import LinkOffIcon from "@mui/icons-material/LinkOff";

const BackordersPreviewModal = ({
  open,
  onClose,
  previewData,
  onUnlinkSingle,
  onResetAll,
  loadingSingle = false,
  loadingReset = false,
}) => {
  const lineaBase = previewData?.linea_base || null;
  const asignaciones = previewData?.asignaciones || [];
  const opsBloqueadas = previewData?.ops_bloqueadas || [];
  const hayBloqueadas = opsBloqueadas.length > 0;

  return (
    <Dialog
      open={open}
      onClose={(_, reason) => {
        if (reason === "backdropClick") return;
        onClose();
      }}
      fullWidth
      maxWidth={false}
      PaperProps={{
        sx: {
          width: "92vw",
          height: "85vh",
          maxWidth: "none",
          borderRadius: 3,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        Backorders de la línea
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent
        dividers
        sx={{ display: "flex", flexDirection: "column", gap: 2 }}
      >
        {lineaBase && (
          <Box>
            <Typography variant="body1">
              <strong>Línea base:</strong> {lineaBase.id}
            </Typography>
            <Typography variant="body1">
              <strong>Pedido:</strong> {lineaBase.pedido_id}
            </Typography>
            <Typography variant="body1">
              <strong>SKU:</strong> {lineaBase.sku}
            </Typography>
            <Typography variant="body1">
              <strong>Descripción:</strong> {lineaBase.descripcion}
            </Typography>
            <Typography variant="body1">
              <strong>Cantidad proveedor:</strong> {lineaBase.cantidad_proveedor}
            </Typography>
            <Typography variant="body1">
              <strong>Cantidad recibida:</strong> {lineaBase.cantidad_recibida}
            </Typography>
            <Typography variant="body1">
              <strong>Backorder actual:</strong> {lineaBase.cantidad_backorder}
            </Typography>
            <Typography variant="body1">
              <strong>Estatus:</strong> {lineaBase.estatus}
            </Typography>
          </Box>
        )}

        {hayBloqueadas && (
          <Alert severity="error">
            Hay órdenes de producción bloqueadas en estatus <b>surtida</b> o{" "}
            <b>empacada</b>. No se podrá aplicar reset masivo.
          </Alert>
        )}

        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {asignaciones.map((a) => {
            const bloqueada = Boolean(a.bloqueada);

            return (
              <Box
                key={a.factura_detalle_asignacion_id}
                sx={{
                  border: "1px solid rgba(0,0,0,0.12)",
                  borderRadius: 2,
                  p: 2,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <Box>
                  <Typography variant="body2">
                    <strong>Asignación:</strong> {a.factura_detalle_asignacion_id}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Factura detalle:</strong> {a.factura_detalle_id}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Cantidad asignada:</strong> {a.cantidad_asignada}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Línea:</strong> {a.pedido_linea_id}
                  </Typography>
                  <Typography variant="body2">
                    <strong>OC:</strong> {a.orden_compra_detalle_id || "—"} |{" "}
                    <strong>OPD:</strong> {a.op_detalle_id || "—"} |{" "}
                    <strong>OP:</strong> {a.orden_id || "—"}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Producto:</strong> {a.producto_id || "—"}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Estatus OP:</strong> {a.estatus_op || "—"}
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  <Chip
                    label={bloqueada ? "Bloqueada" : "Backorder"}
                    color={bloqueada ? "error" : "warning"}
                    size="small"
                  />

                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<LinkOffIcon />}
                    disabled={bloqueada || loadingSingle || loadingReset}
                    onClick={() => onUnlinkSingle(a)}
                  >
                    Desenlazar
                  </Button>
                </Box>
              </Box>
            );
          })}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loadingSingle || loadingReset}>
          Cerrar
        </Button>

        <Button
          variant="contained"
          color="error"
          onClick={onResetAll}
          disabled={
            hayBloqueadas ||
            asignaciones.length === 0 ||
            loadingSingle ||
            loadingReset
          }
        >
          Reset masivo
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BackordersPreviewModal;