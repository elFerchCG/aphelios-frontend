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
import HourglassTopIcon from "@mui/icons-material/HourglassTop";
import PersonAddAltOutlinedIcon from "@mui/icons-material/PersonAddAltOutlined";

import AppDataGrid from "../../common/AppDataGrid";
import PageHeader from "../../common/PageHeader";
import PageToolbarCard from "../../common/PageToolbarCard";

import {
  fieldWidths,
  toolbarButtonSx,
  toolbarFieldSx,
} from "../../common/formStyles";

import {
  swalInfo,
  swalSuccess,
} from "../../../helpers/sweetAlert";

import { handleApiError } from "../../../helpers/apiErrorHandler";

import ProveedorModal from "./components/ProveedorModal";
import InventariosMRPModal from "./components/InventariosMRPModal";

const ProveedoresTable = () => {
  const apiUrl =
    process.env.NODE_ENV === "production"
      ? process.env.REACT_APP_API_URL
      : process.env.REACT_APP_API_URL_LOCAL;

  // ==============================
  // ESTADOS
  // ==============================

  const [rows, setRows] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingInventarios, setSavingInventarios] =
    useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("todos");

  const [openProveedorModal, setOpenProveedorModal] =
    useState(false);

  const [modalMode, setModalMode] =
    useState("create");

  const [selectedProveedor, setSelectedProveedor] =
    useState(null);

  const [openInventariosModal, setOpenInventariosModal] =
    useState(false);

  // ==============================
  // CARGAR PROVEEDORES
  // ==============================

  const fetchProveedores = useCallback(async () => {
    setLoading(true);

    try {
      const response = await axios.get(
        `${apiUrl}/proveedores`,
      );

      if (
        response.data &&
        Array.isArray(response.data)
      ) {
        setRows(response.data);

        if (response.data.length === 0) {
          swalInfo(
            "Proveedores no encontrados",
            "No se encontraron proveedores registrados",
          );
        }
      } else {
        setRows([]);
      }
    } catch (error) {
      handleApiError(error, {
        defaultMessage:
          "No se pudieron cargar los proveedores.",
      });
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    fetchProveedores();
  }, [fetchProveedores]);

  // ==============================
  // MODAL PROVEEDOR
  // ==============================

  const handleOpenCreateModal = () => {
    setModalMode("create");
    setSelectedProveedor(null);
    setOpenProveedorModal(true);
  };

  const handleOpenEditModal = (proveedor) => {
    setModalMode("edit");
    setSelectedProveedor(proveedor);
    setOpenProveedorModal(true);
  };

  const handleCloseProveedorModal = () => {
    if (saving) return;

    setOpenProveedorModal(false);
    setSelectedProveedor(null);
  };

  // ==============================
  // CREAR PROVEEDOR
  // ==============================

  const createProveedor = async (formData) => {
    try {
      setSaving(true);

      const response = await axios.post(
        `${apiUrl}/proveedores/`,
        {
          razon_social: formData.razon_social,
          rfc: formData.rfc,
          correo: formData.correo,
          surtido: formData.surtido,
          backorder: formData.backorder,
          sku_proveedor: formData.sku_proveedor,
        },
      );

      if (response.data?.ok) {
        await fetchProveedores();

        setOpenProveedorModal(false);
        setSelectedProveedor(null);

        swalSuccess(
          "Proveedor creado",
          "El nuevo proveedor se creó correctamente",
        );
      }
    } catch (error) {
      handleApiError(error, {
        defaultMessage:
          "No se pudo crear el proveedor.",
        warningTitle:
          "No se pudo crear el proveedor",
      });
    } finally {
      setSaving(false);
    }
  };

  // ==============================
  // ACTUALIZAR PROVEEDOR
  // ==============================

  const updateProveedor = async (formData) => {
    try {
      setSaving(true);

      await axios.put(
        `${apiUrl}/proveedores/${formData.id_proveedor}`,
        formData,
      );

      await fetchProveedores();

      setOpenProveedorModal(false);
      setSelectedProveedor(null);

      swalSuccess(
        "Proveedor actualizado",
        "Los cambios se guardaron correctamente",
      );
    } catch (error) {
      handleApiError(error, {
        defaultMessage:
          "No se pudo actualizar el proveedor.",
        warningTitle:
          "No se pudo actualizar el proveedor",
      });
    } finally {
      setSaving(false);
    }
  };

  // ==============================
  // GUARDAR SEGÚN MODO
  // ==============================

  const handleSaveProveedor = async (formData) => {
    if (modalMode === "edit") {
      await updateProveedor(formData);
      return;
    }

    await createProveedor(formData);
  };

  // ==============================
  // INVENTARIOS MRP
  // ==============================

  const handleOpenInventariosModal = (proveedor) => {
    setSelectedProveedor(proveedor);
    setOpenInventariosModal(true);
  };

  const handleCloseInventariosModal = () => {
    if (savingInventarios) return;

    setOpenInventariosModal(false);
    setSelectedProveedor(null);
  };

  const handleSaveInventariosMRP = async (payload) => {
    if (!selectedProveedor) return;

    try {
      setSavingInventarios(true);

      await axios.put(
        `${apiUrl}/proveedores/inventariosMRP/${selectedProveedor.id_proveedor}`,
        payload,
      );

      await fetchProveedores();

      setOpenInventariosModal(false);
      setSelectedProveedor(null);

      swalSuccess(
        "Inventarios actualizados",
        "Todas las publicaciones del proveedor se actualizaron correctamente",
      );
    } catch (error) {
      handleApiError(error, {
        defaultMessage:
          "No se pudieron actualizar los inventarios MRP.",
        warningTitle:
          "No se pudieron actualizar los inventarios",
      });
    } finally {
      setSavingInventarios(false);
    }
  };

  // ==============================
  // FILTROS
  // ==============================

  const filteredRows = useMemo(() => {
    const searchValue =
      search.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesSearch =
        !searchValue ||
        row.razon_social
          ?.toLowerCase()
          .includes(searchValue) ||
        row.rfc
          ?.toLowerCase()
          .includes(searchValue) ||
        row.correo
          ?.toLowerCase()
          .includes(searchValue) ||
        row.sku_proveedor
          ?.toLowerCase()
          .includes(searchValue);

      const matchesStatus =
        statusFilter === "todos" ||
        (statusFilter === "activos" &&
          row.estado === 1) ||
        (statusFilter === "inactivos" &&
          row.estado === 0);

      return matchesSearch && matchesStatus;
    });
  }, [rows, search, statusFilter]);

  // ==============================
  // COLUMNAS
  // ==============================

  const columns = useMemo(
    () => [
      {
        field: "id_proveedor",
        headerName: "Folio",
        width: 90,
      },
      {
        field: "razon_social",
        headerName: "Razón social",
        flex: 1.5,
        minWidth: 180,
      },
      {
        field: "rfc",
        headerName: "RFC",
        flex: 1,
        minWidth: 130,
      },
      {
        field: "correo",
        headerName: "Correo",
        flex: 1.4,
        minWidth: 180,
      },
      {
        field: "estado",
        headerName: "Estatus",
        flex: 0.7,
        minWidth: 110,
        renderCell: (params) => (
          <Chip
            label={
              params.value === 1
                ? "Activo"
                : "Inactivo"
            }
            color={
              params.value === 1
                ? "success"
                : "error"
            }
            variant="outlined"
            size="small"
          />
        ),
      },
      {
        field: "backorder",
        headerName: "Back Order",
        flex: 0.8,
        minWidth: 120,
        renderCell: (params) => (
          <Chip
            label={
              params.value === 1
                ? "Activo"
                : "Inactivo"
            }
            color={
              params.value === 1
                ? "success"
                : "default"
            }
            variant="outlined"
            size="small"
          />
        ),
      },
      {
        field: "sku_proveedor",
        headerName: "SKU",
        flex: 0.8,
        minWidth: 110,
      },
      {
        field: "surtido",
        headerName: "Tiempo proveedor",
        flex: 0.8,
        minWidth: 130,
        align: "center",
        headerAlign: "center",
      },
      {
        field: "actions",
        headerName: "Acciones",
        type: "actions",
        width: 120,

        getActions: (params) => [
          <Tooltip
            key={`editar-${params.row.id_proveedor}`}
            title="Editar proveedor"
            arrow
          >
            <GridActionsCellItem
              icon={<EditNoteIcon />}
              label="Editar proveedor"
              onClick={() =>
                handleOpenEditModal(params.row)
              }
              showInMenu={false}
              sx={{
                color: "#1976d2",
                "&:hover": {
                  color: "#1565c0",
                  backgroundColor:
                    "rgba(25, 118, 210, 0.08)",
                },
              }}
            />
          </Tooltip>,

          <Tooltip
            key={`inventarios-${params.row.id_proveedor}`}
            title="Ajustar inventarios MRP"
            arrow
          >
            <GridActionsCellItem
              icon={<HourglassTopIcon />}
              label="Inventarios MRP"
              onClick={() =>
                handleOpenInventariosModal(
                  params.row,
                )
              }
              showInMenu={false}
              sx={{
                color: "#ed6c02",
                "&:hover": {
                  color: "#e65100",
                  backgroundColor:
                    "rgba(237, 108, 2, 0.08)",
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
        title="Proveedores"
        subtitle="Administra los proveedores y su configuración dentro de APHELIOS."
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
            label="Buscar proveedor"
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
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
            <InputLabel id="proveedores-estatus-label">
              Estatus
            </InputLabel>

            <Select
              labelId="proveedores-estatus-label"
              value={statusFilter}
              label="Estatus"
              onChange={(e) =>
                setStatusFilter(e.target.value)
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

          <Button
            variant="contained"
            startIcon={
              <PersonAddAltOutlinedIcon />
            }
            onClick={handleOpenCreateModal}
            sx={{
              ...toolbarButtonSx,
              ml: "auto",
            }}
          >
            Agregar proveedor
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
          getRowId={(row) =>
            row.id_proveedor
          }
          exportFileName="proveedores"
          initialColumnVisibilityModel={{
            id_proveedor: false,
          }}
        />
      </div>

      <ProveedorModal
        open={openProveedorModal}
        mode={modalMode}
        data={selectedProveedor}
        loading={saving}
        onClose={handleCloseProveedorModal}
        onSave={handleSaveProveedor}
      />

      <InventariosMRPModal
        open={openInventariosModal}
        proveedor={selectedProveedor}
        loading={savingInventarios}
        onClose={handleCloseInventariosModal}
        onSave={handleSaveInventariosMRP}
      />
    </div>
  );
};

export default ProveedoresTable;