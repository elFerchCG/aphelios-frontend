import { useEffect, useState } from "react";
import axios from "axios";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined";

import {
  modalActionsSx,
  modalContentSx,
  modalSecondaryButtonSx,
  modalTitleSx,
} from "../../common/modalStyles";
import apiUrl from "../../../config";
import {
  chipSuaveSx,
  fmtFecha,
  fmtFechaHora,
  fmtMoneda,
  getAuthHeaders,
  getEstatusPago,
  nombreFactura,
  TIPOS_MOVIMIENTO,
} from "./cxpUtils";

const Dato = ({ label, children }) => (
  <Box sx={{ minWidth: 150 }}>
    <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, textTransform: "uppercase" }}>
      {label}
    </Typography>
    <Typography variant="body2" sx={{ fontWeight: 600 }}>{children}</Typography>
  </Box>
);

// Detalle de un pago: facturas que cubrió y, para contabilidad, cancelación con motivo.
const DetallePagoDialog = ({ open, pagoId, puedeEscribir, onClose, onCancelado }) => {
  const [data, setData] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [motivo, setMotivo] = useState("");
  const [confirmando, setConfirmando] = useState(false);
  const [cancelando, setCancelando] = useState(false);

  useEffect(() => {
    if (!open || !pagoId) return;
    setData(null);
    setError("");
    setMotivo("");
    setConfirmando(false);
    setCargando(true);
    axios
      .get(`${apiUrl}/cuentasPorPagar/pagos/${pagoId}`, getAuthHeaders())
      .then(({ data: res }) => setData(res))
      .catch((err) => setError(err?.response?.data?.message || "No se pudo consultar el pago."))
      .finally(() => setCargando(false));
  }, [open, pagoId]);

  const cancelar = async () => {
    setError("");
    setCancelando(true);
    try {
      const { data: res } = await axios.post(
        `${apiUrl}/cuentasPorPagar/pagos/${pagoId}/cancelar`,
        { motivo: motivo.trim() },
        getAuthHeaders()
      );
      onCancelado(res);
    } catch (err) {
      setError(err?.response?.data?.message || "No se pudo cancelar el pago.");
    } finally {
      setCancelando(false);
    }
  };

  const pago = data?.pago;
  const estatus = getEstatusPago(pago?.estatus);

  return (
    <Dialog open={open} onClose={cancelando ? undefined : onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ ...modalTitleSx, display: "flex", alignItems: "center", gap: 1 }}>
        <ReceiptLongOutlinedIcon color="primary" /> Pago #{pagoId}
        {pago && <Chip size="small" label={estatus.label} sx={chipSuaveSx(estatus, { ml: 1 })} />}
      </DialogTitle>

      <DialogContent sx={modalContentSx}>
        {cargando && (
          <Box sx={{ py: 4, textAlign: "center" }}>
            <CircularProgress />
          </Box>
        )}

        {pago && (
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Stack direction="row" flexWrap="wrap" gap={2.5}>
              <Dato label="Proveedor">{pago.proveedor}</Dato>
              <Dato label="Fecha de pago">{fmtFecha(pago.fecha_pago)}</Dato>
              <Dato label="Referencia">{pago.referencia}</Dato>
              <Dato label="Transferido">{fmtMoneda(pago.monto_total)}</Dato>
              {pago.monto_descuento > 0 && <Dato label="Descuento pronto pago">{fmtMoneda(pago.monto_descuento)}</Dato>}
              <Dato label="Cuenta destino">
                {pago.banco_destino || "—"} · {pago.clabe_destino || "—"}
              </Dato>
              <Dato label="Registró">
                {pago.creado_por_nombre || "—"} · {fmtFechaHora(pago.creado_en)}
              </Dato>
            </Stack>

            {pago.comentario && (
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Comentario: {pago.comentario}
              </Typography>
            )}

            {pago.estatus === "cancelado" && (
              <Alert severity="error">
                Cancelado por {pago.cancelado_por_nombre || "—"} el {fmtFechaHora(pago.cancelado_en)}. Motivo:{" "}
                {pago.motivo_cancelacion}
              </Alert>
            )}

            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ "& th": { bgcolor: "#f5f7fa", fontWeight: 700, fontSize: 13 } }}>
                    <TableCell>Factura</TableCell>
                    <TableCell>Emisión</TableCell>
                    <TableCell>Movimiento</TableCell>
                    <TableCell align="right">Saldo anterior</TableCell>
                    <TableCell align="right">Monto</TableCell>
                    <TableCell align="right">Saldo posterior</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.aplicaciones.map((a) => (
                    <TableRow key={a.id} sx={{ "& td": { fontSize: 13 } }}>
                      <TableCell sx={{ fontWeight: 600 }}>{nombreFactura({ ...a, id: a.factura_id })}</TableCell>
                      <TableCell>{fmtFecha(a.fecha_factura)}</TableCell>
                      <TableCell sx={{ color: a.tipo === "descuento_pronto_pago" ? "#2e7d32" : "inherit" }}>
                        {TIPOS_MOVIMIENTO[a.tipo] || a.tipo}
                      </TableCell>
                      <TableCell align="right">{fmtMoneda(a.saldo_anterior)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>{fmtMoneda(a.monto)}</TableCell>
                      <TableCell align="right">{fmtMoneda(a.saldo_posterior)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {puedeEscribir && pago.estatus === "aplicado" && (
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, borderColor: "#ef9a9a" }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#d32f2f", mb: 1 }}>
                  Cancelar pago
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary", mb: 1.5 }}>
                  El pago no se borra: queda como cancelado y se repone el saldo de cada factura.
                </Typography>
                <Stack direction="row" flexWrap="wrap" gap={1.5} alignItems="flex-start">
                  <TextField
                    label="Motivo de la cancelación"
                    size="small"
                    value={motivo}
                    onChange={(e) => {
                      setMotivo(e.target.value);
                      setConfirmando(false);
                    }}
                    inputProps={{ maxLength: 255 }}
                    helperText="Mínimo 5 caracteres"
                    sx={{ flex: 1, minWidth: 260 }}
                  />
                  {!confirmando ? (
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<BlockOutlinedIcon />}
                      disabled={motivo.trim().length < 5}
                      onClick={() => setConfirmando(true)}
                      sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600, height: 40 }}
                    >
                      Cancelar pago
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      color="error"
                      disabled={cancelando}
                      startIcon={cancelando ? <CircularProgress size={18} color="inherit" /> : <BlockOutlinedIcon />}
                      onClick={cancelar}
                      sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600, height: 40 }}
                    >
                      Confirmar cancelación
                    </Button>
                  )}
                </Stack>
              </Paper>
            )}
          </Stack>
        )}

        {error && <Alert severity="warning" sx={{ mt: 2 }}>{error}</Alert>}
      </DialogContent>

      <DialogActions sx={modalActionsSx}>
        <Button variant="outlined" onClick={onClose} disabled={cancelando} sx={modalSecondaryButtonSx}>
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DetallePagoDialog;
