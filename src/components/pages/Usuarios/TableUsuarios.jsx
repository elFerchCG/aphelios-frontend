import {
  Button,
  Chip,
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

import EditNoteIcon from "@mui/icons-material/EditNote";
import PersonAddAltOutlinedIcon from "@mui/icons-material/PersonAddAltOutlined";

import AppDataGrid from "../../common/AppDataGrid";
import PageHeader from "../../common/PageHeader";
import PageToolbarCard from "../../common/PageToolbarCard";

import {
  fieldWidths,
  toolbarButtonSx,
  toolbarFieldSx,
} from "../../common/formStyles";

import { swalInfo, swalSuccess } from "../../../helpers/sweetAlert";

import { handleApiError } from "../../../helpers/apiErrorHandler";

import UsuarioModal from "./components/UsuarioModal";
import NuevoRolModal from "./components/NuevoRolModal";

const TableUsuarios = () => {
  const apiUrl =
    process.env.NODE_ENV === "production"
      ? process.env.REACT_APP_API_URL
      : process.env.REACT_APP_API_URL_LOCAL;

  // ==============================
  // ESTADOS
  // ==============================

  const [rows, setRows] = useState([]);
  const [roles, setRoles] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");

  const [openModal, setOpenModal] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selectedUser, setSelectedUser] = useState(null);

  const [openRolModal, setOpenRolModal] = useState(false);

  // ==============================
  // CARGAR USUARIOS
  // ==============================

  const fetchUsuarios = useCallback(async () => {
    setLoading(true);

    try {
      const response = await axios.get(`${apiUrl}/usuarios`);

      if (response.data && Array.isArray(response.data)) {
        setRows(response.data);

        if (response.data.length === 0) {
          swalInfo(
            "Usuarios no encontrados",
            "No se encontraron usuarios registrados",
          );
        }
      } else {
        setRows([]);
      }
    } catch (error) {
      handleApiError(error, {
        defaultMessage: "No se pudieron cargar los usuarios.",
      });
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  // ==============================
  // CARGAR ROLES
  // ==============================

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

  // ==============================
  // EFECTOS
  // ==============================

  useEffect(() => {
    fetchUsuarios();
  }, [fetchUsuarios]);

  useEffect(() => {
    if (openModal) {
      fetchRoles();
    }
  }, [openModal, fetchRoles]);

  // ==============================
  // MODAL USUARIO
  // ==============================

  const handleOpenCreateModal = () => {
    setModalMode("create");
    setSelectedUser(null);
    setOpenModal(true);
  };

  const handleOpenEditModal = (user) => {
    setModalMode("edit");
    setSelectedUser(user);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    if (saving) return;

    setOpenModal(false);
    setSelectedUser(null);
  };

  // ==============================
  // CREAR USUARIO
  // ==============================

  const createUser = async (formData) => {
    try {
      setSaving(true);

      const response = await axios.post(`${apiUrl}/auth/register`, {
        nombre: formData.nombre,
        password: formData.password,
        rol_id: formData.rol_id,
        pin: formData.pin ?? null,
      });

      if (response.data?.ok) {
        await fetchUsuarios();

        setOpenModal(false);
        setSelectedUser(null);

        swalSuccess("Usuario creado", "El nuevo usuario se creó correctamente");
      }
    } catch (error) {
      handleApiError(error, {
        defaultMessage: "No se pudo crear el usuario.",
      });
    } finally {
      setSaving(false);
    }
  };

  // ==============================
  // ACTUALIZAR USUARIO
  // ==============================

  const updateUser = async (formData) => {
    try {
      setSaving(true);

      const payload = {
        nombre: formData.nombre,
        rol: formData.rol_id,
        estado: formData.estado,
      };

      // Solo enviar contraseña si fue capturada
      if (formData.password) {
        payload.password = formData.password;
      }

      // Solo enviar PIN si fue capturado
      if (formData.pin) {
        payload.pin = formData.pin;
      }

      const response = await axios.put(
        `${apiUrl}/usuarios/actualizar/${formData.id_usuario}`,
        payload,
      );

      if (response.status === 200) {
        await fetchUsuarios();

        setOpenModal(false);
        setSelectedUser(null);

        swalSuccess(
          "Usuario actualizado",
          "Los cambios se guardaron correctamente",
        );
      }
    } catch (error) {
      handleApiError(error, {
        defaultMessage: "No se pudo actualizar el usuario.",
      });
    } finally {
      setSaving(false);
    }
  };

  // ==============================
  // GUARDAR SEGÚN MODO
  // ==============================

  const handleSaveUser = async (formData) => {
    if (modalMode === "edit") {
      await updateUser(formData);
      return;
    }

    await createUser(formData);
  };

  // ==============================
  // FILTROS
  // ==============================

  const filteredRows = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesSearch =
        !searchValue ||
        row.nombre?.toLowerCase().includes(searchValue) ||
        row.rol_descripcion?.toLowerCase().includes(searchValue);

      const matchesStatus =
        statusFilter === "todos" ||
        (statusFilter === "activos" && row.estado === 1) ||
        (statusFilter === "inactivos" && row.estado === 0);

      return matchesSearch && matchesStatus;
    });
  }, [rows, search, statusFilter]);

  // ==============================
  // COLUMNAS
  // ==============================

  const columns = useMemo(
    () => [
      {
        field: "id_usuario",
        headerName: "Folio",
        width: 90,
      },
      {
        field: "nombre",
        headerName: "Nombre",
        flex: 1.5,
        minWidth: 180,
      },
      {
        field: "estado",
        headerName: "Estatus",
        flex: 0.7,
        minWidth: 110,
        renderCell: (params) => (
          <Chip
            label={params.value === 1 ? "Activo" : "Inactivo"}
            color={params.value === 1 ? "success" : "error"}
            variant="outlined"
            size="small"
          />
        ),
      },
      {
        field: "rol_id",
        headerName: "Rol ID",
        width: 100,
      },
      {
        field: "rol_descripcion",
        headerName: "Rol",
        flex: 1,
        minWidth: 150,
      },
      {
        field: "actions",
        headerName: "Acciones",
        type: "actions",
        width: 110,
        getActions: (params) => [
          <Tooltip
            key={`editar-${params.row.id_usuario}`}
            title="Editar usuario"
            arrow
          >
            <GridActionsCellItem
              icon={<EditNoteIcon />}
              label="Editar usuario"
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
    ],
    [],
  );

  // ==============================
  // RENDER
  // ==============================

  return (
    <div className="contenido">
      <PageHeader
        title="Usuarios"
        subtitle="Administra los usuarios y sus permisos dentro de APHELIOS."
      />

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
          <TextField
            label="Buscar usuario"
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
            <InputLabel id="usuarios-estatus-label">Estatus</InputLabel>

            <Select
              labelId="usuarios-estatus-label"
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
            startIcon={<PersonAddAltOutlinedIcon />}
            onClick={handleOpenCreateModal}
            sx={{
              ...toolbarButtonSx,
              ml: "auto",
            }}
          >
            Agregar usuario
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
          getRowId={(row) => row.id_usuario}
          exportFileName="usuarios"
          initialColumnVisibilityModel={{
            id_usuario: false,
            rol_id: false,
          }}
        />
      </div>

      <UsuarioModal
        open={openModal}
        mode={modalMode}
        data={selectedUser}
        roles={roles}
        loading={saving}
        onClose={handleCloseModal}
        onSave={handleSaveUser}
        onOpenRoleModal={() => setOpenRolModal(true)}
      />

      <NuevoRolModal
        open={openRolModal}
        onClose={() => setOpenRolModal(false)}
        onCreated={async () => {
          await fetchRoles();
          setOpenRolModal(false);
        }}
      />
    </div>
  );
};

export default TableUsuarios;
