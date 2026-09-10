import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Button,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";

import axios from "axios";

import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";

import AppDataGrid from "../../common/AppDataGrid";
import PageHeader from "../../common/PageHeader";
import PageToolbarCard from "../../common/PageToolbarCard";

import {
  fieldWidths,
  toolbarButtonSx,
  toolbarFieldSx,
} from "../../common/formStyles";

import { swalSuccess } from "../../../helpers/sweetAlert";

import { handleApiError } from "../../../helpers/apiErrorHandler";

import AsignarEnvioModal from "./components/AsignarEnvioModal";

const OrdenRetiro = () => {
  const apiUrl =
    process.env.NODE_ENV === "production"
      ? process.env.REACT_APP_API_URL
      : process.env.REACT_APP_API_URL_LOCAL;

  // ==============================
  // DATOS
  // ==============================

  const [ordenes, setOrdenes] = useState([]);

  const [envios, setEnvios] = useState([]);

  // ==============================
  // SELECCIÓN
  // ==============================

  const [selectedOrdenes, setSelectedOrdenes] = useState([]);

  const [selectedEnvio, setSelectedEnvio] = useState(null);

  // ==============================
  // LOADING
  // ==============================

  const [loading, setLoading] = useState(true);

  const [loadingEnvios, setLoadingEnvios] = useState(false);

  const [savingAsignacion, setSavingAsignacion] = useState(false);

  // ==============================
  // MODAL
  // ==============================

  const [openEnvioModal, setOpenEnvioModal] = useState(false);

  // ==============================
  // FILTROS
  // ==============================

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("todos");

  // ==========================================================
  // FETCH ORDENES
  // ==========================================================

  const fetchOrdenes = useCallback(async () => {
    setLoading(true);

    try {
      const response = await axios.get(
        `${apiUrl}/inventario/ordenBodegas_y_lineasBodegas/ordenes_retiro_produccion`,
      );

      setOrdenes(response.data?.data || []);
    } catch (error) {
      setOrdenes([]);

      handleApiError(error, {
        defaultMessage: "No se pudieron cargar las órdenes de retiro.",
      });
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  // ==========================================================
  // FETCH ENVIOS ABIERTOS
  // ==========================================================

  const fetchEnviosAbiertos = useCallback(async () => {
    setLoadingEnvios(true);

    try {
      const response = await axios.get(`${apiUrl}/empaque/fetchEnviosAbiertos`);

      setEnvios(response.data?.data || []);
    } catch (error) {
      setEnvios([]);

      handleApiError(error, {
        defaultMessage: "No se pudieron cargar los envíos abiertos.",
      });
    } finally {
      setLoadingEnvios(false);
    }
  }, [apiUrl]);

  // ==========================================================
  // CARGA INICIAL
  // ==========================================================

  useEffect(() => {
    fetchOrdenes();
  }, [fetchOrdenes]);

  // ==========================================================
  // ABRIR MODAL DE ENVÍOS
  // ==========================================================

  const handleOpenEnvioModal = async () => {
    if (selectedOrdenes.length === 0) {
      return;
    }

    setSelectedEnvio(null);
    setOpenEnvioModal(true);

    await fetchEnviosAbiertos();
  };

  // ==========================================================
  // CERRAR MODAL
  // ==========================================================

  const handleCloseEnvioModal = () => {
    if (savingAsignacion) return;

    setOpenEnvioModal(false);
    setSelectedEnvio(null);
  };

  // ==========================================================
  // ASIGNAR ORDENES
  // ==========================================================

  const asignarOrdenes = async () => {
    if (!selectedEnvio || selectedOrdenes.length === 0) {
      return;
    }

    setSavingAsignacion(true);

    try {
      await axios.post(
        `${apiUrl}/inventario/ordenBodegas_y_lineasBodegas/asignarOrdenesAEnvio`,
        {
          envio_id: selectedEnvio,
          ordenes_ids: selectedOrdenes,
        },
      );

      await fetchOrdenes();

      setSelectedOrdenes([]);
      setSelectedEnvio(null);
      setOpenEnvioModal(false);

      swalSuccess(
        "Órdenes asignadas",
        "Las órdenes de retiro se asignaron correctamente al envío.",
      );
    } catch (error) {
      handleApiError(error, {
        defaultMessage: "No se pudieron asignar las órdenes al envío.",
        warningTitle: "No se pudo completar la asignación",
      });
    } finally {
      setSavingAsignacion(false);
    }
  };

  // ==========================================================
  // FILTROS
  // ==========================================================

  const filteredOrdenes = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return ordenes
      .filter((row) => {
        const ordenBodega = String(row.orden_bodega_id ?? "").toLowerCase();

        const ordenProduccion = String(row.orden_id ?? "").toLowerCase();

        const mlm = String(row.mlm ?? "").toLowerCase();

        const title = String(row.title ?? "").toLowerCase();

        const inventoryId = String(row.inventory_id ?? "").toLowerCase();

        const sku = String(row.sku_publicacion ?? "").toLowerCase();

        const estatus = String(row.estatus ?? "")
          .trim()
          .toLowerCase();

        const matchesSearch =
          !searchValue ||
          ordenBodega.includes(searchValue) ||
          ordenProduccion.includes(searchValue) ||
          mlm.includes(searchValue) ||
          title.includes(searchValue) ||
          inventoryId.includes(searchValue) ||
          sku.includes(searchValue);

        const matchesStatus =
          statusFilter === "todos" || estatus === statusFilter;

        return matchesSearch && matchesStatus;
      })
      .map((row) => ({
        ...row,

        _gridId: [row.orden_bodega_id, row.orden_id, row.producto_id].join("-"),
      }));
  }, [ordenes, search, statusFilter]);

  // ==========================================================
  // COLUMNAS
  // ==========================================================

  const columns = useMemo(
    () => [
      {
        field: "orden_bodega_id",
        headerName: "# Orden bodega",
        width: 130,
      },
      {
        field: "orden_id",
        headerName: "# Orden producción",
        width: 150,
      },
      {
        field: "producto_id",
        headerName: "# Producto",
        width: 110,
      },
      {
        field: "mlm",
        headerName: "MLM",
        minWidth: 130,
        flex: 0.8,
      },
      {
        field: "title",
        headerName: "Título",
        minWidth: 260,
        flex: 2,
      },
      {
        field: "inventory_id",
        headerName: "ML",
        minWidth: 120,
        flex: 0.8,
      },
      {
        field: "sku_publicacion",
        headerName: "SKU",
        minWidth: 130,
        flex: 0.8,
      },
      {
        field: "logistic_type",
        headerName: "Logística",
        width: 120,

        renderCell: (params) => {
          const logisticType = params.value;

          const permitirFull = Number(params.row.permitir_full);

          let label = "ME";
          let color = "warning";

          if (logisticType === "fulfillment") {
            label = "FULL";
            color = "success";
          } else if (permitirFull === 1) {
            label = "ME > FULL";
            color = "secondary";
          }

          return (
            <Chip
              label={label}
              size="small"
              color={color}
              sx={{
                fontWeight: 600,
              }}
            />
          );
        },
      },
      {
        field: "cantidad_a_producir",
        headerName: "A producir",
        type: "number",
        width: 110,
        valueFormatter: (value) => Math.round(Number(value ?? 0)),
      },
      {
        field: "cantidad_a_enviar",
        headerName: "A enviar",
        type: "number",
        width: 110,
        headerAlign: "center",
        align: "center",
        valueFormatter: (value) => Math.round(Number(value ?? 0)),
      },
      {
        field: "cantidad_empacada",
        headerName: "Empacada",
        type: "number",
        width: 110,
        valueFormatter: (value) => Math.round(Number(value ?? 0)),
      },
      {
        field: "estatus",
        headerName: "Estatus",
        width: 120,

        renderCell: (params) => {
          const statusMap = {
            recibida: {
              label: "Recibida",
              color: "default",
            },
            surtida: {
              label: "Surtida",
              color: "warning",
            },
            empacada: {
              label: "Empacada",
              color: "success",
            },
            cerrada: {
              label: "Cerrada",
              color: "secondary",
            },
          };

          const status = statusMap[params.value] || {
            label: params.value || "Sin estatus",
            color: "default",
          };

          return (
            <Chip
              label={status.label}
              color={status.color}
              size="small"
              sx={{
                fontWeight: 600,
              }}
            />
          );
        },
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
        title="Órdenes de retiro por excedente"
        subtitle="Consulta y asigna órdenes de retiro pendientes a un envío."
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
            label="Buscar orden"
            placeholder="Orden, MLM, título, SKU..."
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
            <InputLabel id="orden-retiro-estatus-label">Estatus</InputLabel>

            <Select
              labelId="orden-retiro-estatus-label"
              label="Estatus"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="todos">Todos</MenuItem>

              <MenuItem value="recibida">Recibida</MenuItem>

              <MenuItem value="surtida">Surtida</MenuItem>

              <MenuItem value="empacada">Empacada</MenuItem>

              <MenuItem value="cerrada">Cerrada</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="contained"
            startIcon={<LocalShippingOutlinedIcon />}
            disabled={selectedOrdenes.length === 0}
            onClick={handleOpenEnvioModal}
            sx={{
              ...toolbarButtonSx,
              ml: "auto",
            }}
          >
            Asignar órdenes
            {selectedOrdenes.length > 0 && ` (${selectedOrdenes.length})`}
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
          key={`${statusFilter}-${search}`}
          rows={filteredOrdenes}
          columns={columns}
          loading={loading}
          getRowId={(row) => row._gridId}
          checkboxSelection
          disableRowSelectionOnClick
          rowSelectionModel={selectedOrdenes}
          onRowSelectionModelChange={setSelectedOrdenes}
          exportFileName="ordenes_retiro"
          initialColumnVisibilityModel={{
            orden_id: false,
            producto_id: false,
            permitir_full: false,
          }}
          initialState={{
            pagination: {
              paginationModel: {
                page: 0,
                pageSize: 10,
              },
            },
          }}
          pageSizeOptions={[10, 25, 50, 100]}
        />
      </div>

      <AsignarEnvioModal
        open={openEnvioModal}
        rows={envios}
        loading={loadingEnvios}
        saving={savingAsignacion}
        selectedEnvio={selectedEnvio}
        onSelectedEnvioChange={setSelectedEnvio}
        onClose={handleCloseEnvioModal}
        onConfirm={asignarOrdenes}
      />
    </div>
  );
};

export default OrdenRetiro;
