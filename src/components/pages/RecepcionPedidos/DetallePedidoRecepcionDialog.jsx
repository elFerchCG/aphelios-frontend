import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
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
  Divider,
  Grid,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AddIcon from "@mui/icons-material/Add";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import LockOpenOutlinedIcon from "@mui/icons-material/LockOpenOutlined";
import MoveToInboxIcon from "@mui/icons-material/MoveToInbox";
import UndoIcon from "@mui/icons-material/Undo";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ScheduleIcon from "@mui/icons-material/Schedule";

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
import RegistrarRecepcionDialog from "./RegistrarRecepcionDialog";
import DatosPedidoDialog from "./DatosPedidoDialog";
import NotaEntregaDialog from "./NotaEntregaDialog";
import FacturaDialog from "./FacturaDialog";
import {
  chipDocumentoSx,
  compromisoVencido,
  fmtNum,
  formatFecha,
  formatFechaHora,
  getAuthHeaders,
  getEstatusInfo,
} from "./recepcionUtils";

const Dato = ({ label, children }) => (
  <Box>
    <Typography variant="caption" sx={{ color: "#78909c", display: "block" }}>
      {label}
    </Typography>
    <Typography variant="body2" component="div" sx={{ fontWeight: 600 }}>
      {children}
    </Typography>
  </Box>
);

const EstatusChip = ({ estatus }) => {
  const info = getEstatusInfo(estatus);
  return (
    <Chip
      label={info.label}
      size="small"
      sx={{ bgcolor: info.bg, color: info.color, border: `1px solid ${info.color}`, fontWeight: 600 }}
    />
  );
};

const Seccion = ({ titulo, contador, accion, children }) => (
  <Box sx={{ p: 2, borderRadius: 2, border: "1px solid #e0e0e0" }}>
    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }} spacing={1}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#1a237e" }}>
        {titulo}
        {contador !== undefined ? ` (${contador})` : ""}
      </Typography>
      {accion}
    </Stack>
    {children}
  </Box>
);

const Vacio = ({ children }) => (
  <Typography variant="body2" sx={{ color: "#78909c", py: 0.5 }}>
    {children}
  </Typography>
);

const botonSx = { textTransform: "none", fontWeight: 600, borderRadius: 2 };

// Las alertas que se abren desde este modal deben quedar por encima de él
// (z-index del Dialog de MUI = 1300) y conservar el foco en sus inputs.
const swalSobreModal = {
  customClass: { container: "mi-swal" },
  didOpen: () => {
    const contenedor = Swal.getContainer();
    if (contenedor) contenedor.style.zIndex = "2000";
    const input = Swal.getInput();
    if (input) input.focus();
  },
};

// Detalle / gestión de un pedido MRP:
//  - Planeación: # pedidos del proveedor, notas de entrega, facturas, datos y cierre.
//  - Almacén: marca como recibidas las notas de entrega que capturó planeación.
const DetallePedidoRecepcionDialog = ({
  open,
  pedidoId,
  puedeRegistrar,
  puedeEditarPedido,
  onClose,
  onCambio,
}) => {
  const [pedido, setPedido] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editarDatos, setEditarDatos] = useState(false);
  const [dlgNota, setDlgNota] = useState({ open: false, nota: null });
  const [dlgFactura, setDlgFactura] = useState({ open: false, factura: null });
  const [dlgRecibir, setDlgRecibir] = useState(null);
  const [deshacer, setDeshacer] = useState({ id: null, motivo: "", guardando: false });
  const [ocupado, setOcupado] = useState(false);

  const cargar = useCallback(async () => {
    if (!pedidoId) return;
    setLoading(true);
    try {
      const { data } = await axios.get(`${apiUrl}/pedidos/recepcion/${pedidoId}`, getAuthHeaders());
      setPedido(data?.data || null);
    } catch (error) {
      handleApiError(error, { defaultMessage: "No se pudo cargar el pedido." });
    } finally {
      setLoading(false);
    }
  }, [pedidoId]);

  useEffect(() => {
    if (open) {
      setPedido(null);
      setDeshacer({ id: null, motivo: "", guardando: false });
      cargar();
    }
  }, [open, cargar]);

  const trasCambio = async () => {
    await cargar();
    if (onCambio) onCambio();
  };

  // Ejecuta una petición con confirmación opcional y refresca.
  const ejecutar = async ({ confirmar, peticion, exito, errorMsg }) => {
    if (confirmar) {
      const r = await Swal.fire({
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Sí, continuar",
        cancelButtonText: "Cancelar",
        ...swalSobreModal,
        ...confirmar,
      });
      if (!r.isConfirmed) return;
    }
    setOcupado(true);
    try {
      const { data } = await peticion();
      swalSuccess(exito, data?.message || "");
      await trasCambio();
    } catch (error) {
      handleApiError(error, { defaultMessage: errorMsg, warningTitle: "No se pudo completar" });
    } finally {
      setOcupado(false);
    }
  };

  // ---------- # pedido del proveedor ----------
  const capturarNumero = async (numero) => {
    const r = await Swal.fire({
      title: numero ? "Editar # pedido del proveedor" : "Agregar # pedido del proveedor",
      input: "text",
      inputValue: numero?.numero || "",
      inputAttributes: { maxlength: 60, autocomplete: "off" },
      inputPlaceholder: "Ej. PO-458812",
      showCancelButton: true,
      confirmButtonText: "Guardar",
      cancelButtonText: "Cancelar",
      inputValidator: (v) => (!String(v || "").trim() ? "Captura el número." : undefined),
      ...swalSobreModal,
    });
    if (!r.isConfirmed) return;
    const valor = String(r.value).trim();
    await ejecutar({
      peticion: () =>
        numero
          ? axios.put(`${apiUrl}/pedidos/recepcion/numeros/${numero.id}`, { numero: valor }, getAuthHeaders())
          : axios.post(`${apiUrl}/pedidos/recepcion/${pedidoId}/numeros`, { numero: valor }, getAuthHeaders()),
      exito: numero ? "# actualizado" : "# agregado",
      errorMsg: "No se pudo guardar el # de pedido del proveedor.",
    });
  };

  const eliminarNumero = (numero) =>
    ejecutar({
      confirmar: { title: `¿Eliminar el # ${numero.numero}?`, icon: "warning" },
      peticion: () => axios.delete(`${apiUrl}/pedidos/recepcion/numeros/${numero.id}`, getAuthHeaders()),
      exito: "# eliminado",
      errorMsg: "No se pudo eliminar el # de pedido del proveedor.",
    });

  // ---------- notas / facturas ----------
  const eliminarNota = (nota) =>
    ejecutar({
      confirmar: { title: `¿Eliminar la nota ${nota.numero_nota}?`, icon: "warning" },
      peticion: () => axios.delete(`${apiUrl}/pedidos/recepcion/notas/${nota.id}`, getAuthHeaders()),
      exito: "Nota eliminada",
      errorMsg: "No se pudo eliminar la nota de entrega.",
    });

  const eliminarFactura = (factura) =>
    ejecutar({
      confirmar: {
        title: `¿Eliminar la factura ${factura.numero_factura}?`,
        text: factura.notas?.some((n) => Number(n.pedido_id) !== Number(pedidoId))
          ? "También cubre notas de otros pedidos; desaparecerá de ellos."
          : undefined,
        icon: "warning",
      },
      peticion: () => axios.delete(`${apiUrl}/pedidos/recepcion/facturas/${factura.id}`, getAuthHeaders()),
      exito: "Factura eliminada",
      errorMsg: "No se pudo eliminar la factura.",
    });

  const confirmarDeshacer = async () => {
    setDeshacer((p) => ({ ...p, guardando: true }));
    try {
      const { data } = await axios.put(
        `${apiUrl}/pedidos/recepcion/notas/${deshacer.id}/deshacer`,
        { motivo: deshacer.motivo },
        getAuthHeaders()
      );
      swalSuccess("Recepción deshecha", data?.message || "");
      setDeshacer({ id: null, motivo: "", guardando: false });
      await trasCambio();
    } catch (error) {
      setDeshacer((p) => ({ ...p, guardando: false }));
      handleApiError(error, { defaultMessage: "No se pudo deshacer la recepción." });
    }
  };

  const cambiarCierre = (cerrar) =>
    ejecutar({
      confirmar: {
        title: cerrar ? "¿Marcar pedido como recibido?" : "¿Reabrir pedido?",
        text: cerrar
          ? pendientes > 0
            ? `Aún hay ${pendientes} nota(s) sin recibir. Almacén ya no podrá recibirlas hasta que se reabra.`
            : "Almacén ya no podrá recibir más notas en este pedido hasta que se reabra."
          : "Almacén podrá volver a recibir notas de entrega de este pedido.",
      },
      peticion: () =>
        axios.put(`${apiUrl}/pedidos/recepcion/${pedidoId}/${cerrar ? "cerrar" : "reabrir"}`, {}, getAuthHeaders()),
      exito: cerrar ? "Pedido recibido" : "Pedido reabierto",
      errorMsg: "No se pudo actualizar el pedido.",
    });

  const recibido = pedido?.estatus_recepcion === "recibido";
  const vencido = compromisoVencido(pedido);
  const numeros = pedido?.numeros || [];
  const notas = pedido?.notas || [];
  const facturas = pedido?.facturas || [];
  const pendientes = notas.filter((n) => Number(n.recibida) !== 1).length;

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth disableEnforceFocus>
        <DialogTitle sx={modalTitleSx}>
          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
            <span>Pedido #{pedidoId}</span>
            {pedido && <EstatusChip estatus={pedido.estatus_recepcion} />}
          </Stack>
          {pedido && (
            <Typography variant="body2" sx={{ color: "#546e7a", fontWeight: 400, mt: 0.5 }}>
              {pedido.proveedor_nombre} · creado {formatFechaHora(pedido.fecha_creacion)}
              {pedido.creado_por ? ` por ${pedido.creado_por}` : ""}
            </Typography>
          )}
        </DialogTitle>

        <DialogContent sx={modalContentSx}>
          {!pedido ? (
            <Stack alignItems="center" sx={{ py: 5 }}>
              <CircularProgress />
            </Stack>
          ) : (
            <Stack spacing={2}>
              {/* ---------- Datos del pedido ---------- */}
              <Box sx={{ p: 2, borderRadius: 2, border: "1px solid #e3f2fd", bgcolor: "#f8fbff" }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#1a237e" }}>
                    Datos del pedido
                  </Typography>
                  {puedeEditarPedido && (
                    <Button size="small" startIcon={<EditOutlinedIcon />} onClick={() => setEditarDatos(true)} sx={botonSx}>
                      Editar
                    </Button>
                  )}
                </Stack>
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Dato label="Fecha compromiso">
                      <Box component="span" sx={{ color: vencido ? "#d32f2f" : "inherit" }}>
                        {formatFecha(pedido.fecha_compromiso)}
                        {vencido ? " · vencida" : ""}
                      </Box>
                    </Dato>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Dato label="Piezas pedidas">
                      {fmtNum(pedido.piezas)} en {fmtNum(pedido.num_lineas)} línea(s)
                    </Dato>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Dato label="Notas recibidas">
                      {fmtNum(pedido.num_notas_recibidas)} de {fmtNum(pedido.num_notas)}
                    </Dato>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Dato label="Tarimas / cajas">
                      {fmtNum(pedido.tarimas)} / {fmtNum(pedido.cajas)}
                    </Dato>
                  </Grid>
                  {pedido.notas_planeacion && (
                    <Grid item xs={12}>
                      <Dato label="Notas del pedido">
                        <Box component="span" sx={{ fontWeight: 400, whiteSpace: "pre-wrap" }}>
                          {pedido.notas_planeacion}
                        </Box>
                      </Dato>
                    </Grid>
                  )}
                </Grid>
                {recibido && (
                  <Alert severity="success" variant="outlined" sx={{ mt: 2 }}>
                    Marcado como recibido por <strong>{pedido.recepcion_cerrada_por}</strong> el{" "}
                    {formatFechaHora(pedido.recepcion_cerrada_en)}.
                  </Alert>
                )}
              </Box>

              {/* ---------- # pedidos del proveedor ---------- */}
              <Seccion
                titulo="# Pedidos del proveedor"
                contador={numeros.length}
                accion={
                  puedeEditarPedido && (
                    <Button size="small" startIcon={<AddIcon />} onClick={() => capturarNumero(null)} disabled={ocupado} sx={botonSx}>
                      Agregar
                    </Button>
                  )
                }
              >
                {numeros.length === 0 ? (
                  <Vacio>Sin # de pedido del proveedor capturado.</Vacio>
                ) : (
                  <Stack direction="row" gap={1} flexWrap="wrap">
                    {numeros.map((n) => (
                      <Chip
                        key={n.id}
                        label={`${n.numero}${Number(n.num_notas) ? ` · ${n.num_notas} nota(s)` : ""}`}
                        sx={chipDocumentoSx("numero_proveedor")}
                        onClick={puedeEditarPedido ? () => capturarNumero(n) : undefined}
                        onDelete={puedeEditarPedido && !ocupado ? () => eliminarNumero(n) : undefined}
                        deleteIcon={
                          <Tooltip title="Eliminar" arrow>
                            <DeleteOutlineIcon />
                          </Tooltip>
                        }
                      />
                    ))}
                  </Stack>
                )}
              </Seccion>

              {/* ---------- Notas de entrega ---------- */}
              <Seccion
                titulo="Notas de entrega"
                contador={notas.length}
                accion={
                  puedeEditarPedido && (
                    <Button
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={() => setDlgNota({ open: true, nota: null })}
                      disabled={ocupado}
                      sx={botonSx}
                    >
                      Agregar
                    </Button>
                  )
                }
              >
                {notas.length === 0 ? (
                  <Vacio>
                    {puedeEditarPedido
                      ? "Agrega las notas de entrega que enviará el proveedor para que almacén pueda recibirlas."
                      : "Planeación todavía no ha registrado notas de entrega para este pedido."}
                  </Vacio>
                ) : (
                  <Stack divider={<Divider flexItem />} spacing={1.5}>
                    {notas.map((n) => {
                      const recibida = Number(n.recibida) === 1;
                      const enDeshacer = deshacer.id === n.id;
                      return (
                        <Box key={n.id}>
                          <Stack
                            direction={{ xs: "column", sm: "row" }}
                            spacing={1}
                            justifyContent="space-between"
                            alignItems={{ xs: "flex-start", sm: "center" }}
                          >
                            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                              <Chip size="small" label={`Nota ${n.numero_nota}`} sx={chipDocumentoSx("nota_entrega")} />
                              {n.numero_pedido_proveedor && (
                                <Chip size="small" label={n.numero_pedido_proveedor} sx={chipDocumentoSx("numero_proveedor")} />
                              )}
                              {(n.facturas || []).map((f) => (
                                <Chip key={f.id} size="small" label={`Fact. ${f.numero_factura}`} sx={chipDocumentoSx("factura")} />
                              ))}
                              <Chip
                                size="small"
                                icon={recibida ? <CheckCircleIcon /> : <ScheduleIcon />}
                                label={recibida ? "Recibida" : "Por llegar"}
                                color={recibida ? "success" : "warning"}
                                variant="outlined"
                              />
                            </Stack>

                            <Stack direction="row" spacing={0.5} alignItems="center">
                              {puedeRegistrar && !enDeshacer && (!recibido || recibida) && (
                                <Button
                                  size="small"
                                  variant={recibida ? "text" : "contained"}
                                  startIcon={recibida ? <EditOutlinedIcon /> : <MoveToInboxIcon />}
                                  onClick={() => setDlgRecibir(n)}
                                  disabled={ocupado}
                                  sx={botonSx}
                                >
                                  {recibida ? "Editar recepción" : "Recibir"}
                                </Button>
                              )}
                              {puedeRegistrar && recibida && !enDeshacer && (
                                <Tooltip title="Deshacer recepción" arrow>
                                  <IconButton
                                    size="small"
                                    color="warning"
                                    onClick={() => setDeshacer({ id: n.id, motivo: "", guardando: false })}
                                  >
                                    <UndoIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                              {puedeEditarPedido && (
                                <>
                                  <Tooltip title="Editar nota" arrow>
                                    <IconButton size="small" onClick={() => setDlgNota({ open: true, nota: n })} disabled={ocupado}>
                                      <EditOutlinedIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip
                                    title={
                                      recibida
                                        ? "Ya fue recibida; no se puede eliminar"
                                        : n.facturas?.length
                                        ? "Está ligada a una factura"
                                        : "Eliminar nota"
                                    }
                                    arrow
                                  >
                                    <span>
                                      <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() => eliminarNota(n)}
                                        disabled={ocupado || recibida || Boolean(n.facturas?.length)}
                                      >
                                        <DeleteOutlineIcon fontSize="small" />
                                      </IconButton>
                                    </span>
                                  </Tooltip>
                                </>
                              )}
                            </Stack>
                          </Stack>

                          {recibida ? (
                            <Typography variant="caption" sx={{ color: "#546e7a", display: "block", mt: 0.75 }}>
                              {fmtNum(n.tarimas)} tarima(s) · {fmtNum(n.cajas)} caja(s) · llegó{" "}
                              {formatFechaHora(n.fecha_recepcion)} · recibió <strong>{n.recibido_por}</strong>
                              {n.transportista ? ` · ${n.transportista}` : ""}
                              {n.recepcion_editada_por
                                ? ` · editado por ${n.recepcion_editada_por} el ${formatFechaHora(n.recepcion_editada_en)}`
                                : ""}
                            </Typography>
                          ) : (
                            n.recepcion_deshecha_por && (
                              <Typography variant="caption" sx={{ color: "#d32f2f", display: "block", mt: 0.75 }}>
                                Recepción deshecha por {n.recepcion_deshecha_por} el{" "}
                                {formatFechaHora(n.recepcion_deshecha_en)}: {n.motivo_deshacer}
                              </Typography>
                            )
                          )}
                          {recibida && n.observaciones_recepcion && (
                            <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: "pre-wrap" }}>
                              {n.observaciones_recepcion}
                            </Typography>
                          )}
                          {n.notas && (
                            <Typography variant="caption" sx={{ color: "#78909c", display: "block", mt: 0.25 }}>
                              Planeación: {n.notas}
                            </Typography>
                          )}

                          {enDeshacer && (
                            <Stack spacing={1} sx={{ mt: 1.5 }}>
                              <TextField
                                label="Motivo para deshacer la recepción"
                                size="small"
                                value={deshacer.motivo}
                                onChange={(e) => setDeshacer((p) => ({ ...p, motivo: e.target.value }))}
                                inputProps={{ maxLength: 255 }}
                                autoFocus
                              />
                              <Stack direction="row" spacing={1} justifyContent="flex-end">
                                <Button
                                  size="small"
                                  onClick={() => setDeshacer({ id: null, motivo: "", guardando: false })}
                                  disabled={deshacer.guardando}
                                  sx={{ textTransform: "none" }}
                                >
                                  Cancelar
                                </Button>
                                <Button
                                  size="small"
                                  variant="contained"
                                  color="warning"
                                  onClick={confirmarDeshacer}
                                  disabled={deshacer.guardando || deshacer.motivo.trim().length < 5}
                                  sx={{ textTransform: "none" }}
                                >
                                  Deshacer recepción
                                </Button>
                              </Stack>
                            </Stack>
                          )}
                        </Box>
                      );
                    })}
                  </Stack>
                )}
                {recibido && puedeRegistrar && pendientes > 0 && (
                  <Alert severity="info" variant="outlined" sx={{ mt: 1.5 }}>
                    El pedido está cerrado: para recibir las notas pendientes, planeación debe reabrirlo.
                  </Alert>
                )}
              </Seccion>

              {/* ---------- Facturas ---------- */}
              <Seccion
                titulo="Facturas"
                contador={facturas.length}
                accion={
                  puedeEditarPedido && (
                    <Tooltip title={notas.length ? "" : "Primero agrega una nota de entrega"} arrow>
                      <span>
                        <Button
                          size="small"
                          startIcon={<AddIcon />}
                          onClick={() => setDlgFactura({ open: true, factura: null })}
                          disabled={ocupado || notas.length === 0}
                          sx={botonSx}
                        >
                          Agregar
                        </Button>
                      </span>
                    </Tooltip>
                  )
                }
              >
                {facturas.length === 0 ? (
                  <Vacio>Sin facturas registradas.</Vacio>
                ) : (
                  <Stack divider={<Divider flexItem />} spacing={1.5}>
                    {facturas.map((f) => (
                      <Box key={f.id}>
                        <Stack
                          direction={{ xs: "column", sm: "row" }}
                          spacing={1}
                          justifyContent="space-between"
                          alignItems={{ xs: "flex-start", sm: "center" }}
                        >
                          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                            <Chip size="small" label={`Factura ${f.numero_factura}`} sx={chipDocumentoSx("factura")} />
                            <Typography variant="caption" sx={{ color: "#546e7a" }}>
                              cubre:
                            </Typography>
                            {(f.notas || []).map((n) => {
                              const otro = Number(n.pedido_id) !== Number(pedidoId);
                              return (
                                <Tooltip key={n.id} title={otro ? `Nota del pedido #${n.pedido_id}` : ""} arrow>
                                  <Chip
                                    size="small"
                                    label={`${n.numero_nota}${otro ? ` (pedido #${n.pedido_id})` : ""}`}
                                    variant={otro ? "outlined" : "filled"}
                                    sx={chipDocumentoSx("nota_entrega", otro ? { bgcolor: "transparent" } : {})}
                                  />
                                </Tooltip>
                              );
                            })}
                          </Stack>
                          {puedeEditarPedido && (
                            <Stack direction="row" spacing={0.5}>
                              <Tooltip title="Editar factura" arrow>
                                <IconButton
                                  size="small"
                                  disabled={ocupado}
                                  onClick={() =>
                                    setDlgFactura({
                                      open: true,
                                      factura: {
                                        ...f,
                                        notas: f.comentario || "",
                                        notas_entrega: (f.notas || []).map((n) => ({
                                          id: n.id,
                                          numero_nota: n.numero_nota,
                                          pedido_id: n.pedido_id,
                                          numero_pedido_proveedor: n.numero_pedido_proveedor,
                                          recibida: n.recibida,
                                        })),
                                      },
                                    })
                                  }
                                >
                                  <EditOutlinedIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Eliminar factura" arrow>
                                <IconButton size="small" color="error" onClick={() => eliminarFactura(f)} disabled={ocupado}>
                                  <DeleteOutlineIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          )}
                        </Stack>
                        {f.comentario && (
                          <Typography variant="caption" sx={{ color: "#78909c", display: "block", mt: 0.5 }}>
                            {f.comentario}
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </Stack>
                )}
              </Seccion>
            </Stack>
          )}
        </DialogContent>

        <DialogActions sx={{ ...modalActionsSx, justifyContent: "space-between" }}>
          <Box>
            {puedeEditarPedido && pedido && (
              <Button
                variant="outlined"
                color={recibido ? "warning" : "success"}
                startIcon={recibido ? <LockOpenOutlinedIcon /> : <TaskAltIcon />}
                onClick={() => cambiarCierre(!recibido)}
                disabled={ocupado}
                sx={{ ...botonSx, height: 44 }}
              >
                {recibido ? "Reabrir pedido" : "Marcar como recibido"}
              </Button>
            )}
          </Box>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={cargar} disabled={loading} sx={modalSecondaryButtonSx}>
              Actualizar
            </Button>
            <Button variant="contained" onClick={onClose} sx={modalPrimaryButtonSx}>
              Cerrar
            </Button>
          </Stack>
        </DialogActions>
      </Dialog>

      <DatosPedidoDialog
        open={editarDatos}
        pedido={pedido}
        onClose={() => setEditarDatos(false)}
        onGuardado={async () => {
          setEditarDatos(false);
          await trasCambio();
        }}
      />

      <NotaEntregaDialog
        open={dlgNota.open}
        pedido={pedido}
        nota={dlgNota.nota}
        onClose={() => setDlgNota({ open: false, nota: null })}
        onGuardado={async () => {
          setDlgNota({ open: false, nota: null });
          await trasCambio();
        }}
      />

      <FacturaDialog
        open={dlgFactura.open}
        pedido={pedido}
        factura={dlgFactura.factura}
        onClose={() => setDlgFactura({ open: false, factura: null })}
        onGuardado={async () => {
          setDlgFactura({ open: false, factura: null });
          await trasCambio();
        }}
      />

      <RegistrarRecepcionDialog
        open={Boolean(dlgRecibir)}
        pedido={pedido}
        nota={dlgRecibir}
        onClose={() => setDlgRecibir(null)}
        onGuardado={async () => {
          setDlgRecibir(null);
          await trasCambio();
        }}
      />
    </>
  );
};

export default DetallePedidoRecepcionDialog;
