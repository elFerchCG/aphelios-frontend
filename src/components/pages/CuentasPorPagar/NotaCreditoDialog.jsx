import { useEffect, useState } from "react";
import axios from "axios";
import {
  Alert,
  Autocomplete,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  Stack,
  TextField,
} from "@mui/material";
import RequestQuoteOutlinedIcon from "@mui/icons-material/RequestQuoteOutlined";

import {
  modalActionsSx,
  modalContentSx,
  modalPrimaryButtonSx,
  modalSecondaryButtonSx,
  modalTitleSx,
} from "../../common/modalStyles";
import apiUrl from "../../../config";
import { fmtFecha, fmtMoneda, getAuthHeaders, montoValido } from "./cxpUtils";

// Alta manual de una nota de crédito: queda como saldo a favor del proveedor, sin vencimiento.
const NotaCreditoDialog = ({ open, proveedores, proveedorInicial, hoy, onClose, onGuardado }) => {
  const [proveedor, setProveedor] = useState(null);
  const [folio, setFolio] = useState("");
  const [concepto, setConcepto] = useState("");
  const [fechaNota, setFechaNota] = useState(hoy);
  const [monto, setMonto] = useState("");
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!open) return;
    setProveedor(proveedorInicial || null);
    setFolio("");
    setConcepto("");
    setFechaNota(hoy);
    setMonto("");
    setError("");
  }, [open, proveedorInicial, hoy]);

  const errorFecha = fechaNota && fechaNota > hoy ? "No puede ser futura" : "";
  const errorMonto = monto !== "" && !montoValido(monto) ? "Mayor a 0, máximo 2 decimales" : "";
  const puedeGuardar =
    !guardando && proveedor && folio.trim() && concepto.trim() && fechaNota && !errorFecha && montoValido(monto);

  const guardar = async () => {
    setError("");
    setGuardando(true);
    try {
      const { data } = await axios.post(
        `${apiUrl}/cuentasPorPagar/notas-credito`,
        {
          proveedor_id: proveedor.id_proveedor,
          folio: folio.trim(),
          concepto: concepto.trim(),
          fecha_nota: fechaNota,
          monto: Number(monto),
        },
        getAuthHeaders()
      );
      onGuardado(data);
    } catch (err) {
      setError(err?.response?.data?.message || "No se pudo registrar la nota de crédito.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open={open} onClose={guardando ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ ...modalTitleSx, display: "flex", alignItems: "center", gap: 1 }}>
        <RequestQuoteOutlinedIcon color="primary" /> Registrar nota de crédito
      </DialogTitle>

      <DialogContent sx={modalContentSx}>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Autocomplete
            size="small"
            options={proveedores}
            value={proveedor}
            onChange={(e, v) => setProveedor(v)}
            getOptionLabel={(o) => o?.razon_social || ""}
            isOptionEqualToValue={(o, v) => o.id_proveedor === v.id_proveedor}
            renderInput={(params) => <TextField {...params} label="Proveedor" required />}
          />

          <Stack direction="row" flexWrap="wrap" gap={2}>
            <TextField
              label="Número o folio de la nota"
              size="small"
              required
              value={folio}
              onChange={(e) => setFolio(e.target.value)}
              inputProps={{ maxLength: 60 }}
              sx={{ flex: 1, minWidth: 150 }}
            />
            <TextField
              label="Fecha de la nota"
              type="date"
              size="small"
              required
              value={fechaNota}
              onChange={(e) => setFechaNota(e.target.value)}
              InputLabelProps={{ shrink: true }}
              inputProps={{ max: hoy }}
              error={Boolean(errorFecha)}
              helperText={errorFecha || fmtFecha(fechaNota)}
              sx={{ width: 175 }}
            />
            <TextField
              label="Monto"
              size="small"
              required
              value={monto}
              onChange={(e) => /^\d*\.?\d{0,2}$/.test(e.target.value) && setMonto(e.target.value)}
              error={Boolean(errorMonto)}
              helperText={errorMonto || (montoValido(monto) ? fmtMoneda(monto) : " ")}
              InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
              inputProps={{ inputMode: "decimal" }}
              sx={{ width: 150 }}
            />
          </Stack>

          <TextField
            label="Concepto"
            size="small"
            required
            multiline
            minRows={2}
            value={concepto}
            onChange={(e) => setConcepto(e.target.value)}
            inputProps={{ maxLength: 255 }}
            helperText="Ej. devolución de mercancía, bonificación, ajuste de precio"
          />

          <Alert severity="info" icon={false}>
            El monto queda como saldo a favor del proveedor, sin vencimiento. Se usa desde “Registrar pago” eligiendo el
            método Nota de crédito.
          </Alert>

          {error && <Alert severity="warning">{error}</Alert>}
        </Stack>
      </DialogContent>

      <DialogActions sx={modalActionsSx}>
        <Button variant="outlined" onClick={onClose} disabled={guardando} sx={modalSecondaryButtonSx}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={guardar}
          disabled={!puedeGuardar}
          startIcon={guardando ? <CircularProgress size={18} color="inherit" /> : null}
          sx={modalPrimaryButtonSx}
        >
          Registrar nota
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NotaCreditoDialog;
