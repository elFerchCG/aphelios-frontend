
import React, { useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormHelperText,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

// ============================================================
// ICONOS
// ============================================================

import RestartAltOutlinedIcon from "@mui/icons-material/RestartAltOutlined";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";

// ============================================================
// ESTILOS GLOBALES APHELIOS
// ============================================================

import {
  modalTitleSx,
  modalContentSx,
  modalActionsSx,
  modalPrimaryButtonSx,
  modalSecondaryButtonSx,
} from "../../../common/modalStyles";

// ============================================================
// MOTIVOS DE REAPERTURA
// ============================================================

const motivosReapertura = [
  {
    value: "problema_reaparecio",
    label: "El problema reapareció",
  },
  {
    value: "solucion_no_funciono",
    label: "La solución no funcionó",
  },
  {
    value: "otro_caso",
    label: "El problema ocurrió en otro caso",
  },
  {
    value: "otro",
    label: "Otro motivo",
  },
];

// ============================================================
// COMPONENTE
// ============================================================

const TicketAccionesPropietario = ({
  ticketId,
  permisos = {},
  onAccionCompletada,
}) => {
  // ==========================================================
  // API
  // ==========================================================

  const apiUrl =
    process.env.NODE_ENV === "production"
      ? process.env.REACT_APP_API_URL
      : process.env.REACT_APP_API_URL_LOCAL;

  // ==========================================================
  // ESTADOS
  // ==========================================================

  const [accion, setAccion] = useState(null);

  const [motivo, setMotivo] = useState("");
  const [detalle, setDetalle] = useState("");

  const [errores, setErrores] = useState({});
  const [loading, setLoading] = useState(false);
  const [errorApi, setErrorApi] = useState("");

  const esReapertura = accion === "reabrir";
  const esCancelacion = accion === "cancelar";

  // ==========================================================
  // ABRIR FORMULARIO
  // ==========================================================

  const abrirFormulario = (tipo) => {
    setAccion(tipo);
    setMotivo("");
    setDetalle("");
    setErrores({});
    setErrorApi("");
  };

  // ==========================================================
  // CERRAR FORMULARIO
  // ==========================================================

  const cerrarFormulario = () => {
    if (loading) return;

    setAccion(null);
    setMotivo("");
    setDetalle("");
    setErrores({});
    setErrorApi("");
  };

  // ==========================================================
  // VALIDAR FORMULARIO
  // ==========================================================

  const validarFormulario = () => {
    const nuevosErrores = {};

    // --------------------------------------------------------
    // REABRIR
    // --------------------------------------------------------

    if (esReapertura) {
      if (!motivo) {
        nuevosErrores.motivo = "Campo obligatorio.";
      }

      if (!detalle.trim()) {
        nuevosErrores.detalle = "Campo obligatorio.";
      } else if (detalle.trim().length > 2000) {
        nuevosErrores.detalle =
          "El detalle no puede superar los 2000 caracteres.";
      }
    }

    // --------------------------------------------------------
    // CANCELAR
    // --------------------------------------------------------

    if (esCancelacion) {
      if (!motivo.trim()) {
        nuevosErrores.motivo = "Campo obligatorio.";
      } else if (motivo.trim().length > 2000) {
        nuevosErrores.motivo =
          "El motivo no puede superar los 2000 caracteres.";
      }
    }

    setErrores(nuevosErrores);

    return Object.keys(nuevosErrores).length === 0;
  };

  // ==========================================================
  // EJECUTAR ACCIÓN
  // ==========================================================

  const ejecutarAccion = async (event) => {
    event.preventDefault();

    if (loading || !ticketId) return;
    if (!esReapertura && !esCancelacion) return;
    if (!validarFormulario()) return;

    // Guardar el tipo antes de actualizar estados.
    const tipoAccion = accion;
    const esReabrir = tipoAccion === "reabrir";

    // ========================================================
    // CONFIRMACIÓN
    // ========================================================

    const confirmacion = await Swal.fire({
      icon: "question",

      title: esReabrir
        ? "¿Reabrir ticket?"
        : "¿Cancelar ticket?",

      text: esReabrir
        ? "El ticket volverá a estar en revisión."
        : "El ticket quedará cancelado y no podrá reabrirse.",

      showCancelButton: true,

      confirmButtonText: esReabrir
        ? "Sí, reabrir"
        : "Sí, cancelar ticket",

      cancelButtonText: "Cancelar",

      confirmButtonColor: "#1976d2",
      cancelButtonColor: "#6c757d",

      reverseButtons: true,

      customClass: {
        container: "mi-swal",
      },
    });

    if (!confirmacion.isConfirmed) return;

    // ========================================================
    // PETICIÓN
    // ========================================================

    try {
      setLoading(true);
      setErrorApi("");

      const token = localStorage.getItem("token");

      const endpoint = esReabrir
        ? "reabrir"
        : "cancelar";

      const payload = esReabrir
        ? {
            motivo,
            detalle: detalle.trim(),
          }
        : {
            motivo: motivo.trim(),
          };

      const response = await axios.post(
        `${apiUrl}/tickets/${ticketId}/${endpoint}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      // ======================================================
      // LIMPIAR FORMULARIO
      // ======================================================

      setAccion(null);
      setMotivo("");
      setDetalle("");
      setErrores({});
      setErrorApi("");

      // ======================================================
      // ACTUALIZAR DETALLE DEL TICKET
      // ======================================================

      try {
        await onAccionCompletada?.(response.data?.ticket);
      } catch (refreshError) {
        console.error(
          "[Soporte] No se pudo refrescar el detalle:",
          refreshError,
        );
      }

      // ======================================================
      // MENSAJE DE ÉXITO
      // ======================================================

      await Swal.fire({
        icon: "success",

        title: esReabrir
          ? "Ticket reabierto"
          : "Ticket cancelado",

        text:
          response.data?.message ||
          "La operación se realizó correctamente.",

        timer: 2000,
        showConfirmButton: false,

        customClass: {
          container: "mi-swal",
        },
      });
    } catch (error) {
      console.error(
        "[Soporte] Error ejecutando acción del propietario:",
        error,
      );

      setErrorApi(
        error.response?.data?.message ||
          "No se pudo completar la operación.",
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // VISIBILIDAD
  // ==========================================================

  if (!permisos.puedeReabrir && !permisos.puedeCancelar) {
    return null;
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <>
      {/* =====================================================
          ACCIONES DEL PROPIETARIO
      ====================================================== */}

      <Box>
        <Stack spacing={2}>
          <Box>
            <Typography
              variant="subtitle1"
              fontWeight={700}
            >
              Acciones del propietario
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
            >
              Administra el seguimiento de tu ticket.
            </Typography>
          </Box>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
          >
            {permisos.puedeReabrir && (
              <Button
                variant="outlined"
                color="primary"
                startIcon={<RestartAltOutlinedIcon />}
                onClick={() => abrirFormulario("reabrir")}
                disabled={loading}
              >
                Reabrir ticket
              </Button>
            )}

            {permisos.puedeCancelar && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<CancelOutlinedIcon />}
                onClick={() => abrirFormulario("cancelar")}
                disabled={loading}
              >
                Cancelar ticket
              </Button>
            )}
          </Stack>
        </Stack>
      </Box>

      {/* =====================================================
          MODAL REABRIR / CANCELAR
      ====================================================== */}

      <Dialog
        open={Boolean(accion)}
        onClose={cerrarFormulario}
        fullWidth
        maxWidth="sm"
        disableEscapeKeyDown={loading}
        sx={{
          zIndex: (theme) => theme.zIndex.modal + 2,
        }}
        PaperProps={{
          sx: {
            borderRadius: 2,
          },
        }}
      >
        {/* ===================================================
            HEADER
        ==================================================== */}

        <DialogTitle sx={modalTitleSx}>
          <Stack
            direction="row"
            alignItems="flex-start"
            justifyContent="space-between"
            spacing={2}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="h6"
                fontWeight={700}
                sx={{
                  color: "#1a237e",
                }}
              >
                {esReapertura
                  ? "Reabrir ticket"
                  : "Cancelar ticket"}
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 1 }}
              >
                {esReapertura
                  ? "Solicita nuevamente atención para tu ticket."
                  : "Indica por qué deseas cancelar tu solicitud."}
              </Typography>
            </Box>

            {/* SOLO ICONO X */}

            <IconButton
              onClick={cerrarFormulario}
              disabled={loading}
              size="small"
              aria-label="Cerrar modal"
            >
              <CloseOutlinedIcon />
            </IconButton>
          </Stack>
        </DialogTitle>

        <Divider />


        {/* ===================================================
            FORMULARIO
        ==================================================== */}

        <Box
          component="form"
          onSubmit={ejecutarAccion}
          noValidate
        >
          <DialogContent sx={modalContentSx}>
            <Stack spacing={3}>
              {/* =================================================
                  ERROR DEL BACKEND
              ================================================== */}

              {errorApi && (
                <Alert severity="error">
                  {errorApi}
                </Alert>
              )}

              {/* =================================================
                  REABRIR TICKET
              ================================================== */}

              {esReapertura && (
                <>
                  {/* MOTIVO */}

                  <FormControl
                    fullWidth
                    required
                    error={Boolean(errores.motivo)}
                  >
                    <InputLabel id="motivo-reapertura-label">
                      Motivo de reapertura
                    </InputLabel>

                    <Select
                      labelId="motivo-reapertura-label"
                      value={motivo}
                      label="Motivo de reapertura"
                      MenuProps={{
                        sx: {
                          zIndex: (theme) =>
                            theme.zIndex.modal + 3,
                        },
                        PaperProps: {
                          sx: {
                            maxHeight: 300,
                          },
                        },
                      }}
                      onChange={(event) => {
                        setMotivo(event.target.value);

                        setErrores((prev) => ({
                          ...prev,
                          motivo: "",
                        }));
                      }}
                    >
                      {motivosReapertura.map((item) => (
                        <MenuItem
                          key={item.value}
                          value={item.value}
                        >
                          {item.label}
                        </MenuItem>
                      ))}
                    </Select>

                    {errores.motivo && (
                      <FormHelperText>
                        {errores.motivo}
                      </FormHelperText>
                    )}
                  </FormControl>

                  {/* DETALLE */}

                  <TextField
                    label="Explica por qué necesitas reabrirlo"
                    value={detalle}
                    onChange={(event) => {
                      setDetalle(event.target.value);

                      setErrores((prev) => ({
                        ...prev,
                        detalle: "",
                      }));
                    }}
                    required
                    fullWidth
                    multiline
                    minRows={4}
                    inputProps={{
                      maxLength: 2000,
                    }}
                    error={Boolean(errores.detalle)}
                    helperText={
                      errores.detalle ||
                      `${detalle.length}/2000 caracteres`
                    }
                  />
                </>
              )}

              {/* =================================================
                  CANCELAR TICKET
              ================================================== */}

              {esCancelacion && (
                <TextField
                  label="Motivo de cancelación"
                  value={motivo}
                  onChange={(event) => {
                    setMotivo(event.target.value);

                    setErrores((prev) => ({
                      ...prev,
                      motivo: "",
                    }));
                  }}
                  required
                  fullWidth
                  multiline
                  minRows={4}
                  inputProps={{
                    maxLength: 2000,
                  }}
                  error={Boolean(errores.motivo)}
                  helperText={
                    errores.motivo ||
                    `${motivo.length}/2000 caracteres`
                  }
                />
              )}
            </Stack>
          </DialogContent>

          {/* ===================================================
              BOTONES
          ==================================================== */}

          <DialogActions sx={modalActionsSx}>
            {/* CANCELAR */}

            <Button
              variant="outlined"
              sx={modalSecondaryButtonSx}
              onClick={cerrarFormulario}
              disabled={loading}
            >
              Cancelar
            </Button>

            {/* CONFIRMAR */}

            <Button
              type="submit"
              variant="contained"
              sx={modalPrimaryButtonSx}
              disabled={loading}
              startIcon={
                loading ? (
                  <CircularProgress
                    size={18}
                    color="inherit"
                  />
                ) : esReapertura ? (
                  <RestartAltOutlinedIcon />
                ) : (
                  <CancelOutlinedIcon />
                )
              }
            >
              {loading
                ? "Procesando..."
                : esReapertura
                  ? "Reabrir ticket"
                  : "Cancelar ticket"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </>
  );
};

export default TicketAccionesPropietario;
