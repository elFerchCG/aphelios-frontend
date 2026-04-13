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
  Divider,
  Stack,
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
          fontWeight: 700,
        }}
      >
        Backorders del producto
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent
        dividers
        sx={{ display: "flex", flexDirection: "column", gap: 2 }}
      >
        {lineaBase && (
          <Box
            sx={{
              p: 2,
              border: "1px solid rgba(0,0,0,0.12)",
              borderRadius: 2,
              bgcolor: "grey.50",
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              Componente: {lineaBase.sku || "—"}
            </Typography>

            <Typography variant="body1" sx={{ mb: 1 }}>
              <strong>Descripción del componente:</strong>{" "}
              {lineaBase.descripcion || "—"}
            </Typography>

            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={4}
              useFlexGap
              flexWrap="wrap"
            >
              <Box>
                <Typography variant="body2">
                  <strong>Pedido:</strong> #{lineaBase.pedido_id}
                </Typography>
                <Typography variant="body2">
                  <strong>Línea base:</strong> #{lineaBase.id}
                </Typography>
              </Box>

              <Box>
                <Typography variant="body2">
                  <strong>Cantidad solicitada:</strong>{" "}
                  {lineaBase.cantidad_proveedor}
                </Typography>
                <Typography variant="body2">
                  <strong>Cantidad recibida:</strong>{" "}
                  {lineaBase.cantidad_recibida}
                </Typography>
                <Typography variant="body2">
                  <strong>Backorder actual:</strong>{" "}
                  {lineaBase.cantidad_backorder}
                </Typography>
              </Box>

              <Box>
                <Typography variant="body2">
                  <strong>Estado:</strong> {lineaBase.estatus}
                </Typography>
              </Box>
            </Stack>
          </Box>
        )}

        {hayBloqueadas && (
          <Alert severity="error">
            Hay órdenes de producción bloqueadas en estado <b>surtida</b> o{" "}
            <b>empacada</b>. No se puede aplicar el reset masivo.
          </Alert>
        )}

        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
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
                  alignItems: "flex-start",
                  gap: 2,
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 700, mb: 1 }}
                  >
                    <strong>Nombre del producto:</strong>{" "}
                    {a.producto_titulo || "—"}
                  </Typography>

                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1}
                    flexWrap="wrap"
                    useFlexGap
                    sx={{ mb: 1 }}
                  >
                    <Chip
                      label={`SKU: ${a.sku || "—"}`}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      label={`Cantidad asignada: ${a.cantidad_asignada}`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                    <Chip
                      label={
                        bloqueada ? "No se puede modificar" : "Backorder activo"
                      }
                      color={bloqueada ? "error" : "warning"}
                      size="small"
                    />
                  </Stack>

                  <Divider sx={{ my: 1.5 }} />

                  <Stack
                    direction={{ xs: "column", md: "row" }}
                    spacing={4}
                    useFlexGap
                    flexWrap="wrap"
                  >
                    <Box>
                      <Typography variant="body2">
                        <strong>Línea de pedido:</strong> #{a.pedido_linea_id}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Línea de factura:</strong> #
                        {a.factura_detalle_id}
                      </Typography>
                      <Typography variant="body2">
                        <strong>ID de asignación:</strong> #
                        {a.factura_detalle_asignacion_id}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="body2">
                        <strong>Orden de compra:</strong> #
                        {a.orden_compra_detalle_id || "—"}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Detalle de producción:</strong> #
                        {a.op_detalle_id || "—"}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Orden de producción:</strong> #
                        {a.orden_id || "—"}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="body2">
                        <strong>Producto ID:</strong> {a.producto_id || "—"}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Estado de producción:</strong>{" "}
                        {a.estatus_op || "—"}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                    minWidth: 180,
                  }}
                >
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<LinkOffIcon />}
                    disabled={bloqueada || loadingSingle || loadingReset}
                    onClick={() => onUnlinkSingle(a)}
                    fullWidth
                  >
                    Quitar asignación
                  </Button>
                </Box>
              </Box>
            );
          })}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
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
