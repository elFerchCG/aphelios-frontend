import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import axios from "axios";

import {
  Badge,
  Box,
  Divider,
  IconButton,
  List,
  ListItemButton,
  Popover,
  Typography,
  Button,
  CircularProgress,
  Tabs,
  Tab,
  Chip,
} from "@mui/material";

import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";

import { handleApiError } from "../../helpers/apiErrorHandler";
import { onSocketDisponible } from "../../services/socketService";

// =====================================================
// CONFIGURACIÓN DE MÓDULOS
// =====================================================

const CONFIGURACION_MODULOS = {
  kaizen: {
    label: "Kaizen",
  },

  plan_trabajo: {
    label: "Plan de Trabajo",
  },

  soporte: {
    label: "Soporte",
  },
};

// =====================================================
// TIPO DE NOTIFICACIÓN DE REMOCIÓN
// =====================================================
//
// IMPORTANTE:
// Este valor debe coincidir exactamente con el tipo
// que genera notificarRemocionTarea en backend.
//
// Si allá tienes otro nombre, solamente cambia
// esta constante.
//
// =====================================================

const TIPO_REMOCION_PLAN_TRABAJO = "responsable_removido";

const NotificationBell = () => {
  // =====================================================
  // API
  // =====================================================

  const apiUrl =
    process.env.NODE_ENV === "production"
      ? process.env.REACT_APP_API_URL
      : process.env.REACT_APP_API_URL_LOCAL;

  const token = localStorage.getItem("token");

  // =====================================================
  // ESTADOS
  // =====================================================

  const [anchorEl, setAnchorEl] = useState(null);

  const [notificaciones, setNotificaciones] = useState([]);

  const [totalNoLeidas, setTotalNoLeidas] = useState(0);

  const [loading, setLoading] = useState(false);

  const [moduloActivo, setModuloActivo] = useState(null);

  // =====================================================
  // ATENCIÓN DE LA CAMPANA
  // =====================================================
  //
  // false:
  // hay algo que el usuario todavía no ha revisado
  // y la campana debe llamar su atención.
  //
  // true:
  // el usuario ya abrió la campana.
  //
  // =====================================================

  const [avisoCampanaAtendido, setAvisoCampanaAtendido] = useState(false);

  // Nos permite detectar cuándo aumenta
  // el número de notificaciones.
  const totalAnteriorRef = useRef(null);

  const navigate = useNavigate();

  const open = Boolean(anchorEl);

  // =====================================================
  // MÓDULOS DISPONIBLES
  // =====================================================

  const modulosDisponibles = useMemo(() => {
    return [
      ...new Set(
        notificaciones
          .map((notificacion) => notificacion.modulo)
          .filter(Boolean),
      ),
    ];
  }, [notificaciones]);

  const tieneMultiplesModulos = modulosDisponibles.length > 1;

  // =====================================================
  // SELECCIONAR MÓDULO ACTIVO
  // =====================================================

  useEffect(() => {
    if (modulosDisponibles.length === 0) {
      setModuloActivo(null);
      return;
    }

    if (!moduloActivo || !modulosDisponibles.includes(moduloActivo)) {
      setModuloActivo(modulosDisponibles[0]);
    }
  }, [modulosDisponibles, moduloActivo]);

  // =====================================================
  // NOTIFICACIONES VISIBLES
  // =====================================================

  const notificacionesVisibles = useMemo(() => {
    if (!tieneMultiplesModulos || !moduloActivo) {
      return notificaciones;
    }

    return notificaciones.filter(
      (notificacion) => notificacion.modulo === moduloActivo,
    );
  }, [notificaciones, tieneMultiplesModulos, moduloActivo]);

  // =====================================================
  // TOTAL NO LEÍDAS POR MÓDULO
  // =====================================================

  const obtenerNoLeidasModulo = (modulo) => {
    return notificaciones.filter(
      (notificacion) =>
        notificacion.modulo === modulo && !Number(notificacion.leida),
    ).length;
  };

  // =====================================================
  // NOMBRE AMIGABLE DEL MÓDULO
  // =====================================================

  const obtenerNombreModulo = (modulo) => {
    return (
      CONFIGURACION_MODULOS[modulo]?.label ||
      modulo
        ?.replaceAll("_", " ")
        .replace(/\b\w/g, (letra) => letra.toUpperCase()) ||
      "Notificaciones"
    );
  };

  // =====================================================
  // OBTENER TOTAL NO LEÍDAS
  // =====================================================

  const obtenerTotalNoLeidas = useCallback(async () => {
    try {
      const resp = await axios.get(`${apiUrl}/notificaciones/no-leidas/count`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (resp.data?.ok) {
        const nuevoTotal = Number(resp.data?.total || 0);

        // =============================================
        // PRIMERA CARGA
        // =============================================
        //
        // Si ya existen notificaciones pendientes
        // al entrar a Aphelios, queremos llamar
        // la atención del usuario.
        // =============================================

        if (totalAnteriorRef.current === null) {
          totalAnteriorRef.current = nuevoTotal;

          setTotalNoLeidas(nuevoTotal);

          if (nuevoTotal > 0) {
            setAvisoCampanaAtendido(false);
          }

          return;
        }

        // =============================================
        // LLEGÓ UNA NUEVA NOTIFICACIÓN
        // =============================================
        //
        // Si el usuario ya había abierto la campana
        // pero después aumenta el contador,
        // volvemos a llamar su atención.
        // =============================================

        if (nuevoTotal > totalAnteriorRef.current) {
          setAvisoCampanaAtendido(false);
        }

        // =============================================
        // YA NO HAY PENDIENTES
        // =============================================

        if (nuevoTotal <= 0) {
          setAvisoCampanaAtendido(false);
        }

        totalAnteriorRef.current = nuevoTotal;

        setTotalNoLeidas(nuevoTotal);
      }
    } catch (error) {
      console.error("Error obteniendo total de notificaciones:", error);
    }
  }, [apiUrl, token]);

  // =====================================================
  // OBTENER NOTIFICACIONES
  // =====================================================

  const obtenerNotificaciones = useCallback(async () => {
    setLoading(true);

    try {
      const resp = await axios.get(`${apiUrl}/notificaciones`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (resp.data?.ok) {
        setNotificaciones(resp.data?.notificaciones || []);
      }
    } catch (error) {
      handleApiError(error, {
        defaultMessage: "No se pudieron cargar las notificaciones.",
      });
    } finally {
      setLoading(false);
    }
  }, [apiUrl, token]);

  // =====================================================
  // ABRIR CAMPANA
  // =====================================================

  const handleOpen = async (event) => {
    // El usuario ya atendió visualmente
    // el aviso.
    //
    // IMPORTANTE:
    // esto NO marca las notificaciones
    // como leídas.
    setAvisoCampanaAtendido(true);

    setAnchorEl(event.currentTarget);

    await obtenerNotificaciones();
  };

  // =====================================================
  // CERRAR CAMPANA
  // =====================================================

  const handleClose = () => {
    setAnchorEl(null);
  };

  // =====================================================
  // MARCAR UNA COMO LEÍDA
  // =====================================================

  const marcarComoLeida = async (notificacion) => {
    try {
      // ==========================================
      // MARCAR COMO LEÍDA
      // ==========================================

      if (!Number(notificacion.leida)) {
        await axios.patch(
          `${apiUrl}/notificaciones/${notificacion.id}/leida`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        setNotificaciones((prev) =>
          prev.map((item) =>
            Number(item.id) === Number(notificacion.id)
              ? {
                  ...item,
                  leida: 1,
                }
              : item,
          ),
        );

        setTotalNoLeidas((prev) => {
          const nuevoTotal = Math.max(0, prev - 1);

          // Mantener sincronizado
          // el valor anterior.
          totalAnteriorRef.current = nuevoTotal;

          return nuevoTotal;
        });
      }

      // =================================================
      // NAVEGACIÓN KAIZEN
      // =================================================

      if (
        notificacion.modulo === "kaizen" &&
        notificacion.referencia_tipo === "kaizen"
      ) {
        const esCierre =
          notificacion.tipo === "cierre_manual" ||
          notificacion.tipo === "cierre_automatico";

        handleClose();

        navigate("/kaizenSeguimiento", {
          state: {
            busqueda: notificacion.referencia_sku || "",

            estatus: esCierre ? "cerrado" : "activo",

            kaizenId: notificacion.referencia_id,

            productoId: notificacion.referencia_producto_id,
          },
        });

        return;
      }

      // =================================================
      // NAVEGACIÓN PLAN DE TRABAJO
      // =================================================

      if (
        notificacion.modulo === "plan_trabajo" &&
        notificacion.referencia_tipo === "tarea"
      ) {
        // ---------------------------------------------
        // SI FUE REMOVIDO DE LA TAREA:
        // - se marca como leída
        // - NO navega
        // ---------------------------------------------

        const esRemocion = notificacion.tipo === TIPO_REMOCION_PLAN_TRABAJO;

        if (esRemocion) {
          return;
        }

        // ---------------------------------------------
        // RESTO DE NOTIFICACIONES:
        // - asignación
        // - comentario
        // - prioridad
        // - estatus
        //
        // Abren directamente la tarea.
        // ---------------------------------------------

        handleClose();

        navigate("/planTrabajo", {
          state: {
            tareaId: Number(notificacion.referencia_id),

            abrirTarea: true,
          },
        });

        return;
      }

      // =================================================
      // NAVEGACIÓN SOPORTE / TICKETS
      // =================================================

      if (
        notificacion.modulo === "soporte" &&
        notificacion.referencia_tipo === "ticket"
      ) {
        // ---------------------------------------------
        // VALIDAR REFERENCIA DEL TICKET
        // ---------------------------------------------

        const ticketId = Number(notificacion.referencia_id);

        if (!Number.isInteger(ticketId) || ticketId <= 0) {
          console.warn(
            "[Notificaciones] La notificación de Soporte no tiene un ticket válido:",
            notificacion,
          );

          return;
        }

        // ---------------------------------------------
        // CERRAR CAMPANA
        // ---------------------------------------------

        handleClose();

        // ---------------------------------------------
        // NAVEGAR AL TICKET
        // ---------------------------------------------

        navigate("/soporte", {
          state: {
            ticketId,
            abrirTicket: true,
          },
        });

        return;
      }
    } catch (error) {
      handleApiError(error, {
        defaultMessage: "No se pudo abrir la notificación.",
      });
    }
  };

  // =====================================================
  // MARCAR TODAS COMO LEÍDAS
  // =====================================================

  const marcarTodasComoLeidas = async () => {
    try {
      const resp = await axios.patch(
        `${apiUrl}/notificaciones/marcar-todas-leidas`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (resp.data?.ok) {
        setNotificaciones((prev) =>
          prev.map((item) => ({
            ...item,
            leida: 1,
          })),
        );

        // Sincronizar contador y ref.
        totalAnteriorRef.current = 0;

        setTotalNoLeidas(0);

        setAvisoCampanaAtendido(false);
      }
    } catch (error) {
      handleApiError(error, {
        defaultMessage: "No se pudieron marcar las notificaciones como leídas.",
      });
    }
  };

  // =====================================================
  // CARGA INICIAL + POLLING
  // =====================================================

  // =====================================================
  // CARGA INICIAL DE NOTIFICACIONES
  // =====================================================

  useEffect(() => {
    obtenerTotalNoLeidas();
  }, [obtenerTotalNoLeidas]);

  // =====================================================
  // SOCKET.IO - NOTIFICACIONES EN TIEMPO REAL
  // KAIZEN + PLAN DE TRABAJO + SOPORTE
  // =====================================================

  useEffect(() => {
    let socketActual = null;

    // ===================================================
    // ACTUALIZAR CONTADOR Y LISTADO
    // ===================================================

    const actualizarNotificaciones = () => {
      obtenerTotalNoLeidas();

      if (open) {
        obtenerNotificaciones();
      }
    };

    // ===================================================
    // REGISTRAR SOCKET
    // ===================================================

    const registrarSocket = (socket) => {
      if (socketActual) {
        socketActual.off(
          "kaizen:notificaciones:actualizar",
          actualizarNotificaciones,
        );

        socketActual.off(
          "plan_trabajo:notificaciones:actualizar",
          actualizarNotificaciones,
        );

        socketActual.off(
          "soporte:notificaciones:actualizar",
          actualizarNotificaciones,
        );

        socketActual.off("connect", actualizarNotificaciones);
      }

      socketActual = socket;

      // =================================================
      // KAIZEN
      // =================================================

      socket.on("kaizen:notificaciones:actualizar", actualizarNotificaciones);

      // =================================================
      // PLAN DE TRABAJO
      // =================================================

      socket.on(
        "plan_trabajo:notificaciones:actualizar",
        actualizarNotificaciones,
      );

      // =================================================
      // SOPORTE / TICKETS
      // =================================================

      socket.on("soporte:notificaciones:actualizar", actualizarNotificaciones);

      // =================================================
      // RECONEXIÓN
      // =================================================

      socket.on("connect", actualizarNotificaciones);

      // Sincronizar si ya estaba conectado
      if (socket.connected) {
        actualizarNotificaciones();
      }
    };

    // ===================================================
    // SUSCRIPCIÓN AL SOCKET COMPARTIDO
    // ===================================================

    const cancelarSuscripcion = onSocketDisponible(registrarSocket);

    // ===================================================
    // LIMPIEZA
    // ===================================================

    return () => {
      cancelarSuscripcion();

      if (socketActual) {
        socketActual.off(
          "kaizen:notificaciones:actualizar",
          actualizarNotificaciones,
        );

        socketActual.off(
          "plan_trabajo:notificaciones:actualizar",
          actualizarNotificaciones,
        );

        socketActual.off(
          "soporte:notificaciones:actualizar",
          actualizarNotificaciones,
        );

        socketActual.off("connect", actualizarNotificaciones);
      }
    };
  }, [obtenerTotalNoLeidas, obtenerNotificaciones, open]);

  // =====================================================
  // SOCKET.IO - NOTIFICACIONES KAIZEN EN TIEMPO REAL
  // =====================================================

  const debeAnimarCampana = totalNoLeidas > 0 && !avisoCampanaAtendido;

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <>
      {/* ================================================= */}
      {/* CAMPANA */}
      {/* ================================================= */}

      <IconButton
        onClick={handleOpen}
        size="large"
        aria-label="Notificaciones"
        sx={{
          width: 44,
          height: 44,

          borderRadius: "12px",

          color: "#0f2744",

          transition: "background-color 0.2s ease",

          "&:hover": {
            backgroundColor: "rgba(255,255,255,0.20)",
          },

          // ===============================================
          // ANIMACIÓN DE ATENCIÓN
          //
          // La campana permanece quieta durante
          // buena parte del ciclo y después hace
          // un pequeño ring.
          // ===============================================

          "@keyframes notificationAttention": {
            "0%": {
              transform: "rotate(0deg)",
            },

            "68%": {
              transform: "rotate(0deg)",
            },

            "74%": {
              transform: "rotate(14deg)",
            },

            "80%": {
              transform: "rotate(-12deg)",
            },

            "86%": {
              transform: "rotate(10deg)",
            },

            "91%": {
              transform: "rotate(-7deg)",
            },

            "95%": {
              transform: "rotate(4deg)",
            },

            "100%": {
              transform: "rotate(0deg)",
            },
          },
        }}
      >
        <Badge
          badgeContent={totalNoLeidas}
          color="error"
          max={99}
          overlap="circular"
          invisible={totalNoLeidas <= 0}
          anchorOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
        >
          <NotificationsNoneIcon
            sx={{
              fontSize: 28,

              animation: debeAnimarCampana
                ? "notificationAttention 2.8s ease-in-out infinite"
                : "none",

              // La campana parece colgar
              // desde la parte superior.
              transformOrigin: "50% 10%",
            }}
          />
        </Badge>
      </IconButton>

      {/* ================================================= */}
      {/* POPOVER */}
      {/* ================================================= */}

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        PaperProps={{
          sx: {
            width: 420,

            maxWidth: "calc(100vw - 24px)",

            maxHeight: 600,

            borderRadius: 2.5,

            overflow: "hidden",
          },
        }}
      >
        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <Box
          sx={{
            px: 2,
            py: 1.5,

            display: "flex",
            alignItems: "center",

            justifyContent: "space-between",

            gap: 2,
          }}
        >
          <Box>
            <Typography fontWeight={700} fontSize="1rem">
              Notificaciones
            </Typography>

            {totalNoLeidas > 0 && (
              <Typography variant="caption" color="text.secondary">
                {totalNoLeidas} sin leer
              </Typography>
            )}
          </Box>

          {totalNoLeidas > 0 && (
            <Button
              size="small"
              onClick={marcarTodasComoLeidas}
              sx={{
                textTransform: "none",
              }}
            >
              Marcar todas
            </Button>
          )}
        </Box>

        <Divider />

        {/* ================================================= */}
        {/* TABS POR MÓDULO */}
        {/* ================================================= */}

        {tieneMultiplesModulos && (
          <>
            <Tabs
              value={moduloActivo}
              onChange={(_, nuevoModulo) => setModuloActivo(nuevoModulo)}
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
              sx={{
                minHeight: 48,

                "& .MuiTabs-flexContainer": {
                  px: 1,
                },

                "& .MuiTab-root": {
                  minHeight: 48,

                  textTransform: "none",

                  fontSize: "0.83rem",

                  fontWeight: 600,

                  px: 1.5,
                },

                "& .Mui-selected": {
                  fontWeight: 700,
                },
              }}
            >
              {modulosDisponibles.map((modulo) => {
                const noLeidas = obtenerNoLeidasModulo(modulo);

                return (
                  <Tab
                    key={modulo}
                    value={modulo}
                    label={
                      <Box
                        sx={{
                          display: "flex",

                          alignItems: "center",

                          gap: 0.75,
                        }}
                      >
                        <span>{obtenerNombreModulo(modulo)}</span>

                        {noLeidas > 0 && (
                          <Chip
                            label={noLeidas > 99 ? "99+" : noLeidas}
                            size="small"
                            sx={{
                              height: 20,

                              minWidth: 20,

                              "& .MuiChip-label": {
                                px: 0.7,

                                fontSize: "0.7rem",

                                fontWeight: 700,
                              },
                            }}
                          />
                        )}
                      </Box>
                    }
                  />
                );
              })}
            </Tabs>

            <Divider />
          </>
        )}

        {/* ================================================= */}
        {/* CONTENIDO */}
        {/* ================================================= */}

        {loading ? (
          <Box
            sx={{
              display: "flex",

              justifyContent: "center",

              py: 4,
            }}
          >
            <CircularProgress size={24} />
          </Box>
        ) : notificacionesVisibles.length === 0 ? (
          <Box
            sx={{
              px: 3,
              py: 5,

              textAlign: "center",
            }}
          >
            <NotificationsNoneIcon
              sx={{
                fontSize: 38,

                opacity: 0.4,

                mb: 1,
              }}
            />

            <Typography variant="body2" color="text.secondary">
              {tieneMultiplesModulos && moduloActivo
                ? `No tienes notificaciones de ${obtenerNombreModulo(
                    moduloActivo,
                  )}.`
                : "No tienes notificaciones."}
            </Typography>
          </Box>
        ) : (
          <List
            disablePadding
            sx={{
              maxHeight: tieneMultiplesModulos ? 430 : 480,

              overflowY: "auto",

              "&::-webkit-scrollbar": {
                width: 6,
              },

              "&::-webkit-scrollbar-thumb": {
                backgroundColor: "rgba(0,0,0,0.18)",

                borderRadius: 10,
              },
            }}
          >
            {notificacionesVisibles.map((notificacion, index) => (
              <React.Fragment key={notificacion.id}>
                <ListItemButton
                  onClick={() => marcarComoLeida(notificacion)}
                  sx={{
                    alignItems: "flex-start",

                    px: 2,
                    py: 1.5,

                    backgroundColor: !Number(notificacion.leida)
                      ? "action.hover"
                      : "transparent",

                    transition: "background-color 0.2s ease",

                    "&:hover": {
                      backgroundColor: "action.selected",
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: "100%",
                      minWidth: 0,
                    }}
                  >
                    {/* =================================== */}
                    {/* TÍTULO */}
                    {/* =================================== */}

                    <Box
                      sx={{
                        display: "flex",

                        justifyContent: "space-between",

                        gap: 1,

                        alignItems: "flex-start",
                      }}
                    >
                      <Typography
                        fontSize="0.9rem"
                        fontWeight={!Number(notificacion.leida) ? 700 : 500}
                      >
                        {notificacion.titulo}
                      </Typography>

                      {!Number(notificacion.leida) && (
                        <Box
                          sx={{
                            width: 8,
                            height: 8,

                            borderRadius: "50%",

                            bgcolor: "primary.main",

                            mt: 0.6,

                            flexShrink: 0,
                          }}
                        />
                      )}
                    </Box>

                    {/* =================================== */}
                    {/* MENSAJE */}
                    {/* =================================== */}

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mt: 0.5,

                        lineHeight: 1.45,
                      }}
                    >
                      {notificacion.mensaje}
                    </Typography>

                    {/* =================================== */}
                    {/* FECHA */}
                    {/* =================================== */}

                    <Typography
                      variant="caption"
                      color="text.disabled"
                      sx={{
                        display: "block",

                        mt: 0.75,
                      }}
                    >
                      {new Date(notificacion.fecha_creacion).toLocaleString(
                        "es-MX",
                      )}
                    </Typography>
                  </Box>
                </ListItemButton>

                {index < notificacionesVisibles.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Popover>
    </>
  );
};

export default NotificationBell;
