import { Box, Button, Modal, Tooltip, TextField } from "@mui/material";

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
import InsertLinkIcon from "@mui/icons-material/InsertLink";
import Typography from "@mui/material/Typography";
import Swal from "sweetalert2";
import { useParams, useLocation } from "react-router-dom";
import BarraLateral from "../../layout/BarraLateral";

const DetalleFactura = () => {
  const { facturaId } = useParams(); // Aquí obtienes ambos parámetros
  const location = useLocation();
  const proveedorNombre = location.state?.proveedorNombre;
  const [data, setData] = useState([]);
  const [dataProveedor, setDataProveedor] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [lineaId, setLineaId] = useState("");
  const [pedidos, setPedidos] = useState([]);
  const [detalles, setDetalles] = useState([]); // aquí guardas todas las respuestas
  const [detalleData, setDetalleData] = useState([]);
  const [selectionModel, setSelectionModel] = useState([]);
  const [selectedPedidoId, setSelectedPedidoId] = useState(null);
  const [selectedPedidoLineaId, setSelectedPedidoLineaId] = useState("");
  const [selectedSku, setSelectedSku] = useState("");
  const [cantidadFactura, setCantidadFactura] = useState("");
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")));
  const [productoNuevo, setProductoNuevo] = useState(false);
  const [skusLibres, setSkusLibres] = useState([]);
  const [modoCambioSku, setModoCambioSku] = useState(false);
  const [skuSeleccionado, setSkuSeleccionado] = useState(null);
  const [nuevoSku, setNuevoSku] = useState("");
  const [yaPreguntado, setYaPreguntado] = useState(false);
  const [openModalCambioSku, setOpenModalCambioSku] = useState(false);

  const [columnVisibilityModel, setColumnVisibilityModel] = useState({
    id: false,
    linea_id: false,
    descripcion: true,
    estatus: true,
  });

  const handleCloseModalCambioSku = () => {
    setOpenModalCambioSku(false);
    setSkuSeleccionado(null);
    setNuevoSku("");
  };
  useEffect(() => {
    const handleStorageChange = () => {
      setToken(localStorage.getItem("token"));
      setUser(JSON.parse(localStorage.getItem("user")));
      console.log("Usuario:", user);
    };

    // Añadir un listener para el evento `storage`
    window.addEventListener("storage", handleStorageChange);

    // Limpieza al desmontar el componente
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  useEffect(() => {
    if (openModal && !productoNuevo && !modoCambioSku) {
      fetchProductosEnlaces(lineaId);
    }
  }, [openModal, productoNuevo, modoCambioSku]);

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
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    bgcolor: "background.paper",
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

  const handleOpenModal = (params) => {
    setLineaId(params.row.id);
    setSelectedSku(params.row.sku);
    setCantidadFactura(params.row.cantidad);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setLineaId("");
    setSelectedPedidoLineaId("");
    setDetalleData([]);
    setSelectedPedidoId("");
    setProductoNuevo(false);
    setModoCambioSku(false);
    setSkuSeleccionado(null);
    setNuevoSku("");
    setYaPreguntado(false);
  };

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
      flex: 0.6,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "precio",
      headerName: "Precio",
      type: "number",
      flex: 0.6,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "total",
      headerName: "Total",
      type: "number",
      flex: 0.6,
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
      headerName: "# Orden\nProducción",
      type: "text",
      flex: 0.6,
      align: "center",
      headerAlign: "center",
      headerClassName: "header-wrap",
    },
    {
      field: "actions",
      headerName: "Acciones",
      type: "actions",
      getActions: (params) => {
        const { pedido_id, orden_produccion_id } = params.row;

        if (!pedido_id || !orden_produccion_id) {
          return [
            <Tooltip title="Enlazar manual" key={`facturas-${params.row.id}`}>
              <GridActionsCellItem
                icon={<InsertLinkIcon />}
                sx={{ color: "blue" }}
                label="Enlazar manual"
                onClick={() => handleOpenModal(params)}
              />
            </Tooltip>,
          ];
        }

        return []; // No mostrar acciones si ambos existen
      },
    },
  ];

  const columnsDetalles = [
    {
      field: "pedido_id",
      headerName: "# Pedido",
      type: "number",
      flex: 0.5,
      align: "center",
      headerAlign: "center",
    },
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
  ];

  useEffect(() => {
    if (openModal) {
      fetchProductosEnlaces(lineaId);
    }
  }, [openModal]);

  const handleGuardarSeleccion = async () => {
    const seleccionadas = detalleData.filter((row) =>
      selectionModel.includes(row.id)
    );

    const pedido_linea_ids = seleccionadas.map((row) => row.id);
    const totalPedido = seleccionadas.reduce(
      (sum, item) => sum + parseFloat(item.cantidad),
      0
    );
    const cantidadFacturaFloat = parseFloat(cantidadFactura);
    const usuario_id = user.id_usuario;

    try {
      if (cantidadFacturaFloat === totalPedido) {
        // Enlace manual exacto
        await axios.post(`${apiUrl}/facturas/enlazarManual`, {
          factura_detalle_id: lineaId,
          pedido_linea_ids,
          usuario_id,
        });
      } else if (cantidadFacturaFloat < totalPedido) {
        // 🟡 Backorder — preguntar si mantener
        const result = await Swal.fire({
          title: "¿Deseas mantener el backorder?",
          icon: "question",
          showCancelButton: true,
          showDenyButton: true,
          confirmButtonText: "Sí",
          denyButtonText: "No",
          cancelButtonText: "Cancelar",
        });

        if (result.isDismissed) return;

        const mantener_backorder = result.isConfirmed;

        await axios.post(`${apiUrl}/facturas/enlazarFacturaConBackOrder`, {
          factura_detalle_id: lineaId,
          pedido_linea_ids,
          usuario_id,
          mantener_backorder,
        });
      } else if (cantidadFacturaFloat > totalPedido) {
        // 🟠 Excedente — también preguntar
        const result = await Swal.fire({
          title: "¿Deseas mantener el backorder para el excedente?",
          icon: "question",
          showCancelButton: true,
          showDenyButton: true,
          confirmButtonText: "Sí",
          denyButtonText: "No",
          cancelButtonText: "Cancelar",
        });

        if (result.isDismissed) return;

        const mantenerBackorder = result.isConfirmed;

        await axios.post(`${apiUrl}/facturas/enlaceFacturaConExcedente`, {
          factura_detalle_id: lineaId,
          lineasPedidoIds: pedido_linea_ids,
          usuario_id,
          mantenerBackorder,
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Enlace inválido",
          text: "Verifica cantidades y selección.",
        });
        return;
      }

      Swal.fire({
        icon: "success",
        title: "Enlace realizado correctamente",
      });

      setOpenModal(false);
      fetchDetalleFactura(facturaId);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error al guardar",
        text: error.response?.data?.message || "Error desconocido",
      });
    } finally {
      setOpenModal(false);
      fetchDetalleFactura(facturaId);
    }
  };

  const enlazarManual = async () => {
    try {
      await axios.post(`${apiUrl}/facturas/enlazarManual`, {
        factura_detalle_id: lineaId,
        pedido_linea_id: selectedPedidoLineaId,
        usuario_id: user.id_usuario,
      });
      setOpenModal(false);
      fetchDetalleFactura(facturaId);
    } catch (error) {
      const errorMessage = error.response.data.message;
      Swal.fire({
        title: "Error",
        text: errorMessage,
        icon: "warning",
        timer: 5000,
        showCloseButton: true,
        allowEscapeKey: true,
        target: document.getElementById("modal-enlazar"),
      });
    }
  };

  const agregarBackOrder = async () => {
    const result = await Swal.fire({
      title: "¿Mantener en backorder?",
      text: "¿Deseas mantener el producto en backorder?",
      icon: "question",
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: "Sí",
      denyButtonText: "No",
      cancelButtonText: "Cancelar",
      target: document.getElementById("modal-enlazar"),
    });

    // Cancelar: cerrar sin hacer nada
    if (result.isDismissed) {
      return;
    }

    // Determinar valor de mantener_backorder
    const mantenerBackorder = result.isConfirmed ? true : false;

    try {
      await axios.post(`${apiUrl}/facturas/enlazarFacturaConBackOrder`, {
        factura_detalle_id: lineaId,
        pedido_linea_id: selectedPedidoLineaId,
        mantener_backorder: mantenerBackorder,
        usuario_id: user.id_usuario,
      });
      setOpenModal(false);
      fetchDetalleFactura(facturaId);
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Error desconocido";
      Swal.fire({
        title: "Error",
        text: errorMessage,
        icon: "warning",
        timer: 5000,
        showCloseButton: true,
        allowEscapeKey: true,
        target: document.getElementById("modal-enlazar"),
      });
    }
  };

  const fetchSkusLibres = async () => {
    try {
      const response = await axios.get(
        `${apiUrl}/facturas/componentes/skulibres`
      );
      setSkusLibres(response.data);
    } catch (error) {
      console.error("Error al obtener SKUs antiguos", error);
    }
  };

  const handleEjecutarReemplazoSku = async () => {
    try {
      await axios.post(`${apiUrl}/facturas/reemplazarSku`, {
        componente_id_viejo: skuSeleccionado.componente_id,
        nuevo_sku: nuevoSku,
        usuario_id: user.id_usuario,
      });

      Swal.fire("¡Éxito!", "El SKU fue reemplazado correctamente", "success");
      setModoCambioSku(false);
      setOpenModalCambioSku(false);
      fetchDetalleFactura(facturaId);
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "Error al reemplazar SKU",
        "error"
      );
    }
  };

  const marcarComoNuevoProducto = async (facturaDetalleId) => {
    try {
      await axios.put(`${apiUrl}/facturas/nuevoProducto`, {
        factura_detalle_id: facturaDetalleId,
      });

      await Swal.fire("¡Marcado!", "Producto marcado como nuevo.", "success");

      // Recargar visualización si aplica
      fetchDetalleFactura(facturaId);
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "No se pudo marcar como nuevo.",
        "error"
      );
    }
  };

  const enlazarExcedente = async () => {
    try {
      await axios.post(`${apiUrl}/facturas/enlaceFacturaConExcedente`, {
        factura_detalle_id: lineaId,
        pedido_linea_id: selectedPedidoLineaId,
        usuario_id: user.id_usuario,
      });
      setOpenModal(false);
      fetchDetalleFactura(facturaId);
    } catch (error) {
      const errorMessage = error.response.data.message;
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

  const linkOrden = async (params) => {
    const factura = Number(cantidadFactura);
    const enlace = Number(params.row.cantidad);

    if (isNaN(factura) || isNaN(enlace)) {
      alert("Error: las cantidades no son válidas.");
      return;
    }

    if (factura === enlace) {
      await enlazarManual();
    } else if (factura < enlace) {
      await agregarBackOrder();
    } else if (factura > enlace) {
      await enlazarExcedente();
    } else {
      alert("Ocurrió un error inesperado al llamar el enlace");
    }
  };

  const fetchProductosEnlaces = async (lineaId) => {
    if (yaPreguntado) return;

    try {
      const response = await axios.get(
        `${apiUrl}/facturas/detalle/${lineaId}/posiblesEnlaces`
      );

      let productosConIds = [];

      if (response.data && Array.isArray(response.data)) {
        productosConIds = response.data.flatMap((pedido) =>
          pedido.productos.map((producto) => ({
            ...producto,
            id: producto.pedido_linea_id,
            pedido_id: pedido.pedido_id,
          }))
        );
      }

      setDetalleData(productosConIds);

      if (productosConIds.length === 0) {
        // Primero cierra el modal para limpiar todo
        setOpenModal(false);

        // Espera un pequeño delay para que React procese el cierre
        setTimeout(() => {
          Swal.fire({
            icon: "info",
            title: "Producto no encontrado",
            text: "Este SKU no coincide con ningún pedido. ¿Es un producto nuevo o un cambio de SKU?",
            showDenyButton: true,
            confirmButtonText: "Es nuevo",
            denyButtonText: "Cambio de SKU",
          }).then(async (result) => {
            if (result.isConfirmed) {
              await axios.put(`${apiUrl}/facturas/nuevoProducto`, {
                factura_detalle_id: lineaId,
              });

              await Swal.fire(
                "✅ Marcado",
                "El producto fue marcado como 'nuevo producto'.",
                "success"
              );

              fetchDetalleFactura(facturaId); // refresca la vista
            } else if (result.isDenied) {
              setModoCambioSku(true);
              const response = await axios.get(
                `${apiUrl}/facturas/componentes/skulibres`
              );
              setSkusLibres(response.data);
              setOpenModalCambioSku(true); // 🔥 abrir modal aparte
            }
          });
        }, 300);
      }
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: error.response?.data?.message || "Error al cargar los datos",
        icon: "warning",
        timer: 5000,
        showCloseButton: true,
        allowEscapeKey: true,
      });
    }
  };

  const handleSelectPedido = (pedidoId) => {
    // Buscamos la orden seleccionada en el arreglo de ordenes ya cargadas
    const pedidoSeleccionado = pedidos.find(
      (pedido) => pedido.pedido_id === pedidoId
    );

    if (pedidoSeleccionado) {
      // Le agregamos un 'id' único a cada producto usando el índice
      const productosConIndice = pedidoSeleccionado.productos.map(
        (producto, index) => ({
          ...producto,
          id: index, // esto será usado por el DataGrid
        })
      );
      setSelectedPedidoId(pedidoId);
      setSelectedPedidoLineaId(pedidoSeleccionado.pedido_linea_id);
      setDetalleData(productosConIndice);
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
                <strong>Correo:</strong>{" "}
                {dataProveedor?.correo || "Cargando..."}
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
      <Modal id="modal-enlazar" open={openModal} onClose={handleCloseModal}>
        <Box
          sx={{
            ...styleEnlazar,
            display: "flex",
            flexDirection: "column",
            width: "80vw",
            height: "80vh",
          }}
        >
          {modoCambioSku ? (
            // 🔁 Cambio de SKU
            <>
              <Typography
                sx={{
                  fontFamily: "Montserrat",
                  fontWeight: "bold",
                  textAlign: "center",
                  marginBottom: 3,
                  color: "purple",
                }}
              >
                🔁 Cambio de SKU — Producto recibido: {selectedSku}
              </Typography>

              <Typography sx={{ fontFamily: "Montserrat", mb: 2 }}>
                Selecciona el SKU anterior desde los pedidos abiertos y escribe
                el nuevo:
              </Typography>

              <DataGrid
                rows={skusLibres}
                columns={[
                  { field: "sku", headerName: "SKU Antiguo", flex: 1 },
                  { field: "descripcion", headerName: "Descripción", flex: 2 },
                ]}
                getRowId={(row) => row.componente_id}
                onRowClick={(params) => setSkuSeleccionado(params.row)}
                autoHeight
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Nuevo SKU"
                value={nuevoSku}
                onChange={(e) => setNuevoSku(e.target.value)}
                sx={{ mb: 3 }}
              />

              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Button
                  onClick={handleCloseModal}
                  variant="outlined"
                  color="primary"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleEjecutarReemplazoSku}
                  variant="contained"
                  color="success"
                  disabled={!skuSeleccionado || !nuevoSku}
                >
                  Reemplazar SKU
                </Button>
              </Box>
            </>
          ) : productoNuevo ? (
            // 🆕 Producto nuevo
            <>
              <Typography
                sx={{
                  fontFamily: "Montserrat",
                  fontWeight: "bold",
                  textAlign: "center",
                  marginBottom: 3,
                  color: "orange",
                }}
              >
                ⚠️ Producto nuevo detectado — SKU: {selectedSku}
              </Typography>

              <Typography sx={{ fontFamily: "Montserrat", mb: 2 }}>
                Este producto no existe en los pedidos actuales ni en el
                sistema. Puedes:
              </Typography>

              <ul style={{ fontFamily: "Montserrat", marginBottom: "2rem" }}>
                <li>
                  Registrar el producto en la base de datos (Mercadotecnia)
                </li>
                <li>Generar orden de entrada manual</li>
                <li>
                  O bien{" "}
                  <Button
                    size="small"
                    variant="outlined"
                    color="secondary"
                    onClick={async () => {
                      // Activa la visual de cambio de SKU
                      setModoCambioSku(true);

                      // Cargar SKUs disponibles
                      const response = await axios.get(
                        `${apiUrl}/componentes/skulibres`
                      );
                      setSkusLibres(response.data);
                    }}
                  >
                    Cambiar SKU
                  </Button>
                </li>
              </ul>

              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Button
                  onClick={handleCloseModal}
                  variant="outlined"
                  color="primary"
                >
                  Cancelar
                </Button>

                <Button
                  onClick={() => {
                    Swal.fire("⚙️ Próximamente: flujo de alta");
                  }}
                  variant="contained"
                  color="success"
                >
                  Generar orden de entrada
                </Button>
              </Box>
            </>
          ) : (
            // ✅ Coincidencias normales
            <>
              <Typography
                sx={{
                  fontFamily: "Montserrat",
                  fontWeight: "bold",
                  textAlign: "center",
                  marginBottom: "10px",
                }}
              >
                Selecciona la línea a enlazar — SKU: {selectedSku}
              </Typography>

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
                checkboxSelection
                disableRowSelectionOnClick
                getRowId={(row) => row.id}
                density="compact"
                showCellVerticalBorder
                showColumnVerticalBorder
                columnVisibilityModel={columnVisibilityModel}
                onColumnVisibilityModelChange={(newModel) =>
                  setColumnVisibilityModel(newModel)
                }
                selectionModel={selectionModel}
                onRowSelectionModelChange={(newSelection) =>
                  setSelectionModel(newSelection)
                }
                slots={{ toolbar: CustomToolbar }}
              />

              <Box
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginTop: 8,
                }}
              >
                <Button
                  onClick={handleCloseModal}
                  variant="contained"
                  color="primary"
                >
                  Cerrar
                </Button>

                <Button
                  onClick={handleGuardarSeleccion}
                  variant="contained"
                  color="success"
                  disabled={selectionModel.length === 0}
                >
                  Enlazar factura
                </Button>
              </Box>
            </>
          )}
        </Box>
      </Modal>

      <Modal
        open={openModalCambioSku}
        onClose={() => setOpenModalCambioSku(false)}
      >
        <Box
          sx={{
            ...styleEnlazar,
            display: "flex",
            flexDirection: "column",
            width: "70vw",
            height: "70vh",
          }}
        >
          <Typography
            sx={{
              fontFamily: "Montserrat",
              fontWeight: "bold",
              textAlign: "center",
              marginBottom: 3,
              color: "purple",
            }}
          >
            🔁 Cambio de SKU — Producto recibido: {selectedSku}
          </Typography>

          <Typography sx={{ fontFamily: "Montserrat", mb: 2 }}>
            Selecciona el SKU anterior desde los componentes registrados y
            escribe el nuevo:
          </Typography>

          {/* Aquí el scroll */}
          <Box sx={{ height: 300, mb: 2 }}>
            <DataGrid
              rows={skusLibres}
              columns={[
                { field: "sku", headerName: "SKU Antiguo", flex: 1 },
                { field: "descripcion", headerName: "Descripción", flex: 2 },
              ]}
              getRowId={(row) => row.componente_id}
              onRowClick={(params) => setSkuSeleccionado(params.row)}
              pageSize={10}
              rowsPerPageOptions={[10, 25, 50]}
              density="compact"
              sx={{
                fontFamily: "Montserrat",
                fontWeight: "bold",
              }}
            />
          </Box>

          <TextField
            fullWidth
            label="Nuevo SKU"
            value={nuevoSku}
            onChange={(e) => setNuevoSku(e.target.value)}
            sx={{ mb: 3 }}
          />

          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Button
              onClick={() => setOpenModalCambioSku(false)}
              variant="outlined"
              color="primary"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleEjecutarReemplazoSku}
              variant="contained"
              color="success"
              disabled={!(skuSeleccionado && nuevoSku.trim())}
            >
              Reemplazar SKU
            </Button>
          </Box>
        </Box>
      </Modal>
    </div>
  );
};

export default DetalleFactura;
