import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
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
import { chipDocumentoSx, getAuthHeaders } from "./recepcionUtils";

const etiquetaNota = (n) =>
  `${n.numero_nota} · pedido #${n.pedido_id}${n.numero_pedido_proveedor ? ` · ${n.numero_pedido_proveedor}` : ""}`;

// Planeación: alta / edición de una factura ligada a una o varias notas de
// entrega del proveedor. Por defecto muestra las notas de este pedido, pero
// permite buscar notas de otros pedidos MRP del mismo proveedor
// (backorders facturados en la misma factura).
const FacturaDialog = ({ open, pedido, factura, onClose, onGuardado }) => {
  const [numero, setNumero] = useState("");
  const [notasTexto, setNotasTexto] = useState("");
  const [seleccion, setSeleccion] = useState([]);
  const [opciones, setOpciones] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const esEdicion = Boolean(factura);

  const buscarNotas = useCallback(
    async (texto) => {
      if (!pedido?.proveedor_id) return;
      setCargando(true);
      try {
        const { data } = await axios.get(`${apiUrl}/pedidos/recepcion/notas-disponibles`, {
          ...getAuthHeaders(),
          params: { proveedor_id: pedido.proveedor_id, q: texto || undefined },
        });
        setOpciones(data?.data || []);
      } catch (error) {
        handleApiError(error, { defaultMessage: "No se pudieron consultar las notas de entrega." });
      } finally {
        setCargando(false);
      }
    },
    [pedido?.proveedor_id]
  );

  useEffect(() => {
    if (!open || !pedido) return;
    setNumero(factura?.numero_factura || "");
    setNotasTexto(factura?.notas || "");
    setBusqueda("");
    if (factura) {
      setSeleccion(factura.notas_entrega || []);
    } else {
      setSeleccion([]);
    }
    buscarNotas("");
  }, [open, pedido, factura, buscarNotas]);

  // Opciones = resultados de búsqueda + lo ya seleccionado (para no perderlo).
  const opcionesCompletas = useMemo(() => {
    const mapa = new Map();
    [...seleccion, ...opciones].forEach((n) => mapa.set(Number(n.id), n));
    return [...mapa.values()];
  }, [opciones, seleccion]);

  const deOtrosPedidos = seleccion.filter((n) => Number(n.pedido_id) !== Number(pedido?.pedido_id));

  const handleGuardar = async () => {
    setGuardando(true);
    try {
      const payload = {
        proveedor_id: pedido.proveedor_id,
        numero_factura: numero,
        notas: notasTexto,
        nota_ids: seleccion.map((n) => Number(n.id)),
      };
      const { data } = esEdicion
        ? await axios.put(`${apiUrl}/pedidos/recepcion/facturas/${factura.id}`, payload, getAuthHeaders())
        : await axios.post(`${apiUrl}/pedidos/recepcion/facturas`, payload, getAuthHeaders());
      swalSuccess(esEdicion ? "Factura actualizada" : "Factura agregada", data?.message || "");
      if (onGuardado) onGuardado();
    } catch (error) {
      handleApiError(error, { defaultMessage: "No se pudo guardar la factura.", warningTitle: "No se pudo guardar" });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open={open} onClose={guardando ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={modalTitleSx}>{esEdicion ? "Editar factura" : "Nueva factura"}</DialogTitle>
      <DialogContent sx={modalContentSx}>
        <Stack spacing={2.25} sx={{ pt: 1 }}>
          <TextField
            label="# Factura"
            size="small"
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
            inputProps={{ maxLength: 100 }}
            required
            autoFocus
          />

          <Autocomplete
            multiple
            disableCloseOnSelect
            size="small"
            options={opcionesCompletas}
            value={seleccion}
            loading={cargando}
            onChange={(e, valor) => setSeleccion(valor)}
            inputValue={busqueda}
            onInputChange={(e, valor, motivo) => {
              if (motivo === "reset") return;
              setBusqueda(valor);
              buscarNotas(valor);
            }}
            filterOptions={(x) => x}
            isOptionEqualToValue={(o, v) => Number(o.id) === Number(v.id)}
            getOptionLabel={etiquetaNota}
            renderOption={(props, option, { selected }) => (
              <li {...props} key={option.id}>
                <Checkbox size="small" checked={selected} sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Nota {option.numero_nota}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    Pedido #{option.pedido_id}
                    {option.numero_pedido_proveedor ? ` · ${option.numero_pedido_proveedor}` : ""}
                    {Number(option.recibida) === 1 ? " · recibida" : " · por llegar"}
                  </Typography>
                </Box>
              </li>
            )}
            renderTags={(value, getTagProps) =>
              value.map((n, i) => (
                <Chip
                  {...getTagProps({ index: i })}
                  key={n.id}
                  size="small"
                  label={`${n.numero_nota}${Number(n.pedido_id) !== Number(pedido?.pedido_id) ? ` (#${n.pedido_id})` : ""}`}
                  sx={chipDocumentoSx("nota_entrega")}
                />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Notas de entrega que cubre"
                placeholder="Buscar por # nota, # pedido o # pedido proveedor"
                helperText="Puedes elegir notas de otros pedidos del mismo proveedor (backorders)."
              />
            )}
          />

          {deOtrosPedidos.length > 0 && (
            <Alert severity="info" variant="outlined">
              Esta factura también cubre notas de otro(s) pedido(s):{" "}
              {[...new Set(deOtrosPedidos.map((n) => `#${n.pedido_id}`))].join(", ")}. Aparecerá en todos ellos.
            </Alert>
          )}

          <TextField
            label="Comentario"
            size="small"
            value={notasTexto}
            onChange={(e) => setNotasTexto(e.target.value)}
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
          disabled={guardando || !numero.trim() || seleccion.length === 0}
          startIcon={guardando ? <CircularProgress size={18} color="inherit" /> : null}
          sx={modalPrimaryButtonSx}
        >
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FacturaDialog;
