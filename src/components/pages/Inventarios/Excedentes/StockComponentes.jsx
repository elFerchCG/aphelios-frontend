import React, { useEffect, useMemo, useState } from "react";

import {
    Box,
    Paper,
    Tabs,
    Tab,
    Stack,
    Typography,
    TextField,
    MenuItem,
    Button,
    Chip,
    IconButton,
    Tooltip,
    Divider,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TableSortLabel,
    TablePagination,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    InputAdornment,
    CircularProgress,
    Alert
} from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";
import TuneIcon from "@mui/icons-material/Tune";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import HistoryIcon from "@mui/icons-material/History";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import EditIcon from "@mui/icons-material/Edit";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

import axios from 'axios';
import Swal from "sweetalert2";

// Los Swal de confirmación/ajuste/procesar excedente se disparan mientras
// los Dialog de MUI (Ajustar existencia / Revisar excedente) siguen
// abiertos; el Dialog usa z-index 1300 y SweetAlert2 usa 1060 por default,
// así que sin esto quedan tapados por detrás. Mismo patrón que ya se usa
// en ProformaFacturasModal.jsx / CrearProformaModal.jsx / DetalleFactura.jsx
// / Surtido.jsx para el mismo problema.
const swalConfig = {
    didOpen: () => {
        const swalContainer = document.querySelector('.swal2-container');
        if (swalContainer) {
            swalContainer.style.zIndex = '1500';
        }
    },
};

const StockComponentes = () => {

    const [tab, setTab] = useState(0);

    const [stock, setStock] = useState([]);
    const [loadingStock, setLoadingStock] = useState(false);

    const [busquedaStock, setBusquedaStock] = useState("");
    const [localidadStock, setLocalidadStock] = useState("");
    const [proveedorStock, setProveedorStock] = useState("");

    const [movimientos, setMovimientos] = useState([]);
    const [loadingMovimientos, setLoadingMovimientos] = useState(false);

    const [tipoMovimiento, setTipoMovimiento] = useState("");

    const [busquedaMovimiento, setBusquedaMovimiento] = useState("");
    const [localidadMovimiento, setLocalidadMovimiento] = useState("");

    const [pendientes, setPendientes] = useState([]);

    const [solicitudesSurtido, setSolicitudesSurtido] = useState([]);
    const [loadingSolicitudes, setLoadingSolicitudes] = useState(false);
    const [entregandoId, setEntregandoId] = useState(null);

    const [estadoReservaFiltro, setEstadoReservaFiltro] = useState("");
    const [legendaOpen, setLegendaOpen] = useState(false);

    const [movimientoSeleccionado, setMovimientoSeleccionado] =
        useState(null);

    const [openProcesar, setOpenProcesar] = useState(false);

    const [cantidadProcesar, setCantidadProcesar] = useState("");

    const [comentarioProcesar, setComentarioProcesar] =
        useState("");

    const [openAjuste, setOpenAjuste] = useState(false);

    const [stockSeleccionado, setStockSeleccionado] =
        useState(null);

    const [cantidadAjuste, setCantidadAjuste] =
        useState("");

    const [comentarioAjuste, setComentarioAjuste] =
        useState("");

    // Orden y paginación por pestaña (mismo patrón que Excedentes.jsx):
    // cada tabla tiene su propio order/orderBy/page/rowsPerPage.
    const [orderByStock, setOrderByStock] = useState("sku");
    const [orderStock, setOrderStock] = useState("asc");
    const [pageStock, setPageStock] = useState(0);
    const [rowsPerPageStock, setRowsPerPageStock] = useState(10);

    const [orderByMovimiento, setOrderByMovimiento] = useState("fecha_movimiento");
    const [orderMovimiento, setOrderMovimiento] = useState("desc");
    const [pageMovimiento, setPageMovimiento] = useState(0);
    const [rowsPerPageMovimiento, setRowsPerPageMovimiento] = useState(10);

    const [orderBySolicitud, setOrderBySolicitud] = useState("solicitado_en");
    const [orderSolicitud, setOrderSolicitud] = useState("asc");
    const [pageSolicitud, setPageSolicitud] = useState(0);
    const [rowsPerPageSolicitud, setRowsPerPageSolicitud] = useState(10);

    const [token, setToken] = useState(localStorage.getItem('token'));
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));

    useEffect(() => {
        const handleStorageChange = () => {
            setToken(localStorage.getItem('token'));
            setUser(JSON.parse(localStorage.getItem('user')));
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const apiUrl =
        process.env.NODE_ENV === 'production'
            ? process.env.REACT_APP_API_URL
            : process.env.REACT_APP_API_URL_LOCAL;

    const cargarStock = async () => {

        try {

            setLoadingStock(true);

            const response = await axios.get(
                `${apiUrl}/inventario/existencias/componentes-stock`
            );

            setStock(response.data || []);

        } catch (error) {

            console.error(error);

            Swal.fire(
                "Error",
                "No fue posible cargar el stock de componentes",
                "error"
            );

        } finally {

            setLoadingStock(false);

        }
    };

    const cargarMovimientos = async () => {

        try {

            setLoadingMovimientos(true);

            const params = {};

            if (tipoMovimiento) {
                params.tipo_movimiento = tipoMovimiento;
            }

            const response = await axios.get(
                `${apiUrl}/inventario/existencias/movimientos-excedentes-componentes`,
                { params }
            );

            setMovimientos(response.data || []);

        } catch (error) {

            console.error(error);

            Swal.fire(
                "Error",
                "No fue posible cargar los movimientos",
                "error"
            );

        } finally {

            setLoadingMovimientos(false);

        }
    };

    const cargarPendientes = async () => {

        try {

            const response = await axios.get(
                `${apiUrl}/inventario/existencias/movimientos-excedentes-componentes/pendientes`
            );

            setPendientes(response.data || []);

        } catch (error) {

            console.error(error);

        }
    };

    const cargarSolicitudesSurtido = async () => {

        try {

            setLoadingSolicitudes(true);

            const response = await axios.get(
                `${apiUrl}/inventario/existencias/solicitudes-surtido-pendientes`
            );

            setSolicitudesSurtido(response.data || []);

        } catch (error) {

            console.error(error);

        } finally {

            setLoadingSolicitudes(false);

        }
    };

    const entregarStockComponente = async (movimientoId) => {

        try {

            setEntregandoId(movimientoId);

            await axios.put(
                `${apiUrl}/inventario/existencias/movimientos-excedentes-componentes/${movimientoId}/entregar`,
                { usuario: user?.nombre || "SISTEMA" }
            );

            Swal.fire({
                icon: "success",
                title: "Entregado",
                text: "Se marcó como entregado al surtidor.",
                timer: 1200,
                showConfirmButton: false
            });

            await cargarSolicitudesSurtido();
            await cargarMovimientos();

        } catch (error) {

            Swal.fire(
                "Error",
                error.response?.data?.message?.messageText ||
                "No se pudo marcar como entregado",
                "error"
            );

        } finally {

            setEntregandoId(null);

        }
    };

    useEffect(() => {

        cargarStock();
        cargarMovimientos();
        cargarPendientes();
        cargarSolicitudesSurtido();

    }, []);

    useEffect(() => {

        cargarMovimientos();

    }, [tipoMovimiento]);

    const localidadesStock = useMemo(() => {

        return [
            ...new Map(
                stock
                    .filter(x => x.localidad_id)
                    .map(x => [
                        x.localidad_id,
                        x.localidad_descripcion
                    ])
            ).entries()
        ];

    }, [stock]);


    const proveedoresStock = useMemo(() => {

        return [
            ...new Map(
                stock
                    .filter(x => x.id_proveedor)
                    .map(x => [
                        x.id_proveedor,
                        x.proveedor
                    ])
            ).entries()
        ];

    }, [stock]);


    const localidadesMovimiento = useMemo(() => {

        return [
            ...new Map(
                movimientos
                    .filter(x => x.localidad_origen_id)
                    .map(x => [
                        x.localidad_origen_id,
                        x.localidad_origen_descripcion
                    ])
            ).entries()
        ];

    }, [movimientos]);

    const stockFiltrado = useMemo(() => {

        const texto = busquedaStock
            .toLowerCase()
            .trim();

        return stock.filter(item => {

            const coincideTexto =
                !texto ||
                String(item.sku || "")
                    .toLowerCase()
                    .includes(texto) ||
                String(item.descripcion || "")
                    .toLowerCase()
                    .includes(texto);

            const coincideLocalidad =
                !localidadStock ||
                String(item.localidad_id) ===
                String(localidadStock);

            const coincideProveedor =
                !proveedorStock ||
                String(item.id_proveedor) ===
                String(proveedorStock);

            return (
                coincideTexto &&
                coincideLocalidad &&
                coincideProveedor
            );

        });

    }, [
        stock,
        busquedaStock,
        localidadStock,
        proveedorStock
    ]);

    // Comparador genérico para ordenar cualquiera de las 3 tablas: texto
    // con localeCompare (acentos/mayúsculas correctos en español),
    // números de forma numérica. null/undefined se tratan como "" o 0.
    const compararGenerico = (a, b, campo, direccion) => {

        let av = a?.[campo];
        let bv = b?.[campo];

        if (av === null || av === undefined) av = "";
        if (bv === null || bv === undefined) bv = "";

        if (typeof av === "string" || typeof bv === "string") {
            const cmp = String(av).localeCompare(
                String(bv),
                "es",
                { sensitivity: "base" }
            );
            return direccion === "asc" ? cmp : -cmp;
        }

        return direccion === "asc"
            ? Number(av) - Number(bv)
            : Number(bv) - Number(av);
    };

    // Reinicia a la página 1 cuando cambian los filtros de cada tabla,
    // para no quedar "varado" en una página que ya no existe.
    useEffect(() => {
        setPageStock(0);
    }, [busquedaStock, localidadStock, proveedorStock]);

    const stockOrdenado = useMemo(() => {

        return [...stockFiltrado].sort((a, b) =>
            compararGenerico(a, b, orderByStock, orderStock)
        );

    }, [stockFiltrado, orderByStock, orderStock]);

    const stockPaginado = useMemo(() => {

        return stockOrdenado.slice(
            pageStock * rowsPerPageStock,
            pageStock * rowsPerPageStock + rowsPerPageStock
        );

    }, [stockOrdenado, pageStock, rowsPerPageStock]);

    const handleSortStock = (campo) => {
        if (orderByStock === campo) {
            setOrderStock(orderStock === "asc" ? "desc" : "asc");
        } else {
            setOrderByStock(campo);
            setOrderStock("asc");
        }
    };

    const handleChangePageStock = (event, nuevaPagina) => {
        setPageStock(nuevaPagina);
    };

    const handleChangeRowsPerPageStock = (event) => {
        setRowsPerPageStock(parseInt(event.target.value, 10));
        setPageStock(0);
    };

    const ESTADOS_RESERVA_INFO = {
        sin_solicitar: {
            label: "Reservada, sin solicitar",
            color: "default",
            icon: <Inventory2Icon sx={{ fontSize: 16 }} />,
            descripcion: "El MRP propuso cubrir este componente con stock existente. Nadie en almacén la ha solicitado todavía."
        },
        solicitada: {
            label: "Solicitada, esperando entrega",
            color: "warning",
            icon: <WarningAmberIcon sx={{ fontSize: 16 }} />,
            descripcion: "El surtidor ya la pidió desde Surtido. Almacén debe recolectarla y marcarla como entregada."
        },
        entregada: {
            label: "Entregada, falta confirmar armado",
            color: "info",
            icon: <LocalShippingIcon sx={{ fontSize: 16 }} />,
            descripcion: "Almacén ya le dio la pieza física al surtidor. Falta confirmar el armado en Envíos para que se reste de verdad de existencias_componentes."
        },
        confirmada: {
            label: "Confirmada (armado)",
            color: "success",
            icon: <CheckCircleIcon sx={{ fontSize: 16 }} />,
            descripcion: "Se confirmó el armado del kit: esta cantidad ya se restó de existencias_componentes."
        },
        cancelada_mrp: {
            label: "Cancelada (orden cerrada)",
            color: "default",
            icon: <CancelIcon sx={{ fontSize: 16 }} />,
            descripcion: "El MRP la canceló automáticamente porque la orden de producción que la reservaba se cerró sin confirmar el armado, y nadie la había solicitado. El stock ya quedó libre para otras órdenes."
        },
        cancelada_armado: {
            label: "Cancelada al confirmar armado",
            color: "default",
            icon: <CancelIcon sx={{ fontSize: 16 }} />,
            descripcion: "Al confirmar cuántos kits se armaban en realidad, esta parte de la reserva no se necesitó y se liberó."
        },
        cancelada_manual: {
            label: "Cancelada manualmente",
            color: "error",
            icon: <CancelIcon sx={{ fontSize: 16 }} />,
            descripcion: "Alguien la canceló a mano desde esta pantalla."
        }
    };

    const obtenerClaveEstadoReserva = (item) => {
        if (item.estatus === "procesado") return "confirmada";
        if (item.estatus === "cancelado") {
            if (item.usuario === "sistema_mrp") return "cancelada_mrp";
            if (/confirmar \d+ kits?/i.test(item.comentario || "")) return "cancelada_armado";
            return "cancelada_manual";
        }
        // estatus === 'sin_procesar'
        if (item.entregado_en) return "entregada";
        if (item.solicitado_en) return "solicitada";
        return "sin_solicitar";
    };

    const movimientosFiltrados = useMemo(() => {

        const texto = busquedaMovimiento
            .toLowerCase()
            .trim();

        return movimientos.filter(item => {

            const coincideTexto =
                !texto ||
                String(item.sku || "")
                    .toLowerCase()
                    .includes(texto) ||
                String(item.descripcion || "")
                    .toLowerCase()
                    .includes(texto) ||
                String(item.proforma_id || "")
                    .toLowerCase()
                    .includes(texto) ||
                String(item.proforma_titulo || "")
                    .toLowerCase()
                    .includes(texto) ||
                String(item.envio_id || "")
                    .toLowerCase()
                    .includes(texto) ||
                String(item.folio_interno || "")
                    .toLowerCase()
                    .includes(texto) ||
                String(item.orden_id || "")
                    .toLowerCase()
                    .includes(texto);

            const coincideLocalidad =
                !localidadMovimiento ||
                String(item.localidad_origen_id) ===
                String(localidadMovimiento);

            // Estado de reserva (solo aplica a filas
            // reserva_componente_excedente; para cualquier otro tipo de
            // movimiento queda null).
            const estadoActualReserva =
                item.tipo_movimiento === "reserva_componente_excedente"
                    ? obtenerClaveEstadoReserva(item)
                    : null;

            // Si el usuario ya eligió explícitamente un tipo de movimiento
            // específico (distinto de "reserva de stock") en el filtro de
            // Tipo de movimiento, respetamos esa elección tal cual: por
            // ejemplo, si elige "Cancelaciones", el backend/listado ya
            // viene acotado a esos registros y no debemos volver a
            // ocultarlos por estar 'cancelado'.
            const filtroTipoEsEspecificoNoReserva =
                tipoMovimiento !== "" &&
                tipoMovimiento !== "reserva_componente_excedente";

            // Por default, sin filtro seleccionado, se ocultan las filas
            // canceladas: tanto reservas ya canceladas (por MRP, al
            // confirmar armado, o manualmente) como cualquier otro
            // movimiento con estatus 'cancelado' (p. ej. el sobrante que
            // se registra como tipo_movimiento 'cancelacion' cuando se
            // confirman menos kits de los reservados). Solo vuelven a
            // aparecer si el usuario elige explícitamente ese estado de
            // reserva en el filtro, o si elige explícitamente el tipo de
            // movimiento correspondiente (p. ej. "Cancelaciones").
            const esCanceladoOcultoPorDefault =
                !filtroTipoEsEspecificoNoReserva &&
                item.estatus === "cancelado" &&
                (
                    !estadoActualReserva ||
                    [
                        "cancelada_mrp",
                        "cancelada_armado",
                        "cancelada_manual"
                    ].includes(estadoActualReserva)
                );

            const coincideEstadoReserva = estadoReservaFiltro
                ? (
                    item.tipo_movimiento === "reserva_componente_excedente" &&
                    estadoActualReserva === estadoReservaFiltro
                )
                : !esCanceladoOcultoPorDefault;

            return (
                coincideTexto &&
                coincideLocalidad &&
                coincideEstadoReserva
            );

        });

    }, [
        movimientos,
        busquedaMovimiento,
        localidadMovimiento,
        estadoReservaFiltro,
        tipoMovimiento
    ]);

    useEffect(() => {
        setPageMovimiento(0);
    }, [busquedaMovimiento, tipoMovimiento, localidadMovimiento, estadoReservaFiltro]);

    const movimientosOrdenados = useMemo(() => {

        return [...movimientosFiltrados].sort((a, b) =>
            compararGenerico(a, b, orderByMovimiento, orderMovimiento)
        );

    }, [movimientosFiltrados, orderByMovimiento, orderMovimiento]);

    const movimientosPaginados = useMemo(() => {

        return movimientosOrdenados.slice(
            pageMovimiento * rowsPerPageMovimiento,
            pageMovimiento * rowsPerPageMovimiento + rowsPerPageMovimiento
        );

    }, [movimientosOrdenados, pageMovimiento, rowsPerPageMovimiento]);

    const handleSortMovimiento = (campo) => {
        if (orderByMovimiento === campo) {
            setOrderMovimiento(orderMovimiento === "asc" ? "desc" : "asc");
        } else {
            setOrderByMovimiento(campo);
            setOrderMovimiento("asc");
        }
    };

    const handleChangePageMovimiento = (event, nuevaPagina) => {
        setPageMovimiento(nuevaPagina);
    };

    const handleChangeRowsPerPageMovimiento = (event) => {
        setRowsPerPageMovimiento(parseInt(event.target.value, 10));
        setPageMovimiento(0);
    };

    const solicitudesOrdenadas = useMemo(() => {

        return [...solicitudesSurtido].sort((a, b) =>
            compararGenerico(a, b, orderBySolicitud, orderSolicitud)
        );

    }, [solicitudesSurtido, orderBySolicitud, orderSolicitud]);

    const solicitudesPaginadas = useMemo(() => {

        return solicitudesOrdenadas.slice(
            pageSolicitud * rowsPerPageSolicitud,
            pageSolicitud * rowsPerPageSolicitud + rowsPerPageSolicitud
        );

    }, [solicitudesOrdenadas, pageSolicitud, rowsPerPageSolicitud]);

    const handleSortSolicitud = (campo) => {
        if (orderBySolicitud === campo) {
            setOrderSolicitud(orderSolicitud === "asc" ? "desc" : "asc");
        } else {
            setOrderBySolicitud(campo);
            setOrderSolicitud("asc");
        }
    };

    const handleChangePageSolicitud = (event, nuevaPagina) => {
        setPageSolicitud(nuevaPagina);
    };

    const handleChangeRowsPerPageSolicitud = (event) => {
        setRowsPerPageSolicitud(parseInt(event.target.value, 10));
        setPageSolicitud(0);
    };

    // Si al refrescar cualquiera de las 3 listas la página actual queda
    // "fuera de rango" (por ejemplo, se cancela/entrega el único
    // registro de la última página), regresa a la página 1 en vez de
    // dejar la tabla vacía viéndose en una página que ya no existe.
    useEffect(() => {
        if (pageStock > 0 && pageStock * rowsPerPageStock >= stockOrdenado.length) {
            setPageStock(0);
        }
    }, [stockOrdenado, pageStock, rowsPerPageStock]);

    useEffect(() => {
        if (pageMovimiento > 0 && pageMovimiento * rowsPerPageMovimiento >= movimientosOrdenados.length) {
            setPageMovimiento(0);
        }
    }, [movimientosOrdenados, pageMovimiento, rowsPerPageMovimiento]);

    useEffect(() => {
        if (pageSolicitud > 0 && pageSolicitud * rowsPerPageSolicitud >= solicitudesOrdenadas.length) {
            setPageSolicitud(0);
        }
    }, [solicitudesOrdenadas, pageSolicitud, rowsPerPageSolicitud]);

    const abrirAjuste = (item) => {

        setStockSeleccionado(item);

        setCantidadAjuste(
            Number(item.cantidad || 0)
        );

        setComentarioAjuste("");

        setOpenAjuste(true);
    };

    const guardarAjuste = async () => {

        if (!stockSeleccionado) return;

        const cantidad = Number(cantidadAjuste);

        if (!Number.isInteger(cantidad) || cantidad < 0) {

            Swal.fire({
                ...swalConfig,
                title: "Cantidad inválida",
                text: "La cantidad debe ser un número entero mayor o igual a 0",
                icon: "warning",
            });

            return;
        }

        const confirmacion = await Swal.fire({

            ...swalConfig,

            title: "¿Ajustar existencia?",

            html: `
                <div style="text-align:left">
                    <b>${stockSeleccionado.sku}</b><br>
                    Stock actual:
                    <b>${stockSeleccionado.cantidad}</b><br>
                    Reservado (órdenes abiertas):
                    <b>${Number(stockSeleccionado.stock_reservado || 0)}</b><br>
                    Nuevo stock:
                    <b>${cantidad}</b>
                </div>
            `,

            icon: "warning",

            showCancelButton: true,

            confirmButtonText: "Sí, ajustar",

            cancelButtonText: "Cancelar",

        });

        if (!confirmacion.isConfirmed) {
            return;
        }


        try {

            await axios.put(
                `${apiUrl}/inventario/existencias/componentes-stock/${stockSeleccionado.existencia_id}/ajuste`,
                {
                    existencia_id:
                        stockSeleccionado.existencia_id,

                    componente_id:
                        stockSeleccionado.componente_id,

                    localidad_id:
                        stockSeleccionado.localidad_id,

                    cantidad,

                    usuario: user?.nombre || "SISTEMA",

                    comentario:
                        comentarioAjuste
                }
            );


            setOpenAjuste(false);

            await cargarStock();

            await cargarMovimientos();


            Swal.fire({
                ...swalConfig,
                title: "Stock actualizado",
                text: "La existencia fue ajustada correctamente",
                icon: "success",
            });

        } catch (error) {

            console.error(error);

            const detalles = error?.response?.data?.message?.detalles;

            if (error?.response?.status === 409 && detalles?.reservas?.length) {

                const filas = detalles.reservas
                    .map(r =>
                        `<tr>
                            <td style="padding:2px 8px 2px 0">Orden #${r.orden_id ?? "-"}</td>
                            <td style="padding:2px 0;text-align:right">${r.cantidad}</td>
                        </tr>`
                    )
                    .join("");

                Swal.fire({
                    ...swalConfig,
                    icon: "error",
                    title: "No se puede bajar a esa cantidad",
                    html: `
                        <div style="text-align:left">
                            Hay <b>${detalles.stock_reservado}</b> unidades
                            ya reservadas para estas órdenes de producción
                            abiertas. Libera o cancela esas reservas desde
                            Movimientos antes de bajar el stock a
                            <b>${detalles.cantidad_solicitada}</b>.
                            <table style="margin-top:8px;width:100%">
                                ${filas}
                            </table>
                        </div>
                    `,
                });

                return;
            }

            Swal.fire({
                ...swalConfig,
                title: "Error",
                text: error?.response?.data?.message?.messageText ||
                    "No fue posible ajustar la existencia",
                icon: "error",
            });

        }

    };

    const abrirProcesar = (movimiento) => {

        setMovimientoSeleccionado(movimiento);

        setCantidadProcesar(
            Number(movimiento.cantidad || 0)
        );

        setComentarioProcesar("");

        setOpenProcesar(true);
    };

    const procesarExcedente = async () => {

        if (!movimientoSeleccionado) return;

        const cantidad = Number(cantidadProcesar);

        const cantidadOriginal =
            Number(movimientoSeleccionado.cantidad);


        if (
            !Number.isInteger(cantidad) ||
            cantidad <= 0
        ) {

            Swal.fire({
                ...swalConfig,
                title: "Cantidad inválida",
                text: "La cantidad debe ser un entero mayor a 0",
                icon: "warning",
            });

            return;
        }


        if (cantidad > cantidadOriginal) {

            Swal.fire({
                ...swalConfig,
                title: "Cantidad inválida",
                text: `No puede exceder las ${cantidadOriginal} unidades generadas`,
                icon: "warning",
            });

            return;
        }


        const confirmacion = await Swal.fire({

            ...swalConfig,

            title: "Confirmar excedente",

            html: `
                <div style="text-align:left">

                    <b>${movimientoSeleccionado.sku}</b>

                    <br><br>

                    Proforma:
                    <b>${movimientoSeleccionado.proforma_titulo ?? movimientoSeleccionado.proforma_id ?? "-"}</b>

                    <br>

                    Envío:
                    <b>${movimientoSeleccionado.folio_interno ?? movimientoSeleccionado.envio_id ?? "-"}</b>

                    <br><br>

                    Cantidad generada:
                    <b>${cantidadOriginal}</b>

                    <br>

                    Cantidad a confirmar:
                    <b>${cantidad}</b>

                    ${cantidad < cantidadOriginal
                    ? `
                                <br><br>
                                <span style="color:#d97706">
                                    ${cantidadOriginal - cantidad}
                                    unidades quedarán canceladas.
                                </span>
                              `
                    : ""
                }

                </div>
            `,

            icon: "warning",

            showCancelButton: true,

            confirmButtonText: "Confirmar",

            cancelButtonText: "Cancelar"

        });


        if (!confirmacion.isConfirmed) {
            return;
        }


        try {

            await axios.post(
                `${apiUrl}/inventario/existencias/movimientos-excedentes-componentes/${movimientoSeleccionado.movimiento_id}/procesar`,
                {
                    movimiento_id:
                        movimientoSeleccionado.movimiento_id,

                    cantidad,

                    usuario: user?.nombre || "SISTEMA",

                    comentario:
                        comentarioProcesar
                }
            );


            setOpenProcesar(false);

            await Promise.all([
                cargarStock(),
                cargarMovimientos(),
                cargarPendientes()
            ]);


            Swal.fire({
                ...swalConfig,
                title: "Excedente procesado",
                text: "La cantidad confirmada fue agregada al stock real",
                icon: "success",
            });

        } catch (error) {

            console.error(error);

            Swal.fire({
                ...swalConfig,
                title: "Error",
                text: error?.response?.data?.message?.messageText ||
                    "No fue posible procesar el excedente",
                icon: "error",
            });

        }

    };

    const cancelarExcedente = async (movimiento) => {

        const confirmacion = await Swal.fire({

            ...swalConfig,

            title: "¿Cancelar excedente?",

            text: `${movimiento.sku} - ${movimiento.cantidad} unidades`,

            icon: "warning",

            showCancelButton: true,

            confirmButtonText: "Sí, cancelar",

            cancelButtonText: "Volver",

            confirmButtonColor: "#d32f2f"

        });

        if (!confirmacion.isConfirmed) {
            return;
        }

        try {

            await axios.post(
                `${apiUrl}/inventario/existencias/movimientos-excedentes-componentes/cancelar`,
                {
                    movimiento_id:
                        movimiento.movimiento_id,

                    usuario: user?.nombre || "SISTEMA",

                    comentario:
                        "Excedente cancelado desde el módulo de stock"
                }
            );

            await Promise.all([
                cargarMovimientos(),
                cargarPendientes()
            ]);


            Swal.fire({
                ...swalConfig,
                title: "Cancelado",
                text: "El excedente fue cancelado correctamente",
                icon: "success",
            });

        } catch (error) {

            console.error(error);

            Swal.fire({
                ...swalConfig,
                title: "Error",
                text: error?.response?.data?.message?.messageText ||
                    "No fue posible cancelar el excedente",
                icon: "error",
            });

        }

    };

    const renderTipoMovimiento = (tipo) => {

        switch (tipo) {

            case "generacion":

                return (
                    <Chip
                        size="small"
                        icon={<WarningAmberIcon />}
                        label="Generación"
                        color="warning"
                    />
                );

            case "consumo":

                return (
                    <Chip
                        size="small"
                        label="Consumo"
                        color="success"
                    />
                );

            case "ajuste":

                return (
                    <Chip
                        size="small"
                        icon={<EditIcon />}
                        label="Ajuste"
                        color="info"
                    />
                );

            case "cancelacion":

                return (
                    <Chip
                        size="small"
                        icon={<CancelIcon />}
                        label="Cancelación"
                        color="error"
                    />
                );

            case "reserva_componente_excedente":

                return (
                    <Chip
                        size="small"
                        icon={<Inventory2Icon />}
                        label="Reserva de stock"
                        color="secondary"
                    />
                );

            default:

                return (
                    <Chip
                        size="small"
                        label={tipo || "-"}
                    />
                );

        }

    };

    /*
     * ============================================================
     * Origen (proforma / envío) del movimiento.
     *
     * Solo los movimientos de excedentes generados a partir de una
     * proforma/envío traen estos datos (mec.proforma_id /
     * mec.envio_id). Ajustes manuales, por ejemplo, no los traen.
     * ============================================================
     */

    const renderOrigen = (item) => {

        if (!item.proforma_id && !item.envio_id) {

            return (
                <Typography
                    variant="body2"
                    color="text.secondary"
                >
                    -
                </Typography>
            );

        }

        return (

            <Stack spacing={0.5}>

                {item.proforma_id && (

                    <Stack
                        direction="row"
                        spacing={0.5}
                        alignItems="center"
                    >

                        <ReceiptLongIcon
                            sx={{
                                fontSize: 15,
                                color: "text.secondary"
                            }}
                        />

                        <Typography
                            variant="body2"
                        >
                            Proforma{" "}
                            <b>{item.proforma_titulo || `#${item.proforma_id}`}</b>
                        </Typography>

                    </Stack>

                )}

                {item.envio_id && (

                    <Stack
                        direction="row"
                        spacing={0.5}
                        alignItems="center"
                    >

                        <LocalShippingIcon
                            sx={{
                                fontSize: 15,
                                color: "text.secondary"
                            }}
                        />

                        <Typography
                            variant="body2"
                        >
                            Envío{" "}
                            <b>{item.folio_interno || `#${item.envio_id}`}</b>
                        </Typography>

                    </Stack>

                )}

            </Stack>

        );

    };

    /*
     * Chip + tooltip con el estado entendible de una reserva de stock de
     * componentes (usa ESTADOS_RESERVA_INFO / obtenerClaveEstadoReserva
     * definidos arriba, antes de movimientosFiltrados).
     */
    const renderEstadoReserva = (item) => {
        const clave = obtenerClaveEstadoReserva(item);
        const info = ESTADOS_RESERVA_INFO[clave];
        return (
            <Tooltip title={info.descripcion}>
                <Chip size="small" icon={info.icon} label={info.label} color={info.color} />
            </Tooltip>
        );
    };

    /*
     * Estado de la orden_produccion dueña de la reserva — para poder ver
     * de un vistazo si sigue abierta (todavía puede confirmarse el
     * armado) o si ya se cerró.
     */
    const renderEstadoOrden = (estatus) => {
        if (!estatus) {
            return <Typography variant="caption" color="text.secondary">-</Typography>;
        }
        const etiquetas = {
            planeada: "Planeada", en_proceso: "En proceso", recibida: "Recibida",
            empacada: "Empacada", surtida: "Surtida", cerrada: "Cerrada"
        };
        return (
            <Chip
                size="small"
                label={etiquetas[estatus] || estatus}
                color={estatus === "cerrada" ? "default" : "primary"}
                variant={estatus === "cerrada" ? "outlined" : "filled"}
            />
        );
    };

    return (

        <Box
            sx={{
                minHeight: '100vh',
                p: 2,
                bgcolor: "#f5f7fa"
            }}
        >

            {/* ==================================================
                HEADER
            ================================================== */}

            <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 2 }}
            >

                <Box>

                    <Typography
                        variant="h5"
                        fontWeight={700}
                    >
                        Stock de componentes
                    </Typography>

                    <Typography
                        variant="body2"
                        color="text.secondary"
                    >
                        Control de existencias y movimientos de excedentes
                    </Typography>

                </Box>

            </Stack>


            {/* ==================================================
                TABS
            ================================================== */}

            <Paper
                elevation={0}
                sx={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 2,
                    overflow: "hidden"
                }}
            >

                <Tabs
                    value={tab}
                    onChange={(_, value) => setTab(value)}
                    sx={{
                        px: 1,
                        borderBottom: "1px solid #e5e7eb"
                    }}
                >

                    <Tab
                        icon={<Inventory2Icon />}
                        iconPosition="start"
                        label={
                            <Stack
                                direction="row"
                                spacing={1}
                                alignItems="center"
                            >
                                <span>Stock real</span>

                                <Chip
                                    size="small"
                                    label={stock.length}
                                />

                            </Stack>
                        }
                    />

                    <Tab
                        icon={<HistoryIcon />}
                        iconPosition="start"
                        label={
                            <Stack
                                direction="row"
                                spacing={1}
                                alignItems="center"
                            >
                                <span>Movimientos</span>

                                {pendientes.length > 0 && (
                                    <Chip
                                        size="small"
                                        color="warning"
                                        label={pendientes.length}
                                    />
                                )}

                            </Stack>
                        }
                    />

                    <Tab
                        icon={<LocalShippingIcon />}
                        iconPosition="start"
                        label={
                            <Stack
                                direction="row"
                                spacing={1}
                                alignItems="center"
                            >
                                <span>Solicitudes de surtido</span>

                                {solicitudesSurtido.length > 0 && (
                                    <Chip
                                        size="small"
                                        color="secondary"
                                        label={solicitudesSurtido.length}
                                    />
                                )}

                            </Stack>
                        }
                    />

                </Tabs>


                {/* ==================================================
                    TAB STOCK
                ================================================== */}

                {tab === 0 && (

                    <Box sx={{ p: 2 }}>

                        <Stack
                            direction={{
                                xs: "column",
                                md: "row"
                            }}
                            spacing={1.5}
                            sx={{ mb: 2 }}
                        >

                            <TextField
                                size="small"
                                fullWidth
                                placeholder="Buscar SKU o componente..."
                                value={busquedaStock}
                                onChange={(e) =>
                                    setBusquedaStock(e.target.value)
                                }
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon />
                                        </InputAdornment>
                                    )
                                }}
                            />


                            <TextField
                                select
                                size="small"
                                label="Localidad"
                                value={localidadStock}
                                onChange={(e) =>
                                    setLocalidadStock(e.target.value)
                                }
                                sx={{
                                    minWidth: 200
                                }}
                            >

                                <MenuItem value="">
                                    Todas
                                </MenuItem>

                                {localidadesStock.map(
                                    ([id, descripcion]) => (

                                        <MenuItem
                                            key={id}
                                            value={id}
                                        >
                                            {descripcion}
                                        </MenuItem>

                                    )
                                )}

                            </TextField>


                            <TextField
                                select
                                size="small"
                                label="Proveedor"
                                value={proveedorStock}
                                onChange={(e) =>
                                    setProveedorStock(e.target.value)
                                }
                                sx={{
                                    minWidth: 220
                                }}
                            >

                                <MenuItem value="">
                                    Todos
                                </MenuItem>

                                {proveedoresStock.map(
                                    ([id, proveedor]) => (

                                        <MenuItem
                                            key={id}
                                            value={id}
                                        >
                                            {proveedor}
                                        </MenuItem>

                                    )
                                )}

                            </TextField>


                            <Button
                                variant="outlined"
                                startIcon={<TuneIcon />}
                                onClick={() => {
                                    setBusquedaStock("");
                                    setLocalidadStock("");
                                    setProveedorStock("");
                                }}
                            >
                                Limpiar
                            </Button>

                        </Stack>


                        <TableContainer>

                            <Table
                                size="small"
                                stickyHeader
                            >

                                <TableHead>

                                    <TableRow>

                                        <TableCell>
                                            <TableSortLabel
                                                active={orderByStock === "sku"}
                                                direction={orderByStock === "sku" ? orderStock : "asc"}
                                                onClick={() => handleSortStock("sku")}
                                            >
                                                SKU
                                            </TableSortLabel>
                                        </TableCell>

                                        <TableCell>
                                            <TableSortLabel
                                                active={orderByStock === "descripcion"}
                                                direction={orderByStock === "descripcion" ? orderStock : "asc"}
                                                onClick={() => handleSortStock("descripcion")}
                                            >
                                                Componente
                                            </TableSortLabel>
                                        </TableCell>

                                        <TableCell>
                                            <TableSortLabel
                                                active={orderByStock === "proveedor"}
                                                direction={orderByStock === "proveedor" ? orderStock : "asc"}
                                                onClick={() => handleSortStock("proveedor")}
                                            >
                                                Proveedor
                                            </TableSortLabel>
                                        </TableCell>

                                        <TableCell>
                                            <TableSortLabel
                                                active={orderByStock === "localidad_descripcion"}
                                                direction={orderByStock === "localidad_descripcion" ? orderStock : "asc"}
                                                onClick={() => handleSortStock("localidad_descripcion")}
                                            >
                                                Localidad
                                            </TableSortLabel>
                                        </TableCell>

                                        <TableCell>
                                            <TableSortLabel
                                                active={orderByStock === "bodega_nombre"}
                                                direction={orderByStock === "bodega_nombre" ? orderStock : "asc"}
                                                onClick={() => handleSortStock("bodega_nombre")}
                                            >
                                                Bodega
                                            </TableSortLabel>
                                        </TableCell>
                                        <TableCell
                                            align="right"
                                        >
                                            <TableSortLabel
                                                active={orderByStock === "cantidad"}
                                                direction={orderByStock === "cantidad" ? orderStock : "asc"}
                                                onClick={() => handleSortStock("cantidad")}
                                            >
                                                Stock actual
                                            </TableSortLabel>
                                        </TableCell>

                                        <TableCell
                                            align="right"
                                        >
                                            <TableSortLabel
                                                active={orderByStock === "stock_reservado"}
                                                direction={orderByStock === "stock_reservado" ? orderStock : "asc"}
                                                onClick={() => handleSortStock("stock_reservado")}
                                            >
                                                <Tooltip title="Comprometido con órdenes de producción abiertas (reserva_componente_excedente sin procesar)">
                                                    <span>Reservado</span>
                                                </Tooltip>
                                            </TableSortLabel>
                                        </TableCell>

                                        <TableCell
                                            align="right"
                                        >
                                            <TableSortLabel
                                                active={orderByStock === "stock_por_ingresar"}
                                                direction={orderByStock === "stock_por_ingresar" ? orderStock : "asc"}
                                                onClick={() => handleSortStock("stock_por_ingresar")}
                                            >
                                                <Tooltip title="Excedente de componente por sobre-facturación, generado pero aún sin confirmar (pendiente de sumarse a este stock)">
                                                    <span>Por ingresar</span>
                                                </Tooltip>
                                            </TableSortLabel>
                                        </TableCell>

                                        <TableCell
                                            align="right"
                                        >
                                            <TableSortLabel
                                                active={orderByStock === "stock_disponible"}
                                                direction={orderByStock === "stock_disponible" ? orderStock : "asc"}
                                                onClick={() => handleSortStock("stock_disponible")}
                                            >
                                                <Tooltip title="Stock actual menos lo reservado: lo que realmente se puede prometer a una orden nueva o bajar al ajustar">
                                                    <span>Disponible</span>
                                                </Tooltip>
                                            </TableSortLabel>
                                        </TableCell>

                                        <TableCell
                                            align="center"
                                        >
                                            Acción
                                        </TableCell>

                                    </TableRow>

                                </TableHead>


                                <TableBody>

                                    {loadingStock ? (

                                        <TableRow>

                                            <TableCell
                                                colSpan={10}
                                                align="center"
                                                sx={{ py: 5 }}
                                            >

                                                <CircularProgress
                                                    size={28}
                                                />

                                            </TableCell>

                                        </TableRow>

                                    ) : stockFiltrado.length === 0 ? (

                                        <TableRow>

                                            <TableCell
                                                colSpan={10}
                                                align="center"
                                                sx={{ py: 5 }}
                                            >

                                                <Typography
                                                    color="text.secondary"
                                                >
                                                    No hay existencias
                                                    para mostrar
                                                </Typography>

                                            </TableCell>

                                        </TableRow>

                                    ) : (

                                        stockPaginado.map(item => (

                                            <TableRow
                                                key={item.existencia_id}
                                                hover
                                            >

                                                <TableCell>

                                                    <Typography
                                                        fontWeight={700}
                                                        fontSize={13}
                                                    >
                                                        {item.sku}
                                                    </Typography>

                                                </TableCell>


                                                <TableCell>

                                                    {item.descripcion}

                                                </TableCell>


                                                <TableCell>

                                                    {item.proveedor || "-"}

                                                </TableCell>


                                                <TableCell>

                                                    {item.localidad_descripcion || "-"}

                                                </TableCell>


                                                <TableCell>

                                                    {item.bodega_nombre || "-"}

                                                </TableCell>


                                                <TableCell
                                                    align="right"
                                                >

                                                    <Typography
                                                        fontWeight={800}
                                                        fontSize={16}
                                                    >
                                                        {Number(
                                                            item.cantidad
                                                        ).toLocaleString()}
                                                    </Typography>

                                                </TableCell>

                                                <TableCell
                                                    align="right"
                                                >

                                                    <Typography
                                                        fontSize={14}
                                                        color={
                                                            Number(item.stock_reservado || 0) > 0
                                                                ? "warning.main"
                                                                : "text.secondary"
                                                        }
                                                    >
                                                        {Number(
                                                            item.stock_reservado || 0
                                                        ).toLocaleString()}
                                                    </Typography>

                                                </TableCell>


                                                <TableCell
                                                    align="right"
                                                >

                                                    <Typography
                                                        fontSize={14}
                                                        color={
                                                            Number(item.stock_por_ingresar || 0) > 0
                                                                ? "info.main"
                                                                : "text.secondary"
                                                        }
                                                    >
                                                        {Number(
                                                            item.stock_por_ingresar || 0
                                                        ).toLocaleString()}
                                                    </Typography>

                                                </TableCell>


                                                <TableCell
                                                    align="right"
                                                >

                                                    <Typography
                                                        fontWeight={700}
                                                        fontSize={14}
                                                        color={
                                                            Number(item.stock_disponible ?? item.cantidad) < 0
                                                                ? "error.main"
                                                                : "success.main"
                                                        }
                                                    >
                                                        {Number(
                                                            item.stock_disponible ?? item.cantidad
                                                        ).toLocaleString()}
                                                    </Typography>

                                                </TableCell>

                                                <TableCell
                                                    align="center"
                                                >

                                                    <Tooltip
                                                        title="Ajustar existencia"
                                                    >

                                                        <IconButton
                                                            color="primary"
                                                            onClick={() =>
                                                                abrirAjuste(item)
                                                            }
                                                        >

                                                            <TuneIcon />

                                                        </IconButton>

                                                    </Tooltip>

                                                </TableCell>

                                            </TableRow>

                                        ))

                                    )}

                                </TableBody>

                            </Table>

                        </TableContainer>

                        <TablePagination
                            rowsPerPageOptions={[5, 10, 25, 50]}
                            component="div"
                            count={stockOrdenado.length}
                            rowsPerPage={rowsPerPageStock}
                            page={pageStock}
                            onPageChange={handleChangePageStock}
                            onRowsPerPageChange={handleChangeRowsPerPageStock}
                            labelRowsPerPage="Filas por página:"
                            labelDisplayedRows={({ from, to, count }) =>
                                `${from}–${to} de ${count !== -1 ? count : `más de ${to}`}`
                            }
                        />

                    </Box>

                )}


                {/* ==================================================
                    TAB MOVIMIENTOS
                ================================================== */}

                {tab === 1 && (

                    <Box sx={{ p: 2 }}>

                        {/* FILTROS */}

                        <Stack
                            direction={{
                                xs: "column",
                                md: "row"
                            }}
                            spacing={1.5}
                            sx={{ mb: 2 }}
                        >

                            <TextField
                                size="small"
                                fullWidth
                                placeholder="Buscar SKU, componente, proforma o envío..."
                                value={busquedaMovimiento}
                                onChange={(e) =>
                                    setBusquedaMovimiento(
                                        e.target.value
                                    )
                                }
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon />
                                        </InputAdornment>
                                    )
                                }}
                            />


                            <TextField
                                select
                                size="small"
                                label="Tipo de movimiento"
                                value={tipoMovimiento}
                                onChange={(e) =>
                                    setTipoMovimiento(
                                        e.target.value
                                    )
                                }
                                sx={{
                                    minWidth: 220
                                }}
                            >

                                <MenuItem value="">
                                    Todos
                                </MenuItem>

                                <MenuItem value="generacion">
                                    Generaciones
                                </MenuItem>

                                <MenuItem value="reserva_componente_excedente">
                                    Reservas de stock
                                </MenuItem>

                                <MenuItem value="consumo">
                                    Consumos
                                </MenuItem>

                                <MenuItem value="ajuste">
                                    Ajustes
                                </MenuItem>

                                <MenuItem value="cancelacion">
                                    Cancelaciones
                                </MenuItem>

                            </TextField>

                            <TextField
                                select
                                size="small"
                                label="Estado de la reserva"
                                value={estadoReservaFiltro}
                                onChange={(e) => setEstadoReservaFiltro(e.target.value)}
                                disabled={Boolean(tipoMovimiento) && tipoMovimiento !== "reserva_componente_excedente"}
                                helperText="Solo para Reservas de stock"
                                sx={{ minWidth: 240 }}
                            >
                                <MenuItem value="">Todos</MenuItem>
                                {Object.entries(ESTADOS_RESERVA_INFO).map(([clave, info]) => (
                                    <MenuItem key={clave} value={clave}>{info.label}</MenuItem>
                                ))}
                            </TextField>

                            <TextField
                                select
                                size="small"
                                label="Localidad"
                                value={localidadMovimiento}
                                onChange={(e) =>
                                    setLocalidadMovimiento(
                                        e.target.value
                                    )
                                }
                                sx={{
                                    minWidth: 200
                                }}
                            >

                                <MenuItem value="">
                                    Todas
                                </MenuItem>

                                {localidadesMovimiento.map(
                                    ([id, descripcion]) => (

                                        <MenuItem
                                            key={id}
                                            value={id}
                                        >
                                            {descripcion}
                                        </MenuItem>

                                    )
                                )}

                            </TextField>

                            <Button
                                variant="outlined"
                                onClick={() => {

                                    setBusquedaMovimiento("");
                                    setTipoMovimiento("");
                                    setLocalidadMovimiento("");
                                    setEstadoReservaFiltro("");

                                }}
                            >
                                Limpiar
                            </Button>

                            <Button variant="text" startIcon={<InfoOutlinedIcon />} onClick={() => setLegendaOpen(true)}>
                                ¿Qué significa cada estado?
                            </Button>

                        </Stack>


                        {/* PENDIENTES */}

                        {pendientes.length > 0 && (

                            <Alert
                                severity="warning"
                                icon={<WarningAmberIcon />}
                                sx={{ mb: 2 }}
                            >

                                Hay{" "}
                                <b>{pendientes.length}</b>{" "}
                                excedente
                                {pendientes.length !== 1
                                    ? "s"
                                    : ""}{" "}
                                pendiente
                                {pendientes.length !== 1
                                    ? "s"
                                    : ""}{" "}
                                de confirmar.

                            </Alert>

                        )}


                        <TableContainer>

                            <Table
                                size="small"
                                stickyHeader
                            >

                                <TableHead>

                                    <TableRow>

                                        <TableCell>
                                            <TableSortLabel
                                                active={orderByMovimiento === "fecha_movimiento"}
                                                direction={orderByMovimiento === "fecha_movimiento" ? orderMovimiento : "asc"}
                                                onClick={() => handleSortMovimiento("fecha_movimiento")}
                                            >
                                                Fecha
                                            </TableSortLabel>
                                        </TableCell>

                                        <TableCell>
                                            <TableSortLabel
                                                active={orderByMovimiento === "sku"}
                                                direction={orderByMovimiento === "sku" ? orderMovimiento : "asc"}
                                                onClick={() => handleSortMovimiento("sku")}
                                            >
                                                SKU
                                            </TableSortLabel>
                                        </TableCell>

                                        <TableCell>
                                            <TableSortLabel
                                                active={orderByMovimiento === "descripcion"}
                                                direction={orderByMovimiento === "descripcion" ? orderMovimiento : "asc"}
                                                onClick={() => handleSortMovimiento("descripcion")}
                                            >
                                                Componente
                                            </TableSortLabel>
                                        </TableCell>

                                        <TableCell>
                                            Origen (proforma / envío)
                                        </TableCell>

                                        <TableCell>
                                            <TableSortLabel
                                                active={orderByMovimiento === "orden_id"}
                                                direction={orderByMovimiento === "orden_id" ? orderMovimiento : "asc"}
                                                onClick={() => handleSortMovimiento("orden_id")}
                                            >
                                                Orden de producción
                                            </TableSortLabel>
                                        </TableCell>

                                        <TableCell
                                            align="right"
                                        >
                                            <TableSortLabel
                                                active={orderByMovimiento === "cantidad"}
                                                direction={orderByMovimiento === "cantidad" ? orderMovimiento : "asc"}
                                                onClick={() => handleSortMovimiento("cantidad")}
                                            >
                                                Cantidad
                                            </TableSortLabel>
                                        </TableCell>

                                        <TableCell>
                                            <TableSortLabel
                                                active={orderByMovimiento === "tipo_movimiento"}
                                                direction={orderByMovimiento === "tipo_movimiento" ? orderMovimiento : "asc"}
                                                onClick={() => handleSortMovimiento("tipo_movimiento")}
                                            >
                                                Tipo
                                            </TableSortLabel>
                                        </TableCell>

                                        <TableCell>
                                            <TableSortLabel
                                                active={orderByMovimiento === "estatus"}
                                                direction={orderByMovimiento === "estatus" ? orderMovimiento : "asc"}
                                                onClick={() => handleSortMovimiento("estatus")}
                                            >
                                                Estatus
                                            </TableSortLabel>
                                        </TableCell>

                                        <TableCell>
                                            <TableSortLabel
                                                active={orderByMovimiento === "localidad_origen_descripcion"}
                                                direction={orderByMovimiento === "localidad_origen_descripcion" ? orderMovimiento : "asc"}
                                                onClick={() => handleSortMovimiento("localidad_origen_descripcion")}
                                            >
                                                Localidad
                                            </TableSortLabel>
                                        </TableCell>

                                        <TableCell>
                                            <TableSortLabel
                                                active={orderByMovimiento === "usuario"}
                                                direction={orderByMovimiento === "usuario" ? orderMovimiento : "asc"}
                                                onClick={() => handleSortMovimiento("usuario")}
                                            >
                                                Usuario
                                            </TableSortLabel>
                                        </TableCell>

                                        <TableCell
                                            align="center"
                                        >
                                            Acción
                                        </TableCell>

                                    </TableRow>

                                </TableHead>


                                <TableBody>

                                    {loadingMovimientos ? (

                                        <TableRow>

                                            <TableCell
                                                colSpan={11}
                                                align="center"
                                                sx={{ py: 5 }}
                                            >

                                                <CircularProgress
                                                    size={28}
                                                />

                                            </TableCell>

                                        </TableRow>

                                    ) : movimientosFiltrados.length === 0 ? (

                                        <TableRow>

                                            <TableCell
                                                colSpan={11}
                                                align="center"
                                                sx={{ py: 5 }}
                                            >

                                                No hay movimientos

                                            </TableCell>

                                        </TableRow>

                                    ) : (

                                        movimientosPaginados.map(item => {

                                            // pendientes ya viene filtrado por el backend a solo
                                            // 'generacion' / 'reserva_componente_excedente' con
                                            // estatus 'sin_procesar' — no hace falta repetir el
                                            // filtro de tipo aquí (antes solo contemplaba
                                            // 'generacion' y dejaba fuera las reservas de stock).
                                            const pendiente =
                                                pendientes.some(
                                                    p =>
                                                        p.movimiento_id ===
                                                        item.movimiento_id
                                                );

                                            return (

                                                <TableRow
                                                    key={item.movimiento_id}
                                                    hover
                                                >

                                                    <TableCell>

                                                        {item.fecha_movimiento
                                                            ? new Date(
                                                                item.fecha_movimiento
                                                            ).toLocaleString(
                                                                "es-MX"
                                                            )
                                                            : "-"
                                                        }

                                                    </TableCell>


                                                    <TableCell>

                                                        <Typography
                                                            fontWeight={700}
                                                            fontSize={13}
                                                        >
                                                            {item.sku}
                                                        </Typography>

                                                    </TableCell>


                                                    <TableCell>

                                                        {item.descripcion}

                                                    </TableCell>


                                                    <TableCell>

                                                        {renderOrigen(item)}

                                                    </TableCell>

                                                    <TableCell>
                                                        {item.orden_id ? (
                                                            <Stack spacing={0.5}>
                                                                <Typography variant="caption" fontWeight={700}>OP #{item.orden_id}</Typography>
                                                                {renderEstadoOrden(item.orden_estatus)}
                                                            </Stack>
                                                        ) : (
                                                            <Typography variant="caption" color="text.secondary">-</Typography>
                                                        )}
                                                    </TableCell>


                                                    <TableCell
                                                        align="right"
                                                    >

                                                        <Typography
                                                            fontWeight={700}
                                                        >
                                                            {Number(
                                                                item.cantidad
                                                            ).toLocaleString()}
                                                        </Typography>

                                                    </TableCell>


                                                    <TableCell>

                                                        {renderTipoMovimiento(
                                                            item.tipo_movimiento
                                                        )}

                                                    </TableCell>

                                                    <TableCell>

                                                        {item.tipo_movimiento === "reserva_componente_excedente" ? (

                                                            renderEstadoReserva(item)

                                                        ) : (

                                                            <Stack
                                                                direction="row"
                                                                spacing={1}
                                                                flexWrap="wrap"
                                                                useFlexGap
                                                            >

                                                                {pendiente && (

                                                                    <Chip
                                                                        size="small"
                                                                        color="warning"
                                                                        label="Pendiente"
                                                                    />

                                                                )}

                                                                {item.estatus === "procesado" && (

                                                                    <Chip
                                                                        size="small"
                                                                        color="success"
                                                                        label="Procesado"
                                                                    />

                                                                )}

                                                                {item.estatus === "cancelado" && (

                                                                    <Chip
                                                                        size="small"
                                                                        icon={<CancelIcon />}
                                                                        label="Cancelado"
                                                                    />

                                                                )}

                                                                {!pendiente &&
                                                                    item.estatus !== "procesado" &&
                                                                    item.estatus !== "cancelado" && (

                                                                        <Typography variant="caption" color="text.secondary">
                                                                            -
                                                                        </Typography>

                                                                    )}

                                                            </Stack>

                                                        )}

                                                    </TableCell>


                                                    <TableCell>

                                                        {
                                                            item.localidad_origen_descripcion ||
                                                            "-"
                                                        }

                                                    </TableCell>


                                                    <TableCell>

                                                        {item.usuario}

                                                    </TableCell>


                                                    <TableCell
                                                        align="center"
                                                    >

                                                        {pendiente ? (

                                                            <Stack
                                                                direction="row"
                                                                justifyContent="center"
                                                            >

                                                                {/*
                                                    Las reservas de stock (cobertura para una
                                                    orden) se confirman desde el panel
                                                    "Armar kit(s)" en el detalle de la orden en
                                                    Envíos — ahí es donde se calcula cuántos
                                                    kits se pueden armar. Aquí solo se pueden
                                                    cancelar.
                                                */}
                                                                {item.tipo_movimiento !== "reserva_componente_excedente" && (

                                                                    <Tooltip
                                                                        title="Revisar excedente"
                                                                    >

                                                                        <IconButton
                                                                            color="warning"
                                                                            onClick={() =>
                                                                                abrirProcesar(
                                                                                    item
                                                                                )
                                                                            }
                                                                        >

                                                                            <EditIcon />

                                                                        </IconButton>

                                                                    </Tooltip>

                                                                )}


                                                                <Tooltip
                                                                    title={
                                                                        item.tipo_movimiento === "reserva_componente_excedente"
                                                                            ? "Cancelar reserva (confírmala desde el detalle de la orden en Envíos si sí se va a usar)"
                                                                            : "Cancelar excedente"
                                                                    }
                                                                >

                                                                    <IconButton
                                                                        color="error"
                                                                        onClick={() =>
                                                                            cancelarExcedente(
                                                                                item
                                                                            )
                                                                        }
                                                                    >

                                                                        <CancelIcon />

                                                                    </IconButton>

                                                                </Tooltip>

                                                            </Stack>

                                                        ) : (

                                                            <Tooltip
                                                                title="Ver movimiento"
                                                            >

                                                                <IconButton>

                                                                    <VisibilityIcon />

                                                                </IconButton>

                                                            </Tooltip>

                                                        )}

                                                    </TableCell>

                                                </TableRow>

                                            );

                                        })

                                    )}

                                </TableBody>

                            </Table>

                        </TableContainer>

                        <TablePagination
                            rowsPerPageOptions={[5, 10, 25, 50]}
                            component="div"
                            count={movimientosOrdenados.length}
                            rowsPerPage={rowsPerPageMovimiento}
                            page={pageMovimiento}
                            onPageChange={handleChangePageMovimiento}
                            onRowsPerPageChange={handleChangeRowsPerPageMovimiento}
                            labelRowsPerPage="Filas por página:"
                            labelDisplayedRows={({ from, to, count }) =>
                                `${from}–${to} de ${count !== -1 ? count : `más de ${to}`}`
                            }
                        />

                    </Box>

                )}

                {tab === 2 && (

                    <Box sx={{ p: 2 }}>

                        <Alert severity="info" sx={{ mb: 2 }}>
                            Aquí aparecen los componentes que un surtidor ya solicitó desde
                            la pantalla de Surtido. Ve al lugar indicado, recolecta la cantidad
                            señalada y da clic en "Marcar como entregado" cuando se lo hayas
                            dado en mano al surtidor.
                        </Alert>

                        <TableContainer>

                            <Table size="small">

                                <TableHead>

                                    <TableRow>

                                        <TableCell>
                                            <TableSortLabel
                                                active={orderBySolicitud === "solicitado_en"}
                                                direction={orderBySolicitud === "solicitado_en" ? orderSolicitud : "asc"}
                                                onClick={() => handleSortSolicitud("solicitado_en")}
                                            >
                                                Solicitado
                                            </TableSortLabel>
                                        </TableCell>
                                        <TableCell>
                                            <TableSortLabel
                                                active={orderBySolicitud === "sku"}
                                                direction={orderBySolicitud === "sku" ? orderSolicitud : "asc"}
                                                onClick={() => handleSortSolicitud("sku")}
                                            >
                                                SKU
                                            </TableSortLabel>
                                        </TableCell>
                                        <TableCell>
                                            <TableSortLabel
                                                active={orderBySolicitud === "descripcion"}
                                                direction={orderBySolicitud === "descripcion" ? orderSolicitud : "asc"}
                                                onClick={() => handleSortSolicitud("descripcion")}
                                            >
                                                Descripción
                                            </TableSortLabel>
                                        </TableCell>
                                        <TableCell>
                                            <TableSortLabel
                                                active={orderBySolicitud === "localidad_descripcion"}
                                                direction={orderBySolicitud === "localidad_descripcion" ? orderSolicitud : "asc"}
                                                onClick={() => handleSortSolicitud("localidad_descripcion")}
                                            >
                                                Ubicación
                                            </TableSortLabel>
                                        </TableCell>
                                        <TableCell align="right">
                                            <TableSortLabel
                                                active={orderBySolicitud === "cantidad"}
                                                direction={orderBySolicitud === "cantidad" ? orderSolicitud : "asc"}
                                                onClick={() => handleSortSolicitud("cantidad")}
                                            >
                                                Cantidad
                                            </TableSortLabel>
                                        </TableCell>
                                        <TableCell>
                                            <TableSortLabel
                                                active={orderBySolicitud === "orden_id"}
                                                direction={orderBySolicitud === "orden_id" ? orderSolicitud : "asc"}
                                                onClick={() => handleSortSolicitud("orden_id")}
                                            >
                                                Orden
                                            </TableSortLabel>
                                        </TableCell>
                                        <TableCell align="center">Acción</TableCell>

                                    </TableRow>

                                </TableHead>

                                <TableBody>

                                    {loadingSolicitudes ? (

                                        <TableRow>

                                            <TableCell colSpan={7} align="center" sx={{ py: 5 }}>

                                                <CircularProgress size={28} />

                                            </TableCell>

                                        </TableRow>

                                    ) : solicitudesSurtido.length === 0 ? (

                                        <TableRow>

                                            <TableCell colSpan={7} align="center" sx={{ py: 5 }}>

                                                No hay solicitudes pendientes de entregar

                                            </TableCell>

                                        </TableRow>

                                    ) : (

                                        solicitudesPaginadas.map((item) => (

                                            <TableRow key={item.movimiento_id} hover>

                                                <TableCell>
                                                    {item.solicitado_en
                                                        ? new Date(item.solicitado_en).toLocaleString("es-MX")
                                                        : "-"}
                                                </TableCell>

                                                <TableCell>
                                                    <Typography fontWeight={700} fontSize={13}>
                                                        {item.sku}
                                                    </Typography>
                                                </TableCell>

                                                <TableCell>{item.descripcion}</TableCell>

                                                <TableCell>
                                                    {item.localidad_descripcion || "-"}
                                                    {item.bodega_nombre ? ` (${item.bodega_nombre})` : ""}
                                                </TableCell>

                                                <TableCell align="right">
                                                    <Typography fontWeight={700}>
                                                        {Number(item.cantidad).toLocaleString()}
                                                    </Typography>
                                                </TableCell>

                                                <TableCell>#{item.orden_id}</TableCell>

                                                <TableCell align="center">
                                                    <Button
                                                        size="small"
                                                        variant="contained"
                                                        color="success"
                                                        disabled={entregandoId === item.movimiento_id}
                                                        onClick={() =>
                                                            entregarStockComponente(item.movimiento_id)
                                                        }
                                                    >
                                                        {entregandoId === item.movimiento_id
                                                            ? "Guardando..."
                                                            : "Marcar como entregado"}
                                                    </Button>
                                                </TableCell>

                                            </TableRow>

                                        ))

                                    )}

                                </TableBody>

                            </Table>

                        </TableContainer>

                        <TablePagination
                            rowsPerPageOptions={[5, 10, 25, 50]}
                            component="div"
                            count={solicitudesOrdenadas.length}
                            rowsPerPage={rowsPerPageSolicitud}
                            page={pageSolicitud}
                            onPageChange={handleChangePageSolicitud}
                            onRowsPerPageChange={handleChangeRowsPerPageSolicitud}
                            labelRowsPerPage="Filas por página:"
                            labelDisplayedRows={({ from, to, count }) =>
                                `${from}–${to} de ${count !== -1 ? count : `más de ${to}`}`
                            }
                        />

                    </Box>

                )}

            </Paper>


            {/* ==================================================
                DIALOG AJUSTE
            ================================================== */}

            <Dialog
                id={"dialog-ajuste"}
                open={openAjuste}
                onClose={() => setOpenAjuste(false)}
                maxWidth="sm"
                fullWidth
            >

                <DialogTitle>

                    Ajustar existencia

                </DialogTitle>


                <DialogContent>

                    {stockSeleccionado && (

                        <Stack
                            spacing={2}
                            sx={{ pt: 1 }}
                        >

                            <Paper
                                variant="outlined"
                                sx={{ p: 2 }}
                            >

                                <Typography
                                    fontWeight={700}
                                >
                                    {stockSeleccionado.sku}
                                </Typography>

                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    {stockSeleccionado.descripcion}
                                </Typography>

                                <Divider
                                    sx={{ my: 1.5 }}
                                />

                                <Typography
                                    variant="body2"
                                >
                                    Localidad:{" "}
                                    <b>
                                        {
                                            stockSeleccionado.localidad_descripcion
                                        }
                                    </b>
                                </Typography>

                                <Typography
                                    variant="body2"
                                >
                                    Stock actual:{" "}
                                    <b>
                                        {
                                            stockSeleccionado.cantidad
                                        }
                                    </b>
                                </Typography>

                            </Paper>


                            <TextField
                                label="Nueva existencia"
                                type="number"
                                fullWidth
                                value={cantidadAjuste}
                                onChange={(e) =>
                                    setCantidadAjuste(
                                        e.target.value
                                    )
                                }
                                inputProps={{
                                    min: 0,
                                    step: 1
                                }}
                                autoFocus
                            />


                            <TextField
                                label="Comentario"
                                multiline
                                minRows={2}
                                fullWidth
                                value={comentarioAjuste}
                                onChange={(e) =>
                                    setComentarioAjuste(
                                        e.target.value
                                    )
                                }
                            />

                        </Stack>

                    )}

                </DialogContent>


                <DialogActions>

                    <Button
                        onClick={() =>
                            setOpenAjuste(false)
                        }
                    >
                        Cancelar
                    </Button>

                    <Button
                        variant="contained"
                        startIcon={<CheckCircleIcon />}
                        onClick={guardarAjuste}
                    >
                        Guardar ajuste
                    </Button>

                </DialogActions>

            </Dialog>


            {/* ==================================================
                DIALOG PROCESAR EXCEDENTE
            ================================================== */}

            <Dialog
                open={openProcesar}
                onClose={() => setOpenProcesar(false)}
                maxWidth="sm"
                fullWidth
            >

                <DialogTitle>

                    Confirmar excedente

                </DialogTitle>


                <DialogContent>

                    {movimientoSeleccionado && (

                        <Stack
                            spacing={2}
                            sx={{ pt: 1 }}
                        >

                            <Alert
                                severity="warning"
                            >

                                Este excedente todavía
                                <b> no forma parte del stock real</b>.

                                <br />

                                Al confirmar se agregará
                                la cantidad indicada a
                                <b> Existencia de componentes</b>.

                            </Alert>


                            <Paper
                                variant="outlined"
                                sx={{ p: 2 }}
                            >

                                <Typography
                                    fontWeight={700}
                                >
                                    {movimientoSeleccionado.sku}
                                </Typography>

                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    {
                                        movimientoSeleccionado.descripcion
                                    }
                                </Typography>

                                <Divider
                                    sx={{ my: 1.5 }}
                                />

                                <Typography
                                    variant="body2"
                                >
                                    Localidad:{" "}
                                    <b>
                                        {
                                            movimientoSeleccionado.localidad_origen_descripcion
                                        }
                                    </b>
                                </Typography>

                                <Typography
                                    variant="body2"
                                >
                                    Cantidad generada:{" "}
                                    <b>
                                        {
                                            movimientoSeleccionado.cantidad
                                        }
                                    </b>
                                </Typography>

                                {(movimientoSeleccionado.proforma_id ||
                                    movimientoSeleccionado.envio_id) && (

                                        <>

                                            <Divider
                                                sx={{ my: 1.5 }}
                                            />

                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                                sx={{
                                                    textTransform: "uppercase",
                                                    letterSpacing: 0.5
                                                }}
                                            >
                                                Origen del excedente
                                            </Typography>

                                            {movimientoSeleccionado.proforma_id && (

                                                <Typography
                                                    variant="body2"
                                                    sx={{ mt: 0.5 }}
                                                >
                                                    Proforma:{" "}
                                                    <b>
                                                        {movimientoSeleccionado.proforma_titulo || `#${movimientoSeleccionado.proforma_id}`}
                                                    </b>
                                                </Typography>

                                            )}

                                            {movimientoSeleccionado.envio_id && (

                                                <Typography
                                                    variant="body2"
                                                >
                                                    Envío:{" "}
                                                    <b>
                                                        {movimientoSeleccionado.folio_interno || `#${movimientoSeleccionado.envio_id}`}
                                                    </b>
                                                </Typography>

                                            )}

                                        </>

                                    )}

                            </Paper>


                            <TextField
                                label="Cantidad a confirmar"
                                type="number"
                                fullWidth
                                value={cantidadProcesar}
                                onChange={(e) =>
                                    setCantidadProcesar(
                                        e.target.value
                                    )
                                }
                                inputProps={{
                                    min: 1,
                                    max:
                                        movimientoSeleccionado.cantidad,
                                    step: 1
                                }}
                                autoFocus
                            />


                            {Number(cantidadProcesar) <
                                Number(
                                    movimientoSeleccionado.cantidad
                                ) && (

                                    <Alert
                                        severity="info"
                                    >

                                        Las{" "}
                                        <b>
                                            {
                                                Number(
                                                    movimientoSeleccionado.cantidad
                                                ) -
                                                Number(
                                                    cantidadProcesar
                                                )
                                            }
                                        </b>{" "}
                                        unidades restantes
                                        serán registradas como
                                        cancelación.

                                    </Alert>

                                )}


                            <TextField
                                label="Comentario"
                                multiline
                                minRows={2}
                                fullWidth
                                value={comentarioProcesar}
                                onChange={(e) =>
                                    setComentarioProcesar(
                                        e.target.value
                                    )
                                }
                            />

                        </Stack>

                    )}

                </DialogContent>


                <DialogActions>

                    <Button
                        onClick={() =>
                            setOpenProcesar(false)
                        }
                    >
                        Cancelar
                    </Button>


                    <Button
                        color="error"
                        variant="outlined"
                        startIcon={<CancelIcon />}
                        onClick={() => {

                            setOpenProcesar(false);

                            if (movimientoSeleccionado) {
                                cancelarExcedente(
                                    movimientoSeleccionado
                                );
                            }

                        }}
                    >
                        Cancelar excedente
                    </Button>


                    <Button
                        color="success"
                        variant="contained"
                        startIcon={<CheckCircleIcon />}
                        onClick={procesarExcedente}
                    >
                        Confirmar excedente
                    </Button>

                </DialogActions>

            </Dialog>

            <Dialog open={legendaOpen} onClose={() => setLegendaOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>¿Qué significa cada estado?</DialogTitle>
                <DialogContent dividers>
                    <Typography variant="subtitle2" fontWeight={700} gutterBottom>Tipo de movimiento</Typography>
                    <Stack spacing={1.5} sx={{ mb: 3 }}>
                        <Stack direction="row" spacing={1.5} alignItems="flex-start">
                            {renderTipoMovimiento("generacion")}
                            <Typography variant="body2" color="text.secondary">Se generó un excedente de este componente (sobró stock físico que no se usó).</Typography>
                        </Stack>
                        <Stack direction="row" spacing={1.5} alignItems="flex-start">
                            {renderTipoMovimiento("reserva_componente_excedente")}
                            <Typography variant="body2" color="text.secondary">El MRP reservó stock existente de componentes para cubrir la necesidad de una orden de producción, en vez de generar una compra al proveedor.</Typography>
                        </Stack>
                        <Stack direction="row" spacing={1.5} alignItems="flex-start">
                            {renderTipoMovimiento("consumo")}
                            <Typography variant="body2" color="text.secondary">El excedente fue efectivamente utilizado (consumido) en producción.</Typography>
                        </Stack>
                        <Stack direction="row" spacing={1.5} alignItems="flex-start">
                            {renderTipoMovimiento("ajuste")}
                            <Typography variant="body2" color="text.secondary">Corrección manual de cantidad de un excedente (por conteo físico, error de captura, etc.).</Typography>
                        </Stack>
                        <Stack direction="row" spacing={1.5} alignItems="flex-start">
                            {renderTipoMovimiento("cancelacion")}
                            <Typography variant="body2" color="text.secondary">Movimiento manual de cancelación de un excedente que ya no está disponible o ya no aplica.</Typography>
                        </Stack>
                    </Stack>
                    <Divider sx={{ mb: 2 }} />
                    <Typography variant="subtitle2" fontWeight={700} gutterBottom>Estado de una reserva de stock</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Aplica solo a movimientos de tipo "Reserva de stock". Muestra en qué parte del proceso va la reserva, desde que el MRP la propone hasta que se confirma o se cancela.
                    </Typography>
                    <Stack spacing={1.5}>
                        {Object.values(ESTADOS_RESERVA_INFO).map((info) => (
                            <Stack key={info.label} direction="row" spacing={1.5} alignItems="flex-start">
                                <Chip size="small" icon={info.icon} label={info.label} color={info.color} />
                                <Typography variant="body2" color="text.secondary">{info.descripcion}</Typography>
                            </Stack>
                        ))}
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setLegendaOpen(false)}>Cerrar</Button>
                </DialogActions>
            </Dialog>

        </Box>

    );

};

export default StockComponentes;