import {
  Box,
  Button,
  Modal,
  TextField,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";

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
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LinkOffIcon from "@mui/icons-material/LinkOff";
import NewReleasesIcon from "@mui/icons-material/NewReleases";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import { green, orange, grey } from "@mui/material/colors";
import Tooltip from "@mui/material/Tooltip";
import { Link } from "react-router-dom";
import BreadcrumbsNav from "./BreadcrumbsNav";

const DetalleFactura = () => {
  const { facturaId } = useParams(); // Aquí obtienes ambos parámetros
  const location = useLocation();
  const proveedorNombre = location.state?.proveedorNombre;
  const [data, setData] = useState([]);
  const [dataProveedor, setDataProveedor] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [lineaId, setLineaId] = useState("");
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
  const [busquedaSku, setBusquedaSku] = useState("");

  const [columnVisibilityModel, setColumnVisibilityModel] = useState({
    id: false,
    linea_id: false,
    descripcion: true,
    estatus: true,
  });

  const estadoColumn = {
    field: "estado_visual",
    headerName: "Estado",
    width: 70,
    sortable: false,
    filterable: false,
    renderCell: (params) => {
      const { estatus, pedido_id, factura_detalle_id } = params.row;
      const estaLinkeado = !!pedido_id || !!factura_detalle_id;
      let icon = null;

      if (estaLinkeado) {
        icon = (
          <Tooltip title="Linkeado con éxito">
            <CheckCircleIcon sx={{ color: green[600] }} />
          </Tooltip>
        );
      } else if (estatus === "nuevo") {
        icon = (
          <Tooltip title="Producto nuevo (Mercadotecnica)">
            <NewReleasesIcon sx={{ color: orange[600] }} />
          </Tooltip>
        );
      } else if (estatus === "devolver") {
        icon = (
          <Tooltip title="Producto a devolver">
            <LocalShippingIcon sx={{ color: grey[600] }} />
          </Tooltip>
        );
      } else {
        icon = (
          <Tooltip title="No linkeado">
            <LinkOffIcon sx={{ color: grey[500] }} />
          </Tooltip>
        );
      }
      return (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
            height: "100%",
          }}
        >
          {icon}
        </Box>
      );
    },
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
      renderCell: (params) => {
        const { value, row } = params;

        return (
          <Tooltip title="Haz clic para ver los detalles del pedido" arrow>
            <Link
              to={`/pedidos`}
              state={{ pedidoIdDesdeFactura: value }}
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
      field: "pedido_linea_id",
      headerName: "# Pedido Línea",
      type: "text",
      flex: 0.6,
      align: "center",
      headerAlign: "center",
      headerClassName: "header-wrap",
      renderCell: ({ value, row }) => {
        if (!value) return <span style={{ opacity: 0.6 }}>N/A</span>;
        return (
          <Tooltip title="Haz clic para ver los detalles de este producto en el pedido" arrow>
            <Link
              to="/pedidos"
              state={{
                buscarLineaPedido: String(value), // <-- lo mandamos como texto
                // opcional: si también quieres llevar el pedido
                pedidoIdDesdeFactura: row.pedido_id,
              }}
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
      field: "actions",
      headerName: "Acciones",
      type: "actions",
      getActions: (params) => {
        const { pedido_id, pedido_linea_id, estatus } = params.row;

        // Ocultar icono si la fila es "nuevo"
        if (estatus === "nuevo" || estatus === "devolver") return [];

        if (!pedido_id || !pedido_linea_id) {
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
    estadoColumn,
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
    let advertencia = null;
    let result = null;
    let continuar = true;

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
        await axios.post(`${apiUrl}/facturas/enlazarManual`, {
          factura_detalle_id: lineaId,
          pedido_linea_ids,
          usuario_id,
        });
      } else if (cantidadFacturaFloat < totalPedido) {
        if (detalleData.length > selectionModel.length) {
          const advertenciaBack = await Swal.fire({
            title: "🔄 Backorder detectado",
            text: "Aún tienes líneas disponibles que podrías seleccionar. ¿Deseas elegir más antes de continuar?",
            icon: "info",
            showCancelButton: true,
            confirmButtonText: "Sí, seleccionar más",
            cancelButtonText: "No, continuar con backorder",
            allowOutsideClick: false,
          });

          if (advertenciaBack.isConfirmed) {
            continuar = false;
            return;
          }
        }

        const pedidosSeleccionados = seleccionadas.map((row) => row.pedido_id);
        const pedidosUnicos = [...new Set(pedidosSeleccionados)];

        result = await Swal.fire({
          title: "¿Deseas mantener el backorder?",
          html: `La cantidad será enlazada a los pedidos: <strong>${pedidosUnicos.join(
            ", "
          )}</strong>`,
          icon: "question",
          showCancelButton: true,
          showDenyButton: true,
          confirmButtonText: "Sí",
          denyButtonText: "No",
          cancelButtonText: "Cancelar",
          allowOutsideClick: false,
        });

        if (
          result.isDismissed &&
          result.dismiss === Swal.DismissReason.cancel
        ) {
          continuar = false;
          return;
        }

        const mantener_backorder = result.isConfirmed;

        await axios.post(`${apiUrl}/facturas/enlazarFacturaConBackOrder`, {
          factura_detalle_id: lineaId,
          pedido_linea_ids,
          usuario_id,
          mantener_backorder,
        });
      } else if (cantidadFacturaFloat > totalPedido) {
        advertencia = await Swal.fire({
          title: "⚠️ Excedente detectado",
          text: `Existen otras líneas que podrías enlazar. ¿Deseas seleccionar más líneas antes de continuar?`,
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "Sí, seleccionar más",
          cancelButtonText: "No, continuar con excedente",
          allowOutsideClick: false,
        });

        if (advertencia.isConfirmed) {
          continuar = false;
          return;
        }

        const pedidosSeleccionados = seleccionadas.map((row) => row.pedido_id);
        const pedidosUnicos = [...new Set(pedidosSeleccionados)];

        result = await Swal.fire({
          title: "¿Deseas mantener el excedente?",
          html: `El excedente será enlazado a los pedidos: <strong>${pedidosUnicos.join(
            ", "
          )}</strong>`,
          icon: "question",
          showCancelButton: true,
          showDenyButton: true,
          confirmButtonText: "Sí",
          denyButtonText: "No",
          cancelButtonText: "Cancelar",
          allowOutsideClick: false,
        });

        if (
          result.isDismissed &&
          result.dismiss === Swal.DismissReason.cancel
        ) {
          continuar = false;
          return;
        }

        const mantenerBackorder = result.isConfirmed;

        await axios.post(`${apiUrl}/facturas/enlaceFacturaConExcedente`, {
          factura_detalle_id: lineaId,
          lineasPedidoIds: pedido_linea_ids,
          usuario_id,
          mantenerBackorder,
        });
      } else {
        await Swal.fire({
          icon: "error",
          title: "Enlace inválido",
          text: "Verifica cantidades y selección.",
        });
        continuar = false;
        return;
      }

      await Swal.fire({
        icon: "success",
        title: "Enlace realizado correctamente",
      });
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Error al guardar",
        text: error.response?.data?.message || "Error desconocido",
      });
      continuar = false;
    } finally {
      if (continuar) {
        handleCloseModal();
        setOpenModal(false);
        fetchDetalleFactura(facturaId);
      }
    }
  };

  const handleEjecutarReemplazoSku = async () => {
    if (!skuSeleccionado || !selectedSku) return;
    try {
      await axios.post(`${apiUrl}/facturas/reemplazarSku`, {
        componente_id_viejo: skuSeleccionado.componente_id,
        nuevo_sku: selectedSku,
        usuario_id: user.id_usuario,
      });

      Swal.fire("¡Éxito!", "El SKU fue reemplazado correctamente", "success");
      setModoCambioSku(false);
      setOpenModalCambioSku(false);
      setSkuSeleccionado(null);
      setBusquedaSku("");
      fetchDetalleFactura(facturaId);
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "Error al reemplazar SKU",
        "error"
      );
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
        setOpenModal(false);

        setTimeout(() => {
          Swal.fire({
            icon: "info",
            title: "Producto no encontrado en pedidos",
            text: "Este SKU no coincide con ningún pedido. ¿Qué deseas hacer?",
            showDenyButton: true,
            showCancelButton: true,
            confirmButtonText: "Producto nuevo",
            denyButtonText: "Producto que cambió de SKU",
            cancelButtonText: "Producto a devolver",
            allowOutsideClick: false, // ❌ no se cierra por clic fuera
            allowEscapeKey: true, // ✅ se puede cerrar con ESC
            showCloseButton: true, // ✅ muestra la X arriba
          }).then(async (result) => {
            if (result.isConfirmed) {
              const confirm = await Swal.fire({
                title: "¿Estás seguro?",
                text: "Se marcará el producto como 'Nuevo'.",
                icon: "question",
                showCancelButton: true,
                confirmButtonText: "Aceptar",
                cancelButtonText: "Cancelar",
                allowOutsideClick: false, // ❌ no se cierra por clic fuera
              });

              if (confirm.isConfirmed) {
                await axios.put(`${apiUrl}/facturas/nuevoProducto`, {
                  factura_detalle_id: lineaId,
                });

                await Swal.fire(
                  "✅ Marcado",
                  "El producto fue marcado como 'Nuevo'.",
                  "success"
                );

                fetchDetalleFactura(facturaId);
              }
            } else if (result.isDenied) {
              setModoCambioSku(true);
              const response = await axios.get(
                `${apiUrl}/facturas/componentes/skulibres`
              );
              setSkusLibres(response.data.data);
              setOpenModalCambioSku(true);
            } else if (result.dismiss === Swal.DismissReason.cancel) {
              const confirm = await Swal.fire({
                title: "¿Estás seguro?",
                text: "Se marcará el producto como 'Devolver'.",
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: "Aceptar",
                cancelButtonText: "Cancelar",
                allowOutsideClick: false,
              });

              if (confirm.isConfirmed) {
                try {
                  const response = await axios.put(
                    `${apiUrl}/facturas/devolverProducto`,
                    {
                      factura_detalle_id: lineaId,
                    }
                  );

                  if (!response.data.error) {
                    await Swal.fire(
                      "🔄 Producto a devolver",
                      "El producto fue marcado como 'a devolver'.",
                      "info"
                    );
                    fetchDetalleFactura(facturaId);
                  } else {
                    throw new Error("Respuesta con error");
                  }
                } catch (err) {
                  await Swal.fire(
                    "❌ Error",
                    "No se pudo marcar el producto como 'a devolver'.",
                    "error"
                  );
                  console.error(err);
                }
              }
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

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        fontFamily: "Montserrat",
        fontWeight: "bold",
      }}
    >
      <style>
        {`
          .swal2-container {
            z-index: 1500 !important;
          }
        `}
      </style>
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
        <BreadcrumbsNav />
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
                {dataProveedor?.razon_social?.trim() || "N/A"}
              </Typography>
              <Typography variant="body1">
                <strong>RFC:</strong> {dataProveedor?.rfc?.trim() || "N/A"}
              </Typography>
              <Typography variant="body1">
                <strong>Correo:</strong>{" "}
                {dataProveedor?.correo?.trim() || "N/A"}
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
            height: 400,
            mt: 2,
            "& .row-disabled": {
              backgroundColor: "#f0f0f0",
              color: "#9e9e9e",
              pointerEvents: "none",
            },

            "& .row-disabled .MuiSvgIcon-root": {
              pointerEvents: "auto",
              cursor: "help",
            },
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
          isRowSelectable={(params) => params.row.estatus !== "nuevo"}
          getRowClassName={(params) =>
            params.row.estatus === "nuevo" || params.row.estatus === "devolver"
              ? "row-disabled"
              : ""
          }
        />
      </div>
      {/* Ventana Modal Details Componente*/}
      <Dialog
        id="modal-enlazar"
        open={openModal}
        onClose={() => {}} // evitamos que se cierre automáticamente
        fullWidth
        maxWidth={false}
        PaperProps={{
          sx: {
            width: { xs: "95vw", md: "70vw" },
            maxHeight: "90vh",
          },
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: "bold",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          Selecciona la línea a enlazar — SKU: {selectedSku}
          <IconButton onClick={handleCloseModal} aria-label="cerrar">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 3 }}>
          <DataGrid
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
            sx={{
              borderRadius: 2,
              border: 2,
              borderColor: "#1e88e5",
              height: "60vh",
            }}
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
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
        </DialogActions>
      </Dialog>

      <Dialog
        open={openModalCambioSku}
        fullWidth
        maxWidth={false}
        PaperProps={{
          sx: {
            width: { xs: "95vw", md: "70vw" },
            maxHeight: "90vh",
          },
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: "bold",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          Cambio de SKU — Producto recibido: {selectedSku}
          <IconButton
            onClick={() => {
              setOpenModalCambioSku(false);
              setSkuSeleccionado(null);
              setBusquedaSku("");
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent
          dividers
          sx={{
            p: 3,
            overflow: "auto",
          }}
        >
          <Typography sx={{ mb: 2 }}>
            Selecciona el SKU anterior desde los componentes registrados:
          </Typography>

          <TextField
            fullWidth
            label="Buscar SKU o descripción"
            value={busquedaSku}
            onChange={(e) => setBusquedaSku(e.target.value)}
            sx={{ mb: 2 }}
          />

          <DataGrid
            rows={skusLibres.filter(
              (row) =>
                row.sku.toLowerCase().includes(busquedaSku.toLowerCase()) ||
                row.descripcion
                  .toLowerCase()
                  .includes(busquedaSku.toLowerCase())
            )}
            columns={[
              {
                field: "selected",
                headerName: "",
                width: 50,
                sortable: false,
                filterable: false,
                renderCell: (params) =>
                  skuSeleccionado?.componente_id ===
                  params.row.componente_id ? (
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        width: "100%",
                        height: "100%",
                      }}
                    >
                      <CheckCircleIcon sx={{ color: "green" }} />
                    </Box>
                  ) : null,
              },
              { field: "sku", headerName: "SKU Antiguo", flex: 1 },
              { field: "descripcion", headerName: "Descripción", flex: 2 },
            ]}
            getRowId={(row) => row.componente_id}
            onRowClick={(params) => setSkuSeleccionado(params.row)}
            pageSize={10}
            rowsPerPageOptions={[10, 25, 50]}
            density="compact"
            showColumnVerticalBorder
            showCellVerticalBorder
            sx={{
              border: 2,
              borderColor: "#1976d2",
              borderRadius: 2,
              height: 300,
            }}
          />
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() => {
              setOpenModalCambioSku(false);
              setSkuSeleccionado(null);
              setBusquedaSku("");
            }}
            color="primary"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleEjecutarReemplazoSku}
            variant="contained"
            color="success"
            disabled={!skuSeleccionado}
          >
            Reemplazar SKU
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default DetalleFactura;
