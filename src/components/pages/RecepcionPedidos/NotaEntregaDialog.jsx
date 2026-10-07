import { useEffect, useState } from "react";
import axios from "axios";
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
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
import { getAuthHeaders } from "./recepcionUtils";

// Planeación: alta / edición de una nota de entrega del pedido, opcionalmente
// ligada a uno de sus # de pedido del proveedor.
const NotaEntregaDialog = ({ open, pedido, nota, onClose, onGuardado }) => {
  const [form, setForm] = useState({ numero_nota: "", numero_proveedor_id: "", notas: "" });
  const [guardando, setGuardando] = useState(false);
  const esEdicion = Boolean(nota);

  useEffect(() => {
    if (!open) return;
    setForm({
      numero_nota: nota?.numero_nota || "",
      numero_proveedor_id: nota?.numero_proveedor_id ? String(nota.numero_proveedor_id) : "",
      notas: nota?.notas || "",
    });
  }, [open, nota]);

  const set = (campo) => (e) => setForm((prev) => ({ ...prev, [campo]: e.target.value }));

  const handleGuardar = async () => {
    setGuardando(true);
    try {
      const payload = {
        ...form,
        numero_proveedor_id: form.numero_proveedor_id ? Number(form.numero_proveedor_id) : null,
      };
      const { data } = esEdicion
        ? await axios.put(`${apiUrl}/pedidos/recepcion/notas/${nota.id}`, payload, getAuthHeaders())
        : await axios.post(`${apiUrl}/pedidos/recepcion/${pedido.pedido_id}/notas`, payload, getAuthHeaders());
      swalSuccess(esEdicion ? "Nota actualizada" : "Nota agregada", data?.message || "");
      if (onGuardado) onGuardado();
    } catch (error) {
      handleApiError(error, { defaultMessage: "No se pudo guardar la nota de entrega.", warningTitle: "No se pudo guardar" });
    } finally {
      setGuardando(false);
    }
  };

  const numeros = pedido?.numeros || [];

  return (
    <Dialog open={open} onClose={guardando ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={modalTitleSx}>
        {esEdicion ? "Editar nota de entrega" : "Nueva nota de entrega"}
      </DialogTitle>
      <DialogContent sx={modalContentSx}>
        <Stack spacing={2.25} sx={{ pt: 1 }}>
          <TextField
            label="# Nota de entrega"
            size="small"
            value={form.numero_nota}
            onChange={set("numero_nota")}
            inputProps={{ maxLength: 100 }}
            required
            autoFocus
          />
          <FormControl size="small">
            <InputLabel id="nota-po-label"># Pedido del proveedor</InputLabel>
            <Select
              labelId="nota-po-label"
              label="# Pedido del proveedor"
              value={form.numero_proveedor_id}
              onChange={set("numero_proveedor_id")}
            >
              <MenuItem value="">
                <em>Sin ligar</em>
              </MenuItem>
              {numeros.map((n) => (
                <MenuItem key={n.id} value={String(n.id)}>
                  {n.numero}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Comentario"
            size="small"
            value={form.notas}
            onChange={set("notas")}
            inputProps={{ maxLength: 500 }}
            multiline
            minRows={2}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={modalActionsSx}>
        <Button variant="outlined" onClick={onClose} disabled={guardando} sx={modalSecondaryButtonSx}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleGuardar}
          disabled={guardando || !form.numero_nota.trim()}
          startIcon={guardando ? <CircularProgress size={18} color="inherit" /> : null}
          sx={modalPrimaryButtonSx}
        >
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NotaEntregaDialog;
