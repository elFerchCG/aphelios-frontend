import { useEffect, useState } from "react";
import axios from "axios";
import {
  Alert,
  Box,
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

import {
  modalActionsSx,
  modalContentSx,
  modalPrimaryButtonSx,
  modalSecondaryButtonSx,
  modalTitleSx,
} from "../../common/modalStyles";
import { handleApiError } from "../../../helpers/apiErrorHandler";
import { swalSuccess } from "../../../helpers/sweetAlert";
import apiUrl from "../../../config";
import { aInputFechaHora, ahoraLocalInput, getAuthHeaders, getUsuarioSesion } from "./recepcionUtils";

const soloEntero = (valor) => String(valor).replace(/\D/g, "").replace(/^0+(?=\d)/, "").slice(0, 5);

// Almacén: marcar como recibida una nota de entrega que planeación ya
// registró (o editar los datos de una recepción ya hecha).
const RegistrarRecepcionDialog = ({ open, pedido, nota, onClose, onGuardado }) => {
  const [form, setForm] = useState({
    tarimas: "",
    cajas: "",
    transportista: "",
    observaciones: "",
    fecha_recepcion: "",
  });
  const [guardando, setGuardando] = useState(false);
  const usuario = getUsuarioSesion();
  const yaRecibida = Number(nota?.recibida) === 1;

  useEffect(() => {
    if (!open || !nota) return;
    setForm({
      tarimas: yaRecibida ? String(nota.tarimas ?? "") : "",
      cajas: yaRecibida ? String(nota.cajas ?? "") : "",
      transportista: nota.transportista || "",
      observaciones: nota.observaciones_recepcion || "",
      fecha_recepcion: yaRecibida ? aInputFechaHora(nota.fecha_recepcion) : ahoraLocalInput(),
    });
  }, [open, nota, yaRecibida]);

  const set = (campo) => (e) => setForm((prev) => ({ ...prev, [campo]: e.target.value }));
  const setEntero = (campo) => (e) => setForm((prev) => ({ ...prev, [campo]: soloEntero(e.target.value) }));

  const handleFecha = (e) => {
    const valor = e.target.value;
    const max = ahoraLocalInput();
    setForm((prev) => ({ ...prev, fecha_recepcion: valor && valor > max ? max : valor }));
  };

  const sinBultos = !Number(form.tarimas) && !Number(form.cajas);

  const handleGuardar = async () => {
    setGuardando(true);
    try {
      const { data } = await axios.put(
        `${apiUrl}/pedidos/recepcion/notas/${nota.id}/recibir`,
        { ...form, tarimas: Number(form.tarimas || 0), cajas: Number(form.cajas || 0) },
        getAuthHeaders()
      );
      swalSuccess(yaRecibida ? "Recepción actualizada" : "Nota recibida", data?.message || "");
      if (onGuardado) onGuardado();
    } catch (error) {
      handleApiError(error, { defaultMessage: "No se pudo registrar la recepción.", warningTitle: "No se pudo guardar" });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open={open} onClose={guardando ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={modalTitleSx}>
        {yaRecibida ? "Editar recepción" : "Recibir mercancía"} · Nota {nota?.numero_nota}
      </DialogTitle>
      <DialogContent sx={modalContentSx}>
        {nota && (
          <Stack spacing={2.25} sx={{ pt: 1 }}>
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "#f5f9ff", border: "1px solid #e3f2fd" }}>
              <Typography variant="body2" sx={{ fontWeight: 700, color: "#1a237e" }}>
                Pedido #{pedido?.pedido_id} · {pedido?.proveedor_nombre}
              </Typography>
              <Typography variant="caption" sx={{ color: "#546e7a" }}>
                Nota de entrega <strong>{nota.numero_nota}</strong>
                {nota.numero_pedido_proveedor ? ` · # pedido proveedor ${nota.numero_pedido_proveedor}` : ""}
                {nota.facturas?.length
                  ? ` · factura(s) ${nota.facturas.map((f) => f.numero_factura).join(", ")}`
                  : ""}
              </Typography>
            </Box>

            <Stack direction="row" spacing={2}>
              <TextField
                label="Tarimas"
                size="small"
                value={form.tarimas}
                onChange={setEntero("tarimas")}
                inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
                fullWidth
                autoFocus
              />
              <TextField
                label="Cajas"
                size="small"
                value={form.cajas}
                onChange={setEntero("cajas")}
                inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
                fullWidth
              />
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Transportista / paquetería"
                size="small"
                value={form.transportista}
                onChange={set("transportista")}
                inputProps={{ maxLength: 100 }}
                fullWidth
              />
              <TextField
                label="Fecha y hora de llegada"
                type="datetime-local"
                size="small"
                value={form.fecha_recepcion}
                onChange={handleFecha}
                InputLabelProps={{ shrink: true }}
                inputProps={{ max: ahoraLocalInput() }}
                fullWidth
              />
            </Stack>

            <TextField
              label="Observaciones"
              size="small"
              value={form.observaciones}
              onChange={set("observaciones")}
              inputProps={{ maxLength: 2000 }}
              multiline
              minRows={3}
              placeholder="Ej. 2 cajas golpeadas, falta etiqueta en una tarima…"
            />

            {!yaRecibida && (
              <Alert severity="info" variant="outlined">
                Se registrará como recibido por <strong>{usuario?.nombre || "tu usuario"}</strong>.
              </Alert>
            )}
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={modalActionsSx}>
        <Button variant="outlined" onClick={onClose} disabled={guardando} sx={modalSecondaryButtonSx}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleGuardar}
          disabled={guardando || sinBultos}
          startIcon={guardando ? <CircularProgress size={18} color="inherit" /> : null}
          sx={modalPrimaryButtonSx}
        >
          {yaRecibida ? "Guardar cambios" : "Marcar como recibida"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RegistrarRecepcionDialog;
