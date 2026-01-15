import { DataGrid, GridActionsCellItem, GridDeleteIcon, GridEditInputCell, GridToolbar } from '@mui/x-data-grid';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Autocomplete, Box, Button, FormControl, InputAdornment, InputLabel, ListSubheader, MenuItem, Modal, Select, TextField, Tooltip } from '@mui/material';
import '../../../../estilos/barraAcciones.css'; // Importar el archivo CSS
import confirmOrden from '../../../../images/confirm.png';
import processOrden from '../../../../images/process.png';
import revertir from '../../../../images/revertir.png';
import searchOrden from '../../../../images/search.png';
import addOrder from '../../../../images/addOrder.png';
import importExcel from '../../../../images/archivo-excel.png';
import Swal from 'sweetalert2';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RateReviewIcon from '@mui/icons-material/RateReview';
import FetchOrders from './FetchOrders';
import SendIcon from '@mui/icons-material/Send';
import cancelOrder from '../../../../images/cancel.png';
import UpdateIcon from '@mui/icons-material/Update';
import SearchIcon from '@mui/icons-material/Search';
import { read, utils } from 'xlsx';
import { useRef } from 'react';
import apiUrl from '../../../../config';
import '../../Inventarios/estilosPrueba.css'
import { useNavigate } from "react-router-dom";


const getCurrentDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

const TableOrdenes = () => {
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
    const [ubicaciones, setUbicaciones] = useState([]);
    const [selectedUbicacionEntrada, setSelectedUbicacionEntrada] = useState('');
    const [selectedUbicacionSalida, setSelectedUbicacionSalida] = useState('');
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
    const [comment, setComment] = useState('');
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
    const [searchTermUbicacion, setSearchTermUbicacion] = useState('');

    const navigate = useNavigate();

    const bodegaSalidaRef = useRef(null);
    const bodegaEntradaRef = useRef(null);
    const descripcionRef = useRef(null);
    const ubicacionSalidaRef = useRef(null);
    const ubicacionEntradaRef = useRef(null);
    const cantidadRef = useRef(null);
    const isAdmin = user?.rol_id === 1;


    const [dateTime, setDateTime] = useState(getCurrentDateTime());

    useEffect(() => {
        const timer = setInterval(() => {
            setDateTime(getCurrentDateTime());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

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

    // Estilos del modal
    const modalStyle = {
        position: 'absolute',
        width: 1480,
        height: 600,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        bgcolor: 'background.paper',
        border: '2px solid #000',
        borderRadius: 6,
        boxShadow: 24,
        p: 4,
    };

    // Función que abre la modal y realiza la búsqueda al hacer clic en el ícono de búsqueda
    const handleOpenSearchProducts = async () => {
        if (habilitarBuscador) {
            setOpen(true);  // Abre la modal después de la búsqueda
        }
    };

    const handleCloseSearchProducts = () => setOpen(false);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await axios.get(`${apiUrl}/buscador/productos/todo`);
                if (response.data && Array.isArray(response.data) && response.data.length > 0) {
                    setRowsProducts(response.data);
                    setFilteredProducts(response.data);
                } else {
                    Swal.fire({
                        title: '!Productos no encontrados!',
                        text: 'No se encontraron productos',
                        icon: 'error',
                        timer: 5000,
                        showCloseButton: true,
                        allowEscapeKey: true
                    });
                }
            } catch (error) {
                if (error.response && error.response.data && error.response.data.message) {
                    const { messageText } = error.response.data.message;
                    Swal.fire({
                        title: 'Error',
                        text: `Error: ${messageText}`,
                        icon: 'error',
                        timer: 5000,
                        showCloseButton: true,
                        allowEscapeKey: true
                    });
                }
            }
        }
        fetchProducts();
    }, []);

    useEffect(() => {
        const fetchBodegas = async () => {
            try {
                const response = await axios.get(`${apiUrl}/inventario/bodegas_y_localidades/nombres/bodegas`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                setBodegaSalida(response.data);
                setBodegaEntrada(response.data);
            } catch (error) {
                if (error.response && error.response.data && error.response.data.message) {
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
        };

        const fetchTipoTraspaso = async () => {
            try {
                const response = await axios.get(`${apiUrl}/inventario/tipoTransaccion`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                // Filtrar los resultados que coincidan con el rol_id del usuario logueado
                const resultadosFiltrados = response.data.filter(item => item.rol_id === user.rol_id);

                if (resultadosFiltrados.length > 0) {
                    setTraspasos(resultadosFiltrados);

                } else {
                    console.log("Sin Movimientos asignados");
                }

            } catch (error) {
                if (error.response && error.response.data && error.response.data.message) {
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
        };

        fetchTipoTraspaso();
        fetchBodegas();
    }, []);

    const handleUbicacionSelectSalida = (e) => {
        const selectedId = parseInt(e.target.value, 10); //selectedId sea un número
        setSelectedUbicacionSalida(selectedId);
        const selectedUbicacionSalida = ubicaciones.find(ubic => ubic.id === parseInt(selectedId));

        if (selectedUbicacionSalida) {
            setExistenciaProducto(selectedUbicacionSalida.cantidad)
        }

        if (ubicacionSalidaRef.current) {
            ubicacionSalidaRef.current.classList.remove('error');
        }
    };

    const handleUbicacionSelectEntrada = (e) => {
        const selectedIdEntrada = parseInt(e.target.value, 10);
        setSelectedUbicacionEntrada(selectedIdEntrada);

        const selectedUbicacionEntrada = ubicacionEntrada.find(ubicacion => ubicacion.id === parseInt(selectedIdEntrada));

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
    }

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

        const tipoTraspasoSeleccionado = traspasos.find(traspaso => traspaso.id === traspasoId);
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
    }, [categoriaTemp])

    const fetchExistencias = async (productoId) => {
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
                        allowEscapeKey: true
                    });
                    return;
                }
                const response = await axios.get(`${apiUrl}/inventario/ordenBodegas_y_lineasBodegas/producto/${productoId}/bodegaSalida/${selectedBodegaSalida}/bodegaEntrada/${selectedBodegaEntrada}/transferencia`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                // Verificar si el producto existe
                if (response.data.data.salida.length === 0) {
                    Swal.fire({
                        title: '!Producto no encontrado!',
                        text: 'No se encontraron existencias, verifique el producto',
                        icon: 'error',
                        timer: 5000,
                        showCloseButton: true,
                        allowEscapeKey: true
                    });
                    return; // Salir de la función si el producto no existe
                }
                setUbicaciones(response.data.data.salida);
                setUbicacionEntrada(response.data.data.entrada);
                setProductoTitle(response.data.data.producto.title);
                setProductoSku(response.data.data.producto.sku);
                setProductoId(response.data.data.producto.producto_id);
                setProductoMlm(response.data.data.producto.inventory_id);
            } else {

                let bodegaSeleccionada;

                if (categoriaTemp === 'entrada') {
                    bodegaSeleccionada = selectedBodegaEntrada;
                } else if (categoriaTemp === 'salida') {
                    bodegaSeleccionada = selectedBodegaSalida;
                } else {
                    alert('Tipo de movimiento no válido');
                    return;
                }
                const response = await axios.get(`${apiUrl}/inventario/ordenBodegas_y_lineasBodegas/producto/${productoId}/bodega/${bodegaSeleccionada}/tipo/${categoriaTemp}/localidades`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                // Verificar si el producto existe
                if (!response.data || !response.data.data || response.data.data.length === 0) {
                    Swal.fire({
                        title: '!Producto no encontrado!',
                        text: 'No se encontraron existencias, verifique el producto',
                        icon: 'error',
                        timer: 5000,
                        showCloseButton: true,
                        allowEscapeKey: true
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
                } else if (categoriaTemp === 'entrada' && response.data.ok) {
                    setUbicacionEntrada(response.data.data.existencias);
                    setProductoTitle(response.data.data.producto.title);
                    setProductoSku(response.data.data.producto.sku);
                    setProductoMlm(response.data.data.producto.inventory_id);
                    setProductoId(response.data.data.producto.producto_id);
                }
            }
        } catch (error) {
            if (error.response && error.response.data && error.response.data.message) {
                const { messageText } = error.response.data.message;
                Swal.fire({
                    title: 'Error',
                    text: `Error: ${messageText}`,
                    icon: 'error',
                    timer: 5000,
                    showCloseButton: true,
                    allowEscapeKey: true
                });
            }
        };
    };

    const handleSearch = async (productoId) => {
        if (productoId) {
            fetchExistencias(productoId);
            setComment('');
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
            }
            else if (categoriaTemp === 'entrada') {
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
            const errorMessage = error.response?.data?.message || "Ha ocurrido un error desconocido";
            Swal.fire({
                title: '¡No se pudo actualizar la linea!',
                text: errorMessage,
                icon: 'error',
                //timer: 5000,
                showCloseButton: true,
                allowEscapeKey: true
            });
            return oldRow;
        }
    };

    const parseOrNull = (value) => {
        const parsedValue = parseInt(value);
        return isNaN(parsedValue) ? null : parsedValue;
    };

    const handleGenerarOrder = async () => {
        if (selectedUbicacionSalida && parseInt(inputValue) > parseInt(existenciaProducto)) {
            Swal.fire({
                title: '¡Error!',
                text: 'La cantidad no puede ser mayor que las existencias disponibles.',
                icon: 'error',
                timer: 5000,
                showCloseButton: true,
                allowEscapeKey: true
            });
            return TableOrdenes;
        }
        const handleAddRow = (lineasIds = []) => {

            const selectedUbicacionSalidaDescripcion = ubicaciones.find(ubic => ubic.id === selectedUbicacionSalida)?.descripcion || '';
            const selectedUbicacionEntradaDescripcion = ubicacionEntrada.find(ubicacion => ubicacion.id === selectedUbicacionEntrada)?.descripcion || '';

            const newRow = {
                id: lineasIds[0] || (rows.length + 1), // Asigna un ID único
                cantidad: parseInt(inputValue),
                producto_id: productoId, // ID del producto seleccionado,
                sku: productoSku,
                inventory_id: productoMlm,
                producto_title: productoTitle,
                existencias_origen: existenciaProducto,
                existencias_destino: existenciaProductoDestino,
                localidad_entrada: selectedUbicacionEntradaDescripcion,
                localidad_salida: selectedUbicacionSalidaDescripcion,
                localidad_entrada_id: selectedUbicacionEntrada,
                localidad_salida_id: selectedUbicacionSalida,
                comentario: selectedComment
            };

            setRows((prevRows) => [...prevRows, newRow]);

            setProductoId('');
            setProductoSku('');
            setProductoMlm('');
            setSelectedUbicacionSalida('');
            setSelectedUbicacionEntrada('');
            setExistenciaProducto('');
            setExistenciaProductoDestino('');
            setInputValue('');
            setComment('');
            setIsButtonDisabled(true);
        }

        if (estatus === 'abierto') {
            const lineasData = {
                lineas: [{
                    producto_id: productoId,
                    cantidad: parseInt(inputValue),
                    comentario: selectedComment,
                    localidad_salida_id: parseOrNull(selectedUbicacionSalida),
                    localidad_entrada_id: parseOrNull(selectedUbicacionEntrada)
                }]
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
                                allowEscapeKey: true
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
                                allowEscapeKey: true
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
                                allowEscapeKey: true
                            });
                            return;
                        }
                    }
                    const response = await axios.post(`${apiUrl}/inventario/ordenBodegas_y_lineasBodegas/orden/${ordenId}/lineas`, lineasData, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    if (response.data.ok && response.data.lineasIds) {
                        handleAddRow(response.data.lineasIds); // Pasar los IDs de las líneas al método de agregar filas
                    }

                } catch (error) {
                    if (error.response && error.response.data && error.response.data.message) {
                        const { messageText } = error.response.data.message;
                        Swal.fire({
                            title: 'Error',
                            text: `Error: ${messageText}`,
                            icon: 'error',
                            timer: 5000,
                            showCloseButton: true,
                            allowEscapeKey: true
                        });
                    }
                }
            };

            // Llamar a la función con el ID de la orden correspondiente
            const ordenId = idOrder; // Cambia esto por el ID de la orden real
            enviarLineas(ordenId);

        } else if (!estatus) {
            const dateTime = new Date().toISOString().slice(0, 19).replace('T', ' ');

            const data = {
                fecha_abierto: dateTime,
                tipo_transaccion_id: idTraspaso,
                bodega_salida_id: parseOrNull(selectedBodegaSalida),
                bodega_entrada_id: parseOrNull(selectedBodegaEntrada),
                estatus: "abierto",
                descripcion: descripcion,
                lineas: [
                    {
                        producto_id: productoId,
                        cantidad: parseInt(inputValue),
                        comentario: selectedComment,
                        localidad_salida_id: parseOrNull(selectedUbicacionSalida),
                        localidad_entrada_id: parseOrNull(selectedUbicacionEntrada)
                    }
                ]
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

            try {
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
                        allowEscapeKey: true
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
                            allowEscapeKey: true
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
                            allowEscapeKey: true
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
                            allowEscapeKey: true
                        });
                        return;
                    }
                }
                const response = await axios.post(`${apiUrl}/inventario/ordenBodegas_y_lineasBodegas/orden/${idTraspaso}`, data, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
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
                    setRolIdTempEntrada(resultRolIdEntrada)
                    setIdOrder(response.data.id);
                    setEstatus(response.data.estatus);
                    if (response.data.lineasIds) {
                        handleAddRow(response.data.lineasIds); // Pasar los IDs de las líneas al método de agregar filas
                    } else {
                        handleAddRow(); // Si no hay lineasIds, agregar la fila sin esa información
                    }
                }
            } catch (error) {
                if (error.response && error.response.data && error.response.data.message) {
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
        }
    }

    const handleImportExcel = async (e) => {
        //console.log("onChange detectado");
        const file = e.target.files[0];

        if (!file) {
            Swal.fire({
                title: 'Error',
                text: 'No se selecciono ningún archivo excel',
                icon: 'error',
                timer: 5000,
                showCloseButton: true,
                allowEscapeKey: true
            });
            return;
        }

        console.log("Archivo seleccionado:", file);

        const reader = new FileReader();

        reader.onload = async (event) => {
            //console.log("Archivo cargado, leyendo contenido...");
            const arrayBuffer = event.target.result;

            try {
                const workbook = read(arrayBuffer, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = utils.sheet_to_json(worksheet);

                //console.log("Datos leídos del archivo Excel:", jsonData);

                // Iterar sobre cada fila del archivo Excel
                // Mapear los datos al formato requerido por el backend
                const lineasData = {
                    lineas: jsonData.map(row => ({
                        producto_id: row.producto_id,
                        cantidad: parseInt(row.cantidad, 10),
                        comentario: row.comentario || '',
                        localidad_salida_id: row.localidad_salida_id || null,
                        localidad_entrada_id: row.localidad_entrada_id || null
                    }))
                };

                try {
                    //console.log("Datos enviados al backend:", JSON.stringify(lineasData, null, 2));
                    const response = await axios.post(
                        `http://localhost:3304/inventario/ordenBodegas_y_lineasBodegas/orden/${idOrder}/lineas/excel`,
                        lineasData,
                        {
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        }
                    );

                    //console.log("Respuesta del servidor:", response.data);
                    const { ok, message, errores } = response.data;
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
                    } else {
                        Swal.fire({
                            title: 'Éxito',
                            text: message,
                            icon: 'success',
                            timer: 5000,
                        });
                        fetchOrderSelected(idOrder);
                    }
                    fetchOrderSelected(idOrder);
                } catch (error) {
                    const errorMessage = error.response?.data?.message || "Ha ocurrido un error desconocido";
                    Swal.fire({
                        title: 'Error',
                        text: errorMessage,
                        icon: 'error',
                        //timer: 5000,
                        showCloseButton: true,
                        allowEscapeKey: true
                    });
                }
            } catch (error) {
                const errorMessage = error.response?.data?.message || "Ha ocurrido un error desconocido";
                Swal.fire({
                    title: 'Error',
                    text: errorMessage,
                    icon: 'error',
                    //timer: 5000,
                    showCloseButton: true,
                    allowEscapeKey: true
                });
            }
        };

        reader.onerror = () => {
            Swal.fire({
                title: 'Error',
                text: 'Error al leer el archivo Excel',
                icon: 'error',
                //timer: 5000,
                showCloseButton: true,
                allowEscapeKey: true
            });
        };

        reader.readAsArrayBuffer(file);
    };

    const handleConfirmarOrden = async () => {
        const dateTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
        const data = {
            fecha_confirmada: dateTime,
        };

        try {
            const response = await axios.post(`${apiUrl}/inventario/ordenBodegas_y_lineasBodegas/confirmar/${idOrder}`, data, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.data.ok) {
                setIdOrder(response.data.ordenId);
                setEstatus(response.data.estatus);
                Swal.fire({
                    title: '¡Orden confirmada!',
                    text: 'La orden se confirmo exitosamente!',
                    icon: 'success',
                    timer: 5000,
                    showCloseButton: true,
                    allowEscapeKey: true
                });
            }
        } catch (error) {
            if (error.response && error.response.data && error.response.data.message) {
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
    }

    const handleCancelOrden = async () => {
        const dateTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
        const data = {
            fecha_procesada: dateTime
        }
        try {
            const response = await axios.post(`${apiUrl}/inventario/ordenBodegas_y_lineasBodegas/cancelar/${idOrder}`, data, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.data.ok) {
                setIdOrder(response.data.ordenId);
                setEstatus(response.data.estatus);
                Swal.fire({
                    title: '¡Orden cancelada!',
                    text: 'La orden se cancelo correctamente!',
                    icon: 'success',
                    timer: 5000,
                    showCloseButton: true,
                    allowEscapeKey: true
                });
            }
        } catch (error) {
            if (error.response && error.response.data && error.response.data.message) {
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
    }

    const handleRevertirOrden = async () => {
        try {
            const response = await axios.put(
                `${apiUrl}/inventario/ordenBodegas_y_lineasBodegas/orden/${idOrder}/revertir`,
                {}, // Este es el cuerpo de la solicitud (si no envías datos, puedes pasar un objeto vacío)
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
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
                    allowEscapeKey: true
                });
            }
        } catch (error) {
            if (error.response && error.response.data && error.response.data.message) {
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
    }

    const handleProcesarOrden = async () => {
        const dateTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
        const data = {
            fecha_procesada: dateTime,
            usuario: user.nombre
        };

        try {
            const response = await axios.post(`${apiUrl}/inventario/ordenBodegas_y_lineasBodegas/procesar/${idOrder}`, data, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.data.ok) {
                setIdOrder(response.data.id);
                setEstatus(response.data.estatus);
                Swal.fire({
                    title: '¡Orden procesada!',
                    text: 'La orden se proceso exitosamente!',
                    icon: 'success',
                    timer: 5000,
                    showCloseButton: true,
                    allowEscapeKey: true
                });
            }
        } catch (error) {
            if (error.response && error.response.data && error.response.data.message) {
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
    }

    const deleteLine = (id) => async (e) => {
        e.preventDefault();

        Swal.fire({
            title: '¿Estás seguro?',
            text: '¡No podrás revertir esto!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminarlo'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    // Eliminar la línea en el backend
                    const response = await axios.delete(`${apiUrl}/inventario/ordenBodegas_y_lineasBodegas/lineas/${id}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    if (response.data.orderDeleted) {
                        const mensaje = response.data.mensaje;
                        Swal.fire({
                            title: '¡Eliminado!',
                            text: mensaje,
                            icon: 'success'
                        });
                        navigate('/ordenes-de-bodega');
                        return;
                    }

                    Swal.fire({
                        title: "¡Eliminado!",
                        text: response.data.mensaje,
                        icon: "success",
                    });

                    fetchOrderSelected(idOrder); // Recargar la orden que sí sigue existiendo
                } catch (error) {
                    if (error.response && error.response.data && error.response.data.mensaje) {
                        const errorMessage = error.response.data.mensaje;
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
            }
        });
    };

    useEffect(() => {
        if (productoSku === '') {
            setSelectedUbicacionSalida('');
            setSelectedUbicacionEntrada('');
            setUbicacionSalidaHabilitada(false);
            setUbicacionEntradaHabilitada(false);
            setHabilitarCantidad(false);
            setExistenciaProducto('');
            setExistenciaProductoDestino('');
            setInputValue('');
            setSelectedComment('');
            setIsButtonDisabled(true);
        }
    }, [productoSku])

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

        let isValid = true;
    };

    const fetchsku = async (productoSku) => {
        try {
            const response = await axios.get(`${apiUrl}/inventario/ordenBodegas_y_lineasBodegas/producto/${productoSku}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            // Si llega aquí, significa que hay un resultado válido en el array
            if (Array.isArray(response.data) && response.data.length === 1) {
                const producto = response.data[0];  // Accede al único producto
                setProductoId(producto.producto_id);
                setProductoSku(producto.sku);
                await handleSearch(producto.producto_id);
            } else {
                // Para cuando el array no tiene exactamente un elemento
                setSearchTerm(productoSku);
                setOpen(true);
            }
        } catch (error) {
            // Maneja el caso específico de "Producto no encontrado"
            if (error.response && error.response.data && error.response.data.message === "Producto no encontrado") {
                setSearchTerm(productoSku);
                setOpen(true);
            } else if (error.response && error.response.data && error.response.data.message) {
                // Otros mensajes de error
                const errorMessage = error.response.data.message;
                Swal.fire({
                    title: 'Error',
                    text: errorMessage,
                    icon: 'error',
                    timer: 5000,
                    showCloseButton: true,
                    allowEscapeKey: true
                });
            } else {
                Swal.fire({
                    title: 'Error',
                    text: 'Error en la comunicación con el servidor.',
                    icon: 'error',
                    timer: 5000,
                    showCloseButton: true,
                    allowEscapeKey: true
                });
            }
        }
    };

    // Función que maneja el evento de presionar Enter en el input
    const handleKeyDown = (event) => {
        if (habilitarBuscador && (event.key === 'Enter' || event.key === 'Tab' || event.type === 'click')) {
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
    }



    useEffect(() => {
        const isAdmin = user?.rol_id === 1;

        if (estatus === 'abierto') {
            setBodegaSalidaHabilitada(false);
            setBodegaEntradaHabilitada(false);
            setEnableRevertir(false);
            setHabilitarTraspaso(false);


            if (user?.rol_id === rolMovimiento || isAdmin) {
                setHabilitarDescripcion(true);
                setHabilitarBuscador(true);
                setEnableCancel(true);
            }
            if (categoriaTemp === 'entrada' && user?.rol_id === rolIdTempEntrada || isAdmin) {
                setEnableConfirm(true);
            }
            else if (categoriaTemp === 'salida' && user?.rol_id === rolIdTemp || isAdmin) {
                setEnableConfirm(true);
            }
            else if (categoriaTemp === 'transferencia' && user?.rol_id === rolIdTemp || isAdmin) {
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
            if (categoriaTemp === 'entrada' && user?.rol_id === rolIdTempEntrada || isAdmin) {
                setEnableProcess(true);
            }
            else if (categoriaTemp === 'salida' && user?.rol_id === rolIdTemp || isAdmin) {
                setEnableProcess(true);
            }
            else if (categoriaTemp === 'transferencia' && user?.rol_id === rolIdTempEntrada || isAdmin) {
                setEnableProcess(true);
            }
            if (user?.rol_id === rolMovimiento || isAdmin) {
                setEnableRevertir(true);
            }
        }
        if (estatus === 'procesado') {
            setEnableRevertir(false);
            setEnableProcess(false);
            setEnableConfirm(false);
            setHabilitarTraspaso(false);
            setHabilitarDescripcion(false);
            setBodegaSalidaHabilitada(false);
            setBodegaEntradaHabilitada(false);
            setHabilitarComentario(false);
        }
        if (estatus === 'cancelada') {
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

    }, [estatus, rolIdTemp, rolMovimiento, user, categoriaTemp, rolIdTempEntrada]);

    const handleUpdateOrder = async () => {
        try {
            if (descripcion) {
                const response = await axios.put(`${apiUrl}/inventario/ordenBodegas_y_lineasBodegas/ordenDeBodega/${idOrder}/descripcion`,
                    {
                        descripcion: descripcion,
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                Swal.fire({
                    title: '¡Actualizado!',
                    text: 'Tu descripción ha sido actualizada.',
                    icon: 'success'
                });
                return response.data;
            }
        } catch (error) {
            if (error.response && error.response.data && error.response.data.message) {
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
    }

    const handleUpdateLinea = async (updatedRow) => {
        const { id, producto_id, cantidad, localidad_salida_id, localidad_entrada_id, comentario } = updatedRow;

        try {
            const updatedFields = {
                producto_id: producto_id,
                cantidad: cantidad,
                localidad_salida_id: parseOrNull(localidad_salida_id),
                localidad_entrada_id: parseOrNull(localidad_entrada_id),
                comentario: comentario,
            };

            const response = await axios.put(`${apiUrl}/inventario/ordenBodegas_y_lineasBodegas/${id}`, updatedFields, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            fetchOrderSelected(idOrder);
            Swal.fire({
                title: '¡Actualizado!',
                text: 'Tu línea ha sido actualizada.',
                icon: 'success'
            });
            return response.data;

        } catch (error) {
            // Revisamos si la estructura de `error.response.data.message` contiene `messageText`
            const errorMessage = error.response?.data?.message || "Ha ocurrido un error desconocido";
            Swal.fire({
                title: '¡No se pudo actualizar la linea!',
                text: errorMessage,
                icon: 'error',
                //timer: 5000,
                showCloseButton: true,
                allowEscapeKey: true
            });
            throw error; // Lanzar el error para que pueda ser capturado por processRowUpdate
        }
    };

    // Manejador de errores global en DataGrid
    const handleProcessRowUpdateError = (error) => {
        const errorMessage = error.response?.data?.message || "Ha ocurrido un error desconocido";
        Swal.fire({
            title: "Error Global",
            text: errorMessage,
            icon: "error",
            showCloseButton: true,
            allowEscapeKey: true,
        });
    };

    const handleOpenComment = (row) => {
        setSelectedRow(row);  // Almacena toda la fila seleccionada
        setSelectedComment(row.comentario || '');  // Inicializa el comentario seleccionado
        setOpenComment(true);
    };

    const handleRowSelectionComment = (params) => {
        const row = params.row;
        setSelectedRow(row);
        setSelectedComment(row.comentario || '');
        setHabilitarComentario(row.comentario || true);
    }

    const handleClose = () => setOpenComment(false);

    useEffect(() => {
        if (openComment) {
            const input = document.getElementById('comment-input');
            if (input) input.focus();
        }
    }, [openComment]);


    const isCellEditable = () => {
        if (estatus === 'abierto') {
            return user.rol_id === rolMovimiento ||  isAdmin;
        }
        return estatus !== 'confirmado' && estatus !== 'procesado' && estatus !== 'cancelada';
    };

    const handleOrderSelection = async (orderId) => {
        if (!orderId) {
            console.error("orderId es null o undefined");
            return;
        }
        try {
            // setSelectedOrderId(orderId);
            await fetchOrderSelected(orderId);
        } catch (error) {
            console.error("Error al seleccionar la orden:", error);
        }
    }

    const fetchOrderSelected = async (orderId) => {
        try {
            const response = await axios.get(`${apiUrl}/inventario/ordenBodegas_y_lineasBodegas/orden/${orderId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
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

            setHabilitarBuscador(user.rol_id === response.data.data.rol_id_tipo_transaccion && response.data.data.orden.estatus === 'abierto');
            //  setHabilitarComentario(user.rol_id === response.data.data.rol_id_entrada && response.data.data.orden.estatus === 'abierto');

            const dataGridRows = response.data.data.lineas.map((linea) => ({
                id: linea.id,
                producto_id: linea.producto_id,
                sku: linea.sku,
                inventory_id: linea.inventory_id,
                producto_title: linea.producto_title,
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
            if (error.response && error.response.data && error.response.data.message && error.response.data.messageText) {
                const errorMessage = error.response.data.messageText;
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
    };

    const handleButtonClick = () => {
        document.getElementById('file-input').click();
    };

    const handleRowSelection = (params) => {
        // Encuentra el producto en los datos originales por ID
        const selectedProduct = rowsProducts.find(product => product.producto_id === params.row.producto_id);

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
            const searchWords = searchTerm.toLowerCase().split(' ').filter(word => word);

            filtered = filtered.filter(product => {
                const productMLM = product.id ? product.id.toLowerCase() : '';
                const productCatalog = product.catalog_id ? product.catalog_id.toLowerCase() : '';
                const productTitle = product.title ? product.title.toLowerCase() : '';
                const productSku = product.sku ? product.sku.toLowerCase() : '';
                const productVariation = product.variation_id ? product.variation_id.toLowerCase() : '';
                const productInventoryId = product.inventory_id ? product.inventory_id.toLowerCase() : '';
                const productVariationDesc = product.variation_desc ? product.variation_desc.toLowerCase() : '';

                // Verifica si todas las palabras están en el título
                const titleMatch = searchWords.every(word => productTitle.includes(word));

                // Verifica si el término de búsqueda está en otras columnas
                const otherColumnsMatch = (
                    productMLM.includes(searchTerm.toLowerCase()) ||
                    productCatalog.includes(searchTerm.toLowerCase()) ||
                    // productTitle.includes(searchTerm.toLowerCase()) ||
                    productSku.includes(searchTerm.toLowerCase()) ||
                    productVariation.includes(searchTerm.toLowerCase()) ||
                    productInventoryId.includes(searchTerm.toLowerCase()) ||
                    productVariationDesc.includes(searchTerm.toLowerCase())
                );

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
                    disabled={!rowsProducts.some(product => product.producto_id === params.row.producto_id)}
                    onClick={() => handleRowSelection(params)}
                >
                    Seleccionar
                </Button>
            ),
            sortable: false,
            filterable: false,
        },
        { field: 'producto_id', headerName: 'ID producto', type: 'number' },
        { field: 'tipo_publicacion', headerName: 'Tipo\npublicación', type: 'number', flex: 1, headerClassName: 'header-wrap', headerAlign: 'center' },
        { field: 'id', headerName: '#Publicación', type: 'text', flex: 1 },
        { field: 'catalog_id', headerName: '#Catalogo', type: 'text', flex: 1 },
        { field: 'title', headerName: 'Titulo', type: 'text', flex: 3 },
        { field: 'sku', headerName: 'SKU', type: 'text', flex: 2, headerAlign: 'center' },
        { field: 'variation_id', headerName: '#Variación', type: 'number', headerAlign: 'center' },
        { field: 'inventory_id', headerName: 'ML', type: 'text', flex: 1, headerAlign: 'center' },
        { field: 'variation_desc', headerName: 'Variante', type: 'text', flex: 1.7 },
    ]

    const columns = [
        { field: 'id', headerName: 'ID', type: 'number', hide: true },
        { field: 'producto_id', headerName: 'ID', type: 'number', flex: 1 },
        {
            field: 'cantidad', headerName: 'Cantidad', editable: true, type: 'number', flex: 0.5, cellClassName: 'celdaEditable',
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
                    error: !isValid,  // Marca la celda con error si la validación falla
                };
            }
        },
        { field: 'sku', headerName: 'SKU', flex: 1.3 },
        { field: 'inventory_id', headerName: 'ML', flex: 0.6, headerAlign: 'center' },
        { field: 'localidad_salida', headerName: 'Ubicación\nOrigen', flex: 0.7, headerClassName: 'header-wrap', headerAlign: 'center' },
        { field: 'existencias_origen', headerName: 'Existencia\nOrigen', type: 'number', flex: 0.7, headerClassName: 'header-wrap', headerAlign: 'center' },
        { field: 'localidad_entrada', headerName: 'Ubicación\nDestino', flex: 0.7, headerClassName: 'header-wrap', headerAlign: 'center' },
        { field: 'localidad_entrada_id', headerName: 'ID ubicación entrada', type: 'number' },
        { field: 'localidad_salida_id', headerName: 'ID ubicación salida', type: 'number' },
        { field: 'existencias_destino', headerName: 'Existencia\nDestino', flex: 0.7, headerClassName: 'header-wrap', headerAlign: 'center' },
        { field: 'producto_title', headerName: 'Descripción', flex: 2 },
        {
            field: 'actions',
            headerName: 'Acciones',
            type: 'actions',
            flex: 0.5,
            getActions: (params) => {
                if (!params || !params.row) {
                    console.error('Error: params o params.row es null o undefined');
                    return [];
                }
                if (estatus === 'confirmado' || estatus === 'procesado' || estatus === 'cancelada') {
                    return [
                        params.row.comentario ? (
                            <Tooltip title='Ver comentario' key={`comment-${params.row.id}`}>
                                <GridActionsCellItem
                                    icon={<RateReviewIcon />}
                                    sx={{ color: 'blue' }}
                                    onClick={() => handleOpenComment(params.row)}
                                />
                            </Tooltip>
                        ) : null,
                    ].filter(Boolean);
                } else if (user.rol_id !== rolMovimiento && estatus === 'abierto') {
                    return [
                        params.row.comentario ? (
                            <Tooltip title='Ver comentario' key={`comment-${params.row.id}`}>
                                <GridActionsCellItem
                                    icon={<RateReviewIcon />}
                                    sx={{ color: 'blue' }}
                                    onClick={() => handleOpenComment(params.row)}
                                />
                            </Tooltip>
                        ) : null,
                    ].filter(Boolean);
                }
                return [
                    params.row.comentario ? (
                        <Tooltip title='Ver comentario' key={`comment-${params.row.id}`}>
                            <GridActionsCellItem
                                icon={<RateReviewIcon />}
                                sx={{ color: 'blue' }}
                                onClick={() => handleOpenComment(params.row)}
                            />
                        </Tooltip>
                    ) : null,
                    <Tooltip title='Borrar línea' key={`delete-${params.row.id}`}>
                        <GridActionsCellItem
                            icon={<GridDeleteIcon />}
                            sx={{ color: 'red' }}
                            onClick={deleteLine(params.id)} 
                            label="Delete"
                        />
                    </Tooltip>
                ].filter(Boolean);
            },
        },
    ];

    useEffect(() => {
        // Verifica si el ID actual de la ubicación existe en las opciones
        const exists = ubicacionEntrada.some(u => u.id === selectedUbicacionEntrada);

        if (!exists) {
            setSelectedUbicacionEntrada('');
            setInputValueUbicacion('');
        }
    }, [ubicacionEntrada, selectedUbicacionEntrada]);


    return (
        <div>
            <div className="gestorOrdenes">
                <div className="left-actions">
                    <div className="action-item" onClick={handleOrderNew}
                        style={{ cursor: 'pointer' }}
                    >
                        <img src={addOrder} alt="Orden Nueva" className="action-icon" />
                        <span>Orden Nueva</span>
                    </div>
                    <div className="action-item" onClick={() => setOpenModal(true)}
                        style={{ cursor: 'pointer' }}
                    >
                        <img src={searchOrden} alt="Buscar Orden" className="action-icon" />
                        <span>Buscar Orden</span>
                    </div>
                    <div className="action-item" style={{ cursor: 'pointer' }} onClick={handleButtonClick}>
                        <img src={importExcel} alt="Importar Excel" className="action-icon" />
                        <span>Importar Excel</span>
                        <input
                            id="file-input"
                            type="file"
                            accept=".xlsx, .xls"
                            style={{ display: 'none' }}
                            onChange={handleImportExcel}
                        />
                    </div>
                </div>
                <div className="right-actions">
                    <div className="action-item" onClick={enableCancel ? handleCancelOrden : null}
                        style={{ opacity: enableCancel ? 1 : 0.5, cursor: enableCancel ? 'pointer' : 'not-allowed' }}
                    >
                        <img src={cancelOrder} alt="Cancelar Orden" className="action-icon" />
                        <span>Cancelar Orden</span>
                    </div>
                    <div className="action-item" onClick={enableRevertir ? handleRevertirOrden : null}
                        style={{ opacity: enableRevertir ? 1 : 0.5, cursor: enableRevertir ? 'pointer' : 'not-allowed' }}
                    >
                        <img src={revertir} alt="Revertir Orden" className="action-icon" />
                        <span>Revertir Orden</span>
                    </div>
                    <div className="action-item" onClick={enableConfirm ? handleConfirmarOrden : null}
                        style={{ opacity: enableConfirm ? 1 : 0.5, cursor: enableConfirm ? 'pointer' : 'not-allowed' }}
                    >
                        <img src={confirmOrden} alt="Confirmar Orden" className="action-icon" />
                        <span>Confirmar Orden</span>
                    </div>
                    <div className="action-item" onClick={enableProcess ? handleProcesarOrden : null}
                        style={{ opacity: enableProcess ? 1 : 0.5, cursor: enableProcess ? 'pointer' : 'not-allowed' }}
                    >
                        <img src={processOrden} alt="Procesar Orden" className="action-icon" />
                        <span>Procesar Orden</span>
                    </div>
                </div>
            </div>
            {/* Ventana Modal */}
            <Modal open={open} onClose={handleCloseSearchProducts}>
                <Box sx={modalStyle}>
                    <TextField
                        label="Buscador..."
                        color='primary'
                        focused
                        sx={{ width: '20rem', marginBottom: '10px' }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <div style={{ width: '100%', height: '85%', overflowX: 'auto' }}>
                        <DataGrid style={{ fontFamily: "Montserrat", fontWeight: "bold", width: "1800px" }}
                            rows={filteredProducts}
                            columns={columnsProducts}
                            pageSize={5}
                            showCellVerticalBorder
                            showColumnVerticalBorder
                            getRowId={(row) => row.producto_id}
                            experimentalFeatures={{ newEditingApi: true }}
                            slots={{ toolbar: GridToolbar }}
                            density="compact"
                            columnVisibilityModel={{
                                producto_id: false,
                                variation_id: false,
                                tipo_publicacion: false,
                                id: false,
                                catalog_id: false
                            }}
                        />
                    </div>
                    <Button onClick={handleCloseSearchProducts} variant="contained" color="primary"
                        sx={{
                            marginTop: '10px',
                            marginLeft: '93%'
                        }}>Cerrar</Button>
                </Box>
            </Modal>
            <div className='order-form'>
                <div className='form-row'>
                    <label>Tipo de movimiento:</label>
                    <FormControl sx={{ m: 1, minWidth: 300 }} size='small'>
                        <InputLabel>Movimiento</InputLabel>
                        <Select
                            label="Movimiento"
                            value={selectedTraspasoId}
                            onChange={handleSelectedTraspasoChange}
                            disabled={!habilitarTraspaso}
                            style={{ backgroundColor: habilitarTraspaso ? 'white' : '#f0f0f0' }}
                        >
                            {traspasos.map((traspaso) => (
                                <MenuItem key={traspaso.id} value={traspaso.id}>
                                    {`${traspaso.descripcion} : ${traspaso.categoria}`}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <label className='label-desc'>Descripción:</label>
                    <TextField
                        disabled={!habilitarDescripcion}
                        value={descripcion}
                        onChange={(e) => setDescripcion(e.target.value)}
                        inputRef={descripcionRef}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <UpdateIcon
                                        style={{
                                            cursor: habilitarDescripcion ? 'pointer' : 'not-allowed',  // Cambia el cursor
                                            color: habilitarDescripcion ? 'green' : 'grey',  // Cambia el color del ícono cuando está deshabilitado 
                                        }}
                                        onClick={habilitarDescripcion ? handleUpdateOrder : null}  // Desactiva onClick si está deshabilitado
                                    />
                                </InputAdornment>
                            ),
                        }}
                        inputProps={{
                            style: {
                                backgroundColor: habilitarDescripcion ? 'white' : '#f0f0f0',
                                color: habilitarDescripcion ? 'black' : 'gray',
                            },
                        }}
                    />
                    <label className='label-orden'>Orden:</label>
                    <TextField type="text" value={idOrder} disabled sx={{ width: "80px" }} />
                </div>
                <div className='form-row'>
                    <label>Bodega de salida:</label>
                    <FormControl sx={{ m: 1, minWidth: "300px", marginLeft: "33px" }} size='small'>
                        <InputLabel>Bodega de salida:</InputLabel>
                        <Select
                            label="Bodega de salida:"
                            value={selectedBodegaSalida}
                            onChange={handleSelectBodegaSalida}
                            disabled={!bodegaSalidaHabilitada}
                            ref={bodegaSalidaRef}
                            style={{ backgroundColor: bodegaSalidaHabilitada ? 'white' : '#f0f0f0' }}
                        >
                            {bodegaSalida.map((bod) => (
                                <MenuItem key={bod.id} value={bod.id}>
                                    {bod.Nombre}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <label className='label-entrada'>Bodega de entrada:</label>
                    <FormControl sx={{ m: 1, minWidth: 300 }} size='small'>
                        <InputLabel>Bodega de entrada:</InputLabel>
                        <Select
                            label="Bodega de entrada:"
                            value={selectedBodegaEntrada}
                            disabled={!bodegaEntradaHabilitada}
                            onChange={handleSelectBodegaEntrada}
                            ref={bodegaEntradaRef}
                            style={{ backgroundColor: bodegaEntradaHabilitada ? 'white' : '#f0f0f0' }}
                        >
                            {bodegaEntrada.map((bodega) => (
                                <MenuItem key={bodega.id} value={bodega.id}>
                                    {bodega.Nombre}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <label className='label-estatus'>Estatus:</label>
                    <TextField
                        value={estatus}
                        disabled
                        sx={{ width: "80px", color: "red" }}
                    />
                </div>
                <div className='form-row'>
                    <label>Producto:</label>
                    <TextField
                        onKeyDown={handleKeyDown}
                        onBlur={handleBlur}
                        disabled={!habilitarBuscador}
                        value={productoSku}
                        onChange={handleProductId}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position='end'>
                                    <SearchIcon
                                        style={{
                                            cursor: habilitarBuscador ? 'pointer' : 'not-allowed',  // Cambia el cursor
                                            color: habilitarBuscador ? 'blue' : 'grey',  // Cambia el color del ícono cuando está deshabilitado 
                                        }}
                                        onClick={habilitarBuscador ? handleOpenSearchProducts : null}  // Desactiva onClick si está deshabilitado
                                    />
                                </InputAdornment>
                            ),
                        }}
                        InputLabelProps={{
                            style: {
                                transform: 'translate(10px, 8px)',  // Ajusta la posición del label
                            },
                        }}
                        inputProps={{
                            style: {
                                backgroundColor: habilitarBuscador ? 'white' : '#f0f0f0',
                                color: habilitarBuscador ? 'black' : 'gray',
                            },
                        }}
                    />
                    <label>Ubicación salida:</label>
                    <FormControl sx={{ m: 1, width: "130px" }} size='small'>
                        <InputLabel>Ubicación de salida</InputLabel>
                        <Select
                            label="Ubicación de salida"
                            disabled={!ubicacionSalidaHabilitada}
                            value={selectedUbicacionSalida}
                            onChange={handleUbicacionSelectSalida}
                            ref={ubicacionSalidaRef}
                            style={{ backgroundColor: ubicacionSalidaHabilitada ? 'white' : '#f0f0f0' }}
                        >
                            {ubicaciones
                                .sort((a, b) => b.cantidad - a.cantidad)
                                .map((ubic, index) => (
                                    <MenuItem key={index} value={ubic.id}>
                                        {`${ubic.descripcion} : ${ubic.cantidad}`}
                                    </MenuItem>
                                ))}
                        </Select>
                    </FormControl>
                    <label>Ubicación entrada:</label>
                    <Autocomplete
                        disabled={!ubicacionEntradaHabilitada}
                        options={ubicacionEntrada
                            .sort((a, b) => {
                                const aCantidad = a.cantidad || 0;
                                const bCantidad = b.cantidad || 0;
                                // Prioriza cantidad > 0
                                if (bCantidad > 0 && aCantidad === 0) return 1;
                                if (aCantidad > 0 && bCantidad === 0) return -1;
                                // Si ambos tienen cantidad > 0, ordenar por cantidad descendente
                                if (aCantidad > 0 && bCantidad > 0) return bCantidad - aCantidad;
                                // Si ambos 0 o undefined, ordenar alfabéticamente
                                return a.descripcion.localeCompare(b.descripcion, 'es', { sensitivity: 'base' });
                            })
                        }
                        getOptionLabel={(option) => `${option.descripcion} : ${option.cantidad ?? 0}`}
                        value={
                            ubicacionEntrada.find(u => u.id === selectedUbicacionEntrada)
                            || null
                        }
                        onChange={(event, newValue) => {
                            // ✅ Si borran la ubicación (X), limpiar existencia destino
                            if (!newValue) {
                                handleUbicacionSelectEntrada({ target: { value: "" } });
                                setExistenciaProductoDestino(""); // o 0 según lo uses
                                setInputValueUbicacion("");
                                return;
                            }

                            // ✅ Si seleccionan una ubicación normal
                            handleUbicacionSelectEntrada({ target: { value: newValue.id } });

                            // limpiar input del buscador
                            setInputValueUbicacion('');
                        }}
                        inputValue={inputValueUbicacion}
                        onInputChange={(event, newInputValue) => setInputValueUbicacion(newInputValue)}
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
                                {`${option.descripcion} : ${option.cantidad ?? 0}`}
                            </li>
                        )}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Ubicación de entrada"
                                variant="standard" // mismo estilo que tu Select
                                size="small"       // mismo tamaño
                                sx={{
                                    backgroundColor: ubicacionEntradaHabilitada ? 'white' : '#f0f0f0',
                                    mr: 1
                                }}
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
                        sx={{ width: "180px" }}
                    />
                    <label className='label-existencias-origen'>Existencias Origen:</label>
                    <TextField sx={{ width: "80px" }} value={existenciaProducto} disabled />
                    <label>Cantidad:</label>
                    <TextField
                        sx={{ width: "80px" }}
                        disabled={!habilitarCantidad}
                        value={inputValue}
                        type='text'
                        ref={cantidadRef}
                        style={{ backgroundColor: habilitarCantidad ? 'white' : '#f0f0f0' }}
                        onChange={(e) => {
                            const value = e.target.value;
                            // Expresión regular para permitir solo números y evitar caracteres especiales
                            const regex = /^[1-9]\d*$/;
                            if (value === '' || regex.test(value)) {
                                setInputValue(value);
                            }
                        }} />
                </div>
                <div className='form-row'>
                    <label>Comentario:</label>
                    <TextField
                        placeholder='Ingrese un comentario a la linea'
                        value={selectedComment}
                        disabled={!habilitarComentario}
                        onChange={(e) => setSelectedComment(e.target.value)}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position='end'>
                                    <CheckCircleIcon
                                        style={{
                                            cursor: habilitarComentario ? 'pointer' : 'not-allowed',  // Cambia el cursor
                                            color: habilitarComentario ? 'green' : 'grey',  // Cambia el color del ícono cuando está deshabilitado 
                                        }}
                                        onClick={habilitarComentario
                                            ? async () => {
                                                await handleUpdateLinea({
                                                    ...selectedRow, // Pasamos toda la fila seleccionada
                                                    comentario: selectedComment  // Actualiza el comentario
                                                });
                                                setSelectedComment('');
                                            } : null}  // Desactiva onClick si está deshabilitado
                                    />
                                </InputAdornment>
                            ),
                        }}
                        InputLabelProps={{
                            style: {
                                transform: 'translate(10px, 8px)',  // Ajusta la posición del label
                            },
                        }}
                        inputProps={{
                            style: {
                                backgroundColor: habilitarComentario ? 'white' : '#f0f0f0',
                                color: habilitarComentario ? 'black' : 'gray',
                            },
                        }}
                    />
                    <label className='label-existencias-destino' sx={{ ml: 5 }}>Existencias Destino:</label>
                    <TextField sx={{ width: "80px" }} value={existenciaProductoDestino} disabled />
                    <Button
                        variant='contained'
                        endIcon={<SendIcon />}
                        onClick={handleGenerarOrder}
                        sx={{ fontSize: '0.8rem', marginTop: 'auto', marginLeft: 'auto', borderRadius: '8px' }}
                        disabled={isButtonDisabled} // Deshabilita el botón según la condición
                    >Agregar Fila</Button>
                </div>
            </div>
            <div>
                <div className='DataG' style={{ height: 500, width: 'auto' }}>
                    <DataGrid style={{ fontFamily: "Montserrat", fontWeight: "bold" }}
                        rows={rows}
                        columns={columns}
                        pageSize={5}
                        disableColumnResize={false}
                        onRowClick={handleRowSelectionComment}
                        onProcessRowUpdateError={handleProcessRowUpdateError} // Aquí añadimos el manejador global
                        processRowUpdate={processRowUpdate}
                        showCellVerticalBorder
                        showColumnVerticalBorder
                        getRowId={(row) => row.id}
                        experimentalFeatures={{ newEditingApi: true }}
                        columnVisibilityModel={{
                            id: false,
                            producto_id: false,
                            localidad_salida_id: false,
                            localidad_entrada_id: false,
                        }}
                        isCellEditable={isCellEditable}
                        components={{
                            Toolbar: GridToolbar,
                        }}
                    />
                </div>
                <Modal
                    open={openComment}
                    onClose={handleClose}
                    aria-labelledby='modal-title'
                    aria-describedby='modal-description'
                    aria-hidden='false'
                    disableEnforceFocus
                >
                    <Box sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: 400,
                        bgcolor: 'white',
                        border: '2px solid #000',
                        boxShadow: 24,
                        p: 4
                    }}
                    >
                        <TextField
                            fullWidth
                            id="comment-input" // Asegura el foco
                            label="Comentario"
                            value={selectedComment}
                            onChange={(e) => setSelectedComment(e.target.value)} // Actualiza el comentario en el estado
                        />
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={async () => {
                                await handleUpdateLinea({
                                    ...selectedRow, // Pasamos toda la fila seleccionada
                                    comentario: selectedComment  // Actualiza el comentario
                                });
                                handleClose();  // Cierra la modal después de actualizar
                            }}
                        >
                            Actualizar Comentario
                        </Button>
                        <Button variant="outlined" onClick={handleClose} sx={{ marginLeft: '81px' }}>
                            Cerrar
                        </Button>
                    </Box>
                </Modal>
                <FetchOrders
                    selectedOrder={handleOrderSelection}
                    openModal={openModal}
                    setOpenModal={setOpenModal}
                />
            </div>
        </div>
    );
};

export default TableOrdenes;