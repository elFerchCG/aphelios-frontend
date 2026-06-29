import {
  Box,
  Button,
  TextField,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  LinearProgress,
  Stack,
  MenuItem,
  Select,
  FormControl,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Typography,
} from "@mui/material";

import FlashAutoIcon from "@mui/icons-material/FlashAuto";
import CloseIcon from "@mui/icons-material/Close";
import InsercionManual from "./InsercionManual";
import BackordersPreviewModal from "./BackordersPreviewModal";
import ExcedentePreviewModal from "./ExcedentePreviewModal";

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
  const [loading, setLoading] = useState(true);
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
  const [filtroEstado, setFiltroEstado] = useState("all");
  const [openChainModal, setOpenChainModal] = useState(false);
  const [chainData, setChainData] = useState(null);
  const [pendingBackorderParams, setPendingBackorderParams] = useState(null); // guarda params.row cuando detectas cadena
  const [opDetalleSeleccionadoMap, setOpDetalleSeleccionadoMap] = useState({});
  const [openExcedenteModal, setOpenExcedenteModal] = useState(false);
  const [excedenteRows, setExcedenteRows] = useState([]);
  const [asignacionesExcedente, setAsignacionesExcedente] = useState({});
  const [openBackordersModal, setOpenBackordersModal] = useState(false);
  const [backordersPreview, setBackordersPreview] = useState(null);
  const [loadingBackordersPreview, setLoadingBackordersPreview] =
    useState(false);
  const [loadingResetBackorders, setLoadingResetBackorders] = useState(false);
  const [loadingSingleUnlink, setLoadingSingleUnlink] = useState(false);
  const [openExcedentePreviewModal, setOpenExcedentePreviewModal] =
    useState(false);
  const [excedentePreviewRows, setExcedentePreviewRows] = useState([]);
  const [loadingExcedentePreview, setLoadingExcedentePreview] = useState(false);
  const [
    facturaDetalleIdPreviewExcedente,
    setFacturaDetalleIdPreviewExcedente,
  ] = useState(null);
  const [openBackorderModal, setOpenBackorderModal] = useState(false);
  const [backorderRows, setBackorderRows] = useState([]);
  const [backorderDistribucion, setBackorderDistribucion] = useState({});

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

  const isEnlazada = (row) => {
    return row.pedido_linea_id != null && Number(row.pedido_linea_id) > 0;
  };

  const getEstadoEnlace = (row) => {
    const {
      factura_detalle_asignacion_id,
      tipo_asignacion,
      estatus_linea,
      excedente,
      back_order,
    } = row;

    if (!factura_detalle_asignacion_id) return "pendiente";

    const esExcedente =
      tipo_asignacion === "excedente" ||
      estatus_linea === "excedente" ||
      Number(excedente || 0) === 1;

    const esBackorder =
      tipo_asignacion === "backorder" ||
      estatus_linea === "backorder" ||
      Number(back_order || 0) === 1;

    if (esExcedente) return "excedente";
    if (esBackorder) return "backorder";

    return "ok";
  };

  const conteos = React.useMemo(() => {
    const c = { ok: 0, backorder: 0, excedente: 0, pendiente: 0, total: 0 };

    for (const r of data) {
      c.total++;
      const estado = getEstadoEnlace(r);
      if (c[estado] !== undefined) {
        c[estado]++;
      }
    }

    return c;
  }, [data]);

  const rowsFiltradas = React.useMemo(() => {
    if (filtroEstado === "all") return data;
    return data.filter((r) => getEstadoEnlace(r) === filtroEstado);
  }, [data, filtroEstado]);

  const progresoEnlace = React.useMemo(() => {
    const total = data.length;
    const enlazadas = data.reduce((acc, r) => acc + (isEnlazada(r) ? 1 : 0), 0);
    return { enlazadas, total };
  }, [data]);

  const estadoColumn = {
    field: "estado_visual",
    headerName: "Estado",
    width: 80,
    sortable: false,
    filterable: false,
    renderCell: (params) => {
      const {
        estatus,
        factura_detalle_asignacion_id,
        tipo_asignacion,
        cantidad,
        cantidad_asignada,
        estatus_linea,
        excedente,
        back_order,
      } = params.row;

      const estaLinkeado = Boolean(factura_detalle_asignacion_id);

      const esBackorder =
        tipo_asignacion === "backorder" ||
        estatus_linea === "backorder" ||
        Number(back_order || 0) === 1;

      const esExcedente =
        tipo_asignacion === "excedente" ||
        estatus_linea === "excedente" ||
        Number(excedente || 0) === 1;

      const esParcial =
        !esBackorder &&
        !esExcedente &&
        Number(cantidad_asignada || 0) > 0 &&
        Number(cantidad_asignada || 0) < Number(cantidad || 0);

      let icon = null;

      // 1. Linkeado
      if (estaLinkeado) {
        let color = green[600];
        let title = "Linkeado correctamente";

        // prioridad correcta
        if (esExcedente) {
          color = blue[600];
          title = "Excedente";
        } else if (esBackorder) {
          color = yellow[800];
          title = "Backorder";
        } else if (esParcial) {
          color = orange[600];
          title = "Parcial";
        }

        icon = (
          <Tooltip title={title}>
            <CheckCircleIcon sx={{ color }} />
          </Tooltip>
        );
      }

      // 2. Producto nuevo
      else if (estatus === "nuevo") {
        icon = (
          <Tooltip title="Producto nuevo (Mercadotecnia)">
            <NewReleasesIcon sx={{ color: orange[600] }} />
          </Tooltip>
        );
      }

      // 3. Devolver
      else if (estatus === "devolver") {
        icon = (
          <Tooltip title="Producto a devolver">
            <LocalShippingIcon sx={{ color: grey[600] }} />
          </Tooltip>
        );
      }

      // 4. No enlazado
      else {
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
      //console.log("Usuario:", user);
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
    setLoading(true);
    try {
      const response = await axios.get(`${apiUrl}/facturas/${facturaId}`);

      //console.log(response.data.factura);

      if (Array.isArray(response.data.factura)) {
        setFacturaHeader(response.data.factura[0] || null);
      } else if (response.data.factura) {
        setFacturaHeader(response.data.factura);
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
    } finally {
      setLoading(false);
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
      //console.log("[DEVO] PUT devolverProducto", lineaId);

      const resp = await axios.put(`${apiUrl}/facturas/devolverProducto`, {
        factura_detalle_id: lineaId,
      });

      //console.log("[DEVO] resp", resp.data);

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

  const validarDistribucionBackorder = (
    rows = [],
    asignacionesMap = {},
    cantidadFactura = 0,
  ) => {
    const cantidadFacturaNum = Number(cantidadFactura || 0);

    const valores = rows.map((row) => ({
      ...row,
      asignado: Number(asignacionesMap[row.rowKey] || 0),
      pendiente: Number(row.pendiente_opd || 0),
    }));

    const totalAsignado = valores.reduce((sum, row) => sum + row.asignado, 0);

    if (totalAsignado <= 0) {
      return {
        ok: false,
        message: "Debes capturar al menos una cantidad para continuar.",
      };
    }

    if (
      Number(totalAsignado.toFixed(2)) !== Number(cantidadFacturaNum.toFixed(2))
    ) {
      return {
        ok: false,
        message: `La suma de las asignaciones (${totalAsignado}) debe ser igual a la cantidad de la factura (${cantidadFacturaNum}).`,
      };
    }

    for (const row of valores) {
      if (row.asignado < 0) {
        return {
          ok: false,
          message: `La OPD ${row.op_detalle_id} tiene una cantidad inválida.`,
        };
      }

      if (row.asignado > row.pendiente) {
        return {
          ok: false,
          message: `La OPD ${row.op_detalle_id} excede su pendiente (${row.pendiente}).`,
        };
      }
    }

    return { ok: true };
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
    setSelectionModel([]);
    setOpDetalleSeleccionadoMap({});
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
                buscarLineaPedido: String(value),
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
          tipo_asignacion,
          factura_detalle_asignacion_id,
          logistic_type,
          permitir_full,
          estatus,
          estatus_linea,
          excedente,
        } = params.row;

        if (estatus === "nuevo" || estatus === "devolver") return [];

        const actions = [];
        const enlazada = Boolean(
          pedido_id && pedido_linea_id && factura_detalle_asignacion_id,
        );

        const esExcedente =
          tipo_asignacion === "excedente" ||
          estatus_linea === "excedente" ||
          Number(excedente || 0) === 1;

        const esBackorder = tipo_asignacion === "backorder";

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

        if (enlazada) {
          if (esExcedente) {
            actions.push(
              <Tooltip
                title="Ver excedentes enlazados"
                key={`preview-ex-${params.row.id}-${factura_detalle_asignacion_id}`}
              >
                <GridActionsCellItem
                  icon={
                    <LinkOffIcon
                      fontSize="small"
                      sx={{ ...actionIconSx, color: "#1565c0" }}
                    />
                  }
                  label="Ver excedentes enlazados"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAbrirPreviewExcedente(params);
                  }}
                  showInMenu={false}
                />
              </Tooltip>,
            );
          } else if (esBackorder) {
            actions.push(
              <Tooltip
                title="Desenlazar backorder"
                key={`unlink-bo-${params.row.id}`}
              >
                <GridActionsCellItem
                  icon={
                    <LinkOffIcon
                      fontSize="small"
                      sx={{ ...actionIconSx, color: "#f9a825" }}
                    />
                  }
                  label="Desenlazar backorder"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQuitarBackOrder(params);
                  }}
                  showInMenu={false}
                />
              </Tooltip>,
            );
          } else {
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
          }
        }

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
      flex: 0.8,
      minWidth: 90,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "proveedor_pedido_nombre",
      headerName: "Proveedor",
      flex: 1.8,
      minWidth: 240,
      renderCell: (params) => (
        <Tooltip title={params.value || ""}>
          <Box
            sx={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              width: "100%",
            }}
          >
            {params.value}
          </Box>
        </Tooltip>
      ),
    },
    {
      field: "fecha_pedido",
      headerName: "Fecha Pedido",
      flex: 1.2,
      minWidth: 170,
      renderCell: (params) => (
        <Box
          sx={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            width: "100%",
          }}
        >
          {params.value}
        </Box>
      ),
    },
    {
      field: "sku",
      headerName: "SKU",
      flex: 1.3,
      minWidth: 160,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "descripcion",
      headerName: "Descripción",
      flex: 2.3,
      minWidth: 320,
      renderCell: (params) => (
        <Tooltip title={params.value || ""}>
          <Box
            sx={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              width: "100%",
            }}
          >
            {params.value}
          </Box>
        </Tooltip>
      ),
    },
    {
      field: "cantidad",
      headerName: "Cantidad",
      flex: 0.7,
      minWidth: 100,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "ramas_info",
      headerName: "Órdenes relacionadas",
      flex: 0.9,
      minWidth: 180,
      sortable: false,
      filterable: false,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => {
        const ramas = params.row.ramas_produccion || [];
        const requiere = Number(params.row.requiere_seleccion_op || 0) === 1;

        if (!ramas.length) {
          return <Chip label="Sin OPD" size="small" color="default" />;
        }

        if (requiere) {
          return (
            <Chip
              label={`${ramas.length} ramas`}
              size="small"
              color="warning"
            />
          );
        }

        return (
          <Chip
            label={`Orden Produccion #${ramas[0]?.orden_id || "N/A"}`}
            size="small"
            color="success"
            variant="outlined"
          />
        );
      },
    },
    {
      field: "seleccion_opd",
      headerName: "Detalle a enlazar",
      flex: 1.8,
      minWidth: 260,
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        const ramas = params.row.ramas_produccion || [];
        const requiereSeleccion = ramas.length >= 2;

        const pedidoLineaId = Number(
          params.row.pedido_linea_id || params.row.id || 0,
        );

        const value = opDetalleSeleccionadoMap[pedidoLineaId] || "";

        if (!ramas.length) {
          return (
            <Typography variant="caption" color="text.secondary">
              Sin ramas disponibles
            </Typography>
          );
        }

        if (!requiereSeleccion) {
          const rama = ramas[0];

          return (
            <Box sx={{ fontSize: 12, lineHeight: 1.3, py: 0.5 }}>
              <div>
                <strong>Orden de producción:</strong> #{rama.orden_id}
              </div>
              <div>
                <strong>Detalle:</strong> #{rama.op_detalle_id}
              </div>
              <div>
                <strong>Cantidad pendiente:</strong> {rama.pendiente_opd}
              </div>
              <div>
                <strong>Estatus:</strong> {rama.op_estatus}
              </div>
            </Box>
          );
        }

        return (
          <Box
            sx={{ width: "100%", minWidth: 220 }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <FormControl fullWidth size="small">
              <Select
                value={value}
                displayEmpty
                onChange={(e) => {
                  e.stopPropagation();
                  const opDetalleId = Number(e.target.value || 0);

                  setOpDetalleSeleccionadoMap((prev) => ({
                    ...prev,
                    [pedidoLineaId]: opDetalleId,
                  }));
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      zIndex: 2000,
                      maxHeight: 260,
                    },
                  },
                }}
                renderValue={(selected) => {
                  if (!selected) return "Selecciona una rama";

                  const rama = ramas.find(
                    (r) => Number(r.op_detalle_id) === Number(selected),
                  );

                  if (!rama) return "Selecciona una rama";

                  return `Orden producción #${rama.orden_id} · Detalle #${rama.op_detalle_id}`;
                }}
                sx={{
                  backgroundColor: "#fff",
                  fontSize: 13,
                }}
              >
                <MenuItem value="">
                  <em>Selecciona una rama</em>
                </MenuItem>

                {ramas.map((rama) => {
                  const pendiente = Number(rama.pendiente_opd || 0);
                  const deshabilitada = pendiente <= 0;

                  return (
                    <MenuItem
                      key={rama.op_detalle_id}
                      value={rama.op_detalle_id}
                      disabled={deshabilitada}
                      sx={{
                        opacity: deshabilitada ? 0.5 : 1,
                        fontStyle: deshabilitada ? "italic" : "normal",
                      }}
                    >
                      {`Orden producción #${rama.orden_id} · Detalle #${rama.op_detalle_id} · Pendiente ${rama.pendiente_opd} piezas  · Estado: ${rama.op_estatus}`}
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
          </Box>
        );
      },
    },
  ];

  useEffect(() => {
    if (openModal) {
      fetchProductosEnlaces(lineaId);
    }
  }, [openModal]);

  const MarcarSkuComoNuevo = async (facturaDetalleId) => {
    try {
      //console.log("[MarcarSkuComoNuevo] facturaDetalleId =", facturaDetalleId);

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

      //console.log("[MarcarSkuComoNuevo] llamando endpoint...");
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

  const validarDistribucionExcedente = (
    rows = [],
    asignacionesMap = {},
    cantidadFactura = 0,
  ) => {
    const cantidadFacturaNum = Number(cantidadFactura || 0);

    const valores = rows.map((row) => ({
      ...row,
      asignado: Number(asignacionesMap[row.key] || 0),
      pendiente: Number(row.pendiente_opd || 0),
    }));

    const totalAsignado = valores.reduce((sum, row) => sum + row.asignado, 0);
    const totalPendiente = valores.reduce((sum, row) => sum + row.pendiente, 0);

    if (totalAsignado <= 0) {
      return {
        ok: false,
        message: "Debes capturar al menos una cantidad para continuar.",
      };
    }

    if (
      Number(totalAsignado.toFixed(2)) !== Number(cantidadFacturaNum.toFixed(2))
    ) {
      return {
        ok: false,
        message: `La suma de las asignaciones (${totalAsignado}) debe ser igual a la cantidad de la factura (${cantidadFacturaNum}).`,
      };
    }

    // Si es excedente, la factura debe ser al menos suficiente para cubrir todos los pendientes
    if (cantidadFacturaNum < totalPendiente) {
      return {
        ok: false,
        message: `La factura (${cantidadFacturaNum}) no alcanza para cubrir el mínimo requerido de todas las ramas (${totalPendiente}).`,
      };
    }

    // Cada rama debe recibir al menos su pendiente
    for (const row of valores) {
      if (row.asignado < 0) {
        return {
          ok: false,
          message: `La OPD ${row.op_detalle_id} tiene una cantidad inválida.`,
        };
      }

      if (row.asignado < row.pendiente) {
        return {
          ok: false,
          message: `Debes cubrir al menos ${row.pendiente} en la OPD ${row.op_detalle_id} antes de repartir el excedente.`,
        };
      }
    }

    return { ok: true };
  };

  const abrirModalExcedente = (seleccionadas = []) => {
    const rows = seleccionadas.flatMap((row) => {
      const ramas = Array.isArray(row?.ramas_produccion)
        ? row.ramas_produccion
        : [];

      return ramas
        .filter((rama) => Number(rama?.pendiente_opd || 0) > 0)
        .map((rama) => ({
          key: `${row.pedido_linea_id}-${rama.op_detalle_id}`,
          pedido_linea_id: Number(row.pedido_linea_id),
          descripcion: row.descripcion,
          orden_compra_detalle_id: Number(rama.orden_compra_detalle_id),
          orden_id: Number(rama.orden_id),
          op_detalle_id: Number(rama.op_detalle_id),
          cantidad_billete: Number(rama.cantidad_billete || 0),
          cantidad_surtida: Number(rama.cantidad_surtida || 0),
          pendiente_opd: Number(rama.pendiente_opd || 0),
          op_estatus: rama.op_estatus || "N/A",
        }));
    });

    setExcedenteRows(rows);
    setAsignacionesExcedente({});
    setOpenExcedenteModal(true);
  };

  const handleCantidadExcedenteChange = (key, value) => {
    const limpio = value === "" ? "" : Number(value);
    setAsignacionesExcedente((prev) => ({
      ...prev,
      [key]: limpio,
    }));
  };

  const totalAsignadoExcedente = React.useMemo(() => {
    return Object.values(asignacionesExcedente).reduce(
      (sum, val) => sum + Number(val || 0),
      0,
    );
  }, [asignacionesExcedente]);

  const diferenciaExcedente = React.useMemo(() => {
    return Number(
      (Number(cantidadFactura || 0) - totalAsignadoExcedente).toFixed(2),
    );
  }, [cantidadFactura, totalAsignadoExcedente]);

  const handleConfirmarExcedente = async () => {
    try {
      const cantidadFacturaFloat = Number(cantidadFactura || 0);

      const validacion = validarDistribucionExcedente(
        excedenteRows,
        asignacionesExcedente,
        cantidadFacturaFloat,
      );

      if (!validacion.ok) {
        await Swal.fire({
          icon: "warning",
          title: "Cantidad inválida",
          text: validacion.message,
        });
        return;
      }

      const asignaciones = excedenteRows
        .map((row) => ({
          pedido_linea_id: Number(row.pedido_linea_id),
          orden_compra_detalle_id: Number(row.orden_compra_detalle_id),
          op_detalle_id: Number(row.op_detalle_id),
          cantidad_final: Number(asignacionesExcedente[row.key] || 0),
        }))
        .filter((a) => Number(a.cantidad_final) > 0);

      await axios.post(`${apiUrl}/facturas/enlaceFacturaConExcedente`, {
        factura_detalle_id: lineaId,
        asignaciones,
      });

      await Swal.fire({
        icon: "success",
        title: "Excedente enlazado correctamente",
      });

      setOpenExcedenteModal(false);
      setExcedenteRows([]);
      setAsignacionesExcedente({});
      handleCloseModal();
      fetchDetalleFactura(facturaId);
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Error al enlazar excedente",
        text: error.response?.data?.message || "Error desconocido",
      });
    }
  };

  const obtenerCantidadEfectivaFila = (row) => {
    const requiere = Number(row.requiere_seleccion_op || 0) === 1;

    if (!requiere) {
      return Number(row.cantidad || 0);
    }

    const pedidoLineaId = Number(row.id);
    const opDetalleIdSeleccionada = Number(
      opDetalleSeleccionadoMap[pedidoLineaId] || 0,
    );

    if (!opDetalleIdSeleccionada) {
      return Number(row.cantidad || 0);
    }

    const ramas = Array.isArray(row.ramas_produccion)
      ? row.ramas_produccion
      : [];
    const ramaSeleccionada = ramas.find(
      (rama) => Number(rama.op_detalle_id) === opDetalleIdSeleccionada,
    );

    if (!ramaSeleccionada) {
      return Number(row.cantidad || 0);
    }

    return Number(ramaSeleccionada.cantidad_billete || 0);
  };

  const obtenerOpDetalleIdDeFila = (row) => {
    const requiere = Number(row.requiere_seleccion_op || 0) === 1;

    if (requiere) {
      return Number(opDetalleSeleccionadoMap[row.id]?.op_detalle_id || 0);
    }

    return Number(
      row.op_detalle_id ||
        row.opd_activa_id ||
        row.orden_produccion_detalle_id ||
        0,
    );
  };

  const obtenerOrdenCompraDetalleIdDeFila = (row) => {
    return Number(
      row.detalle_orden_compra_id ||
        row.orden_compra_detalle_id ||
        row.oc_detalle_id ||
        0,
    );
  };

  const construirAsignaciones = (seleccionadas) => {
    return seleccionadas.map((row) => ({
      pedido_linea_id: Number(row.id),
      orden_compra_detalle_id: obtenerOrdenCompraDetalleIdDeFila(row),
      op_detalle_id: obtenerOpDetalleIdDeFila(row),
      cantidad_final: obtenerCantidadEfectivaFila(row),
    }));
  };

  const getPedidoLineaId = (row) =>
    Number(row?.pedido_linea_id || row?.id || 0);

  const getCantidadFila = (row) =>
    Number(
      row?.cantidad ??
        row?.cantidad_pendiente ??
        row?.cantidad_restante ??
        row?.pendiente ??
        0,
    );

  const buildAsignacionDesdeFila = (
    row,
    opDetalleSeleccionadoMap = {},
    cantidadOverride = null,
  ) => {
    const pedidoLineaId = getPedidoLineaId(row);
    if (!pedidoLineaId) return null;

    const ramas = Array.isArray(row?.ramas_produccion)
      ? row.ramas_produccion
      : [];

    if (!ramas.length) return null;

    const cantidadBase =
      cantidadOverride != null
        ? Number(cantidadOverride)
        : Number(getCantidadFila(row));

    if (!cantidadBase || cantidadBase <= 0) return null;

    const requiereSeleccion = ramas.length >= 2;

    if (!requiereSeleccion) {
      const rama = ramas[0];

      if (!rama?.orden_compra_detalle_id || !rama?.op_detalle_id) {
        return null;
      }

      return {
        pedido_linea_id: pedidoLineaId,
        orden_compra_detalle_id: Number(rama.orden_compra_detalle_id),
        op_detalle_id: Number(rama.op_detalle_id),
        cantidad_final: Number(cantidadBase),
      };
    }

    const opDetalleSeleccionado = Number(
      opDetalleSeleccionadoMap[pedidoLineaId] || 0,
    );

    if (!opDetalleSeleccionado) return null;

    const ramaSeleccionada = ramas.find(
      (rama) => Number(rama.op_detalle_id) === opDetalleSeleccionado,
    );

    if (!ramaSeleccionada) return null;

    if (
      !ramaSeleccionada?.orden_compra_detalle_id ||
      !ramaSeleccionada?.op_detalle_id
    ) {
      return null;
    }

    return {
      pedido_linea_id: pedidoLineaId,
      orden_compra_detalle_id: Number(ramaSeleccionada.orden_compra_detalle_id),
      op_detalle_id: Number(ramaSeleccionada.op_detalle_id),
      cantidad_final: Number(cantidadBase),
    };
  };

  const getRamasActivas = (row) => {
    const ramas = Array.isArray(row?.ramas_produccion)
      ? row.ramas_produccion
      : [];

    return ramas.filter((rama) => {
      const pendienteOpd = Number(rama?.pendiente_opd || 0);
      const estatus = String(rama?.op_estatus || "").toLowerCase();

      return (
        pendienteOpd > 0 ||
        ["planeada", "parcial", "en_proceso"].includes(estatus)
      );
    });
  };

  const tieneMultiplesRamasActivas = (rows = []) => {
    return rows.some((row) => getRamasActivas(row).length >= 2);
  };

  const familiaYaEsBackorder = (rows = []) => {
    return rows.some((row) => {
      return (
        Number(row?.back_order || 0) === 1 ||
        Number(row?.cantidad_backorder || 0) > 0 ||
        String(row?.estatus_linea || "").toLowerCase() === "backorder"
      );
    });
  };

  const handleChangeBackorderDistribucion = (rowKey, value) => {
    const row = backorderRows.find((r) => r.rowKey === rowKey);
    const max = Number(row?.pendiente_opd || 0);

    let limpio = String(value ?? "");

    // solo números y un punto decimal
    limpio = limpio.replace(/[^0-9.]/g, "");

    // evitar más de un punto
    const parts = limpio.split(".");
    if (parts.length > 2) {
      limpio = parts[0] + "." + parts.slice(1).join("");
    }

    if (limpio === "") {
      setBackorderDistribucion((prev) => ({
        ...prev,
        [rowKey]: "",
      }));
      return;
    }

    let num = Number(limpio);

    if (Number.isNaN(num)) num = 0;
    if (num < 0) num = 0;
    if (num > max) num = max;

    setBackorderDistribucion((prev) => ({
      ...prev,
      [rowKey]: num,
    }));
  };

  const buildAsignacionesBackorderDistribuidas = () => {
    return backorderRows
      .map((row) => {
        const cantidadFinal = Number(backorderDistribucion[row.rowKey] || 0);

        if (cantidadFinal <= 0) return null;

        return {
          pedido_linea_id: Number(row.pedido_linea_id),
          orden_compra_detalle_id: Number(row.orden_compra_detalle_id),
          op_detalle_id: Number(row.op_detalle_id),
          cantidad_final: Number(cantidadFinal.toFixed(2)),
        };
      })
      .filter(Boolean);
  };

  const validarBackorderDistribuido = () => {
    const asignaciones = buildAsignacionesBackorderDistribuidas();

    const totalAsignado = asignaciones.reduce(
      (sum, item) => sum + Number(item.cantidad_final || 0),
      0,
    );

    const cantidadFacturaFloat = Number(cantidadFactura || 0);

    if (
      Number(totalAsignado.toFixed(2)) !==
      Number(cantidadFacturaFloat.toFixed(2))
    ) {
      return {
        ok: false,
        message: `La suma asignada (${totalAsignado}) debe ser igual a la cantidad de la factura (${cantidadFacturaFloat}).`,
      };
    }

    for (const asignacion of asignaciones) {
      const rama = backorderRows.find(
        (r) =>
          Number(r.pedido_linea_id) === Number(asignacion.pedido_linea_id) &&
          Number(r.op_detalle_id) === Number(asignacion.op_detalle_id),
      );

      if (!rama) {
        return {
          ok: false,
          message:
            "No se encontró una rama válida para una de las asignaciones.",
        };
      }

      if (Number(asignacion.cantidad_final) > Number(rama.pendiente_opd || 0)) {
        return {
          ok: false,
          message: `La cantidad para la OPD ${rama.op_detalle_id} excede su pendiente (${rama.pendiente_opd}).`,
        };
      }
    }

    return {
      ok: true,
      asignaciones,
    };
  };

  const totalAsignadoBackorder = Object.values(backorderDistribucion).reduce(
    (sum, v) => sum + Number(v || 0),
    0,
  );

  const diferenciaBackorder =
    Number(cantidadFactura || 0) - totalAsignadoBackorder;

  const handleGuardarBackorderDistribuido = async () => {
    try {
      const cantidadFacturaFloat = Number(cantidadFactura || 0);

      const validacion = validarDistribucionBackorder(
        backorderRows,
        backorderDistribucion,
        cantidadFacturaFloat,
      );

      if (!validacion.ok) {
        await Swal.fire({
          icon: "warning",
          title: "Cantidad inválida",
          text: validacion.message,
        });
        return;
      }

      const asignaciones = backorderRows
        .map((row) => ({
          pedido_linea_id: Number(row.pedido_linea_id),
          orden_compra_detalle_id: Number(row.orden_compra_detalle_id),
          op_detalle_id: Number(row.op_detalle_id),
          cantidad_final: Number(backorderDistribucion[row.rowKey] || 0),
        }))
        .filter((a) => Number(a.cantidad_final) > 0);

      await axios.post(`${apiUrl}/facturas/enlazarFacturaConBackOrder`, {
        factura_detalle_id: lineaId,
        asignaciones,
        mantener_backorder: true,
      });

      await Swal.fire({
        icon: "success",
        title: "Backorder enlazado correctamente",
      });

      setOpenBackorderModal(false);
      setBackorderRows([]);
      setBackorderDistribucion({});
      handleCloseModal();
      fetchDetalleFactura(facturaId);
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Error al enlazar backorder",
        text: error.response?.data?.message || "Error desconocido",
      });
    }
  };

  const abrirModalBackorder = (seleccionadas = []) => {
    const rows = seleccionadas.flatMap((row) => {
      const pedidoLineaId = Number(row?.pedido_linea_id || row?.id || 0);
      const ramasActivas = getRamasActivas(row);

      return ramasActivas.map((rama) => ({
        rowKey: `${pedidoLineaId}-${rama.op_detalle_id}`,
        pedido_linea_id: pedidoLineaId,
        pedido_id: row?.pedido_id ?? null,
        sku: row?.sku ?? "",
        descripcion: row?.descripcion ?? "",
        cantidad_factura_objetivo: Number(cantidadFactura || 0),

        orden_compra_detalle_id: Number(rama?.orden_compra_detalle_id || 0),
        op_detalle_id: Number(rama?.op_detalle_id || 0),
        orden_id: Number(rama?.orden_id || 0),

        pendiente_opd: Number(rama?.pendiente_opd || 0),
        op_estatus: rama?.op_estatus || "N/A",
      }));
    });

    setBackorderRows(rows);

    const initial = {};
    rows.forEach((r) => {
      initial[r.rowKey] = "";
    });

    setBackorderDistribucion(initial);
    setOpenBackorderModal(true);
  };

  const handleGuardarSeleccion = async () => {
    let continuar = true;

    const seleccionadas = detalleData.filter((row) =>
      selectionModel.includes(getPedidoLineaId(row)),
    );

    if (!seleccionadas.length) {
      await Swal.fire({
        icon: "warning",
        title: "Sin selección",
        text: "Selecciona al menos una línea.",
      });
      return;
    }

    const filasSinOpd = seleccionadas.filter((row) => {
      const ramas = row.ramas_produccion || [];
      const requiereSeleccion = ramas.length >= 2;

      if (!requiereSeleccion) return false;

      const pedidoLineaId = Number(row.pedido_linea_id || row.id || 0);
      const opDetalleId = Number(opDetalleSeleccionadoMap[pedidoLineaId] || 0);

      return !opDetalleId;
    });

    if (filasSinOpd.length > 0) {
      await Swal.fire({
        icon: "warning",
        title: "Falta seleccionar rama OPD",
        text: "Hay líneas con múltiples órdenes de producción activas y todavía no eliges la rama a usar.",
      });
      return;
    }

    const cantidadFacturaFloat = Number(parseFloat(cantidadFactura) || 0);

    const asignaciones = seleccionadas
      .map((row) => buildAsignacionDesdeFila(row, opDetalleSeleccionadoMap))
      .filter(Boolean);

    if (!asignaciones.length) {
      await Swal.fire({
        icon: "error",
        title: "Error al guardar",
        text: "No se pudieron construir las asignaciones.",
      });
      return;
    }

    if (asignaciones.length !== seleccionadas.length) {
      await Swal.fire({
        icon: "error",
        title: "Datos incompletos",
        text: "Una o más líneas seleccionadas no tienen OC detalle u OP detalle válidos.",
      });
      return;
    }

    const totalPedido = asignaciones.reduce(
      (sum, item) => sum + Number(item.cantidad_final || 0),
      0,
    );

    const multiplesRamasActivas = tieneMultiplesRamasActivas(seleccionadas);
    const esFamiliaBackorder = familiaYaEsBackorder(seleccionadas);

    try {
      // 1) MANUAL
      if (
        cantidadFacturaFloat === totalPedido &&
        !multiplesRamasActivas &&
        !esFamiliaBackorder
      ) {
        await axios.post(`${apiUrl}/facturas/enlazarManual`, {
          factura_detalle_id: lineaId,
          asignaciones,
        });
      }

      // 2) IGUAL AL PEDIDO PERO CON MÚLTIPLES RAMAS ACTIVAS
      else if (cantidadFacturaFloat === totalPedido && multiplesRamasActivas) {
        const advertencia = await Swal.fire({
          title: "⚠️ Reparto entre ramas requerido",
          text: "La factura coincide con el pedido, pero la línea tiene múltiples ramas activas. Debes repartir manualmente la cantidad entre las ramas.",
          icon: "info",
          showCancelButton: true,
          confirmButtonText: "Continuar",
          cancelButtonText: "Cancelar",
          allowOutsideClick: false,
        });

        if (!advertencia.isConfirmed) {
          continuar = false;
          return;
        }

        abrirModalExcedente(seleccionadas);
        continuar = false;
        return;
      }

      // 3) EXCEDENTE REAL
      else if (cantidadFacturaFloat > totalPedido) {
        const advertencia = await Swal.fire({
          title: "⚠️ Excedente detectado",
          text: "La factura trae más cantidad que la suma de las líneas seleccionadas. Debes repartir manualmente el excedente entre las ramas OPD.",
          icon: "info",
          showCancelButton: true,
          confirmButtonText: "Continuar",
          cancelButtonText: "Cancelar",
          allowOutsideClick: false,
        });

        if (!advertencia.isConfirmed) {
          continuar = false;
          return;
        }

        abrirModalExcedente(seleccionadas);
        continuar = false;
        return;
      }

      // 4) BACKORDER DISTRIBUIDO
      else if (cantidadFacturaFloat < totalPedido && multiplesRamasActivas) {
        const advertencia = await Swal.fire({
          title: "🔄 Reparto de backorder requerido",
          text: "La factura no cubre todo el pedido y la línea tiene múltiples ramas activas. Debes repartir manualmente la cantidad entre las ramas.",
          icon: "info",
          showCancelButton: true,
          confirmButtonText: "Continuar",
          cancelButtonText: "Cancelar",
          allowOutsideClick: false,
        });

        if (!advertencia.isConfirmed) {
          continuar = false;
          return;
        }

        abrirModalBackorder(seleccionadas);
        continuar = false;
        return;
      }

      // 5) BACKORDER SIMPLE
      else if (cantidadFacturaFloat < totalPedido || esFamiliaBackorder) {
        if (
          detalleData.length > selectionModel.length &&
          cantidadFacturaFloat < totalPedido
        ) {
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

        const asignacionesBackorder = seleccionadas
          .map((row) =>
            buildAsignacionDesdeFila(
              row,
              opDetalleSeleccionadoMap,
              cantidadFacturaFloat,
            ),
          )
          .filter(Boolean);

        if (!asignacionesBackorder.length) {
          await Swal.fire({
            icon: "error",
            title: "Error al guardar",
            text: "No se pudieron construir las asignaciones de backorder.",
          });
          continuar = false;
          return;
        }

        const evaluacionBackorder = await axios.post(
          `${apiUrl}/facturas/evaluarBackorder`,
          {
            factura_detalle_id: lineaId,
            asignaciones: asignacionesBackorder,
          },
        );

        let mantener_backorder = evaluacionBackorder.data?.mantener_backorder;

        if (
          evaluacionBackorder.data?.accionSugerida === "cerrar_automatico" &&
          evaluacionBackorder.data?.mantener_backorder === false
        ) {
          const detalleBackorder =
            evaluacionBackorder.data?.detalles?.[0] || {};

          await Swal.fire({
            icon: "info",
            title: "Backorder no permitido",
            html: `
      <div style="text-align:left;">
        <p>
          El proveedor <strong>${detalleBackorder.proveedor || ""}</strong>
          no acepta backorders.
        </p>

        <p>
          La línea será cerrada automáticamente con la cantidad recibida.
        </p>

        <hr />

        <p><strong>SKU:</strong> ${detalleBackorder.sku || ""}</p>

        <p>
          No se mantendrá saldo pendiente para futuras facturas.
        </p>
      </div>
    `,
          });
        }

        if (evaluacionBackorder.data?.requiereConfirmacion) {
          const pedidosSeleccionados = seleccionadas.map(
            (row) => row.pedido_id,
          );
          const pedidosUnicos = [...new Set(pedidosSeleccionados)];

          const detalleBackorder =
            evaluacionBackorder.data?.detalles?.[0] || {};
          const esUltimaLineaPendiente =
            evaluacionBackorder.data?.esUltimaLineaPendiente;

          const hayOtrasFacturas =
            evaluacionBackorder.data?.hayOtrasLineasFacturaPendientes;

          const hayOtrasLineasPedido =
            evaluacionBackorder.data?.hayOtrasLineasPedidoPendientes;

          const proveedorNoAceptaBackorder =
            evaluacionBackorder.data?.accionSugerida ===
            "preguntar_proveedor_sin_backorder_con_pendientes";

          const result = await Swal.fire({
            title: proveedorNoAceptaBackorder
              ? "Proveedor sin backorder, pero hay más facturas"
              : esUltimaLineaPendiente
                ? "Última línea pendiente del producto"
                : "Backorder detectado",
            html: proveedorNoAceptaBackorder
              ? `
    <div style="text-align:left;">
      <p>
        El proveedor <strong>${detalleBackorder?.proveedor || ""}</strong>
        <strong>no acepta backorders</strong>.
      </p>

      <p>
        Este SKU todavía aparece en otras facturas pendientes/parciales,
        por lo que puedes mantenerlo abierto temporalmente.
      </p>

      <p>
        Cuando ya no queden más líneas pendientes para este SKU,
        el sistema deberá cerrar la línea con la cantidad recibida.
      </p>

      <hr />

      <p><strong>SKU:</strong> ${detalleBackorder?.sku || ""}</p>
      <p><strong>Pedido(s):</strong> ${pedidosUnicos.join(", ")}</p>

      <hr />

      <p>
        ¿Deseas mantenerlo temporalmente como backorder?
      </p>
    </div>
  `
              : esUltimaLineaPendiente
                ? `
      <div style="text-align:left;">

        <hr />

        <p><strong>SKU:</strong> ${detalleBackorder?.sku || ""}</p>
        <p><strong>Pedido(s):</strong> ${pedidosUnicos.join(", ")}</p>

        <hr />

        <p>
          ¿Deseas mantener el pedido abierto o prefieres cerrar la línea
          con la cantidad recibida?
        </p>
      </div>
    `
                : `
      <div style="text-align:left;">
        <p>
          El proveedor <strong>${detalleBackorder?.proveedor || ""}</strong>
          acepta backorder.
        </p>

        <p>
          Todavía existen registros relacionados para este SKU:
        </p>

        <ul>
          <li>Otras facturas pendientes/parciales: <strong>${
            hayOtrasFacturas ? "Sí" : "No"
          }</strong></li>
        </ul>

        <hr />

        <p><strong>SKU:</strong> ${detalleBackorder?.sku || ""}</p>
        <p><strong>Pedido(s):</strong> ${pedidosUnicos.join(", ")}</p>

        <hr />

        <p>
          ¿Deseas mantener el pedido abierto?
        </p>
      </div>
      `,
            icon: "question",
            showCancelButton: true,
            showDenyButton: true,
            confirmButtonText: "Mantener Pedido",
            denyButtonText: "Cerrar Pedido",
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

          mantener_backorder = result.isConfirmed;
        }

        await axios.post(`${apiUrl}/facturas/enlazarFacturaConBackOrder`, {
          factura_detalle_id: lineaId,
          asignaciones: asignacionesBackorder,
          mantener_backorder,
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
      const apiError = error.response?.data;
      const code = apiError?.code;

      let msg = apiError?.message || "Error desconocido";

      if (code === "MULTIPLES_OPD_ACTIVAS") {
        msg =
          "La línea seleccionada tiene múltiples órdenes de producción activas. Debes elegir una rama OPD.";
      } else if (code === "OPD_SELECCION_INVALIDA") {
        msg =
          "La OPD seleccionada ya no es válida para una de las líneas. Recarga e intenta de nuevo.";
      }

      await Swal.fire({
        icon: "error",
        title: "Error al guardar",
        text: msg,
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

  const parseJsonSafe = (value, fallback = []) => {
    if (Array.isArray(value)) return value;
    if (!value) return fallback;

    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : fallback;
    } catch {
      return fallback;
    }
  };

  const normalizarRamasProduccion = (producto) => {
    const ramasRaw = parseJsonSafe(producto.produccion_relacionada, []);

    const ramas = ramasRaw
      .map((rama) => ({
        op_detalle_id: Number(rama.op_detalle_id || 0),
        orden_id: Number(rama.orden_id || 0),
        cantidad_billete: Number(rama.cantidad_billete || 0),
        cantidad_surtida: Number(rama.cantidad_surtida || 0),
        pendiente_opd: Number(rama.pendiente_opd || 0),
        op_estatus: rama.op_estatus || "N/A",
      }))
      .filter((rama) => rama.op_detalle_id > 0);

    return ramas;
  };

  const extraerRamasProduccion = (producto) => {
    const ordenesCompra = Array.isArray(producto?.ordenes_compra_relacionadas)
      ? producto.ordenes_compra_relacionadas
      : [];

    const ramas = ordenesCompra.flatMap((oc) => {
      const produccion = Array.isArray(oc?.produccion_relacionada)
        ? oc.produccion_relacionada
        : [];

      return produccion.map((op) => ({
        orden_compra_detalle_id: Number(oc?.orden_compra_detalle_id || 0),
        op_detalle_id: Number(op?.op_detalle_id || 0),
        orden_id: Number(op?.orden_id || 0),
        orden_compra_id: Number(op?.orden_compra_id || 0),
        cantidad_billete: Number(op?.cantidad_billete || 0),
        cantidad_surtida: Number(op?.cantidad_surtida || 0),
        pendiente_opd: Number(op?.pendiente_opd || 0),
        op_estatus: op?.op_estatus || "N/A",
      }));
    });

    // evitar duplicados por op_detalle_id
    const seen = new Set();
    return ramas.filter((rama) => {
      if (!rama.op_detalle_id) return false;
      if (seen.has(rama.op_detalle_id)) return false;
      seen.add(rama.op_detalle_id);
      return true;
    });
  };

  const obtenerRequiereSeleccionOp = (producto) => {
    if (Number(producto?.requiere_seleccion_op || 0) === 1) return 1;

    const ocs = Array.isArray(producto?.ordenes_compra_relacionadas)
      ? producto.ordenes_compra_relacionadas
      : [];

    return ocs.some((oc) => Number(oc?.requiere_seleccion_op || 0) === 1)
      ? 1
      : 0;
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

      let productosConIds = [];
      const opMapInicial = {};

      if (Array.isArray(pedidos)) {
        productosConIds = pedidos.flatMap((pedido) =>
          (pedido.productos || []).map((producto) => {
            const pedidoLineaId = Number(producto.pedido_linea_id || 0);
            const ramasProduccion = extraerRamasProduccion(producto);
            const requiereSeleccion = obtenerRequiereSeleccionOp(producto);

            // compatibilidad:
            // si solo hay una rama, la preseleccionamos sola
            if (ramasProduccion.length === 1) {
              opMapInicial[pedidoLineaId] = Number(
                ramasProduccion[0].op_detalle_id,
              );
            }

            return {
              ...producto,
              id: pedidoLineaId,
              pedido_linea_id: pedidoLineaId,
              pedido_id: Number(producto.pedido_id || pedido.pedido_id || 0),
              proveedor_pedido_nombre:
                producto.proveedor_pedido_nombre ||
                pedido.proveedor_pedido_nombre,
              fecha_pedido: producto.fecha_pedido || pedido.fecha_creacion,

              requiere_seleccion_op: requiereSeleccion,
              ramas_produccion: ramasProduccion,
            };
          }),
        );
      }

      setDetalleData(productosConIds);
      setOpDetalleSeleccionadoMap(opMapInicial);

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

  const handleQuitarEnlaceExcedente = async (params) => {
    const facturaDetalleAsignacionId = Number(
      params.row.factura_detalle_asignacion_id,
    );

    try {
      if (!facturaDetalleAsignacionId) {
        await Swal.fire(
          "Error",
          "La fila no tiene factura_detalle_asignacion_id.",
          "error",
        );
        return;
      }

      const confirm = await Swal.fire({
        title: "¿Desenlazar excedente?",
        text: "Esto revertirá solo esta asignación de excedente.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sí, desenlazar",
        cancelButtonText: "Cancelar",
      });

      if (!confirm.isConfirmed) return;

      await axios.put(
        `${apiUrl}/facturas/detalleAsignacion/${facturaDetalleAsignacionId}/desenlazarExcedente`,
      );

      await Swal.fire("Listo", "Excedente desenlazado.", "success");

      await fetchDetalleFactura(facturaId);
    } catch (err) {
      console.error(err);
      await Swal.fire(
        "Error",
        err?.response?.data?.message || "No se pudo desenlazar excedente.",
        "error",
      );
    }
  };

  const obtenerPreviewBackorders = async ({ pedidoLineaId }) => {
    const { data } = await axios.get(
      `${apiUrl}/facturas/backorders/preview/${pedidoLineaId}`,
    );
    return data;
  };

  const ejecutarDesenlaceBackorder = async ({ facturaDetalleAsignacionId }) => {
    const { data } = await axios.put(
      `${apiUrl}/facturas/detalle/${facturaDetalleAsignacionId}/desenlazarBackOrder`,
    );

    return data;
  };

  const ejecutarResetBackorderMasivo = async ({ parentPedidoLineaId }) => {
    const payload = {
      pedido_linea_id: parentPedidoLineaId,
      dry_run: false,
      force: true,
    };

    const { data } = await axios.post(
      `${apiUrl}/facturas/detalle/desenlazarBackOrderMasivo`,
      payload,
    );

    return data;
  };

  const handleQuitarBackOrder = async (params) => {
    try {
      const pedidoLineaId = Number(params?.row?.pedido_linea_id || 0);
      const facturaDetalleAsignacionId = Number(
        params?.row?.factura_detalle_asignacion_id || 0,
      );

      if (!pedidoLineaId) {
        await Swal.fire(
          "Atención",
          "No se encontró pedido_linea_id válido.",
          "warning",
        );
        return;
      }

      setLoadingBackordersPreview(true);

      const data = await obtenerPreviewBackorders({
        pedidoLineaId,
      });

      const asignaciones = data?.asignaciones || [];

      // si no hay varias, permitir desenlace directo
      if (asignaciones.length <= 1) {
        if (!facturaDetalleAsignacionId) {
          await Swal.fire(
            "Atención",
            "No se encontró la asignación de backorder.",
            "warning",
          );
          return;
        }

        const confirm = await Swal.fire({
          title: "¿Desenlazar backorder?",
          text: "Se revertirá solo esta asignación.",
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "Sí, desenlazar",
          cancelButtonText: "Cancelar",
        });

        if (!confirm.isConfirmed) return;

        setLoadingSingleUnlink(true);

        await ejecutarDesenlaceBackorder({
          facturaDetalleAsignacionId,
        });

        await Swal.fire(
          "Listo",
          "Backorder desenlazado correctamente.",
          "success",
        );

        await fetchDetalleFactura(facturaId);
        return;
      }

      // si hay varias, abrir modal
      setBackordersPreview(data);
      setOpenBackordersModal(true);
    } catch (error) {
      console.error("Error al consultar backorders:", error);

      await Swal.fire(
        "No se pudo",
        error?.response?.data?.message || "Error al consultar backorders.",
        "error",
      );
    } finally {
      setLoadingBackordersPreview(false);
      setLoadingSingleUnlink(false);
    }
  };

  const handleSingleUnlink = async () => {
    if (!pendingBackorderParams) return;

    const facturaDetalleId = pendingBackorderParams.row.id;
    const pedidoLineaId = pendingBackorderParams.row.pedido_linea_id;

    try {
      const data = await ejecutarDesenlaceBackorder({
        facturaDetalleId,
        modo: "single",
        pedidoLineaId,
      });

      if (data?.ok) {
        setOpenChainModal(false);
        setChainData(null);
        setPendingBackorderParams(null);

        await Swal.fire("Listo", "Se desenlazó solo esta línea.", "success");
        await fetchDetalleFactura(facturaId);
        return;
      }

      await Swal.fire(
        "Atención",
        data?.message || "No se pudo desenlazar.",
        "warning",
      );
    } catch (err) {
      await Swal.fire(
        "No se pudo",
        err?.response?.data?.message || "Error al desenlazar.",
        "error",
      );
    }
  };

  const handleUnlinkSingleBackorder = async (asignacion) => {
    try {
      const facturaDetalleAsignacionId = Number(
        asignacion?.factura_detalle_asignacion_id || 0,
      );

      if (!facturaDetalleAsignacionId) {
        await Swal.fire(
          "Atención",
          "No se encontró la asignación a desenlazar.",
          "warning",
        );
        return;
      }

      const confirm = await Swal.fire({
        title: "¿Desenlazar esta asignación?",
        text: "Se revertirá solo esta asignación de backorder.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sí, desenlazar",
        cancelButtonText: "Cancelar",
      });

      if (!confirm.isConfirmed) return;

      setLoadingSingleUnlink(true);

      await ejecutarDesenlaceBackorder({
        facturaDetalleAsignacionId,
      });

      const pedidoLineaId = Number(
        backordersPreview?.linea_base?.id || asignacion?.pedido_linea_id || 0,
      );

      const previewActualizado = await obtenerPreviewBackorders({
        pedidoLineaId,
      });

      setBackordersPreview(previewActualizado);

      await fetchDetalleFactura(facturaId);

      await Swal.fire(
        "Listo",
        "Asignación desenlazada correctamente.",
        "success",
      );

      if ((previewActualizado?.asignaciones || []).length === 0) {
        setOpenBackordersModal(false);
        setBackordersPreview(null);
      }
    } catch (error) {
      console.error("Error al desenlazar asignación:", error);

      await Swal.fire(
        "No se pudo",
        error?.response?.data?.message || "Error al desenlazar asignación.",
        "error",
      );
    } finally {
      setLoadingSingleUnlink(false);
    }
  };

  const handleResetToParent = async () => {
    if (!pendingBackorderParams || !chainData) return;

    const parentPedidoLineaId = Number(chainData.parent_id || 0);
    if (!parentPedidoLineaId) {
      await Swal.fire(
        "Atención",
        "No se encontró la línea base para el reset.",
        "warning",
      );
      return;
    }

    const confirm = await Swal.fire({
      title: "¿Reset masivo de backorder?",
      text: "Esto revertirá todas las asignaciones backorder de esta familia, incluso si están en otras facturas.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, reset",
      cancelButtonText: "Cancelar",
    });

    if (!confirm.isConfirmed) return;

    try {
      const data = await ejecutarResetBackorderMasivo({
        parentPedidoLineaId,
      });

      if (data?.ok) {
        setOpenChainModal(false);
        setChainData(null);
        setPendingBackorderParams(null);

        await Swal.fire("Listo", "Reset aplicado correctamente.", "success");
        await fetchDetalleFactura(facturaId);
        return;
      }

      await Swal.fire(
        "Atención",
        data?.message || "No se pudo aplicar el reset.",
        "warning",
      );
    } catch (err) {
      await Swal.fire(
        "No se pudo",
        err?.response?.data?.message || "Error al aplicar reset.",
        "error",
      );
    }
  };

  const handleResetBackordersFamilia = async () => {
    try {
      const parentPedidoLineaId = Number(backordersPreview?.parent_id || 0);

      if (!parentPedidoLineaId) {
        await Swal.fire(
          "Atención",
          "No se encontró la línea base para el reset.",
          "warning",
        );
        return;
      }

      const hayBloqueadas =
        (backordersPreview?.ops_bloqueadas || []).length > 0;

      if (hayBloqueadas) {
        await Swal.fire(
          "Bloqueado",
          "Hay órdenes de producción en surtida o empacada. No se puede hacer reset.",
          "error",
        );
        return;
      }

      const confirm = await Swal.fire({
        title: "¿Reset masivo de backorder?",
        text: "Esto revertirá todas las asignaciones backorder de esta familia.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sí, reset",
        cancelButtonText: "Cancelar",
      });

      if (!confirm.isConfirmed) return;

      setLoadingResetBackorders(true);

      const data = await ejecutarResetBackorderMasivo({
        parentPedidoLineaId,
      });

      if (data?.ok) {
        setOpenBackordersModal(false);
        setBackordersPreview(null);

        await Swal.fire(
          "Listo",
          "Reset masivo aplicado correctamente.",
          "success",
        );

        await fetchDetalleFactura(facturaId);
        return;
      }

      await Swal.fire(
        "Atención",
        data?.message || "No se pudo aplicar el reset.",
        "warning",
      );
    } catch (error) {
      console.error("Error en reset masivo:", error);

      await Swal.fire(
        "No se pudo",
        error?.response?.data?.message || "Error al aplicar reset.",
        "error",
      );
    } finally {
      setLoadingResetBackorders(false);
    }
  };

  const getExcedentesPreview = async (facturaDetalleId) => {
    const { data } = await axios.get(
      `${apiUrl}/facturas/detalle/${facturaDetalleId}/excedentes/preview`,
    );

    return data;
  };

  const desenlazarExcedenteIndividual = async ({
    facturaDetalleAsignacionId,
  }) => {
    const { data } = await axios.put(
      `${apiUrl}/facturas/detalleAsignacion/${facturaDetalleAsignacionId}/desenlazarExcedente`,
    );

    return data;
  };

  const desenlazarExcedenteMasivo = async ({ facturaDetalleId }) => {
    const { data } = await axios.put(
      `${apiUrl}/facturas/detalle/${facturaDetalleId}/desenlazarExcedenteMasivo`,
    );

    return data;
  };

  const handleAbrirPreviewExcedente = async (params) => {
    const facturaDetalleId = Number(params.row.id);

    if (!facturaDetalleId) {
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se encontró el facturaDetalleId.",
      });
      return;
    }

    try {
      setLoadingExcedentePreview(true);

      const data = await getExcedentesPreview(facturaDetalleId);

      setFacturaDetalleIdPreviewExcedente(facturaDetalleId);
      setExcedentePreviewRows(data?.rows || []);
      setOpenExcedentePreviewModal(true);
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Error",
        text:
          error?.response?.data?.message ||
          "No se pudo obtener el preview de excedentes.",
      });
    } finally {
      setLoadingExcedentePreview(false);
    }
  };

  const handleDesenlazarExcedenteIndividual = async (row) => {
    const facturaDetalleAsignacionId = Number(
      row.factura_detalle_asignacion_id,
    );

    if (!facturaDetalleAsignacionId) {
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "La fila no tiene factura_detalle_asignacion_id.",
      });
      return;
    }

    try {
      const confirm = await Swal.fire({
        icon: "warning",
        title: "¿Desenlazar excedente?",
        text: "Se revertirá únicamente esta asignación de excedente.",
        showCancelButton: true,
        confirmButtonText: "Sí, desenlazar",
        cancelButtonText: "Cancelar",
      });

      if (!confirm.isConfirmed) return;

      await desenlazarExcedenteIndividual({ facturaDetalleAsignacionId });

      await Swal.fire({
        icon: "success",
        title: "Listo",
        text: "Excedente desenlazado correctamente.",
      });

      if (facturaDetalleIdPreviewExcedente) {
        const preview = await getExcedentesPreview(
          facturaDetalleIdPreviewExcedente,
        );
        setExcedentePreviewRows(preview?.rows || []);
      }

      await fetchDetalleFactura(facturaId);
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Error",
        text:
          error?.response?.data?.message ||
          "No se pudo desenlazar el excedente.",
      });
    }
  };

  const handleDesenlazarExcedenteMasivo = async () => {
    const facturaDetalleId = Number(facturaDetalleIdPreviewExcedente);

    if (!facturaDetalleId) {
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se encontró el facturaDetalleId.",
      });
      return;
    }

    try {
      const confirm = await Swal.fire({
        icon: "warning",
        title: "¿Desenlazar todos los excedentes?",
        text: "Se revertirán todas las asignaciones de excedente de esta línea de factura.",
        showCancelButton: true,
        confirmButtonText: "Sí, desenlazar todo",
        cancelButtonText: "Cancelar",
      });

      if (!confirm.isConfirmed) return;

      await desenlazarExcedenteMasivo({ facturaDetalleId });

      await Swal.fire({
        icon: "success",
        title: "Listo",
        text: "Excedentes desenlazados correctamente.",
      });

      setOpenExcedentePreviewModal(false);
      setExcedentePreviewRows([]);
      setFacturaDetalleIdPreviewExcedente(null);

      await fetchDetalleFactura(facturaId);
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Error",
        text:
          error?.response?.data?.message ||
          "No se pudieron desenlazar los excedentes.",
      });
    }
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
      <BackordersPreviewModal
        open={openBackordersModal}
        previewData={backordersPreview}
        onClose={() => {
          setOpenBackordersModal(false);
          setBackordersPreview(null);
        }}
        onUnlinkSingle={handleUnlinkSingleBackorder}
        onResetAll={handleResetBackordersFamilia}
        loadingSingle={loadingSingleUnlink}
        loadingReset={loadingResetBackorders}
      />

      <ExcedentePreviewModal
        open={openExcedentePreviewModal}
        rows={excedentePreviewRows}
        loading={loadingExcedentePreview}
        onClose={() => {
          setOpenExcedentePreviewModal(false);
          setExcedentePreviewRows([]);
          setFacturaDetalleIdPreviewExcedente(null);
        }}
        onSingle={handleDesenlazarExcedenteIndividual}
        onMassive={handleDesenlazarExcedenteMasivo}
      />
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
          sx={{ height: 120, borderRadius: 4, boxShadow: 4, borderWidth: 3 }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 1,
            }}
          >
            <Box>
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
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 1,
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Estado del enlace (Factura ↔ Pedido)
            {filtroEstado !== "all" ? ` · Filtro: ${filtroEstado}` : ""}
          </Typography>

          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <Tooltip title="Enlace correcto (cantidad exacta)">
              <Chip
                label={`Correcto: ${conteos.ok}`}
                color="success"
                size="small"
                clickable
                variant={filtroEstado === "ok" ? "filled" : "outlined"}
                onClick={() => setFiltroEstado("ok")}
              />
            </Tooltip>

            <Tooltip title="Generó backorder (faltó cantidad)">
              <Chip
                label={`Backorder: ${conteos.backorder}`}
                color="warning"
                size="small"
                clickable
                variant={filtroEstado === "backorder" ? "filled" : "outlined"}
                onClick={() => setFiltroEstado("backorder")}
              />
            </Tooltip>

            <Tooltip title="Excedente (sobró cantidad)">
              <Chip
                label={`Excedente: ${conteos.excedente}`}
                color="info"
                size="small"
                clickable
                variant={filtroEstado === "excedente" ? "filled" : "outlined"}
                onClick={() => setFiltroEstado("excedente")}
              />
            </Tooltip>

            <Tooltip>
              <Chip
                label={`Pendientes: ${conteos.pendiente}`}
                size="small"
                variant={filtroEstado === "pendiente" ? "filled" : "outlined"}
                onClick={() => setFiltroEstado("pendiente")}
                clickable
              />
            </Tooltip>

            {filtroEstado !== "all" && (
              <Button size="small" onClick={() => setFiltroEstado("all")}>
                Ver todo
              </Button>
            )}
          </Box>
        </Box>
        <Box
          sx={{
            p: 1.5,
            borderRadius: 2,
            backgroundColor: "#fff",
            border: "1px solid rgba(0,0,0,0.08)",
            borderLeft: "6px solid #1e88e5", // azul Aphelios
            maxWidth: 420,
          }}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Estado de los enlaces
            </Typography>

            <Typography variant="caption" color="text.secondary">
              Enlaces: <b>{progresoEnlace.enlazadas}</b> /{" "}
              {progresoEnlace.total}
              {" · "}
              Pendientes:{" "}
              <b>{progresoEnlace.total - progresoEnlace.enlazadas}</b>
            </Typography>
          </Stack>

          {/* Barra principal (neutra) */}
          <Box
            sx={{
              mt: 1,
              height: 8,
              borderRadius: 999,
              backgroundColor: "rgba(0,0,0,0.08)",
              overflow: "hidden",
              display: "flex",
            }}
          >
            {/* Verde */}
            <Box
              sx={{
                width: `${(conteos.ok / conteos.total) * 100}%`,
                backgroundColor: "#2e7d32",
              }}
            />
            {/* Amarillo */}
            <Box
              sx={{
                width: `${(conteos.backorder / conteos.total) * 100}%`,
                backgroundColor: "#ed6c02",
              }}
            />
            {/* Azul */}
            <Box
              sx={{
                width: `${(conteos.excedente / conteos.total) * 100}%`,
                backgroundColor: "#0288d1",
              }}
            />
          </Box>

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mt: 0.5 }}
          >
            Factura → Pedido
          </Typography>
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
            "& .fila-no-full": {
              backgroundColor: "#FDECEA", // rojo claro
              "&:hover": {
                backgroundColor: "#F9D6D5",
              },
            },
          }}
          rows={rowsFiltradas}
          columns={columns}
          showCellVerticalBorder
          showColumnVerticalBorder
          checkboxSelection
          loading={loading}
          onRowSelectionModelChange={(ids) => {
            setSelectedLineasFacturas(ids);
          }}
          disableRowSelectionOnClick
          getRowId={(row) =>
            row.factura_detalle_asignacion_id
              ? `asig-${row.factura_detalle_asignacion_id}`
              : `detalle-${row.id}-pedido-${row.pedido_linea_id ?? "null"}`
          }
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

      <Dialog
        open={openBackorderModal}
        onClose={(_, reason) => {
          if (reason === "backdropClick") return;
          setOpenBackorderModal(false);
          setBackorderRows([]);
          setBackorderDistribucion({});
        }}
        fullWidth
        maxWidth={false}
        PaperProps={{
          sx: {
            width: "92vw",
            height: "85vh",
            maxWidth: "none",
            borderRadius: 3,
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
          Repartir backorder por rama OPD
          <IconButton
            onClick={() => {
              setOpenBackorderModal(false);
              setBackorderRows([]);
              setBackorderDistribucion({});
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent
          dividers
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            overflow: "hidden",
          }}
        >
          <Box>
            <Typography variant="body1">
              <strong>Cantidad factura:</strong> {cantidadFactura}
            </Typography>

            <Typography variant="body1">
              <strong>Total asignado:</strong> {totalAsignadoBackorder}
            </Typography>

            <Typography
              variant="body1"
              color={diferenciaBackorder === 0 ? "success.main" : "error.main"}
            >
              <strong>Diferencia:</strong> {diferenciaBackorder}
            </Typography>
          </Box>

          <Box sx={{ flex: 1, minHeight: 0 }}>
            <DataGrid
              rows={backorderRows}
              getRowId={(row) => row.rowKey}
              density="compact"
              disableRowSelectionOnClick
              showCellVerticalBorder
              showColumnVerticalBorder
              columns={[
                {
                  field: "descripcion",
                  headerName: "Descripción",
                  flex: 2,
                  minWidth: 220,
                },
                {
                  field: "orden_compra_detalle_id",
                  headerName: "OC Detalle",
                  flex: 1,
                  minWidth: 120,
                  align: "center",
                  headerAlign: "center",
                },
                {
                  field: "orden_id",
                  headerName: "OP",
                  flex: 0.7,
                  minWidth: 90,
                  align: "center",
                  headerAlign: "center",
                },
                {
                  field: "op_detalle_id",
                  headerName: "OPD",
                  flex: 0.8,
                  minWidth: 90,
                  align: "center",
                  headerAlign: "center",
                },
                {
                  field: "pendiente_opd",
                  headerName: "Pendiente",
                  flex: 1,
                  minWidth: 110,
                  align: "center",
                  headerAlign: "center",
                },
                {
                  field: "op_estatus",
                  headerName: "Estatus OP",
                  flex: 0.9,
                  minWidth: 110,
                  align: "center",
                  headerAlign: "center",
                },
                {
                  field: "cantidad_final_input",
                  headerName: "Cantidad final",
                  flex: 1,
                  minWidth: 140,
                  sortable: false,
                  filterable: false,
                  renderCell: (params) => {
                    const max = Number(params.row.pendiente_opd || 0);

                    return (
                      <TextField
                        size="small"
                        type="text"
                        value={backorderDistribucion[params.row.rowKey] ?? ""}
                        fullWidth
                        inputProps={{
                          inputMode: "decimal",
                          pattern: "[0-9]*[.]?[0-9]*",
                        }}
                        onWheel={(e) => e.target.blur()}
                        onKeyDown={(e) => {
                          const teclasBloqueadas = ["-", "+", "e", "E"];
                          if (teclasBloqueadas.includes(e.key)) {
                            e.preventDefault();
                          }
                        }}
                        onChange={(e) =>
                          handleChangeBackorderDistribucion(
                            params.row.rowKey,
                            e.target.value,
                          )
                        }
                      />
                    );
                  },
                },
              ]}
              sx={{
                height: "100%",
                borderRadius: 2,
                "& .MuiDataGrid-columnHeaders": {
                  backgroundColor: "#f5f5f5",
                  fontWeight: "bold",
                },
              }}
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() => {
              setOpenBackorderModal(false);
              setBackorderRows([]);
              setBackorderDistribucion({});
            }}
          >
            Cancelar
          </Button>

          <Button
            variant="contained"
            onClick={handleGuardarBackorderDistribuido}
            disabled={Number(diferenciaBackorder.toFixed(2)) !== 0}
          >
            Confirmar backorder
          </Button>
        </DialogActions>
      </Dialog>

      {/* Ventana Modal Details Componente*/}
      <Dialog
        id="modal-enlazar"
        open={openModal}
        onClose={() => {}} // evitamos que se cierre automáticamente
        fullWidth
        maxWidth={false}
        PaperProps={{
          sx: {
            width: { xs: "115vw", md: "110vw" },
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

        <DialogContent
          dividers
          sx={{
            p: 3,
            overflow: "visible",
          }}
        >
          <DataGrid
            rows={detalleData}
            columns={columnsDetalles}
            checkboxSelection
            disableRowSelectionOnClick
            rowHeight={100}
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
              "& .MuiDataGrid-cell": {
                display: "flex",
                alignItems: "center",
                overflow: "hidden",
              },
              "& .MuiDataGrid-columnHeaders": {
                fontWeight: 600,
              },
              "& .MuiDataGrid-main": {
                overflowX: "auto",
              },
              "& .MuiDataGrid-virtualScroller": {
                overflowX: "auto",
              },
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
            width: { xs: "98vw", md: "88vw", lg: "92vw" },
            maxWidth: "1500px",
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

      <Dialog
        open={openExcedenteModal}
        onClose={(_, reason) => {
          if (reason === "backdropClick") return;
          setOpenExcedenteModal(false);
          setExcedenteRows([]);
          setAsignacionesExcedente({});
        }}
        fullWidth
        maxWidth={false}
        PaperProps={{
          sx: {
            width: "92vw",
            height: "85vh",
            maxWidth: "none",
            borderRadius: 3,
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
          Asignar excedente por rama OPD
          <IconButton
            onClick={() => {
              setOpenExcedenteModal(false);
              setExcedenteRows([]);
              setAsignacionesExcedente({});
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent
          dividers
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            overflow: "hidden",
          }}
        >
          <Box>
            <Typography variant="body1">
              <strong>Cantidad factura:</strong> {cantidadFactura}
            </Typography>

            <Typography variant="body1">
              <strong>Total asignado:</strong> {totalAsignadoExcedente}
            </Typography>

            <Typography
              variant="body1"
              color={diferenciaExcedente === 0 ? "success.main" : "error.main"}
            >
              <strong>Diferencia:</strong> {diferenciaExcedente}
            </Typography>
          </Box>

          <Box sx={{ flex: 1, minHeight: 0 }}>
            <DataGrid
              rows={excedenteRows}
              getRowId={(row) => row.key}
              density="compact"
              disableRowSelectionOnClick
              showCellVerticalBorder
              showColumnVerticalBorder
              columns={[
                {
                  field: "descripcion",
                  headerName: "Descripción",
                  flex: 2,
                  minWidth: 220,
                },
                {
                  field: "orden_compra_detalle_id",
                  headerName: "OC Detalle",
                  flex: 1,
                  minWidth: 120,
                  align: "center",
                  headerAlign: "center",
                },
                {
                  field: "orden_id",
                  headerName: "OP",
                  flex: 0.7,
                  minWidth: 90,
                  align: "center",
                  headerAlign: "center",
                },
                {
                  field: "op_detalle_id",
                  headerName: "OPD",
                  flex: 0.8,
                  minWidth: 90,
                  align: "center",
                  headerAlign: "center",
                },
                {
                  field: "cantidad_billete",
                  headerName: "Billete actual",
                  flex: 1,
                  minWidth: 120,
                  align: "center",
                  headerAlign: "center",
                },
                {
                  field: "cantidad_surtida",
                  headerName: "Surtida",
                  flex: 0.8,
                  minWidth: 100,
                  align: "center",
                  headerAlign: "center",
                },
                {
                  field: "pendiente_opd",
                  headerName: "Pendiente",
                  flex: 1,
                  minWidth: 110,
                  align: "center",
                  headerAlign: "center",
                },
                {
                  field: "op_estatus",
                  headerName: "Estatus OP",
                  flex: 0.9,
                  minWidth: 110,
                  align: "center",
                  headerAlign: "center",
                },
                {
                  field: "cantidad_final_input",
                  headerName: "Cantidad final",
                  flex: 1,
                  minWidth: 140,
                  sortable: false,
                  filterable: false,
                  renderCell: (params) => {
                    return (
                      <TextField
                        size="small"
                        type="text"
                        value={asignacionesExcedente[params.row.key] ?? ""}
                        fullWidth
                        inputProps={{
                          inputMode: "decimal",
                          pattern: "[0-9]*[.]?[0-9]*",
                        }}
                        onWheel={(e) => e.target.blur()}
                        onKeyDown={(e) => {
                          const teclasBloqueadas = ["-", "+", "e", "E"];
                          if (teclasBloqueadas.includes(e.key)) {
                            e.preventDefault();
                          }
                        }}
                        onPaste={(e) => {
                          const pasted = e.clipboardData.getData("text");
                          if (!/^\d*\.?\d*$/.test(pasted)) {
                            e.preventDefault();
                          }
                        }}
                        onChange={(e) => {
                          let value = String(e.target.value ?? "");

                          // solo números y un punto decimal
                          value = value.replace(/[^0-9.]/g, "");

                          // evitar múltiples puntos
                          const parts = value.split(".");
                          if (parts.length > 2) {
                            value = parts[0] + "." + parts.slice(1).join("");
                          }

                          // permitir vacío mientras escribe
                          if (value === "") {
                            handleCantidadExcedenteChange(params.row.key, "");
                            return;
                          }

                          const num = Number(value);

                          if (Number.isNaN(num) || num < 0) {
                            handleCantidadExcedenteChange(params.row.key, "");
                            return;
                          }

                          handleCantidadExcedenteChange(params.row.key, num);
                        }}
                      />
                    );
                  },
                },
              ]}
              sx={{
                height: "100%",
                borderRadius: 2,
                "& .MuiDataGrid-columnHeaders": {
                  backgroundColor: "#f5f5f5",
                  fontWeight: "bold",
                },
              }}
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() => {
              setOpenExcedenteModal(false);
              setExcedenteRows([]);
              setAsignacionesExcedente({});
            }}
          >
            Cancelar
          </Button>

          <Button
            variant="contained"
            onClick={handleConfirmarExcedente}
            disabled={Number(diferenciaExcedente.toFixed(2)) !== 0}
          >
            Confirmar excedente
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default DetalleFactura;
