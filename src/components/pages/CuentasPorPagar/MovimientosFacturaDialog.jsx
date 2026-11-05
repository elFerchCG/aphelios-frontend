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
  Typography,
} from "@mui/material";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";

import { modalActionsSx, modalContentSx, modalSecondaryButtonSx, modalTitleSx } from "../../common/modalStyles";
import apiUrl from "../../../config";
import { fmtFecha, fmtFechaHora, fmtMoneda, getAuthHeaders, nombreFactura, TIPOS_MOVIMIENTO } from "./cxpUtils";

// Estado de cuenta de una factura: alta, pagos, descuentos y cancelaciones.
const MovimientosFacturaDialog = ({ open, facturaId, onClose, onVerPago }) => {
  const [data, setData] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !facturaId) return;
    setData(null);
    setError("");
    setCargando(true);
    axios
      .get(`${apiUrl}/cuentasPorPagar/facturas/${facturaId}/movimientos`, getAuthHeaders())
      .then(({ data: res }) => setData(res))
      .catch((err) => setError(err?.response?.data?.message || "No se pudieron consultar los movimientos."))
      .finally(() => setCargando(false));
  }, [open, facturaId]);

  const f = data?.factura;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ ...modalTitleSx, display: "flex", alignItems: "center", gap: 1 }}>
        <ReceiptLongOutlinedIcon color="primary" /> Movimientos de la factura {f ? nombreFactura(f) : ""}
      </DialogTitle>

      <DialogContent sx={modalContentSx}>
        {cargando && (
          <Box sx={{ py: 4, textAlign: "center" }}>
            <CircularProgress />
          </Box>
        )}

        {f && (
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              {f.proveedor} · Emisión {fmtFecha(f.fecha_factura)} · Pronto pago {fmtFecha(f.fecha_pronto_pago)} · Vence{" "}
              {fmtFecha(f.fecha_vencimiento)}
            </Typography>

            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ "& th": { bgcolor: "#f5f7fa", fontWeight: 700, fontSize: 13 } }}>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Movimiento</TableCell>
                    <TableCell>Pago / referencia</TableCell>
                    <TableCell align="right">Monto</TableCell>
                    <TableCell align="right">Saldo</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow sx={{ "& td": { fontSize: 13 } }}>
                    <TableCell>{fmtFecha(f.fecha_factura)}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Factura (alta)</TableCell>
                    <TableCell>—</TableCell>
                    <TableCell align="right">{fmtMoneda(f.total)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>{fmtMoneda(f.total)}</TableCell>
                  </TableRow>
                  {data.movimientos.map((m) => {
                    const cancelado = m.estatus_pago === "cancelado";
                    return (
                      <TableRow
                        key={m.id}
                        sx={{ "& td": { fontSize: 13, color: cancelado ? "text.disabled" : "inherit" } }}
                      >
                        <TableCell>{fmtFecha(m.fecha_pago)}</TableCell>
                        <TableCell>
                          <Box component="span" sx={{ textDecoration: cancelado ? "line-through" : "none" }}>
                            {TIPOS_MOVIMIENTO[m.tipo] || m.tipo}
                          </Box>
                          {cancelado && (
                            <Chip
                              size="small"
                              label="Cancelado"
                              title={`${m.motivo_cancelacion || ""} · ${fmtFechaHora(m.cancelado_en)}`}
                              sx={{ ml: 1, height: 20, fontWeight: 600, bgcolor: "#ffebee", color: "#d32f2f" }}
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            onClick={() => onVerPago(m.pago_id)}
                            sx={{ textTransform: "none", fontWeight: 600, p: 0, minWidth: 0 }}
                          >
                            #{m.pago_id}
                          </Button>{" "}
                          · {m.referencia}
                        </TableCell>
                        <TableCell align="right" sx={{ textDecoration: cancelado ? "line-through" : "none" }}>
                          −{fmtMoneda(m.monto)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          {cancelado ? "—" : fmtMoneda(m.saldo_posterior)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            <Typography variant="subtitle2" sx={{ textAlign: "right", fontWeight: 700 }}>
              Saldo actual: {fmtMoneda(f.saldo)}
            </Typography>
          </Stack>
        )}

        {error && <Alert severity="warning" sx={{ mt: 2 }}>{error}</Alert>}
      </DialogContent>

      <DialogActions sx={modalActionsSx}>
        <Button variant="outlined" onClick={onClose} sx={modalSecondaryButtonSx}>
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MovimientosFacturaDialog;
