import React, { useCallback, useEffect, useMemo, useState } from "react";

import { useLocation, useNavigate } from "react-router-dom";

import axios from "axios";

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import TaskAltOutlinedIcon from "@mui/icons-material/TaskAltOutlined";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import PlayCircleOutlineOutlinedIcon from "@mui/icons-material/PlayCircleOutlineOutlined";
import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";

import PageHeader from "../../common/PageHeader";
import PageToolbarCard from "../../common/PageToolbarCard";
import AppDataGrid from "../../common/AppDataGrid";

import PlanTrabajoTareaModal from "./PlanTrabajoTareaModal";
import PlanTrabajoDetalleModal from "./PlanTrabajoDetalleModal";

import {
  toolbarFieldSx,
  toolbarButtonSx,
  fieldWidths,
} from "../../common/formStyles";

const PlanTrabajo = () => {
  // =========================================================
  // CONFIG
  // =========================================================

  const apiUrl =
    process.env.NODE_ENV === "production"
      ? process.env.REACT_APP_API_URL
      : process.env.REACT_APP_API_URL_LOCAL;

  const token = localStorage.getItem("token");

  const location = useLocation();
  const navigate = useNavigate();

  // =========================================================
  // OBTENER USUARIO ACTUAL
  // =========================================================

  const obtenerUsuarioLocal = () => {
    try {
      const usuarioStorage = localStorage.getItem("user");

      if (!usuarioStorage) {
        return null;
      }

      return JSON.parse(usuarioStorage);
    } catch (error) {
      console.error("Error al leer usuario local:", error);
      return null;
    }
  };

  const usuarioLocal = obtenerUsuarioLocal();

  const usuarioActualId = usuarioLocal?.id_usuario ?? usuarioLocal?.id ?? "";

  // =========================================================
  // STATES
  // =========================================================

  const [tareas, setTareas] = useState([]);
  const [administradores, setAdministradores] = useState([]);

  const [loading, setLoading] = useState(false);

  const [busqueda, setBusqueda] = useState("");
  const [estatus, setEstatus] = useState("todos");
  const [prioridad, setPrioridad] = useState("todos");
  const [responsableId, setResponsableId] = useState(usuarioActualId);

  const [modalTareaOpen, setModalTareaOpen] = useState(false);

  const [tareaSeleccionada, setTareaSeleccionada] = useState(null);

  const [modalDetalleOpen, setModalDetalleOpen] = useState(false);

  const [tareaDetalleId, setTareaDetalleId] = useState(null);

  // =========================================================
  // NAVEGACIÓN DESDE NOTIFICACIONES
  // =========================================================

  const tareaNotificacionId = location.state?.tareaId;

  const abrirTareaDesdeNotificacion = location.state?.abrirTarea === true;

  // =========================================================
  // OBTENER ADMINISTRADORES
  // =========================================================

  const obtenerAdministradores = useCallback(async () => {
    try {
      const response = await axios.get(
        `${apiUrl}/planTrabajo/administradores`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setAdministradores(response.data?.administradores || []);
    } catch (error) {
      console.error("Error al obtener administradores:", error);

      setAdministradores([]);
    }
  }, [apiUrl, token]);

  // =========================================================
  // OBTENER TAREAS
  // =========================================================

  const obtenerTareas = useCallback(async () => {
    try {
      setLoading(true);

      const params = {};

      if (busqueda.trim()) {
        params.busqueda = busqueda.trim();
      }

      if (estatus !== "todos") {
        params.estatus = estatus;
      }

      if (prioridad !== "todos") {
        params.prioridad = prioridad;
      }

      if (responsableId) {
        params.responsableId = responsableId;
      }

      const response = await axios.get(`${apiUrl}/planTrabajo/tareas`, {
        params,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setTareas(response.data?.tareas || []);
    } catch (error) {
      console.error("Error al obtener tareas del plan de trabajo:", error);

      setTareas([]);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, token, busqueda, estatus, prioridad, responsableId]);

  // =========================================================
  // EFFECTS
  // =========================================================

  useEffect(() => {
    obtenerAdministradores();
  }, [obtenerAdministradores]);

  useEffect(() => {
    const timer = setTimeout(() => {
      obtenerTareas();
    }, 350);

    return () => clearTimeout(timer);
  }, [obtenerTareas]);

  useEffect(() => {
    if (!abrirTareaDesdeNotificacion || !tareaNotificacionId) {
      return;
    }

    setTareaDetalleId(Number(tareaNotificacionId));

    setModalDetalleOpen(true);

    // Limpiamos el state de navegación para evitar
    // que el modal vuelva a abrirse automáticamente
    // si el componente se vuelve a renderizar.
    navigate(location.pathname, {
      replace: true,
      state: {},
    });
  }, [
    abrirTareaDesdeNotificacion,
    tareaNotificacionId,
    navigate,
    location.pathname,
  ]);

  // =========================================================
  // RESUMEN
  // =========================================================

  const resumen = useMemo(() => {
    return {
      pendientes: tareas.filter((tarea) => tarea.estatus === "pendiente")
        .length,

      enProceso: tareas.filter((tarea) => tarea.estatus === "en_proceso")
        .length,

      bloqueadas: tareas.filter((tarea) => tarea.estatus === "bloqueada")
        .length,

      finalizadas: tareas.filter((tarea) => tarea.estatus === "finalizada")
        .length,
    };
  }, [tareas]);

  // =========================================================
  // HELPERS
  // =========================================================

  const obtenerTextoEstatus = (valor) => {
    const opciones = {
      pendiente: "Pendiente",
      en_proceso: "En proceso",
      bloqueada: "Bloqueada",
      finalizada: "Finalizada",
      cancelada: "Cancelada",
    };

    return opciones[valor] || valor || "-";
  };

  const obtenerColorEstatus = (valor) => {
    switch (valor) {
      case "en_proceso":
        return "info";

      case "bloqueada":
        return "warning";

      case "finalizada":
        return "success";

      case "cancelada":
        return "error";

      default:
        return "default";
    }
  };

  const obtenerTextoPrioridad = (valor) => {
    const opciones = {
      baja: "Baja",
      media: "Media",
      alta: "Alta",
      urgente: "Urgente",
    };

    return opciones[valor] || valor || "-";
  };

  const obtenerColorPrioridad = (valor) => {
    switch (valor) {
      case "urgente":
        return "error";

      case "alta":
        return "warning";

      case "media":
        return "info";

      default:
        return "default";
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) {
      return "-";
    }

    const valor = String(fecha).slice(0, 10);

    const [anio, mes, dia] = valor.split("-");

    if (!anio || !mes || !dia) {
      return "-";
    }

    return `${dia}/${mes}/${anio}`;
  };

  const formatearTiempo = (segundos) => {
    const total = Number(segundos) || 0;

    if (total <= 0) {
      return "0 min";
    }

    const horas = Math.floor(total / 3600);

    const minutos = Math.floor((total % 3600) / 60);

    if (horas > 0) {
      return `${horas} h ${minutos} min`;
    }

    return `${minutos} min`;
  };

  // =========================================================
  // HANDLERS
  // =========================================================

  const handleNuevaTarea = () => {
    setTareaSeleccionada(null);
    setModalTareaOpen(true);
  };

  const handleEditarTarea = (tarea) => {
    setTareaSeleccionada(tarea);
    setModalTareaOpen(true);
  };

  const handleCerrarModalTarea = () => {
    setModalTareaOpen(false);
    setTareaSeleccionada(null);
  };

  const handleVerDetalle = (tarea) => {
    setTareaDetalleId(tarea.id);
    setModalDetalleOpen(true);
  };

  const handleCerrarDetalle = () => {
    setModalDetalleOpen(false);
    setTareaDetalleId(null);
  };

  // =========================================================
  // COLUMNAS
  // =========================================================

  const columns = useMemo(
    () => [
      {
        field: "orden",
        headerName: "Orden",
        width: 80,
        align: "center",
        headerAlign: "center",
      },
      {
        field: "titulo",
        headerName: "Tarea",
        flex: 1,
        minWidth: 220,
      },
      {
        field: "responsable_nombre",
        headerName: "Responsable",
        flex: 0.65,
        minWidth: 150,
      },
      {
        field: "prioridad",
        headerName: "Prioridad",
        width: 115,

        renderCell: (params) => (
          <Chip
            label={obtenerTextoPrioridad(params.value)}
            color={obtenerColorPrioridad(params.value)}
            size="small"
            variant="outlined"
          />
        ),
      },
      {
        field: "estatus",
        headerName: "Estatus",
        width: 130,

        renderCell: (params) => (
          <Chip
            label={obtenerTextoEstatus(params.value)}
            color={obtenerColorEstatus(params.value)}
            size="small"
            variant="outlined"
          />
        ),
      },
      {
        field: "tiempo_total_segundos",
        headerName: "Tiempo",
        width: 110,

        valueFormatter: (value) => formatearTiempo(value),
      },
      {
        field: "total_comentarios",
        headerName: "Comentarios",
        width: 120,
        align: "center",
        headerAlign: "center",
      },
      {
        field: "fecha_objetivo",
        headerName: "Fecha objetivo",
        width: 140,

        valueFormatter: (value) => formatearFecha(value),
      },
      {
        field: "acciones",
        headerName: "Acciones",
        width: 120,
        sortable: false,
        filterable: false,
        align: "center",
        headerAlign: "center",

        renderCell: (params) => (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 0.75,
              width: "100%",
              height: "100%",
            }}
          >
            {/* VER DETALLE */}
            <Tooltip title="Ver detalle" arrow>
              <IconButton
                size="small"
                onClick={(event) => {
                  event.stopPropagation();
                  handleVerDetalle(params.row);
                }}
                sx={{
                  color: "#1976d2",
                  backgroundColor: "rgba(25, 118, 210, 0.08)",

                  "&:hover": {
                    backgroundColor: "rgba(25, 118, 210, 0.16)",
                  },
                }}
              >
                <VisibilityOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            {/* EDITAR */}
            <Tooltip title="Editar tarea" arrow>
              <IconButton
                size="small"
                onClick={(event) => {
                  event.stopPropagation();
                  handleEditarTarea(params.row);
                }}
                sx={{
                  color: "#ed6c02",
                  backgroundColor: "rgba(237, 108, 2, 0.08)",

                  "&:hover": {
                    backgroundColor: "rgba(237, 108, 2, 0.16)",
                  },
                }}
              >
                <EditOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        ),
      },
    ],
    [],
  );

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: "100%",
        boxSizing: "border-box",
        overflowX: "hidden",
      }}
    >
      {/* =====================================================
          HEADER ESTÁNDAR
      ====================================================== */}

      <PageHeader
        icon={TaskAltOutlinedIcon}
        title="Plan de Trabajo"
        subtitle="Seguimiento de pendientes, acuerdos y actividades administrativas."
      />

      {/* =====================================================
          RESUMEN
      ====================================================== */}

      <Box
        sx={{
          mx: "30px",
          mb: 2,
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, minmax(0, 1fr))",
            lg: "repeat(4, minmax(0, 1fr))",
          },
          gap: 2,
          minWidth: 0,
        }}
      >
        <Card variant="outlined">
          <CardContent>
            <AssignmentOutlinedIcon color="action" fontSize="small" />

            <Typography variant="h5" fontWeight={600} sx={{ mt: 1 }}>
              {resumen.pendientes}
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Pendientes
            </Typography>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <PlayCircleOutlineOutlinedIcon color="info" fontSize="small" />

            <Typography variant="h5" fontWeight={600} sx={{ mt: 1 }}>
              {resumen.enProceso}
            </Typography>

            <Typography variant="body2" color="text.secondary">
              En proceso
            </Typography>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <BlockOutlinedIcon color="warning" fontSize="small" />

            <Typography variant="h5" fontWeight={600} sx={{ mt: 1 }}>
              {resumen.bloqueadas}
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Bloqueadas
            </Typography>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <CheckCircleOutlineOutlinedIcon color="success" fontSize="small" />

            <Typography variant="h5" fontWeight={600} sx={{ mt: 1 }}>
              {resumen.finalizadas}
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Finalizadas
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* =====================================================
          TOOLBAR ESTÁNDAR
      ====================================================== */}

      <PageToolbarCard>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            flexWrap: "wrap",
            width: "100%",
            minWidth: 0,
          }}
        >
          <TextField
            label="Buscar"
            placeholder="Título, descripción u origen"
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
            sx={{
              ...toolbarFieldSx,
              width: fieldWidths.large,
              maxWidth: "100%",
            }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchOutlinedIcon fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
          />

          <FormControl
            sx={{
              ...toolbarFieldSx,
              width: fieldWidths.medium,
              maxWidth: "100%",
            }}
          >
            <InputLabel>Responsable</InputLabel>

            <Select
              value={responsableId}
              label="Responsable"
              onChange={(event) => setResponsableId(event.target.value)}
            >
              <MenuItem value="">Todos</MenuItem>

              {administradores.map((admin) => (
                <MenuItem key={admin.id_usuario} value={admin.id_usuario}>
                  {admin.nombre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl
            sx={{
              ...toolbarFieldSx,
              width: fieldWidths.medium,
              maxWidth: "100%",
            }}
          >
            <InputLabel>Estatus</InputLabel>

            <Select
              value={estatus}
              label="Estatus"
              onChange={(event) => setEstatus(event.target.value)}
            >
              <MenuItem value="todos">Todos</MenuItem>

              <MenuItem value="pendiente">Pendiente</MenuItem>

              <MenuItem value="en_proceso">En proceso</MenuItem>

              <MenuItem value="bloqueada">Bloqueada</MenuItem>

              <MenuItem value="finalizada">Finalizada</MenuItem>

              <MenuItem value="cancelada">Cancelada</MenuItem>
            </Select>
          </FormControl>

          <FormControl
            sx={{
              ...toolbarFieldSx,
              width: fieldWidths.medium,
              maxWidth: "100%",
            }}
          >
            <InputLabel>Prioridad</InputLabel>

            <Select
              value={prioridad}
              label="Prioridad"
              onChange={(event) => setPrioridad(event.target.value)}
            >
              <MenuItem value="todos">Todas</MenuItem>

              <MenuItem value="urgente">Urgente</MenuItem>

              <MenuItem value="alta">Alta</MenuItem>

              <MenuItem value="media">Media</MenuItem>

              <MenuItem value="baja">Baja</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="contained"
            startIcon={<AddOutlinedIcon />}
            sx={{
              ...toolbarButtonSx,
              ml: {
                xs: 0,
                xl: "auto",
              },
            }}
            onClick={handleNuevaTarea}
          >
            Nueva tarea
          </Button>
        </Box>
      </PageToolbarCard>

      {/* =====================================================
          DATAGRID ESTÁNDAR
      ====================================================== */}

      <Box
        sx={{
          mx: "30px",
          minWidth: 0,
          maxWidth: "calc(100% - 60px)",
        }}
      >
        <AppDataGrid
          rows={tareas}
          columns={columns}
          loading={loading}
          getRowId={(row) => row.id}
          exportFileName="plan-trabajo"
        />
      </Box>

      {/* =====================================================
          MODAL

          Lo conectaremos en el siguiente paso.
      ====================================================== */}
      <PlanTrabajoTareaModal
        open={modalTareaOpen}
        onClose={handleCerrarModalTarea}
        tarea={tareaSeleccionada}
        administradores={administradores}
        onSaved={obtenerTareas}
      />

      <PlanTrabajoDetalleModal
        open={modalDetalleOpen}
        onClose={handleCerrarDetalle}
        tareaId={tareaDetalleId}
        onUpdated={obtenerTareas}
      />
    </Box>
  );
};

export default PlanTrabajo;
