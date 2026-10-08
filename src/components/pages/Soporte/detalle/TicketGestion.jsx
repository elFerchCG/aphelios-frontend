import React, { useState } from "react";
import axios from "axios";

import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Divider,
  FormControl,
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

import AssignmentIndOutlinedIcon from "@mui/icons-material/AssignmentIndOutlined";
import QuestionAnswerOutlinedIcon from "@mui/icons-material/QuestionAnswerOutlined";
import TaskAltOutlinedIcon from "@mui/icons-material/TaskAltOutlined";

// ============================================================
// HELPERS
// ============================================================

import {
  swalSuccess,
  swalError,
  swalTextarea,
} from "../../../../helpers/sweetAlert";

// ============================================================
// ESTATUS
// ============================================================

const ESTATUS_LABELS = {
  abierto: "Abierto",
  en_revision: "En revisión",
  en_desarrollo: "En desarrollo",
  esperando_usuario: "Esperando usuario",
  resuelto: "Resuelto",
  cerrado: "Cerrado",
  cancelado: "Cancelado",
};

// ============================================================
// TRANSICIONES NORMALES DE ESTATUS
// ============================================================
//
// esperando_usuario:
//   Se alcanza mediante "Solicitar información".
//
// resuelto:
//   Se alcanza mediante "Resolver ticket".
//
// cerrado / cancelado:
//   No forman parte del cambio normal.
//
// ============================================================

const TRANSICIONES_ESTATUS = {
  abierto: ["en_revision"],

  en_revision: ["en_desarrollo"],

  en_desarrollo: ["en_revision"],

  esperando_usuario: ["en_revision"],
};

// ============================================================
// PRIORIDADES
// ============================================================

const PRIORIDAD_LABELS = {
  baja: "Baja",
  normal: "Normal",
  alta: "Alta",
  critica: "Crítica",
};

const PRIORIDADES = [
  "baja",
  "normal",
  "alta",
  "critica",
];

// ============================================================
// COMPONENTE
// ============================================================

const TicketGestion = ({
  ticketId,
  ticket,
  permisos = {},
  desarrolladores = [],
  onTicketActualizado,
  onMensajeCreado,
}) => {
  // ==========================================================
  // API
  // ==========================================================

  const apiUrl =
    process.env.NODE_ENV === "production"
      ? process.env.REACT_APP_API_URL
      : process.env.REACT_APP_API_URL_LOCAL;

  // ==========================================================
  // ESTADOS - ASIGNACIÓN
  // ==========================================================

  const [
    asignando,
    setAsignando,
  ] = useState(false);

  const [
    errorAsignacion,
    setErrorAsignacion,
  ] = useState("");

  // ==========================================================
  // ESTADOS - ESTATUS
  // ==========================================================

  const [
    cambiandoEstatus,
    setCambiandoEstatus,
  ] = useState(false);

  const [
    errorEstatus,
    setErrorEstatus,
  ] = useState("");

  // ==========================================================
  // ESTADOS - PRIORIDAD
  // ==========================================================

  const [
    cambiandoPrioridad,
    setCambiandoPrioridad,
  ] = useState(false);

  const [
    errorPrioridad,
    setErrorPrioridad,
  ] = useState("");

  // ==========================================================
  // ESTADOS - SOLICITAR INFORMACIÓN
  // ==========================================================

  const [
    solicitandoInformacion,
    setSolicitandoInformacion,
  ] = useState(false);

  const [
    errorSolicitarInformacion,
    setErrorSolicitarInformacion,
  ] = useState("");

  // ==========================================================
  // ESTADOS - RESOLVER
  // ==========================================================

  const [
    resolviendo,
    setResolviendo,
  ] = useState(false);

  const [
    errorResolucion,
    setErrorResolucion,
  ] = useState("");

  // ==========================================================
  // ASIGNAR TICKET
  // ==========================================================

  const handleAsignarTicket = async (
    desarrollador,
  ) => {
    if (!desarrollador?.id_usuario) {
      return;
    }

    const desarrolladorId = Number(
      desarrollador.id_usuario,
    );

    if (
      Number(ticket?.asignado?.id) ===
      desarrolladorId
    ) {
      return;
    }

    try {
      setAsignando(true);
      setErrorAsignacion("");

      const token =
        localStorage.getItem("token");

      const response = await axios.patch(
        `${apiUrl}/tickets/${ticketId}/asignacion`,
        {
          asignadoA: desarrolladorId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const ticketActualizado =
        response.data?.ticket;

      if (
        ticketActualizado &&
        onTicketActualizado
      ) {
        onTicketActualizado(
          ticketActualizado,
        );
      }

      await swalSuccess(
        "Asignación realizada",
        response.data?.message ||
          `El ticket fue asignado a ${desarrollador.nombre}.`,
      );
    } catch (error) {
      console.error(
        "Error asignando ticket:",
        error,
      );

      const mensajeError =
        error.response?.data?.message ||
        "No se pudo asignar el ticket.";

      setErrorAsignacion(
        mensajeError,
      );

      await swalError(
        "Error al asignar",
        mensajeError,
      );
    } finally {
      setAsignando(false);
    }
  };

  // ==========================================================
  // CAMBIAR ESTATUS
  // ==========================================================

  const handleCambiarEstatus = async (
    nuevoEstatus,
  ) => {
    if (!nuevoEstatus) {
      return;
    }

    if (
      nuevoEstatus === ticket?.estatus
    ) {
      return;
    }

    try {
      setCambiandoEstatus(true);
      setErrorEstatus("");

      const token =
        localStorage.getItem("token");

      const response = await axios.patch(
        `${apiUrl}/tickets/${ticketId}/estatus`,
        {
          estatus: nuevoEstatus,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const ticketActualizado =
        response.data?.ticket;

      if (
        ticketActualizado &&
        onTicketActualizado
      ) {
        onTicketActualizado(
          ticketActualizado,
        );
      }

      await swalSuccess(
        "Estatus actualizado",
        response.data?.message ||
          "El estatus del ticket fue actualizado correctamente.",
      );
    } catch (error) {
      console.error(
        "Error cambiando estatus:",
        error,
      );

      const mensajeError =
        error.response?.data?.message ||
        "No se pudo cambiar el estatus del ticket.";

      setErrorEstatus(
        mensajeError,
      );

      await swalError(
        "Error al cambiar estatus",
        mensajeError,
      );
    } finally {
      setCambiandoEstatus(false);
    }
  };

  // ==========================================================
  // CAMBIAR PRIORIDAD
  // ==========================================================

  const handleCambiarPrioridad = async (
    nuevaPrioridad,
  ) => {
    if (!nuevaPrioridad) {
      return;
    }

    if (
      nuevaPrioridad ===
      ticket?.prioridad
    ) {
      return;
    }

    let motivo = "";

    // ========================================================
    // PRIORIDAD CRÍTICA REQUIERE MOTIVO
    // ========================================================

    if (nuevaPrioridad === "critica") {
      const resultado =
        await swalTextarea({
          title:
            "Marcar como prioridad crítica",

          text:
            "Indica por qué este ticket debe tratarse como crítico.",

          placeholder:
            "Ej. El problema impide operar el módulo de producción...",

          confirmButtonText:
            "Cambiar a crítica",

          cancelButtonText:
            "Cancelar",

          maxLength: 1000,

          requiredMessage:
            "Debes indicar el motivo de la prioridad crítica.",
        });

      if (!resultado.isConfirmed) {
        return;
      }

      motivo =
        resultado.value?.trim() || "";

      if (!motivo) {
        return;
      }
    }

    try {
      setCambiandoPrioridad(true);
      setErrorPrioridad("");

      const token =
        localStorage.getItem("token");

      const response = await axios.patch(
        `${apiUrl}/tickets/${ticketId}/prioridad`,
        {
          prioridad:
            nuevaPrioridad,

          motivo:
            motivo || undefined,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const ticketActualizado =
        response.data?.ticket;

      if (
        ticketActualizado &&
        onTicketActualizado
      ) {
        onTicketActualizado(
          ticketActualizado,
        );
      }

      await swalSuccess(
        "Prioridad actualizada",
        response.data?.message ||
          "La prioridad del ticket fue actualizada correctamente.",
      );
    } catch (error) {
      console.error(
        "Error cambiando prioridad:",
        error,
      );

      const mensajeError =
        error.response?.data?.message ||
        "No se pudo cambiar la prioridad del ticket.";

      setErrorPrioridad(
        mensajeError,
      );

      await swalError(
        "Error al cambiar prioridad",
        mensajeError,
      );
    } finally {
      setCambiandoPrioridad(false);
    }
  };

  // ==========================================================
  // SOLICITAR INFORMACIÓN
  // ==========================================================

  const handleSolicitarInformacion =
    async () => {
      const resultado =
        await swalTextarea({
          title:
            "Solicitar información",

          text:
            "Indica qué información necesitas del usuario para continuar con el ticket.",

          placeholder:
            "Ej. ¿Podrías indicarnos qué producto estabas intentando procesar y adjuntar una captura del error?",

          confirmButtonText:
            "Solicitar información",

          cancelButtonText:
            "Cancelar",

          maxLength: 10000,

          requiredMessage:
            "Debes indicar qué información necesitas del usuario.",
        });

      if (!resultado.isConfirmed) {
        return;
      }

      const mensaje =
        resultado.value?.trim();

      if (!mensaje) {
        return;
      }

      try {
        setSolicitandoInformacion(
          true,
        );

        setErrorSolicitarInformacion(
          "",
        );

        const token =
          localStorage.getItem(
            "token",
          );

        const response =
          await axios.post(
            `${apiUrl}/tickets/${ticketId}/solicitar-informacion`,
            {
              mensaje,
            },
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            },
          );

        const ticketActualizado =
          response.data?.ticket;

        const mensajeCreado =
          response.data?.mensaje;

        // ====================================================
        // ACTUALIZAR TICKET
        // ====================================================

        if (
          ticketActualizado &&
          onTicketActualizado
        ) {
          onTicketActualizado(
            ticketActualizado,
          );
        }

        // ====================================================
        // AGREGAR MENSAJE A CONVERSACIÓN
        // ====================================================

        if (
          mensajeCreado &&
          onMensajeCreado
        ) {
          onMensajeCreado({
            mensaje:
              mensajeCreado,

            estatus:
              ticketActualizado
                ?.estatus ||
              "esperando_usuario",
          });
        }

        await swalSuccess(
          "Información solicitada",
          response.data?.message ||
            "Se solicitó información adicional al usuario.",
        );
      } catch (error) {
        console.error(
          "Error solicitando información:",
          error,
        );

        const mensajeError =
          error.response?.data
            ?.message ||
          "No se pudo solicitar información al usuario.";

        setErrorSolicitarInformacion(
          mensajeError,
        );

        await swalError(
          "Error al solicitar información",
          mensajeError,
        );
      } finally {
        setSolicitandoInformacion(
          false,
        );
      }
    };

  // ==========================================================
  // RESOLVER TICKET
  // ==========================================================

  const handleResolverTicket =
    async () => {
      const resultado =
        await swalTextarea({
          title:
            "Resolver ticket",

          text:
            "Describe la solución aplicada antes de marcar el ticket como resuelto.",

          placeholder:
            "Ej. Se corrigió la validación del formulario y se verificó el flujo con el usuario...",

          confirmButtonText:
            "Resolver ticket",

          cancelButtonText:
            "Cancelar",

          maxLength: 10000,

          requiredMessage:
            "Debes indicar la resolución del ticket.",
        });

      if (!resultado.isConfirmed) {
        return;
      }

      const resolucion =
        resultado.value?.trim();

      if (!resolucion) {
        return;
      }

      try {
        setResolviendo(true);
        setErrorResolucion("");

        const token =
          localStorage.getItem(
            "token",
          );

        const response =
          await axios.post(
            `${apiUrl}/tickets/${ticketId}/resolver`,
            {
              resolucion,
            },
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            },
          );

        const ticketActualizado =
          response.data?.ticket;

        const mensajeCreado =
          response.data?.mensaje;

        // ====================================================
        // ACTUALIZAR TICKET
        // ====================================================

        if (
          ticketActualizado &&
          onTicketActualizado
        ) {
          onTicketActualizado(
            ticketActualizado,
          );
        }

        // ====================================================
        // SI EL BACKEND DEVUELVE MENSAJE, AGREGARLO
        // ====================================================

        if (
          mensajeCreado &&
          onMensajeCreado
        ) {
          onMensajeCreado({
            mensaje:
              mensajeCreado,

            estatus:
              ticketActualizado
                ?.estatus ||
              "resuelto",
          });
        }

        await swalSuccess(
          "Ticket resuelto",
          response.data?.message ||
            "El ticket fue marcado como resuelto correctamente.",
        );
      } catch (error) {
        console.error(
          "Error resolviendo ticket:",
          error,
        );

        const mensajeError =
          error.response?.data
            ?.message ||
          "No se pudo resolver el ticket.";

        setErrorResolucion(
          mensajeError,
        );

        await swalError(
          "Error al resolver ticket",
          mensajeError,
        );
      } finally {
        setResolviendo(false);
      }
    };

  // ==========================================================
  // TRANSICIONES DISPONIBLES
  // ==========================================================

  const estatusDisponibles =
    TRANSICIONES_ESTATUS[
      ticket?.estatus
    ] || [];

  // ==========================================================
  // ACCIONES DISPONIBLES
  // ==========================================================

  const puedeSolicitarInformacion =
    permisos.puedeCambiarEstatus &&
    [
      "en_revision",
      "en_desarrollo",
    ].includes(ticket?.estatus);

  // Resolver solamente desde revisión o desarrollo.
  //
  // Si está esperando al usuario, primero debe recibirse
  // respuesta o regresarse a revisión.

  const puedeResolverTicket =
    permisos.puedeResolver &&
    [
      "en_revision",
      "en_desarrollo",
    ].includes(ticket?.estatus);

  // ==========================================================
  // PERMISOS GENERALES
  // ==========================================================

  const puedeGestionar =
    permisos.puedeAsignar ||
    permisos.puedeCambiarEstatus ||
    permisos.puedeCambiarPrioridad ||
    permisos.puedeResolver;

  if (!puedeGestionar) {
    return null;
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <Box>
      {/* =====================================================
          HEADER
      ===================================================== */}

      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        sx={{ mb: 2 }}
      >
        <AssignmentIndOutlinedIcon
          fontSize="small"
        />

        <Typography
          variant="subtitle1"
          fontWeight={700}
        >
          Gestión de soporte
        </Typography>
      </Stack>

      {/* =====================================================
          CONTROLES PRINCIPALES
      ===================================================== */}

      <Box
        sx={{
          display: "grid",

          gridTemplateColumns: {
            xs: "1fr",
            md: "repeat(3, 1fr)",
          },

          gap: 2,
          alignItems: "start",
        }}
      >
        {/* ===================================================
            ASIGNACIÓN
        =================================================== */}

        {permisos.puedeAsignar && (
          <Box>
            <Autocomplete
              options={
                desarrolladores
              }
              loading={
                asignando
              }
              disabled={
                asignando
              }
              value={
                desarrolladores.find(
                  (dev) =>
                    Number(
                      dev.id_usuario,
                    ) ===
                    Number(
                      ticket
                        ?.asignado
                        ?.id,
                    ),
                ) || null
              }
              getOptionLabel={(
                option,
              ) =>
                option.nombre ||
                ""
              }
              isOptionEqualToValue={(
                option,
                value,
              ) =>
                Number(
                  option.id_usuario,
                ) ===
                Number(
                  value.id_usuario,
                )
              }
              onChange={(
                event,
                nuevoDesarrollador,
              ) => {
                if (
                  !nuevoDesarrollador
                ) {
                  return;
                }

                handleAsignarTicket(
                  nuevoDesarrollador,
                );
              }}
              renderInput={(
                params,
              ) => (
                <TextField
                  {...params}
                  label="Asignado a"
                  placeholder="Selecciona un desarrollador"
                  helperText={
                    ticket
                      ?.asignado
                      ? `Actualmente asignado a ${ticket.asignado.nombre}`
                      : "Este ticket todavía no tiene un desarrollador asignado."
                  }
                  InputProps={{
                    ...params.InputProps,

                    endAdornment: (
                      <>
                        {asignando && (
                          <CircularProgress
                            size={
                              18
                            }
                          />
                        )}

                        {
                          params
                            .InputProps
                            .endAdornment
                        }
                      </>
                    ),
                  }}
                />
              )}
            />

            {errorAsignacion && (
              <Alert
                severity="error"
                sx={{ mt: 1.5 }}
              >
                {
                  errorAsignacion
                }
              </Alert>
            )}
          </Box>
        )}

        {/* ===================================================
            ESTATUS
        =================================================== */}

        {permisos.puedeCambiarEstatus && (
          <Box>
            <FormControl
              fullWidth
              disabled={
                cambiandoEstatus ||
                estatusDisponibles.length ===
                  0
              }
            >
              <InputLabel id="ticket-estatus-label">
                Estado
              </InputLabel>

              <Select
                labelId="ticket-estatus-label"
                value={
                  ticket?.estatus ||
                  ""
                }
                label="Estado"
                onChange={(
                  event,
                ) =>
                  handleCambiarEstatus(
                    event.target
                      .value,
                  )
                }
              >
                <MenuItem
                  value={
                    ticket?.estatus ||
                    ""
                  }
                  disabled
                >
                  {ESTATUS_LABELS[
                    ticket?.estatus
                  ] ||
                    ticket?.estatus ||
                    "Sin estado"}{" "}
                  (actual)
                </MenuItem>

                {estatusDisponibles.map(
                  (estatus) => (
                    <MenuItem
                      key={
                        estatus
                      }
                      value={
                        estatus
                      }
                    >
                      {ESTATUS_LABELS[
                        estatus
                      ] ||
                        estatus}
                    </MenuItem>
                  ),
                )}
              </Select>
            </FormControl>

            <Box
              sx={{
                minHeight: 24,
                mt: 0.5,
                px: 1.75,
                display: "flex",
                alignItems:
                  "center",
                gap: 1,
              }}
            >
              {cambiandoEstatus ? (
                <>
                  <CircularProgress
                    size={14}
                  />

                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Actualizando
                    estado...
                  </Typography>
                </>
              ) : estatusDisponibles.length >
                0 ? (
                <Typography
                  variant="caption"
                  color="text.secondary"
                >
                  Selecciona el
                  siguiente estado
                  del ticket.
                </Typography>
              ) : (
                <Typography
                  variant="caption"
                  color="text.secondary"
                >
                  No hay cambios de
                  estado disponibles.
                </Typography>
              )}
            </Box>

            {errorEstatus && (
              <Alert
                severity="error"
                sx={{ mt: 1 }}
              >
                {errorEstatus}
              </Alert>
            )}
          </Box>
        )}

        {/* ===================================================
            PRIORIDAD
        =================================================== */}

        {permisos.puedeCambiarPrioridad && (
          <Box>
            <FormControl
              fullWidth
              disabled={
                cambiandoPrioridad
              }
            >
              <InputLabel id="ticket-prioridad-label">
                Prioridad
              </InputLabel>

              <Select
                labelId="ticket-prioridad-label"
                value={
                  ticket?.prioridad ||
                  ""
                }
                label="Prioridad"
                onChange={(
                  event,
                ) =>
                  handleCambiarPrioridad(
                    event.target
                      .value,
                  )
                }
              >
                {PRIORIDADES.map(
                  (prioridad) => (
                    <MenuItem
                      key={
                        prioridad
                      }
                      value={
                        prioridad
                      }
                      disabled={
                        prioridad ===
                        ticket
                          ?.prioridad
                      }
                    >
                      {
                        PRIORIDAD_LABELS[
                          prioridad
                        ]
                      }

                      {prioridad ===
                      ticket?.prioridad
                        ? " (actual)"
                        : ""}
                    </MenuItem>
                  ),
                )}
              </Select>
            </FormControl>

            <Box
              sx={{
                minHeight: 24,
                mt: 0.5,
                px: 1.75,
                display: "flex",
                alignItems:
                  "center",
                gap: 1,
              }}
            >
              {cambiandoPrioridad ? (
                <>
                  <CircularProgress
                    size={14}
                  />

                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Actualizando
                    prioridad...
                  </Typography>
                </>
              ) : (
                <Typography
                  variant="caption"
                  color="text.secondary"
                >
                  Define la urgencia
                  de atención.
                </Typography>
              )}
            </Box>

            {errorPrioridad && (
              <Alert
                severity="error"
                sx={{ mt: 1 }}
              >
                {
                  errorPrioridad
                }
              </Alert>
            )}
          </Box>
        )}
      </Box>

      {/* =====================================================
          ACCIONES DE SOPORTE
      ===================================================== */}

      {(puedeSolicitarInformacion ||
        puedeResolverTicket) && (
        <>
          <Divider
            sx={{ my: 2.5 }}
          />

          <Stack
            direction={{
              xs: "column",
              md: "row",
            }}
            spacing={1.5}
            alignItems={{
              xs: "stretch",
              md: "center",
            }}
            justifyContent="space-between"
          >
            {/* ===============================================
                SOLICITAR INFORMACIÓN
            =============================================== */}

            {puedeSolicitarInformacion && (
              <Box>
                <Button
                  variant="outlined"
                  startIcon={
                    solicitandoInformacion ? (
                      <CircularProgress
                        size={18}
                      />
                    ) : (
                      <QuestionAnswerOutlinedIcon />
                    )
                  }
                  disabled={
                    solicitandoInformacion ||
                    resolviendo
                  }
                  onClick={
                    handleSolicitarInformacion
                  }
                >
                  {solicitandoInformacion
                    ? "Solicitando..."
                    : "Solicitar información"}
                </Button>

                <Typography
                  display="block"
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 0.75 }}
                >
                  El ticket quedará en
                  espera hasta que el
                  usuario responda.
                </Typography>
              </Box>
            )}

            {/* ===============================================
                RESOLVER
            =============================================== */}

            {puedeResolverTicket && (
              <Box
                sx={{
                  textAlign: {
                    xs: "left",
                    md: "right",
                  },
                }}
              >
                <Button
                  variant="contained"
                  startIcon={
                    resolviendo ? (
                      <CircularProgress
                        size={18}
                        color="inherit"
                      />
                    ) : (
                      <TaskAltOutlinedIcon />
                    )
                  }
                  disabled={
                    resolviendo ||
                    solicitandoInformacion
                  }
                  onClick={
                    handleResolverTicket
                  }
                >
                  {resolviendo
                    ? "Resolviendo..."
                    : "Resolver ticket"}
                </Button>

                <Typography
                  display="block"
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 0.75 }}
                >
                  Marca el problema como
                  solucionado.
                </Typography>
              </Box>
            )}
          </Stack>

          {/* ===============================================
              ERRORES DE ACCIONES
          =============================================== */}

          {errorSolicitarInformacion && (
            <Alert
              severity="error"
              sx={{ mt: 1.5 }}
            >
              {
                errorSolicitarInformacion
              }
            </Alert>
          )}

          {errorResolucion && (
            <Alert
              severity="error"
              sx={{ mt: 1.5 }}
            >
              {errorResolucion}
            </Alert>
          )}
        </>
      )}
    </Box>
  );
};

export default TicketGestion;