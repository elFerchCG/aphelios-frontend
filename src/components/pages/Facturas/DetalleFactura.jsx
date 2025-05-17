import { Box, Button, Modal, Tooltip } from "@mui/material";
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
import React, { useEffect, useState } from "react";
import InsertLinkIcon from '@mui/icons-material/InsertLink';
import Typography from "@mui/material/Typography";
import Swal from "sweetalert2";
import { useParams, useLocation } from "react-router-dom";
import ReplyAllIcon from '@mui/icons-material/ReplyAll';
import BarraLateral from "../../layout/BarraLateral";


const DetalleFactura = () => {
  const { facturaId } = useParams(); // Aquí obtienes ambos parámetros
  const location = useLocation();
  const proveedorNombre = location.state?.proveedorNombre;
  const [data, setData] = useState([]);
  const [dataProveedor, setDataProveedor] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [lineaId, setLineaId] = useState('');
  const [lineaDetalle, setLineaDetalle] = useState("");
  const [ordenes, setOrdenes] = useState([]);
  const [detalles, setDetalles] = useState([]); // aquí guardas todas las respuestas
  const [detalleData, setDetalleData] = useState([]);
  const [selectedOrdenId, setSelectedOrdenId] = useState(null);
  const [selectedLineaId, setSelectedLineaId] = useState("");
  const [selectedSku, setSelectedSku] = useState("");
  const [columnVisibilityModel, setColumnVisibilityModel] = useState({
    id: false,
    linea_id: false,
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

  // Estilos del modal
  const styleEnlazar = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    bgcolor: 'background.paper',
    borderRadius: 4,
    boxShadow: 24,
    p: 2,
  };

  useEffect(() => {
    fetchDetalleFactura(facturaId);
  }, [apiUrl]);

  useEffect(() => {
    fetchProveedor(proveedorNombre);
  }, [apiUrl]);

  const parseDetalles = (detalles) =>
    detalles.map((d) => ({
      ...d,
      cantidad: parseFloat(d.cantidad),
      precio: parseFloat(d.precio),
      total: parseFloat(d.total),
    }));

  const parseDetallesDataGrid = (detalles) =>
    detalles.map((d) => ({
      ...d,
      // Deja cantidad como string
      cantidad: d.cantidad,
      precio: `$${Number(d.precio).toFixed(2)}`,
      total: `$${Number(d.total).toFixed(2)}`,
    }));


  const fetchProveedor = async (proveedorNombre) => {
    try {
      const response = await axios.get(
        `${apiUrl}/proveedores/nombreProveedor`,
        {
          params: {
            proveedor_nombre: proveedorNombre,
          },
        }
      );

      console.log(response.data);
      setDataProveedor(response.data.data[0]);
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

  const fetchDetalleFactura = async (facturaId) => {
    try {
      const response = await axios.get(`${apiUrl}/facturas/${facturaId}`);
      if (response.data && Array.isArray(response.data.detalles)) {
        const detallesParseados = parseDetallesDataGrid(response.data.detalles);
        setData(detallesParseados);
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
    }
  };

  // const fetchOrden = async (facturaId) => {
  //   try {
  //     const response = await axios.get(`${apiUrl}/facturas/${facturaId}`);
  //     if (response.data && Array.isArray(response.data.detalles)) {
  //       const detallesParseados = parseDetalles(response.data.detalles);
  //       setDetalleData(detallesParseados);
  //     }
  //   } catch (error) {
  //     const errorMessage =
  //       error.response?.data?.message || "Error al cargar los datos";
  //     Swal.fire({
  //       title: "Error",
  //       text: errorMessage,
  //       icon: "warning",
  //       timer: 5000,
  //       showCloseButton: true,
  //       allowEscapeKey: true,
  //     });
  //   }
  // };

  const backOrder = async (params) => {
    try {
      Swal.fire({
        title: '¿Estás seguro de ajustar con back order?',
        text: '¡No podrás revertir esto!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, ajustar con back order!',
        //target: document.getElementById("modal-details"),
      }).then(async (result) => {
        if (result.isConfirmed) {
          try {
            const data = {
              linea_id: params.row.linea_id,
              cantidad_facturada: params.row.cantidad
            }

            await axios.post(`${apiUrl}/facturas/actualizarBackOrder`, data);
            fetchDetalleFactura(facturaId);

            //setOpenDetailsComponente(false);
          } catch (error) {
            const errorMessage = error.response.data.message;
            Swal.fire({
              title: 'Error',
              text: errorMessage,
              icon: 'error',
              timer: 5000,
              showCloseButton: true,
              allowEscapeKey: true,
              target: document.getElementById("modal-details"),
            });
          }
        } else if (result.isDismissed) {
          //setOpenDetailsComponente(false);
        }
      })

    } catch (error) {
      const errorMessage = error.response.data.message;
      Swal.fire({
        title: 'Error',
        text: errorMessage,
        icon: 'error',
        timer: 5000,
        showCloseButton: true,
        allowEscapeKey: true
      });
    }
  }

  const handleOpenModal = (params) => {
    setLineaId(params.row.id);
    setSelectedSku(params.row.sku);
    setOpenModal(true);
  }

  const handleCloseModal = () => {
    setOpenModal(false);
    setLineaId("");
    setSelectedLineaId("");
    setDetalleData([]);
    setSelectedOrdenId("");
  }

  const enlazarManual = async () => {
    try {
      const response = await axios.post(`${apiUrl}/facturas/enlazarManual`,
        {
          factura_detalle_id: lineaId,
          linea_id: selectedLineaId
        },
      );
      if (response.data.message) {
        //await fetchEnvios();
      }
    } catch (error) {
      const errorMessage = error.response.data.message;
      Swal.fire({
        title: 'Error',
        text: errorMessage,
        icon: 'warning',
        timer: 5000,
        showCloseButton: true,
        allowEscapeKey: true,
      });
    }
  }

  const columns = [
    {
      field: "id",
      headerName: "Folio",
      type: "number",
      flex: 0.6,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "sku",
      headerName: "SKU",
      type: "text",
      flex: 2,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "cantidad",
      headerName: "Cantidad",
      type: "number",
      flex: 1,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "precio",
      headerName: "Precio",
      type: "number",
      flex: 1,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "total",
      headerName: "Total",
      type: "number",
      flex: 1,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "pedido_id",
      headerName: "# Pedido",
      type: "text",
      flex: 0.6,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "orden_produccion_id",
      headerName: "# Orden Producción",
      type: "text",
      flex: 0.6,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "actions",
      headerName: "Acciones",
      type: "actions",
      getActions: (params) => [
        <Tooltip title="Enlazar manual" key={`facturas-${params.row.id}`}>
          <GridActionsCellItem
            icon={<InsertLinkIcon />}
            sx={{ color: "blue" }}
            label="Enlazar manual"
            onClick={() => handleOpenModal(params)}
          />
        </Tooltip>,
        <Tooltip title="Back Order" key={`facturas-${params.row.id}`}>
          <GridActionsCellItem
            icon={<ReplyAllIcon />}
            sx={{ color: "red" }}
            label="Back Order"
            onClick={() => backOrder(params)}
          />
        </Tooltip>
      ],
    },
  ];

  const columnsDetalles = [
    {
      field: "sku",
      headerName: "SKU",
      type: "text",
      flex: 3,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "descripcion",
      headerName: "Descripción",
      type: "text",
      flex: 4,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "cantidad",
      headerName: "Cantidad",
      type: "number",
      flex: 1,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "actions",
      headerName: "Acciones",
      type: "actions",
      getActions: (params) => {
        // Aquí comparas el SKU del producto con el SKU seleccionado del datagrid principal
        if (params.row.sku === selectedSku) {
          return [
            <Tooltip title="Enlazar manual" key={`facturas-${params.row.id}`}>
              <GridActionsCellItem
                icon={<InsertLinkIcon />}
                sx={{ color: "blue" }}
                label="Enlazar manual"
                onClick={() => enlazarManual()}
              />
            </Tooltip>
          ];
        } else {
          // Si no coincide, no retornas ninguna acción (botón oculto)
          return [];
        }
      },
    },
  ];

  useEffect(() => {
    if (openModal) {
      fetchProductosEnlaces(lineaId);
    }
  }, [openModal]);

  // const fetchOrdenes = async (lineaId) => {
  //   try {
  //     const response = await axios.get(`${apiUrl}/facturas/detalle/${lineaId}/posiblesEnlaces`);
  //     if (response.data && Array.isArray(response.data)) {
  //       // EXTRAER los orden_id únicos para la barra lateral
  //       const ordenesUnicas = response.data.map(item => ({
  //         orden_id: item.orden_id,
  //       }));

  //       setOrdenes(ordenesUnicas);
  //     }
  //   } catch (error) {
  //     const errorMessage =
  //       error.response?.data?.message || "Error al cargar los datos";
  //     Swal.fire({
  //       title: "Error",
  //       text: errorMessage,
  //       icon: "warning",
  //       timer: 5000,
  //       showCloseButton: true,
  //       allowEscapeKey: true,
  //     });
  //   }
  // };

  const fetchProductosEnlaces = async (lineaId) => {
    try {
      const response = await axios.get(`${apiUrl}/facturas/detalle/${lineaId}/posiblesEnlaces`);
      if (response.data && Array.isArray(response.data)) {
        setDetalles(response.data);
        // EXTRAER los orden_id únicos para la barra lateral
        const ordenesUnicas = response.data.map(item => ({
          orden_id: item.orden_id,
          linea_id: item.linea_id,
          productos: item.productos
        }));

        setOrdenes(ordenesUnicas);
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
    }
  };

  const handleSelectOrden = (ordenId) => {

    // Buscamos la orden seleccionada en el arreglo de ordenes ya cargadas
    const ordenSeleccionada = ordenes.find((orden) => orden.orden_id === ordenId);

    if (ordenSeleccionada) {
      // Le agregamos un 'id' único a cada producto usando el índice
      const productosConIndice = ordenSeleccionada.productos.map((producto, index) => ({
        ...producto,
        id: index, // esto será usado por el DataGrid
      }));
      setSelectedOrdenId(ordenId);
      setSelectedLineaId(ordenSeleccionada.linea_id);
      setDetalleData(productosConIndice);

      console.log("Esta es mi id del detalle de la factura:", facturaId);
      console.log("Esta es mi id de la orden seleccionada:", ordenId);
      console.log("Esta es mi linea de la orden seleccionada:", ordenSeleccionada.linea_id);
    } else {
      setDetalleData([]); // si no hay productos, dejamos el grid vacío
    }
  };


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
          fontWeight: "bold",
          textAlign: "center",
          width: "90%",
          height: 500,
        }}
      >
        <h2>Detalle Factura {facturaId}</h2>
        <Box
          display="flex"
          justifyContent="center"
          sx={{ height: 150, borderRadius: 4, boxShadow: 4, borderWidth: 3 }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 1,
            }}
          >

            <Box sx={{ alignItems: "start" }}>
              <Typography variant="h6" component="h2">
                Informacion de la empresa emisora
              </Typography>
              <Typography variant="body1">
                <strong>Proveedor:</strong>{" "}
                {dataProveedor?.razon_social || "Cargando..."}
              </Typography>
              <Typography variant="body1">
                <strong>RFC:</strong> {dataProveedor?.rfc || "Cargando..."}
              </Typography>
              <Typography variant="body1">
                <strong>Correo:</strong> {dataProveedor?.correo || "Cargando..."}
              </Typography>
            </Box>
          </Box>
        </Box>
        <DataGrid
          sx={{
            borderRadius: 4,
            boxShadow: 24,
            borderWidth: 3,
            borderColor: "#1e88e5",
            fontFamily: "Montserrat",
            fontWeight: "bold",
            height: 400,
            mt: 2,
          }}
          rows={data}
          columns={columns}
          showCellVerticalBorder
          showColumnVerticalBorder
          getRowId={(row) => row.id}
          columnVisibilityModel={columnVisibilityModel}
          onColumnVisibilityModelChange={(newModel) =>
            setColumnVisibilityModel(newModel)
          }
          experimentalFeatures={{ newEditingApi: true }}
          density="compact" // Establece el tamaño de las filas en compacto por defecto
          slots={{ toolbar: CustomToolbar }}
        />
      </div>
      {/* Ventana Modal Details Componente*/}
      <Modal
        id="modal-enlazar"
        open={openModal}
        onClose={handleCloseModal}
      >
        <Box
          sx={{
            ...styleEnlazar,
            display: 'flex',
            flexDirection: 'row',
            width: '80vw',
            height: '80vh',
          }}
        >
          <BarraLateral ordenes={ordenes} onSelectOrden={handleSelectOrden} />
          {/* Contenido principal */}
          <Box sx={{ flex: 1, p: 2, overflowY: 'auto' }}>
            <Typography sx={{ fontFamily: 'Montserrat', fontWeight: "bold", textAlign: "center", marginBottom: "10px" }}>
              Lineas de la orden {selectedOrdenId}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'row', flexWrap: "wrap", gap: 2 }}>
              <DataGrid
                sx={{
                  borderRadius: 4,
                  boxShadow: 24,
                  borderWidth: 3,
                  borderColor: "#1e88e5",
                  fontFamily: "Montserrat",
                  fontWeight: "bold",
                  height: 400,
                  mt: 2,
                }}

                rows={detalleData}
                columns={columnsDetalles}
                showCellVerticalBorder
                showColumnVerticalBorder
                getRowId={(row) => row.id}
                columnVisibilityModel={columnVisibilityModel}
                onColumnVisibilityModelChange={(newModel) =>
                  setColumnVisibilityModel(newModel)
                }
                experimentalFeatures={{ newEditingApi: true }}
                density="compact" // Establece el tamaño de las filas en compacto por defecto
                slots={{ toolbar: CustomToolbar }}
              />
            </Box>
            <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
              <Button onClick={handleCloseModal} variant="contained" color="primary">Cerrar</Button>
              {/* <Button variant="contained" color="success">Guardar</Button> */}
            </Box>
          </Box>
        </Box>
      </Modal>
    </div>
  );
};

export default DetalleFactura;
