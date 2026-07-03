import axios from 'axios';
import React, { useEffect, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import dayjs from 'dayjs';
import { DataGrid, GridEditInputCell } from "@mui/x-data-grid";
import {
    Box,
    Grid,
    Typography,
    LinearProgress,
    Chip,
    Card,
    CardContent,
    Dialog,
    DialogTitle,
    DialogContent,
    Button,
    DialogActions,
    Tooltip,
    Switch
} from "@mui/material";
import { GridToolbar } from '@mui/x-data-grid';
import VisibilityIcon from '@mui/icons-material/Visibility';
import IconButton from '@mui/material/IconButton';
import DashboardIcon from '@mui/icons-material/Dashboard';
import DashboardFactura from './DashboardFactura';

const EnviosProgresoEmpaque = () => {

    const { envioId } = useParams();
    const location = useLocation();

    const [descripcionEnvio] = useState(location.state?.descripcionEnvio || '');

    const [totalPiezas, setTotalPiezas] = useState(0);
    const [totalPiezasEmpacadas, setTotalPiezasEmpacadas] = useState(0);
    const [facturasEnvio, setFacturasEnvio] = useState([]);
    const [totalOrdenRetiro, setTotalOrdenRetiro] = useState([]);
    const [ordenesProduccionFacturas, setOrdenesProduccionFacturas] = useState([]);
    const [ordenesProduccionRetiros, setOrdenesProduccionRetiros] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openModal, setOpenModal] = useState(false);
    const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);
    const [detalleOrden, setDetalleOrden] = useState([]);
    const [loadingDetalle, setLoadingDetalle] = useState(false);
    const [cajasProducto, setCajasProducto] = useState([]);
    const [loadingCajas, setLoadingCajas] = useState(false);
    const [facturaSeleccionada, setFacturaSeleccionada] = useState(null);

    const apiUrl =
        process.env.NODE_ENV === 'production'
            ? process.env.REACT_APP_API_URL
            : process.env.REACT_APP_API_URL_LOCAL;

    const dashboardGridSx = {
        border: "none",
        "& .MuiDataGrid-columnHeaders": {
            backgroundColor: "#f5f7fa",
            fontWeight: "bold",
            fontSize: 13,
        },
        "& .MuiDataGrid-cell": {
            borderBottom: "1px solid #eee",
            fontSize: 13,
        },
        "& .MuiDataGrid-row:hover": {
            backgroundColor: "#f9fafb",
        },
    };

    const handleCloseModal = () => {
        setOpenModal(false);
        setOrdenSeleccionada(null);
    };

    const fetchPiezasYFacturas = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${apiUrl}/empaque/getPiezasYFacturas/${envioId}`);
            setTotalPiezas(Number(response.data.total_piezas || []));
            setTotalPiezasEmpacadas(Number(response.data.total_piezas_empacadas || []));
            setFacturasEnvio(response.data.facturas);
            setTotalOrdenRetiro(response.data.totalOrdenRetiro);
            setOrdenesProduccionFacturas(response.data.ordenesProduccionFacturas);
            setOrdenesProduccionRetiros(response.data.ordenesProduccionRetiros);
            setLoading(false);
        } catch (error) {
            setLoading(false);
            const errorMessage = error.response?.data?.message || 'Error al cargar los datos';
            Swal.fire({
                title: 'Error',
                text: errorMessage,
                icon: 'warning',
                timer: 5000,
                showCloseButton: true,
                allowEscapeKey: true,
            });
        }
    };

    useEffect(() => {
        fetchPiezasYFacturas();
    }, [envioId]);

    const handleOpenModal = async (row) => {
        try {
            setLoadingDetalle(true);
            setOpenModal(true);
            setOrdenSeleccionada(row);

            const response = await axios.get(`${apiUrl}/empaque/getDetalleOrden/${row.id}`);
            setDetalleOrden(response.data.data);
            setLoadingDetalle(false);
        } catch (error) {
            setLoadingDetalle(false);
            Swal.fire("Error", "No se pudo cargar el detalle", "error");
        }
    };

    const detalleCols = [
        { field: "id", headerName: "ID Detalle", flex: 1 },
        { field: "orden_id", headerName: "ID Orden", flex: 1 },
        { field: "componente_id", headerName: "Componente", flex: 1 },
        { field: "sku", headerName: "SKU", flex: 2 },
        { field: "descripcion", headerName: "Descripción", flex: 3 },
        {
            field: "cantidad_billete", headerName: "MRP", flex: 2, type: "number",
            renderCell: (params) => {
                const value = Number(params.value || 0);
                return value;
            }
        },
        {
            field: "cantidad_facturada", headerName: "Requerida (Factura)", flex: 2, type: "number",
            renderCell: (params) => {
                const value = Number(params.value || 0);
                return value;
            }
        },
        { field: "cantidad_surtida", headerName: "Surtida", flex: 1, type: "number" },
        {
            field: "avance",
            headerName: "Avance",
            type: "number",
            flex: 1.5,
            renderCell: (params) => {
                const requeridas = Number(params.row.cantidad_facturada) || 0;
                const surtidas = Number(params.row.cantidad_surtida) || 0;

                const pct = requeridas > 0
                    ? Math.min(
                        100,
                        Math.max(
                            0,
                            Math.round((surtidas / requeridas) * 100)
                        )
                    )
                    : 0;

                return (
                    <Box sx={{ width: "100%" }}>
                        <Box
                            sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                mb: 0.5,
                            }}
                        >
                            <Typography variant="caption">{pct}%</Typography>
                            <Typography variant="caption">
                                {Math.round(surtidas)}/{Math.round(requeridas)}
                            </Typography>
                        </Box>
                        <LinearProgress
                            variant="determinate"
                            value={Number(pct)}
                            sx={{ height: 6, borderRadius: 4 }}
                        />
                    </Box>
                );
            },
        },
        {
            field: "estatus",
            headerName: "Estatus",
            flex: 1,
            renderCell: (params) => {
                const faltante =
                    (params.row.cantidad_facturada || 0) -
                    (params.row.cantidad_surtida || 0);

                let color = "success";
                let label = "Completo";

                if (faltante > 0) {
                    color = "warning";
                    label = "Pendiente";
                }

                return <Chip label={label} color={color} size="small" />;
            }
        }
    ];

    const handleVerDashboardFactura = (row) => {
        const facturaConEnvio = {
            ...row,
            envioId: Number(envioId) // <- Aquí le inyectas el envío directamente
        };

        setFacturaSeleccionada(facturaConEnvio);
    };

    const facturasCols = [
        {
            field: "habilitada",
            headerName: "Activa",
            width: 90,
            sortable: false,
            renderCell: (params) => (
                <Switch
                    checked={Boolean(params.row.habilitada)}
                    color="primary"
                //onChange={() => handleHabilitarFactura(params.row)}
                />
            )
        },
        { field: "factura_id", headerName: "#FacturaDB", flex: 1 },
        { field: "razon_social", headerName: "Proveedor", flex: 3 },
        { field: "numero_factura", headerName: "#Factura", flex: 1 },
        { field: "serie", headerName: "Serie", flex: 1 },
        { field: "folio", headerName: "Folio", flex: 1 },
        {
            field: "fecha_factura", headerName: "Fecha Factura", flex: 1.5, valueFormatter: (params) =>
                dayjs(params.value).format("DD/MM/YYYY"),
        },
        {
            field: "fecha_arribo", headerName: "Fecha Arribo", flex: 1.5, valueFormatter: (params) =>
                dayjs(params.value).format("DD/MM/YYYY"),
        },
        {
            field: "total_piezas",
            headerName: "Piezas",
            flex: 1,
            type: "number",
            valueFormatter: (value) => Math.round(Number(value ?? 0)),
        },
        {
            field: "total_piezas_surtidas",
            headerName: "Piezas Surtidas",
            flex: 1.5,
            type: "number",
            valueFormatter: (value) => Math.round(Number(value ?? 0)),
        },
        {
            field: "avance",
            headerName: "Avance",
            type: "number",
            flex: 2,
            renderCell: (params) => {
                const total = Number(params.row.total_piezas) || 0;
                const surtidas = Number(params.row.total_piezas_surtidas) || 0;

                const pct = total > 0
                    ? Math.min(
                        100,
                        Math.max(
                            0,
                            Math.round((surtidas / total) * 100)
                        )
                    )
                    : 0;

                return (
                    <Box sx={{ width: "100%" }}>
                        <Box
                            sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                mb: 0.5,
                            }}
                        >
                            <Typography variant="caption">{pct}%</Typography>
                            <Typography variant="caption">
                                {Math.round(surtidas)}/{Math.round(total)}
                            </Typography>
                        </Box>
                        <LinearProgress
                            variant="determinate"
                            value={Number(pct)}
                            sx={{ height: 6, borderRadius: 4 }}
                        />
                    </Box>
                );
            },
        },
        {
            field: "estatus",
            headerName: "Estatus",
            flex: 1.5,
            renderCell: (params) => {

                const total = Number(params.row.total_piezas);
                const surtidas = Number(params.row.total_piezas_surtidas);

                let label = "Disponible";
                let color = "default";

                if (params.row.habilitada) {

                    if (surtidas === 0) {

                        label = "En surtido";
                        color = "info";

                    } else if (surtidas < total) {

                        label = "Surtiendo";
                        color = "warning";

                    } else {

                        label = "Completa";
                        color = "success";

                    }

                }

                return (
                    <Chip
                        label={label}
                        color={color}
                        size="small"
                        sx={{ fontWeight: 600 }}
                    />
                );
            }
        },
        {
            field: "acciones",
            headerName: "Acciones",
            flex: 1,
            sortable: false,
            renderCell: (params) => (
                <Tooltip title="Abrir Dashboard de Factura">
                    <IconButton
                        color="primary"
                        size="small"
                        onClick={() => handleVerDashboardFactura(params.row)}
                    >
                        <DashboardIcon />
                    </IconButton>
                </Tooltip>
            )
        }
    ];

    const ordenesCols = [
        { field: "id", headerName: "#Orden Producción", flex: 1 },
        { field: "producto_id", headerName: "#Producto", flex: 1 },
        { field: "mlm", headerName: "MLM", flex: 1 },
        { field: "title", headerName: "Titulo", flex: 1 },
        { field: "inventory_id", headerName: "ML", flex: 1 },
        { field: "sku", headerName: "SKU", flex: 1 },
        {
            field: "logistic_type",
            headerName: "Logistica",
            flex: 1,
            renderCell: (params) => {
                const logisticType = params.value;
                const permitir_full = params.row.permitir_full;

                let color = "default";
                let labelText = logisticType; // Variable local para almacenar el texto sin mutar params

                if (logisticType === "fulfillment") {
                    color = "success";
                    labelText = "FULL";
                } else if (logisticType !== "fulfillment" && permitir_full === 1) {
                    color = "error"; // o "secondary" según tu configuración en la otra columna
                    labelText = "ME > FULL";
                } else if (logisticType !== "fulfillment" && permitir_full === 0) {
                    color = "warning";
                    labelText = "ME";
                }

                // Usamos labelText en lugar de params.value
                return <Chip label={labelText} size="small" color={color} />;
            }
        },
        {
            field: "cantidad_mrp", headerName: "Cantidad MRP", flex: 1, type: "number",
            valueFormatter: (value) => Math.round(value ?? 0)
        },
        {
            field: "cantidad_a_producir", headerName: "Factura", flex: 1, type: "number",
            valueFormatter: (value) => Math.round(value ?? 0)
        },
        {
            field: "cantidad_a_enviar", headerName: "A Enviar", flex: 1, headerAlign: "center", align: "center", type: "number",
            // ✅ SOLO editable si NO está empacada
            editable: (params) => params.row.estatus !== "empacada",

            valueFormatter: (value) => Math.round(Number(value ?? 0)),

            // ✅ SOLO aplicar estilo editable si NO está empacada
            cellClassName: (params) =>
                params.row.estatus !== "empacada" ? "celdaEditable" : "celdaBloqueada",

            renderEditCell: (params) => (
                <GridEditInputCell
                    {...params}
                    value={parseInt(params.value, 10 || 0)}
                    type="number"
                    inputProps={{ min: 0, step: 1 }}
                    onWheel={(e) => e.target.blur()}
                />
            ),
        },
        { field: "cantidad_empacada", headerName: "Empacada", flex: 1, type: "number", valueFormatter: (value) => Math.round(Number(value ?? 0)), },
        {
            field: "avance",
            headerName: "Avance",
            type: "number",
            flex: 1.5,
            renderCell: (params) => {
                const enviar = Number(params.row.cantidad_a_enviar) || 0;
                const empacadas = Number(params.row.cantidad_empacada) || 0;

                const pct = enviar > 0
                    ? Math.min(
                        100,
                        Math.max(
                            0,
                            Math.round((empacadas / enviar) * 100)
                        )
                    )
                    : 0;

                return (
                    <Box sx={{ width: "100%" }}>
                        <Box
                            sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                mb: 0.5,
                            }}
                        >
                            <Typography variant="caption">{pct}%</Typography>
                            <Typography variant="caption">
                                {Math.round(empacadas)}/{Math.round(enviar)}
                            </Typography>
                        </Box>
                        <LinearProgress
                            variant="determinate"
                            value={Number(pct)}
                            sx={{ height: 6, borderRadius: 4 }}
                        />
                    </Box>
                );
            },
        },
        {
            field: "estatus",
            headerName: "Estatus",
            flex: 1,
            renderCell: (params) => {
                const statusMap = {
                    recibido: {
                        label: "Recibida",
                        color: "default",   // gris
                    },
                    surtida: {
                        label: "Surtida",
                        color: "warning",   // amarillo
                    },
                    empacada: {
                        label: "Empacada",
                        color: "success",   // verde
                    },
                    cerrada: {
                        label: "Cerrada",
                        color: "secondary",   // red
                    },
                };

                const status = statusMap[params.value] || {
                    label: params.value,
                    color: "default",
                };

                return (
                    <Chip
                        label={status.label}
                        color={status.color}
                        size="small"
                        sx={{ fontWeight: 600 }}
                    />
                );
            },
        },
        {
            field: "acciones",
            headerName: "Acciones",
            width: 100,
            sortable: false,
            renderCell: (params) => (
                <IconButton
                    color="primary"
                    onClick={() => handleOpenModal(params.row)}
                >
                    <VisibilityIcon />
                </IconButton>
            )
        }
    ];

    const ordenesProduccionRetirosCols = [
        { field: "id", headerName: "#Orden Producción", flex: 1 },
        { field: "producto_id", headerName: "#Producto", flex: 1 },
        { field: "mlm", headerName: "MLM", flex: 1 },
        { field: "title", headerName: "Titulo", flex: 1 },
        { field: "inventory_id", headerName: "ML", flex: 1 },
        { field: "sku", headerName: "SKU", flex: 1 },
        {
            field: "logistic_type",
            headerName: "Logistica",
            flex: 1,
            renderCell: (params) => {
                const logisticType = params.value;
                const permitir_full = params.row.permitir_full;

                let color = "default";
                let labelText = logisticType; // Variable local para almacenar el texto sin mutar params

                if (logisticType === "fulfillment") {
                    color = "success";
                    labelText = "FULL";
                } else if (logisticType !== "fulfillment" && permitir_full === 1) {
                    color = "error"; // o "secondary" según tu configuración en la otra columna
                    labelText = "ME > FULL";
                } else if (logisticType !== "fulfillment" && permitir_full === 0) {
                    color = "warning";
                    labelText = "ME";
                }

                // Usamos labelText en lugar de params.value
                return <Chip label={labelText} size="small" color={color} />;
            }
        },
        { field: "cantidad_a_producir", headerName: "A Producir", flex: 1, type: "number", valueFormatter: (value) => Math.round(Number(value ?? 0)), },
        {
            field: "cantidad_a_enviar", headerName: "A Enviar", flex: 1, headerAlign: "center", align: "center", type: "number", valueFormatter: (value) => Math.round(Number(value ?? 0)),
        },
        { field: "cantidad_empacada", headerName: "Empacada", flex: 1, type: "number", valueFormatter: (value) => Math.round(Number(value ?? 0)), },
        {
            field: "avance",
            headerName: "Avance",
            flex: 1.5,
            type: "number",
            renderCell: (params) => {
                const enviar = Number(params.row.cantidad_a_enviar) || 0;
                const empacadas = Number(params.row.cantidad_empacada) || 0;

                const pct = enviar > 0
                    ? Math.min(
                        100,
                        Math.max(
                            0,
                            Math.round((empacadas / enviar) * 100)
                        )
                    )
                    : 0;

                return (
                    <Box sx={{ width: "100%" }}>
                        <Box
                            sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                mb: 0.5,
                            }}
                        >
                            <Typography variant="caption">{pct}%</Typography>
                            <Typography variant="caption">
                                {Math.round(empacadas)}/{Math.round(enviar)}
                            </Typography>
                        </Box>
                        <LinearProgress
                            variant="determinate"
                            value={Number(pct)}
                            sx={{ height: 6, borderRadius: 4 }}
                        />
                    </Box>
                );
            },
        },
        {
            field: "estatus",
            headerName: "Estatus",
            flex: 1,
            renderCell: (params) => {
                const statusMap = {
                    recibida: {
                        label: "Recibida",
                        color: "default",   // gris
                    },
                    surtida: {
                        label: "Surtida",
                        color: "warning",   // amarillo
                    },
                    empacada: {
                        label: "Empacada",
                        color: "success",   // verde
                    },
                    cerrada: {
                        label: "Cerrada",
                        color: "secondary",   // red
                    },
                };

                const status = statusMap[params.value] || {
                    label: params.value,
                    color: "default",
                };

                return (
                    <Chip
                        label={status.label}
                        color={status.color}
                        size="small"
                        sx={{ fontWeight: 600 }}
                    />
                );
            },
        },
        {
            field: "acciones",
            headerName: "Acciones",
            width: 100,
            sortable: false,
            renderCell: (params) => (
                <IconButton
                    color="primary"
                    onClick={() => handleOpenModal(params.row)}
                >
                    <VisibilityIcon />
                </IconButton>
            )
        }
    ];

    const ordenesDeRetiros = [
        { field: "orden_bodega_id", headerName: "#Orden Bodega", flex: 1 },
        { field: "orden_bodega_descripcion", headerName: "Descripción", flex: 2 },
        {
            field: "fecha_orden", headerName: "Fecha", flex: 1, valueFormatter: (params) =>
                dayjs(params.value).format("DD/MM/YYYY"),
        },
        { field: "total_a_enviar", headerName: "A Enviar", flex: 1, valueFormatter: (value) => Math.round(Number(value ?? 0)), },
        { field: "total_empacado", headerName: "Empacado", flex: 1, valueFormatter: (value) => Math.round(Number(value ?? 0)), },
        {
            field: "avance",
            headerName: "Avance",
            flex: 1.5,
            renderCell: (params) => {
                const pct =
                    Number(params.row.total_a_enviar > 0)
                        ? Math.round(
                            (Number(params.row.total_empacado) / Number(params.row.total_a_enviar)) * 100
                        )
                        : 0;

                return (
                    <Box sx={{ width: "100%" }}>
                        <Box
                            sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                mb: 0.5,
                            }}
                        >
                            <Typography variant="caption">{Number(pct)}%</Typography>
                            <Typography variant="caption">
                                {Math.round(params.row.total_empacado)}/{Math.round(params.row.total_a_enviar)}
                            </Typography>
                        </Box>
                        <LinearProgress
                            variant="determinate"
                            value={Number(pct)}
                            sx={{ height: 6, borderRadius: 4 }}
                        />
                    </Box>
                );
            },
        },
        {
            field: "orden_bodega_estatus",
            headerName: "Estatus",
            flex: 1,
            renderCell: (params) => {
                const statusMap = {
                    abierto: {
                        label: "Abierto",
                        color: "default",   // gris
                    },
                    confirmado: {
                        label: "Confirmado",
                        color: "warning",   // amarillo
                    },
                    procesado: {
                        label: "Procesado",
                        color: "success",   // verde
                    },
                    cancelado: {
                        label: "Cancelado",
                        color: "secondary",   // red
                    },
                };

                const status = statusMap[params.value] || {
                    label: params.value,
                    color: "default",
                };

                return (
                    <Chip
                        label={status.label}
                        color={status.color}
                        size="small"
                        sx={{ fontWeight: 600 }}
                    />
                );
            },
        },
    ]

    const [columnVisibilityOrdenesFacturas, setColumnVisibilityModelOrdenesFacturas] = useState({
        id: false,
        producto_id: false,
        permitir_full: false,
    });

    const [columnVisibilityOrdenesRetiros, setColumnVisibilityModelOrdenesRetiros] = useState({
        id: false,
        producto_id: false,
        permitir_full: false,
    });

    const [columnVisibilityFacturas, setColumnVisibilityModelFacturas] = useState({
        factura_id: false,
    });

    const [columnVisibilityRetiros, setColumnVisibilityModelRetiros] = useState({
        orden_bodega_id: true,
    });

    const [columnVisibilityDetalles, setColumnVisibilityDetalles] = useState({
        id: false,
        orden_id: false,
        componente_id: false
    });

    const processRowUpdate = async (newRow, oldRow) => {
        if (newRow.cantidad_a_enviar < 0) {
            Swal.fire("Valor inválido", "La cantidad no puede ser negativa", "warning");
            return oldRow;
        }

        if (newRow.cantidad_a_enviar < newRow.cantidad_empacada) {
            Swal.fire(
                "Valor inválido",
                "No puede ser menor a la cantidad empacada",
                "warning"
            );
            return oldRow;
        }

        if (newRow.cantidad_a_enviar > oldRow.cantidad_a_producir) {
            Swal.fire(
                "Valor inválido",
                "No puede ser mayor a la cantidad a producir",
                "warning"
            );
            return oldRow;
        }

        if (newRow.cantidad_a_enviar === oldRow.cantidad_a_enviar) {
            return oldRow;
        }

        try {
            await axios.put(
                `${apiUrl}/produccion/actualizar/orden/${newRow.id}/cantidad-a-enviar`,
                {
                    cantidad_a_enviar: newRow.cantidad_a_enviar
                }
            );

            await fetchPiezasYFacturas();

            Swal.fire({
                icon: "success",
                title: "Actualizado",
                text: "Cantidad a enviar actualizada correctamente",
                timer: 1200,
                showConfirmButton: false
            });

            return newRow;
        } catch (error) {
            Swal.fire(
                "Error",
                "No se pudo actualizar la orden",
                "error"
            );
            return oldRow;
        }
    };

    const handleProcessRowUpdateError = (error) => {
        Swal.fire({
            icon: "warning",
            title: "Error",
            text: error.message,
        });
    };

    useEffect(() => {
        const fetchCajasDelProducto = async () => {
            // Asegúrate de tener el id de la orden/producto y el id del envío actual
            if (!ordenSeleccionada || !envioId) return;

            setLoadingCajas(true);
            try {
                // Reemplaza con la URL real de tu backend
                const response = await axios.get(
                    `${apiUrl}/empaque/buscarProductoCajas/envio/${envioId}/producto/${ordenSeleccionada.producto_id}`
                );

                if (response.data && response.data.ok) {
                    // Mapeamos los datos para asegurar que tengan un ID único para el DataGrid
                    const dataConId = response.data.data.map((row, index) => ({
                        ...row,
                        id: row.caja_id // Usamos caja_id como llave primaria única
                    }));
                    setCajasProducto(dataConId);
                }
            } catch (error) {
                console.error("Error al buscar las cajas del producto:", error);
                setCajasProducto([]);
            } finally {
                setLoadingCajas(false);
            }
        };

        if (openModal) {
            fetchCajasDelProducto();
        }
    }, [openModal, ordenSeleccionada]);

    const cajasCols = [
        {
            field: 'caja_visual_id',
            headerName: '# Caja',
            flex: 1,
            minWidth: 120,
            renderCell: (params) => (
                <Chip label={`📦 Caja #${params.value}`} color="primary" variant="outlined" size="small" />
            )
        },
        {
            field: 'tarima_visual_id',
            headerName: '# Tarima',
            flex: 1,
            minWidth: 120,
            renderCell: (params) => params.value ? `Tarima #${params.value}` : 'Sin Asignar'
        },
        {
            field: 'caja_estatus',
            headerName: 'Estatus Caja',
            flex: 1,
            minWidth: 120,
            renderCell: (params) => (
                <Chip
                    label={params.value.toUpperCase()}
                    color={params.value === 'cerrada' ? 'secondary' : 'warning'}
                    size="small"
                />
            )
        },
        {
            field: 'cantidad_total',
            headerName: 'Cantidad Empacada',
            flex: 1,
            minWidth: 150,
            type: 'number',
            renderCell: (params) => (
                <strong>{params.value} pzas</strong>
            )
        }
    ];

    // ... dentro de EnviosProgresoEmpaque, antes del return:

    const totalCantidadAEnviar = ordenesProduccionFacturas.reduce(
        (sum, row) => sum + (Number(row.cantidad_a_enviar) || 0),
        0
    );

    return (
        <Box p={3}>
            <Typography variant="h4" fontWeight="bold" mb={2}>
                Dashboard de Envío
            </Typography>

            <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                    <Card
                        sx={{
                            borderRadius: 2,
                            boxShadow: 2,
                            transition: "transform 0.2s",
                            "&:hover": { transform: "scale(1.02)" },
                        }}
                    >
                        <CardContent>
                            <Typography variant="subtitle2" color="text.secondary">
                                Envío
                            </Typography>
                            <Typography variant="h6">{descripcionEnvio || `ID: ${envioId}`}</Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Card
                        sx={{
                            borderRadius: 2,
                            boxShadow: 2,
                            transition: "transform 0.2s",
                            "&:hover": { transform: "scale(1.02)" },
                        }}
                    >
                        <CardContent>
                            <Typography variant="subtitle2" color="text.secondary">
                                Progreso del envío
                            </Typography>
                            <Typography variant="h6">
                                {totalPiezas > 0
                                    ? Math.round((totalPiezasEmpacadas / totalPiezas) * 100)
                                    : 0}
                                %
                            </Typography>
                            <LinearProgress
                                variant="determinate"
                                value={
                                    totalPiezas > 0
                                        ? (totalPiezasEmpacadas / totalPiezas) * 100
                                        : 0
                                }
                            />
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Card
                        sx={{
                            borderRadius: 2,
                            boxShadow: 2,
                            transition: "transform 0.2s",
                            "&:hover": { transform: "scale(1.02)" },
                        }}
                    >
                        <CardContent>
                            <Typography variant="subtitle2" color="text.secondary">
                                Resumen
                            </Typography>
                            <Typography>Total piezas: {totalPiezas}</Typography>
                            <Typography>Empacadas: {totalPiezasEmpacadas}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
            <Typography variant="h6" fontWeight="bold" mb={2}>
                Facturas del envío
            </Typography>
            <DataGrid
                rows={facturasEnvio}
                columns={facturasCols}
                getRowId={(row) => row.factura_id}
                showCellVerticalBorder
                showColumnVerticalBorder
                columnVisibilityModel={columnVisibilityFacturas}
                onColumnVisibilityModelChange={(newModel) => setColumnVisibilityModelFacturas(newModel)}
                disableRowSelectionOnClick
                hideFooterSelectedRowCount
                density="compact"
                pageSizeOptions={[10, 25, 50, 100]}
                initialState={{
                    pagination: { paginationModel: { pageSize: 100, page: 0 } }
                }}
                sx={{ ...dashboardGridSx, mb: 4 }}
                slots={{ toolbar: GridToolbar }}
                loading={loading}
                slotProps={{
                    loadingOverlay: {
                        variant: 'skeleton',
                        noRowsVariant: 'skeleton',
                    },
                }}
            />
            {facturaSeleccionada && (
                <Box mt={4}>
                    <DashboardFactura
                        factura={facturaSeleccionada}
                        onBack={() => setFacturaSeleccionada(null)}
                    />
                </Box>
            )}
            {/* SECCIÓN CORREGIDA: Alineación exacta y solución al montado de tablas */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%',
                    mb: 1,
                    mt: 1
                }}
            >
                {/* Título: ocupa el espacio izquierdo hasta llegar al área de las sumas */}
                <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" fontWeight="bold">
                        Ordenes de Producción - Facturas
                    </Typography>
                </Box>

                {/* Contenedor del Total: Ajustado con un margen derecho preciso (18%) para centrarse sobre "A Enviar" */}
                <Box sx={{ mr: '34%', display: 'flex', justifyContent: 'center' }}>
                    <Box
                        sx={{
                            backgroundColor: '#e3f2fd',
                            border: '1px solid #90caf9',
                            borderRadius: '4px',
                            px: 3,
                            py: 0.5,
                            minWidth: '110px',
                            textAlign: 'center',
                            boxShadow: '0px 1px 3px rgba(0,0,0,0.08)'
                        }}
                    >
                        <Typography variant="caption" display="block" color="text.secondary" fontWeight="bold" sx={{ textTransform: 'uppercase', fontSize: 9, tracking: 0.5 }}>
                            Total A Enviar
                        </Typography>
                        <Typography variant="subtitle1" fontWeight="bold" color="primary.main" style={{ lineHeight: 1.2 }}>
                            {Math.round(totalCantidadAEnviar)}
                        </Typography>
                    </Box>
                </Box>
            </Box>

            {/* Contenedor DataGrid corregido (Eliminado sx redundante para evitar encimado) */}
            <Box sx={{ height: 400, width: '100%', mb: 10 }}>
                <DataGrid
                    rows={ordenesProduccionFacturas}
                    columns={ordenesCols}
                    getRowId={(row) => row.id}
                    experimentalFeatures={{ newEditingApi: true }}
                    showCellVerticalBorder
                    showColumnVerticalBorder
                    processRowUpdate={processRowUpdate}
                    onProcessRowUpdateError={handleProcessRowUpdateError}
                    isCellEditable={(params) => {
                        if (params.row.estatus === "empacada") return false;
                        if (params.field === "cantidad_a_enviar") return true;
                        return true;
                    }}
                    columnVisibilityModel={columnVisibilityOrdenesFacturas}
                    onColumnVisibilityModelChange={(newModel) => setColumnVisibilityModelOrdenesFacturas(newModel)}
                    disableRowSelectionOnClick
                    hideFooterSelectedRowCount
                    density="compact"
                    pageSizeOptions={[10, 25, 50, 100]}
                    initialState={{
                        pagination: { paginationModel: { pageSize: 100, page: 0 } }
                    }}
                    sx={dashboardGridSx}
                    slots={{ toolbar: GridToolbar }}
                    loading={loading}
                    slotProps={{
                        loadingOverlay: {
                            variant: 'skeleton',
                            noRowsVariant: 'skeleton',
                        },
                    }}
                />
            </Box>

            <Typography variant="h6" fontWeight="bold" mb={2} mt={15}>
                Ordenes de Producción - Retiros
            </Typography>
            <DataGrid
                rows={ordenesProduccionRetiros}
                columns={ordenesProduccionRetirosCols}
                getRowId={(row) => row.id}
                showCellVerticalBorder
                showColumnVerticalBorder
                columnVisibilityModel={columnVisibilityOrdenesRetiros}
                onColumnVisibilityModelChange={(newModel) => setColumnVisibilityModelOrdenesRetiros(newModel)}
                disableRowSelectionOnClick
                hideFooterSelectedRowCount
                density="compact"
                pageSizeOptions={[10, 25, 50, 100]}
                initialState={{
                    pagination: { paginationModel: { pageSize: 100, page: 0 } }
                }}
                sx={{ ...dashboardGridSx }}
                slots={{ toolbar: GridToolbar }}
                loading={loading}
                slotProps={{
                    loadingOverlay: {
                        variant: 'skeleton',
                        noRowsVariant: 'skeleton',
                    },
                }}
            />

            <Typography variant="h6" fontWeight="bold" mb={2}>
                Retiros
            </Typography>
            <DataGrid
                rows={totalOrdenRetiro}
                columns={ordenesDeRetiros}
                getRowId={(row) => row.orden_bodega_id}
                showCellVerticalBorder
                showColumnVerticalBorder
                columnVisibilityModel={columnVisibilityRetiros}
                onColumnVisibilityModelChange={(newModel) => setColumnVisibilityModelRetiros(newModel)}
                disableRowSelectionOnClick
                hideFooterSelectedRowCount
                density="compact"
                pageSizeOptions={[10, 25, 50, 100]}
                initialState={{
                    pagination: { paginationModel: { pageSize: 100, page: 0 } }
                }}
                sx={{
                    ...dashboardGridSx, flex: 0.4,
                    minHeight: '200px', // Altura mínima para que no se colapse por completo
                    maxHeight: '350px', // Altura máxima para garantizar que no tape a la de abajo
                    mb: 2
                }}
                slots={{ toolbar: GridToolbar }}
                loading={loading}
                slotProps={{
                    loadingOverlay: {
                        variant: 'skeleton',
                        noRowsVariant: 'skeleton',
                    },
                }}
            />
            <Dialog
                open={openModal}
                onClose={handleCloseModal}
                maxWidth={false} // 1. Desactivamos el límite máximo predefinido (lg, xl, etc.)
                fullWidth        // 2. Le decimos que intente ocupar todo el ancho disponible
                sx={{
                    '& .MuiDialog-paper': {
                        width: '95vw',      // 3. Ocupa el 95% del ancho de la pantalla (deja 5% de margen)
                        maxWidth: '95vw',   // Asegura que no se limite en pantallas gigantes
                        height: '92vh',     // 4. Ocupa el 92% del alto de la pantalla
                        maxHeight: '92vh',  // Asegura que mantenga esa altura fija casi completa
                        margin: 'auto',     // Centra la modal perfectamente
                    }
                }}
            >
                <DialogTitle>
                    Detalle Orden Producción #{ordenSeleccionada?.id}
                </DialogTitle>
                <DialogContent dividers>
                    <Typography variant="h6" mb={1}>
                        Componentes de la Orden
                    </Typography>

                    <DataGrid
                        rows={detalleOrden}
                        columns={detalleCols}
                        getRowId={(row) => row.id}
                        showCellVerticalBorder
                        showColumnVerticalBorder
                        columnVisibilityModel={columnVisibilityDetalles}
                        onColumnVisibilityModelChange={(newModel) => setColumnVisibilityDetalles(newModel)}
                        density="compact"
                        loading={loadingDetalle}
                        disableRowSelectionOnClick
                        hideFooterSelectedRowCount
                        pageSizeOptions={[5, 10, 25]} // Bajamos las opciones visuales para acoplarse al tamaño compacto
                        initialState={{
                            pagination: { paginationModel: { pageSize: 5, page: 0 } }
                        }}
                        // Forzamos un height máximo de 250px (puedes ajustarlo si necesitas ver más o menos renglones)
                        sx={{
                            ...dashboardGridSx,
                            height: '250px',
                            maxHeight: '250px',
                            mb: 2
                        }}
                        slots={{ toolbar: GridToolbar }}
                        loading={loading}
                        slotProps={{
                            loadingOverlay: {
                                variant: 'skeleton',
                                noRowsVariant: 'skeleton',
                            },
                        }}
                    />

                    {/* SEPARADOR VISUAL E INTRODUCCIÓN DEL BUSCADOR DE CAJAS */}
                    <Box sx={{
                        pt: 2,
                        borderTop: '2px dashed #e0e0e0',
                        flex: 1, // 👉 CAMBIO: Le damos más peso en el flexbox para que use la mayoría de la pantalla
                        display: 'flex',
                        flexDirection: 'column',
                        minHeight: 0
                    }}>
                        <Typography variant="h6" mb={1} sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                            🔍 Localización de Producto por Caja / Tarima
                        </Typography>
                        <Typography variant="body2" color="text.secondary" mb={2}>
                            A continuación se listan las cajas del envío actual donde se ha escaneado este producto. Utiliza los filtros integrados para buscar una caja en específico.
                        </Typography>

                        {/* TABLA 2: BUSCADOR EN CAJAS */}
                        <DataGrid
                            rows={cajasProducto}
                            columns={cajasCols}
                            getRowId={(row) => row.id}
                            showCellVerticalBorder
                            showColumnVerticalBorder
                            density="compact"
                            loading={loadingCajas}
                            disableRowSelectionOnClick
                            hideFooterSelectedRowCount
                            autoHeight={false} // Mantener en false para que el scroll pertenezca a la cuadrícula interna del DataGrid
                            pageSizeOptions={[10, 25, 50]}
                            initialState={{
                                pagination: { paginationModel: { pageSize: 25, page: 0 } }
                            }}
                            sx={{
                                ...dashboardGridSx,
                                flex: 1 // Le dice al DataGrid que se estire hasta el fondo del Box contenedor
                            }}
                            slots={{ toolbar: GridToolbar }}
                            slotProps={{
                                loadingOverlay: { variant: 'skeleton', noRowsVariant: 'skeleton' },
                                toolbar: { showQuickFilter: true, quickFilterProps: { debounceMs: 500 } }
                            }}
                            localeText={{
                                noRowsLabel: 'El producto aún no ha sido escaneado en ninguna caja para este envío.'
                            }}
                        />
                    </Box>
                </DialogContent>

                <DialogActions>
                    <Button onClick={handleCloseModal} variant="contained">
                        Cerrar
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default EnviosProgresoEmpaque