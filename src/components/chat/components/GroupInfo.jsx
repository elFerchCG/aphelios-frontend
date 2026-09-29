import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Tooltip,
  Typography,
} from "@mui/material";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CloseIcon from "@mui/icons-material/Close";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import CircleIcon from "@mui/icons-material/Circle";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import PersonAddAltOutlinedIcon from "@mui/icons-material/PersonAddAltOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";

import axios from "axios";

import EditGroupNameDialog from "./group/EditGroupNameDialog";
import AddGroupParticipantsDialog from "./group/AddGroupParticipantsDialog";
import ParticipantMenu from "./group/ParticipantMenu";
import RemoveGroupParticipantDialog from "./group/RemoveGroupParticipantDialog";
import LeaveGroupDialog from "./group/LeaveGroupDialog";

import useAuthStore from "../../../store/authStore";

import {
  onSocketDisponible,
} from "../../../services/socketService";

const GroupInfo = ({
  conversacion,
  usuarios = [],
  loadingUsuarios = false,
  obtenerUsuarios,
  onBack,
  onClose,
}) => {
  const { token, user } = useAuthStore();

  // ============================================================
  // ESTADOS GENERALES
  // ============================================================

  const [
    participantes,
    setParticipantes,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    editarNombreOpen,
    setEditarNombreOpen,
  ] = useState(false);

  const [
    agregarParticipantesOpen,
    setAgregarParticipantesOpen,
  ] = useState(false);

  const [
    nombreGrupo,
    setNombreGrupo,
  ] = useState(
    conversacion?.nombre || "",
  );

  // ============================================================
  // MENÚ PARTICIPANTE
  // ============================================================

  const [
    menuAnchorEl,
    setMenuAnchorEl,
  ] = useState(null);

  const [
    participanteSeleccionado,
    setParticipanteSeleccionado,
  ] = useState(null);

  const [
    quitarParticipanteOpen,
    setQuitarParticipanteOpen,
  ] = useState(false);

  // ============================================================
  // SALIR DEL GRUPO
  // ============================================================

  const [
    salirGrupoOpen,
    setSalirGrupoOpen,
  ] = useState(false);

  // ============================================================
  // API
  // ============================================================

  const apiUrl =
    process.env.NODE_ENV === "production"
      ? process.env.REACT_APP_API_URL
      : process.env.REACT_APP_API_URL_LOCAL;

  // ============================================================
  // CONVERSACIÓN
  // ============================================================

  const conversacionId = Number(
    conversacion?.id,
  );

  // ============================================================
  // USUARIO ACTUAL
  // ============================================================

  const usuarioActualId = Number(
    user?.id ??
      user?.id_usuario ??
      user?.usuario_id,
  );

  // ============================================================
  // PERMISOS
  // ============================================================

  const esAdministrador =
    (
      user?.rol_descripcion ||
      user?.rol ||
      ""
    )
      .trim()
      .toLowerCase() ===
    "administrador";

  // ============================================================
  // OBTENER PARTICIPANTES
  // ============================================================

  const obtenerParticipantes =
    useCallback(async () => {
      if (
        !token ||
        !conversacionId
      ) {
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response =
          await axios.get(
            `${apiUrl}/chat/conversaciones/${conversacionId}/participantes`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            },
          );

        setParticipantes(
          Array.isArray(response.data)
            ? response.data
            : [],
        );
      } catch (error) {
        console.error(
          "Error obteniendo participantes del grupo:",
          error,
        );

        setParticipantes([]);

        setError(
          error.response?.data?.message ||
            "No se pudieron cargar los participantes.",
        );
      } finally {
        setLoading(false);
      }
    }, [
      apiUrl,
      token,
      conversacionId,
    ]);

  // ============================================================
  // CARGA INICIAL
  // ============================================================

  useEffect(() => {
    obtenerParticipantes();
  }, [obtenerParticipantes]);

  // ============================================================
  // SINCRONIZAR NOMBRE
  // ============================================================

  useEffect(() => {
    setNombreGrupo(
      conversacion?.nombre || "",
    );
  }, [
    conversacion?.id,
    conversacion?.nombre,
  ]);

  // ============================================================
  // SOCKET.IO
  // ============================================================

  useEffect(() => {
    if (!conversacionId) {
      return;
    }

    let socketActual = null;

    // ==========================================================
    // NOMBRE ACTUALIZADO
    // ==========================================================

    const handleConversacionActualizada = (
      data,
    ) => {
      if (
        Number(
          data?.conversacionId,
        ) !==
        Number(conversacionId)
      ) {
        return;
      }

      if (data?.tipo !== "grupo") {
        return;
      }

      if (
        typeof data?.nombre ===
        "string"
      ) {
        setNombreGrupo(
          data.nombre,
        );
      }
    };

    // ==========================================================
    // PARTICIPANTES ACTUALIZADOS
    // ==========================================================

    const handleParticipantesActualizados = (
      data,
    ) => {
      if (
        Number(
          data?.conversacionId,
        ) !==
        Number(conversacionId)
      ) {
        return;
      }

      obtenerParticipantes();
    };

    // ==========================================================
    // REGISTRAR LISTENERS
    // ==========================================================

    const registrarListeners = (
      socket,
    ) => {
      if (
        socketActual === socket
      ) {
        return;
      }

      if (socketActual) {
        socketActual.off(
          "chat:conversacion:actualizada",
          handleConversacionActualizada,
        );

        socketActual.off(
          "chat:participantes:actualizados",
          handleParticipantesActualizados,
        );
      }

      socketActual = socket;

      socketActual.on(
        "chat:conversacion:actualizada",
        handleConversacionActualizada,
      );

      socketActual.on(
        "chat:participantes:actualizados",
        handleParticipantesActualizados,
      );
    };

    const unsubscribe =
      onSocketDisponible(
        registrarListeners,
      );

    // ==========================================================
    // CLEANUP
    // ==========================================================

    return () => {
      unsubscribe();

      if (socketActual) {
        socketActual.off(
          "chat:conversacion:actualizada",
          handleConversacionActualizada,
        );

        socketActual.off(
          "chat:participantes:actualizados",
          handleParticipantesActualizados,
        );
      }
    };
  }, [
    conversacionId,
    obtenerParticipantes,
  ]);

  // ============================================================
  // TOTAL PARTICIPANTES
  // ============================================================

  const totalParticipantes =
    participantes.length;

  // ============================================================
  // INICIAL AVATAR
  // ============================================================

  const obtenerInicial = (
    nombre,
  ) => {
    if (!nombre) {
      return "?";
    }

    return nombre
      .trim()
      .charAt(0)
      .toUpperCase();
  };

  // ============================================================
  // TEXTO PARTICIPANTES
  // ============================================================

  const textoParticipantes =
    useMemo(() => {
      if (loading) {
        return "Cargando participantes...";
      }

      if (
        totalParticipantes === 1
      ) {
        return "1 participante";
      }

      return `${totalParticipantes} participantes`;
    }, [
      loading,
      totalParticipantes,
    ]);

  // ============================================================
  // EDITAR NOMBRE
  // ============================================================

  const handleEditarNombre = () => {
    if (!esAdministrador) {
      return;
    }

    setEditarNombreOpen(true);
  };

  const handleNombreActualizado = (
    nuevoNombre,
  ) => {
    setNombreGrupo(
      nuevoNombre,
    );
  };

  // ============================================================
  // AGREGAR PARTICIPANTES
  // ============================================================

  const handleAgregarParticipantes =
    async () => {
      if (!esAdministrador) {
        return;
      }

      try {
        if (obtenerUsuarios) {
          await obtenerUsuarios();
        }

        setAgregarParticipantesOpen(
          true,
        );
      } catch (error) {
        console.error(
          "Error preparando usuarios para agregar:",
          error,
        );
      }
    };

  const handleParticipantesAgregados =
    async () => {
      await obtenerParticipantes();
    };

  // ============================================================
  // ABRIR MENÚ PARTICIPANTE
  // ============================================================

  const handleOpcionesParticipante = (
    event,
    participante,
  ) => {
    if (!esAdministrador) {
      return;
    }

    setMenuAnchorEl(
      event.currentTarget,
    );

    setParticipanteSeleccionado(
      participante,
    );
  };

  // ============================================================
  // CERRAR MENÚ PARTICIPANTE
  // ============================================================

  const handleCerrarMenuParticipante =
    () => {
      setMenuAnchorEl(null);
    };

  // ============================================================
  // SOLICITAR QUITAR PARTICIPANTE
  // ============================================================

  const handleSolicitarQuitarParticipante = (
    participante,
  ) => {
    if (!esAdministrador) {
      return;
    }

    if (!participante) {
      return;
    }

    if (
      Number(
        participante.usuario_id,
      ) === usuarioActualId
    ) {
      return;
    }

    setParticipanteSeleccionado(
      participante,
    );

    setQuitarParticipanteOpen(
      true,
    );

    // Cerramos el menú DESPUÉS
    // de preparar el dialog.
    setMenuAnchorEl(null);
  };

  // ============================================================
  // CERRAR DIALOG QUITAR PARTICIPANTE
  // ============================================================

  const handleCerrarQuitarParticipante =
    () => {
      setQuitarParticipanteOpen(
        false,
      );

      setParticipanteSeleccionado(
        null,
      );
    };

  // ============================================================
  // PARTICIPANTE RETIRADO
  // ============================================================

  const handleParticipanteRetirado =
    async () => {
      await obtenerParticipantes();
    };

  // ============================================================
  // ABRIR SALIR DEL GRUPO
  // ============================================================

  const handleAbrirSalirGrupo = () => {
    setSalirGrupoOpen(true);
  };

  // ============================================================
  // CERRAR SALIR DEL GRUPO
  // ============================================================

  const handleCerrarSalirGrupo = () => {
    setSalirGrupoOpen(false);
  };

  // ============================================================
  // SALIDA DEL GRUPO CONFIRMADA
  // ============================================================

  const handleSalidaGrupo = async (
    response,
  ) => {
    console.log(
      "[GroupInfo] Salida del grupo confirmada:",
      response,
    );

    setSalirGrupoOpen(false);

    // No hacemos obtenerParticipantes()
    // porque el usuario ya no pertenece al grupo.

    onBack?.();
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor:
          "background.paper",
      }}
    >
      {/* =====================================================
          HEADER
      ===================================================== */}

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          px: 1.5,
          py: 1.25,
          borderBottom: 1,
          borderColor: "divider",
          flexShrink: 0,
        }}
      >
        <Tooltip title="Regresar">
          <IconButton
            size="small"
            onClick={onBack}
          >
            <ArrowBackIcon />
          </IconButton>
        </Tooltip>

        <Box
          sx={{
            minWidth: 0,
            flex: 1,
          }}
        >
          <Typography
            variant="subtitle1"
            fontWeight={700}
            noWrap
          >
            Información del grupo
          </Typography>

          <Typography
            variant="caption"
            color="text.secondary"
          >
            {textoParticipantes}
          </Typography>
        </Box>

        <Tooltip title="Cerrar">
          <IconButton
            size="small"
            onClick={onClose}
          >
            <CloseIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* =====================================================
          INFORMACIÓN DEL GRUPO
      ===================================================== */}

      <Box
        sx={{
          px: 2,
          py: 2.5,
          textAlign: "center",
          flexShrink: 0,
        }}
      >
        <Avatar
          sx={{
            width: 72,
            height: 72,
            mx: "auto",
            mb: 1.25,
            bgcolor: "primary.main",
          }}
        >
          <GroupsOutlinedIcon
            sx={{
              fontSize: 38,
            }}
          />
        </Avatar>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent:
              "center",
            gap: 0.5,
          }}
        >
          <Typography
            variant="h6"
            fontWeight={700}
            sx={{
              wordBreak:
                "break-word",
            }}
          >
            {nombreGrupo ||
              "Grupo"}
          </Typography>

          {esAdministrador && (
            <Tooltip title="Editar nombre">
              <IconButton
                size="small"
                onClick={
                  handleEditarNombre
                }
              >
                <EditOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        <Typography
          variant="body2"
          color="text.secondary"
        >
          {textoParticipantes}
        </Typography>
      </Box>

      <Divider />

      {/* =====================================================
          PARTICIPANTES HEADER
      ===================================================== */}

      <Box
        sx={{
          px: 2,
          pt: 2,
          pb: 1,
          display: "flex",
          alignItems: "center",
          justifyContent:
            "space-between",
          flexShrink: 0,
        }}
      >
        <Typography
          variant="subtitle2"
          fontWeight={700}
        >
          Participantes
        </Typography>

        {esAdministrador && (
          <Tooltip title="Agregar participantes">
            <IconButton
              size="small"
              onClick={
                handleAgregarParticipantes
              }
              aria-label="Agregar participantes"
            >
              <PersonAddAltOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* =====================================================
          LISTA PARTICIPANTES
      ===================================================== */}

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
        }}
      >
        {loading && (
          <Box
            sx={{
              minHeight: 180,
              display: "flex",
              alignItems:
                "center",
              justifyContent:
                "center",
            }}
          >
            <CircularProgress
              size={28}
            />
          </Box>
        )}

        {!loading && error && (
          <Box
            sx={{
              px: 2,
              py: 3,
              textAlign:
                "center",
            }}
          >
            <Typography
              variant="body2"
              color="error"
            >
              {error}
            </Typography>
          </Box>
        )}

        {!loading &&
          !error &&
          participantes.length ===
            0 && (
            <Box
              sx={{
                px: 2,
                py: 3,
                textAlign:
                  "center",
              }}
            >
              <Typography
                variant="body2"
                color="text.secondary"
              >
                No hay participantes
                para mostrar.
              </Typography>
            </Box>
          )}

        {!loading &&
          !error &&
          participantes.length >
            0 && (
            <List
              disablePadding
              sx={{
                px: 1,
                pb: 2,
              }}
            >
              {participantes.map(
                (participante) => {
                  const esAdminGrupo =
                    participante.tipo_participante ===
                    "administrador";

                  const esUsuarioActual =
                    Number(
                      participante.usuario_id,
                    ) ===
                    usuarioActualId;

                  return (
                    <ListItem
                      key={
                        participante.usuario_id
                      }
                      sx={{
                        px: 1,
                        py: 1,
                        borderRadius: 2,
                        alignItems:
                          "center",

                        "&:hover": {
                          bgcolor:
                            "action.hover",
                        },
                      }}
                    >
                      {/* AVATAR */}

                      <ListItemAvatar>
                        <Box
                          sx={{
                            position:
                              "relative",
                            width: 42,
                            height: 42,
                          }}
                        >
                          <Avatar
                            sx={{
                              width: 42,
                              height: 42,
                            }}
                          >
                            {obtenerInicial(
                              participante.nombre,
                            )}
                          </Avatar>

                          {participante.conectado && (
                            <CircleIcon
                              sx={{
                                position:
                                  "absolute",
                                right: -1,
                                bottom: -1,
                                fontSize: 13,
                                color:
                                  "success.main",
                                bgcolor:
                                  "background.paper",
                                borderRadius:
                                  "50%",
                              }}
                            />
                          )}
                        </Box>
                      </ListItemAvatar>

                      {/* INFORMACIÓN */}

                      <ListItemText
                        primary={
                          <Box
                            sx={{
                              display:
                                "flex",
                              alignItems:
                                "center",
                              gap: 0.75,
                              minWidth: 0,
                            }}
                          >
                            <Typography
                              variant="body2"
                              fontWeight={
                                600
                              }
                              noWrap
                            >
                              {
                                participante.nombre
                              }

                              {esUsuarioActual
                                ? " (Tú)"
                                : ""}
                            </Typography>

                            {esAdminGrupo && (
                              <Tooltip title="Administrador del grupo">
                                <AdminPanelSettingsOutlinedIcon
                                  sx={{
                                    fontSize: 17,
                                    color:
                                      "primary.main",
                                    flexShrink: 0,
                                  }}
                                />
                              </Tooltip>
                            )}
                          </Box>
                        }
                        secondary={
                          participante.rol ||
                          "Sin rol"
                        }
                        secondaryTypographyProps={{
                          variant:
                            "caption",
                          color:
                            "text.secondary",
                        }}
                      />

                      {/* ADMIN GRUPO */}

                      {esAdminGrupo && (
                        <Chip
                          label="Admin. grupo"
                          size="small"
                          variant="outlined"
                          sx={{
                            ml: 1,
                            flexShrink: 0,
                            fontSize:
                              "0.7rem",
                          }}
                        />
                      )}

                      {/* OPCIONES */}

                      {esAdministrador && (
                        <Tooltip title="Opciones">
                          <IconButton
                            size="small"
                            onClick={(
                              event,
                            ) =>
                              handleOpcionesParticipante(
                                event,
                                participante,
                              )
                            }
                            aria-label={`Opciones de ${participante.nombre}`}
                            sx={{
                              ml: 0.5,
                              flexShrink: 0,
                            }}
                          >
                            <MoreVertIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </ListItem>
                  );
                },
              )}
            </List>
          )}
      </Box>

      {/* =====================================================
          SALIR DEL GRUPO
      ===================================================== */}

      <Box
        sx={{
          px: 2,
          py: 2,
          borderTop: 1,
          borderColor: "divider",
          flexShrink: 0,
        }}
      >
        <Button
          fullWidth
          variant="outlined"
          color="error"
          startIcon={
            <LogoutOutlinedIcon />
          }
          onClick={
            handleAbrirSalirGrupo
          }
          sx={{
            borderRadius: 2,
            py: 1.1,
            textTransform: "none",
            fontWeight: 600,
          }}
        >
          Salir del grupo
        </Button>
      </Box>

      {/* =====================================================
          MENÚ PARTICIPANTE
      ===================================================== */}

      <ParticipantMenu
        anchorEl={
          menuAnchorEl
        }
        open={Boolean(
          menuAnchorEl,
        )}
        participante={
          participanteSeleccionado
        }
        esUsuarioActual={
          Number(
            participanteSeleccionado?.usuario_id,
          ) === usuarioActualId
        }
        onClose={
          handleCerrarMenuParticipante
        }
        onRemove={
          handleSolicitarQuitarParticipante
        }
      />

      {/* =====================================================
          EDITAR NOMBRE
      ===================================================== */}

      <EditGroupNameDialog
        open={
          editarNombreOpen
        }
        conversacion={{
          ...conversacion,
          nombre: nombreGrupo,
        }}
        onClose={() =>
          setEditarNombreOpen(
            false,
          )
        }
        onUpdated={
          handleNombreActualizado
        }
      />

      {/* =====================================================
          AGREGAR PARTICIPANTES
      ===================================================== */}

      <AddGroupParticipantsDialog
        open={
          agregarParticipantesOpen
        }
        conversacion={{
          ...conversacion,
          nombre: nombreGrupo,
        }}
        usuarios={usuarios}
        participantesActuales={
          participantes
        }
        loadingUsuarios={
          loadingUsuarios
        }
        onClose={() =>
          setAgregarParticipantesOpen(
            false,
          )
        }
        onUpdated={
          handleParticipantesAgregados
        }
      />

      {/* =====================================================
          QUITAR PARTICIPANTE
      ===================================================== */}

      <RemoveGroupParticipantDialog
        open={
          quitarParticipanteOpen
        }
        conversacion={
          conversacion
        }
        participante={
          participanteSeleccionado
        }
        onClose={
          handleCerrarQuitarParticipante
        }
        onRemoved={
          handleParticipanteRetirado
        }
      />

      {/* =====================================================
          SALIR DEL GRUPO
      ===================================================== */}

      <LeaveGroupDialog
        open={
          salirGrupoOpen
        }
        conversacion={{
          ...conversacion,
          nombre: nombreGrupo,
        }}
        onClose={
          handleCerrarSalirGrupo
        }
        onLeft={
          handleSalidaGrupo
        }
      />
    </Box>
  );
};

export default GroupInfo;