import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import {
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import DetallePedidoModal from "./DetallePedidoModal";
import { Link, useLocation } from "react-router-dom";

const apiUrl =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_URL
    : process.env.REACT_APP_API_URL_LOCAL;

const VistaPedidos = () => {
  const [pedidos, setPedidos] = useState([]);
  const [filteredPedidos, setFilteredPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [detalleSeleccionado, setDetalleSeleccionado] = useState(null);
  const [pedidoIdFiltro, setPedidoIdFiltro] = useState("");
  const [facturaIdFiltro, setFacturaFiltro] = useState("");
  const location = useLocation();
  const proveedorNombre = location.state?.proveedorNombre;


  useEffect(() => {
    const fetchPedidos = async () => {
      try {
        const res = await axios.get(`${apiUrl}/pedidos`);
        setPedidos(res.data);
        setFilteredPedidos(res.data);
      } catch (error) {
        console.error("❌ Error al obtener pedidos:", error);
        Swal.fire("Error", "No se pudieron cargar los pedidos", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchPedidos();
  }, []);

  useEffect(() => {
    if (location.state?.pedidoIdDesdeFactura) {
    setPedidoIdFiltro(location.state.pedidoIdDesdeFactura.toString());   
    
    window.history.replaceState({}, document.title);
  }
  }, [location.state])

  useEffect(() => {
    const lowerSearch = search.toLowerCase();

    const resultado = pedidos.filter((pedido) => {
      const coincideTexto = Object.values(pedido).some((valor) =>
        valor?.toString().toLowerCase().includes(lowerSearch)
      );
      

      const fechaPedido = new Date(pedido.fecha_creacion)
        .toISOString()
        .slice(0, 10);
      const desdeStr = fechaInicio || null;
      const hastaStr = fechaFin || null;

      const dentroDeRango =
        (!desdeStr || fechaPedido >= desdeStr) &&
        (!hastaStr || fechaPedido <= hastaStr);

      const coincidePedidoId =
         !pedidoIdFiltro || pedido.pedido_id.toString() === pedidoIdFiltro;

       const coincideFacturaId = 
          !facturaIdFiltro || pedido.factura_id?.toString() === facturaIdFiltro;

      return coincideTexto && dentroDeRango && coincidePedidoId && coincideFacturaId;


    });

    setFilteredPedidos(resultado);
  }, [search, pedidos, fechaInicio, fechaFin, pedidoIdFiltro, facturaIdFiltro]);

  const abrirModalDetalle = async (row) => {
    const res = await axios.get(
      `${apiUrl}/pedidos/detalle/${row.pedido_linea_id}`
    );
    setDetalleSeleccionado(res.data[0]);
    setModalOpen(true);
  };

  const cerrarModalDetalle = () => {
    setModalOpen(false);
    setDetalleSeleccionado(null);
  };

  // const resultadoAgrupado = resultado.reduce((acc, pedido) => {
  //   const id = pedido.pedido_id;
  //   if (!acc[id]) acc[id] = [];
  //   acc[id].push(pedido);
  //   return acc;
  // }, {});

  // setFilteredPedidos(resultadoAgrupado);

  const [columnVisibilityModel, setColumnVisibilityModel] = useState({
    back_order: false,
    fecha_back: false,
    cantidad_backorder: false,
  });

  const columns = [
    { field: "pedido_id", headerName: "# Pedido", minWidth: 100, flex: 0.6 },
    {
      field: "pedido_linea_id",
      headerName: "# Línea",
      minWidth: 110,
      flex: 0.6,
    },
    {
      field: "fecha_creacion",
      headerName: "Fecha Creación",
      minWidth: 200,
      flex: 1,
      renderCell: (params) =>
        params.value
          ? new Date(params.value).toLocaleDateString("es-MX")
          : "Sin fecha",
    },
    {
      field: "fecha_compromiso",
      headerName: "Fecha Compromiso",
      minWidth: 200,
      flex: 1,
      renderCell: (params) =>
        params.value
          ? new Date(params.value).toLocaleDateString()
          : "Sin fecha",
    },
    {
      field: "proveedor_nombre",
      headerName: "Proveedor",
      minWidth: 180,
      flex: 1,
    },
    {
      field: "componente_desc",
      headerName: "Producto",
      minWidth: 150,
      flex: 1,
    },
    {
      field: "cantidad_proveedor",
      headerName: "Cantidad Pedido",
      minWidth: 140,
      flex: 0.8,
    },
    {
      field: "cantidad_recibida",
      headerName: "Cantidad Recibida",
      minWidth: 150,
      flex: 0.8,
    },

    {
      field: "factura_id",
      headerName: "Factura",
      renderCell: (params) => {
        const { value, row } = params;

        if (!value) {
          return <span>Pedido sin factura</span>;
        }

        return (
          <Tooltip title="Haz clic para ver los detalles de la factura" arrow>

          <Link
            to={`/detalleFacturas/factura/${value}`}
            state={{ proveedorNombre: row.proveedor_nombre }}
            style={{
              textDecoration: "none",
              color: "#1976d2",
              fontWeight: "bold",
            }}
          >
            {value}
          </Link>
          </Tooltip>
        );
      },
    },
    {
      field: "numero_factura",
      headerName: "Numero de linea de factura ",
      minWidth: 180,
      flex: 1,
      renderCell: (params) =>
        params.value ? params.value : "Pedido sin factura linkeada",
    },
    {
      field: "back_order",
      headerName: "¿Tiene backorder?",
      minWidth: 130,
      flex: 0.7,
      renderCell: (params) => (params.value === 1 ? "Sí" : "No"),
    },
    {
      field: "cantidad_backorder",
      headerName: "Cantidad Backorder",
      minWidth: 160,
      flex: 0.9,
    },
    {
      field: "fecha_back",
      headerName: "Fecha Backorder",
      minWidth: 160,
      flex: 0.9,
      renderCell: (params) =>
        params.value
          ? new Date(params.value).toLocaleDateString()
          : "Sin fecha",
      hide: true,
    },
    { field: "estatus_linea", headerName: "Estatus", minWidth: 130, flex: 0.8 },
    {
      field: "acciones",
      headerName: "Acciones",
      minWidth: 130,
      flex: 0.6,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Button
          variant="outlined"
          size="small"
          onClick={() => abrirModalDetalle(params.row)}
        >
          Detalles
        </Button>
      ),
    },
  ];

  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant="h4" gutterBottom align="center">
        Pedidos
      </Typography>

      <Box sx={{ display: "flex", gap: 2, marginBottom: 2 }}>
        <TextField
          label="Buscar en todos los campos"
          variant="outlined"
          sx={{ width: "25rem", backgroundColor: "white" }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <TextField
          label="Filtrar por # Pedido"
          variant="outlined"
          sx={{ width: "12rem", backgroundColor: "white" }}
          value={pedidoIdFiltro}
          onChange={(e) => setPedidoIdFiltro(e.target.value)}
        />

        <TextField
          label="Filtrar por # factura"
          variant="outlined"
          sx={{ width: "12rem", backgroundColor: "white" }}
          value={facturaIdFiltro}
          onChange={(e) => setFacturaFiltro(e.target.value)}
        />

        <TextField
          label="Desde"
          type="date"
          InputLabelProps={{ shrink: true }}
          sx={{ width: "12rem", backgroundColor: "white" }}
          value={fechaInicio}
          onChange={(e) => setFechaInicio(e.target.value)}
        />

        <TextField
          label="Hasta"
          type="date"
          InputLabelProps={{ shrink: true }}
          sx={{ width: "12rem", backgroundColor: "white" }}
          value={fechaFin}
          onChange={(e) => setFechaFin(e.target.value)}
        />

        <Button
          variant="outlined"
          onClick={() => {
            setFechaInicio("");
            setFechaFin("");
          }}
        >
          Limpiar Fechas
        </Button>
      </Box>

      {loading ? (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          height="300px"
        >
          <CircularProgress />
        </Box>
      ) : (
        <DataGrid
          rows={filteredPedidos}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
          getRowId={(row) => row.pedido_linea_id}
          showCellVerticalBorder
          showColumnVerticalBorder
          density="compact"
          sx={{
            height: 500,
            borderRadius: 4,
            boxShadow: 24,
            borderWidth: 3,
            borderColor: "#1e88e5",
          }}
          slots={{ toolbar: GridToolbar }}
          columnVisibilityModel={columnVisibilityModel}
          onColumnVisibilityModelChange={(newModel) =>
            setColumnVisibilityModel(newModel)
          }
        />
      )}

      {/* Modal */}
      <DetallePedidoModal
        open={modalOpen}
        handleClose={cerrarModalDetalle}
        detalle={detalleSeleccionado}
      />
    </Box>
  );
};

export default VistaPedidos;
