import React, { useCallback, useEffect, useState } from "react";

import axios from "axios";

import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";

// ============================================================
// ICONOS
// ============================================================

import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import ConfirmationNumberOutlinedIcon from "@mui/icons-material/ConfirmationNumberOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ForumOutlinedIcon from "@mui/icons-material/ForumOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";

// ============================================================
// HELPERS
// ============================================================

import {
  obtenerColorEstatus,
  obtenerColorPrioridad,
  obtenerTextoEstatus,
  obtenerTextoPrioridad,
} from "../helpers/soporteHelpers";

// ============================================================
// COMPONENTES DEL DETALLE
// ============================================================

import TicketInfo from "../detalle/TicketInfo";
import TicketGestion from "../detalle/TicketGestion";
import TicketAdjuntos from "../detalle/TicketAdjuntos";
import TicketConversacion from "../detalle/TicketConversacion";
import TicketHistorial from "../detalle/TicketHistorial";
import TicketAccionesPropietario from "../detalle/TicketAccionesPropietario";

// ============================================================
// HELPERS LOCALES
// ============================================================

const obtenerTextoImpacto = (impacto) => {
  const opciones = {
    bajo: "Bajo",
    medio: "Medio",
    alto: "Alto",
    general: "General",
  };

  return opciones[impacto] || impacto || "-";
};

// ============================================================
// COMPONENTE
// ============================================================

const TicketDetalleModal = ({
  open,
  ticketId,
  desarrolladores = [],
  onClose,
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

  const [data, setData] = useState(null);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [tabActual, setTabActual] = useState(0);

  // ==========================================================
  // OBTENER DETALLE
  // ==========================================================

  const obtenerDetalle = useCallback(async () => {
    if (!ticketId) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      const response = await axios.get(`${apiUrl}/tickets/${ticketId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setData(response.data);
    } catch (error) {
      console.error("Error obteniendo detalle del ticket:", error);

      setError(
        error.response?.data?.message ||
          "No se pudo obtener el detalle del ticket.",
      );
    } finally {
      setLoading(false);
    }
  }, [apiUrl, ticketId]);

  // ==========================================================
  // ACCIÓN DEL PROPIETARIO COMPLETADA
  // ==========================================================

  const handleAccionPropietarioCompletada = async () => {
    // Volvemos a consultar el backend para obtener:
    // - Nuevo estatus
    // - Permisos actualizados
    // - Historial actualizado
    // - Fechas actualizadas
    // - Número de reaperturas

    await obtenerDetalle();
  };

  // ==========================================================
  // ACTUALIZAR TICKET DESDE UN HIJO
  // ==========================================================

  const handleTicketActualizado = (ticketActualizado) => {
    if (!ticketActualizado) {
      return;
    }

    setData((prev) => {
      if (!prev) {
        return prev;
      }

      const tieneAsignadoId = Object.prototype.hasOwnProperty.call(
        ticketActualizado,
        "asignado_a",
      );

      const tieneAsignadoNombre = Object.prototype.hasOwnProperty.call(
        ticketActualizado,
        "asignado_nombre",
      );

      const debeActualizarAsignado = tieneAsignadoId || tieneAsignadoNombre;

      const nuevoEstatus = ticketActualizado.estatus ?? prev.ticket.estatus;

      const estaFinalizado = ["resuelto", "cerrado", "cancelado"].includes(
        nuevoEstatus,
      );

      return {
        ...prev,

        ticket: {
          ...prev.ticket,

          asignado: debeActualizarAsignado
            ? {
                id:
                  ticketActualizado.asignado_a ??
                  prev.ticket.asignado?.id ??
                  null,

                nombre:
                  ticketActualizado.asignado_nombre ??
                  prev.ticket.asignado?.nombre ??
                  null,
              }
            : prev.ticket.asignado,

          estatus: nuevoEstatus,

          prioridad: ticketActualizado.prioridad ?? prev.ticket.prioridad,

          resolucion: ticketActualizado.resolucion ?? prev.ticket.resolucion,

          fechas: {
            ...prev.ticket.fechas,

            ultimaActividad:
              ticketActualizado.fecha_ultima_actividad ??
              prev.ticket.fechas?.ultimaActividad,

            primeraRespuesta:
              ticketActualizado.fecha_primera_respuesta ??
              prev.ticket.fechas?.primeraRespuesta,

            resolucion:
              ticketActualizado.fecha_resolucion ??
              prev.ticket.fechas?.resolucion,

            cierre:
              ticketActualizado.fecha_cierre ?? prev.ticket.fechas?.cierre,
          },
        },

        // Si termina el ticket,
        // desactivamos inmediatamente
        // las acciones de soporte.
        permisos: estaFinalizado
          ? {
              ...prev.permisos,

              puedeResponder: false,

              puedeAsignar: false,

              puedeCambiarEstatus: false,

              puedeCambiarPrioridad: false,

              puedeResolver: false,
            }
          : prev.permisos,
      };
    });
  };

  // ==========================================================
  // MENSAJE CREADO DESDE UN HIJO
  // ==========================================================

  const handleMensajeCreado = ({ mensaje, estatus }) => {
    if (!mensaje) {
      return;
    }

    setData((prev) => {
      if (!prev) {
        return prev;
      }

      // Esto además nos servirá
      // cuando metamos Socket.IO.
      const yaExiste = (prev.mensajes || []).some(
        (item) => Number(item.id) === Number(mensaje.id),
      );

      return {
        ...prev,

        ticket: {
          ...prev.ticket,

          estatus: estatus || prev.ticket.estatus,

          fechas: {
            ...prev.ticket.fechas,

            ultimaActividad:
              mensaje.fecha_creacion || prev.ticket.fechas?.ultimaActividad,
          },
        },

        mensajes: yaExiste
          ? prev.mensajes
          : [...(prev.mensajes || []), mensaje],
      };
    });
  };

  // ==========================================================
  // ABRIR / CAMBIAR TICKET
  // ==========================================================

  useEffect(() => {
    if (!open || !ticketId) {
      return;
    }

    setData(null);
    setError("");

    // Siempre abrimos un ticket
    // desde Información.
    setTabActual(0);

    obtenerDetalle();
  }, [open, ticketId, obtenerDetalle]);

  // ==========================================================
  // DATA DERIVADA
  // ==========================================================

  const ticket = data?.ticket;

  const adjuntos = data?.adjuntos || [];

  const historial = data?.historial || [];

  const mensajes = data?.mensajes || [];

  const permisos = data?.permisos || {};

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="lg"
      disableEnforceFocus
      PaperProps={{
        sx: {
          borderRadius: 3,

          minHeight: {
            md: "72vh",
          },

          maxHeight: "90vh",
        },
      }}
    >
      {/* =====================================================
          HEADER
      ===================================================== */}

      <DialogTitle
        sx={{
          px: 3,
          py: 2.5,
        }}
      >
        <Box
          sx={{
            display: "flex",

            justifyContent: "space-between",

            alignItems: "flex-start",

            gap: 2,
          }}
        >
          <Box
            sx={{
              display: "flex",
              gap: 1.5,
              minWidth: 0,
            }}
          >
            <ConfirmationNumberOutlinedIcon
              color="primary"
              sx={{
                fontSize: 30,
                mt: 0.2,
              }}
            />

            <Box
              sx={{
                minWidth: 0,
              }}
            >
              <Typography variant="h6" fontWeight={700}>
                {ticket?.folio || "Detalle del ticket"}
              </Typography>

              {ticket?.asunto && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    mt: 0.25,
                  }}
                >
                  {ticket.asunto}
                </Typography>
              )}
            </Box>
          </Box>

          <IconButton onClick={onClose} size="small">
            <CloseOutlinedIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <Divider />

      {/* =====================================================
          CONTENIDO
      ===================================================== */}

      <DialogContent
        sx={{
          px: 0,
          py: 0,
        }}
      >
        {/* ===================================================
            LOADING
        =================================================== */}

        {loading && (
          <Box
            sx={{
              minHeight: 400,

              display: "flex",

              alignItems: "center",

              justifyContent: "center",
            }}
          >
            <Stack alignItems="center" spacing={2}>
              <CircularProgress />

              <Typography variant="body2" color="text.secondary">
                Cargando ticket...
              </Typography>
            </Stack>
          </Box>
        )}

        {/* ===================================================
            ERROR
        =================================================== */}

        {!loading && error && (
          <Box sx={{ p: 3 }}>
            <Alert severity="error">{error}</Alert>
          </Box>
        )}

        {/* ===================================================
            TICKET
        =================================================== */}

        {!loading && !error && ticket && (
          <>
            {/* =============================================
                  RESUMEN SUPERIOR
              ============================================= */}

            <Box
              sx={{
                px: 3,
                pt: 2.5,
                pb: 2,
              }}
            >
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip
                  size="small"
                  label={obtenerTextoEstatus(ticket.estatus)}
                  color={obtenerColorEstatus(ticket.estatus)}
                />

                <Chip
                  size="small"
                  variant="outlined"
                  label={`Prioridad: ${obtenerTextoPrioridad(
                    ticket.prioridad,
                  )}`}
                  color={obtenerColorPrioridad(ticket.prioridad)}
                />

                <Chip
                  size="small"
                  variant="outlined"
                  label={`Impacto: ${obtenerTextoImpacto(ticket.impacto)}`}
                />
              </Stack>
            </Box>

            {/* =============================================
                  TABS
              ============================================= */}

            <Box
              sx={{
                px: {
                  xs: 1,
                  sm: 2,
                  md: 3,
                },

                borderBottom: 1,

                borderColor: "divider",
              }}
            >
              <Tabs
                value={tabActual}
                onChange={(event, nuevoValor) => {
                  setTabActual(nuevoValor);
                }}
                variant="scrollable"
                scrollButtons="auto"
              >
                <Tab
                  icon={<InfoOutlinedIcon />}
                  iconPosition="start"
                  label="Información"
                  sx={{
                    textTransform: "none",
                  }}
                />

                <Tab
                  icon={<ForumOutlinedIcon />}
                  iconPosition="start"
                  label={
                    mensajes.length > 0
                      ? `Conversación (${mensajes.length})`
                      : "Conversación"
                  }
                  sx={{
                    textTransform: "none",
                  }}
                />

                <Tab
                  icon={<HistoryOutlinedIcon />}
                  iconPosition="start"
                  label={
                    historial.length > 0
                      ? `Historial (${historial.length})`
                      : "Historial"
                  }
                  sx={{
                    textTransform: "none",
                  }}
                />
              </Tabs>
            </Box>

            {/* =============================================
                  CONTENIDO DE TABS
              ============================================= */}

            <Box
              sx={{
                p: {
                  xs: 2,
                  md: 3,
                },
              }}
            >
              {/* =====================================================
    TAB 0 - INFORMACIÓN
===================================================== */}

              {tabActual === 0 && (
                <Stack spacing={3}>
                  {/* =====================================================
        INFORMACIÓN DEL TICKET
    ====================================================== */}

                  <TicketInfo ticket={ticket} />

                  {/* =====================================================
        ACCIONES DEL PROPIETARIO
        REABRIR / CANCELAR
    ====================================================== */}

                  {(permisos.puedeReabrir || permisos.puedeCancelar) && (
                    <>
                      <Divider />

                      <TicketAccionesPropietario
                        ticketId={ticketId}
                        permisos={permisos}
                        onAccionCompletada={handleAccionPropietarioCompletada}
                      />
                    </>
                  )}

                  {/* =====================================================
        GESTIÓN DE DESARROLLO
    ====================================================== */}

                  {(permisos.puedeAsignar ||
                    permisos.puedeCambiarEstatus ||
                    permisos.puedeCambiarPrioridad ||
                    permisos.puedeResolver) && (
                    <>
                      <Divider />

                      <TicketGestion
                        ticketId={ticketId}
                        ticket={ticket}
                        permisos={permisos}
                        desarrolladores={desarrolladores}
                        onTicketActualizado={handleTicketActualizado}
                        onMensajeCreado={handleMensajeCreado}
                      />
                    </>
                  )}

                  {/* =====================================================
        ADJUNTOS
    ====================================================== */}

                  <Divider />

                  <TicketAdjuntos adjuntos={adjuntos} />
                </Stack>
              )}

              {/* ===========================================
                    TAB 1
                    CONVERSACIÓN
                =========================================== */}

              {tabActual === 1 && (
                <TicketConversacion
                  ticketId={ticketId}
                  ticket={ticket}
                  mensajes={mensajes}
                  permisos={permisos}
                  onMensajeCreado={handleMensajeCreado}
                />
              )}

              {/* ===========================================
                    TAB 2
                    HISTORIAL
                =========================================== */}

              {tabActual === 2 && <TicketHistorial historial={historial} />}
            </Box>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TicketDetalleModal;
