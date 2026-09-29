import { useEffect, useState } from "react";
import axios from "axios";
import {
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
import { aInputFecha, formatFechaHora, getAuthHeaders } from "./recepcionUtils";

// Planeación: fecha compromiso y notas generales del pedido.
// (Los # de pedido del proveedor, notas de entrega y facturas se capturan
// en sus propias secciones del detalle.)
const DatosPedidoDialog = ({ open, pedido, onClose, onGuardado }) => {
  const [form, setForm] = useState({ fecha_compromiso: "", notas_planeacion: "" });
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (open && pedido) {
      setForm({
        fecha_compromiso: aInputFecha(pedido.fecha_compromiso),
        notas_planeacion: pedido.notas_planeacion || "",
      });
    }
  }, [open, pedido]);

  const set = (campo) => (e) => setForm((prev) => ({ ...prev, [campo]: e.target.value }));

  const handleGuardar = async () => {
    if (!pedido) return;
    setGuardando(true);
    try {
      const { data } = await axios.put(
        `${apiUrl}/pedidos/recepcion/${pedido.pedido_id}/datos`,
        form,
        getAuthHeaders()
      );
      swalSuccess("Datos guardados", data?.message || "");
      if (onGuardado) onGuardado();
    } catch (error) {
      handleApiError(error, { defaultMessage: "No se pudieron guardar los datos.", warningTitle: "No se pudo guardar" });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open={open} onClose={guardando ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={modalTitleSx}>Datos del pedido #{pedido?.pedido_id}</DialogTitle>
      <DialogContent sx={modalContentSx}>
        {pedido && (
          <Stack spacing={2.25} sx={{ pt: 1 }}>
            <TextField
              label="Fecha compromiso"
              type="date"
              size="small"
              value={form.fecha_compromiso}
              onChange={set("fecha_compromiso")}
              InputLabelProps={{ shrink: true }}
              autoFocus
            />
            <TextField
              label="Notas del pedido"
              size="small"
              value={form.notas_planeacion}
              onChange={set("notas_planeacion")}
              inputProps={{ maxLength: 2000 }}
              multiline
              minRows={3}
              placeholder="Ej. El proveedor enviará en dos embarques…"
            />
            {pedido.datos_actualizados_por && (
              <Box sx={{ color: "#78909c" }}>
                <Typography variant="caption">
                  Última actualización: {pedido.datos_actualizados_por} ·{" "}
                  {formatFechaHora(pedido.datos_actualizados_en)}
                </Typography>
              </Box>
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
          disabled={guardando}
          startIcon={guardando ? <CircularProgress size={18} color="inherit" /> : null}
          sx={modalPrimaryButtonSx}
        >
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DatosPedidoDialog;
