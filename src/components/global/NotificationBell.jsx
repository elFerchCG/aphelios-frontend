import React, {
  useCallback,
  useEffect,
  useMemo,
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

const TIPO_REMOCION_PLAN_TRABAJO =
  "responsable_removido";

const NotificationBell = () => {
  const apiUrl =
    process.env.NODE_ENV === "production"
      ? process.env.REACT_APP_API_URL
      : process.env.REACT_APP_API_URL_LOCAL;

  const token = localStorage.getItem("token");

  const [anchorEl, setAnchorEl] = useState(null);

  const [notificaciones, setNotificaciones] =
    useState([]);

  const [totalNoLeidas, setTotalNoLeidas] =
    useState(0);

  const [loading, setLoading] = useState(false);

  const [moduloActivo, setModuloActivo] =
    useState(null);

  const navigate = useNavigate();

  const open = Boolean(anchorEl);

  // =====================================================
  // MÓDULOS DISPONIBLES
  // =====================================================

  const modulosDisponibles = useMemo(() => {
    return [
      ...new Set(
        notificaciones
          .map(
            (notificacion) =>
              notificacion.modulo,
          )
          .filter(Boolean),
      ),
    ];
  }, [notificaciones]);

  const tieneMultiplesModulos =
    modulosDisponibles.length > 1;

  // =====================================================
  // SELECCIONAR MÓDULO ACTIVO
  // =====================================================

  useEffect(() => {
    if (modulosDisponibles.length === 0) {
      setModuloActivo(null);
      return;
    }

    if (
      !moduloActivo ||
      !modulosDisponibles.includes(moduloActivo)
    ) {
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
      (notificacion) =>
        notificacion.modulo === moduloActivo,
    );
  }, [
    notificaciones,
    tieneMultiplesModulos,
    moduloActivo,
  ]);

  // =====================================================
  // TOTAL NO LEÍDAS POR MÓDULO
  // =====================================================

  const obtenerNoLeidasModulo = (modulo) => {
    return notificaciones.filter(
      (notificacion) =>
        notificacion.modulo === modulo &&
        !Number(notificacion.leida),
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
        .replace(/\b\w/g, (letra) =>
          letra.toUpperCase(),
        ) ||
      "Notificaciones"
    );
  };

  // =====================================================
  // OBTENER TOTAL NO LEÍDAS
  // =====================================================

  const obtenerTotalNoLeidas =
    useCallback(async () => {
      try {
        const resp = await axios.get(
          `${apiUrl}/notificaciones/no-leidas/count`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (resp.data?.ok) {
          setTotalNoLeidas(
            Number(resp.data?.total || 0),
          );
        }
      } catch (error) {
        console.error(
          "Error obteniendo total de notificaciones:",
          error,
        );
      }
    }, [apiUrl, token]);

  // =====================================================
  // OBTENER NOTIFICACIONES
  // =====================================================

  const obtenerNotificaciones =
    useCallback(async () => {
      setLoading(true);

      try {
        const resp = await axios.get(
          `${apiUrl}/notificaciones`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (resp.data?.ok) {
          setNotificaciones(
            resp.data?.notificaciones || [],
          );
        }
      } catch (error) {
        handleApiError(error, {
          defaultMessage:
            "No se pudieron cargar las notificaciones.",
        });
      } finally {
        setLoading(false);
      }
    }, [apiUrl, token]);

  // =====================================================
  // ABRIR CAMPANA
  // =====================================================

  const handleOpen = async (event) => {
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

  const marcarComoLeida = async (
    notificacion,
  ) => {
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
            Number(item.id) ===
            Number(notificacion.id)
              ? {
                  ...item,
                  leida: 1,
                }
              : item,
          ),
        );

        setTotalNoLeidas((prev) =>
          Math.max(0, prev - 1),
        );
      }

      // =================================================
      // NAVEGACIÓN KAIZEN
      // =================================================

      if (
        notificacion.modulo === "kaizen" &&
        notificacion.referencia_tipo ===
          "kaizen"
      ) {
        const esCierre =
          notificacion.tipo ===
            "cierre_manual" ||
          notificacion.tipo ===
            "cierre_automatico";

        handleClose();

        navigate("/kaizenSeguimiento", {
          state: {
            busqueda:
              notificacion.referencia_sku ||
              "",

            estatus: esCierre
              ? "cerrado"
              : "activo",

            kaizenId:
              notificacion.referencia_id,

            productoId:
              notificacion.referencia_producto_id,
          },
        });

        return;
      }

      // =================================================
      // NAVEGACIÓN PLAN DE TRABAJO
      // =================================================

      if (
        notificacion.modulo ===
          "plan_trabajo" &&
        notificacion.referencia_tipo ===
          "tarea"
      ) {
        // ---------------------------------------------
        // SI FUE REMOVIDO DE LA TAREA:
        // - se marca como leída
        // - NO navega
        // ---------------------------------------------

        const esRemocion =
          notificacion.tipo ===
          TIPO_REMOCION_PLAN_TRABAJO;

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
            tareaId: Number(
              notificacion.referencia_id,
            ),
            abrirTarea: true,
          },
        });

        return;
      }
    } catch (error) {
      handleApiError(error, {
        defaultMessage:
          "No se pudo abrir la notificación.",
      });
    }
  };

  // =====================================================
  // MARCAR TODAS COMO LEÍDAS
  // =====================================================

  const marcarTodasComoLeidas =
    async () => {
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

          setTotalNoLeidas(0);
        }
      } catch (error) {
        handleApiError(error, {
          defaultMessage:
            "No se pudieron marcar las notificaciones como leídas.",
        });
      }
    };

  // =====================================================
  // CARGA INICIAL + POLLING
  // =====================================================

  useEffect(() => {
    obtenerTotalNoLeidas();

    const interval = setInterval(() => {
      obtenerTotalNoLeidas();
    }, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [obtenerTotalNoLeidas]);

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
          transition: "all 0.2s ease",

          "&:hover": {
            backgroundColor:
              "rgba(255,255,255,0.20)",
          },
        }}
      >
        <Badge
          badgeContent={totalNoLeidas}
          color="error"
          max={99}
          overlap="circular"
          anchorOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
        >
          <NotificationsNoneIcon
            sx={{
              fontSize: 28,
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
            <Typography
              fontWeight={700}
              fontSize="1rem"
            >
              Notificaciones
            </Typography>

            {totalNoLeidas > 0 && (
              <Typography
                variant="caption"
                color="text.secondary"
              >
                {totalNoLeidas} sin leer
              </Typography>
            )}
          </Box>

          {totalNoLeidas > 0 && (
            <Button
              size="small"
              onClick={
                marcarTodasComoLeidas
              }
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
              onChange={(_, nuevoModulo) =>
                setModuloActivo(
                  nuevoModulo,
                )
              }
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
              sx={{
                minHeight: 48,

                "& .MuiTabs-flexContainer":
                  {
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
              {modulosDisponibles.map(
                (modulo) => {
                  const noLeidas =
                    obtenerNoLeidasModulo(
                      modulo,
                    );

                  return (
                    <Tab
                      key={modulo}
                      value={modulo}
                      label={
                        <Box
                          sx={{
                            display:
                              "flex",
                            alignItems:
                              "center",
                            gap: 0.75,
                          }}
                        >
                          <span>
                            {obtenerNombreModulo(
                              modulo,
                            )}
                          </span>

                          {noLeidas > 0 && (
                            <Chip
                              label={
                                noLeidas >
                                99
                                  ? "99+"
                                  : noLeidas
                              }
                              size="small"
                              sx={{
                                height: 20,
                                minWidth: 20,

                                "& .MuiChip-label":
                                  {
                                    px: 0.7,
                                    fontSize:
                                      "0.7rem",
                                    fontWeight: 700,
                                  },
                              }}
                            />
                          )}
                        </Box>
                      }
                    />
                  );
                },
              )}
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
        ) : notificacionesVisibles.length ===
          0 ? (
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

            <Typography
              variant="body2"
              color="text.secondary"
            >
              {tieneMultiplesModulos &&
              moduloActivo
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
              maxHeight:
                tieneMultiplesModulos
                  ? 430
                  : 480,

              overflowY: "auto",

              "&::-webkit-scrollbar": {
                width: 6,
              },

              "&::-webkit-scrollbar-thumb":
                {
                  backgroundColor:
                    "rgba(0,0,0,0.18)",
                  borderRadius: 10,
                },
            }}
          >
            {notificacionesVisibles.map(
              (notificacion, index) => (
                <React.Fragment
                  key={notificacion.id}
                >
                  <ListItemButton
                    onClick={() =>
                      marcarComoLeida(
                        notificacion,
                      )
                    }
                    sx={{
                      alignItems:
                        "flex-start",
                      px: 2,
                      py: 1.5,

                      backgroundColor:
                        !Number(
                          notificacion.leida,
                        )
                          ? "action.hover"
                          : "transparent",

                      transition:
                        "background-color 0.2s ease",

                      "&:hover": {
                        backgroundColor:
                          "action.selected",
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
                          justifyContent:
                            "space-between",
                          gap: 1,
                          alignItems:
                            "flex-start",
                        }}
                      >
                        <Typography
                          fontSize="0.9rem"
                          fontWeight={
                            !Number(
                              notificacion.leida,
                            )
                              ? 700
                              : 500
                          }
                        >
                          {
                            notificacion.titulo
                          }
                        </Typography>

                        {!Number(
                          notificacion.leida,
                        ) && (
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius:
                                "50%",
                              bgcolor:
                                "primary.main",
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
                        {
                          notificacion.mensaje
                        }
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
                        {new Date(
                          notificacion.fecha_creacion,
                        ).toLocaleString(
                          "es-MX",
                        )}
                      </Typography>
                    </Box>
                  </ListItemButton>

                  {index <
                    notificacionesVisibles.length -
                      1 && <Divider />}
                </React.Fragment>
              ),
            )}
          </List>
        )}
      </Popover>
    </>
  );
};

export default NotificationBell;