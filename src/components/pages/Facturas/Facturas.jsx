import { Button, Tooltip, Chip } from "@mui/material";
import {
  DataGrid,
  GridActionsCellItem,
  GridToolbarColumnsButton,
  GridToolbarContainer,
  GridToolbarDensitySelector,
  GridToolbarExport,
  GridToolbarFilterButton,
} from "@mui/x-data-grid";
import axios from "axios";
import { useEffect, useState } from "react";
import DetailsIcon from "@mui/icons-material/Details";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import dayjs from "dayjs";
import BreadcrumbsNav from "./BreadcrumbsNav";

const Facturas = () => {
  const [data, setData] = useState([]);
  const [selectedFacturas, setSelectedFacturas] = useState([]);
  const [envios, setEnvios] = useState([]);
  const [selectedEnvio, setSelectedEnvio] = useState(null);
  const [openEnvioModal, setOpenEnvioModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [columnVisibilityModel, setColumnVisibilityModel] = useState({
    id: true,
    descripcion: true,
    estatus: true,
  });

  const apiUrl =
    process.env.NODE_ENV === "production"
      ? process.env.REACT_APP_API_URL
      : process.env.REACT_APP_API_URL_LOCAL;

  const CustomToolbar = () => (
    <GridToolbarContainer>
      <GridToolbarColumnsButton />
      <GridToolbarFilterButton />
      <GridToolbarDensitySelector />
      <GridToolbarExport
        csvOptions={{ fileName: "exported_data", utf8WithBom: true }}
      />
    </GridToolbarContainer>
  );

  useEffect(() => {
    fetchFacturas();
  }, [apiUrl]);

  const fetchFacturas = async () => {
    try {
      const response = await axios.get(`${apiUrl}/facturas/`);
      if (
        response.data.data &&
        Array.isArray(response.data.data) &&
        response.data.data.length > 0
      ) {
        setData(response.data.data);
        //setFilteredEnvios(response.data.data);
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Error al cargar los datos";
      Swal.fire({
        title: "Error",
        text: errorMessage,
        icon: "warning",
        timer: 5000,
        showCloseButton: true,
        allowEscapeKey: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchEnviosAbiertos = async () => {
    try {
      const response = await axios.get(`${apiUrl}/empaque/fetchEnviosAbiertos`);
      setEnvios(response.data.data || []);
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Error al cargar los datos";
      Swal.fire({
        title: "Error",
        text: errorMessage,
        icon: "warning",
        timer: 5000,
        showCloseButton: true,
        allowEscapeKey: true,
      });
    }
  };

  const asignarFacturas = async () => {
    try {
      await axios.post(`${apiUrl}/facturas/asignarFacturasAEnvio`, {
        envio_id: selectedEnvio,
        factura_ids: selectedFacturas,
      });

      Swal.fire("Éxito", "Facturas asignadas correctamente", "success");
      handleCloseEnvioModal();
      setSelectedFacturas([]);
      fetchFacturas();
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "Error al asignar facturas",
        "error",
      );
    }
  };

  const handleCloseEnvioModal = () => {
    setOpenEnvioModal(false);
    setSelectedEnvio(null);
  };

  const handleDetallesFactura = (facturaId, proveedorNombre) => {
    navigate(`/detalleFacturas/factura/${facturaId}`, {
      state: { proveedorNombre }, // así lo mandas al otro componente
    });
  };

  const columns = [
    {
      field: "fecha",
      headerName: "Fecha",
      type: "text",
      flex: 1,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "proveedor_nombre",
      headerName: "Proveedor",
      type: "text",
      flex: 2,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "folio",
      headerName: "Numero de Factura",
      type: "text",
      flex: 1,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "total",
      headerName: "Total",
      flex: 1,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "envio_id",
      headerName: "# Envío",
      flex: 0.9,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => {
        return params.value ? (
          <Chip label={`#${params.value}`} size="small" variant="outlined" />
        ) : (
          <Chip label="Sin envío" size="small" variant="outlined" />
        );
      },
    },
    {
      field: "estatus",
      headerName: "Estatus",
      flex: 0.7,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => {
        const v = String(params.value || "").toLowerCase();

        const map = {
          recibido: { label: "Recibido", color: "success" },
          pendiente: { label: "Pendiente", color: "warning" },
          asignado: { label: "Asignado", color: "info" },
          cancelado: { label: "Cancelado", color: "error" },
        };

        const cfg = map[v] || { label: params.value || "—", color: "default" };

        return <Chip label={cfg.label} color={cfg.color} size="small" />;
      },
    },
    {
      field: "actions",
      headerName: "Acciones",
      type: "actions",
      getActions: (params) => [
        <Tooltip title="Detalles" key={`envios-${params.row.id}`}>
          <GridActionsCellItem
            icon={<DetailsIcon />}
            sx={{ color: "blue" }}
            label="Detalles"
            onClick={() =>
              handleDetallesFactura(params.row.id, params.row.proveedor_nombre)
            }
          />
        </Tooltip>,
      ],
    },
  ];

  const columnsEnvios = [
    { field: "id", headerName: "ID", flex: 1 },
    { field: "descripcion", headerName: "Descripción", flex: 2 },
    {
      field: "fecha_creacion",
      headerName: "Fecha de Creación",
      flex: 1,
      valueFormatter: (params) => dayjs(params.value).format("DD/MM/YYYY"),
    },
    {
      field: "fecha_programada",
      headerName: "Fecha Programada",
      flex: 1,
      valueFormatter: (params) => dayjs(params.value).format("DD/MM/YYYY"),
    },
    { field: "estatus", headerName: "Estatus", flex: 1 },
  ];

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        fontFamily: "Montserrat",
        fontWeight: "bold",
      }}
    >
      <div
        style={{
          flexDirection: "row",
          fontFamily: "Montserrat",
          textAlign: "center",
          width: "90%",
          marginTop: "10px",
        }}
      >
        <h1>Facturas</h1>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: "-20px",
          }}
        >
          <BreadcrumbsNav />
          <Button
            variant="contained"
            color="primary"
            sx={{
              mb: 2,
            }}
            disabled={selectedFacturas.length === 0}
            onClick={() => {
              console.log("Facturas seleccionadas:", selectedFacturas);
              setOpenEnvioModal(true);
              fetchEnviosAbiertos();
            }}
          >
            Asignar facturas a un envío ({selectedFacturas.length})
          </Button>
        </div>
        <DataGrid
          sx={{
            borderRadius: 4,
            boxShadow: 24,
            borderWidth: 3,
            borderColor: "#1e88e5",
          }}
          rows={data}
          columns={columns}
          showCellVerticalBorder
          showColumnVerticalBorder
          getRowId={(row) => row.id}
          checkboxSelection
          disableRowSelectionOnClick
          isRowSelectable={(params) =>
            params.row.estatus === "recibido" && params.row.envio_id == null
          }
          onRowSelectionModelChange={(newSelection) => {
            setSelectedFacturas(newSelection);
          }}
          rowSelectionModel={selectedFacturas}
          columnVisibilityModel={columnVisibilityModel}
          onColumnVisibilityModelChange={(newModel) =>
            setColumnVisibilityModel(newModel)
          }
          experimentalFeatures={{ newEditingApi: true }}
          density="compact" // Establece el tamaño de las filas en compacto por defecto
          slots={{ toolbar: CustomToolbar }}
        />
        <Dialog
          open={openEnvioModal}
          onClose={handleCloseEnvioModal}
          fullWidth
          maxWidth="md"
        >
          <DialogTitle>
            Selecciona un envío para asignar las facturas seleccionadas
          </DialogTitle>

          <DialogContent sx={{ height: 400 }}>
            <DataGrid
              sx={{ height: 350 }}
              rows={envios}
              columns={columnsEnvios}
              getRowId={(row) => row.id}
              checkboxSelection
              disableRowSelectionOnClick
              onRowSelectionModelChange={(selection) => {
                setSelectedEnvio(selection[0] || null);
              }}
              rowSelectionModel={selectedEnvio ? [selectedEnvio] : []}
            />
          </DialogContent>

          <DialogActions>
            <Button onClick={handleCloseEnvioModal}>Cancelar</Button>
            <Button
              variant="contained"
              disabled={!selectedEnvio}
              onClick={() => {
                asignarFacturas();
              }}
            >
              Confirmar asignación
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    </div>
  );
};

export default Facturas;
