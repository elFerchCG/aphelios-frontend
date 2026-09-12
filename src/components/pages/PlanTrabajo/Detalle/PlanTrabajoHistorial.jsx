import React, { useCallback, useEffect, useState } from "react";

import axios from "axios";

import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Typography,
} from "@mui/material";

// =========================================================
// CONFIG
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

const formatearDuracion = (segundos) => {
  const total = Number(segundos) || 0;

  const horas = Math.floor(total / 3600);
  const minutos = Math.floor((total % 3600) / 60);
  const segundosRestantes = total % 60;

  return [horas, minutos, segundosRestantes]
    .map((valor) => String(valor).padStart(2, "0"))
    .join(":");
};

const obtenerTextoAccion = (accion) => {
  const acciones = {
    tarea_creada: "Tarea creada",

    tarea_editada: "Tarea actualizada",

    tarea_actualizada: "Tarea actualizada",

    responsable_asignado: "Responsable asignado",

    responsable_eliminado: "Responsable eliminado",

    estatus_actualizado: "Estatus actualizado",

    prioridad_actualizada: "Prioridad actualizada",

    // Dejamos ambos nombres por compatibilidad.
    tiempo_iniciado: "Cronómetro iniciado",

    tiempo_detenido: "Cronómetro detenido",

    cronometro_iniciado: "Cronómetro iniciado",

    cronometro_detenido: "Cronómetro detenido",

    comentario_agregado: "Comentario agregado",
  };

  return acciones[accion] || accion || "-";
};

const obtenerTextoCampo = (campo) => {
  const campos = {
    titulo: "Título",

    descripcion: "Descripción",

    notas: "Notas",

    responsable: "Responsable",

    prioridad: "Prioridad",

    estatus: "Estatus",

    orden: "Orden",

    origen: "Origen",

    fecha_objetivo: "Fecha objetivo",

    duracion_segundos: "Duración",
  };

  return campos[campo] || campo || "-";
};

const obtenerTextoValor = (campo, valor) => {
  if (valor === null || valor === undefined || valor === "") {
    return "Sin valor";
  }

  if (campo === "estatus") {
    const estatus = {
      pendiente: "Pendiente",
      en_proceso: "En proceso",
      bloqueada: "Bloqueada",
      finalizada: "Finalizada",
      cancelada: "Cancelada",
    };

    return estatus[valor] || valor;
  }

  if (campo === "prioridad") {
    const prioridades = {
      baja: "Baja",
      media: "Media",
      alta: "Alta",
      urgente: "Urgente",
    };

    return prioridades[valor] || valor;
  }

  if (campo === "fecha_objetivo") {
    const fecha = String(valor).slice(0, 10);

    const [anio, mes, dia] = fecha.split("-");

    if (anio && mes && dia) {
      return `${dia}/${mes}/${anio}`;
    }
  }

  if (campo === "duracion_segundos") {
    return formatearDuracion(valor);
  }

  return String(valor);
};

const esCampoTextoLargo = (campo) => {
  return ["descripcion", "notas"].includes(campo);
};

// =========================================================
// COMPONENTE
// =========================================================

const PlanTrabajoHistorial = ({ tareaId }) => {
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

  const [historial, setHistorial] = useState([]);

  const [loading, setLoading] = useState(false);

  const [offset, setOffset] = useState(0);

  const [hasMore, setHasMore] = useState(false);

  const [loadingMore, setLoadingMore] = useState(false);

  // =========================================================
  // OBTENER HISTORIAL
  // =========================================================

  const obtenerHistorial = useCallback(
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
          `${apiUrl}/planTrabajo/tareas/${tareaId}/historial`,
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

        const nuevoHistorial =
          response.data?.historial || [];

        if (acumular) {
          setHistorial((prev) => [
            ...prev,
            ...nuevoHistorial,
          ]);
        } else {
          setHistorial(nuevoHistorial);
        }

        setOffset(
          nuevoOffset + nuevoHistorial.length,
        );

        setHasMore(
          Boolean(response.data?.hasMore),
        );
      } catch (error) {
        console.error(
          "Error al obtener historial:",
          error,
        );
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

    setHistorial([]);
    setOffset(0);
    setHasMore(false);

    obtenerHistorial(0, false);
  }, [tareaId, obtenerHistorial]);

  // =========================================================
  // CARGAR HISTORIAL ANTERIOR
  // =========================================================

  const handleCargarAnteriores = async () => {
    await obtenerHistorial(offset, true);
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <Box>
      {/* =====================================================
          TÍTULO
      ====================================================== */}

      <Typography
        fontWeight={700}
        sx={{
          color: "#263238",
        }}
      >
        Historial
      </Typography>

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{
          mt: 0.5,
          mb: 2,
        }}
      >
        Registro de cambios y acciones realizadas en esta tarea.
      </Typography>

      {/* =====================================================
          CONTENIDO
      ====================================================== */}

      {loading ? (
        <Box
          sx={{
            py: 3,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <CircularProgress size={28} />
        </Box>
      ) : historial.length === 0 ? (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            fontStyle: "italic",
          }}
        >
          Todavía no hay movimientos registrados en esta tarea.
        </Typography>
      ) : (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 1.5,
          }}
        >
          {historial.map((item) => {
            const tieneCambio =
              item.campo &&
              (item.valor_anterior !== null ||
                item.valor_nuevo !== null);

            return (
              <Box
                key={item.id}
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 1.5,
                  p: 1.5,
                  minWidth: 0,
                  maxWidth: "100%",
                  overflow: "hidden",
                }}
              >
                {/* ===========================================
                    HEADER
                =========================================== */}

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 2,
                    flexWrap: "wrap",
                  }}
                >
                  <Box>
                    <Typography
                      variant="body2"
                      fontWeight={700}
                    >
                      {item.usuario_nombre ||
                        item.nombre_usuario ||
                        "Usuario"}
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mt: 0.25,
                      }}
                    >
                      {obtenerTextoAccion(
                        item.accion,
                      )}
                    </Typography>
                  </Box>

                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    {formatearFechaHora(
                      item.fecha_creacion,
                    )}
                  </Typography>
                </Box>

                {/* ===========================================
                    CAMBIO NORMAL
                =========================================== */}

                {tieneCambio &&
                  !esCampoTextoLargo(item.campo) && (
                    <Box
                      sx={{
                        mt: 1.25,
                        display: "flex",
                        alignItems: "flex-start",
                        flexWrap: "wrap",
                        gap: 0.75,
                        minWidth: 0,
                        maxWidth: "100%",
                      }}
                    >
                      <Chip
                        size="small"
                        variant="outlined"
                        label={obtenerTextoCampo(
                          item.campo,
                        )}
                      />

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          overflowWrap: "anywhere",
                          wordBreak: "break-word",
                        }}
                      >
                        {obtenerTextoValor(
                          item.campo,
                          item.valor_anterior,
                        )}
                      </Typography>

                      <Typography
                        variant="body2"
                        fontWeight={700}
                      >
                        →
                      </Typography>

                      <Typography
                        variant="body2"
                        fontWeight={600}
                        sx={{
                          overflowWrap: "anywhere",
                          wordBreak: "break-word",
                        }}
                      >
                        {obtenerTextoValor(
                          item.campo,
                          item.valor_nuevo,
                        )}
                      </Typography>
                    </Box>
                  )}

                {/* ===========================================
                    CAMBIO DE TEXTO LARGO
                =========================================== */}

                {tieneCambio &&
                  esCampoTextoLargo(item.campo) && (
                    <Box
                      sx={{
                        mt: 1.25,
                      }}
                    >
                      <Chip
                        size="small"
                        variant="outlined"
                        label={obtenerTextoCampo(
                          item.campo,
                        )}
                      />

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          mt: 0.75,
                        }}
                      >
                        Se actualizó este campo.
                      </Typography>
                    </Box>
                  )}
              </Box>
            );
          })}

          {/* =================================================
              CARGAR ANTERIORES
          ================================================= */}

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

export default PlanTrabajoHistorial;