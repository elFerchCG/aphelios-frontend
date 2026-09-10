import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Tooltip,
} from "@mui/material";

import { GridActionsCellItem } from "@mui/x-data-grid";

import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  swalSuccess,
  swalInfo,
} from "../../../../helpers/sweetAlert";
import { handleApiError } from "../../../../helpers/apiErrorHandler";

import EditNoteIcon from "@mui/icons-material/EditNote";
import SwapHorizOutlinedIcon from "@mui/icons-material/SwapHorizOutlined";

import AppDataGrid from "../../../common/AppDataGrid";
import PageHeader from "../../../common/PageHeader";
import PageToolbarCard from "../../../common/PageToolbarCard";

import {
  fieldWidths,
  toolbarButtonSx,
  toolbarFieldSx,
} from "../../../common/formStyles";

import TipoTransaccionModal from "./components/TipoTransaccionModal";

const DataGridT = () => {
  const apiUrl =
    process.env.NODE_ENV === "production"
      ? process.env.REACT_APP_API_URL
      : process.env.REACT_APP_API_URL_LOCAL;

  const [rows, setRows] = useState([]);
  const [roles, setRoles] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");

  const [openModal, setOpenModal] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selectedTransaccion, setSelectedTransaccion] = useState(null);

  // ============================================================
  // CARGAR TIPOS DE TRANSACCIÓN
  // ============================================================

  const fetchTiposTransacciones = useCallback(async () => {
    setLoading(true);

    try {
      const response = await axios.get(`${apiUrl}/inventario/tipoTransaccion/`);

      if (response.data && Array.isArray(response.data)) {
        setRows(response.data);
      } else {
        setRows([]);

        swalInfo(
          "Tipos de movimientos no encontrados",
          "No se encontraron tipos de movimientos",
        );
      }
    } catch (error) {
      handleApiError(error, {
        defaultMessage: "No se pudieron cargar los tipos de transacción.",
      });
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  // ============================================================
  // CARGAR ROLES
  // ============================================================

  const fetchRoles = useCallback(async () => {
    try {
      const response = await axios.get(`${apiUrl}/usuarios/roles`);

      if (response.data && Array.isArray(response.data)) {
        setRoles(response.data);
      } else {
        setRoles([]);
      }
    } catch (error) {
      handleApiError(error, {
        defaultMessage: "No se pudieron cargar los roles.",
      });
    }
  }, [apiUrl]);

  // ============================================================
  // CARGA INICIAL
  // ============================================================

  useEffect(() => {
    fetchTiposTransacciones();
  }, [fetchTiposTransacciones]);

  // ============================================================
  // CARGAR ROLES AL ABRIR EL MODAL
  // ============================================================

  useEffect(() => {
    if (openModal) {
      fetchRoles();
    }
  }, [openModal, fetchRoles]);

  // ============================================================
  // ABRIR MODAL PARA CREAR
  // ============================================================

  const handleOpenCreateModal = () => {
    setModalMode("create");
    setSelectedTransaccion(null);
    setOpenModal(true);
  };

  // ============================================================
  // ABRIR MODAL PARA EDITAR
  // ============================================================

  const handleOpenEditModal = (transaccion) => {
    setModalMode("edit");
    setSelectedTransaccion(transaccion);
    setOpenModal(true);
  };

  // ============================================================
  // CERRAR MODAL
  // ============================================================

  const handleCloseModal = () => {
    if (saving) return;

    setOpenModal(false);
    setSelectedTransaccion(null);
  };

  // ============================================================
  // CREAR TIPO DE TRANSACCIÓN
  // ============================================================

  const createTipoTransaccion = async (formData) => {
    try {
      setSaving(true);

      const response = await axios.post(
        `${apiUrl}/inventario/tipoTransaccion/`,
        {
          descripcion: formData.descripcion,
          categoria: formData.categoria,
          rol_id: formData.rol_id,
        },
      );

      if (response.data?.ok) {
        // Refrescamos la tabla
        await fetchTiposTransacciones();

        // Cerramos el modal antes del mensaje de éxito
        setOpenModal(false);
        setSelectedTransaccion(null);

        swalSuccess(
          "Tipo de transacción creado",
          "El nuevo tipo de transacción se creó correctamente",
        );
      }
    } catch (error) {
      // El modal permanece abierto.
      // handleApiError decide si es warning, error 500
      // o error de conexión.
      handleApiError(error, {
        defaultMessage: "No se pudo crear el tipo de transacción.",
      });
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // ACTUALIZAR TIPO DE TRANSACCIÓN
  // ============================================================

  const updateTipoTransaccion = async (formData) => {
    try {
      setSaving(true);

      const response = await axios.put(
        `${apiUrl}/inventario/tipoTransaccion/${formData.id}`,
        {
          descripcion: formData.descripcion,
          categoria: formData.categoria,
          activo: formData.activo,
          rol_id: formData.rol_id,
        },
      );

      if (response.status === 200) {
        // Refrescamos la tabla
        await fetchTiposTransacciones();

        // Cerramos el modal antes del mensaje de éxito
        setOpenModal(false);
        setSelectedTransaccion(null);

        swalSuccess(
          "Tipo de movimiento actualizado",
          "Los cambios se guardaron correctamente",
        );
      }
    } catch (error) {
      // El modal permanece abierto
      handleApiError(error, {
        defaultMessage: "No se pudo actualizar el tipo de transacción.",
      });
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // GUARDAR SEGÚN MODO
  // ============================================================

  const handleSaveTransaccion = async (formData) => {
    if (modalMode === "edit") {
      await updateTipoTransaccion(formData);
      return;
    }

    await createTipoTransaccion(formData);
  };

  // ============================================================
  // FILTRADO
  // ============================================================

  const filteredRows = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return rows.filter((row) => {
      // ============================
      // FILTRO DE BÚSQUEDA
      // ============================

      const matchesSearch =
        !searchValue ||
        row.descripcion?.toLowerCase().includes(searchValue) ||
        row.categoria?.toLowerCase().includes(searchValue) ||
        row.rol_descripcion?.toLowerCase().includes(searchValue);

      // ============================
      // FILTRO DE ESTATUS
      // ============================

      const matchesStatus =
        statusFilter === "todos" ||
        (statusFilter === "activos" && row.activo === 1) ||
        (statusFilter === "inactivos" && row.activo === 0);

      return matchesSearch && matchesStatus;
    });
  }, [rows, search, statusFilter]);

  // ============================================================
  // COLUMNAS
  // ============================================================

  const columns = [
    {
      field: "id",
      headerName: "Folio",
      flex: 0.5,
    },
    {
      field: "descripcion",
      headerName: "Descripción",
      flex: 2,
      minWidth: 220,
    },
    {
      field: "categoria",
      headerName: "Categoría",
      flex: 1,
      minWidth: 140,
    },
    {
      field: "rol_id",
      headerName: "Rol ID",
      flex: 0.6,
    },
    {
      field: "rol_descripcion",
      headerName: "Rol",
      flex: 1,
      minWidth: 160,
    },
    {
      field: "activo",
      headerName: "Estatus",
      flex: 0.7,
      minWidth: 110,
      valueGetter: (value) => {
        return value === 1 ? "Activo" : "Inactivo";
      },
    },
    {
      field: "actions",
      headerName: "Acciones",
      type: "actions",
      width: 110,
      getActions: (params) => [
        <Tooltip
          key={`editar-${params.row.id}`}
          title="Editar tipo de transacción"
          arrow
        >
          <GridActionsCellItem
            icon={<EditNoteIcon />}
            label="Editar tipo de transacción"
            onClick={() => handleOpenEditModal(params.row)}
            showInMenu={false}
            sx={{
              color: "#1976d2",
              "&:hover": {
                color: "#1565c0",
                backgroundColor: "rgba(25, 118, 210, 0.08)",
              },
            }}
          />
        </Tooltip>,
      ],
    },
  ];

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div>
      <PageHeader
        icon={SwapHorizOutlinedIcon}
        title="Tipos de transacciones"
        subtitle="Administra los tipos de movimiento disponibles en inventario."
      />

      <PageToolbarCard>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          <TextField
            label="Buscar tipo de transacción"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{
              ...toolbarFieldSx,
              width: fieldWidths.large,
            }}
          />

          <FormControl
            sx={{
              ...toolbarFieldSx,
              width: fieldWidths.medium,
            }}
          >
            <InputLabel id="estatus-filter-label">Estatus</InputLabel>

            <Select
              labelId="estatus-filter-label"
              value={statusFilter}
              label="Estatus"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="todos">Todos</MenuItem>
              <MenuItem value="activos">Activos</MenuItem>
              <MenuItem value="inactivos">Inactivos</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="contained"
            onClick={handleOpenCreateModal}
            sx={{
              ...toolbarButtonSx,
              ml: "auto",
            }}
          >
            Agregar Tipo de transacción
          </Button>
        </div>
      </PageToolbarCard>

      <div
        style={{
          marginLeft: "30px",
          marginRight: "30px",
        }}
      >
        <AppDataGrid
          rows={filteredRows}
          columns={columns}
          loading={loading}
          getRowId={(row) => row.id}
          exportFileName="tipos-transacciones"
          initialColumnVisibilityModel={{
            id: false,
            activo: false,
            rol_id: false,
          }}
        />
      </div>

      <TipoTransaccionModal
        open={openModal}
        mode={modalMode}
        data={selectedTransaccion}
        roles={roles}
        onClose={handleCloseModal}
        onSave={handleSaveTransaccion}
        loading={saving}
      />
    </div>
  );
};

export default DataGridT;
