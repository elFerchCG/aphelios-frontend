import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import axios from "axios";
import Swal from "sweetalert2";

import {
  Button,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
} from "@mui/material";

import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ToggleOnOutlinedIcon from "@mui/icons-material/ToggleOnOutlined";
import ToggleOffOutlinedIcon from "@mui/icons-material/ToggleOffOutlined";

import useAuthStore from "../../../store/authStore";

// ============================================================
// COMPONENTES COMUNES APHELIOS
// ============================================================

import PageHeader from "../../common/PageHeader";
import PageToolbarCard from "../../common/PageToolbarCard";
import AppDataGrid from "../../common/AppDataGrid";

import {
  toolbarFieldSx,
  toolbarButtonSx,
  fieldWidths,
} from "../../common/formStyles";

// ============================================================
// MODAL
// ============================================================

import AvisoModal from "./AvisoModal";

// ============================================================
// CONFIGURACIÓN DE TIPOS
// ============================================================

const TIPOS = {
  general: {
    label: "General",
    color: "info",
  },

  importante: {
    label: "Importante",
    color: "warning",
  },

  novedad: {
    label: "Novedad",
    color: "success",
  },

  sistema: {
    label: "Sistema",
    color: "primary",
  },

  mantenimiento: {
    label: "Mantenimiento",
    color: "warning",
  },
};

// ============================================================
// API URL
// ============================================================

const getApiUrl = () => {
  return process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_URL
    : process.env.REACT_APP_API_URL_LOCAL;
};

// ============================================================
// FORMATEAR FECHA
// ============================================================

const formatearFecha = (fecha) => {
  if (!fecha) {
    return "—";
  }

  const date = new Date(fecha);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// ============================================================
// COMPONENTE
// ============================================================

const AvisosAdmin = () => {
  const { token } = useAuthStore();

  const apiUrl = getApiUrl();

  // ==========================================================
  // DATOS
  // ==========================================================

  const [avisos, setAvisos] = useState([]);
  const [loading, setLoading] = useState(false);

  // ==========================================================
  // FILTROS
  // ==========================================================

  const [busqueda, setBusqueda] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("todos");
  const [estadoFiltro, setEstadoFiltro] = useState("todos");

  // ==========================================================
  // MODAL
  // ==========================================================

  const [openModal, setOpenModal] = useState(false);

  const [
    avisoSeleccionado,
    setAvisoSeleccionado,
  ] = useState(null);

  // ==========================================================
  // OBTENER AVISOS
  // ==========================================================

  const obtenerAvisos = useCallback(async () => {
    if (!token) {
      return;
    }

    try {
      setLoading(true);

      const response = await axios.get(
        `${apiUrl}/avisos`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.data?.ok) {
        return;
      }

      setAvisos(
        Array.isArray(response.data.avisos)
          ? response.data.avisos
          : [],
      );
    } catch (error) {
      console.error(
        "[Avisos] Error obteniendo avisos:",
        error,
      );

      Swal.fire({
        icon: "error",
        title: "Error",
        text:
          error.response?.data?.message ||
          "No fue posible obtener los avisos.",
      });
    } finally {
      setLoading(false);
    }
  }, [apiUrl, token]);

  // ==========================================================
  // CARGA INICIAL
  // ==========================================================

  useEffect(() => {
    obtenerAvisos();
  }, [obtenerAvisos]);

  // ==========================================================
  // FILTRAR AVISOS
  // ==========================================================

  const avisosFiltrados = useMemo(() => {
    const texto = busqueda
      .trim()
      .toLowerCase();

    return avisos.filter((aviso) => {
      // ------------------------------------------------------
      // BÚSQUEDA
      // ------------------------------------------------------

      const coincideBusqueda =
        !texto ||
        aviso.titulo
          ?.toLowerCase()
          .includes(texto) ||
        aviso.mensaje
          ?.toLowerCase()
          .includes(texto) ||
        aviso.creado_por
          ?.toLowerCase()
          .includes(texto);

      // ------------------------------------------------------
      // TIPO
      // ------------------------------------------------------

      const coincideTipo =
        tipoFiltro === "todos" ||
        aviso.tipo === tipoFiltro;

      // ------------------------------------------------------
      // ESTADO
      // ------------------------------------------------------

      const estaActivo =
        Number(aviso.activo) === 1;

      const coincideEstado =
        estadoFiltro === "todos" ||
        (estadoFiltro === "activos" &&
          estaActivo) ||
        (estadoFiltro === "inactivos" &&
          !estaActivo);

      return (
        coincideBusqueda &&
        coincideTipo &&
        coincideEstado
      );
    });
  }, [
    avisos,
    busqueda,
    tipoFiltro,
    estadoFiltro,
  ]);

  // ==========================================================
  // NUEVO AVISO
  // ==========================================================

  const abrirNuevoAviso = () => {
    setAvisoSeleccionado(null);
    setOpenModal(true);
  };

  // ==========================================================
  // EDITAR AVISO
  // ==========================================================

  const abrirEditarAviso = (aviso) => {
    setAvisoSeleccionado(aviso);
    setOpenModal(true);
  };

  // ==========================================================
  // CERRAR MODAL
  // ==========================================================

  const cerrarModal = () => {
    setOpenModal(false);
    setAvisoSeleccionado(null);
  };

  // ==========================================================
  // AVISO GUARDADO
  // ==========================================================

  const handleAvisoGuardado = async () => {
    cerrarModal();

    await obtenerAvisos();
  };

  // ==========================================================
  // ACTIVAR / DESACTIVAR
  // ==========================================================

  const cambiarEstado = async (aviso) => {
    const estaActivo =
      Number(aviso.activo) === 1;

    const resultado =
      await Swal.fire({
        icon: "question",

        title: estaActivo
          ? "¿Desactivar aviso?"
          : "¿Activar aviso?",

        text: estaActivo
          ? "El aviso dejará de mostrarse a los usuarios."
          : "El aviso podrá mostrarse nuevamente si se encuentra vigente.",

        showCancelButton: true,

        confirmButtonText: estaActivo
          ? "Sí, desactivar"
          : "Sí, activar",

        cancelButtonText: "Cancelar",
      });

    if (!resultado.isConfirmed) {
      return;
    }

    try {
      await axios.patch(
        `${apiUrl}/avisos/${aviso.id}/estado`,
        {
          activo: !estaActivo,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      await obtenerAvisos();

      Swal.fire({
        icon: "success",

        title: estaActivo
          ? "Aviso desactivado"
          : "Aviso activado",

        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error(
        "[Avisos] Error cambiando estado:",
        error,
      );

      Swal.fire({
        icon: "error",
        title: "Error",

        text:
          error.response?.data?.message ||
          "No fue posible actualizar el estado del aviso.",
      });
    }
  };

  // ==========================================================
  // COLUMNAS
  // ==========================================================

  const columns = [
    // --------------------------------------------------------
    // ID
    // --------------------------------------------------------

    {
      field: "id",
      headerName: "ID",
      width: 80,
    },

    // --------------------------------------------------------
    // TIPO
    // --------------------------------------------------------

    {
      field: "tipo",
      headerName: "Tipo",
      minWidth: 145,

      renderCell: (params) => {
        const config =
          TIPOS[params.row.tipo] ||
          TIPOS.general;

        return (
          <Chip
            label={config.label}
            color={config.color}
            size="small"
            variant="outlined"
          />
        );
      },
    },

    // --------------------------------------------------------
    // TÍTULO
    // --------------------------------------------------------

    {
      field: "titulo",
      headerName: "Título",
      flex: 1,
      minWidth: 240,
    },

    // --------------------------------------------------------
    // INICIO
    // --------------------------------------------------------

    {
      field: "fecha_inicio",
      headerName: "Inicio",
      minWidth: 175,

      renderCell: (params) =>
        formatearFecha(
          params.row.fecha_inicio,
        ),
    },

    // --------------------------------------------------------
    // EXPIRACIÓN
    // --------------------------------------------------------

    {
      field: "fecha_expiracion",
      headerName: "Expiración",
      minWidth: 175,

      renderCell: (params) =>
        formatearFecha(
          params.row.fecha_expiracion,
        ),
    },

    // --------------------------------------------------------
    // CREADO POR
    // --------------------------------------------------------

    {
      field: "creado_por",
      headerName: "Creado por",
      minWidth: 170,

      renderCell: (params) =>
        params.row.creado_por || "—",
    },

    // --------------------------------------------------------
    // VISTOS
    // --------------------------------------------------------

    {
      field: "total_vistos",
      headerName: "Vistos",
      width: 100,

      align: "center",
      headerAlign: "center",

      renderCell: (params) =>
        Number(
          params.row.total_vistos || 0,
        ),
    },

    // --------------------------------------------------------
    // ESTADO
    // --------------------------------------------------------

    {
      field: "activo",
      headerName: "Estado",
      width: 120,

      renderCell: (params) => {
        const activo =
          Number(params.row.activo) === 1;

        return (
          <Chip
            label={
              activo
                ? "Activo"
                : "Inactivo"
            }
            color={
              activo
                ? "success"
                : "default"
            }
            size="small"
            variant={
              activo
                ? "filled"
                : "outlined"
            }
          />
        );
      },
    },

    // --------------------------------------------------------
    // ACCIONES
    // --------------------------------------------------------

    {
      field: "acciones",
      headerName: "Acciones",

      width: 120,

      sortable: false,
      filterable: false,

      align: "center",
      headerAlign: "center",

      renderCell: (params) => {
        const activo =
          Number(params.row.activo) === 1;

        return (
          <Stack
            direction="row"
            spacing={0.5}
            alignItems="center"
            justifyContent="center"
            sx={{
              width: "100%",
              height: "100%",
            }}
          >
            {/* EDITAR */}

            <Tooltip title="Editar">
              <Button
                size="small"
                onClick={() =>
                  abrirEditarAviso(
                    params.row,
                  )
                }
                sx={{
                  minWidth: 36,
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                }}
              >
                <EditOutlinedIcon fontSize="small" />
              </Button>
            </Tooltip>

            {/* ACTIVAR / DESACTIVAR */}

            <Tooltip
              title={
                activo
                  ? "Desactivar"
                  : "Activar"
              }
            >
              <Button
                size="small"
                color={
                  activo
                    ? "warning"
                    : "success"
                }
                onClick={() =>
                  cambiarEstado(
                    params.row,
                  )
                }
                sx={{
                  minWidth: 36,
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                }}
              >
                {activo ? (
                  <ToggleOnOutlinedIcon />
                ) : (
                  <ToggleOffOutlinedIcon />
                )}
              </Button>
            </Tooltip>
          </Stack>
        );
      },
    },
  ];

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <>
      {/* ======================================================
          HEADER ESTÁNDAR
      ====================================================== */}

      <PageHeader
        icon={CampaignOutlinedIcon}
        title="Administración de Avisos"
        subtitle="Crea y administra comunicados globales para los usuarios de Aphelios."
      />

      {/* ======================================================
          TOOLBAR ESTÁNDAR
      ====================================================== */}

      <PageToolbarCard>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            flexWrap: "wrap",
            width: "100%",
          }}
        >
          {/* ==================================================
              BUSCAR
          ================================================== */}

          <TextField
            label="Buscar aviso"
            placeholder="Título, mensaje o creador..."
            value={busqueda}
            onChange={(e) =>
              setBusqueda(e.target.value)
            }
            sx={{
              ...toolbarFieldSx,
              width: fieldWidths.large,
            }}
          />

          {/* ==================================================
              TIPO
          ================================================== */}

          <FormControl
            sx={{
              ...toolbarFieldSx,
              width: fieldWidths.medium,
            }}
          >
            <InputLabel>
              Tipo
            </InputLabel>

            <Select
              label="Tipo"
              value={tipoFiltro}
              onChange={(e) =>
                setTipoFiltro(
                  e.target.value,
                )
              }
            >
              <MenuItem value="todos">
                Todos
              </MenuItem>

              <MenuItem value="general">
                General
              </MenuItem>

              <MenuItem value="importante">
                Importante
              </MenuItem>

              <MenuItem value="novedad">
                Novedad
              </MenuItem>

              <MenuItem value="sistema">
                Sistema
              </MenuItem>

              <MenuItem value="mantenimiento">
                Mantenimiento
              </MenuItem>
            </Select>
          </FormControl>

          {/* ==================================================
              ESTADO
          ================================================== */}

          <FormControl
            sx={{
              ...toolbarFieldSx,
              width: fieldWidths.medium,
            }}
          >
            <InputLabel>
              Estado
            </InputLabel>

            <Select
              label="Estado"
              value={estadoFiltro}
              onChange={(e) =>
                setEstadoFiltro(
                  e.target.value,
                )
              }
            >
              <MenuItem value="todos">
                Todos
              </MenuItem>

              <MenuItem value="activos">
                Activos
              </MenuItem>

              <MenuItem value="inactivos">
                Inactivos
              </MenuItem>
            </Select>
          </FormControl>

          {/* ==================================================
              NUEVO AVISO
          ================================================== */}

          <Button
            variant="contained"
            startIcon={
              <AddOutlinedIcon />
            }
            sx={{
              ...toolbarButtonSx,
              ml: "auto",
            }}
            onClick={abrirNuevoAviso}
          >
            Nuevo aviso
          </Button>
        </div>
      </PageToolbarCard>

      {/* ======================================================
          TABLA ESTÁNDAR
      ====================================================== */}

      <div
        style={{
          marginLeft: "30px",
          marginRight: "30px",
        }}
      >
        <AppDataGrid
          rows={avisosFiltrados}
          columns={columns}
          loading={loading}
          getRowId={(row) => row.id}
          exportFileName="avisos"
          initialColumnVisibilityModel={{
            id: false,
          }}
        />
      </div>

      {/* ======================================================
          MODAL
      ====================================================== */}

      <AvisoModal
        open={openModal}
        aviso={avisoSeleccionado}
        onClose={cerrarModal}
        onGuardado={
          handleAvisoGuardado
        }
      />
    </>
  );
};

export default AvisosAdmin;