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
import RequestQuoteOutlinedIcon from "@mui/icons-material/RequestQuoteOutlined";
import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined";

import { modalActionsSx, modalContentSx, modalSecondaryButtonSx, modalTitleSx } from "../../common/modalStyles";
import apiUrl from "../../../config";
import {
  aCentavos,
  chipSuaveSx,
  fmtFecha,
  fmtFechaHora,
  fmtMoneda,
  getAuthHeaders,
  getEstatusNota,
  getEstatusPago,
} from "./cxpUtils";

const Dato = ({ label, children }) => (
  <Box sx={{ minWidth: 140 }}>
    <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, textTransform: "uppercase" }}>
      {label}
    </Typography>
    <Typography variant="body2" sx={{ fontWeight: 600 }}>{children}</Typography>
  </Box>
);

// Detalle de una nota de crédito: en qué pagos se usó y cancelación si sigue sin usarse.
const DetalleNotaDialog = ({ open, notaId, puedeEscribir, onClose, onCancelada, onVerPago }) => {
  const [data, setData] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [motivo, setMotivo] = useState("");
  const [confirmando, setConfirmando] = useState(false);
  const [cancelando, setCancelando] = useState(false);

  useEffect(() => {
    if (!open || !notaId) return;
    setData(null);
    setError("");
    setMotivo("");
    setConfirmando(false);
    setCargando(true);
    axios
      .get(`${apiUrl}/cuentasPorPagar/notas-credito/${notaId}`, getAuthHeaders())
      .then(({ data: res }) => setData(res))
      .catch((err) => setError(err?.response?.data?.message || "No se pudo consultar la nota de crédito."))
      .finally(() => setCargando(false));
  }, [open, notaId]);

  const cancelar = async () => {
    setError("");
    setCancelando(true);
    try {
      const { data: res } = await axios.post(
        `${apiUrl}/cuentasPorPagar/notas-credito/${notaId}/cancelar`,
        { motivo: motivo.trim() },
        getAuthHeaders()
      );
      onCancelada(res);
    } catch (err) {
      setError(err?.response?.data?.message || "No se pudo cancelar la nota de crédito.");
    } finally {
      setCancelando(false);
    }
  };

  const nota = data?.nota;
  const estatus = getEstatusNota(nota);
  const usosActivos = (data?.usos || []).filter((u) => u.estatus === "aplicado");
  const sinUsar = nota && aCentavos(nota.saldo) === aCentavos(nota.monto) && !usosActivos.length;

  return (
    <Dialog open={open} onClose={cancelando ? undefined : onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ ...modalTitleSx, display: "flex", alignItems: "center", gap: 1 }}>
        <RequestQuoteOutlinedIcon color="primary" /> Nota de crédito {nota?.folio || ""}
        {nota && <Chip size="small" label={estatus.label} sx={chipSuaveSx(estatus, { ml: 1 })} />}
      </DialogTitle>

      <DialogContent sx={modalContentSx}>
        {cargando && (
          <Box sx={{ py: 4, textAlign: "center" }}>
            <CircularProgress />
          </Box>
        )}

        {nota && (
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Stack direction="row" flexWrap="wrap" gap={2.5}>
              <Dato label="Proveedor">{nota.proveedor}</Dato>
              <Dato label="Fecha de la nota">{fmtFecha(nota.fecha_nota)}</Dato>
              <Dato label="Monto">{fmtMoneda(nota.monto)}</Dato>
              <Dato label="Usado">{fmtMoneda((aCentavos(nota.monto) - aCentavos(nota.saldo)) / 100)}</Dato>
              <Dato label="Disponible">{fmtMoneda(nota.saldo)}</Dato>
              <Dato label="Registró">
                {nota.creado_por_nombre || "—"} · {fmtFechaHora(nota.creado_en)}
              </Dato>
            </Stack>

            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Concepto: {nota.concepto}
            </Typography>

            {nota.estatus === "cancelada" && (
              <Alert severity="error">
                Cancelada por {nota.cancelado_por_nombre || "—"} el {fmtFechaHora(nota.cancelado_en)}. Motivo:{" "}
                {nota.motivo_cancelacion}
              </Alert>
            )}

            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ "& th": { bgcolor: "#f5f7fa", fontWeight: 700, fontSize: 13 } }}>
                    <TableCell>Pago</TableCell>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Facturas</TableCell>
                    <TableCell align="right">Aplicado</TableCell>
                    <TableCell align="right">Desc. pronto pago</TableCell>
                    <TableCell>Estatus</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.usos.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} sx={{ textAlign: "center", py: 2, color: "text.secondary" }}>
                        Esta nota todavía no se ha usado en ningún pago.
                      </TableCell>
                    </TableRow>
                  )}
                  {data.usos.map((u) => {
                    const info = getEstatusPago(u.estatus);
                    const cancelado = u.estatus === "cancelado";
                    return (
                      <TableRow key={u.pago_id} sx={{ "& td": { fontSize: 13, color: cancelado ? "text.disabled" : "inherit" } }}>
                        <TableCell>
                          <Button size="small" onClick={() => onVerPago(u.pago_id)} sx={{ textTransform: "none", fontWeight: 600, p: 0, minWidth: 0 }}>
                            #{u.pago_id}
                          </Button>
                        </TableCell>
                        <TableCell>{fmtFecha(u.fecha_pago)}</TableCell>
                        <TableCell>{u.facturas || "—"}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>{fmtMoneda(u.monto_total)}</TableCell>
                        <TableCell align="right">{u.monto_descuento > 0 ? fmtMoneda(u.monto_descuento) : "—"}</TableCell>
                        <TableCell>
                          <Chip size="small" label={info.label} title={u.motivo_cancelacion || ""} sx={chipSuaveSx(info)} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            {puedeEscribir && nota.estatus === "activa" && (
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, borderColor: "#ef9a9a" }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#d32f2f", mb: 1 }}>
                  Cancelar nota de crédito
                </Typography>
                {sinUsar ? (
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
                        Cancelar nota
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
                ) : (
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    Esta nota ya se usó en {usosActivos.map((u) => `#${u.pago_id}`).join(", ")}. Para cancelarla, primero
                    cancela esos pagos; su monto regresa a la nota.
                  </Typography>
                )}
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

export default DetalleNotaDialog;
