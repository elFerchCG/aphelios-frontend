import {
    DataGrid,
    GridActionsCellItem,
    GridDeleteIcon,
    GridEditInputCell,
    GridToolbar,
} from '@mui/x-data-grid';
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
    Autocomplete,
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    FormControl,
    GlobalStyles,
    IconButton,
    InputAdornment,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Stack,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import Swal from 'sweetalert2';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RateReviewIcon from '@mui/icons-material/RateReview';
import SendIcon from '@mui/icons-material/Send';
import UpdateIcon from '@mui/icons-material/Update';
import SearchIcon from '@mui/icons-material/Search';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ManageSearchIcon from '@mui/icons-material/ManageSearch';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CancelIcon from '@mui/icons-material/Cancel';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import CloseIcon from '@mui/icons-material/Close';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import PushPinIcon from '@mui/icons-material/PushPin';
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined';
import { read, utils, write } from 'xlsx';
import FetchOrders from './FetchOrders';
// Se conservan ambos CSS: aquí vive la clase ".error" que usan los refs de
// validación (bodegaSalidaRef, ubicacionSalidaRef, ubicacionEntradaRef,
// cantidadRef, descripcionRef) para resaltar en rojo un campo inválido.
import '../../Inventarios/estilosPrueba.css';
import apiUrl from '../../../../config';
import { useNavigate } from 'react-router-dom';
import { useProcess } from '../../../loaders/UseProcess';

// Mensaje de error genérico para cuando el backend no manda un mensaje
// específico (timeouts, caídas de red, errores 500 sin "message", etc.).
// Antes, en varios catch, si no existía error.response.data.message no se
// mostraba NADA al usuario y la orden simplemente "no pasaba nada".
const showErrorFallback = (error, fallbackText) => {
    const backendMessage = error?.response?.data?.message;
    const backendMessageText =
        typeof backendMessage === 'object' ? backendMessage?.messageText : backendMessage;

    Swal.fire({
        title: 'Error',
        text: backendMessageText || fallbackText,
        icon: 'error',
        showCloseButton: true,
        allowEscapeKey: true,
    });
};

// Configuración visual centralizada por estatus de la orden (color + texto).
const ESTATUS_CONFIG = {
    abierto: { label: 'Abierto', color: '#2e7d32', bg: '#e8f5e9' },
    confirmado: { label: 'Confirmado', color: '#ed6c02', bg: '#fff3e0' },
    procesado: { label: 'Procesado', color: '#0288d1', bg: '#e1f5fe' },
    cancelada: { label: 'Cancelada', color: '#d32f2f', bg: '#ffebee' },
};

const getEstatusInfo = (status) =>
    ESTATUS_CONFIG[status] || { label: 'Sin orden', color: '#616161', bg: '#f5f5f5' };

const TableOrdenes = () => {
    const { execute } = useProcess();
    // Spinner del campo "Producto (SKU / código / ML)" mientras se resuelve
    // un escaneo/búsqueda exacta.
    const [loadingProducts, setLoadingProducts] = useState(false);
    // Loader del catálogo completo que llena la modal de selección de
    // productos (independiente del anterior: son dos peticiones distintas).
    const [loadingCatalogo, setLoadingCatalogo] = useState(true);
    // Evita disparar dos cargas del catálogo en paralelo si el usuario abre
    // la modal varias veces seguido antes de que termine la primera.
    const catalogoFetchInFlightRef = useRef(false);

    // Estado adicional para controlar el valor del input
    const [inputValueUbicacion, setInputValueUbicacion] = useState('');
    const [bodegaSalida, setBodegaSalida] = useState([]);
    const [bodegaEntrada, setBodegaEntrada] = useState([]);
    const [productoSku, setProductoSku] = useState('');
    const [productoMlm, setProductoMlm] = useState('');
    const [traspasos, setTraspasos] = useState([]);
    const [selectedBodegaSalida, setSelectedBodegaSalida] = useState('');
    const [selectedBodegaEntrada, setSelectedBodegaEntrada] = useState('');
    const [selectedTraspasoId, setSelectedTraspasoId] = useState('');
    const [inputValue, setInputValue] = useState('');
    const [rows, setRows] = useState([]);
    const [rowsProducts, setRowsProducts] = useState([]);
    const [selectedRow, setSelectedRow] = useState([]);
    const [ubicacionEntrada, setUbicacionEntrada] = useState([]);
    const [bodegaEntradaHabilitada, setBodegaEntradaHabilitada] = useState(false);
    const [bodegaSalidaHabilitada, setBodegaSalidaHabilitada] = useState(false);
    const [ubicacionEntradaHabilitada, setUbicacionEntradaHabilitada] = useState(false);
    const [ubicacionSalidaHabilitada, setUbicacionSalidaHabilitada] = useState(false);
    const [existenciaProducto, setExistenciaProducto] = useState('');
    const [existenciaProductoDestino, setExistenciaProductoDestino] = useState('');
    const [productoId, setProductoId] = useState('');
    const [productoTitle, setProductoTitle] = useState('');
    const [productoLogisticType, setProductoLogisticType] = useState('');
    const [ubicaciones, setUbicaciones] = useState([]);
    const [selectedUbicacionEntrada, setSelectedUbicacionEntrada] = useState('');
    const [selectedUbicacionSalida, setSelectedUbicacionSalida] = useState('');

    // "Fijar" ubicación de entrada/transferencia: la ubicación de destino NO
    // depende del stock del producto (siempre son todas las ubicaciones
    // activas de la bodega), así que se puede bloquear con toda confianza
    // para que se mantenga seleccionada entre un escaneo y otro.
    const [ubicacionEntradaFija, setUbicacionEntradaFija] = useState(false);

    // "Fijar" cantidad: mantiene el mismo valor de "Cantidad" entre un
    // escaneo y otro (útil cuando siempre se recibe/mueve la misma cantidad
    // por producto, p. ej. cajas cerradas de N piezas).
    const [cantidadFija, setCantidadFija] = useState(false);

    // Referencia para no disparar dos veces el alta automática de fila para
    // el mismo producto (ver más abajo, efecto de "entrada 100% fija").
    const autoAddedProductoIdRef = useRef(null);

    const [habilitarTraspaso, setHabilitarTraspaso] = useState(false);
    const [habilitarDescripcion, setHabilitarDescripcion] = useState(false);
    const [habilitarBuscador, setHabilitarBuscador] = useState(false);
    const [habilitarCantidad, setHabilitarCantidad] = useState(false);
    const [descripcion, setDescripcion] = useState('');
    const [idOrder, setIdOrder] = useState('');
    const [estatus, setEstatus] = useState('');
    const [enableConfirm, setEnableConfirm] = useState(false);
    const [enableProcess, setEnableProcess] = useState(false);
    const [enableRevertir, setEnableRevertir] = useState(false);
    const [enableCancel, setEnableCancel] = useState(false);
    const [categoriaTemp, setCategoriaTemp] = useState('');
    const [habilitarComentario, setHabilitarComentario] = useState(false);
    const [openComment, setOpenComment] = useState(false);
    const [selectedComment, setSelectedComment] = useState('');
    const [openModal, setOpenModal] = useState(false);
    const [idTraspaso, setIdTraspaso] = useState('');
    const [rolIdTemp, setRolIdTemp] = useState('');
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
    const [isButtonDisabled, setIsButtonDisabled] = useState(true);
    const [rolMovimiento, setRolMovimiento] = useState('');
    const [rolIdTempEntrada, setRolIdTempEntrada] = useState('');
    const [open, setOpen] = useState(false);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    const [columnVisibilityModel, setColumnVisibilityModel] = useState({
        id: false,
        producto_id: false,
        localidad_salida_id: false,
        localidad_entrada_id: false,
    });

    const navigate = useNavigate();

    const bodegaSalidaRef = useRef(null);
    const bodegaEntradaRef = useRef(null);
    const descripcionRef = useRef(null);
    const ubicacionSalidaRef = useRef(null);
    const ubicacionEntradaRef = useRef(null);
    const cantidadRef = useRef(null);
    const skuInputRef = useRef(null);
    const isAdmin = user?.rol_id === 1;

    // Cancela la búsqueda de existencias anterior cuando arranca una nueva.
    // Evita que una respuesta "vieja" (de un producto que ya no es el que
    // estás consultando) llegue tarde y pise el producto que sí seleccionaste.
    const existenciasAbortRef = useRef(null);

    // Evita que un mismo escaneo dispare dos búsquedas a la vez (por ejemplo,
    // si el lector de código de barras genera "Enter" y además el campo
    // pierde el foco casi al mismo tiempo, onKeyDown y onBlur podrían
    // dispararse juntos).
    const skuSearchInFlightRef = useRef(false);

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
    }, []);

    // Carga (o recarga) el catálogo completo que llena la modal de selección
    // de productos. Se llama al montar el componente Y cada vez que se abre
    // la modal, para que nunca se muestre desactualizada — y mientras está
    // en curso, `loadingCatalogo` hace que el DataGrid muestre su spinner en
    // lugar de "No rows" (que antes aparecía solo porque la carga tardaba y
    // parecía, por error, que no había productos).
    const fetchProducts = async () => {
        if (catalogoFetchInFlightRef.current) return;
        catalogoFetchInFlightRef.current = true;
        setLoadingCatalogo(true);
        try {
            const response = await axios.get(`${apiUrl}/buscador/productos/todo`);
            if (response.data && Array.isArray(response.data)) {
                setRowsProducts(response.data);
                setFilteredProducts(response.data);
            }
        } catch (error) {
            showErrorFallback(
                error,
                'No se pudo cargar el catálogo de productos. Verifica tu conexión e intenta de nuevo.',
            );
        } finally {
            setLoadingCatalogo(false);
            catalogoFetchInFlightRef.current = false;
        }
    };

    // Función que abre la modal y realiza la búsqueda al hacer clic en el ícono de búsqueda
    const handleOpenSearchProducts = async () => {
        if (habilitarBuscador) {
            setOpen(true); // Abre la modal después de la búsqueda
            fetchProducts(); // Refresca el catálogo cada vez que se abre la modal
        }
    };

    const handleCloseSearchProducts = () => setOpen(false);

    useEffect(() => {
        fetchProducts();
    }, []);

    useEffect(() => {
        const fetchBodegas = async () => {
            try {
                const response = await axios.get(
                    `${apiUrl}/inventario/bodegas_y_localidades/nombres/bodegas`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    },
                );
                setBodegaSalida(response.data);
                setBodegaEntrada(response.data);
            } catch (error) {
                showErrorFallback(error, 'No se pudieron cargar las bodegas disponibles.');
            }
        };

        const fetchTipoTraspaso = async () => {
            try {
                const response = await axios.get(`${apiUrl}/inventario/tipoTransaccion`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                const isAdmin = user?.rol_id === 1;

                const resultadosFiltrados = isAdmin
                    ? response.data // 👈 Admin ve todo
                    : response.data.filter((item) => item.rol_id === user.rol_id); // 👈 Solo su rol exacto

                if (resultadosFiltrados.length > 0) {
                    setTraspasos(resultadosFiltrados);
                } else {
                    Swal.fire({
                        title: 'Error',
                        text: 'Sin movimientos disponibles para tu rol',
                        icon: 'warning',
                        timer: 5000,
                        showCloseButton: true,
                        allowEscapeKey: true,
                    });
                }
            } catch (error) {
                showErrorFallback(error, 'No se pudieron cargar los tipos de movimiento.');
            }
        };

        fetchTipoTraspaso();
        fetchBodegas();
    }, []);

    const handleUbicacionSelectSalida = (e) => {
        const selectedId = parseInt(e.target.value, 10);
        setSelectedUbicacionSalida(selectedId);

        const selectedUbicacionSalida = ubicaciones.find((ubic) => ubic.id === selectedId);

        if (selectedUbicacionSalida) {
            setExistenciaProducto(selectedUbicacionSalida.disponible);
        }

        if (ubicacionSalidaRef.current) {
            ubicacionSalidaRef.current.classList.remove('error');
        }
    };

    // Bloquea/desbloquea la ubicación de entrada (destino) entre escaneos.
    // Como el destino nunca depende del stock del producto, se puede fijar
    // con confianza total.
    const handleToggleUbicacionEntradaFija = () => {
        if (!ubicacionEntradaFija && !selectedUbicacionEntrada) {
            Swal.fire({
                title: 'Selecciona una ubicación primero',
                text: 'Elige la ubicación de entrada que quieres fijar antes de bloquearla.',
                icon: 'info',
                timer: 4000,
                showCloseButton: true,
                allowEscapeKey: true,
            });
            return;
        }
        setUbicacionEntradaFija((prev) => !prev);
    };

    // Bloquea/desbloquea la cantidad entre escaneos. Aplica para cualquier
    // tipo de movimiento (entrada, salida, transferencia); el "alta
    // automática de fila" de más abajo es lo único exclusivo de entradas.
    const handleToggleCantidadFija = () => {
        if (!cantidadFija && !inputValue) {
            Swal.fire({
                title: 'Ingresa una cantidad primero',
                text: 'Escribe la cantidad que quieres fijar antes de bloquearla.',
                icon: 'info',
                timer: 4000,
                showCloseButton: true,
                allowEscapeKey: true,
            });
            return;
        }
        setCantidadFija((prev) => !prev);
    };

    const handleUbicacionSelectEntrada = (e) => {
        const selectedIdEntrada = parseInt(e.target.value, 10);
        setSelectedUbicacionEntrada(selectedIdEntrada);

        const selectedUbicacionEntrada = ubicacionEntrada.find(
            (ubicacion) => ubicacion.id === parseInt(selectedIdEntrada),
        );

        if (selectedUbicacionEntrada) {
            setExistenciaProductoDestino(selectedUbicacionEntrada.cantidad);
        }

        if (ubicacionEntradaRef.current) {
            ubicacionEntradaRef.current.classList.remove('error');
        }
    };

    const handleSelectBodegaSalida = (e) => {
        const bodegaId = e.target.value;
        setSelectedBodegaSalida(bodegaId);
        setHabilitarBuscador(true);

        if (bodegaSalidaRef.current) {
            bodegaSalidaRef.current.classList.remove('error');
        }
    };

    const handleSelectBodegaEntrada = (e) => {
        const bodegaId = e.target.value;
        setSelectedBodegaEntrada(bodegaId);
        setHabilitarBuscador(true);

        if (bodegaEntradaRef.current) {
            bodegaEntradaRef.current.classList.remove('error');
        }
    };

    const handleSelectedTraspasoChange = (e) => {
        const traspasoId = parseInt(e.target.value);
        setSelectedTraspasoId(traspasoId);

        const tipoTraspasoSeleccionado = traspasos.find((traspaso) => traspaso.id === traspasoId);
        if (tipoTraspasoSeleccionado) {
            setHabilitarDescripcion(true);
            setCategoriaTemp(tipoTraspasoSeleccionado.categoria);
            setIdTraspaso(tipoTraspasoSeleccionado.id);
            setRolMovimiento(tipoTraspasoSeleccionado.rol_id);
        }
    };

    useEffect(() => {
        if (categoriaTemp === 'entrada' || categoriaTemp === 'conteo ciclico') {
            setBodegaSalidaHabilitada(false);
            setBodegaEntradaHabilitada(true);
        } else if (categoriaTemp === 'salida') {
            setBodegaSalidaHabilitada(true);
            setBodegaEntradaHabilitada(false);
        } else if (categoriaTemp === 'transferencia') {
            setBodegaSalidaHabilitada(true);
            setBodegaEntradaHabilitada(true);
        } else {
            setBodegaSalidaHabilitada(false);
            setBodegaEntradaHabilitada(false);
        }
    }, [categoriaTemp]);

    const fetchExistencias = async (productoId) => {
        // Si ya había una búsqueda de existencias en curso (de otro producto),
        // se cancela: así una respuesta tardía de esa búsqueda anterior nunca
        // puede llegar después y sobreescribir el producto que sí seleccionaste.
        if (existenciasAbortRef.current) {
            existenciasAbortRef.current.abort();
        }
        const abortController = new AbortController();
        existenciasAbortRef.current = abortController;

        // Verificar si las refs no son null antes de acceder a classList
        if (bodegaSalidaRef.current) {
            bodegaSalidaRef.current.classList.remove('error');
        }
        if (bodegaEntradaRef.current) {
            bodegaEntradaRef.current.classList.remove('error');
        }

        if (ubicacionSalidaRef.current) {
            ubicacionSalidaRef.current.classList.remove('error');
        }

        if (ubicacionEntradaRef.current) {
            ubicacionEntradaRef.current.classList.remove('error');
        }

        if (cantidadRef.current) {
            cantidadRef.current.classList.remove('error');
        }

        let isValid = true;

        try {
            if (categoriaTemp === 'transferencia') {
                if (!selectedBodegaSalida) {
                    if (bodegaSalidaRef.current) {
                        bodegaSalidaRef.current.classList.add('error');
                    }
                    isValid = false;
                }
                if (!selectedBodegaEntrada) {
                    if (bodegaEntradaRef.current) {
                        bodegaEntradaRef.current.classList.add('error');
                    }
                    isValid = false;
                }

                if (!isValid) {
                    Swal.fire({
                        title: '¡Faltan datos!',
                        text: 'Por favor, selecciona ambas bodegas',
                        icon: 'warning',
                        timer: 5000,
                        showCloseButton: true,
                        allowEscapeKey: true,
                    });
                    return;
                }
                const response = await axios.get(
                    `${apiUrl}/inventario/ordenBodegas_y_lineasBodegas/producto/${productoId}/bodegaSalida/${selectedBodegaSalida}/bodegaEntrada/${selectedBodegaEntrada}/transferencia`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                        signal: abortController.signal,
                    },
                );
                // Verificar si el producto existe
                if (response.data.data.salida.length === 0) {
                    Swal.fire({
                        title: '!Producto no encontrado!',
                        text: 'No se encontraron existencias, verifique el producto',
                        icon: 'error',
                        timer: 5000,
                        showCloseButton: true,
                        allowEscapeKey: true,
                    });
                    return; // Salir de la función si el producto no existe
                }
                setUbicaciones(response.data.data.salida);
                setUbicacionEntrada(response.data.data.entrada);
                setProductoTitle(response.data.data.producto.title);
                setProductoSku(response.data.data.producto.sku);
                setProductoId(response.data.data.producto.producto_id);
                setProductoMlm(response.data.data.producto.inventory_id);
                setProductoLogisticType(response.data.data.producto.logistic_type || '');
            } else {
                let bodegaSeleccionada;

                if (categoriaTemp === 'entrada') {
                    bodegaSeleccionada = selectedBodegaEntrada;
                } else if (categoriaTemp === 'salida') {
                    bodegaSeleccionada = selectedBodegaSalida;
                } else {
                    Swal.fire({
                        title: '¡Faltan datos!',
                        text: 'Selecciona un tipo de movimiento válido antes de buscar el producto.',
                        icon: 'warning',
                        timer: 5000,
                        showCloseButton: true,
                        allowEscapeKey: true,
                    });
                    return;
                }
                const response = await axios.get(
                    `${apiUrl}/inventario/ordenBodegas_y_lineasBodegas/producto/${productoId}/bodega/${bodegaSeleccionada}/tipo/${categoriaTemp}/localidades`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                        signal: abortController.signal,
                    },
                );
                // Verificar si el producto existe
                if (
                    !response.data ||
                    !response.data.data ||
                    !Array.isArray(response.data.data.existencias) ||
                    response.data.data.existencias.length === 0
                ) {
                    Swal.fire({
                        title: '!Producto no encontrado!',
                        text: 'No se encontraron existencias, verifique el producto',
                        icon: 'error',
                        timer: 5000,
                        showCloseButton: true,
                        allowEscapeKey: true,
                    });
                    return; // Salir de la función si el producto no existe
                }

                // Si la bodega de salida está habilitada
                if (categoriaTemp === 'salida' && response.data.ok) {
                    setUbicaciones(response.data.data.existencias);
                    setProductoTitle(response.data.data.producto.title);
                    setProductoSku(response.data.data.producto.sku);
                    setProductoMlm(response.data.data.producto.inventory_id);
                    setProductoId(response.data.data.producto.producto_id);
                    setProductoLogisticType(response.data.data.producto.logistic_type || '');
                } else if (categoriaTemp === 'entrada' && response.data.ok) {
                    setUbicacionEntrada(response.data.data.existencias);
                    setProductoTitle(response.data.data.producto.title);
                    setProductoSku(response.data.data.producto.sku);
                    setProductoMlm(response.data.data.producto.inventory_id);
                    setProductoId(response.data.data.producto.producto_id);
                    setProductoLogisticType(response.data.data.producto.logistic_type || '');
                }
            }
        } catch (error) {
            // Una búsqueda cancelada a propósito (porque el usuario ya
            // seleccionó otro producto) no es un error real: no mostrar nada.
            if (axios.isCancel(error) || error.code === 'ERR_CANCELED') {
                return;
            }
            showErrorFallback(error, 'No se pudieron consultar las existencias del producto.');
        }
    };

    const handleSearch = async (productoId) => {
        if (productoId) {
            fetchExistencias(productoId);
            setIsButtonDisabled(false);
            if (categoriaTemp === 'transferencia') {
                setUbicacionSalidaHabilitada(true);
                setUbicacionEntradaHabilitada(true);
                setHabilitarCantidad(true);
                setHabilitarComentario(true);
            } else if (categoriaTemp === 'salida') {
                setUbicacionSalidaHabilitada(true);
                setUbicacionEntradaHabilitada(false);
                setHabilitarCantidad(true);
                setHabilitarComentario(true);
            } else if (categoriaTemp === 'entrada') {
                setUbicacionEntradaHabilitada(true);
                setUbicacionSalidaHabilitada(false);
                setHabilitarCantidad(true);
                setHabilitarComentario(true);
            }
        }
    };

    const processRowUpdate = async (updatedRow, oldRow) => {
        try {
            // Llamar a handleUpdateLinea para realizar la actualización en la base de datos
            await handleUpdateLinea(updatedRow);

            // Si todo sale bien, devolver la fila actualizada
            return updatedRow;
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Ha ocurrido un error desconocido';
            Swal.fire({
                title: '¡No se pudo actualizar la linea!',
                text: errorMessage,
                icon: 'error',
                showCloseButton: true,
                allowEscapeKey: true,
            });
            return oldRow;
        }
    };

    const parseOrNull = (value) => {
        const parsedValue = parseInt(value);
        return isNaN(parsedValue) ? null : parsedValue;
    };

    const showHelpManual = () => {
        Swal.fire({
            title: '<strong>Seleccione el Tipo de Transacción</strong>',
            icon: 'question',
            text: '¿Qué tipo de movimiento o plantilla necesitas consultar?',
            showCancelButton: true,
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#1B365D',
            input: 'select',
            inputOptions: {
                entrada: '🟢 Orden de Entrada',
                salida: '🔴 Orden de Salida',
                transferencia: '🔵 Transferencia / Traspaso',
            },
            inputPlaceholder: 'Seleccione una opción',
            inputValidator: (value) => {
                if (!value) {
                    return 'Debe seleccionar un tipo de transacción para continuar';
                }
            },
        }).then((result) => {
            if (result.isConfirmed) {
                const tipo = result.value;
                mostrarManualEspecifico(tipo);
            }
        });
    };

    const mostrarManualEspecifico = (tipo) => {
        let titulo = '';
        let colorTexto = '';
        let cuerpoHtml = '';

        if (tipo === 'entrada') {
            titulo = '🟢 Manual de Importación: ENTRADAS';
            colorTexto = '#1E4620';
            cuerpoHtml = `
            <div style="text-align: left; font-size: 14px; max-height: 400px; overflow-y: auto; padding: 5px;">
                <p>Usa este flujo para ingresar inventario al sistema (Compras, Ajustes positivos, etc.).</p>
                <hr/>
                <h4 style="color: ${colorTexto}; margin-bottom: 5px;">1. Nueva Orden de Entrada</h4>
                <p style="margin-top: 0;">Deje <b>orden_id</b> vacío. Campos obligatorios de cabecera a repetir por fila:</p>
                <ul>
                    <li><b>tipo_transaccion_id:</b> ID cuyo tipo_transaccion.categoria sea 'entrada'.</li>
                    <li><b>bodega_entrada_id:</b> ID de la bodega destino.</li>
                    <li><b>descripcion:</b> Motivo de la entrada.</li>
                </ul>
                <h4 style="color: #6c757d; margin-bottom: 5px;">2. Añadir a Entrada Existente</h4>
                <ul>
                    <li>Escriba el ID de la orden en <b>orden_id</b> y llene solo los datos del producto.</li>
                </ul>
                <hr/>
                <p><b>Campos obligatorios por línea:</b> producto_id, cantidad, localidad_entrada_id.</p>
            </div>
        `;
        } else if (tipo === 'salida') {
            titulo = '🔴 Manual de Importación: SALIDAS';
            colorTexto = '#7A1C1C';
            cuerpoHtml = `
            <div style="text-align: left; font-size: 14px; max-height: 400px; overflow-y: auto; padding: 5px;">
                <p>Usa este flujo para retirar inventario por mermas, ajustes negativos o bajas.</p>
                <hr/>
                <h4 style="color: ${colorTexto}; margin-bottom: 5px;">1. Nueva Orden de Salida</h4>
                <p style="margin-top: 0;">Deje <b>orden_id</b> vacío. Campos obligatorios de cabecera a repetir por fila:</p>
                <ul>
                    <li><b>tipo_transaccion_id:</b> ID cuyo tipo_transaccion.categoria sea 'salida'.</li>
                    <li><b>bodega_salida_id:</b> ID de la bodega de origen.</li>
                    <li><b>descripcion:</b> Motivo de la salida.</li>
                </ul>
                <h4 style="color: #6c757d; margin-bottom: 5px;">2. Añadir a Salida Existente</h4>
                <ul>
                    <li>Escriba el ID de la orden en <b>orden_id</b> y llene solo los datos del producto.</li>
                </ul>
                <hr/>
                <p><b>Campos obligatorios por línea:</b> producto_id, cantidad, localidad_salida_id.</p>
            </div>
        `;
        } else if (tipo === 'transferencia') {
            titulo = '🔵 Manual de Importación: TRANSFERENCIAS';
            colorTexto = '#1B365D';
            cuerpoHtml = `
            <div style="text-align: left; font-size: 14px; max-height: 400px; overflow-y: auto; padding: 5px;">
                <p>Usa este flujo para mover mercancía entre tus bodegas registradas (Traspasos).</p>
                <hr/>
                <h4 style="color: ${colorTexto}; margin-bottom: 5px;">1. Nueva Transferencia</h4>
                <p style="margin-top: 0;">Deje <b>orden_id</b> vacío. Campos obligatorios de cabecera a repetir por fila:</p>
                <ul>
                    <li><b>bodega_salida_id:</b> Bodega origen del stock.</li>
                    <li><b>bodega_entrada_id:</b> Bodega destino del stock.</li>
                    <li><b>descripcion:</b> Motivo del traspaso inter-bodega.</li>
                </ul>
                <h4 style="color: #6c757d; margin-bottom: 5px;">2. Añadir a Transferencia Existente</h4>
                <ul>
                    <li>Escriba el ID de la orden en <b>orden_id</b>.</li>
                </ul>
                <hr/>
                <p><b>Campos obligatorios por línea:</b> producto_id, cantidad, localidad_salida_id, localidad_entrada_id.</p>
            </div>
        `;
        }

        Swal.fire({
            title: `<strong style="color: ${colorTexto};">${titulo}</strong>`,
            icon: 'info',
            html: cuerpoHtml,
            showCloseButton: true,
            showCancelButton: true,
            focusConfirm: false,
            confirmButtonText: '<i class="fa fa-download"></i> Descargar Plantilla',
            confirmButtonColor: colorTexto,
            cancelButtonText: 'Regresar',
        }).then((result) => {
            if (result.isConfirmed) {
                handleDownloadTemplate(tipo);
            } else if (result.dismiss === Swal.DismissReason.cancel) {
                showHelpManual(); // Reabre el selector inicial si presiona regresar
            }
        });
    };

    const handleDownloadTemplate = (tipo) => {
        const workbook = utils.book_new();
        let templateData = [];
        let nameSheet = '';

        if (tipo === 'entrada') {
            nameSheet = 'Plantilla Entrada';
            templateData = [
                {
                    orden_id: '',
                    tipo_transaccion_id: 1,
                    bodega_entrada_id: 3,
                    descripcion: 'Entrada masiva por inventario inicial',
                    producto_id: 101,
                    cantidad: 50,
                    localidad_entrada_id: 12,
                    comentario: 'Fila ejemplo nueva orden',
                },
                {
                    orden_id: '',
                    tipo_transaccion_id: 1,
                    bodega_entrada_id: 3,
                    descripcion: 'Entrada masiva por inventario inicial',
                    producto_id: 102,
                    cantidad: 25,
                    localidad_entrada_id: 13,
                    comentario: 'Fila ejemplo nueva orden',
                },
                {
                    orden_id: 452,
                    tipo_transaccion_id: '',
                    bodega_entrada_id: '',
                    descripcion: '',
                    producto_id: 204,
                    cantidad: 5,
                    localidad_entrada_id: 14,
                    comentario: 'Fila ejemplo agregar a orden existente',
                },
            ];
        } else if (tipo === 'salida') {
            nameSheet = 'Plantilla Salida';
            templateData = [
                {
                    orden_id: '',
                    tipo_transaccion_id: 2,
                    bodega_salida_id: 4,
                    descripcion: 'Salida masiva por merma u obsolescencia',
                    producto_id: 301,
                    cantidad: 10,
                    localidad_salida_id: 45,
                    comentario: 'Fila ejemplo nueva orden',
                },
                {
                    orden_id: '',
                    tipo_transaccion_id: 2,
                    bodega_salida_id: 4,
                    descripcion: 'Salida masiva por merma u obsolescencia',
                    producto_id: 302,
                    cantidad: 12,
                    localidad_salida_id: 46,
                    comentario: 'Fila ejemplo nueva orden',
                },
                {
                    orden_id: 453,
                    tipo_transaccion_id: '',
                    bodega_salida_id: '',
                    descripcion: '',
                    producto_id: 501,
                    cantidad: 2,
                    localidad_salida_id: 47,
                    comentario: 'Fila ejemplo agregar a orden existente',
                },
            ];
        } else if (tipo === 'transferencia') {
            nameSheet = 'Plantilla Transferencia';
            templateData = [
                {
                    orden_id: '',
                    tipo_transaccion_id: 3,
                    bodega_salida_id: 3,
                    bodega_entrada_id: 5,
                    descripcion: 'Reabastecimiento sucursal norte',
                    producto_id: 601,
                    cantidad: 100,
                    localidad_salida_id: 12,
                    localidad_entrada_id: 88,
                    comentario: 'Ejemplo nueva transferencia',
                },
                {
                    orden_id: '',
                    tipo_transaccion_id: 3,
                    bodega_salida_id: 3,
                    bodega_entrada_id: 5,
                    descripcion: 'Reabastecimiento sucursal norte',
                    producto_id: 602,
                    cantidad: 150,
                    localidad_salida_id: 12,
                    localidad_entrada_id: 89,
                    comentario: 'Ejemplo nueva transferencia',
                },
                {
                    orden_id: 454,
                    tipo_transaccion_id: '',
                    bodega_salida_id: '',
                    bodega_entrada_id: '',
                    descripcion: '',
                    producto_id: 705,
                    cantidad: 30,
                    localidad_salida_id: 15,
                    localidad_entrada_id: 90,
                    comentario: 'Ejemplo agregar a transferencia existente',
                },
            ];
        }

        const worksheet = utils.json_to_sheet(templateData);
        utils.book_append_sheet(workbook, worksheet, nameSheet);

        // Forzar descarga del archivo estructurado de forma limpia
        const excelBuffer = write(workbook, { bookType: 'xlsx', type: 'array' });
        const dataBlob = new Blob([excelBuffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        const url = window.URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Plantilla_Masiva_${tipo.toUpperCase()}.xlsx`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleGenerarOrder = () => {
        if (selectedUbicacionSalida && parseInt(inputValue) > parseInt(existenciaProducto)) {
            Swal.fire({
                title: '¡Error!',
                text: 'La cantidad no puede ser mayor que las existencias disponibles.',
                icon: 'error',
                timer: 5000,
                showCloseButton: true,
                allowEscapeKey: true,
            });
            return TableOrdenes;
        }

        execute(
            async () => {
                const handleAddRow = (lineasIds = []) => {
                    const selectedUbicacionSalidaDescripcion =
                        ubicaciones.find((ubic) => ubic.id === selectedUbicacionSalida)?.descripcion || '';
                    const selectedUbicacionEntradaDescripcion =
                        ubicacionEntrada.find((ubicacion) => ubicacion.id === selectedUbicacionEntrada)
                            ?.descripcion || '';

                    const newRow = {
                        id: lineasIds[0] || rows.length + 1, // Asigna un ID único
                        cantidad: parseInt(inputValue),
                        producto_id: productoId, // ID del producto seleccionado,
                        sku: productoSku,
                        inventory_id: productoMlm,
                        producto_title: productoTitle,
                        logistic_type: productoLogisticType,
                        existencias_origen: existenciaProducto,
                        existencias_destino: existenciaProductoDestino,
                        localidad_entrada: selectedUbicacionEntradaDescripcion,
                        localidad_salida: selectedUbicacionSalidaDescripcion,
                        localidad_entrada_id: selectedUbicacionEntrada,
                        localidad_salida_id: selectedUbicacionSalida,
                        comentario: selectedComment,
                    };

                    // La fila más reciente se muestra primero (arriba de todo).
                    setRows((prevRows) => [newRow, ...prevRows]);

                    setProductoId('');
                    setProductoSku('');
                    setProductoMlm('');
                    // Libera el guardado de "ya se agregó esta fila sola" para
                    // que, si se vuelve a escanear el MISMO producto_id (otra
                    // caja del mismo SKU, por ejemplo), la fila se vuelva a
                    // agregar automáticamente en vez de quedarse bloqueada.
                    autoAddedProductoIdRef.current = null;
                    // La ubicación de entrada solo se limpia si NO está fijada;
                    // fijada, se mantiene para el siguiente escaneo.
                    if (!ubicacionEntradaFija) {
                        setSelectedUbicacionEntrada('');
                    }
                    // La ubicación de salida se limpia siempre aquí: en cuanto
                    // se escanee el siguiente producto, el efecto de
                    // autoselección la vuelve a calcular sola (la de menor
                    // stock disponible para ESE producto).
                    setSelectedUbicacionSalida('');
                    setExistenciaProducto('');
                    setExistenciaProductoDestino('');
                    // La cantidad solo se limpia si NO está fijada.
                    if (!cantidadFija) {
                        setInputValue('');
                    }
                    setSelectedComment('');
                    setIsButtonDisabled(true);

                    // Regresa el foco al campo de escaneo para poder seguir
                    // escaneando el siguiente producto sin usar el mouse.
                    skuInputRef.current?.focus();
                };

                if (estatus === 'abierto') {
                    const lineasData = {
                        lineas: [
                            {
                                producto_id: productoId,
                                cantidad: parseInt(inputValue),
                                comentario: selectedComment,
                                localidad_salida_id: parseOrNull(selectedUbicacionSalida),
                                localidad_entrada_id: parseOrNull(selectedUbicacionEntrada),
                            },
                        ],
                    };

                    const enviarLineas = async (ordenId) => {
                        if (ubicacionSalidaRef.current) {
                            ubicacionSalidaRef.current.classList.remove('error');
                        }
                        if (ubicacionEntradaRef.current) {
                            ubicacionEntradaRef.current.classList.remove('error');
                        }

                        if (cantidadRef.current) {
                            cantidadRef.current.classList.remove('error');
                        }

                        let isValid = true;

                        try {
                            if (categoriaTemp === 'transferencia') {
                                if (!selectedUbicacionSalida) {
                                    if (ubicacionSalidaRef.current) {
                                        ubicacionSalidaRef.current.classList.add('error');
                                    }
                                    isValid = false;
                                }
                                if (!selectedUbicacionEntrada) {
                                    if (ubicacionEntradaRef.current) {
                                        ubicacionEntradaRef.current.classList.add('error');
                                    }
                                    isValid = false;
                                }
                                if (!inputValue) {
                                    if (cantidadRef.current) {
                                        cantidadRef.current.classList.add('error');
                                    }
                                    isValid = false;
                                }
                                if (!isValid) {
                                    Swal.fire({
                                        title: '¡Faltan datos!',
                                        text: 'Por favor, selecciona y rellena todos los campos',
                                        icon: 'warning',
                                        timer: 5000,
                                        showCloseButton: true,
                                        allowEscapeKey: true,
                                    });
                                    return;
                                }
                            } else if (categoriaTemp === 'salida') {
                                if (!selectedUbicacionSalida) {
                                    if (ubicacionSalidaRef.current) {
                                        ubicacionSalidaRef.current.classList.add('error');
                                    }
                                    isValid = false;
                                }
                                if (!inputValue) {
                                    if (cantidadRef.current) {
                                        cantidadRef.current.classList.add('error');
                                    }
                                    isValid = false;
                                }
                                if (!isValid) {
                                    Swal.fire({
                                        title: '¡Faltan datos!',
                                        text: 'Por favor, selecciona y rellena todos los campos',
                                        icon: 'warning',
                                        timer: 5000,
                                        showCloseButton: true,
                                        allowEscapeKey: true,
                                    });
                                    return;
                                }
                            } else if (categoriaTemp === 'entrada') {
                                if (!selectedUbicacionEntrada) {
                                    if (ubicacionEntradaRef.current) {
                                        ubicacionEntradaRef.current.classList.add('error');
                                    }
                                    isValid = false;
                                }
                                if (!inputValue) {
                                    if (cantidadRef.current) {
                                        cantidadRef.current.classList.add('error');
                                    }
                                    isValid = false;
                                }
                                if (!isValid) {
                                    Swal.fire({
                                        title: '¡Faltan datos!',
                                        text: 'Por favor, selecciona y rellena todos los campos',
                                        icon: 'warning',
                                        timer: 5000,
                                        showCloseButton: true,
                                        allowEscapeKey: true,
                                    });
                                    return;
                                }
                            }
                            const response = await axios.post(
                                `${apiUrl}/inventario/ordenBodegas_y_lineasBodegas/orden/${ordenId}/lineas`,
                                lineasData,
                                {
                                    headers: {
                                        Authorization: `Bearer ${token}`,
                                    },
                                },
                            );
                            if (response.data.ok && response.data.lineasIds) {
                                handleAddRow(response.data.lineasIds); // Pasar los IDs de las líneas al método de agregar filas
                            }
                        } catch (error) {
                            showErrorFallback(error, 'No se pudo agregar la línea a la orden.');
                        }
                    };

                    // Llamar a la función con el ID de la orden correspondiente
                    const ordenId = idOrder; // Cambia esto por el ID de la orden real
                    await enviarLineas(ordenId);
                } else if (!estatus) {
                    const dateTime = new Date().toISOString().slice(0, 19).replace('T', ' ');

                    const data = {
                        fecha_abierto: dateTime,
                        tipo_transaccion_id: idTraspaso,
                        bodega_salida_id: parseOrNull(selectedBodegaSalida),
                        bodega_entrada_id: parseOrNull(selectedBodegaEntrada),
                        estatus: 'abierto',
                        descripcion: descripcion,
                        lineas: [
                            {
                                producto_id: productoId,
                                cantidad: parseInt(inputValue),
                                comentario: selectedComment,
                                localidad_salida_id: parseOrNull(selectedUbicacionSalida),
                                localidad_entrada_id: parseOrNull(selectedUbicacionEntrada),
                            },
                        ],
                    };

                    if (descripcionRef.current) {
                        descripcionRef.current.classList.remove('error');
                    }

                    if (ubicacionSalidaRef.current) {
                        ubicacionSalidaRef.current.classList.remove('error');
                    }
                    if (ubicacionEntradaRef.current) {
                        ubicacionEntradaRef.current.classList.remove('error');
                    }

                    if (cantidadRef.current) {
                        cantidadRef.current.classList.remove('error');
                    }

                    let isValid = true;

                    if (!descripcion) {
                        if (descripcionRef.current) {
                            descripcionRef.current.classList.add('error');
                        }
                        isValid = false;
                    }

                    if (!isValid) {
                        Swal.fire({
                            title: '¡Faltan datos!',
                            text: 'Por favor, escribe una descripcion para tu orden',
                            icon: 'warning',
                            timer: 5000,
                            showCloseButton: true,
                            allowEscapeKey: true,
                        });
                        return;
                    }

                    if (categoriaTemp === 'transferencia') {
                        if (!selectedUbicacionSalida) {
                            if (ubicacionSalidaRef.current) {
                                ubicacionSalidaRef.current.classList.add('error');
                            }
                            isValid = false;
                        }
                        if (!selectedUbicacionEntrada) {
                            if (ubicacionEntradaRef.current) {
                                ubicacionEntradaRef.current.classList.add('error');
                            }
                            isValid = false;
                        }
                        if (!inputValue) {
                            if (cantidadRef.current) {
                                cantidadRef.current.classList.add('error');
                            }
                            isValid = false;
                        }
                        if (!isValid) {
                            Swal.fire({
                                title: '¡Faltan datos!',
                                text: 'Por favor, selecciona y rellena todos los campos',
                                icon: 'warning',
                                timer: 5000,
                                showCloseButton: true,
                                allowEscapeKey: true,
                            });
                            return;
                        }
                    } else if (categoriaTemp === 'salida') {
                        if (!selectedUbicacionSalida) {
                            if (ubicacionSalidaRef.current) {
                                ubicacionSalidaRef.current.classList.add('error');
                            }
                            isValid = false;
                        }
                        if (!inputValue) {
                            if (cantidadRef.current) {
                                cantidadRef.current.classList.add('error');
                            }
                            isValid = false;
                        }
                        if (!isValid) {
                            Swal.fire({
                                title: '¡Faltan datos!',
                                text: 'Por favor, selecciona y rellena todos los campos',
                                icon: 'warning',
                                timer: 5000,
                                showCloseButton: true,
                                allowEscapeKey: true,
                            });
                            return;
                        }
                    } else if (categoriaTemp === 'entrada') {
                        if (!selectedUbicacionEntrada) {
                            if (ubicacionEntradaRef.current) {
                                ubicacionEntradaRef.current.classList.add('error');
                            }
                            isValid = false;
                        }
                        if (!inputValue) {
                            if (cantidadRef.current) {
                                cantidadRef.current.classList.add('error');
                            }
                            isValid = false;
                        }
                        if (!isValid) {
                            Swal.fire({
                                title: '¡Faltan datos!',
                                text: 'Por favor, selecciona y rellena todos los campos',
                                icon: 'warning',
                                timer: 5000,
                                showCloseButton: true,
                                allowEscapeKey: true,
                            });
                            return;
                        }
                    }
                    const response = await axios.post(
                        `${apiUrl}/inventario/ordenBodegas_y_lineasBodegas/orden/${idTraspaso}`,
                        data,
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                            },
                        },
                    );
                    if (response.data.ok) {
                        let resultRolId;
                        let resultRolIdEntrada;
                        if (categoriaTemp === 'salida') {
                            // Aquí guarda el rol_id de la bodega en rolIdTemp
                            resultRolId = response.data.rolIdSalida;
                        } else if (categoriaTemp === 'entrada') {
                            resultRolIdEntrada = response.data.rolIdEntrada;
                        } else if (categoriaTemp === 'transferencia') {
                            resultRolId = response.data.rolIdSalida;
                            resultRolIdEntrada = response.data.rolIdEntrada;
                        }
                        setRolIdTemp(resultRolId);
                        setRolIdTempEntrada(resultRolIdEntrada);
                        setIdOrder(response.data.id);
                        setEstatus(response.data.estatus);
                        if (response.data.lineasIds) {
                            handleAddRow(response.data.lineasIds); // Pasar los IDs de las líneas al método de agregar filas
                        } else {
                            handleAddRow(); // Si no hay lineasIds, agregar la fila sin esa información
                        }
                    }
                }
            },
            {
                loadingText: 'Generando orden...',
                onError: (error) => {
                    showErrorFallback(error, 'Ocurrió un error inesperado al generar la orden.');
                },
            },
        );
    };

    const handleImportExcel = async (e) => {
        const file = e.target.files[0];

        if (!file) {
            Swal.fire({
                title: 'Error',
                text: 'No se selecciono ningún archivo excel',
                icon: 'error',
                timer: 5000,
                showCloseButton: true,
                allowEscapeKey: true,
            });
            return;
        }

        const reader = new FileReader();

        reader.onload = async (event) => {
            const arrayBuffer = event.target.result;

            try {
                const workbook = read(arrayBuffer, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = utils.sheet_to_json(worksheet);

                // Iterar sobre cada fila del archivo Excel
                // Mapear los datos al formato requerido por el backend
                const lineasData = {
                    lineas: jsonData.map((row) => ({
                        orden_id: row.orden_id ? parseInt(row.orden_id, 10) : null,
                        tipo_transaccion_id: row.tipo_transaccion_id
                            ? parseInt(row.tipo_transaccion_id, 10)
                            : null,
                        bodega_salida_id: row.bodega_salida_id ? parseInt(row.bodega_salida_id, 10) : null,
                        bodega_entrada_id: row.bodega_entrada_id ? parseInt(row.bodega_entrada_id, 10) : null,
                        descripcion: row.descripcion || '',
                        producto_id: row.producto_id,
                        cantidad: parseInt(row.cantidad, 10),
                        comentario: row.comentario || '',
                        localidad_salida_id: row.localidad_salida_id || null,
                        localidad_entrada_id: row.localidad_entrada_id || null,
                    })),
                };

                try {
                    const response = await axios.post(
                        `${apiUrl}/inventario/ordenBodegas_y_lineasBodegas/excel-masivo`,
                        lineasData,
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                            },
                        },
                    );

                    const { message, errores } = response.data;
                    if (errores && errores.length > 0) {
                        const erroresText = errores
                            .map((err, index) => `${index + 1}. ${err.message}`)
                            .join('<br>');

                        Swal.fire({
                            title: 'Advertencia',
                            html: `<p>${message}</p><div>${erroresText}</div>`,
                            icon: 'warning', // Cambia el icono a "warning" para representar éxito parcial
                            showCloseButton: true,
                            allowEscapeKey: true,
                        });
                        fetchOrderSelected(idOrder);
                    }
                    // 3. Extraer el ID de la nueva orden devuelto por el backend
                    const idNuevaOrden = response.data.idOrdenNueva;

                    if (idNuevaOrden) {
                        // 🔥 Si el Excel creó una orden nueva, la seleccionamos y cargamos en pantalla automáticamente
                        fetchOrderSelected(idNuevaOrden);

                        Swal.fire({
                            title: '¡Importación Exitosa!',
                            text: `Se ha creado y cargado automáticamente la nueva Orden de Bodega #${idNuevaOrden}`,
                            icon: 'success',
                        });
                    } else {
                        // Si no hay idNuevaOrden significa que agregaron líneas a órdenes que ya existían
                        // Aquí puedes recargar la orden actual si ya tenías una seleccionada
                        if (idOrder) {
                            fetchOrderSelected(idOrder);
                        }

                        Swal.fire({
                            title: '¡Líneas Agregadas!',
                            text: 'Se han añadido las líneas a las órdenes correspondientes con éxito.',
                            icon: 'success',
                        });
                    }
                } catch (error) {
                    showErrorFallback(error, 'Ha ocurrido un error al procesar el archivo en el servidor.');
                }
            } catch (error) {
                showErrorFallback(error, 'No se pudo leer el contenido del archivo Excel.');
            }
        };

        reader.onerror = () => {
            Swal.fire({
                title: 'Error',
                text: 'Error al leer el archivo Excel',
                icon: 'error',
                showCloseButton: true,
                allowEscapeKey: true,
            });
        };

        reader.readAsArrayBuffer(file);
    };

    const handleConfirmarOrden = () => {
        execute(
            async () => {
                const dateTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
                const data = {
                    fecha_confirmada: dateTime,
                };

                const response = await axios.post(
                    `${apiUrl}/inventario/ordenBodegas_y_lineasBodegas/confirmar/${idOrder}`,
                    data,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    },
                );

                if (response.data.ok) {
                    setIdOrder(response.data.ordenId);
                    setEstatus(response.data.estatus);
                    Swal.fire({
                        title: '¡Orden confirmada!',
                        text: 'La orden se confirmo exitosamente!',
                        icon: 'success',
                        timer: 5000,
                        showCloseButton: true,
                        allowEscapeKey: true,
                    });
                }
            },
            {
                loadingText: 'Confirmando orden...',
                onError: (error) => {
                    showErrorFallback(error, 'Ocurrió un error inesperado al confirmar la orden.');
                },
            },
        );
    };

    const handleCancelOrden = () => {
        execute(
            async () => {
                const dateTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
                const data = {
                    fecha_procesada: dateTime,
                };

                const response = await axios.post(
                    `${apiUrl}/inventario/ordenBodegas_y_lineasBodegas/cancelar/${idOrder}`,
                    data,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    },
                );

                if (response.data.ok) {
                    setIdOrder(response.data.ordenId);
                    setEstatus(response.data.estatus);
                    Swal.fire({
                        title: '¡Orden cancelada!',
                        text: 'La orden se cancelo correctamente!',
                        icon: 'success',
                        timer: 5000,
                        showCloseButton: true,
                        allowEscapeKey: true,
                    });
                }
            },
            {
                loadingText: 'Cancelando orden...',
                onError: (error) => {
                    showErrorFallback(error, 'Ocurrió un error inesperado al cancelar la orden.');
                },
            },
        );
    };

    const handleRevertirOrden = () => {
        execute(
            async () => {
                const response = await axios.put(
                    `${apiUrl}/inventario/ordenBodegas_y_lineasBodegas/orden/${idOrder}/revertir`,
                    {}, // Este es el cuerpo de la solicitud (si no envías datos, puedes pasar un objeto vacío)
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    },
                );
                if (response.data.ok) {
                    setIdOrder(response.data.id);
                    setEstatus(response.data.estatus);
                    Swal.fire({
                        title: '¡Orden revertida!',
                        text: 'La orden se revirtio correctamente!',
                        icon: 'success',
                        timer: 5000,
                        showCloseButton: true,
                        allowEscapeKey: true,
                    });
                }
            },
            {
                loadingText: 'Revirtiendo orden...',
                onError: (error) => {
                    showErrorFallback(error, 'Ocurrió un error inesperado al revertir la orden.');
                },
            },
        );
    };

    const handleProcesarOrden = () => {
        execute(
            async () => {
                const dateTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
                const data = {
                    fecha_procesada: dateTime,
                    usuario: user.nombre,
                };

                const response = await axios.post(
                    `${apiUrl}/inventario/ordenBodegas_y_lineasBodegas/procesar/${idOrder}`,
                    data,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    },
                );

                if (response.data.ok) {
                    setIdOrder(response.data.id);
                    setEstatus(response.data.estatus);
                    Swal.fire({
                        title: '¡Orden procesada!',
                        text: 'La orden se proceso exitosamente!',
                        icon: 'success',
                        timer: 5000,
                        showCloseButton: true,
                        allowEscapeKey: true,
                    });
                }
            },
            {
                loadingText: 'Procesando orden...',
                onError: (error) => {
                    if (error.response?.data?.message) {
                        const { messageText, errores } = error.response.data.message;

                        let detalleErrores = '';

                        if (errores && errores.length > 0) {
                            detalleErrores = errores
                                .map(
                                    (err) => `
                            • SKU: ${err.sku}
                            | ML: ${err.inventory_id}
                            | Localidad: ${err.localidad}
                            | Disponible: ${err.cantidad_disponible}
                            | Requerido: ${err.cantidad_requerida}
                        `,
                                )
                                .join('<br>');
                        }

                        Swal.fire({
                            title: 'Error',
                            html: `<strong>${messageText}</strong><br><br>${detalleErrores}`,
                            icon: 'error',
                            width: 1000,
                            showCloseButton: true,
                        });
                    } else {
                        showErrorFallback(error, 'Ocurrió un error inesperado al procesar la orden.');
                    }
                },
            },
        );
    };

    const deleteLine = (id) => async (e) => {
        e.preventDefault();

        Swal.fire({
            title: '¿Estás seguro?',
            text: '¡No podrás revertir esto!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminarlo',
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    // Eliminar la línea en el backend
                    const response = await axios.delete(
                        `${apiUrl}/inventario/ordenBodegas_y_lineasBodegas/lineas/${id}`,
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                            },
                        },
                    );
                    if (response.data.orderDeleted) {
                        const mensaje = response.data.mensaje;
                        Swal.fire({
                            title: '¡Eliminado!',
                            text: mensaje,
                            icon: 'success',
                        });
                        navigate('/ordenes-de-bodega');
                        return;
                    }

                    Swal.fire({
                        title: '¡Eliminado!',
                        text: response.data.mensaje,
                        icon: 'success',
                    });

                    fetchOrderSelected(idOrder); // Recargar la orden que sí sigue existiendo
                } catch (error) {
                    const backendMessage = error?.response?.data?.mensaje || error?.response?.data?.message;
                    Swal.fire({
                        title: 'Error',
                        text: backendMessage || 'No se pudo eliminar la línea. Intenta de nuevo.',
                        icon: 'error',
                        timer: 5000,
                        showCloseButton: true,
                        allowEscapeKey: true,
                    });
                }
            }
        });
    };

    useEffect(() => {
        if (productoSku === '') {
            // Respeta la ubicación de entrada fijada; la de salida siempre se
            // limpia aquí (el efecto de autoselección la vuelve a calcular en
            // cuanto sepa qué ubicaciones tienen stock del próximo producto).
            if (!ubicacionEntradaFija) {
                setSelectedUbicacionEntrada('');
            }
            setSelectedUbicacionSalida('');
            setUbicacionSalidaHabilitada(false);
            setUbicacionEntradaHabilitada(false);
            setHabilitarCantidad(false);
            setExistenciaProducto('');
            setExistenciaProductoDestino('');
            // La cantidad solo se limpia si NO está fijada.
            if (!cantidadFija) {
                setInputValue('');
            }
            setSelectedComment('');
            setIsButtonDisabled(true);
        }
    }, [productoSku, ubicacionEntradaFija, cantidadFija]);

    const handleOrderNew = () => {
        setRows([]);
        setDescripcion('');
        setSelectedTraspasoId('');
        setSelectedBodegaSalida('');
        setSelectedBodegaEntrada('');
        setProductoId('');
        setProductoSku('');
        setSelectedUbicacionSalida('');
        setSelectedUbicacionEntrada('');
        // Una orden nueva empieza siempre sin la ubicación de entrada fija.
        setUbicacionEntradaFija(false);
        setCantidadFija(false);
        autoAddedProductoIdRef.current = null;
        setExistenciaProducto('');
        setExistenciaProductoDestino('');
        setInputValue('');
        setSelectedComment('');
        setEstatus('');
        setIdOrder('');
        setCategoriaTemp('');
        setHabilitarTraspaso(true);
        setBodegaSalidaHabilitada(false);
        setBodegaEntradaHabilitada(false);
        setHabilitarBuscador(false);
        setHabilitarComentario(false);
        setUbicacionSalidaHabilitada(false);
        setUbicacionEntradaHabilitada(false);
        setHabilitarCantidad(false);
        setHabilitarComentario(false);

        if (bodegaSalidaRef.current) {
            bodegaSalidaRef.current.classList.remove('error');
        }
        if (bodegaEntradaRef.current) {
            bodegaEntradaRef.current.classList.remove('error');
        }

        if (ubicacionSalidaRef.current) {
            ubicacionSalidaRef.current.classList.remove('error');
        }

        if (ubicacionEntradaRef.current) {
            ubicacionEntradaRef.current.classList.remove('error');
        }

        if (cantidadRef.current) {
            cantidadRef.current.classList.remove('error');
        }
    };

    // Busca el producto escaneado/tecleado. El backend acepta SKU, inventory_id
    // (código interno de bodega) o ID de publicación de Mercado Libre (MLM), y
    // siempre por coincidencia EXACTA: si hay una sola coincidencia se
    // seleccionan sus existencias de inmediato (como al buscar por SKU); si no
    // hay ninguna coincidencia exacta o hay más de una, se abre la modal de
    // selección con las coincidencias parciales para que el usuario elija.
    const fetchsku = async (codigoEscaneado) => {
        const codigo = (codigoEscaneado || '').trim();

        if (!codigo) {
            // Un escaneo/Enter vacío no debe disparar una búsqueda ni un error.
            return;
        }

        if (skuSearchInFlightRef.current) {
            // Ya hay una búsqueda de este mismo escaneo en curso (p. ej. el
            // lector dispara "Enter" y el campo pierde el foco casi a la vez).
            return;
        }
        skuSearchInFlightRef.current = true;

        try {
            setLoadingProducts(true);

            const response = await axios.get(
                `${apiUrl}/inventario/ordenBodegas_y_lineasBodegas/producto/${encodeURIComponent(codigo)}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            );

            // Si llega aquí, significa que hay un resultado válido en el array
            if (Array.isArray(response.data) && response.data.length === 1) {
                const producto = response.data[0]; // Accede al único producto
                setProductoId(producto.producto_id);
                setProductoSku(producto.sku);
                await handleSearch(producto.producto_id);
            } else {
                // Para cuando el array no tiene exactamente un elemento
                // (0 = sin coincidencia exacta, 2+ = ambiguo): se muestran las
                // coincidencias parciales en la modal para que el usuario elija.
                setSearchTerm(codigo);
                setOpen(true);
                fetchProducts();
            }
        } catch (error) {
            // Maneja el caso específico de "Producto no encontrado"
            if (
                error.response &&
                error.response.data &&
                error.response.data.message === 'Producto no encontrado'
            ) {
                setSearchTerm(codigo);
                setOpen(true);
                fetchProducts();
            } else {
                showErrorFallback(error, 'Error en la comunicación con el servidor.');
            }
        } finally {
            setLoadingProducts(false);
            skuSearchInFlightRef.current = false;
        }
    };

    // Función que maneja el evento de presionar Enter en el input. La mayoría
    // de lectores de código de barras "escriben" el código y rematan con un
    // Enter automático, así que este es el disparador principal del escaneo.
    const handleKeyDown = (event) => {
        if (habilitarBuscador && (event.key === 'Enter' || event.key === 'Tab' || event.type === 'click')) {
            // Evita que el Enter del escáner dispare algún submit implícito
            // del formulario u otro efecto por defecto del navegador.
            event.preventDefault();
            fetchsku(productoSku);
        }
    };

    const handleBlur = () => {
        if (habilitarBuscador && productoSku.trim()) {
            fetchsku(productoSku);
        }
    };

    const handleProductId = (event) => {
        const sku = event.target.value;
        setProductoSku(sku);
        setSearchTerm(sku);
    };

    useEffect(() => {
        const isAdmin = user?.rol_id === 1;

        if (estatus === 'abierto') {
            setBodegaSalidaHabilitada(false);
            setBodegaEntradaHabilitada(false);
            setEnableRevertir(false);
            setHabilitarTraspaso(false);
            setEnableProcess(false);

            if (user?.rol_id === rolMovimiento || isAdmin) {
                setHabilitarDescripcion(true);
                setHabilitarBuscador(true);
                setEnableCancel(true);
            }
            if ((categoriaTemp === 'entrada' && user?.rol_id === rolIdTempEntrada) || isAdmin) {
                setEnableConfirm(true);
            } else if ((categoriaTemp === 'salida' && user?.rol_id === rolIdTemp) || isAdmin) {
                setEnableConfirm(true);
            } else if ((categoriaTemp === 'transferencia' && user?.rol_id === rolIdTemp) || isAdmin) {
                setEnableConfirm(true);
            } else {
                setEnableConfirm(false);
                setEnableProcess(false);
            }
        }
        if (estatus === 'confirmado') {
            setHabilitarBuscador(false);
            setEnableConfirm(false);
            setHabilitarTraspaso(false);
            setHabilitarDescripcion(false);
            setBodegaSalidaHabilitada(false);
            setBodegaEntradaHabilitada(false);
            if ((categoriaTemp === 'entrada' && user?.rol_id === rolIdTempEntrada) || isAdmin) {
                setEnableProcess(true);
            } else if ((categoriaTemp === 'salida' && user?.rol_id === rolIdTemp) || isAdmin) {
                setEnableProcess(true);
            } else if ((categoriaTemp === 'transferencia' && user?.rol_id === rolIdTempEntrada) || isAdmin) {
                setEnableProcess(true);
            }
            if (user?.rol_id === rolMovimiento || isAdmin) {
                setEnableRevertir(true);
            }
        }
        if (estatus === 'procesado') {
            setIsButtonDisabled(true);
            setEnableCancel(false);
            setEnableRevertir(false);
            setEnableProcess(false);
            setEnableConfirm(false);
            setHabilitarTraspaso(false);
            setHabilitarDescripcion(false);
            setBodegaSalidaHabilitada(false);
            setBodegaEntradaHabilitada(false);
            setHabilitarComentario(false);
            setHabilitarBuscador(false);
        }
        if (estatus === 'cancelada') {
            setIsButtonDisabled(true);
            setHabilitarBuscador(false);
            setHabilitarTraspaso(false);
            setHabilitarDescripcion(false);
            setEnableCancel(false);
            setEnableConfirm(false);
            setEnableProcess(false);
            setEnableRevertir(false);
            setBodegaSalidaHabilitada(false);
            setBodegaEntradaHabilitada(false);
            setHabilitarComentario(false);
        }
        if (!estatus) {
            setIsButtonDisabled(true);
            setEnableConfirm(false);
            setEnableCancel(false);
            setEnableRevertir(false);
            setEnableProcess(false);
        }
    }, [estatus, rolIdTemp, rolMovimiento, user, categoriaTemp, rolIdTempEntrada, isAdmin]);

    const handleUpdateOrder = async () => {
        try {
            if (descripcion) {
                const response = await axios.put(
                    `${apiUrl}/inventario/ordenBodegas_y_lineasBodegas/ordenDeBodega/${idOrder}/descripcion`,
                    {
                        descripcion: descripcion,
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    },
                );
                Swal.fire({
                    title: '¡Actualizado!',
                    text: 'Tu descripción ha sido actualizada.',
                    icon: 'success',
                });
                return response.data;
            }
        } catch (error) {
            showErrorFallback(error, 'No se pudo actualizar la descripción de la orden.');
        }
    };

    const handleUpdateLinea = async (updatedRow) => {
        const { id, producto_id, cantidad, localidad_salida_id, localidad_entrada_id, comentario } =
            updatedRow;

        try {
            const updatedFields = {
                producto_id: producto_id,
                cantidad: cantidad,
                localidad_salida_id: parseOrNull(localidad_salida_id),
                localidad_entrada_id: parseOrNull(localidad_entrada_id),
                comentario: comentario,
            };

            const response = await axios.put(
                `${apiUrl}/inventario/ordenBodegas_y_lineasBodegas/${id}`,
                updatedFields,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            );

            fetchOrderSelected(idOrder);
            Swal.fire({
                title: '¡Actualizado!',
                text: 'Tu línea ha sido actualizada.',
                icon: 'success',
            });
            return response.data;
        } catch (error) {
            // Revisamos si la estructura de `error.response.data.message` contiene `messageText`
            const errorMessage = error.response?.data?.message || 'Ha ocurrido un error desconocido';
            Swal.fire({
                title: '¡No se pudo actualizar la linea!',
                text: errorMessage,
                icon: 'error',
                showCloseButton: true,
                allowEscapeKey: true,
            });
            throw error; // Lanzar el error para que pueda ser capturado por processRowUpdate
        }
    };

    // Manejador de errores global en DataGrid
    const handleProcessRowUpdateError = (error) => {
        const errorMessage = error.response?.data?.message || 'Ha ocurrido un error desconocido';
        Swal.fire({
            title: 'Error Global',
            text: errorMessage,
            icon: 'error',
            showCloseButton: true,
            allowEscapeKey: true,
        });
    };

    const handleOpenComment = (row) => {
        setSelectedRow(row); // Almacena toda la fila seleccionada
        setSelectedComment(row.comentario || ''); // Inicializa el comentario seleccionado
        setOpenComment(true);
    };

    const handleRowSelectionComment = (params) => {
        const row = params.row;
        setSelectedRow(row);
        setSelectedComment(row.comentario || '');
        setHabilitarComentario(row.comentario || true);
    };

    const handleClose = () => setOpenComment(false);

    useEffect(() => {
        if (openComment) {
            const input = document.getElementById('comment-input');
            if (input) input.focus();
        }
    }, [openComment]);

    const isCellEditable = () => {
        if (estatus === 'abierto') {
            return user.rol_id === rolMovimiento || isAdmin;
        }
        return estatus !== 'confirmado' && estatus !== 'procesado' && estatus !== 'cancelada';
    };

    const handleOrderSelection = async (orderId) => {
        if (!orderId) {
            console.error('orderId es null o undefined');
            return;
        }
        try {
            await fetchOrderSelected(orderId);
        } catch (error) {
            console.error('Error al seleccionar la orden:', error);
        }
    };

    const fetchOrderSelected = async (orderId) => {
        try {
            const response = await axios.get(
                `${apiUrl}/inventario/ordenBodegas_y_lineasBodegas/orden/${orderId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            );
            setIdOrder(response.data.data.orden.id ?? '');
            setEstatus(response.data.data.orden.estatus ?? '');
            setSelectedBodegaSalida(response.data.data.orden.bodega_salida_id ?? '');
            setSelectedBodegaEntrada(response.data.data.orden.bodega_entrada_id ?? '');
            setRolIdTemp(response.data.data.rol_id_salida ?? '');
            setRolIdTempEntrada(response.data.data.rol_id_entrada ?? '');
            setDescripcion(response.data.data.orden.descripcion ?? '');
            setSelectedTraspasoId(response.data.data.orden.tipo_transaccion_id ?? '');
            setCategoriaTemp(response.data.data.orden.categoria ?? '');
            setRolMovimiento(response.data.data.rol_id_tipo_transaccion ?? '');

            const isAdmin = user?.rol_id === 1;
            const rolTipo = response.data.data.rol_id_tipo_transaccion;
            const estatusOrden = response.data.data.orden.estatus;

            setHabilitarBuscador((isAdmin || user.rol_id === rolTipo) && estatusOrden === 'abierto');

            const dataGridRows = response.data.data.lineas.map((linea) => ({
                id: linea.id,
                producto_id: linea.producto_id,
                sku: linea.sku,
                inventory_id: linea.inventory_id,
                producto_title: linea.producto_title,
                logistic_type: linea.logistic_type,
                cantidad: linea.cantidad,
                comentario: linea.comentario,
                localidad_salida: linea.localidad_salida_descripcion,
                localidad_entrada: linea.localidad_entrada_descripcion,
                localidad_salida_id: linea.localidad_salida_id,
                localidad_entrada_id: linea.localidad_entrada_id,
                existencias_origen: linea.existencias_origen || 0,
                existencias_destino: linea.existencias_destino || 0,
            }));
            // Limpia las filas actuales y luego añade las nuevas filas
            setRows(dataGridRows);
        } catch (error) {
            showErrorFallback(error, 'No se pudo cargar la información de la orden seleccionada.');
        }
    };

    const handleButtonClick = () => {
        document.getElementById('file-input').click();
    };

    const handleRowSelection = (params) => {
        // Antes se volvía a buscar el producto en `rowsProducts` filtrando por
        // producto_id, con el mismo resultado pero un paso de más. `params.row`
        // ya ES la fila exacta que el usuario seleccionó (producto_id es la PK
        // única de `publicaciones`), así que la usamos directamente.
        const selectedProduct = params.row;

        if (selectedProduct) {
            setProductoSku(selectedProduct.sku);
            setProductoId(selectedProduct.producto_id);
            handleSearch(selectedProduct.producto_id);
            setOpen(false); // Cierra la modal
        }
    };

    useEffect(() => {
        // Filtra los productos en base al término de búsqueda
        let filtered = rowsProducts;

        if (searchTerm) {
            const searchWords = searchTerm
                .toLowerCase()
                .split(' ')
                .filter((word) => word);

            filtered = filtered.filter((product) => {
                const productMLM = product.id ? product.id.toLowerCase() : '';
                const productCatalog = product.catalog_id ? product.catalog_id.toLowerCase() : '';
                const productTitle = product.title ? product.title.toLowerCase() : '';
                const productSku = product.sku ? product.sku.toLowerCase() : '';
                const productVariation = product.variation_id ? product.variation_id.toLowerCase() : '';
                const productInventoryId = product.inventory_id ? product.inventory_id.toLowerCase() : '';
                const productVariationDesc = product.variation_desc
                    ? product.variation_desc.toLowerCase()
                    : '';

                // Verifica si todas las palabras están en el título
                const titleMatch = searchWords.every((word) => productTitle.includes(word));

                // Verifica si el término de búsqueda está en otras columnas
                const otherColumnsMatch =
                    productMLM.includes(searchTerm.toLowerCase()) ||
                    productCatalog.includes(searchTerm.toLowerCase()) ||
                    productSku.includes(searchTerm.toLowerCase()) ||
                    productVariation.includes(searchTerm.toLowerCase()) ||
                    productInventoryId.includes(searchTerm.toLowerCase()) ||
                    productVariationDesc.includes(searchTerm.toLowerCase());

                // El producto debe coincidir en el título o en alguna de las otras columnas
                return titleMatch || otherColumnsMatch;
            });
        }

        setFilteredProducts(filtered);
    }, [searchTerm, rowsProducts]);

    const columnsProducts = [
        {
            field: 'select',
            headerName: 'Seleccionar',
            width: 150,
            renderCell: (params) => (
                <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    disabled={!params.row?.producto_id}
                    onClick={() => handleRowSelection(params)}
                >
                    Seleccionar
                </Button>
            ),
            sortable: false,
            filterable: false,
        },
        { field: 'producto_id', headerName: 'ID producto', type: 'number' },
        {
            field: 'tipo_publicacion',
            headerName: 'Tipo\npublicación',
            type: 'number',
            flex: 1,
            headerClassName: 'header-wrap',
            headerAlign: 'center',
        },
        { field: 'id', headerName: '#Publicación', type: 'text', flex: 1 },
        { field: 'catalog_id', headerName: '#Catalogo', type: 'text', flex: 1 },
        { field: 'sku', headerName: 'SKU', type: 'text', flex: 1, headerAlign: 'center' },
        { field: 'inventory_id', headerName: 'ML', type: 'text', flex: 1, headerAlign: 'center' },
        { field: 'title', headerName: 'Titulo', type: 'text', flex: 1 },
    ];

    const puedeEditar = estatus === 'abierto' && (isAdmin || user.rol_id === rolMovimiento);

    // Resalta en rojo las existencias en 0 para que sea evidente de un vistazo
    // cuándo una ubicación se quedó sin stock.
    const renderExistenciaCell = (params) => (
        <Typography
            variant="body2"
            fontWeight={Number(params.value) > 0 ? 400 : 700}
            color={Number(params.value) > 0 ? 'text.primary' : 'error.main'}
        >
            {params.value}
        </Typography>
    );

    const columns = [
        { field: 'id', headerName: 'ID Linea', type: 'number', hide: true },
        { field: 'producto_id', headerName: 'Producto ID', type: 'number', flex: 1 },
        {
            field: 'cantidad',
            headerName: 'Cantidad',
            editable: true,
            type: 'number',
            flex: 0.5,
            cellClassName: 'celdaEditable',
            renderEditCell: (params) => {
                return (
                    <GridEditInputCell
                        {...params}
                        type="number"
                        inputProps={{
                            min: 0, // Establecer el mínimo permitido en el input
                        }}
                        onWheel={(e) => e.target.blur()} // Evitar cambios accidentales con la rueda del mouse
                    />
                );
            },
            preProcessEditCellProps: (params) => {
                const { props } = params;

                // Asegurar que el valor sea al menos 0
                const value = Math.max(0, props.value);

                const isValid = /^[0-9]+$/.test(value);

                return {
                    ...props,
                    value, // Forzar el valor a 0 si es menor
                    error: !isValid, // Marca la celda con error si la validación falla
                };
            },
        },
        { field: 'sku', headerName: 'SKU', flex: 1.3 },
        { field: 'inventory_id', headerName: 'ML', flex: 0.6, headerAlign: 'center' },
        {
            field: 'logistic_type',
            headerName: 'Logística',
            flex: 0.7,
            headerAlign: 'center',
            align: 'center',
            renderCell: (params) =>
                params.value ? (
                    <Chip label={params.value} size="small" variant="outlined" color="info" />
                ) : (
                    '—'
                ),
        },
        {
            field: 'localidad_salida',
            headerName: 'Ubicación\nOrigen',
            flex: 0.7,
            headerClassName: 'header-wrap',
            headerAlign: 'center',
        },
        {
            field: 'existencias_origen',
            headerName: 'Existencia\nOrigen',
            type: 'number',
            flex: 0.7,
            headerClassName: 'header-wrap',
            headerAlign: 'center',
            renderCell: renderExistenciaCell,
        },
        {
            field: 'localidad_entrada',
            headerName: 'Ubicación\nDestino',
            flex: 0.7,
            headerClassName: 'header-wrap',
            headerAlign: 'center',
        },
        { field: 'localidad_entrada_id', headerName: 'ID ubicación entrada', type: 'number' },
        { field: 'localidad_salida_id', headerName: 'ID ubicación salida', type: 'number' },
        {
            field: 'existencias_destino',
            headerName: 'Existencia\nDestino',
            flex: 0.7,
            headerClassName: 'header-wrap',
            headerAlign: 'center',
            renderCell: renderExistenciaCell,
        },
        { field: 'producto_title', headerName: 'Descripción', flex: 2 },
        {
            field: 'actions',
            headerName: 'Acciones',
            type: 'actions',
            flex: 0.5,
            getActions: (params) => {
                if (!params?.row) return [];

                const acciones = [];

                // 👁 Ver comentario (si existe)
                if (params.row.comentario) {
                    acciones.push(
                        <Tooltip title="Ver comentario" key={`comment-${params.row.id}`}>
                            <GridActionsCellItem
                                icon={<RateReviewIcon />}
                                sx={{ color: 'primary.main' }}
                                onClick={() => handleOpenComment(params.row)}
                                label="Ver comentario"
                            />
                        </Tooltip>,
                    );
                }

                // 🗑 Borrar línea (solo si puedeEditar)
                if (puedeEditar) {
                    acciones.push(
                        <Tooltip title="Borrar línea" key={`delete-${params.row.id}`}>
                            <GridActionsCellItem
                                icon={<GridDeleteIcon />}
                                sx={{ color: 'error.main' }}
                                onClick={deleteLine(params.id)}
                                label="Delete"
                            />
                        </Tooltip>,
                    );
                }

                return acciones;
            },
        },
    ];

    useEffect(() => {
        // Verifica si el ID actual de la ubicación existe en las opciones
        const exists = ubicacionEntrada.some((u) => u.id === selectedUbicacionEntrada);

        if (!exists) {
            setSelectedUbicacionEntrada('');
            setInputValueUbicacion('');
        }
    }, [ubicacionEntrada, selectedUbicacionEntrada]);

    // Ubicación de entrada fija: cuando se escanea el siguiente producto, la
    // lista de ubicaciones de entrada se vuelve a cargar (con la existencia
    // de ESE producto en cada una). Como la ubicación fija sigue ahí (siempre
    // están todas las ubicaciones activas de la bodega), solo hace falta
    // refrescar "Existencias destino" con el dato del producto nuevo.
    useEffect(() => {
        if (!ubicacionEntradaFija || !selectedUbicacionEntrada) return;
        const ubicacion = ubicacionEntrada.find((u) => u.id === selectedUbicacionEntrada);
        if (ubicacion) {
            setExistenciaProductoDestino(ubicacion.cantidad);
        }
    }, [ubicacionEntrada, ubicacionEntradaFija, selectedUbicacionEntrada]);

    // Ubicación de salida: se autoselecciona la de MENOR stock disponible
    // entre las que sí tienen existencias del producto recién escaneado, para
    // priorizar vaciar primero las ubicaciones con menos piezas (evita dejar
    // sobrantes dispersos en muchas ubicaciones). Sin pin/preferencia: cada
    // producto nuevo vuelve a calcularse desde cero. El usuario sigue
    // pudiendo cambiarla a mano en el propio Select si lo necesita.
    useEffect(() => {
        const disponibles = ubicaciones.filter((u) => u.disponible > 0);
        if (disponibles.length === 0) return;

        // Si lo ya seleccionado sigue siendo una opción válida para este
        // producto (p. ej. el usuario lo acaba de elegir a mano), no se toca.
        const seleccionSigueValida = disponibles.some((u) => u.id === selectedUbicacionSalida);
        if (seleccionSigueValida) return;

        const menorStock = disponibles.reduce((min, u) => (u.disponible < min.disponible ? u : min));
        setSelectedUbicacionSalida(menorStock.id);
        setExistenciaProducto(menorStock.disponible);
    }, [ubicaciones, selectedUbicacionSalida]);

    // SOLO para órdenes de ENTRADA: si tanto la ubicación de entrada como la
    // cantidad están fijadas, en cuanto se encuentra/selecciona un producto
    // (ya con su producto_id resuelto y sus existencias cargadas) la fila se
    // agrega sola, sin necesidad de darle clic a "Agregar Fila". Reutiliza
    // handleGenerarOrder tal cual (mismas validaciones de siempre); no aplica
    // a salidas ni transferencias.
    useEffect(() => {
        if (categoriaTemp !== 'entrada') return;
        if (!ubicacionEntradaFija || !cantidadFija) return;
        if (!productoId || !selectedUbicacionEntrada || !inputValue) return;
        // Evita disparar el alta dos veces para el mismo producto (p. ej. si
        // este efecto se vuelve a evaluar por algún otro cambio de estado).
        if (autoAddedProductoIdRef.current === productoId) return;

        autoAddedProductoIdRef.current = productoId;
        handleGenerarOrder();
    }, [categoriaTemp, ubicacionEntradaFija, cantidadFija, productoId, selectedUbicacionEntrada, inputValue]);

    const estatusInfo = getEstatusInfo(estatus);

    // --- Mensajes de ayuda: por qué un botón está deshabilitado ---
    // Estos NO cambian ninguna condición de negocio: solo describen, en
    // español, la misma condición que ya decide isButtonDisabled / enableXxx
    // más abajo, para que el usuario entienda qué falta.
    const getAddRowDisabledReason = () => {
        if (!categoriaTemp) return 'Selecciona primero un tipo de movimiento.';
        if (categoriaTemp === 'transferencia' && (!selectedBodegaSalida || !selectedBodegaEntrada)) {
            return 'Selecciona la bodega de salida y la bodega de entrada.';
        }
        if (categoriaTemp === 'salida' && !selectedBodegaSalida) {
            return 'Selecciona una bodega de salida.';
        }
        if (categoriaTemp === 'entrada' && !selectedBodegaEntrada) {
            return 'Selecciona una bodega de entrada.';
        }
        if (!productoId) return 'Busca y selecciona un producto.';
        if ((categoriaTemp === 'transferencia' || categoriaTemp === 'salida') && !selectedUbicacionSalida) {
            return 'Selecciona la ubicación de salida.';
        }
        if ((categoriaTemp === 'transferencia' || categoriaTemp === 'entrada') && !selectedUbicacionEntrada) {
            return 'Selecciona la ubicación de entrada.';
        }
        if (!inputValue) return 'Indica la cantidad a mover.';
        if (selectedUbicacionSalida && parseInt(inputValue) > parseInt(existenciaProducto)) {
            return 'La cantidad supera las existencias disponibles en el origen.';
        }
        return '';
    };

    const getNewOrderTooltip = () => 'Limpia el formulario para capturar una nueva orden.';
    const getSearchOrderTooltip = () => 'Busca una orden existente por folio, estatus o fecha.';

    const getConfirmDisabledReason = () => {
        if (!idOrder) return 'Primero genera o selecciona una orden.';
        if (estatus !== 'abierto') return "La orden debe estar en estatus 'abierto' para confirmarse.";
        if (!enableConfirm) return 'Tu rol no tiene permiso para confirmar este tipo de movimiento.';
        return '';
    };

    const getProcessDisabledReason = () => {
        if (!idOrder) return 'Primero genera o selecciona una orden.';
        if (estatus !== 'confirmado') return "La orden debe estar 'confirmada' para poder procesarse.";
        if (!enableProcess) return 'Tu rol no tiene permiso para procesar este tipo de movimiento.';
        return '';
    };

    const getRevertDisabledReason = () => {
        if (!idOrder) return 'Primero genera o selecciona una orden.';
        if (estatus !== 'confirmado') return "Solo se pueden revertir órdenes en estatus 'confirmado'.";
        if (!enableRevertir) return 'Tu rol no tiene permiso para revertir esta orden.';
        return '';
    };

    const getCancelDisabledReason = () => {
        if (!idOrder) return 'Primero genera o selecciona una orden.';
        if (estatus !== 'abierto') return "Solo se pueden cancelar órdenes en estatus 'abierto'.";
        if (!enableCancel) return 'Tu rol no tiene permiso para cancelar esta orden.';
        return '';
    };

    const addRowDisabledReason = getAddRowDisabledReason();

    // Resalta visualmente el siguiente campo que el usuario puede llenar,
    // para que sea evidente dónde continuar el flujo sin tener que adivinar
    // cuál input ya está habilitado. No afecta ninguna condición de negocio:
    // solo cambia el borde/fondo cuando el campo YA está habilitado.
    const enabledFieldSx = (enabled) =>
        enabled
            ? {
                '& .MuiOutlinedInput-root': {
                    backgroundColor: '#fffdf5',
                    transition: 'box-shadow 0.15s ease, border-color 0.15s ease',
                    boxShadow: '0 0 0 1px rgba(251, 140, 0, 0.35)',
                    '& fieldset': { borderColor: '#fb8c00', borderWidth: 2 },
                    '&:hover fieldset': { borderColor: '#ef6c00' },
                    '&.Mui-focused fieldset': { borderColor: 'primary.main', borderWidth: 2 },
                },
                '& .MuiInputLabel-root': { color: '#ef6c00' },
                '& .MuiInputLabel-root.Mui-focused': { color: 'primary.main' },
            }
            : {};

    // Botón de acción del encabezado (Nueva orden, Buscar, Cancelar, etc.)
    // Envuelto siempre en <span> para que el Tooltip funcione también
    // cuando el botón está disabled (MUI no dispara eventos en botones
    // deshabilitados).
    const HeaderActionButton = ({ icon, label, onClick, disabled, tooltip, color = 'primary' }) => (
        <Tooltip title={disabled ? tooltip : label} arrow>
            <span>
                <Button
                    onClick={onClick}
                    disabled={disabled}
                    variant="outlined"
                    color={color}
                    size="small"
                    startIcon={icon}
                    sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                    }}
                >
                    {label}
                </Button>
            </span>
        </Tooltip>
    );

    return (
        <Box sx={{ p: { xs: 1, sm: 2 }, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/*
              El panel de Columnas/Filtros/Densidad del DataGrid (clase global
              `.MuiDataGrid-panel`) se renderiza en un Popper propio, y ese
              Popper no trae z-index por defecto. Cuando el DataGrid vive
              dentro de un <Dialog> (z-index 1300), el panel queda por DEBAJO
              del propio Dialog: se alcanza a ver pero los clics no llegan a
              sus casillas/inputs porque el Dialog los intercepta primero.
              Subir su z-index por encima del modal lo resuelve, tanto dentro
              como fuera de una modal (no afecta nada más del sistema).
            */}
            <GlobalStyles
                styles={(theme) => ({
                    '.MuiDataGrid-panel': { zIndex: theme.zIndex.modal + 100 },
                })}
            />
            {/* ---------- Barra de acciones ---------- */}
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
                        <Inventory2OutlinedIcon color="primary" /> Órdenes de Bodega
                    </Typography>
                    <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />
                    <HeaderActionButton
                        icon={<AddCircleOutlineIcon />}
                        label="Orden Nueva"
                        onClick={handleOrderNew}
                        tooltip={getNewOrderTooltip()}
                    />
                    <HeaderActionButton
                        icon={<ManageSearchIcon />}
                        label="Buscar Orden"
                        onClick={() => setOpenModal(true)}
                        tooltip={getSearchOrderTooltip()}
                    />
                    <HeaderActionButton
                        icon={<HelpOutlineIcon />}
                        label="Manual y Plantilla"
                        onClick={showHelpManual}
                        tooltip="Consulta el manual de importación masiva y descarga la plantilla."
                    />
                    <Tooltip title="Importa líneas u órdenes completas desde un archivo Excel." arrow>
                        <span>
                            <Button
                                component="label"
                                variant="outlined"
                                size="small"
                                startIcon={<UploadFileIcon />}
                                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                            >
                                Importar Excel
                                <input
                                    id="file-input"
                                    type="file"
                                    accept=".xlsx, .xls"
                                    hidden
                                    onChange={handleImportExcel}
                                />
                            </Button>
                        </span>
                    </Tooltip>
                </Stack>

                <Stack direction="row" flexWrap="wrap" gap={1} alignItems="center">
                    <HeaderActionButton
                        icon={<CancelIcon />}
                        label="Cancelar Orden"
                        onClick={handleCancelOrden}
                        disabled={!enableCancel}
                        tooltip={getCancelDisabledReason()}
                        color="error"
                    />
                    <HeaderActionButton
                        icon={<RestartAltIcon />}
                        label="Revertir Orden"
                        onClick={handleRevertirOrden}
                        disabled={!enableRevertir}
                        tooltip={getRevertDisabledReason()}
                        color="warning"
                    />
                    <HeaderActionButton
                        icon={<TaskAltIcon />}
                        label="Confirmar Orden"
                        onClick={handleConfirmarOrden}
                        disabled={!enableConfirm}
                        tooltip={getConfirmDisabledReason()}
                        color="success"
                    />
                    <HeaderActionButton
                        icon={<PlayCircleOutlineIcon />}
                        label="Procesar Orden"
                        onClick={handleProcesarOrden}
                        disabled={!enableProcess}
                        tooltip={getProcessDisabledReason()}
                        color="info"
                    />
                </Stack>
            </Paper>

            {/* ---------- Modal de búsqueda de productos ---------- */}
            <Dialog
                open={open}
                onClose={handleCloseSearchProducts}
                maxWidth="lg"
                fullWidth
                // El panel de Columnas/Filtros/Densidad del DataGrid se renderiza
                // en un portal fuera del Dialog. Con el focus-trap normal de MUI,
                // ese panel queda "atrapado" y no se puede interactuar con él
                // (no se pueden tildar columnas, ni escribir un filtro, etc.).
                // disableEnforceFocus permite que el foco salga del Dialog hacia
                // ese panel sin afectar el resto del comportamiento del modal.
                disableEnforceFocus
            >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    Buscar producto
                    <IconButton onClick={handleCloseSearchProducts} size="small">
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    <TextField
                        label="Buscador..."
                        color="primary"
                        focused
                        size="small"
                        fullWidth
                        sx={{ mb: 2, maxWidth: 400 }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Box sx={{ width: '100%', height: { xs: 400, md: 550 } }}>
                        <DataGrid
                            sx={{ fontFamily: 'Montserrat', fontWeight: 'bold' }}
                            rows={filteredProducts}
                            columns={columnsProducts}
                            // Loader dedicado al catálogo (no el del campo de escaneo): sin
                            // esto, en producción el catálogo tarda en llegar y el DataGrid
                            // muestra "No rows" dando a entender que no existen productos,
                            // cuando en realidad la búsqueda todavía no termina.
                            loading={loadingCatalogo}
                            pageSize={5}
                            showCellVerticalBorder
                            showColumnVerticalBorder
                            // producto_id es la PK auto_increment de `publicaciones` (confirmado
                            // por el usuario) y es el campo que la lógica de negocio necesita
                            // usar para identificar cada fila de forma inequívoca.
                            getRowId={(row) => row.producto_id}
                            experimentalFeatures={{ newEditingApi: true }}
                            slots={{ toolbar: GridToolbar }}
                            density="compact"
                            columnVisibilityModel={{
                                producto_id: false,
                                tipo_publicacion: false,
                                id: false,
                                catalog_id: false,
                            }}
                            localeText={{
                                noRowsLabel: 'No se encontraron productos que coincidan con tu búsqueda.',
                            }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseSearchProducts} variant="contained">
                        Cerrar
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ---------- Formulario de la orden ---------- */}
            <Paper elevation={2} sx={{ p: { xs: 1.5, sm: 2.5 }, borderRadius: 3 }}>
                <Stack spacing={2.5}>
                    {/* Fila 1: Tipo de movimiento / Descripción / Folio / Estatus */}
                    <Stack direction="row" flexWrap="wrap" gap={2} alignItems="flex-start">
                        <FormControl
                            size="small"
                            sx={[{ minWidth: 260, flex: '1 1 260px' }, enabledFieldSx(habilitarTraspaso)]}
                        >
                            <InputLabel>Tipo de movimiento</InputLabel>
                            <Select
                                label="Tipo de movimiento"
                                value={selectedTraspasoId}
                                onChange={handleSelectedTraspasoChange}
                                disabled={!habilitarTraspaso}
                            >
                                {traspasos.map((traspaso) => (
                                    <MenuItem key={traspaso.id} value={traspaso.id}>
                                        {`${traspaso.descripcion} : ${traspaso.categoria}`}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <TextField
                            label="Descripción"
                            size="small"
                            disabled={!habilitarDescripcion}
                            value={descripcion}
                            onChange={(e) => setDescripcion(e.target.value)}
                            inputRef={descripcionRef}
                            sx={[{ flex: '2 1 320px', minWidth: 260 }, enabledFieldSx(habilitarDescripcion)]}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <Tooltip title="Guardar descripción">
                                            <span>
                                                <IconButton
                                                    size="small"
                                                    disabled={!habilitarDescripcion}
                                                    onClick={
                                                        habilitarDescripcion ? handleUpdateOrder : undefined
                                                    }
                                                >
                                                    <UpdateIcon
                                                        fontSize="small"
                                                        color={habilitarDescripcion ? 'success' : 'disabled'}
                                                    />
                                                </IconButton>
                                            </span>
                                        </Tooltip>
                                    </InputAdornment>
                                ),
                            }}
                        />

                        <TextField
                            label="Folio"
                            size="small"
                            type="text"
                            value={idOrder}
                            disabled
                            sx={{
                                width: 110,
                                '& .MuiInputBase-input.Mui-disabled': {
                                    WebkitTextFillColor: '#f04c4c',
                                    fontWeight: 700,
                                },
                            }}
                        />

                        <Chip
                            label={estatusInfo.label}
                            sx={{
                                bgcolor: estatusInfo.bg,
                                color: estatusInfo.color,
                                fontWeight: 700,
                                border: `1px solid ${estatusInfo.color}`,
                                alignSelf: 'center',
                            }}
                        />
                    </Stack>

                    <Divider />

                    {/* Fila 2: Bodegas */}
                    <Stack direction="row" flexWrap="wrap" gap={2}>
                        <FormControl
                            size="small"
                            sx={[
                                { minWidth: 240, flex: '1 1 240px' },
                                enabledFieldSx(bodegaSalidaHabilitada),
                            ]}
                        >
                            <InputLabel>Bodega de salida</InputLabel>
                            <Select
                                label="Bodega de salida"
                                value={selectedBodegaSalida}
                                onChange={handleSelectBodegaSalida}
                                disabled={!bodegaSalidaHabilitada}
                                ref={bodegaSalidaRef}
                            >
                                {bodegaSalida.map((bod) => (
                                    <MenuItem key={bod.id} value={bod.id}>
                                        {bod.Nombre}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl
                            size="small"
                            sx={[
                                { minWidth: 240, flex: '1 1 240px' },
                                enabledFieldSx(bodegaEntradaHabilitada),
                            ]}
                        >
                            <InputLabel>Bodega de entrada</InputLabel>
                            <Select
                                label="Bodega de entrada"
                                value={selectedBodegaEntrada}
                                disabled={!bodegaEntradaHabilitada}
                                onChange={handleSelectBodegaEntrada}
                                ref={bodegaEntradaRef}
                            >
                                {bodegaEntrada.map((bodega) => (
                                    <MenuItem key={bodega.id} value={bodega.id}>
                                        {bodega.Nombre}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Stack>

                    <Divider />

                    {/* Fila 3: Producto + Ubicaciones + Cantidad */}
                    <Stack direction="row" flexWrap="wrap" gap={2} alignItems="flex-start">
                        <TextField
                            label="Producto (SKU / código / ML)"
                            placeholder="Escanea o escribe el SKU, código de barras o ML"
                            size="small"
                            inputRef={skuInputRef}
                            onKeyDown={handleKeyDown}
                            onBlur={handleBlur}
                            disabled={!habilitarBuscador}
                            value={productoSku}
                            onChange={handleProductId}
                            sx={[{ flex: '1 1 220px', minWidth: 200 }, enabledFieldSx(habilitarBuscador)]}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        {loadingProducts ? (
                                            <CircularProgress size={18} sx={{ mr: 0.5 }} />
                                        ) : (
                                            <Tooltip title="Buscar producto">
                                                <span>
                                                    <IconButton
                                                        size="small"
                                                        disabled={!habilitarBuscador}
                                                        onClick={
                                                            habilitarBuscador
                                                                ? handleOpenSearchProducts
                                                                : undefined
                                                        }
                                                    >
                                                        <SearchIcon
                                                            fontSize="small"
                                                            color={habilitarBuscador ? 'primary' : 'disabled'}
                                                        />
                                                    </IconButton>
                                                </span>
                                            </Tooltip>
                                        )}
                                    </InputAdornment>
                                ),
                            }}
                        />

                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                minWidth: 190,
                                flex: '1 1 190px',
                            }}
                        >
                            <FormControl
                                size="small"
                                sx={[{ minWidth: 190 }, enabledFieldSx(ubicacionSalidaHabilitada)]}
                            >
                                <InputLabel>Ubicación de salida</InputLabel>
                                <Select
                                    label="Ubicación de salida"
                                    disabled={!ubicacionSalidaHabilitada}
                                    value={selectedUbicacionSalida}
                                    onChange={handleUbicacionSelectSalida}
                                    ref={ubicacionSalidaRef}
                                >
                                    {[...ubicaciones]
                                        .sort((a, b) => b.existencia_actual - a.existencia_actual)
                                        .map((ubic, index) => (
                                            <MenuItem key={index} value={ubic.id}>
                                                {`${ubic.descripcion} : ${ubic.existencia_actual} (${ubic.total_reservado} reservados) | ${ubic.disponible} disponibles`}
                                            </MenuItem>
                                        ))}
                                </Select>
                            </FormControl>
                            {ubicacionSalidaHabilitada && selectedUbicacionSalida !== '' && (
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25 }}>
                                    Se preseleccionó la de menor stock disponible; puedes cambiarla.
                                </Typography>
                            )}
                        </Box>

                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                                minWidth: 220,
                                flex: '1 1 220px',
                            }}
                        >
                            <Autocomplete
                                ref={ubicacionEntradaRef}
                                disabled={!ubicacionEntradaHabilitada}
                                options={[...ubicacionEntrada].sort((a, b) => {
                                    const aCantidad = a.cantidad || 0;
                                    const bCantidad = b.cantidad || 0;

                                    const aPendiente = a.pendiente_ingreso || 0;
                                    const bPendiente = b.pendiente_ingreso || 0;
                                    // 1. Prioriza ubicaciones con cantidad > 0
                                    if (bCantidad > 0 && aCantidad === 0) return 1;
                                    if (aCantidad > 0 && bCantidad === 0) return -1;

                                    // 2. Si ambos tienen cantidad > 0, ordenar por cantidad descendente
                                    if (aCantidad > 0 && bCantidad > 0) {
                                        if (bCantidad !== aCantidad) {
                                            return bCantidad - aCantidad;
                                        }
                                    }

                                    // 3. Priorizar por pendiente de ingreso
                                    if (bPendiente !== aPendiente) {
                                        return bPendiente - aPendiente;
                                    }

                                    // 4. Finalmente alfabético
                                    return a.descripcion.localeCompare(b.descripcion, 'es', {
                                        sensitivity: 'base',
                                    });
                                })}
                                getOptionLabel={(option) =>
                                    `${option.descripcion} : ${option.cantidad ?? 0} (${option.pendiente_ingreso ?? 0} Por ingresar)`
                                }
                                value={
                                    ubicacionEntrada.find((u) => u.id === selectedUbicacionEntrada) || null
                                }
                                onChange={(event, newValue) => {
                                    // ✅ Si borran la ubicación (X), limpiar existencia destino
                                    if (!newValue) {
                                        handleUbicacionSelectEntrada({ target: { value: '' } });
                                        setExistenciaProductoDestino('');
                                        setInputValueUbicacion('');
                                        return;
                                    }

                                    // ✅ Si seleccionan una ubicación normal
                                    handleUbicacionSelectEntrada({ target: { value: newValue.id } });

                                    // limpiar input del buscador
                                    setInputValueUbicacion('');
                                }}
                                inputValue={inputValueUbicacion}
                                onInputChange={(event, newInputValue) =>
                                    setInputValueUbicacion(newInputValue)
                                }
                                renderOption={(props, option) => (
                                    <li
                                        {...props}
                                        style={{
                                            backgroundColor: option.cantidad > 0 ? '#FFF59D' : 'white', // amarillo suave
                                            fontWeight: option.cantidad > 0 ? 'bold' : 'normal',
                                            borderBottom: '1px solid #eee',
                                            padding: '4px 8px',
                                        }}
                                    >
                                        {`${option.descripcion} : ${option.cantidad ?? 0} (${option.pendiente_ingreso ?? 0} Por ingresar)`}
                                    </li>
                                )}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Ubicación de entrada"
                                        size="small"
                                        InputProps={{
                                            ...params.InputProps,
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <SearchIcon fontSize="small" />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                )}
                                clearOnBlur
                                clearOnEscape
                                sx={[{ flex: 1, minWidth: 0 }, enabledFieldSx(ubicacionEntradaHabilitada)]}
                            />
                            <Tooltip
                                title={
                                    ubicacionEntradaFija
                                        ? 'Ubicación de entrada fija: se mantiene seleccionada entre escaneos. Clic para quitarla.'
                                        : 'Fijar esta ubicación de entrada para todos los siguientes escaneos, hasta que la quites.'
                                }
                            >
                                <span>
                                    <IconButton
                                        size="small"
                                        disabled={!ubicacionEntradaHabilitada}
                                        onClick={handleToggleUbicacionEntradaFija}
                                    >
                                        {ubicacionEntradaFija ? (
                                            <PushPinIcon fontSize="small" color="primary" />
                                        ) : (
                                            <PushPinOutlinedIcon fontSize="small" color="disabled" />
                                        )}
                                    </IconButton>
                                </span>
                            </Tooltip>
                        </Box>

                        <TextField
                            label="Existencias origen"
                            size="small"
                            sx={{ width: 150 }}
                            value={existenciaProducto}
                            disabled
                        />

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <TextField
                                label="Cantidad"
                                size="small"
                                sx={[{ width: 120 }, enabledFieldSx(habilitarCantidad)]}
                                disabled={!habilitarCantidad}
                                value={inputValue}
                                type="text"
                                inputRef={cantidadRef}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    // Expresión regular para permitir solo números y evitar caracteres especiales
                                    const regex = /^[1-9]\d*$/;
                                    if (value === '' || regex.test(value)) {
                                        setInputValue(value);
                                    }
                                }}
                            />
                            <Tooltip
                                title={
                                    cantidadFija
                                        ? 'Cantidad fija: se mantiene entre escaneos. Clic para quitarla.'
                                        : 'Fijar esta cantidad para todos los siguientes escaneos, hasta que la quites.'
                                }
                            >
                                <span>
                                    <IconButton
                                        size="small"
                                        disabled={!habilitarCantidad}
                                        onClick={handleToggleCantidadFija}
                                    >
                                        {cantidadFija ? (
                                            <PushPinIcon fontSize="small" color="primary" />
                                        ) : (
                                            <PushPinOutlinedIcon fontSize="small" color="disabled" />
                                        )}
                                    </IconButton>
                                </span>
                            </Tooltip>
                        </Box>
                    </Stack>

                    {/* Fila 4: Comentario + Existencias destino + Agregar Fila */}
                    <Stack direction="row" flexWrap="wrap" gap={2} alignItems="center">
                        <TextField
                            label="Comentario"
                            size="small"
                            placeholder="Ingrese un comentario a la linea"
                            value={selectedComment}
                            disabled={!habilitarComentario}
                            onChange={(e) => setSelectedComment(e.target.value)}
                            sx={[{ flex: '1 1 280px', minWidth: 220 }, enabledFieldSx(habilitarComentario)]}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <Tooltip title="Guardar comentario">
                                            <span>
                                                <IconButton
                                                    size="small"
                                                    disabled={!habilitarComentario}
                                                    onClick={
                                                        habilitarComentario
                                                            ? async () => {
                                                                await handleUpdateLinea({
                                                                    ...selectedRow, // Pasamos toda la fila seleccionada
                                                                    comentario: selectedComment, // Actualiza el comentario
                                                                });
                                                                setSelectedComment('');
                                                            }
                                                            : undefined
                                                    }
                                                >
                                                    <CheckCircleIcon
                                                        fontSize="small"
                                                        color={habilitarComentario ? 'success' : 'disabled'}
                                                    />
                                                </IconButton>
                                            </span>
                                        </Tooltip>
                                    </InputAdornment>
                                ),
                            }}
                        />

                        <TextField
                            label="Existencias destino"
                            size="small"
                            sx={{ width: 150 }}
                            value={existenciaProductoDestino}
                            disabled
                        />

                        <Box sx={{ flex: '1 1 auto' }} />

                        {categoriaTemp === 'entrada' && ubicacionEntradaFija && cantidadFija && (
                            <Typography variant="caption" color="primary.main" sx={{ mr: 1 }}>
                                Ubicación y cantidad fijas: cada producto escaneado se agrega solo.
                            </Typography>
                        )}

                        <Tooltip
                            title={isButtonDisabled ? addRowDisabledReason : 'Agregar la línea a la orden'}
                            arrow
                        >
                            <span>
                                <Button
                                    variant="contained"
                                    endIcon={<SendIcon />}
                                    onClick={handleGenerarOrder}
                                    disabled={isButtonDisabled}
                                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                                >
                                    Agregar Fila
                                </Button>
                            </span>
                        </Tooltip>
                    </Stack>
                </Stack>
            </Paper>

            {/* ---------- Tabla de líneas de la orden ---------- */}
            <Paper elevation={2} sx={{ p: { xs: 1, sm: 2 }, borderRadius: 3 }}>
                <Box sx={{ height: { xs: 420, md: 520 }, width: '100%' }}>
                    <DataGrid
                        sx={{ fontFamily: 'Montserrat', fontWeight: 'bold' }}
                        rows={rows}
                        columns={columns}
                        pageSize={5}
                        onRowClick={handleRowSelectionComment}
                        onProcessRowUpdateError={handleProcessRowUpdateError} // Aquí añadimos el manejador global
                        processRowUpdate={processRowUpdate}
                        showCellVerticalBorder
                        showColumnVerticalBorder
                        getRowId={(row) => row.id}
                        experimentalFeatures={{ newEditingApi: true }}
                        columnVisibilityModel={columnVisibilityModel}
                        onColumnVisibilityModelChange={(newModel) => setColumnVisibilityModel(newModel)}
                        isCellEditable={isCellEditable}
                        density="compact" // Establece el tamaño de las filas en compacto por defecto
                        slots={{ toolbar: GridToolbar }}
                        localeText={{ noRowsLabel: 'Esta orden todavía no tiene líneas capturadas.' }}
                    />
                </Box>
            </Paper>

            {/* ---------- Modal de comentario ---------- */}
            <Dialog open={openComment} onClose={handleClose} maxWidth="xs" fullWidth>
                <DialogTitle>Comentario de la línea</DialogTitle>
                <DialogContent dividers>
                    <TextField
                        autoFocus
                        fullWidth
                        id="comment-input" // Asegura el foco
                        label="Comentario"
                        size="small"
                        value={selectedComment}
                        onChange={(e) => setSelectedComment(e.target.value)} // Actualiza el comentario en el estado
                    />
                </DialogContent>
                <DialogActions>
                    <Button variant="outlined" onClick={handleClose}>
                        Cerrar
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={async () => {
                            await handleUpdateLinea({
                                ...selectedRow, // Pasamos toda la fila seleccionada
                                comentario: selectedComment, // Actualiza el comentario
                            });
                            handleClose(); // Cierra la modal después de actualizar
                        }}
                    >
                        Actualizar Comentario
                    </Button>
                </DialogActions>
            </Dialog>

            <FetchOrders
                selectedOrder={handleOrderSelection}
                openModal={openModal}
                setOpenModal={setOpenModal}
            />
        </Box>
    );
};

export default TableOrdenes;