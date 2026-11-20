import { useEffect, useState } from "react";
import axios from "axios";
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";

import {
  modalActionsSx,
  modalContentSx,
  modalPrimaryButtonSx,
  modalSecondaryButtonSx,
  modalTitleSx,
} from "../../common/modalStyles";
import apiUrl from "../../../config";
import { fmtFecha, fmtFechaHora, fmtMoneda, getAuthHeaders } from "./cxpUtils";

// Agregar, corregir o quitar el complemento (CFDI de pago) de un pago por transferencia.
const ComplementoPagoDialog = ({ open, pago, onClose, onGuardado }) => {
  const [complemento, setComplemento] = useState("");
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!open || !pago) return;
    setComplemento(pago.complemento || "");
    setError("");
  }, [open, pago]);

  const actual = pago?.complemento || "";
  const nuevo = complemento.trim();
  const sinCambios = nuevo === actual;

  const guardar = async () => {
    setError("");
    setGuardando(true);
    try {
      const { data } = await axios.put(
        `${apiUrl}/cuentasPorPagar/pagos/${pago.id}/complemento`,
        { complemento: nuevo || null },
        getAuthHeaders()
      );
      onGuardado(data);
    } catch (err) {
      setError(err?.response?.data?.message || "No se pudo guardar el complemento.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open={open} onClose={guardando ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ ...modalTitleSx, display: "flex", alignItems: "center", gap: 1 }}>
        <FactCheckOutlinedIcon color="primary" /> {actual ? "Editar complemento" : "Agregar complemento"} · Pago #{pago?.id}
      </DialogTitle>

      <DialogContent sx={modalContentSx}>
        {pago && (
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              {pago.proveedor} · {fmtFecha(pago.fecha_pago)} · Referencia <strong>{pago.referencia}</strong> ·{" "}
              {fmtMoneda(pago.monto_total)}
              {pago.facturas ? ` · Facturas ${pago.facturas}` : ""}
            </Typography>

            <TextField
              label="# Complemento"
              size="small"
              autoFocus
              value={complemento}
              onChange={(e) => setComplemento(e.target.value)}
              inputProps={{ maxLength: 60 }}
              helperText={actual ? "Déjalo vacío y guarda para quitarlo" : "Folio o UUID del complemento de pago del proveedor"}
            />

            {actual && pago.complemento_actualizado_por && (
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                Último cambio: {pago.complemento_actualizado_por} · {fmtFechaHora(pago.complemento_actualizado_en)}
              </Typography>
            )}

            {error && <Alert severity="warning">{error}</Alert>}
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={modalActionsSx}>
        <Button variant="outlined" onClick={onClose} disabled={guardando} sx={modalSecondaryButtonSx}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          color={actual && !nuevo ? "error" : "primary"}
          onClick={guardar}
          disabled={guardando || sinCambios}
          startIcon={guardando ? <CircularProgress size={18} color="inherit" /> : null}
          sx={modalPrimaryButtonSx}
        >
          {actual && !nuevo ? "Quitar complemento" : "Guardar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ComplementoPagoDialog;
