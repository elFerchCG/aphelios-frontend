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
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AccountBalanceOutlinedIcon from "@mui/icons-material/AccountBalanceOutlined";

import {
  modalActionsSx,
  modalContentSx,
  modalPrimaryButtonSx,
  modalSecondaryButtonSx,
  modalTitleSx,
} from "../../common/modalStyles";
import apiUrl from "../../../config";
import { clabeValida, fmtFecha, getAuthHeaders, hoyMexico, sumarDias } from "./cxpUtils";

const aTexto = (v) => (v === null || v === undefined ? "" : String(v));

// Términos de pago (días desde la emisión) y cuenta bancaria única del proveedor.
const TerminosProveedorDialog = ({ open, proveedor, onClose, onGuardado }) => {
  const [form, setForm] = useState({});
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!open || !proveedor) return;
    setError("");
    setForm({
      dias_pronto_pago: aTexto(proveedor.dias_pronto_pago),
      dias_credito: aTexto(proveedor.dias_credito),
      descuento_pronto_pago: aTexto(proveedor.descuento_pronto_pago || 0),
      banco: proveedor.banco || "",
      clabe: proveedor.clabe || "",
    });
  }, [open, proveedor]);

  const set = (campo) => (e) => setForm((prev) => ({ ...prev, [campo]: e.target.value }));
  const setEntero = (campo) => (e) => {
    if (/^\d{0,3}$/.test(e.target.value)) set(campo)(e);
  };

  const credito = form.dias_credito === "" ? null : Number(form.dias_credito);
  const prontoPago = form.dias_pronto_pago === "" ? 0 : Number(form.dias_pronto_pago);
  const descuento = form.descuento_pronto_pago === "" ? 0 : Number(form.descuento_pronto_pago);
  const clabe = String(form.clabe || "").replace(/\s/g, "");

  const errores = {
    dias_credito: credito === null ? "Obligatorio" : credito > 365 ? "Máximo 365" : "",
    dias_pronto_pago: credito !== null && prontoPago > credito ? "No puede ser mayor a los días de crédito" : "",
    descuento_pronto_pago:
      !Number.isFinite(descuento) || descuento < 0 || descuento > 100
        ? "Entre 0 y 100"
        : descuento > 0 && prontoPago === 0
          ? "Captura los días de pronto pago"
          : "",
    clabe: clabe && !clabeValida(clabe) ? "CLABE inválida (18 dígitos con dígito verificador)" : "",
  };
  const hayErrores = Object.values(errores).some(Boolean);

  const hoy = hoyMexico();

  const guardar = async () => {
    setError("");
    setGuardando(true);
    try {
      const { data } = await axios.put(
        `${apiUrl}/cuentasPorPagar/proveedores/${proveedor.id_proveedor}/terminos`,
        {
          dias_credito: credito,
          dias_pronto_pago: prontoPago,
          descuento_pronto_pago: descuento,
          banco: form.banco.trim() || null,
          clabe: clabe || null,
        },
        getAuthHeaders()
      );
      onGuardado(data);
    } catch (err) {
      setError(err?.response?.data?.message || "No se pudieron guardar los términos.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open={open} onClose={guardando ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ ...modalTitleSx, display: "flex", alignItems: "center", gap: 1 }}>
        <AccountBalanceOutlinedIcon color="primary" /> {proveedor?.razon_social}
      </DialogTitle>

      <DialogContent sx={modalContentSx}>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Los días se cuentan desde la fecha de emisión de la factura. Las facturas ya registradas conservan sus
            términos; solo se completan las que aún no tienen.
          </Typography>

          <Stack direction="row" flexWrap="wrap" gap={2}>
            <TextField
              label="Días pronto pago"
              size="small"
              value={form.dias_pronto_pago ?? ""}
              onChange={setEntero("dias_pronto_pago")}
              error={Boolean(errores.dias_pronto_pago)}
              helperText={errores.dias_pronto_pago || "0 = sin pronto pago"}
              sx={{ flex: 1, minWidth: 150 }}
            />
            <TextField
              label="Días de crédito"
              size="small"
              required
              value={form.dias_credito ?? ""}
              onChange={setEntero("dias_credito")}
              error={Boolean(errores.dias_credito)}
              helperText={errores.dias_credito || "Hasta el vencimiento · 0 = sin crédito"}
              sx={{ flex: 1, minWidth: 190 }}
            />
            <TextField
              label="Descuento pronto pago"
              size="small"
              value={form.descuento_pronto_pago ?? ""}
              onChange={(e) => /^\d{0,3}(\.\d{0,2})?$/.test(e.target.value) && set("descuento_pronto_pago")(e)}
              error={Boolean(errores.descuento_pronto_pago)}
              helperText={errores.descuento_pronto_pago || "Sobre el total con IVA"}
              InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
              sx={{ flex: 1, minWidth: 150 }}
            />
          </Stack>

          {credito !== null && !errores.dias_credito && !errores.dias_pronto_pago && (
            <Alert severity="info" icon={false}>
              Ejemplo: factura emitida hoy ({fmtFecha(hoy)}) →
              {prontoPago > 0 && <> pronto pago <strong>{fmtFecha(sumarDias(hoy, prontoPago))}</strong>{descuento > 0 && ` (${descuento}% de descuento)`},</>}
              {" "}vence <strong>{fmtFecha(sumarDias(hoy, credito))}</strong>.
            </Alert>
          )}

          <Stack direction="row" flexWrap="wrap" gap={2}>
            <TextField
              label="Banco"
              size="small"
              value={form.banco ?? ""}
              onChange={set("banco")}
              inputProps={{ maxLength: 60 }}
              sx={{ flex: 1, minWidth: 180 }}
            />
            <TextField
              label="CLABE"
              size="small"
              value={form.clabe ?? ""}
              onChange={(e) => /^[\d\s]{0,22}$/.test(e.target.value) && set("clabe")(e)}
              error={Boolean(errores.clabe)}
              helperText={errores.clabe || "Cuenta a la que se transfieren los pagos"}
              sx={{ flex: 1.4, minWidth: 240 }}
            />
          </Stack>

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
          disabled={guardando || hayErrores}
          startIcon={guardando ? <CircularProgress size={18} color="inherit" /> : null}
          sx={modalPrimaryButtonSx}
        >
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TerminosProveedorDialog;
