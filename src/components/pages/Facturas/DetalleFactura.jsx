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

import FlashAutoIcon from "@mui/icons-material/FlashAuto";
import CloseIcon from "@mui/icons-material/Close";
import InsercionManual from "./InsercionManual";

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
import { green, orange, grey, yellow, blue } from "@mui/material/colors";
import Tooltip from "@mui/material/Tooltip";
import { Link } from "react-router-dom";
import BreadcrumbsNav from "./BreadcrumbsNav";
import dayjs from "dayjs";

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
  const [openEnvioModal, setOpenEnvioModal] = useState(false);
  const [envios, setEnvios] = useState([]);
  const [selectedEnvio, setSelectedEnvio] = useState(null);
  const [selectedLineasFacturas, setSelectedLineasFacturas] = useState([]);
  const [facturaHeader, setFacturaHeader] = useState(null);
  const [openProdDialog, setOpenProdDialog] = useState(false);
  const [skuDialog, setSkuDialog] = useState("");
  const [productosDialog, setProductosDialog] = useState([]);
  const [insertCtx, setInsertCtx] = useState(null);

  const [columnVisibilityModel, setColumnVisibilityModel] = useState({
    id: false,
    producto_id: false,
    linea_id: false,
    descripcion: true,
    estatus: true,
    permitir_full: false,
    envio_id: true,
  });

  const actionIconSx = {
    fontSize: 20,
  };

  const estadoColumn = {
    field: "estado_visual",
    headerName: "Estado",
    width: 70,
    sortable: false,
    filterable: false,
    renderCell: (params) => {
      const { estatus, pedido_id, factura_detalle_id, excedente, back_order } =
        params.row;

      const estaLinkeado = !!pedido_id || !!factura_detalle_id;

      // Normaliza por si vienen como string "0"/"1"
      const tieneExcedente = Number(excedente) === 1;
      const tieneBackOrder = Number(back_order) === 1;

      const esVerde = estaLinkeado && !tieneExcedente && !tieneBackOrder;

      let icon = null;

      if (estaLinkeado) {
        // Prioridad: backorder > excedente > normal
        let color = green[600];
        let title = "Linkeado con éxito";

        if (tieneBackOrder) {
          color = yellow[800];
          title = "Linkeado (línea que generó backorder)";
        } else if (tieneExcedente) {
          color = blue[600];
          title = "Linkeado con excedente";
        }

        icon = (
          <Tooltip title={title}>
            <CheckCircleIcon sx={{ color }} />
          </Tooltip>
        );
      } else if (estatus === "nuevo") {
        icon = (
          <Tooltip title="Producto nuevo (Mercadotecnia)">
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
        },
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

      if (
        Array.isArray(response.data.factura) &&
        response.data.factura.length
      ) {
        setFacturaHeader(response.data.factura[0]);
      }

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

  const handleActualizarXml = async (file) => {
    if (!file) return;

    const id = Number(facturaHeader?.id);
    if (!id) {
      Swal.fire(
        "Error",
        "No se pudo identificar la factura/remisión.",
        "error",
      );
      return;
    }

    const formData = new FormData();
    formData.append("archivo_xml", file);

    try {
      const resp = await axios.put(
        `${apiUrl}/facturas/${id}/actualizarDesdeXml`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );

      Swal.fire(
        "Éxito",
        resp.data?.message || "Factura actualizada.",
        "success",
      );

      // recarga
      fetchDetalleFactura(id);
    } catch (err) {
      Swal.fire(
        "Error",
        err.response?.data?.message || "Error al actualizar XML",
        "error",
      );
    }
  };

  const handleOpenModal = (params) => {
    setLineaId(params.row.id);
    setSelectedSku(params.row.sku);
    setCantidadFactura(params.row.cantidad);
    setOpenModal(true);
  };

  const handleHabilitarFull = (params) => {
    //setProductoId(params.row.producto_id);
    habilitarFullManual(params.row.producto_id);
  };

  const manejarProductoDevolver = async (lineaId) => {
    const confirm = await Swal.fire({
      title: "¿Estás seguro?",
      text: "Se marcará el producto como 'Devolver'.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Aceptar",
      cancelButtonText: "Cancelar",
      allowOutsideClick: false,
    });

    if (!confirm.isConfirmed) return;

    try {
      console.log("[DEVO] PUT devolverProducto", lineaId);

      const resp = await axios.put(`${apiUrl}/facturas/devolverProducto`, {
        factura_detalle_id: lineaId,
      });

      console.log("[DEVO] resp", resp.data);

      await Swal.fire(
        "Listo",
        "El producto fue marcado como 'a devolver'.",
        "info",
      );

      fetchDetalleFactura(facturaId);
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "No se pudo marcar el producto como 'a devolver'.";

      await Swal.fire("Error", msg, "error");
    }
  };

  const habilitarFullManual = async (productoId) => {
    try {
      await axios.put(`${apiUrl}/facturas/habilitarFull/${productoId}`);
      Swal.fire({
        title: "¡Éxito!",
        text: "Producto habilitado para FULL correctamente.",
        icon: "success",
        timer: 3000,
        showCloseButton: true,
        allowEscapeKey: true,
      });
      fetchDetalleFactura(facturaId);
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Error al habilitar el producto";
      Swal.fire({
        title: "Error",
        text: errorMessage,
        icon: "error",
        timer: 5000,
        showCloseButton: true,
        allowEscapeKey: true,
      });
    }
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
      field: "producto_id",
      headerName: "Producto ID",
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
          <Tooltip
            title="Haz clic para ver los detalles de este producto en el pedido"
            arrow
          >
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
      field: "envio_id",
      headerName: "#Envío",
      type: "number",
      flex: 0.5,
      align: "center",
      headerAlign: "center",
      renderCell: ({ value }) => (value ? `${value}` : <em>Sin asignar</em>),
    },
    {
      field: "logistic_type",
      headerName: "Logística",
      type: "text",
      flex: 0.6,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => {
        if (params.value !== "fulfillment" && params.row.permitir_full === 0) {
          return "ME";
        } else {
          return "FULL";
        }
      },
    },
    {
      field: "permitir_full",
      headerName: "Permitir FULL",
      type: "text",
      flex: 0.8,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "actions",
      headerName: "Acciones",
      type: "actions",
      getActions: (params) => {
        const {
          pedido_id,
          pedido_linea_id,
          estatus,
          logistic_type,
          permitir_full,
          excedente,
          back_order,
        } = params.row;

        // Ocultar icono si la fila es "nuevo" o "devolver"
        if (estatus === "nuevo" || estatus === "devolver") return [];

        const actions = [];
        const enlazada = Boolean(pedido_id && pedido_linea_id);

        const tieneExcedente = Number(excedente) === 1;
        const tieneBackOrder = Number(back_order) === 1;

        // "verde" = enlazada y sin excedente/backorder
        const puedeQuitarEnlace =
          enlazada && !tieneExcedente && !tieneBackOrder;

        // 1) Habilitar FULL (igual que antes)
        if (logistic_type !== "fulfillment" && permitir_full === 0) {
          actions.push(
            <Tooltip
              title="Habilitar FULL"
              key={`me-action-${params.row.producto_id}`}
            >
              <GridActionsCellItem
                icon={<FlashAutoIcon sx={{ color: "green" }} />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleHabilitarFull(params);
                }}
                showInMenu
              />
            </Tooltip>,
          );
        }

        // 2) Si está enlazada -> Quitar enlace
        if (enlazada) {
          if (puedeQuitarEnlace) {
            actions.push(
              <Tooltip title="Quitar enlace" key={`unlink-${params.row.id}`}>
                <GridActionsCellItem
                  icon={
                    <LinkOffIcon
                      fontSize="small"
                      sx={{ ...actionIconSx, color: "#d32f2f" }}
                    />
                  }
                  label="Quitar enlace"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQuitarEnlace(params);
                  }}
                  showInMenu={false}
                />
              </Tooltip>,
            );
          } else {
            actions.push(
              <Tooltip
                title="Esta opción aún no está disponible"
                key={`unlink-disabled-${params.row.id}`}
              >
                <span>
                  <GridActionsCellItem
                    icon={
                      <LinkOffIcon
                        fontSize="small"
                        sx={{ ...actionIconSx, color: "#9e9e9e" }}
                      />
                    }
                    label="Quitar enlace (bloqueado)"
                    disabled
                    showInMenu={false}
                  />
                </span>
              </Tooltip>,
            );
          }
        }

        // 3) Si NO está enlazada -> Enlazar manual
        if (!enlazada) {
          actions.push(
            <Tooltip title="Enlazar manual" key={`facturas-${params.row.id}`}>
              <GridActionsCellItem
                icon={<InsertLinkIcon />}
                sx={{ color: "blue" }}
                label="Enlazar manual"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenModal(params);
                }}
              />
            </Tooltip>,
          );
        }

        return actions;
      },
    },
    estadoColumn,
  ];

  const columnsDetalles = [
    {
      field: "pedido_id",
      headerName: "# Pedido",
      type: "number",
      flex: 1.5,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "proveedor_pedido_nombre",
      headerName: "Proveedor",
      flex: 2,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "fecha_pedido",
      headerName: "Fecha Pedido",
      flex: 2.0,
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

  const MarcarSkuComoNuevo = async (facturaDetalleId) => {
    try {
      console.log("[MarcarSkuComoNuevo] facturaDetalleId =", facturaDetalleId);

      const confirm = await Swal.fire({
        title: "SKU no existe en componentes",
        text: "¿Deseas marcarlo como 'Producto nuevo'?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sí, marcar como nuevo",
        cancelButtonText: "Cancelar",
        allowOutsideClick: false,
      });

      if (!confirm.isConfirmed) return;

      console.log("[MarcarSkuComoNuevo] llamando endpoint...");
      const resp = await axios.put(`${apiUrl}/facturas/nuevoProducto`, {
        factura_detalle_id: facturaDetalleId,
      });

      console.log("[MarcarSkuComoNuevo] resp =", resp.data);

      await Swal.fire(
        "Marcado",
        "El producto fue marcado como 'Nuevo'.",
        "success",
      );
      fetchDetalleFactura(facturaId);
    } catch (err) {
      console.error("[MarcarSkuComoNuevo] error =", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "No se pudo marcar como nuevo.";
      await Swal.fire("Error", msg, "error");
    }
  };

  const handleGuardarSeleccion = async () => {
    let advertencia = null;
    let result = null;
    let continuar = true;

    const seleccionadas = detalleData.filter((row) =>
      selectionModel.includes(row.id),
    );

    const pedido_linea_ids = seleccionadas.map((row) => row.id);
    const totalPedido = seleccionadas.reduce(
      (sum, item) => sum + parseFloat(item.cantidad),
      0,
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
            ", ",
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
            ", ",
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

  const handleQuitarEnlace = async (params) => {
    const { pedido_linea_id, id: facturaDetalleId, sku } = params.row;

    const confirm = await Swal.fire({
      title: "¿Quitar enlace?",
      html: `Se quitará el enlace del sku: <b>${sku}</b> con la linea de pedido <b>#${pedido_linea_id}</b>.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, quitar",
      cancelButtonText: "Cancelar",
      allowOutsideClick: false,
    });

    if (!confirm.isConfirmed) return;

    try {
      const resp = await axios.put(
        `${apiUrl}/facturas/detalle/${facturaDetalleId}/desenlazar`,
        {
          pedido_linea_id: Number(pedido_linea_id),
          factura_detalle_id: Number(facturaDetalleId),
          usuarioId: user?.id || null,
        },
      );

      if (resp.data?.ok) {
        await Swal.fire(
          "Listo",
          "Se quitó el enlace correctamente.",
          "success",
        );
        fetchDetalleFactura(facturaId);
        return;
      }

      await Swal.fire(
        "Error",
        resp.data?.message || "No se pudo quitar el enlace.",
        "error",
      );
    } catch (err) {
      console.error(err);
      await Swal.fire(
        "Error",
        err?.response?.data?.message || "No se pudo quitar el enlace.",
        "error",
      );
    }
  };

  const handleSelectProducto = async (productoId) => {
    try {
      const ctx = insertCtx;
      if (!ctx?.lineaId) return;

      const resp2 = await axios.post(
        `${apiUrl}/facturas/detalle/${ctx.lineaId}/insertarManual`,
        {
          ...(ctx.payloadBase || {}),
          productoId: Number(productoId),
        },
      );

      // si ahora pide seleccionar pedido:
      if (resp2.data?.code === "NEEDS_PEDIDO_SELECTION") {
        setOpenProdDialog(false);
        setInsertCtx(null);

        const pedidos = resp2.data.pedidos || [];
        if (!pedidos.length) {
          await Swal.fire(
            "Sin pedidos",
            "No hay pedidos disponibles para este proveedor.",
            "warning",
          );
          return;
        }

        const inputOptions = {};
        pedidos.forEach((p) => {
          const fecha = p.fecha_creacion
            ? new Date(p.fecha_creacion).toLocaleString()
            : "";
          inputOptions[p.id] = `Pedido #${p.id}${fecha ? ` - ${fecha}` : ""}`;
        });

        const { value: pedidoSel } = await Swal.fire({
          title: "Selecciona el pedido destino",
          input: "select",
          inputOptions,
          inputPlaceholder: "Selecciona un pedido",
          showCancelButton: true,
          confirmButtonText: "Insertar y enlazar",
          cancelButtonText: "Cancelar",
          allowOutsideClick: false,
          inputValidator: (v) => (!v ? "Selecciona un pedido" : undefined),
        });

        if (!pedidoSel) return;

        // reintento final (ya con productoId + pedidoId)
        const resp3 = await axios.post(
          `${apiUrl}/facturas/detalle/${ctx.lineaId}/insertarManual`,
          {
            ...(ctx.payloadBase || {}),
            productoId: Number(productoId),
            pedidoId: Number(pedidoSel),
          },
        );

        if (resp3.data?.ok) {
          await Swal.fire(
            "Listo",
            "Se insertó la línea y se enlazó al pedido.",
            "success",
          );
          fetchDetalleFactura(facturaId);
          return;
        }

        await Swal.fire(
          "Error",
          resp3.data?.message || "No se pudo insertar.",
          "error",
        );
        return;
      }

      if (resp2.data?.ok) {
        setOpenProdDialog(false);
        setInsertCtx(null);
        await Swal.fire(
          "Listo",
          "Se insertó la línea y se enlazó al pedido.",
          "success",
        );
        fetchDetalleFactura(facturaId);
        return;
      }

      if (resp2.data?.code === "SKU_NOT_IN_PRODUCT_BOM") {
        await Swal.fire(
          "No pertenece al producto",
          resp2.data?.message || "El SKU no está en el billete del producto.",
          "warning",
        );
        return;
      }

      await Swal.fire(
        "Error",
        resp2.data?.message || "No se pudo insertar.",
        "error",
      );
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Error al insertar manualmente.";
      await Swal.fire("Error", msg, "error");
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
        "error",
      );
    }
  };

  const fetchProductosEnlaces = async (lineaId) => {
    if (yaPreguntado) return;

    try {
      const response = await axios.get(
        `${apiUrl}/facturas/detalle/${lineaId}/posiblesEnlaces`,
      );

      const data = response.data;

      // ✅ Soporta 2 formatos:
      // 1) Viejo: data = [ {pedido_id, productos:[...]} ]
      // 2) Nuevo: data = { skuExisteEnComponentes, pedidos:[...] }
      const pedidos = Array.isArray(data) ? data : data?.pedidos || null;

      // OJO: NO uses !! porque "0" => true
      const raw = Array.isArray(data) ? null : data?.skuExisteEnComponentes;
      const skuExisteEnComponentes =
        raw === null || raw === undefined
          ? null
          : raw === true || raw === 1 || raw === "1"
            ? true
            : raw === false || raw === 0 || raw === "0"
              ? false
              : null;

      // Flatten productos
      let productosConIds = [];
      if (Array.isArray(pedidos)) {
        productosConIds = pedidos.flatMap((pedido) =>
          (pedido.productos || []).map((producto) => ({
            ...producto,
            id: producto.pedido_linea_id,
            pedido_id: pedido.pedido_id,
            proveedor_pedido_nombre: producto.proveedor_pedido_nombre,
            fecha_pedido: pedido.fecha_creacion,
          })),
        );
      }

      setDetalleData(productosConIds);

      // ✅ Si hay resultados -> abre modal normal (tu flujo actual)
      if (productosConIds.length > 0) return;

      // ✅ Si NO hay resultados -> cerramos modal
      setOpenModal(false);

      // pequeño delay para que no choque con el cierre del modal
      await new Promise((r) => setTimeout(r, 80));

      // ======================================================
      // 1) SI NO EXISTE EN COMPONENTES -> SOLO "PRODUCTO NUEVO"
      // ======================================================
      if (skuExisteEnComponentes === false) {
        const r = await Swal.fire({
          title: "SKU no existe en componentes",
          html: "Este SKU <b>no existe</b> en Aphelios.<br/>¿Deseas marcarlo como <b>Producto nuevo</b>?",
          icon: "warning",
          showConfirmButton: true,
          confirmButtonText: "🆕 Producto nuevo",
          showCancelButton: false,
          showCloseButton: true,
          allowOutsideClick: false,
          allowEscapeKey: true,
        });

        if (r.isConfirmed) {
          await MarcarSkuComoNuevo(lineaId);
          fetchDetalleFactura(facturaId);
        }
        return; // cerró con X/ESC o confirmó
      }

      // ======================================================
      // 2) SI EXISTE EN COMPONENTES -> 3 OPCIONES
      //    Confirm = Cambio SKU
      //    Deny = Devolver
      //    Cancel = Insertar manual
      // ======================================================

      // helper insertar manual (lo separo para que quede limpio)
      const ejecutarInsertarManual = async () => {
        try {
          const basePayload = { usuarioId: user?.id || null };

          const pedirPedido = async (pedidos) => {
            if (!Array.isArray(pedidos) || !pedidos.length) {
              await Swal.fire(
                "Sin pedidos",
                "No hay pedidos disponibles.",
                "warning",
              );
              return null;
            }

            const inputOptions = {};
            pedidos.forEach((p) => {
              const fecha = p.fecha_creacion
                ? new Date(p.fecha_creacion).toLocaleString()
                : "";
              inputOptions[p.id] =
                `Pedido #${p.id}${fecha ? ` - ${fecha}` : ""}`;
            });

            const { value } = await Swal.fire({
              title: "Selecciona el pedido destino",
              input: "select",
              inputOptions,
              inputPlaceholder: "Selecciona un pedido",
              showCancelButton: true,
              confirmButtonText: "Insertar y enlazar",
              cancelButtonText: "Cancelar",
              allowOutsideClick: false,
              inputValidator: (v) => (!v ? "Selecciona un pedido" : undefined),
            });

            return value ? Number(value) : null;
          };

          const ejecutarFlujo = async (payload) => {
            const resp = await axios.post(
              `${apiUrl}/facturas/detalle/${lineaId}/insertarManual`,
              payload,
            );

            // backend pide producto (tu dialog MUI)
            if (resp.data?.code === "NEEDS_PRODUCT_SELECTION") {
              setSkuDialog(resp.data?.sku || "");
              setProductosDialog(resp.data?.productos || []);
              setInsertCtx({
                lineaId,
                payloadBase: { usuarioId: user?.id || null },
              });
              setOpenProdDialog(true);
              return;
            }

            // backend pide pedido
            if (resp.data?.code === "NEEDS_PEDIDO_SELECTION") {
              const pedidoSel = await pedirPedido(resp.data?.pedidos || []);
              if (!pedidoSel) return;
              return await ejecutarFlujo({ ...payload, pedidoId: pedidoSel });
            }

            // ok
            if (resp.data?.ok) {
              await Swal.fire(
                "Listo",
                "Se insertó la línea y se enlazó.",
                "success",
              );
              fetchDetalleFactura(facturaId);
              return;
            }

            // errores conocidos
            if (resp.data?.code === "SKU_NOT_FOUND") {
              await Swal.fire(
                "SKU no existe en componentes",
                "Para insertar manualmente, el SKU debe existir. Usa 'Producto nuevo' o 'Cambio de SKU'.",
                "warning",
              );
              return;
            }

            if (resp.data?.code === "SKU_NOT_IN_PRODUCT_BOM") {
              await Swal.fire(
                "No pertenece al producto",
                resp.data?.message ||
                  "El SKU no pertenece al producto seleccionado (no está en su billete).",
                "warning",
              );
              return;
            }

            await Swal.fire(
              "Error",
              resp.data?.message || "No se pudo insertar.",
              "error",
            );
          };

          await ejecutarFlujo(basePayload);
        } catch (err) {
          console.error(err);
          const msg =
            err?.response?.data?.message ||
            err?.response?.data?.error ||
            "Error al insertar manualmente.";
          await Swal.fire("Error", msg, "error");
        }
      };

      const result = await Swal.fire({
        title: "Producto no encontrado en pedidos",
        text: "Este SKU existe en componentes, pero no coincide con ningún pedido. ¿Qué deseas hacer?",
        icon: "info",

        showConfirmButton: true,
        showDenyButton: true,
        showCancelButton: true,

        confirmButtonText: "🔁 Cambio de SKU",
        denyButtonText: "↩️ Producto a devolver",
        cancelButtonText: "➕ Insertar manual",

        showCloseButton: true,
        allowOutsideClick: false,
        allowEscapeKey: true,
      });

      // cerrar con X/ESC
      if (
        result.dismiss === Swal.DismissReason.close ||
        result.dismiss === Swal.DismissReason.esc
      )
        return;

      // Cancel => Insertar manual
      if (result.dismiss === Swal.DismissReason.cancel) {
        await ejecutarInsertarManual();
        return;
      }

      // Deny => Devolver
      if (result.isDenied) {
        await manejarProductoDevolver(lineaId);
        fetchDetalleFactura(facturaId);
        return;
      }

      // Confirm => Cambio SKU
      if (result.isConfirmed) {
        setModoCambioSku(true);
        const respSkus = await axios.get(
          `${apiUrl}/facturas/componentes/skulibres`,
        );
        setSkusLibres(respSkus.data.data);
        setOpenModalCambioSku(true);
        return;
      }
    } catch (error) {
      console.error(error);
      await Swal.fire({
        title: "Error",
        text: error.response?.data?.message || "Error al cargar los datos",
        icon: "warning",
        timer: 5000,
        showCloseButton: true,
        allowEscapeKey: true,
      });
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

  const handleCloseEnvioModal = () => {
    setOpenEnvioModal(false);
    setSelectedEnvio(null);
    setSelectedLineasFacturas([]);
  };

  const asignarLineasFacturas = async () => {
    try {
      await axios.post(`${apiUrl}/facturas/asignarLineasFacturasAEnvio`, {
        envio_id: selectedEnvio,
        linea_ids: selectedLineasFacturas,
      });

      Swal.fire("Éxito", "Productos asignados correctamente", "success");
      handleCloseEnvioModal();
      setSelectedLineasFacturas([]);
      fetchDetalleFactura(facturaId);
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "Error al asignar productos",
        "error",
      );
    }
  };

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
      <InsercionManual
        open={openProdDialog}
        sku={skuDialog}
        productos={productosDialog}
        onClose={() => {
          setOpenProdDialog(false);
          setInsertCtx(null);
        }}
        onConfirm={(productoId) => handleSelectProducto(productoId)}
      />
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
        {Number(facturaHeader?.es_provisional) == 1 && (
          <Box
            sx={{ display: "flex", gap: 2, mb: 2, justifyContent: "center" }}
          >
            <Button variant="contained" component="label">
              Subir XML y actualizar factura
              <input
                hidden
                type="file"
                accept=".xml"
                onChange={(e) => handleActualizarXml(e.target.files?.[0])}
              />
            </Button>
          </Box>
        )}
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
        <Button
          variant="contained"
          color="primary"
          sx={{
            mt: 2,
          }}
          disabled={selectedLineasFacturas.length === 0}
          onClick={() => {
            setOpenEnvioModal(true);
            fetchEnviosAbiertos();
          }}
        >
          Asignar productos a un envío ({selectedLineasFacturas.length})
        </Button>
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
            "& .fila-no-full": {
              backgroundColor: "#FDECEA", // rojo claro
              "&:hover": {
                backgroundColor: "#F9D6D5",
              },
            },
          }}
          rows={data}
          columns={columns}
          showCellVerticalBorder
          showColumnVerticalBorder
          checkboxSelection
          onRowSelectionModelChange={(ids) => {
            setSelectedLineasFacturas(ids);
          }}
          disableRowSelectionOnClick
          getRowId={(row) => row.id}
          columnVisibilityModel={columnVisibilityModel}
          onColumnVisibilityModelChange={(newModel) =>
            setColumnVisibilityModel(newModel)
          }
          experimentalFeatures={{ newEditingApi: true }}
          density="compact" // Establece el tamaño de las filas en compacto por defecto
          slots={{ toolbar: CustomToolbar }}
          isRowSelectable={(params) =>
            params.row.estatus !== "nuevo" &&
            params.row.estatus !== "devolver" &&
            params.row.envio_id === null &&
            (params.row.pedido_id !== null ||
              params.row.pedido_linea_id !== null)
          }
          getRowClassName={(params) => {
            if (
              params.row.estatus === "nuevo" ||
              params.row.estatus === "devolver"
            ) {
              return "row-disabled";
            }
            if (
              params.row.logistic_type !== "fulfillment" &&
              params.row.permitir_full === 0
            ) {
              return "fila-no-full";
            }
            return "";
          }}
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
                  .includes(busquedaSku.toLowerCase()),
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
      <Dialog
        open={openEnvioModal}
        onClose={handleCloseEnvioModal}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          Selecciona un envío para asignar los productos seleccionados
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
              asignarLineasFacturas();
            }}
          >
            Confirmar asignación
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default DetalleFactura;
