import React, { useCallback, useEffect, useMemo, useState } from "react";

import { useLocation, useNavigate } from "react-router-dom";

import axios from "axios";

import { Box } from "@mui/material";

import ConfirmationNumberOutlinedIcon from "@mui/icons-material/ConfirmationNumberOutlined";

import PageHeader from "../../common/PageHeader";
import AppDataGrid from "../../common/AppDataGrid";

import { handleApiError } from "../../../helpers/apiErrorHandler";

import NuevoTicketModal from "./modals/NuevoTicketModal";
import TicketDetalleModal from "./modals/TicketDetalleModal";

// =========================================================
// COMPONENTES DE SOPORTE
// =========================================================

import SoporteResumen from "./components/SoporteResumen";
import SoporteTabs from "./components/SoporteTabs";
import SoporteFiltros from "./components/SoporteFiltros";

import { crearColumnasSoporte } from "./components/soporteColumns";

// =========================================================
// FILTROS INICIALES
// =========================================================

const filtrosIniciales = {
  busqueda: "",
  estatus: "todos",
  usuarioFiltro: "",
  categoriaId: "",
  areaId: "",
  prioridad: "todos",
  asignadoA: "",
};

// =========================================================
// COMPONENTE
// =========================================================

const Soporte = () => {
  // =========================================================
  // CONFIG
  // =========================================================

  const apiUrl =
    process.env.NODE_ENV === "production"
      ? process.env.REACT_APP_API_URL
      : process.env.REACT_APP_API_URL_LOCAL;

  const token = localStorage.getItem("token");

  // =========================================================
  // NAVEGACIÓN DESDE NOTIFICACIONES
  // =========================================================

  const location = useLocation();
  const navigate = useNavigate();

  // =========================================================
  // STATES - TICKETS
  // =========================================================

  const [tickets, setTickets] = useState([]);

  const [loading, setLoading] = useState(false);

  // =========================================================
  // STATES - VISTAS / PERMISOS
  // =========================================================

  const [vista, setVista] = useState("mis");

  const [permisos, setPermisos] = useState({
    puedeVerTodos: false,
    puedeVerAsignados: false,
  });

  // =========================================================
  // STATES - CATÁLOGOS
  // =========================================================

  const [categorias, setCategorias] = useState([]);

  const [areas, setAreas] = useState([]);

  const [usuarios, setUsuarios] = useState([]);

  // =========================================================
  // STATES - FILTROS
  // =========================================================

  const [filtros, setFiltros] = useState(filtrosIniciales);

  // =========================================================
  // STATES - MODALES
  // =========================================================

  const [nuevoTicketOpen, setNuevoTicketOpen] = useState(false);

  const [ticketDetalleId, setTicketDetalleId] = useState(null);

  const [detalleOpen, setDetalleOpen] = useState(false);

  // =========================================================
  // DESARROLLADORES
  // =========================================================

  const desarrolladores = useMemo(() => {
    return usuarios.filter(
      (usuario) => usuario.rol_descripcion === "Desarrollador",
    );
  }, [usuarios]);

  // =========================================================
  // OBTENER CATÁLOGOS
  // =========================================================

  const obtenerCatalogos = useCallback(async () => {
    try {
      const [catalogosResponse, usuariosResponse] = await Promise.all([
        axios.get(`${apiUrl}/tickets/catalogos`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),

        axios.get(`${apiUrl}/usuarios`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);

      setCategorias(catalogosResponse.data?.categorias || []);

      setAreas(catalogosResponse.data?.areas || []);

      setUsuarios(
        Array.isArray(usuariosResponse.data) ? usuariosResponse.data : [],
      );
    } catch (error) {
      handleApiError(error, {
        defaultMessage: "No se pudieron cargar los catálogos de soporte.",

        warningTitle: "No se pudieron cargar los filtros",
      });
    }
  }, [apiUrl, token]);

  // =========================================================
  // OBTENER TICKETS
  // =========================================================

  const obtenerTickets = useCallback(async () => {
    try {
      setLoading(true);

      const {
        busqueda,
        estatus,
        usuarioFiltro,
        categoriaId,
        areaId,
        prioridad,
        asignadoA,
      } = filtros;

      const params = {
        vista,
      };

      // -----------------------------------------------------
      // BÚSQUEDA
      // -----------------------------------------------------

      if (busqueda.trim()) {
        params.busqueda = busqueda.trim();
      }

      // -----------------------------------------------------
      // ESTATUS
      // -----------------------------------------------------

      if (estatus !== "todos") {
        params.estatus = estatus;
      }

      // -----------------------------------------------------
      // CATEGORÍA
      // -----------------------------------------------------

      if (categoriaId) {
        params.categoriaId = categoriaId;
      }

      // -----------------------------------------------------
      // ÁREA
      // -----------------------------------------------------

      if (areaId) {
        params.areaId = areaId;
      }

      // -----------------------------------------------------
      // PRIORIDAD
      //
      // Solo aplica para vistas de gestión.
      // -----------------------------------------------------

      if (vista !== "mis" && prioridad !== "todos") {
        params.prioridad = prioridad;
      }

      // -----------------------------------------------------
      // USUARIO CREADOR
      //
      // Disponible en:
      // - Todos
      // - Asignados a mí
      // -----------------------------------------------------

      if ((vista === "todos" || vista === "asignados") && usuarioFiltro) {
        params.usuarioId = usuarioFiltro;
      }

      // -----------------------------------------------------
      // ASIGNADO A
      //
      // Solo tiene sentido en Todos.
      // El backend valida permisos.
      // -----------------------------------------------------

      if (vista === "todos" && asignadoA) {
        params.asignadoA = asignadoA;
      }

      // -----------------------------------------------------
      // REQUEST
      // -----------------------------------------------------

      const response = await axios.get(`${apiUrl}/tickets`, {
        params,

        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setTickets(response.data?.tickets || []);

      setPermisos({
        puedeVerTodos: Boolean(response.data?.permisos?.puedeVerTodos),

        puedeVerAsignados: Boolean(response.data?.permisos?.puedeVerAsignados),
      });
    } catch (error) {
      handleApiError(error, {
        defaultMessage: "No se pudieron obtener los tickets.",

        warningTitle: "No se pudo cargar soporte",
      });

      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, token, vista, filtros]);

  // =========================================================
  // EFFECT - CATÁLOGOS
  // =========================================================

  useEffect(() => {
    obtenerCatalogos();
  }, [obtenerCatalogos]);

  // =========================================================
  // EFFECT - TICKETS
  //
  // Debounce para evitar requests por cada tecla.
  // =========================================================

  useEffect(() => {
    const timeout = setTimeout(() => {
      obtenerTickets();
    }, 350);

    return () => clearTimeout(timeout);
  }, [obtenerTickets]);

  // =========================================================
  // ABRIR TICKET DESDE NOTIFICACIONES
  // =========================================================

  useEffect(() => {
    const ticketId = Number(location.state?.ticketId);
    const abrirTicket = location.state?.abrirTicket === true;

    if (!abrirTicket) return;

    if (!Number.isInteger(ticketId) || ticketId <= 0) {
      return;
    }

    // Abrir el detalle del ticket solicitado.
    setTicketDetalleId(ticketId);
    setDetalleOpen(true);

    // Limpiar el estado de navegación para evitar
    // reaperturas al refrescar o volver a la página.
    navigate(location.pathname, {
      replace: true,
      state: null,
    });
  }, [location.state, location.pathname, navigate]);

  // =========================================================
  // RESUMEN
  // =========================================================

  const resumen = useMemo(() => {
    return {
      activos: tickets.filter((ticket) =>
        [
          "abierto",
          "en_revision",
          "en_desarrollo",
          "esperando_usuario",
        ].includes(ticket.estatus),
      ).length,

      esperando: tickets.filter(
        (ticket) => ticket.estatus === "esperando_usuario",
      ).length,

      resueltos: tickets.filter((ticket) => ticket.estatus === "resuelto")
        .length,
    };
  }, [tickets]);

  const areasConRuta = useMemo(() => {
    return areas.map((area) => {
      if (!area.parent_id) {
        return {
          ...area,
          nombreCompleto: area.nombre,
        };
      }

      const padre = areas.find(
        (item) => String(item.id) === String(area.parent_id),
      );

      return {
        ...area,

        nombreCompleto: padre
          ? `${padre.nombre} › ${area.nombre}`
          : area.nombre,
      };
    });
  }, [areas]);

  // =========================================================
  // CAMBIAR FILTRO
  // =========================================================

  const handleFiltroChange = useCallback((campo, valor) => {
    setFiltros((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  }, []);

  // =========================================================
  // HAY FILTROS
  // =========================================================

  const hayFiltros =
    Boolean(filtros.busqueda.trim()) ||
    filtros.estatus !== "todos" ||
    filtros.usuarioFiltro !== "" ||
    filtros.categoriaId !== "" ||
    filtros.areaId !== "" ||
    filtros.prioridad !== "todos" ||
    filtros.asignadoA !== "";

  // =========================================================
  // LIMPIAR FILTROS
  // =========================================================

  const limpiarFiltros = useCallback(() => {
    setFiltros({
      ...filtrosIniciales,
    });
  }, []);

  // =========================================================
  // CAMBIAR VISTA
  // =========================================================

  const handleCambiarVista = useCallback(
    (_event, nuevaVista) => {
      limpiarFiltros();

      setVista(nuevaVista);
    },
    [limpiarFiltros],
  );

  // =========================================================
  // NUEVO TICKET
  // =========================================================

  const handleNuevoTicket = useCallback(() => {
    setNuevoTicketOpen(true);
  }, []);

  // =========================================================
  // VER DETALLE
  // =========================================================

  const handleVerTicket = useCallback((ticket) => {
    setTicketDetalleId(ticket.id);

    setDetalleOpen(true);
  }, []);

  // =========================================================
  // COLUMNAS
  // =========================================================

  const columns = useMemo(
    () =>
      crearColumnasSoporte({
        vista,
        onVerTicket: handleVerTicket,
      }),
    [vista, handleVerTicket],
  );

  // =========================================================
  // EXPORT FILE NAME
  // =========================================================

  const exportFileName = useMemo(() => {
    switch (vista) {
      case "todos":
        return "todos-los-tickets";

      case "asignados":
        return "tickets-asignados";

      case "mis":
      default:
        return "mis-tickets";
    }
  }, [vista]);

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
          HEADER
      ====================================================== */}

      <PageHeader
        title="Soporte"
        subtitle="Reporta y da seguimiento a problemas o solicitudes relacionadas con Aphelios."
        icon={ConfirmationNumberOutlinedIcon}
      />

      {/* =====================================================
          RESUMEN
      ====================================================== */}

      <SoporteResumen resumen={resumen} />

      {/* =====================================================
          TABS
      ====================================================== */}

      <SoporteTabs
        vista={vista}
        permisos={permisos}
        onChange={handleCambiarVista}
      />

      {/* =====================================================
          FILTROS
      ====================================================== */}

      <SoporteFiltros
        vista={vista}
        permisos={permisos}
        filtros={filtros}
        categorias={categorias}
        areas={areasConRuta}
        usuarios={usuarios}
        desarrolladores={desarrolladores}
        hayFiltros={hayFiltros}
        onFiltroChange={handleFiltroChange}
        onLimpiar={limpiarFiltros}
        onNuevoTicket={handleNuevoTicket}
      />

      {/* =====================================================
          DATAGRID
      ====================================================== */}

      <Box
        sx={{
          mx: "30px",

          minWidth: 0,

          maxWidth: "calc(100% - 60px)",
        }}
      >
        <AppDataGrid
          rows={tickets}
          columns={columns}
          loading={loading}
          getRowId={(row) => row.id}
          exportFileName={exportFileName}
        />
      </Box>

      {/* =====================================================
          MODAL NUEVO TICKET
      ====================================================== */}

      <NuevoTicketModal
        open={nuevoTicketOpen}
        onClose={() => setNuevoTicketOpen(false)}
        categorias={categorias}
        areas={areas}
        onTicketCreado={async () => {
          await obtenerTickets();
        }}
      />

      {/* =====================================================
          MODAL DETALLE
      ====================================================== */}

      <TicketDetalleModal
        open={detalleOpen}
        ticketId={ticketDetalleId}
        desarrolladores={desarrolladores}
        onClose={() => {
          setDetalleOpen(false);
          setTicketDetalleId(null);

          // Actualizar la tabla y el resumen
          // después de cerrar el detalle.
          obtenerTickets();
        }}
      />
    </Box>
  );
};

export default Soporte;
