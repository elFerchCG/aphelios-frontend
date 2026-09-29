import axios from 'axios';
import React, { useEffect, useMemo, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import dayjs from 'dayjs';
import {
    GridEditInputCell,
    GridToolbarColumnsButton,
    GridToolbarContainer,
    GridToolbarDensitySelector,
    GridToolbarExport,
    GridToolbarFilterButton,
    GridToolbarQuickFilter,
} from "@mui/x-data-grid";
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
    Switch,
    Modal,
    TextField,
    Stack,
    MenuItem,
    Select,
    InputLabel,
    FormControl,
    Alert,
    Paper,
    GlobalStyles
} from "@mui/material";
import AppDataGrid from '../../common/AppDataGrid';
import { DATA_GRID_LOCALE_ES } from '../../../config/dataGridLocale';
import VisibilityIcon from '@mui/icons-material/Visibility';
import IconButton from '@mui/material/IconButton';
import FacturaDrawer from './FacturaDrawer';
import ProformaAccordion from "./ProformaAccordion";
import ConsolidadoDrawer from './ConsolidadoDrawer';
import RetirosConsolidadoDrawer from './RetirosConsolidadoDrawer';
import EnvioKpis, { calcularContenidoEnvio } from './EnvioKpis';
import EditNoteIcon from "@mui/icons-material/EditNote";
import NoteAddIcon from "@mui/icons-material/NoteAdd";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import Badge from "@mui/material/Badge";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import FolderCopyOutlinedIcon from "@mui/icons-material/FolderCopyOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import PrecisionManufacturingOutlinedIcon from "@mui/icons-material/PrecisionManufacturingOutlined";
import AssignmentReturnOutlinedIcon from "@mui/icons-material/AssignmentReturnOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import SummarizeOutlinedIcon from "@mui/icons-material/SummarizeOutlined";

// ============================================================
// Constantes de layout compartidas por los DataGrids del dashboard
// ============================================================

// Tablas: se usa el componente estándar AppDataGrid (common/AppDataGrid.jsx,
// ver "Manual de Componentes Visuales APHELIOS", sección 6). Aquí solo se
// pasan por props las necesidades propias de esta pantalla:
//  - altura fija (el scroll queda dentro de la tabla y la página no crece)
//  - paginado de 100 registros
//  - mensaje de "sin registros" específico de cada tabla
const GRID_HEIGHT = 520;
const GRID_PAGE_SIZE = 100;
const GRID_PAGE_SIZE_OPTIONS = [100];

const localeSinRegistros = (noRowsLabel) => ({ ...DATA_GRID_LOCALE_ES, noRowsLabel });

// Toolbar estándar (mismo formato que AppDataGridToolbar) + búsqueda rápida,
// para la tabla de cajas del modal. Definido fuera del componente para que
// no se vuelva a montar en cada render (perdería el foco del buscador).
const ToolbarCajasProducto = () => (
    <GridToolbarContainer sx={{ px: 1.5, py: 1, gap: 0.5 }}>
        <GridToolbarColumnsButton />
        <GridToolbarFilterButton />
        <GridToolbarDensitySelector />
        <GridToolbarExport csvOptions={{ fileName: "cajas_producto", utf8WithBom: true }} />
        <Box sx={{ flex: 1 }} />
        <GridToolbarQuickFilter debounceMs={500} />
    </GridToolbarContainer>
);

// ============================================================
// Caja de sección (mismo estilo que TransaccionesI.jsx: Paper elevation 2,
// borderRadius 3, título subtitle1 en negritas con icono outlined primario)
// ============================================================
const SectionCard = ({ icon: Icon, title, subtitle, count, actions, children }) => (
    <Paper elevation={2} sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 3 }}>
        <Stack
            direction="row"
            flexWrap="wrap"
            gap={1.5}
            alignItems="center"
            justifyContent="space-between"
            sx={{ mb: 1.5 }}
        >
            <Box sx={{ minWidth: 0 }}>
                <Typography
                    variant="subtitle1"
                    sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700 }}
                >
                    <Icon color="primary" /> {title}
                    {count != null && (
                        <Chip
                            size="small"
                            label={count}
                            sx={{ fontWeight: 700, bgcolor: '#e3f2fd', color: 'primary.main', height: 22 }}
                        />
                    )}
                </Typography>
                {subtitle && (
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', ml: 4 }}>
                        {subtitle}
                    </Typography>
                )}
            </Box>
            {actions && (
                <Stack direction="row" flexWrap="wrap" gap={1} alignItems="center">
                    {actions}
                </Stack>
            )}
        </Stack>
        {children}
    </Paper>
);

const EnviosProgresoEmpaque = () => {

    const { envioId } = useParams();
    const location = useLocation();

    const [descripcionEnvio, setDescripcionEnvio] = useState(location.state?.descripcionEnvio || '');
    const [folioInternoEnvio, setFolioInternoEnvio] = useState(location.state?.folioInternoEnvio || '');

    const [totalPiezas, setTotalPiezas] = useState(0);
    const [totalPiezasEmpacadas, setTotalPiezasEmpacadas] = useState(0);
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

    const [maximoArmable, setMaximoArmable] = useState(null);
    const [loadingMaximoArmable, setLoadingMaximoArmable] = useState(false);
    const [kitsAConfirmar, setKitsAConfirmar] = useState('');
    const [confirmandoArmado, setConfirmandoArmado] = useState(false);

    const [proformas, setProformas] = useState([]);
    const [facturaSeleccionada, setFacturaSeleccionada] = useState(null);
    const [drawerOpen, setDrawerOpen] = useState(false);

    const [openConsolidado, setOpenConsolidado] = useState(false);
    const [proformaSeleccionada, setProformaSeleccionada] = useState(null);

    const [openNota, setOpenNota] = useState(false);
    const [notaActual, setNotaActual] = useState("");
    const [detalleSeleccionado, setDetalleSeleccionado] = useState(null);
    const [guardandoNota, setGuardandoNota] = useState(false);

    const [token, setToken] = useState(localStorage.getItem('token'));
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));

    const [selectedProforma, setSelectedProforma] = useState('todas');

    // Consolidado de retiros: filtro de la tabla "OP - Retiros" y drawer
    // (todas las órdenes de retiro o una individual).
    const [selectedRetiro, setSelectedRetiro] = useState('todas');
    const [openConsolidadoRetiros, setOpenConsolidadoRetiros] = useState(false);
    const [retiroConsolidadoInicial, setRetiroConsolidadoInicial] = useState('todas');

    const abrirConsolidadoRetiros = (ordenBodegaId = 'todas') => {
        setRetiroConsolidadoInicial(ordenBodegaId == null ? 'todas' : String(ordenBodegaId));
        setOpenConsolidadoRetiros(true);
    };

    const apiUrl =
        process.env.NODE_ENV === 'production'
            ? process.env.REACT_APP_API_URL
            : process.env.REACT_APP_API_URL_LOCAL;

    useEffect(() => {
        const handleStorageChange = () => {
            setToken(localStorage.getItem('token'));
            setUser(JSON.parse(localStorage.getItem('user')));
        };

        // Añadir un listener para el evento `storage`
        window.addEventListener('storage', handleStorageChange);

        // Limpieza al desmontar el componente
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [apiUrl]);

    const puedeEditarColumna = user && (
        user.rol_descripcion === 'administrador' ||
        user.rol_descripcion === 'gerencia'
    );

    const handleCloseModal = () => {
        setOpenModal(false);
        setOrdenSeleccionada(null);
        setMaximoArmable(null);
        setKitsAConfirmar('');
    };

    const fetchPiezasYFacturas = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${apiUrl}/empaque/getPiezasYFacturas/${envioId}`);
            setTotalPiezas(Number(response.data.total_piezas || []));
            setTotalPiezasEmpacadas(Number(response.data.total_piezas_empacadas || []));
            setTotalOrdenRetiro(response.data.totalOrdenRetiro);
            setOrdenesProduccionFacturas(response.data.ordenesProduccionFacturas);
            setOrdenesProduccionRetiros(response.data.ordenesProduccionRetiros);
            // Si no llegaron por la navegación (p. ej. al recargar la
            // página), se toman del backend.
            const envio = response.data.envio;
            if (envio) {
                setFolioInternoEnvio((prev) => prev || envio.folio_interno || '');
                setDescripcionEnvio((prev) => prev || envio.descripcion || '');
            }
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
        fetchAgrupaciones();
    }, [envioId]);

    // Obtenemos la lista de proformas únicas presentes en los datos para llenar el Select
    const proformasDisponibles = useMemo(() => {
        const mapaMap = new Map();
        ordenesProduccionFacturas.forEach((row) => {
            if (!row.proforma_id) return;

            const tieneCobertura = Number(row.cantidad_cubierta_excedente_total || 0) > 0;

            if (!mapaMap.has(row.proforma_id)) {
                mapaMap.set(row.proforma_id, {
                    id: row.proforma_id,
                    estatus: row.proforma_estatus,
                    tieneCobertura
                });
            } else if (tieneCobertura) {
                mapaMap.get(row.proforma_id).tieneCobertura = true;
            }
        });
        return Array.from(mapaMap.values());
    }, [ordenesProduccionFacturas]);

    // Filas filtradas para el DataGrid
    const ordenesFiltradas = useMemo(() => {
        if (selectedProforma === 'todas') return ordenesProduccionFacturas;
        return ordenesProduccionFacturas.filter((row) => row.proforma_id === Number(selectedProforma));
    }, [ordenesProduccionFacturas, selectedProforma]);

    // Filas de "OP - Retiros" filtradas por orden de retiro
    const ordenesRetirosFiltradas = useMemo(() => {
        if (selectedRetiro === 'todas') return ordenesProduccionRetiros;
        return ordenesProduccionRetiros.filter(
            (row) => String(row.orden_bodega_id) === String(selectedRetiro)
        );
    }, [ordenesProduccionRetiros, selectedRetiro]);

    const abrirFactura = (factura) => {

        setFacturaSeleccionada(factura);

        setDrawerOpen(true);

    }

    const cerrarFactura = () => {

        setDrawerOpen(false);

        setFacturaSeleccionada(null);

    }

    const fetchAgrupaciones = async () => {

        try {

            const response = await axios.get(
                `${apiUrl}/empaque/envio/${envioId}/agrupaciones`
            );

            setProformas(response.data.data || []);
            console.log("proformas:", proformas);

        } catch (error) {

            console.error(error);

            Swal.fire({
                icon: "warning",
                title: "Error",
                text: "No se pudieron cargar las agrupaciones."
            });

        }

    };

    const handleOpenModal = async (row) => {
        try {
            setLoadingDetalle(true);
            setOpenModal(true);
            setOrdenSeleccionada(row);
            setMaximoArmable(null);
            setKitsAConfirmar('');

            const response = await axios.get(`${apiUrl}/empaque/getDetalleOrden/${row.id}`);
            setDetalleOrden(response.data.data);
            setLoadingDetalle(false);

            obtenerMaximoArmable(row.id);
        } catch (error) {
            setLoadingDetalle(false);
            Swal.fire("Error", "No se pudo cargar el detalle", "error");
        }
    };

    const obtenerMaximoArmable = async (ordenId) => {
        try {
            setLoadingMaximoArmable(true);
            const response = await axios.get(`${apiUrl}/produccion/ordenes/${ordenId}/maximo-armable`);
            const data = response.data?.data || null;
            setMaximoArmable(data);
            setKitsAConfirmar(data ? String(data.maximo_armable) : '');
            setLoadingMaximoArmable(false);
        } catch (error) {
            setLoadingMaximoArmable(false);
            setMaximoArmable(null);
            console.error("Error al obtener el máximo armable:", error);
        }
    };

    const confirmarArmado = async () => {
        if (!ordenSeleccionada || !maximoArmable) return;

        if (maximoArmable.armado_confirmado_en) {
            Swal.fire("Ya confirmado", `El armado de esta orden ya fue confirmado: ${maximoArmable.armado_confirmado_kits} kit(s). No se puede volver a confirmar.`, "info");
            return;
        }

        const kitsNum = parseInt(kitsAConfirmar, 10);

        if (isNaN(kitsNum) || kitsNum < 0) {
            Swal.fire("Valor inválido", "La cantidad de kits debe ser un número entero mayor o igual a 0", "warning");
            return;
        }

        if (kitsNum > maximoArmable.maximo_armable) {
            Swal.fire("Valor inválido", `No puedes armar más de ${maximoArmable.maximo_armable} kits con el stock/factura disponible`, "warning");
            return;
        }

        const result = await Swal.fire({
            title: `¿Confirmar armado de ${kitsNum} kit(s)?`,
            text: "Esto restará de existencias_componentes lo que realmente se necesite usar del stock reservado, y cancelará lo que no se use.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#2e7d32',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Sí, confirmar armado',
            cancelButtonText: 'Cancelar',
            target: document.getElementById("modal-detalle-orden")
        });

        if (!result.isConfirmed) return;

        try {
            setConfirmandoArmado(true);

            const response = await axios.post(
                `${apiUrl}/produccion/ordenes/${ordenSeleccionada.id}/confirmar-armado`,
                {
                    kits_confirmados: kitsNum,
                    usuario: user?.nombre || 'SISTEMA'
                }
            );

            Swal.fire({
                icon: 'success',
                title: 'Armado confirmado',
                text: response.data?.message || 'Se confirmó el armado correctamente.',
                timer: 2000,
                showConfirmButton: false,
                target: document.getElementById("modal-detalle-orden")
            });

            await obtenerDetalleOrden(ordenSeleccionada.id);
            await obtenerMaximoArmable(ordenSeleccionada.id);
            await fetchPiezasYFacturas();

            setConfirmandoArmado(false);
        } catch (error) {
            setConfirmandoArmado(false);
            const errorMessage = error.response?.data?.message || 'No se pudo confirmar el armado';
            Swal.fire({
                title: 'Error',
                text: errorMessage,
                icon: 'warning',
                timer: 5000,
                showCloseButton: true,
                allowEscapeKey: true,
                target: document.getElementById("modal-detalle-orden")
            });
        }
    };

    const obtenerDetalleOrden = async (ordenId) => {
        try {
            setLoadingDetalle(true);
            const response = await axios.get(`${apiUrl}/empaque/getDetalleOrden/${ordenId}`);
            setDetalleOrden(response.data.data);
            setLoadingDetalle(false);
        } catch (error) {
            setLoadingDetalle(false);
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

    const handleOpenNota = (row) => {

        setDetalleSeleccionado(row.id);
        setOrdenSeleccionada(row.orden_id);

        setNotaActual(row.notas || "");

        setOpenNota(true);

    };

    const handleCloseNota = () => {

        setOpenNota(false);

        setDetalleSeleccionado(null);

        setNotaActual("");

    };

    const guardarNota = async () => {

        try {

            setGuardandoNota(true);

            await axios.put(
                `${apiUrl}/empaque/orden-produccion-detalle/${detalleSeleccionado}/notas`,
                {
                    notas: notaActual
                }
            );

            Swal.fire({
                icon: "success",
                title: "Nota guardada",
                timer: 1200,
                showConfirmButton: false,
                target: document.getElementById("modal-notas")
            });

            // refresca el detalle de la orden
            await obtenerDetalleOrden(ordenSeleccionada);

            handleCloseNota();

        } catch (error) {

            Swal.fire({
                icon: "error",
                title: "Error",
                text:
                    error.response?.data?.message ??
                    "No se pudo guardar la nota.",
                target: document.getElementById("modal-notas")
            });

        } finally {

            setGuardandoNota(false);

        }

    };

    const detalleCols = [
        { field: "id", headerName: "ID Detalle", flex: 1 },
        { field: "orden_id", headerName: "ID Orden", flex: 1 },
        { field: "componente_id", headerName: "Componente", flex: 1 },
        { field: "sku", headerName: "SKU", flex: 2 },
        { field: "descripcion", headerName: "Descripción", flex: 2 },
        {
            field: "cantidad_billete", headerName: "MRP", flex: 1, type: "number",
            renderCell: (params) => {
                const value = Number(params.value || 0);
                return value;
            }
        },
        {
            field: "cantidad_facturada", headerName: "Factura", flex: 2, type: "number",
            renderCell: (params) => {
                const value = Number(params.value || 0);
                return value;
            }
        },
        {
            field: "cantidad_a_enviar", headerName: "A Enviar", flex: 1, type: "number",
        },
        { field: "cantidad_contada", headerName: "Contada", flex: 1, type: "number" },
        { field: "cantidad_surtida", headerName: "Surtida", flex: 1, type: "number" },
        {
            field: "cantidad_cubierta_excedente",
            headerName: "Cubierto Stock",
            flex: 1.5,
            headerAlign: "center",
            align: "center",
            type: "number",
            renderCell: (params) => {
                const cobertura = Number(params.value || 0);

                if (cobertura <= 0) {
                    return <Chip size="small" variant="outlined" label="—" />;
                }

                return (
                    <Tooltip title="Esta cantidad de este componente se está cubriendo con stock interno (existencias_componentes) en vez de esperar la factura del proveedor. Hay que recolectarla físicamente antes de armar/enviar el producto.">
                        <Chip
                            size="small"
                            color="warning"
                            icon={<Inventory2Icon fontSize="small" />}
                            label={cobertura}
                        />
                    </Tooltip>
                );
            }
        },
        {
            field: "avance",
            headerName: "Avance",
            type: "number",
            flex: 2,
            renderCell: (params) => {
                const facturada = Number(params.row.cantidad_facturada) || 0;
                const cubierta = Number(params.row.cantidad_cubierta_excedente) || 0;
                const aEnviar = Number(params.row.cantidad_a_enviar) || 0;
                const surtidas = Number(params.row.cantidad_contada) || 0;

                // Disponible = lo facturado + lo cubierto con stock interno de
                // componentes. Si no hay ninguno de los dos, usa aEnviar.
                const disponible = facturada + cubierta;
                const total = disponible > 0 ? disponible : aEnviar;

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
            flex: 2,
            renderCell: (params) => {
                const faltante =
                    (params.row.cantidad_facturada || 0) -
                    (params.row.cantidad_contada || 0);

                let color = "success";
                let label = "Completo";

                if (faltante > 0) {
                    color = "warning";
                    label = "Pendiente";
                }

                return <Chip label={label} color={color} size="small" />;
            }
        },
        {
            field: "nota",
            headerName: "Notas",
            flex: 2,
            renderCell: (params) => {
                const tieneNota = Boolean(params.row.notas);

                // Determinamos el texto según permisos e historial
                let labelText = "Agregar";
                if (tieneNota) {
                    labelText = puedeEditarColumna ? "Editar" : "Ver Nota";
                }

                // Si no hay nota y no tiene permiso, deshabilitamos la acción
                const disabled = !puedeEditarColumna && !tieneNota;

                return (
                    <Chip
                        clickable={!disabled}
                        disabled={disabled}
                        icon={
                            tieneNota
                                ? (puedeEditarColumna ? <EditNoteIcon /> : <VisibilityIcon />)
                                : <NoteAddIcon />
                        }
                        label={labelText}
                        color={
                            tieneNota
                                ? (puedeEditarColumna ? "warning" : "info")
                                : "primary"
                        }
                        variant={tieneNota ? "filled" : "outlined"}
                        onClick={() => {
                            if (!disabled) {
                                handleOpenNota(params.row);
                            }
                        }}
                    />
                );
            }
        }
    ];

    const esFilaEditable = (row) => {
        if (row.estatus === "empacada") return false;
        const estatusBloqueados = ['activa', 'finalizada'];
        if (estatusBloqueados.includes(row.proforma_estatus)) return false;
        return true;
    };

    const ordenesCols = [
        { field: "id", headerName: "#Orden Producción", flex: 1 },
        { field: "producto_id", headerName: "#Producto", flex: 1 },
        { field: "mlm", headerName: "MLM", flex: 1 },
        { field: "title", headerName: "Titulo", flex: 1.5, minWidth: 220 },
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
            field: "cantidad_mrp", headerName: "Cantidad MRP", flex: 1, minWidth: 140, type: "number",
            valueFormatter: (value) => Math.round(value ?? 0)
        },
        {
            field: "cantidad_parcial", headerName: "Factura", flex: 1, type: "number",
            valueFormatter: (value) => Math.round(value ?? 0)
        },
        {
            field: "cantidad_a_enviar", headerName: "A Enviar", flex: 1, headerAlign: "center", align: "center", type: "number",
            // ✅ SOLO editable si NO está empacada
            editable: (params) => puedeEditarColumna && params.row.estatus !== "empacada",

            valueFormatter: (value) => Math.round(Number(value ?? 0)),

            // ✅ SOLO aplicar estilo editable si NO está empacada
            cellClassName: (params) =>
                puedeEditarColumna && esFilaEditable(params.row) ? "celdaEditable" : "celdaBloqueada",

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
            renderCell: (params) => {
                const tieneCobertura = Number(params.row.cantidad_cubierta_excedente_total || 0) > 0;

                return (
                    <Tooltip
                        title={
                            tieneCobertura
                                ? "Esta orden tiene componentes cubiertos con stock interno — ábrela para ver el detalle"
                                : "Ver detalle de la orden"
                        }
                    >
                        <Badge color="warning" variant="dot" invisible={!tieneCobertura} overlap="circular">
                            <IconButton
                                color="primary"
                                onClick={() => handleOpenModal(params.row)}
                            >
                                <VisibilityIcon />
                            </IconButton>
                        </Badge>
                    </Tooltip>
                );
            }
        }
    ];

    const ordenesProduccionRetirosCols = [
        { field: "id", headerName: "#Orden Producción", flex: 1 },
        {
            field: "orden_bodega_id",
            headerName: "Retiro",
            width: 110,
            renderCell: (params) => (
                <Chip
                    size="small"
                    label={`#${params.value}`}
                    icon={<AssignmentReturnOutlinedIcon sx={{ fontSize: 16 }} />}
                    sx={{ fontWeight: 600, bgcolor: '#e3f2fd', color: 'primary.main', '& .MuiChip-icon': { color: 'primary.main' } }}
                />
            )
        },
        { field: "producto_id", headerName: "#Producto", flex: 1 },
        { field: "mlm", headerName: "MLM", flex: 1 },
        { field: "title", headerName: "Titulo", flex: 1.5, minWidth: 220 },
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
            // En @mui/x-data-grid v7 valueFormatter recibe el valor directo
            // (no `params`). Antes se usaba params.value → undefined → dayjs()
            // devolvía la fecha de HOY en todas las filas.
            field: "fecha_orden", headerName: "Fecha", flex: 1, valueFormatter: (value) =>
                value ? dayjs(value).format("DD/MM/YYYY") : "",
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
        {
            field: "acciones",
            headerName: "Consolidado",
            width: 120,
            sortable: false,
            filterable: false,
            disableExport: true,
            headerAlign: "center",
            align: "center",
            renderCell: (params) => (
                <Tooltip title={`Ver consolidado del retiro #${params.row.orden_bodega_id}`} arrow>
                    <IconButton
                        color="primary"
                        size="small"
                        onClick={() => abrirConsolidadoRetiros(params.row.orden_bodega_id)}
                    >
                        <SummarizeOutlinedIcon />
                    </IconButton>
                </Tooltip>
            )
        },
    ]

    // Columnas ocultas por defecto (AppDataGrid: initialColumnVisibilityModel)
    const columnasOcultasOrdenes = {
        id: false,
        producto_id: false,
        permitir_full: false,
    };

    const columnasOcultasDetalles = {
        id: false,
        orden_id: false,
        componente_id: false
    };

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

        // if (newRow.cantidad_a_enviar > oldRow.cantidad_parcial) {
        //     Swal.fire(
        //         "Valor inválido",
        //         "No puede ser mayor a la cantidad facturada",
        //         "warning"
        //     );
        //     return oldRow;
        // }

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
            const errorMessage = error.response?.data?.message || 'Error al cargar los datos';
            Swal.fire({
                title: 'Error',
                text: errorMessage,
                icon: 'warning',
                timer: 5000,
                showCloseButton: true,
                allowEscapeKey: true,
            });

            return oldRow;
        }
    };

    const mostrarAlertaError = (error) => {
        let contenidoHtml = "";

        if (error.details) {
            if (Array.isArray(error.details)) {
                // Se mapea cada elemento verificando si es objeto o texto
                const listaItems = error.details
                    .map(detail => {
                        const texto = typeof detail === 'object' && detail !== null
                            ? (detail.mensaje || JSON.stringify(detail))
                            : detail;
                        return `<li>${texto}</li>`;
                    })
                    .join("");

                contenidoHtml = `
                <p style="margin-bottom: 10px;">${error.message}</p>
                <ul style="text-align: left; font-size: 0.9em; background: #f8f9fa; padding: 10px 25px; border-radius: 5px;">
                    ${listaItems}
                </ul>
            `;
            } else if (typeof error.details === "object") {
                const listaErrores = Object.entries(error.details)
                    .map(([campo, desc]) => `<li><strong>${campo}:</strong> ${desc}</li>`)
                    .join("");

                contenidoHtml = `
                <p style="margin-bottom: 10px;">${error.message}</p>
                <ul style="text-align: left; font-size: 0.9em; background: #f8f9fa; padding: 10px 25px; border-radius: 5px;">
                    ${listaErrores}
                </ul>
            `;
            } else {
                contenidoHtml = `
                <p style="margin-bottom: 10px;">${error.message}</p>
                <div style="text-align: left; font-size: 0.85em; font-family: monospace; background: #f8f9fa; padding: 10px; border-radius: 5px; max-height: 150px; overflow-y: auto;">
                    ${error.details}
                </div>
            `;
            }
        }

        Swal.fire({
            icon: "warning",
            title: "No se pudo actualizar",
            html: contenidoHtml || error.message,
            confirmButtonColor: "#3085d6"
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

    const totalCantidadAEnviar = ordenesProduccionFacturas.reduce(
        (sum, row) => sum + (Number(row.cantidad_a_enviar) || 0),
        0
    );

    const handleVerConsolidado = (proforma) => {

        setProformaSeleccionada(proforma);
        setOpenConsolidado(true);

    };

    const abrirConsolidado = (proforma) => {
        setProformaSeleccionada(proforma);
        setOpenConsolidado(true);
    };

    const cerrarConsolidado = () => {
        setOpenConsolidado(false);
        setProformaSeleccionada(null);
    };

    const procesarCambioEstatus = async (grupo, nuevoEstatus, tituloConfirmacion, textoConfirmacion) => {
        // Definimos texto del botón de acuerdo al nuevo estatus
        let textoBotonConfirmar = 'Sí, continuar';
        if (nuevoEstatus === 'activa' && grupo.estatus === 'pendiente') textoBotonConfirmar = 'Sí, habilitar';
        else if (nuevoEstatus === 'finalizada') textoBotonConfirmar = 'Sí, finalizar';

        // 1. Pedir confirmación al usuario
        const result = await Swal.fire({
            title: tituloConfirmacion,
            text: textoConfirmacion,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: nuevoEstatus === 'activa' ? '#2e7d32' : '#d32f2f',
            cancelButtonColor: '#6c757d',
            confirmButtonText: nuevoEstatus === 'activa' ? 'Sí, habilitar' : 'Sí, finalizar',
            cancelButtonText: 'Cancelar'
        });

        // Si el usuario cancela, no hacemos nada
        if (!result.isConfirmed) return;

        // 2. Mostrar alerta de carga bloqueante (evita dobles clics y bloquea la interfaz)
        Swal.fire({
            title: 'Procesando...',
            text: 'Por favor espera un momento',
            allowOutsideClick: false,
            allowEscapeKey: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        try {
            // 3. Consumir el endpoint
            const respuesta = await axios.put(`${apiUrl}/produccion/actualizarProforma`, {
                proforma_id: grupo.proforma_id,
                estatus: nuevoEstatus,
                envio_id: envioId,
                usuario: user?.nombre || 'SISTEMA'
            });

            if (!respuesta.data.success) {
                throw new Error(respuesta.data.message || 'No se pudo actualizar el estatus');
            }

            // 4. Actualizar el estado local en React
            setProformas((prevProformas) =>
                prevProformas.map((item) =>
                    item.proforma_id === grupo.proforma_id
                        ? { ...item, estatus: nuevoEstatus }
                        : item
                )
            );

            // 5. Alerta de éxito
            Swal.fire({
                icon: 'success',
                title: '¡Logrado!',
                text: respuesta.data.message || `La proforma ahora está ${nuevoEstatus}.`,
                timer: 2000,
                showConfirmButton: false
            });

            await fetchPiezasYFacturas();

        } catch (error) {
            // 1. Extraer el mensaje principal del servidor
            const mensajeServidor = error.response?.data?.message || "No se pudo actualizar la orden";

            // 2. Extraer detalles adicionales (pueden venir como array, string u objeto)
            const detallesServidor = error.response?.data?.details || error.response?.data?.errors;

            // Creamos un objeto de error personalizado para transportar ambos datos
            const customError = new Error(mensajeServidor);
            customError.details = detallesServidor; // Le inyectamos los detalles al error

            mostrarAlertaError(customError);

        }
    };

    const handleHabilitarProforma = (grupo) => {
        procesarCambioEstatus(
            grupo,
            'activa',
            `¿Habilitar la proforma #${grupo.proforma_id}?`,
            'Al habilitarla, cambiará a estatus "activa" y se permitirá iniciar el proceso de surtido, tambien se generaran excedentes y no se permitara cambiar ninguna cantidad a enviar.'
        );
    };

    const handleFinalizarProforma = (grupo) => {
        procesarCambioEstatus(
            grupo,
            'finalizada',
            `¿Finalizar la proforma #${grupo.proforma_id}?`,
            'Esta acción marcará la proforma como completada y no se podra surtir nuevamente.'
        );
    };

    // Recarga todo el dashboard (piezas, órdenes, retiros y agrupaciones).
    const handleActualizarTodo = () => {
        fetchPiezasYFacturas();
        fetchAgrupaciones();
    };

    // Resumen de lo cargado en el envío (productos, proformas, facturas,
    // retiros) para la tarjeta "Contenido del envío".
    const contenidoEnvio = useMemo(() => calcularContenidoEnvio({
        ordenesFacturas: ordenesProduccionFacturas,
        ordenesRetiros: ordenesProduccionRetiros,
        retiros: totalOrdenRetiro,
        agrupaciones: proformas,
    }), [ordenesProduccionFacturas, ordenesProduccionRetiros, totalOrdenRetiro, proformas]);
    // Total "A Enviar" de lo que está visible (respeta el filtro de proforma).
    const totalAEnviarFiltrado = ordenesFiltradas.reduce(
        (sum, row) => sum + (Number(row.cantidad_a_enviar) || 0),
        0
    );

    // Props comunes de las tablas principales del dashboard.
    const gridComunProps = {
        loading,
        height: GRID_HEIGHT,
        pageSize: GRID_PAGE_SIZE,
        pageSizeOptions: GRID_PAGE_SIZE_OPTIONS,
    };

    return (
        <Box sx={{ p: { xs: 1, sm: 2 }, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {/* El panel de Columnas/Filtros del DataGrid se renderiza en un
                Popper propio sin z-index alto (mismo fix que TransaccionesI.jsx). */}
            <GlobalStyles
                styles={(theme) => ({
                    '.MuiDataGrid-panel': { zIndex: theme.zIndex.modal + 100 },
                })}
            />

            {/* ---------- Encabezado ---------- */}
            <Paper
                elevation={2}
                sx={{
                    p: 1.5,
                    borderRadius: 3,
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 1.5,
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <Stack direction="row" flexWrap="wrap" gap={1} alignItems="center">
                    <Typography
                        variant="subtitle1"
                        sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700, mr: 1 }}
                    >
                        <LocalShippingOutlinedIcon color="primary" /> Dashboard de Envío
                    </Typography>
                    <Chip
                        size="small"
                        label={folioInternoEnvio || `ID: ${envioId}`}
                        sx={{ fontWeight: 700, bgcolor: '#e3f2fd', color: 'primary.main' }}
                    />
                    {descripcionEnvio && (
                        <Typography variant="body2" sx={{ color: 'text.secondary' }} noWrap title={descripcionEnvio}>
                            {descripcionEnvio}
                        </Typography>
                    )}
                </Stack>

                <Stack direction="row" flexWrap="wrap" gap={1} alignItems="center">
                    <Tooltip title="Vuelve a consultar los datos del envío." arrow>
                        <span>
                            <Button
                                variant="outlined"
                                size="small"
                                startIcon={<RefreshIcon />}
                                onClick={handleActualizarTodo}
                                disabled={loading}
                                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                            >
                                Actualizar
                            </Button>
                        </span>
                    </Tooltip>
                </Stack>
            </Paper>

            {/* ---------- Indicadores (compartidos con EnvioDetalle.jsx) ---------- */}
            <EnvioKpis
                envioId={envioId}
                folioInternoEnvio={folioInternoEnvio}
                totalPiezas={totalPiezas}
                totalPiezasEmpacadas={totalPiezasEmpacadas}
                contenido={contenidoEnvio}
            />

            {/* ---------- Agrupaciones ---------- */}
            <SectionCard
                icon={FolderCopyOutlinedIcon}
                title="Agrupaciones del envío"
                subtitle="Proformas del envío con sus facturas, consolidado y acciones de estatus."
                count={proformas.length}
            >
                {proformas.length === 0 ? (
                    <Typography variant="body2" sx={{ color: 'text.secondary', py: 2, textAlign: 'center' }}>
                        Este envío aún no tiene agrupaciones.
                    </Typography>
                ) : (
                    <Box sx={{ '& > .MuiAccordion-root:last-of-type': { mb: 0 } }}>
                        {proformas.map((grupo) => (
                            <ProformaAccordion
                                key={grupo.proforma_id}
                                envioId={envioId}
                                folioInternoEnvio={folioInternoEnvio}
                                grupo={grupo}
                                puedeEditarColumna={puedeEditarColumna}
                                onVerFactura={abrirFactura}
                                onVerConsolidado={handleVerConsolidado}
                                onHabilitarProforma={handleHabilitarProforma}
                                onFinalizarProforma={handleFinalizarProforma}
                            />
                        ))}
                    </Box>
                )}
            </SectionCard>

            <FacturaDrawer
                open={drawerOpen}
                factura={facturaSeleccionada}
                envioId={envioId}
                onClose={cerrarFactura}
            />

            <ConsolidadoDrawer
                open={openConsolidado}
                envioId={envioId}
                folioInternoEnvio={folioInternoEnvio}
                proforma={proformaSeleccionada}
                onClose={cerrarConsolidado}
            />

            <RetirosConsolidadoDrawer
                open={openConsolidadoRetiros}
                onClose={() => setOpenConsolidadoRetiros(false)}
                envioId={envioId}
                folioInternoEnvio={folioInternoEnvio}
                retiroInicial={retiroConsolidadoInicial}
            />

            {/* ---------- Órdenes de Producción - Facturas ---------- */}
            <SectionCard
                icon={ReceiptLongOutlinedIcon}
                title="Órdenes de Producción - Facturas"
                subtitle={`Total a enviar: ${Math.round(totalAEnviarFiltrado)} pieza(s)${selectedProforma !== 'todas' ? ` · Proforma #${selectedProforma}` : ''}`}
                count={ordenesFiltradas.length}
                actions={
                    <FormControl size="small" sx={{ minWidth: 240 }}>
                        <InputLabel id="proforma-filter-label">Filtrar por Proforma</InputLabel>
                        <Select
                            labelId="proforma-filter-label"
                            value={selectedProforma}
                            label="Filtrar por Proforma"
                            onChange={(e) => setSelectedProforma(e.target.value)}
                        >
                            <MenuItem value="todas">Todas las Proformas</MenuItem>

                            {proformasDisponibles.map((prof) => (
                                <MenuItem key={prof.id} value={prof.id}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, width: '100%' }}>
                                        <span>Proforma #{prof.id} ({prof.estatus})</span>
                                        {prof.tieneCobertura && (
                                            <Tooltip title="Esta proforma tiene productos con componentes cubiertos con stock interno (existencias_componentes)">
                                                <Inventory2Icon fontSize="small" sx={{ color: '#f57c00', ml: 'auto' }} />
                                            </Tooltip>
                                        )}
                                    </Box>
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                }
            >
                <AppDataGrid
                    {...gridComunProps}
                    rows={ordenesFiltradas}
                    columns={ordenesCols}
                    getRowId={(row) => row.id}
                    exportFileName={`envio_${folioInternoEnvio || envioId}_op_facturas`}
                    initialColumnVisibilityModel={columnasOcultasOrdenes}
                    experimentalFeatures={{ newEditingApi: true }}
                    processRowUpdate={processRowUpdate}
                    isCellEditable={(params) => {
                        if (params.row.estatus === "empacada") return false;
                        if (params.field === "cantidad_a_enviar") {
                            return puedeEditarColumna;
                        }
                        return true;
                    }}
                    localeText={localeSinRegistros('No hay órdenes de producción con factura para este envío.')}
                />
            </SectionCard>

            {/* ---------- Órdenes de Producción - Retiros ---------- */}
            <SectionCard
                icon={PrecisionManufacturingOutlinedIcon}
                title="Órdenes de Producción - Retiros"
                subtitle={selectedRetiro !== 'todas' ? `Retiro #${selectedRetiro}` : `${totalOrdenRetiro.length} orden(es) de retiro`}
                count={ordenesRetirosFiltradas.length}
                actions={
                    <>
                        <FormControl size="small" sx={{ minWidth: 240 }}>
                            <InputLabel id="retiro-filter-label">Filtrar por Retiro</InputLabel>
                            <Select
                                labelId="retiro-filter-label"
                                value={selectedRetiro}
                                label="Filtrar por Retiro"
                                onChange={(e) => setSelectedRetiro(e.target.value)}
                            >
                                <MenuItem value="todas">Todos los Retiros</MenuItem>
                                {totalOrdenRetiro.map((r) => (
                                    <MenuItem key={r.orden_bodega_id} value={String(r.orden_bodega_id)}>
                                        Retiro #{r.orden_bodega_id}{r.orden_bodega_descripcion ? ` · ${r.orden_bodega_descripcion}` : ''}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <Tooltip
                            title={selectedRetiro === 'todas'
                                ? 'Consolidado de todas las órdenes de retiro del envío'
                                : `Consolidado del retiro #${selectedRetiro}`}
                            arrow
                        >
                            <span>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={<SummarizeOutlinedIcon />}
                                    onClick={() => abrirConsolidadoRetiros(selectedRetiro)}
                                    disabled={totalOrdenRetiro.length === 0}
                                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                                >
                                    Ver consolidado
                                </Button>
                            </span>
                        </Tooltip>
                    </>
                }
            >
                <AppDataGrid
                    {...gridComunProps}
                    rows={ordenesRetirosFiltradas}
                    columns={ordenesProduccionRetirosCols}
                    getRowId={(row) => row.id}
                    exportFileName={`envio_${folioInternoEnvio || envioId}_op_retiros`}
                    initialColumnVisibilityModel={columnasOcultasOrdenes}
                    localeText={localeSinRegistros('No hay órdenes de producción de retiro para este envío.')}
                />
            </SectionCard>

            {/* ---------- Retiros ---------- */}
            <SectionCard
                icon={AssignmentReturnOutlinedIcon}
                title="Retiros"
                subtitle="Órdenes de bodega de retiro asociadas al envío."
                count={totalOrdenRetiro.length}
                actions={
                    <Tooltip title="Consolidado de todas las órdenes de retiro del envío" arrow>
                        <span>
                            <Button
                                variant="outlined"
                                size="small"
                                startIcon={<SummarizeOutlinedIcon />}
                                onClick={() => abrirConsolidadoRetiros('todas')}
                                disabled={totalOrdenRetiro.length === 0}
                                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                            >
                                Consolidado de retiros
                            </Button>
                        </span>
                    </Tooltip>
                }
            >
                <AppDataGrid
                    {...gridComunProps}
                    rows={totalOrdenRetiro}
                    columns={ordenesDeRetiros}
                    getRowId={(row) => row.orden_bodega_id}
                    exportFileName={`envio_${folioInternoEnvio || envioId}_retiros`}
                    localeText={localeSinRegistros('No hay retiros asociados a este envío.')}
                />
            </SectionCard>

            <Dialog
                id="modal-detalle-orden"
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
                        borderRadius: 4
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

                    <Box sx={{ mb: 2 }}>
                        <AppDataGrid
                            rows={detalleOrden}
                            columns={detalleCols}
                            getRowId={(row) => row.id}
                            loading={loadingDetalle}
                            height={340}
                            pageSize={GRID_PAGE_SIZE}
                            pageSizeOptions={GRID_PAGE_SIZE_OPTIONS}
                            exportFileName={`orden_${ordenSeleccionada?.id || ''}_componentes`}
                            initialColumnVisibilityModel={columnasOcultasDetalles}
                            localeText={localeSinRegistros('Esta orden no tiene componentes.')}
                        />
                    </Box>

                    {loadingMaximoArmable && !maximoArmable && (
                        <Typography variant="body2" color="text.secondary" mb={2}>
                            Calculando máximo armable...
                        </Typography>
                    )}

                    {maximoArmable && (maximoArmable.armado_confirmado_en || maximoArmable.componentes.some((c) => c.cantidad_cubierta_excedente > 0)) && (
                        <Card
                            variant="outlined"
                            sx={{
                                mb: 2,
                                borderColor: maximoArmable.armado_confirmado_en ? '#2e7d32' : '#0288d1',
                                backgroundColor: '#f5f5f5'
                            }}
                        >
                            <CardContent>
                                <Typography variant="h6" mb={1} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Inventory2Icon color={maximoArmable.armado_confirmado_en ? 'success' : 'warning'} />
                                    Armar kit(s)
                                </Typography>

                                {maximoArmable.armado_confirmado_en ? (
                                    // Bandera de armado ya confirmado: no se vuelve a mostrar el
                                    // formulario, solo el aviso de lo que ya se confirmó.
                                    <Alert severity="success">
                                        Ya se confirmó el armado de esta orden: <strong>{maximoArmable.armado_confirmado_kits} kit(s)</strong> el{' '}
                                        <strong>{new Date(maximoArmable.armado_confirmado_en).toLocaleString('es-MX')}</strong>
                                        {maximoArmable.armado_confirmado_por ? <> por <strong>{maximoArmable.armado_confirmado_por}</strong></> : null}.
                                        No se puede volver a confirmar.
                                    </Alert>
                                ) : (
                                    <>
                                        {maximoArmable.componentes.some((c) => c.cantidad_cubierta_excedente > 0) && (
                                            <Alert severity="warning" sx={{ mb: 2 }}>
                                                Esta orden tiene componentes cubiertos con stock interno (existencias_componentes). Al confirmar el armado se descontará del almacén únicamente lo que realmente se use para los kits confirmados; el resto de la reserva se cancelará automáticamente.
                                            </Alert>
                                        )}

                                        <Typography variant="body2" color="text.secondary" mb={2}>
                                            Máximo de kits (producto_id) que se pueden armar y enviar con lo facturado + lo cubierto con stock interno, por componente:
                                        </Typography>

                                        <Box sx={{ mb: 2, overflowX: 'auto' }}>
                                            <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 13 }}>
                                                <thead>
                                                    <tr style={{ backgroundColor: '#f5f7fa' }}>
                                                        <th style={{ textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid #eee' }}>Componente</th>
                                                        <th style={{ textAlign: 'right', padding: '6px 8px', borderBottom: '1px solid #eee' }}>Factura</th>
                                                        <th style={{ textAlign: 'right', padding: '6px 8px', borderBottom: '1px solid #eee' }}>Cubierto Stock</th>
                                                        <th style={{ textAlign: 'right', padding: '6px 8px', borderBottom: '1px solid #eee' }}>Disponible</th>
                                                        <th style={{ textAlign: 'right', padding: '6px 8px', borderBottom: '1px solid #eee' }}>Máx. kits</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {maximoArmable.componentes.map((c) => (
                                                        <tr key={c.opd_id}>
                                                            <td style={{ padding: '6px 8px', borderBottom: '1px solid #f5f5f5' }}>{c.sku} - {c.descripcion}</td>
                                                            <td style={{ textAlign: 'right', padding: '6px 8px', borderBottom: '1px solid #f5f5f5' }}>{Math.round(c.cantidad_facturada)}</td>
                                                            <td style={{ textAlign: 'right', padding: '6px 8px', borderBottom: '1px solid #f5f5f5' }}>
                                                                {c.cantidad_cubierta_excedente > 0 ? (
                                                                    <Chip size="small" color="warning" label={Math.round(c.cantidad_cubierta_excedente)} />
                                                                ) : '—'}
                                                            </td>
                                                            <td style={{ textAlign: 'right', padding: '6px 8px', borderBottom: '1px solid #f5f5f5' }}>{Math.round(c.disponible)}</td>
                                                            <td style={{ textAlign: 'right', padding: '6px 8px', borderBottom: '1px solid #f5f5f5', fontWeight: c.maximo_armable_componente === maximoArmable.maximo_armable ? 700 : 400 }}>
                                                                {c.maximo_armable_componente}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </Box>

                                        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                                            <Typography variant="body1">
                                                Máximo armable: <strong>{maximoArmable.maximo_armable}</strong> kit(s)
                                            </Typography>

                                            <TextField
                                                label="Kits a confirmar"
                                                type="number"
                                                size="small"
                                                value={kitsAConfirmar}
                                                InputProps={{ readOnly: true }}
                                                inputProps={{ min: 0, max: maximoArmable.maximo_armable, step: 1 }}
                                                sx={{ width: 160 }}
                                                disabled={!puedeEditarColumna || confirmandoArmado}
                                            />

                                            <Button
                                                variant="contained"
                                                color="success"
                                                onClick={confirmarArmado}
                                                disabled={!puedeEditarColumna || confirmandoArmado || maximoArmable.maximo_armable === 0}
                                            >
                                                {confirmandoArmado ? "Confirmando..." : "Confirmar armado"}
                                            </Button>
                                        </Stack>

                                        {!puedeEditarColumna && (
                                            <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                                                Solo administración/gerencia puede confirmar el armado.
                                            </Typography>
                                        )}
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    )}

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
                        <AppDataGrid
                            rows={cajasProducto}
                            columns={cajasCols}
                            getRowId={(row) => row.id}
                            loading={loadingCajas}
                            height={420}
                            pageSize={GRID_PAGE_SIZE}
                            pageSizeOptions={GRID_PAGE_SIZE_OPTIONS}
                            toolbar={ToolbarCajasProducto}
                            localeText={localeSinRegistros('El producto aún no ha sido escaneado en ninguna caja para este envío.')}
                        />
                    </Box>
                </DialogContent>

                <DialogActions>
                    <Button onClick={handleCloseModal} variant="contained">
                        Cerrar
                    </Button>
                </DialogActions>
            </Dialog>
            <Modal
                open={openNota}
                onClose={handleCloseNota}
            >

                <Box
                    id="modal-notas"
                    sx={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%,-50%)",
                        width: 550,
                        bgcolor: "background.paper",
                        borderRadius: 2,
                        boxShadow: 24,
                        p: 3
                    }}
                >

                    <Typography
                        variant="h6"
                        fontWeight="bold"
                        mb={2}
                    >

                        Agregar nota

                    </Typography>

                    <TextField

                        fullWidth

                        multiline

                        minRows={6}

                        maxRows={10}

                        value={notaActual}

                        onChange={(e) =>
                            setNotaActual(e.target.value)
                        }

                        placeholder="Escribe aquí la nota para este componente..."

                    />

                    <Stack
                        direction="row"
                        justifyContent="flex-end"
                        spacing={2}
                        mt={3}
                    >

                        <Button
                            onClick={handleCloseNota}
                        >
                            Cancelar
                        </Button>

                        <Button
                            variant="contained"
                            onClick={guardarNota}
                            disabled={guardandoNota}
                        >

                            Guardar

                        </Button>

                    </Stack>

                </Box>

            </Modal>
        </Box>
    );
}

export default EnviosProgresoEmpaque