import React, { useCallback, useEffect, useMemo, useState } from "react";

import axios from "axios";

import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";

import {
  modalTitleSx,
  modalContentSx,
  modalActionsSx,
  modalSecondaryButtonSx,
} from "../../common/modalStyles";

import { swalSuccess } from "../../../helpers/sweetAlert";
import { handleApiError } from "../../../helpers/apiErrorHandler";

import PlanTrabajoDetalleResumen from "./Detalle/PlanTrabajoDetalleResumen";
import PlanTrabajoTiempo from "./Detalle/PlanTrabajoTiempo";
import PlanTrabajoResponsables from "./Detalle/PlanTrabajoResponsables";
import PlanTrabajoComentarios from "./Detalle/PlanTrabajoComentarios";
import PlanTrabajoHistorial from "./Detalle/PlanTrabajoHistorial";
import PlanTrabajoNotas from "./Detalle/PlanTrabajoNotas";

const PlanTrabajoDetalleModal = ({ open, onClose, tareaId, onUpdated }) => {
  // =========================================================
  // CONFIG
  // =========================================================

  const apiUrl =
    process.env.NODE_ENV === "production"
      ? process.env.REACT_APP_API_URL
      : process.env.REACT_APP_API_URL_LOCAL;

  const token = localStorage.getItem("token");

  // =========================================================
  // USUARIO ACTUAL
  // =========================================================

  const usuarioActualId = useMemo(() => {
    try {
      if (!token) {
        return null;
      }

      const payload = token.split(".")[1];

      if (!payload) {
        return null;
      }

      const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");

      const decoded = JSON.parse(
        decodeURIComponent(
          window
            .atob(base64)
            .split("")
            .map(
              (caracter) =>
                `%${("00" + caracter.charCodeAt(0).toString(16)).slice(-2)}`,
            )
            .join(""),
        ),
      );

      return decoded?.id || null;
    } catch (error) {
      console.error("Error al obtener usuario del token:", error);

      return null;
    }
  }, [token]);

  // =========================================================
  // STATES
  // =========================================================

  const [tarea, setTarea] = useState(null);

  const [loading, setLoading] = useState(false);

  const [cambiandoEstatus, setCambiandoEstatus] = useState(false);

  const [procesandoAsignacion, setProcesandoAsignacion] = useState(false);

  const [procesandoTiempo, setProcesandoTiempo] = useState(false);

  const [tabActual, setTabActual] = useState(0);

  // =========================================================
  // OBTENER DETALLE
  // =========================================================

  const obtenerDetalle = useCallback(async () => {
    if (!tareaId) {
      return;
    }

    try {
      setLoading(true);

      const response = await axios.get(
        `${apiUrl}/planTrabajo/tareas/${tareaId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setTarea(response.data?.tarea || response.data || null);
    } catch (error) {
      handleApiError(error, {
        defaultMessage: "No se pudo obtener el detalle de la tarea.",
        warningTitle: "No se pudo cargar la tarea",
      });

      setTarea(null);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, token, tareaId]);

  // =========================================================
  // EFFECT
  // =========================================================

  useEffect(() => {
    if (!open || !tareaId) {
      return;
    }

    setTabActual(0);

    obtenerDetalle();
  }, [open, tareaId, obtenerDetalle]);

  // =========================================================
  // REFRESCAR TODO
  // =========================================================

  const refrescarTodo = async () => {
    await obtenerDetalle();

    if (onUpdated) {
      await onUpdated();
    }
  };

  // =========================================================
  // CAMBIAR ESTATUS
  // =========================================================

  const handleCambiarEstatus = async (nuevoEstatus) => {
    if (!tareaId || !nuevoEstatus) {
      return;
    }

    if (nuevoEstatus === tarea?.estatus) {
      return;
    }

    try {
      setCambiandoEstatus(true);

      await axios.patch(
        `${apiUrl}/planTrabajo/tareas/${tareaId}/estatus`,
        {
          estatus: nuevoEstatus,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      swalSuccess(
        "Estatus actualizado",
        "El estatus de la tarea se actualizó correctamente.",
      );

      await refrescarTodo();
    } catch (error) {
      handleApiError(error, {
        defaultMessage: "No se pudo actualizar el estatus.",
        warningTitle: "No se pudo actualizar",
      });
    } finally {
      setCambiandoEstatus(false);
    }
  };

  // =========================================================
  // ASIGNARME
  // =========================================================

  const handleAsignarme = async () => {
    if (!tareaId) {
      return;
    }

    try {
      setProcesandoAsignacion(true);

      await axios.post(
        `${apiUrl}/planTrabajo/tareas/${tareaId}/asignarme`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      swalSuccess("Tarea asignada", "Ahora eres responsable de esta tarea.");

      await refrescarTodo();
    } catch (error) {
      handleApiError(error, {
        defaultMessage: "No fue posible asignarte a la tarea.",
        warningTitle: "No se pudo asignar la tarea",
      });
    } finally {
      setProcesandoAsignacion(false);
    }
  };

  // =========================================================
  // DESASIGNARME
  // =========================================================

  const handleDesasignarme = async () => {
    if (!tareaId) {
      return;
    }

    try {
      setProcesandoAsignacion(true);

      await axios.delete(`${apiUrl}/planTrabajo/tareas/${tareaId}/asignarme`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      swalSuccess(
        "Asignación eliminada",
        "Ya no eres responsable de esta tarea.",
      );

      await refrescarTodo();
    } catch (error) {
      handleApiError(error, {
        defaultMessage: "No fue posible dejar la tarea.",
        warningTitle: "No se pudo actualizar la asignación",
      });
    } finally {
      setProcesandoAsignacion(false);
    }
  };

  // =========================================================
  // INICIAR TIEMPO
  // =========================================================

  const handleIniciarTiempo = async () => {
    if (!tareaId) {
      return;
    }

    try {
      setProcesandoTiempo(true);

      await axios.post(
        `${apiUrl}/planTrabajo/tareas/${tareaId}/tiempo/iniciar`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      swalSuccess(
        "Cronómetro iniciado",
        "Se comenzó a registrar el tiempo de trabajo.",
      );

      await refrescarTodo();
    } catch (error) {
      handleApiError(error, {
        defaultMessage: "No se pudo iniciar el cronómetro.",
        warningTitle: "No se pudo iniciar el tiempo",
      });
    } finally {
      setProcesandoTiempo(false);
    }
  };

  // =========================================================
  // DETENER TIEMPO
  // =========================================================

  const handleDetenerTiempo = async () => {
    if (!tareaId) {
      return;
    }

    try {
      setProcesandoTiempo(true);

      await axios.post(
        `${apiUrl}/planTrabajo/tareas/${tareaId}/tiempo/detener`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      swalSuccess(
        "Cronómetro detenido",
        "El tiempo trabajado quedó registrado.",
      );

      await refrescarTodo();
    } catch (error) {
      handleApiError(error, {
        defaultMessage: "No se pudo detener el cronómetro.",
        warningTitle: "No se pudo detener el tiempo",
      });
    } finally {
      setProcesandoTiempo(false);
    }
  };

  // =========================================================
  // CAMBIAR TAB
  // =========================================================

  const handleCambiarTab = (event, nuevoValor) => {
    setTabActual(nuevoValor);
  };

  // =========================================================
  // CERRAR
  // =========================================================

  const handleCerrar = () => {
    setTarea(null);
    setTabActual(0);

    onClose();
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <Dialog open={open} onClose={handleCerrar} fullWidth maxWidth="md">
      {/* =====================================================
          HEADER
      ====================================================== */}

      <DialogTitle sx={modalTitleSx}>Detalle de tarea</DialogTitle>

      {/* =====================================================
          CONTENIDO
      ====================================================== */}

      <DialogContent sx={modalContentSx}>
        {loading ? (
          <Box
            sx={{
              minHeight: 250,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CircularProgress />
          </Box>
        ) : !tarea ? (
          <Box
            sx={{
              py: 4,
              textAlign: "center",
            }}
          >
            <Typography color="text.secondary">
              No se encontró información de la tarea.
            </Typography>
          </Box>
        ) : (
          <Box>
            {/* =================================================
                TABS
            ================================================== */}

            <Box
              sx={{
                borderBottom: 1,
                borderColor: "divider",
                mb: 3,
              }}
            >
              <Tabs
                value={tabActual}
                onChange={handleCambiarTab}
                variant="scrollable"
                scrollButtons="auto"
              >
                <Tab
                  label="Resumen"
                  sx={{
                    fontWeight: 600,
                  }}
                />

                <Tab
                  label={
                    Number(tarea.total_comentarios) > 0
                      ? `Actividad (${tarea.total_comentarios})`
                      : "Actividad"
                  }
                  sx={{
                    fontWeight: 600,
                  }}
                />

                <Tab
                  label="Historial"
                  sx={{
                    fontWeight: 600,
                  }}
                />
              </Tabs>
            </Box>

            {/* =================================================
                TAB 0 - RESUMEN
            ================================================== */}

            {tabActual === 0 && (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 2.5,
                }}
              >
                {/* RESUMEN */}

                <PlanTrabajoDetalleResumen
                  tarea={tarea}
                  cambiandoEstatus={cambiandoEstatus}
                  onCambiarEstatus={handleCambiarEstatus}
                />

                <Divider />

                {/* TIEMPO */}

                <PlanTrabajoTiempo
                  tarea={tarea}
                  usuarioActualId={usuarioActualId}
                  procesandoTiempo={procesandoTiempo}
                  onIniciar={handleIniciarTiempo}
                  onDetener={handleDetenerTiempo}
                />

                <Divider />

                {/* RESPONSABLES */}

                <PlanTrabajoResponsables
                  tareaId={tareaId}
                  responsables={tarea.responsables || []}
                  usuarioActualId={usuarioActualId}
                  procesandoAsignacion={procesandoAsignacion}
                  onAsignarme={handleAsignarme}
                  onDesasignarme={handleDesasignarme}
                  onUpdated={refrescarTodo}
                />

                <Divider />

                {/* DESCRIPCIÓN */}

                <Box>
                  <Typography
                    fontWeight={700}
                    sx={{
                      mb: 1,
                      color: "#263238",
                    }}
                  >
                    Descripción
                  </Typography>

                  <Typography
                    variant="body2"
                    sx={{
                      whiteSpace: "pre-wrap",
                      color: "#455a64",
                      overflowWrap: "anywhere",
                      wordBreak: "break-word",
                    }}
                  >
                    {tarea.descripcion || "Sin descripción."}
                  </Typography>
                </Box>

                <Divider />

                {/* NOTAS */}

                <PlanTrabajoNotas
                  tareaId={tareaId}
                  notasIniciales={tarea.notas || ""}
                  onUpdated={refrescarTodo}
                />

                <Divider />

                {/* INFORMACIÓN DE CREACIÓN */}

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Creada por
                  </Typography>

                  <Typography variant="body2" fontWeight={600}>
                    {tarea.creador_nombre || "-"}
                  </Typography>
                </Box>
              </Box>
            )}

            {/* =================================================
                TAB 1 - ACTIVIDAD
            ================================================== */}

            {tabActual === 1 && (
              <Box>
                <PlanTrabajoComentarios
                  tareaId={tareaId}
                  usuarioActualId={usuarioActualId}
                />
              </Box>
            )}

            {/* =================================================
                TAB 2 - HISTORIAL
            ================================================== */}

            {tabActual === 2 && (
              <Box>
                <PlanTrabajoHistorial tareaId={tareaId} />
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      {/* =====================================================
          FOOTER
      ====================================================== */}

      <DialogActions sx={modalActionsSx}>
        <Button
          variant="outlined"
          onClick={handleCerrar}
          sx={modalSecondaryButtonSx}
        >
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PlanTrabajoDetalleModal;
