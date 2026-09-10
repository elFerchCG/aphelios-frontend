import { useCallback, useEffect, useMemo, useState } from "react";

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

import EditNoteIcon from "@mui/icons-material/EditNote";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import AddBusinessOutlinedIcon from "@mui/icons-material/AddBusinessOutlined";

import AppDataGrid from "../../../common/AppDataGrid";
import PageHeader from "../../../common/PageHeader";
import PageToolbarCard from "../../../common/PageToolbarCard";

import {
  fieldWidths,
  toolbarButtonSx,
  toolbarFieldSx,
} from "../../../common/formStyles";

import { swalSuccess } from "../../../../helpers/sweetAlert";

import { handleApiError } from "../../../../helpers/apiErrorHandler";

import BodegaModal from "./components/BodegaModal";
import UbicacionModal from "./components/UbicacionModal";
import UbicacionesModal from "./components/UbicacionesModal";

const DataGridB = () => {
  const apiUrl =
    process.env.NODE_ENV === "production"
      ? process.env.REACT_APP_API_URL
      : process.env.REACT_APP_API_URL_LOCAL;

  // ==============================
  // DATOS
  // ==============================

  const [rows, setRows] = useState([]);
  const [roles, setRoles] = useState([]);
  const [rowsUbicaciones, setRowsUbicaciones] = useState([]);

  // ==============================
  // LOADING
  // ==============================

  const [loading, setLoading] = useState(true);

  const [loadingUbicaciones, setLoadingUbicaciones] = useState(false);

  const [savingBodega, setSavingBodega] = useState(false);

  const [savingUbicacion, setSavingUbicacion] = useState(false);

  // ==============================
  // FILTROS
  // ==============================

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("todos");

  // ==============================
  // BODEGA MODAL
  // ==============================

  const [openBodegaModal, setOpenBodegaModal] = useState(false);

  const [bodegaModalMode, setBodegaModalMode] = useState("create");

  const [selectedBodega, setSelectedBodega] = useState(null);

  // ==============================
  // UBICACIONES MODAL
  // ==============================

  const [openUbicacionesModal, setOpenUbicacionesModal] = useState(false);

  // ==============================
  // UBICACION CREATE / EDIT MODAL
  // ==============================

  const [openUbicacionModal, setOpenUbicacionModal] = useState(false);

  const [ubicacionModalMode, setUbicacionModalMode] = useState("create");

  const [selectedUbicacion, setSelectedUbicacion] = useState(null);

  // ==========================================================
  // FETCH BODEGAS
  // ==========================================================

  const fetchBodegas = useCallback(async () => {
    setLoading(true);

    try {
      const response = await axios.get(`${apiUrl}/inventario/bodegas`);

      if (Array.isArray(response.data)) {
        setRows(response.data);
      } else {
        setRows([]);
      }
    } catch (error) {
      setRows([]);

      handleApiError(error, {
        defaultMessage: "No se pudieron cargar las bodegas.",
      });
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  // ==========================================================
  // FETCH ROLES
  // ==========================================================

  const fetchRoles = useCallback(async () => {
    try {
      const response = await axios.get(`${apiUrl}/usuarios/roles`);

      if (Array.isArray(response.data)) {
        setRoles(response.data);
      } else {
        setRoles([]);
      }
    } catch (error) {
      setRoles([]);

      handleApiError(error, {
        defaultMessage: "No se pudieron cargar los roles.",
      });
    }
  }, [apiUrl]);

  // ==========================================================
  // FETCH UBICACIONES
  // ==========================================================

  const fetchUbicaciones = useCallback(
    async (bodegaId) => {
      if (!bodegaId) return;

      setLoadingUbicaciones(true);

      try {
        const response = await axios.get(
          `${apiUrl}/inventario/localidades/${bodegaId}`,
        );

        if (Array.isArray(response.data)) {
          setRowsUbicaciones(response.data);
        } else {
          setRowsUbicaciones([]);
        }
      } catch (error) {
        setRowsUbicaciones([]);

        handleApiError(error, {
          defaultMessage: "No se pudieron cargar las ubicaciones.",
        });
      } finally {
        setLoadingUbicaciones(false);
      }
    },
    [apiUrl],
  );

  // ==========================================================
  // CARGA INICIAL
  // ==========================================================

  useEffect(() => {
    fetchBodegas();
    fetchRoles();
  }, [fetchBodegas, fetchRoles]);

  // ==========================================================
  // CARGAR UBICACIONES CUANDO ABRIMOS LA BODEGA
  // ==========================================================

  useEffect(() => {
    if (!openUbicacionesModal || !selectedBodega?.id) {
      return;
    }

    fetchUbicaciones(selectedBodega.id);
  }, [openUbicacionesModal, selectedBodega, fetchUbicaciones]);

  // ==========================================================
  // ABRIR CREAR BODEGA
  // ==========================================================

  const handleOpenCreateBodega = () => {
    setBodegaModalMode("create");
    setSelectedBodega(null);
    setOpenBodegaModal(true);
  };

  // ==========================================================
  // ABRIR EDITAR BODEGA
  // ==========================================================

  const handleOpenEditBodega = (bodega) => {
    setBodegaModalMode("edit");
    setSelectedBodega(bodega);
    setOpenBodegaModal(true);
  };

  // ==========================================================
  // CERRAR MODAL BODEGA
  // ==========================================================

  const handleCloseBodegaModal = () => {
    if (savingBodega) return;

    setOpenBodegaModal(false);
    setSelectedBodega(null);
  };

  // ==========================================================
  // CREAR BODEGA
  // ==========================================================

  const createBodega = async (formData) => {
    setSavingBodega(true);

    try {
      await axios.post(`${apiUrl}/inventario/bodegas/`, {
        nombre: formData.nombre,
        tipo: formData.tipo,
        neteable: formData.neteable,
        rol_id: formData.rol_id,
      });

      await fetchBodegas();

      setOpenBodegaModal(false);
      setSelectedBodega(null);

      swalSuccess("Bodega creada", "La nueva bodega se creó correctamente.");
    } catch (error) {
      handleApiError(error, {
        defaultMessage: "No se pudo crear la bodega.",
        warningTitle: "No se pudo crear la bodega",
      });
    } finally {
      setSavingBodega(false);
    }
  };

  // ==========================================================
  // ACTUALIZAR BODEGA
  // ==========================================================

  const updateBodega = async (formData) => {
    setSavingBodega(true);

    try {
      await axios.put(`${apiUrl}/inventario/bodegas/${formData.id}`, {
        nombre: formData.nombre,
        tipo: formData.tipo,
        neteable: formData.neteable,
        activo: formData.activo,
        rol_id: formData.rol_id,
      });

      await fetchBodegas();

      setOpenBodegaModal(false);
      setSelectedBodega(null);

      swalSuccess(
        "Bodega actualizada",
        "Los cambios se guardaron correctamente.",
      );
    } catch (error) {
      handleApiError(error, {
        defaultMessage: "No se pudo actualizar la bodega.",
        warningTitle: "No se pudo actualizar la bodega",
      });
    } finally {
      setSavingBodega(false);
    }
  };

  // ==========================================================
  // GUARDAR BODEGA SEGÚN MODO
  // ==========================================================

  const handleSaveBodega = async (formData) => {
    if (bodegaModalMode === "edit") {
      await updateBodega(formData);
      return;
    }

    await createBodega(formData);
  };

  // ==========================================================
  // ABRIR UBICACIONES
  // ==========================================================

  const handleOpenUbicacionesModal = (bodega) => {
    // Cerramos cualquier modal hijo que pudiera haber quedado abierto
    setOpenUbicacionModal(false);
    setSelectedUbicacion(null);

    // Cerramos también el modal de edición de bodega
    setOpenBodegaModal(false);

    // Seleccionamos la bodega
    setSelectedBodega(bodega);
    setRowsUbicaciones([]);

    // Abrimos EXCLUSIVAMENTE el listado de ubicaciones
    setOpenUbicacionesModal(true);
  };

  // ==========================================================
  // CERRAR UBICACIONES
  // ==========================================================

  const handleCloseUbicacionesModal = () => {
    if (savingUbicacion) return;

    // Cerrar cualquier formulario hijo
    setOpenUbicacionModal(false);
    setSelectedUbicacion(null);

    // Cerrar listado
    setOpenUbicacionesModal(false);

    // Limpiar datos
    setRowsUbicaciones([]);
    setSelectedBodega(null);
  };

  // ==========================================================
  // ABRIR CREAR UBICACION
  // ==========================================================

  const handleOpenCreateUbicacion = () => {
    // Solo se puede crear una ubicación
    // si estamos dentro del modal de ubicaciones
    if (!openUbicacionesModal || !selectedBodega?.id) {
      return;
    }

    setUbicacionModalMode("create");
    setSelectedUbicacion(null);
    setOpenUbicacionModal(true);
  };

  // ==========================================================
  // ABRIR EDITAR UBICACION
  // ==========================================================

  const handleOpenEditUbicacion = (ubicacion) => {
    if (!openUbicacionesModal || !selectedBodega?.id) {
      return;
    }

    setUbicacionModalMode("edit");
    setSelectedUbicacion(ubicacion);
    setOpenUbicacionModal(true);
  };

  // ==========================================================
  // CERRAR MODAL UBICACION
  // ==========================================================

  const handleCloseUbicacionModal = () => {
    if (savingUbicacion) return;

    setOpenUbicacionModal(false);
    setSelectedUbicacion(null);
  };

  // ==========================================================
  // CREAR UBICACION
  // ==========================================================

  const createUbicacion = async (formData) => {
    if (!selectedBodega?.id) return;

    setSavingUbicacion(true);

    try {
      await axios.post(`${apiUrl}/inventario/localidades/`, {
        descripcion: formData.descripcion,
        disponible: formData.disponible,
        bodega_id: selectedBodega.id,
      });

      await fetchUbicaciones(selectedBodega.id);

      setOpenUbicacionModal(false);
      setSelectedUbicacion(null);

      swalSuccess(
        "Ubicación creada",
        "La nueva ubicación se creó correctamente.",
      );
    } catch (error) {
      handleApiError(error, {
        defaultMessage: "No se pudo crear la ubicación.",
        warningTitle: "No se pudo crear la ubicación",
      });
    } finally {
      setSavingUbicacion(false);
    }
  };

  // ==========================================================
  // ACTUALIZAR UBICACION
  // ==========================================================

  const updateUbicacion = async (formData) => {
    if (!selectedBodega?.id) return;

    setSavingUbicacion(true);

    try {
      await axios.put(`${apiUrl}/inventario/localidades/${formData.id}`, {
        descripcion: formData.descripcion,
        disponible: formData.disponible,
        activo: formData.activo,
      });

      await fetchUbicaciones(selectedBodega.id);

      setOpenUbicacionModal(false);
      setSelectedUbicacion(null);

      swalSuccess(
        "Ubicación actualizada",
        "Los cambios se guardaron correctamente.",
      );
    } catch (error) {
      handleApiError(error, {
        defaultMessage: "No se pudo actualizar la ubicación.",
        warningTitle: "No se pudo actualizar la ubicación",
      });
    } finally {
      setSavingUbicacion(false);
    }
  };

  // ==========================================================
  // GUARDAR UBICACION SEGÚN MODO
  // ==========================================================

  const handleSaveUbicacion = async (formData) => {
    if (ubicacionModalMode === "edit") {
      await updateUbicacion(formData);
      return;
    }

    await createUbicacion(formData);
  };

  // ==========================================================
  // FILTRAR BODEGAS
  // ==========================================================

  const filteredRows = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return rows.filter((row) => {
      const nombre = String(row.Nombre ?? row.nombre ?? "").toLowerCase();

      const tipo = String(row.Tipo ?? row.tipo ?? "").toLowerCase();

      const rol = String(row.rol_descripcion ?? "").toLowerCase();

      const activo = Number(row.activo) === 1;

      const matchesSearch =
        !searchValue ||
        nombre.includes(searchValue) ||
        tipo.includes(searchValue) ||
        rol.includes(searchValue);

      const matchesStatus =
        statusFilter === "todos" ||
        (statusFilter === "activos" && activo) ||
        (statusFilter === "inactivos" && !activo);

      return matchesSearch && matchesStatus;
    });
  }, [rows, search, statusFilter]);

  // ==========================================================
  // COLUMNAS BODEGAS
  // ==========================================================

  const columns = useMemo(
    () => [
      {
        field: "id",
        headerName: "Folio",
        width: 90,
      },
      {
        field: "Nombre",
        headerName: "Nombre",
        flex: 1.4,
        minWidth: 170,
        valueGetter: (value, row) => row?.Nombre ?? row?.nombre ?? "",
      },
      {
        field: "Tipo",
        headerName: "Tipo",
        flex: 1,
        minWidth: 130,
        valueGetter: (value, row) => row?.Tipo ?? row?.tipo ?? "",
      },
      {
        field: "Neteable",
        headerName: "Disponible para ventas",
        flex: 1,
        minWidth: 170,
        valueGetter: (value, row) => {
          const neteable = row?.Neteable ?? row?.neteable;

          return Number(neteable) === 1 ? "Sí" : "No";
        },
      },
      {
        field: "activo",
        headerName: "Estatus",
        flex: 0.8,
        minWidth: 110,

        renderCell: (params) => (
          <Chip
            label={Number(params.value) === 1 ? "Activo" : "Inactivo"}
            color={Number(params.value) === 1 ? "success" : "error"}
            variant="outlined"
            size="small"
          />
        ),
      },
      {
        field: "rol_descripcion",
        headerName: "Rol",
        flex: 1,
        minWidth: 140,
      },
      {
        field: "actions",
        headerName: "Acciones",
        type: "actions",
        width: 120,

        getActions: (params) => [
          <Tooltip key={`editar-${params.row.id}`} title="Editar bodega" arrow>
            <GridActionsCellItem
              icon={<EditNoteIcon />}
              label="Editar bodega"
              onClick={() => handleOpenEditBodega(params.row)}
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

          <Tooltip
            key={`ubicaciones-${params.row.id}`}
            title="Ver ubicaciones"
            arrow
          >
            <GridActionsCellItem
              icon={<LocationOnOutlinedIcon />}
              label="Ver ubicaciones"
              onClick={() => handleOpenUbicacionesModal(params.row)}
              showInMenu={false}
              sx={{
                color: "#ed6c02",

                "&:hover": {
                  color: "#e65100",
                  backgroundColor: "rgba(237, 108, 2, 0.08)",
                },
              }}
            />
          </Tooltip>,
        ],
      },
    ],
    [],
  );

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="contenido">
      <PageHeader
        title="Bodegas"
        subtitle="Administra las bodegas y sus ubicaciones dentro de APHELIOS."
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
            label="Buscar bodega"
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
            <InputLabel id="bodegas-estatus-label">Estatus</InputLabel>

            <Select
              labelId="bodegas-estatus-label"
              label="Estatus"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="todos">Todos</MenuItem>

              <MenuItem value="activos">Activos</MenuItem>

              <MenuItem value="inactivos">Inactivos</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="contained"
            startIcon={<AddBusinessOutlinedIcon />}
            onClick={handleOpenCreateBodega}
            sx={{
              ...toolbarButtonSx,
              ml: "auto",
            }}
          >
            Agregar bodega
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
          exportFileName="bodegas"
          initialColumnVisibilityModel={{
            id: false,
          }}
        />
      </div>

      {/* ========================= */}
      {/* CREAR / EDITAR BODEGA */}
      {/* ========================= */}

      <BodegaModal
        open={openBodegaModal}
        mode={bodegaModalMode}
        data={selectedBodega}
        roles={roles}
        loading={savingBodega}
        onClose={handleCloseBodegaModal}
        onSave={handleSaveBodega}
      />

      {/* ========================= */}
      {/* LISTADO UBICACIONES */}
      {/* ========================= */}

      <UbicacionesModal
        open={openUbicacionesModal}
        bodega={selectedBodega}
        rows={rowsUbicaciones}
        loading={loadingUbicaciones}
        onClose={handleCloseUbicacionesModal}
        onCreate={handleOpenCreateUbicacion}
        onEdit={handleOpenEditUbicacion}
      />

      {/* ========================= */}
      {/* CREAR / EDITAR UBICACION */}
      {/* ========================= */}

      <UbicacionModal
        open={openUbicacionModal}
        mode={ubicacionModalMode}
        data={selectedUbicacion}
        loading={savingUbicacion}
        onClose={handleCloseUbicacionModal}
        onSave={handleSaveUbicacion}
      />
    </div>
  );
};

export default DataGridB;
