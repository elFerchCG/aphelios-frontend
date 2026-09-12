import React, { useCallback, useEffect, useState } from "react";

import axios from "axios";

import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  Divider,
  TextField,
  Typography,
} from "@mui/material";

import SendOutlinedIcon from "@mui/icons-material/SendOutlined";

import { modalPrimaryButtonSx } from "../../../common/modalStyles";

import { swalSuccess } from "../../../../helpers/sweetAlert";
import { handleApiError } from "../../../../helpers/apiErrorHandler";

// =========================================================
// CONSTANTES
// =========================================================

const LIMIT = 5;

// =========================================================
// HELPERS
// =========================================================

const formatearFechaHora = (fecha) => {
  if (!fecha) {
    return "-";
  }

  const date = new Date(fecha);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const obtenerIniciales = (nombre = "") => {
  const partes = nombre
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (partes.length === 0) {
    return "?";
  }

  if (partes.length === 1) {
    return partes[0].charAt(0).toUpperCase();
  }

  return `${partes[0].charAt(0)}${partes[1].charAt(0)}`.toUpperCase();
};

// =========================================================
// COMPONENTE
// =========================================================

const PlanTrabajoComentarios = ({
  tareaId,
  usuarioActualId,
}) => {
  // =========================================================
  // CONFIG
  // =========================================================

  const apiUrl =
    process.env.NODE_ENV === "production"
      ? process.env.REACT_APP_API_URL
      : process.env.REACT_APP_API_URL_LOCAL;

  const token = localStorage.getItem("token");

  // =========================================================
  // STATES
  // =========================================================

  const [comentarios, setComentarios] = useState([]);

  const [comentario, setComentario] = useState("");

  const [loading, setLoading] = useState(false);

  const [guardando, setGuardando] = useState(false);

  const [submitted, setSubmitted] = useState(false);

  const [offset, setOffset] = useState(0);

  const [hasMore, setHasMore] = useState(false);

  const [loadingMore, setLoadingMore] = useState(false);

  // =========================================================
  // OBTENER COMENTARIOS
  // =========================================================

  const obtenerComentarios = useCallback(
    async (nuevoOffset = 0, acumular = false) => {
      if (!tareaId) {
        return;
      }

      try {
        if (nuevoOffset === 0) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        const response = await axios.get(
          `${apiUrl}/planTrabajo/tareas/${tareaId}/comentarios`,
          {
            params: {
              limit: LIMIT,
              offset: nuevoOffset,
            },

            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const nuevosComentarios =
          response.data?.comentarios || [];

        if (acumular) {
          setComentarios((prev) => [
            ...prev,
            ...nuevosComentarios,
          ]);
        } else {
          setComentarios(nuevosComentarios);
        }

        setOffset(
          nuevoOffset + nuevosComentarios.length,
        );

        setHasMore(
          Boolean(response.data?.hasMore),
        );
      } catch (error) {
        handleApiError(error, {
          defaultMessage:
            "No se pudieron obtener las actualizaciones.",
          warningTitle:
            "No se pudo cargar la actividad",
        });
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [apiUrl, token, tareaId],
  );

  // =========================================================
  // EFFECT
  // =========================================================

  useEffect(() => {
    if (!tareaId) {
      return;
    }

    setComentarios([]);
    setOffset(0);
    setHasMore(false);

    obtenerComentarios(0, false);
  }, [tareaId, obtenerComentarios]);

  // =========================================================
  // VALIDACIÓN
  // =========================================================

  const comentarioError =
    submitted && !comentario.trim()
      ? "La actualización es obligatoria."
      : "";

  // =========================================================
  // CAMBIO DE COMENTARIO
  // =========================================================

  const handleComentarioChange = (event) => {
    setComentario(event.target.value);
  };

  // =========================================================
  // GUARDAR COMENTARIO
  // =========================================================

  const handleGuardarComentario = async () => {
    setSubmitted(true);

    const texto = comentario.trim();

    if (!texto) {
      return;
    }

    if (texto.length > 2000) {
      return;
    }

    if (!tareaId) {
      return;
    }

    try {
      setGuardando(true);

      await axios.post(
        `${apiUrl}/planTrabajo/tareas/${tareaId}/comentarios`,
        {
          comentario: texto,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      swalSuccess(
        "Actualización publicada",
        "La actividad se registró correctamente.",
      );

      setComentario("");
      setSubmitted(false);

      setComentarios([]);
      setOffset(0);
      setHasMore(false);

      await obtenerComentarios(0, false);
    } catch (error) {
      handleApiError(error, {
        defaultMessage:
          "No se pudo publicar la actualización.",
        warningTitle:
          "No se pudo registrar la actividad",
      });
    } finally {
      setGuardando(false);
    }
  };

  // =========================================================
  // CARGAR ANTERIORES
  // =========================================================

  const handleCargarAnteriores = async () => {
    await obtenerComentarios(offset, true);
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <Box>
      {/* =====================================================
          ENCABEZADO
      ====================================================== */}

      <Box sx={{ mb: 2.5 }}>
        <Typography
          fontWeight={700}
          sx={{
            color: "#263238",
            fontSize: "1.05rem",
          }}
        >
          Actividad de la tarea
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mt: 0.5,
          }}
        >
          Registra avances, bloqueos o información relevante
          para los responsables de esta tarea.
        </Typography>
      </Box>

      {/* =====================================================
          NUEVA ACTUALIZACIÓN
      ====================================================== */}

      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          multiline
          minRows={3}
          maxRows={8}
          label="Nueva actualización"
          placeholder="¿Qué avance, bloqueo o pendiente quieres registrar?"
          value={comentario}
          onChange={handleComentarioChange}
          error={Boolean(comentarioError)}
          helperText={
            comentarioError ||
            `${comentario.length}/2000`
          }
          inputProps={{
            maxLength: 2000,
          }}
          disabled={guardando}
        />

        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            mt: 1.5,
          }}
        >
          <Button
            variant="contained"
            startIcon={<SendOutlinedIcon />}
            onClick={handleGuardarComentario}
            disabled={
              guardando ||
              !comentario.trim()
            }
            sx={modalPrimaryButtonSx}
          >
            {guardando
              ? "Publicando..."
              : "Publicar actualización"}
          </Button>
        </Box>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* =====================================================
          LISTADO
      ====================================================== */}

      {loading ? (
        <Box
          sx={{
            py: 4,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <CircularProgress size={28} />
        </Box>
      ) : comentarios.length === 0 ? (
        <Box
          sx={{
            py: 5,
            textAlign: "center",
          }}
        >
          <Typography
            variant="body2"
            color="text.secondary"
          >
            Todavía no hay actividad registrada en esta tarea.
          </Typography>
        </Box>
      ) : (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2.5,
          }}
        >
          {comentarios.map((item) => {
            const nombre =
              item.usuario_nombre ||
              item.nombre_usuario ||
              "Usuario";

            const esMio =
              Number(item.usuario_id) ===
              Number(usuarioActualId);

            return (
              <Box
                key={item.id}
                sx={{
                  width: "100%",

                  display: "flex",

                  justifyContent: esMio
                    ? "flex-start"
                    : "flex-end",
                }}
              >
                {/* ==========================================
                    MENSAJE PROPIO - IZQUIERDA
                =========================================== */}

                {esMio && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 1.2,
                      maxWidth: "75%",
                      minWidth: 0,
                    }}
                  >
                    {/* INICIALES */}

                    <Avatar
                      sx={{
                        width: 42,
                        height: 42,

                        bgcolor: "#1e88e5",

                        fontSize: "0.8rem",
                        fontWeight: 700,

                        flexShrink: 0,
                      }}
                    >
                      {obtenerIniciales(nombre)}
                    </Avatar>

                    {/* BURBUJA */}

                    <Box
                      sx={{
                        position: "relative",

                        backgroundColor: "#e3f2fd",

                        borderRadius:
                          "4px 14px 14px 14px",

                        px: 2,
                        py: 1.4,

                        minWidth: 180,
                        maxWidth: "100%",

                        "&::before": {
                          content: '""',

                          position: "absolute",

                          left: -8,
                          top: 0,

                          width: 0,
                          height: 0,

                          borderTop:
                            "10px solid #e3f2fd",

                          borderLeft:
                            "10px solid transparent",
                        },
                      }}
                    >
                      {/* NOMBRE */}

                      <Typography
                        variant="body2"
                        fontWeight={700}
                        sx={{
                          color: "#263238",
                          mb: 0.5,
                        }}
                      >
                        {nombre} (Tú)
                      </Typography>

                      {/* MENSAJE */}

                      <Typography
                        variant="body2"
                        sx={{
                          whiteSpace: "pre-wrap",

                          color: "#37474f",

                          overflowWrap:
                            "anywhere",

                          wordBreak: "break-word",

                          lineHeight: 1.6,
                        }}
                      >
                        {item.comentario}
                      </Typography>

                      {/* FECHA */}

                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          display: "block",
                          textAlign: "right",
                          mt: 0.75,
                        }}
                      >
                        {formatearFechaHora(
                          item.fecha_creacion,
                        )}
                      </Typography>
                    </Box>
                  </Box>
                )}

                {/* ==========================================
                    MENSAJE AJENO - DERECHA
                =========================================== */}

                {!esMio && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "flex-end",

                      gap: 1.2,

                      maxWidth: "75%",
                      minWidth: 0,
                    }}
                  >
                    {/* BURBUJA */}

                    <Box
                      sx={{
                        position: "relative",

                        backgroundColor: "#f5f5f5",

                        borderRadius:
                          "14px 4px 14px 14px",

                        px: 2,
                        py: 1.4,

                        minWidth: 180,
                        maxWidth: "100%",

                        "&::after": {
                          content: '""',

                          position: "absolute",

                          right: -8,
                          top: 0,

                          width: 0,
                          height: 0,

                          borderTop:
                            "10px solid #f5f5f5",

                          borderRight:
                            "10px solid transparent",
                        },
                      }}
                    >
                      {/* NOMBRE */}

                      <Typography
                        variant="body2"
                        fontWeight={700}
                        sx={{
                          color: "#263238",
                          mb: 0.5,
                        }}
                      >
                        {nombre}
                      </Typography>

                      {/* MENSAJE */}

                      <Typography
                        variant="body2"
                        sx={{
                          whiteSpace: "pre-wrap",

                          color: "#37474f",

                          overflowWrap:
                            "anywhere",

                          wordBreak: "break-word",

                          lineHeight: 1.6,
                        }}
                      >
                        {item.comentario}
                      </Typography>

                      {/* FECHA */}

                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          display: "block",
                          textAlign: "right",
                          mt: 0.75,
                        }}
                      >
                        {formatearFechaHora(
                          item.fecha_creacion,
                        )}
                      </Typography>
                    </Box>

                    {/* INICIALES */}

                    <Avatar
                      sx={{
                        width: 42,
                        height: 42,

                        bgcolor: "#90a4ae",

                        fontSize: "0.8rem",
                        fontWeight: 700,

                        flexShrink: 0,
                      }}
                    >
                      {obtenerIniciales(nombre)}
                    </Avatar>
                  </Box>
                )}
              </Box>
            );
          })}

          {/* =================================================
              CARGAR ANTERIORES
          ================================================== */}

          {hasMore && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                mt: 1,
              }}
            >
              <Button
                variant="outlined"
                size="small"
                onClick={handleCargarAnteriores}
                disabled={loadingMore}
              >
                {loadingMore
                  ? "Cargando..."
                  : "Cargar anteriores"}
              </Button>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default PlanTrabajoComentarios;