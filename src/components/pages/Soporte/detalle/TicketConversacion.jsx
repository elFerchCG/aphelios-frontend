import React, { useState } from "react";

import axios from "axios";

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import ForumOutlinedIcon from "@mui/icons-material/ForumOutlined";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";

import { formatearFechaHora } from "../helpers/soporteHelpers";

// ============================================================
// COMPONENTE
// ============================================================

const TicketConversacion = ({
  ticketId,
  ticket,
  mensajes = [],
  permisos = {},
  onMensajeCreado,
}) => {
  const apiUrl =
    process.env.NODE_ENV === "production"
      ? process.env.REACT_APP_API_URL
      : process.env.REACT_APP_API_URL_LOCAL;

  // ==========================================================
  // ESTADOS
  // ==========================================================

  const [nuevoMensaje, setNuevoMensaje] = useState("");

  const [enviandoMensaje, setEnviandoMensaje] =
    useState(false);

  const [errorMensaje, setErrorMensaje] =
    useState("");

  // ==========================================================
  // ENVIAR MENSAJE
  // ==========================================================

  const handleEnviarMensaje = async () => {
    const mensajeLimpio = nuevoMensaje.trim();

    if (!mensajeLimpio) {
      setErrorMensaje(
        "Escribe un mensaje antes de enviarlo.",
      );

      return;
    }

    if (mensajeLimpio.length > 10000) {
      setErrorMensaje(
        "El mensaje no puede superar los 10000 caracteres.",
      );

      return;
    }

    if (!permisos.puedeResponder) {
      setErrorMensaje(
        "No tienes permisos para responder este ticket.",
      );

      return;
    }

    try {
      setEnviandoMensaje(true);
      setErrorMensaje("");

      const token =
        localStorage.getItem("token");

      const response = await axios.post(
        `${apiUrl}/tickets/${ticketId}/mensajes`,
        {
          mensaje: mensajeLimpio,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const mensajeCreado =
        response.data?.mensaje;

      const nuevoEstatus =
        response.data?.estatus;

      // ======================================================
      // INFORMAR AL COMPONENTE PADRE
      // ======================================================

      if (mensajeCreado && onMensajeCreado) {
        onMensajeCreado({
          mensaje: mensajeCreado,
          estatus: nuevoEstatus,
        });
      }

      // ======================================================
      // LIMPIAR INPUT
      // ======================================================

      setNuevoMensaje("");
    } catch (error) {
      console.error(
        "Error enviando mensaje:",
        error,
      );

      setErrorMensaje(
        error.response?.data?.message ||
          "No se pudo enviar el mensaje.",
      );
    } finally {
      setEnviandoMensaje(false);
    }
  };

  // ==========================================================
  // ENTER PARA ENVIAR
  // SHIFT + ENTER PARA NUEVA LÍNEA
  // ==========================================================

  const handleKeyDownMensaje = (event) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      if (
        !enviandoMensaje &&
        nuevoMensaje.trim()
      ) {
        handleEnviarMensaje();
      }
    }
  };

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
        alignItems="center"
        spacing={1}
        sx={{ mb: 2 }}
      >
        <ForumOutlinedIcon fontSize="small" />

        <Typography
          variant="subtitle1"
          fontWeight={700}
        >
          Conversación
        </Typography>

        {mensajes.length > 0 && (
          <Chip
            size="small"
            label={mensajes.length}
          />
        )}
      </Stack>

      {/* =====================================================
          CONTENEDOR
      ===================================================== */}

      <Box
        sx={{
          border: 1,
          borderColor: "divider",
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        {/* ===================================================
            MENSAJES
        =================================================== */}

        <Box
          sx={{
            px: 2,
            py: 2,
            minHeight: 220,
            maxHeight: 420,
            overflowY: "auto",
            bgcolor: "background.default",
          }}
        >
          {mensajes.length === 0 ? (
            <Box
              sx={{
                minHeight: 180,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Stack
                alignItems="center"
                spacing={1}
              >
                <ForumOutlinedIcon
                  sx={{
                    fontSize: 36,
                    color: "text.disabled",
                  }}
                />

                <Typography
                  variant="body2"
                  color="text.secondary"
                  textAlign="center"
                >
                  Aún no hay mensajes en este
                  ticket.
                </Typography>

                {permisos.puedeResponder && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    textAlign="center"
                  >
                    Puedes iniciar la conversación
                    escribiendo un mensaje.
                  </Typography>
                )}
              </Stack>
            </Box>
          ) : (
            <Stack spacing={2}>
              {mensajes.map((mensaje) => {
                const esDesarrollo =
                  mensaje.usuario_rol
                    ?.trim()
                    .toLowerCase() ===
                  "desarrollador";

                return (
                  <Box
                    key={mensaje.id}
                    sx={{
                      display: "flex",

                      justifyContent:
                        esDesarrollo
                          ? "flex-end"
                          : "flex-start",
                    }}
                  >
                    <Box
                      sx={{
                        width: "fit-content",

                        maxWidth: {
                          xs: "90%",
                          sm: "75%",
                        },
                      }}
                    >
                      {/* =========================
                          AUTOR
                      ========================= */}

                      <Stack
                        direction="row"
                        spacing={0.75}
                        alignItems="center"
                        justifyContent={
                          esDesarrollo
                            ? "flex-end"
                            : "flex-start"
                        }
                        sx={{
                          mb: 0.5,
                          px: 0.5,
                        }}
                      >
                        <Typography
                          variant="caption"
                          fontWeight={700}
                        >
                          {esDesarrollo
                            ? "Desarrollo"
                            : mensaje.usuario_nombre}
                        </Typography>

                        {esDesarrollo && (
                          <Chip
                            label="Soporte"
                            size="small"
                            color="primary"
                            variant="outlined"
                            sx={{
                              height: 20,
                              fontSize: "0.65rem",
                            }}
                          />
                        )}
                      </Stack>

                      {/* =========================
                          BURBUJA
                      ========================= */}

                      <Box
                        sx={{
                          px: 1.75,
                          py: 1.25,

                          borderRadius: 2,

                          bgcolor:
                            esDesarrollo
                              ? "primary.main"
                              : "background.paper",

                          color:
                            esDesarrollo
                              ? "primary.contrastText"
                              : "text.primary",

                          ...(!esDesarrollo && {
                            border: 1,
                            borderColor:
                              "divider",
                          }),
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            whiteSpace:
                              "pre-wrap",

                            overflowWrap:
                              "anywhere",

                            lineHeight: 1.6,
                          }}
                        >
                          {mensaje.mensaje}
                        </Typography>
                      </Box>

                      {/* =========================
                          FECHA
                      ========================= */}

                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          display: "block",

                          mt: 0.5,
                          px: 0.5,

                          textAlign:
                            esDesarrollo
                              ? "right"
                              : "left",
                        }}
                      >
                        {formatearFechaHora(
                          mensaje.fecha_creacion,
                        )}

                        {mensaje.fecha_edicion
                          ? " · Editado"
                          : ""}
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
            </Stack>
          )}
        </Box>

        {/* ===================================================
            CAJA PARA RESPONDER
        =================================================== */}

        <Divider />

        {permisos.puedeResponder ? (
          <Box
            sx={{
              p: 2,
              bgcolor: "background.paper",
            }}
          >
            {errorMensaje && (
              <Alert
                severity="error"
                sx={{ mb: 1.5 }}
              >
                {errorMensaje}
              </Alert>
            )}

            <TextField
              fullWidth
              multiline
              minRows={2}
              maxRows={6}
              placeholder="Escribe una respuesta..."
              value={nuevoMensaje}
              disabled={enviandoMensaje}
              onChange={(event) => {
                const value =
                  event.target.value;

                if (value.length <= 10000) {
                  setNuevoMensaje(value);
                }

                if (errorMensaje) {
                  setErrorMensaje("");
                }
              }}
              onKeyDown={
                handleKeyDownMensaje
              }
              helperText={`${nuevoMensaje.length}/10000 caracteres · Enter para enviar · Shift + Enter para nueva línea`}
            />

            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
                mt: 1.5,
              }}
            >
              <Button
                variant="contained"
                startIcon={
                  enviandoMensaje ? (
                    <CircularProgress
                      size={16}
                      color="inherit"
                    />
                  ) : (
                    <SendOutlinedIcon />
                  )
                }
                disabled={
                  enviandoMensaje ||
                  !nuevoMensaje.trim()
                }
                onClick={
                  handleEnviarMensaje
                }
                sx={{
                  textTransform: "none",
                }}
              >
                {enviandoMensaje
                  ? "Enviando..."
                  : "Enviar"}
              </Button>
            </Box>
          </Box>
        ) : (
          <Box
            sx={{
              p: 2,
              bgcolor: "background.paper",
            }}
          >
            <Alert severity="info">
              {[
                "resuelto",
                "cerrado",
              ].includes(ticket.estatus)
                ? "Este ticket está finalizado. Para continuar con el mismo problema será necesario reabrirlo."
                : ticket.estatus ===
                    "cancelado"
                  ? "Este ticket fue cancelado y ya no admite nuevas respuestas."
                  : "No tienes permisos para responder este ticket."}
            </Alert>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default TicketConversacion;