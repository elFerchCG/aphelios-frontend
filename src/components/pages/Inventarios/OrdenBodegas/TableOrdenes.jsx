import { DataGrid, GridActionsCellItem, GridDeleteIcon } from '@mui/x-data-grid';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Button, Modal, Tooltip } from '@mui/material';
import '../../../../estilos/barraAcciones.css'; // Importar el archivo CSS
import confirmOrden from '../../../../images/confirm.png'
import processOrden from '../../../../images/process.png'
import revertir from '../../../../images/revertir.png'
import searchOrden from '../../../../images/search.png'
import addOrder from '../../../../images/addOrder.png'
import Swal from 'sweetalert2';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RateReviewIcon from '@mui/icons-material/RateReview';
import FetchOrders from './FetchOrders'
import SendIcon from '@mui/icons-material/Send';
import { useRef } from 'react';

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

// // Definir roles y acciones permitidas
// const rolesConfig = {
//     superUser: {
//         bodegasSalida: ['*'], // '*' indica todas las bodegas
//         bodegasEntrada: ['*'],
//         traspasos: ['*']
//     },
//     administrador: {
//         bodegasSalida: ['*'],
//         bodegasEntrada: ['*'],
//         traspasos: ['*']
//     },
//     jefeAlmacen: {
//         bodegasSalida: ['Almacén Principal', 'Super Market'],
//         bodegasEntrada: ['Recepción', 'Almacén Principal'],
//         traspasos: ['salida', 'entrada', 'transferencia']
//     },
//     empleadoAlmacen: {
//         bodegasSalida: ['Almacén Principal', 'Super Market'],
//         bodegasEntrada: ['Recepción', 'Almacén Principal'],
//         traspasos: ['transferencia']
//     }
// };


const TableOrdenes = () => {
    const [selectedOrderId, setSelectedOrderId] = useState(null)
    const [bodegaSalida, setBodegaSalida] = useState([]);
    const [bodegaEntrada, setBodegaEntrada] = useState([]);
    const [traspasos, setTraspasos] = useState([]);
    const [selectedBodegaSalida, setSelectedBodegaSalida] = useState('');
    const [selectedBodegaEntrada, setSelectedBodegaEntrada] = useState('');
    const [selectedTraspasoId, setSelectedTraspasoId] = useState('');
    const [inputValue, setInputValue] = useState('');
    const [rows, setRows] = useState([]);
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
    const [habilitarBuscador, setHabilitarBuscador] = useState(false);
    const [habilitarCantidad, setHabilitarCantidad] = useState(false);
    const [descripcion, setDescripcion] = useState('');
    const [id, setId] = useState('');
    const [estatus, setEstatus] = useState('');
    const [enableConfirm, setEnableConfirm] = useState(false);
    const [enableProcess, setEnableProcess] = useState(false);
    const [enableRevertir, setEnableRevertir] = useState(false);
    const [categoriaTemp, setCategoriaTemp] = useState('');
    const [comment, setComment] = useState('');
    const [habilitarComentario, setHabilitarComentario] = useState(false);
    const [openComment, setOpenComment] = useState(false);
    const [selectedComment, setSelectedComment] = useState('');
    const [selectedRow, setSelectedRow] = useState(null);
    const [openModal, setOpenModal] = useState(false);
    const [idTraspaso, setIdTraspaso] = useState('');
    const [rolIdTemp, setRolIdTemp] = useState('');

    const bodegaSalidaRef = useRef(null);
    const bodegaEntradaRef = useRef(null);
    const descripcionRef = useRef(null);
    const ubicacionSalidaRef = useRef(null);
    const ubicacionEntradaRef = useRef(null);
    const cantidadRef = useRef(null);

    const [dateTime, setDateTime] = useState(getCurrentDateTime());

    useEffect(() => {
        const timer = setInterval(() => {
            setDateTime(getCurrentDateTime());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {

        const fetchBodegas = async () => {

            try {
                const response = await axios.get('http://localhost:3304/inventario/bodegas_y_localidades/nombres/bodegas', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                setBodegaSalida(response.data);
                setBodegaEntrada(response.data);
            } catch (error) {
                if (error.response && error.response.data && error.response.data.message) {
                    const { messageText } = error.response.data.message;
                    alert(`Error: ${messageText}`);
                } else {
                    alert('Ocurrio un error al mostrar las bodegas');
                }
            }
        };

        const fetchTipoTraspaso = async () => {
            try {
                const response = await axios.get('http://localhost:3304/inventario/tipoTransaccion', {
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
                    const { messageText } = error.response.data.message;
                    alert(`Error: ${messageText}`);
                } else {
                    alert('Ocurrio un error al mostrar los tipos de movimientos');
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
            setCategoriaTemp(tipoTraspasoSeleccionado.categoria);
            setIdTraspaso(tipoTraspasoSeleccionado.id);
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
        console.log("Este es el tipo de movimiento seleccionado:", categoriaTemp);
    }, [categoriaTemp])

    const fetchExistencias = async () => {
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
                const response = await axios.get(`http://localhost:3304/inventario/ordenBodegas_y_lineasBodegas/producto/${productoId}/bodegaSalida/${selectedBodegaSalida}/bodegaEntrada/${selectedBodegaEntrada}/transferencia`, {
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
                const response = await axios.get(`http://localhost:3304/inventario/ordenBodegas_y_lineasBodegas/producto/${productoId}/bodega/${bodegaSeleccionada}/tipo/${categoriaTemp}/localidades`, {
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
                } else if (categoriaTemp === 'entrada' && response.data.ok) {
                    setUbicacionEntrada(response.data.data.existencias);
                    setProductoTitle(response.data.data.producto.title);
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

    const handleSearch = () => {
        fetchExistencias();
        setComment('');
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
    };

    const processRowUpdate = (updatedRow) => {
        setRows((prevRows) =>
            prevRows.map((row) => (row.id === updatedRow.id ? updatedRow : row))
        );
        return updatedRow;
    };

    const parseOrNull = (value) => {
        const parsedValue = parseInt(value);
        return isNaN(parsedValue) ? null : parsedValue;
    };

    const handleAddRow = (newRows = []) => {
        setRows(newRows); // Reemplaza las filas con las nuevas
        console.log("Nuevas filas a añadir:", newRows);
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
                cantidad: inputValue,
                producto_id: productoId, // ID del producto seleccionado,
                producto_title: productoTitle,
                existencias_origen: existenciaProducto,
                existencias_destino: existenciaProductoDestino,
                localidad_entrada: selectedUbicacionEntradaDescripcion,
                localidad_salida: selectedUbicacionSalidaDescripcion,

                comentario: comment
            };

            setRows((prevRows) => [...prevRows, newRow]);

            setProductoId('');
            setSelectedUbicacionSalida('');
            setSelectedUbicacionEntrada('');
            setExistenciaProducto('');
            setExistenciaProductoDestino('');
            setInputValue('');
            setComment('');
        }

        if (estatus === 'abierto') {
            const lineasData = {
                lineas: [{
                    producto_id: productoId,
                    cantidad: parseInt(inputValue),
                    comentario: comment,
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

                    const response = await axios.post(`http://localhost:3304/inventario/ordenBodegas_y_lineasBodegas/orden/${ordenId}/lineas`, lineasData, {
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
            const ordenId = id; // Cambia esto por el ID de la orden real
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
                        comentario: comment,
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
                console.log("movimiento generar orden:", idTraspaso);
                const response = await axios.post(`http://localhost:3304/inventario/ordenBodegas_y_lineasBodegas/orden/${idTraspaso}`, data, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (response.data.ok) {
                    console.log("este es el response al generar orden:", response);
                    setId(response.data.id);
                    setEstatus(response.data.estatus);

                    // Aquí guarda el rol_id de la bodega en rolIdTemp
                    // setRolIdTemp(response.data.rol_id || selectedBodegaSalida); // O como estés obteniendo el rol_id

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
    };

    const handleConfirmarOrden = async () => {
        const dateTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
        const data = {
            fecha_confirmada: dateTime,
        };

        try {
            console.log("datos", data);
            const response = await axios.post(`http://localhost:3304/inventario/ordenBodegas_y_lineasBodegas/confirmar/${id}`, data, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.data.ok) {
                setId(response.data.id);
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
                const { messageText } = error.response.data.message;
                alert(`Error: ${messageText}`);
            } else {
                alert('Ocurrio un error al confirmar la orden');
            }
        }
    }

    const handleRevertirOrden = async () => {
        try {
            const response = await axios.put(
                `http://localhost:3304/inventario/ordenBodegas_y_lineasBodegas/orden/${id}/revertir`,
                {}, // Este es el cuerpo de la solicitud (si no envías datos, puedes pasar un objeto vacío)
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            console.log("Esto se está obteniendo del response de revertir orden:", response);
            if (response.data.ok) {
                setId(response.data.id);
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
                const { messageText } = error.response.data.message;
                alert(`Error: ${messageText}`);
            } else {
                alert('Ocurrió un error al revertir la orden');
            }
        }
    }


    const handleProcesarOrden = async () => {
        const dateTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
        const data = {
            fecha_procesada: dateTime,
            usuario: 'luis.castorena'
        };

        try {
            const response = await axios.post(`http://localhost:3304/inventario/ordenBodegas_y_lineasBodegas/procesar/${id}`, data, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.data.ok) {
                setId(response.data.id);
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
                const { messageText } = error.response.data.message;
                alert(`Error: ${messageText}`);
            } else {
                alert('Ocurrio un error al verificar el producto o las existencias');
            }
        }
    }

    const deleteLine = (id) => (e) => {
        e.preventDefault();

        Swal.fire({
            title: '¿Estás seguro?',
            text: '¡No podrás revertir esto!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminarlo'
        }).then((result) => {
            if (result.isConfirmed) {
                axios.delete(`http://localhost:3304/inventario/ordenBodegas_y_lineasBodegas/lineas/${id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }).then(response => {
                    Swal.fire({
                        title: '¡Eliminado!',
                        text: 'Tu linea ha sido eliminada.',
                        icon: 'success'
                    });
                    setRows((prevRows) => prevRows.filter((row) => row.id !== id));
                })
                    .catch(error => {
                        Swal.fire({
                            icon: 'error',
                            title: 'Oops...',
                            text: 'Hubo un error al eliminar la linea.'
                        });
                        console.error('Error al eliminar la linea:', error);
                    });
            }
        });

    };

    useEffect(() => {
        if (productoId === '') {
            setSelectedUbicacionSalida('');
            setSelectedUbicacionEntrada('');
            setUbicacionSalidaHabilitada(false);
            setUbicacionEntradaHabilitada(false);
            setHabilitarCantidad(false);
            setHabilitarComentario(false);
            setExistenciaProducto('');
            setExistenciaProductoDestino('');
            setInputValue('');
            setComment('');
        } else {
            console.log("Este es el valor actual del producto buscado:", productoId);
        }
    }, [productoId])

    const handleOrderNew = () => {
        setRows([]);
        setHabilitarTraspaso(true);
        setBodegaSalidaHabilitada(false);
        setBodegaEntradaHabilitada(false);
        setHabilitarBuscador(false);
        setHabilitarComentario(false);
        setUbicacionSalidaHabilitada(false);
        setUbicacionEntradaHabilitada(false);
        setHabilitarCantidad(false);
        setDescripcion('');
        setSelectedTraspasoId('');
        setSelectedBodegaSalida('');
        setSelectedBodegaEntrada('');
        setProductoId('');
        setSelectedUbicacionSalida('');
        setSelectedUbicacionEntrada('');
        setExistenciaProducto('');
        setExistenciaProductoDestino('');
        setInputValue('');
        setComment('');
        setEstatus('');
        setId('');
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

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === 'Tab') {
            handleSearch();
        }
    }

    const handleBlur = () => {
        handleSearch();
    };

    useEffect(() => {
        if (estatus === 'abierto') {
            if (user.rol_id === rolIdTemp) {
                setEnableConfirm(true);
                setHabilitarBuscador(true); // Habilita el buscador si los roles coinciden
            } else {
                setEnableConfirm(false);
                setHabilitarBuscador(false); // Inhabilita el buscador si los roles no coinciden
            }
            setHabilitarTraspaso(false);
            setEnableProcess(false);
            setEnableRevertir(false);
            setHabilitarTraspaso(false);
            setBodegaSalidaHabilitada(false);
            setBodegaEntradaHabilitada(false);
            setHabilitarComentario(false);
            setUbicacionSalidaHabilitada(false);
            setUbicacionEntradaHabilitada(false);
            setHabilitarCantidad(false);
        } else if (estatus === 'confirmado') {
            setHabilitarTraspaso(false);
            setEnableRevertir(true);
            setEnableConfirm(false);
            setEnableProcess(user.rol_id === rolIdTemp);
            setHabilitarBuscador(false);
            setUbicacionSalidaHabilitada(false);
            setUbicacionEntradaHabilitada(false);
            setHabilitarCantidad(false);
            setHabilitarComentario(false);
            setBodegaSalidaHabilitada(false);
            setBodegaEntradaHabilitada(false);
        } else if (estatus === 'procesado') {
            setEnableConfirm(false);
            setHabilitarTraspaso(false);
            setEnableProcess(false);
            setEnableRevertir(false);
            setHabilitarBuscador(false);
            setUbicacionSalidaHabilitada(false);
            setUbicacionEntradaHabilitada(false);
            setHabilitarCantidad(false);
            setHabilitarComentario(false);
            setBodegaSalidaHabilitada(false);
            setBodegaEntradaHabilitada(false);
        } else if (!estatus) {
            setEnableConfirm(false);
            setEnableRevertir(false);
            setEnableProcess(false);
        }
    }, [estatus, user.rol_id, rolIdTemp]);

    const handleUpdateLinea = (id) => async (e) => {
        e.preventDefault();

        const rowToUpdate = rows.find((row) => row.id === id);
        if (!rowToUpdate) {
            console.error('No se encontró la fila a actualizar.');
            return;
        }

        Swal.fire({
            title: '¿Estás seguro de actualizar la línea?',
            text: '¡No podrás revertir esto!',
            icon: 'warning',
            showDenyButton: true,
            confirmButtonText: "Guardar",
            denyButtonText: `Cancelar`
        }).then((result) => {
            if (result.isConfirmed) {
                console.log("Estos campos estoy mandando al actualizar linea", rowToUpdate);
                const updatedFields = {
                    cantidad: rowToUpdate.cantidad
                };
                if (comment !== rowToUpdate.comentario) {
                    updatedFields.comentario = comment;
                }
                axios.put(`http://localhost:3304/inventario/ordenBodegas_y_lineasBodegas/lineaOrden/${id}`, {
                    cantidad: rowToUpdate.cantidad,
                    comentario: comment,
                }, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                })
                    .then(response => {
                        Swal.fire({
                            title: '¡Actualizado!',
                            text: 'Tu linea ha sido actualizada.',
                            icon: 'success'
                        });
                        processRowUpdate(response.data);
                    })
                    .catch(error => {
                        Swal.fire({
                            icon: 'error',
                            title: 'Oops...',
                            text: 'Hubo un error al actualizar la linea.'
                        });
                        console.error('Error al actualizar la linea:', error);
                    });
            }
        });
    }

    const handleOpenComment = (comentario) => {
        setSelectedComment(comentario || 'Sin comentario');
        setOpenComment(true);
    };

    const handleClose = () => setOpenComment(false);

    const isCellEditable = () => {
        if (estatus === 'abierto') {
            return user.rol_id === rolIdTemp;
        }
        // La celda no es editable si el estatus es 'confirmado' o 'procesado'
        return estatus !== 'confirmado' && estatus !== 'procesado';
    };

    const handleRowClick = (params) => {
        setSelectedRow(params.row);  // Almacena toda la fila seleccionada en el estado
        setComment(params.row.comentario || '');  // Obtiene el comentario de la fila o establece un valor por defecto
        setHabilitarComentario(true);
    };

    const handleOrderSelection = async (orderId) => {
        setSelectedOrderId(orderId); // Actualiza el ID de la orden seleccionada
        await fetchOrderSelected(orderId); // Llama a los métodos con los endpoints utilizando el ID de la orden
    };

    const fetchOrderSelected = async (orderId) => {
        try {
            const response = await axios.get(`http://localhost:3304/inventario/ordenBodegas_y_lineasBodegas/orden/${orderId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            let categoriaTemp = '';
            switch (response.data.data.orden.tipo_transaccion_id) {
                case 1:
                    categoriaTemp = 'entrada';
                    break;
                case 2:
                    categoriaTemp = 'salida';
                    break;
                case 3:
                    categoriaTemp = 'transferencia';
                    break;
                case 4:
                    categoriaTemp = 'conteo ciclico';
                default:
                    categoriaTemp = 'error'; // O cualquier valor por defecto 
            }
            setId(response.data.data.orden.id);
            setEstatus(response.data.data.orden.estatus);
            setSelectedBodegaSalida(response.data.data.orden.bodega_salida_id);
            setSelectedBodegaEntrada(response.data.data.orden.bodega_entrada_id);
            setRolIdTemp(response.data.data.rol_id.rol_id);
            setDescripcion(response.data.data.orden.descripcion);
            setSelectedTraspasoId(response.data.data.orden.tipo_transaccion_id);
            setCategoriaTemp(categoriaTemp);

            setHabilitarBuscador(user.rol_id === response.data.data.rol_id.rol_id && response.data.data.orden.estatus === 'abierto');
            setHabilitarComentario(user.rol_id === response.data.data.rol_id.rol_id && response.data.data.orden.estatus === 'abierto');

            const dataGridRows = response.data.data.lineas.map((linea) => ({
                id: linea.id,
                producto_id: linea.producto_id,
                cantidad: linea.cantidad,
                comentario: linea.comentario,
                localidad_salida: linea.localidad_salida_descripcion,
                localidad_entrada: linea.localidad_entrada_descripcion,
                producto_title: linea.producto_title,
                existencias_origen: linea.existencias_origen,
                existencias_destino: linea.existencias_destino
            }));
            handleAddRow(dataGridRows);
        } catch (error) {
            if (error.response && error.response.data && error.response.data.message) {
                const { messageText } = error.response.data.message;
                alert(`Error: ${messageText}`);
            } else {
                alert('Ocurrio un error al verificar el producto o las existencias');
            }
        }
    };

    const columns = [
        { field: 'id', headerName: 'ID', type: 'number', hide: true },
        { field: 'cantidad', headerName: 'Cantidad', editable: true, type: 'number', width: 100, cellClassName: 'celdaEditable' },
        { field: 'producto_id', headerName: 'MLM', width: 150 },
        { field: 'localidad_salida', headerName: 'Ubicación Origen', width: 150 },
        { field: 'existencias_origen', headerName: 'Existencia Origen', type: 'number', width: 150 },
        { field: 'localidad_entrada', headerName: 'Ubicación Destino', width: 150 },
        { field: 'existencias_destino', headerName: 'Existencia Destino', width: 150 },
        { field: 'producto_title', headerName: 'Descripción', width: 540 },
        {
            field: 'actions',
            headerName: 'Acciones',
            type: 'actions',
            width: 150,
            getActions: (params) => {

                if (estatus === 'confirmado' || estatus === 'procesado') {
                    return [];
                } else if (user.rol_id !== rolIdTemp && estatus === 'abierto') {
                    return [];
                }

                return [
                    // Mostrar solo si hay un comentario
                    params.row.comentario ? (
                        <Tooltip title='Ver comentario' key={`comment-${params.row.id}`}>
                            <GridActionsCellItem
                                icon={<RateReviewIcon />}
                                sx={{ color: 'blue' }}
                                onClick={() => handleOpenComment(params.row.comentario)}
                            />
                        </Tooltip>
                    ) : null,
                    <Tooltip title='Actualizar línea'>
                        <GridActionsCellItem
                            icon={<CheckCircleIcon />}
                            sx={{ color: 'green' }}
                            onClick={handleUpdateLinea(params.id)}
                        />
                    </Tooltip>,
                    <Tooltip title='Borrar línea'>
                        <GridActionsCellItem
                            icon={<GridDeleteIcon />}
                            sx={{ color: 'red' }}
                            onClick={deleteLine(params.id)} // Pasar params.id a la función deleteLine
                            label="Delete"
                        />
                    </Tooltip>
                ].filter(Boolean) // Filtrar valores nulos}
            }
        },
    ];

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
                </div>
                <div className="right-actions">
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
            <div className='container'>
                <label className='item1'>Orden:</label>
                <input className='item2' value={id} readOnly></input>
                <label className='status'>Estatus:</label>
                <input className='statusValue' value={estatus} readOnly></input>
                <label className='descripcion'>Descripción:</label>
                <input className='input-descr'
                    disabled={!habilitarTraspaso}
                    value={descripcion}
                    ref={descripcionRef}
                    onChange={(e) => setDescripcion(e.target.value)}></input>
                <label className='item5' >Tipo de movimiento:</label>
                <select
                    className='item6'
                    value={selectedTraspasoId}
                    onChange={handleSelectedTraspasoChange}
                    disabled={!habilitarTraspaso}
                >
                    <option value="">Seleccione...</option>
                    {traspasos.map((traspaso) => (
                        <option key={traspaso.id} value={traspaso.id}>
                            {`${traspaso.descripcion} : ${traspaso.categoria}`}
                        </option>
                    ))}
                </select>
                <label className='labelB'>Bodega de salida:</label>
                <select
                    className='selectB'
                    value={selectedBodegaSalida}
                    onChange={handleSelectBodegaSalida}
                    disabled={!bodegaSalidaHabilitada}
                    ref={bodegaSalidaRef}
                >
                    <option value="">Seleccione...</option>
                    {bodegaSalida.map((bod) => (
                        <option key={bod.id} value={bod.id}>
                            {bod.Nombre}
                        </option>
                    ))}
                </select>
                <label className='item3'>Bodega de entrada:</label>
                <select className='item4'
                    value={selectedBodegaEntrada}
                    disabled={!bodegaEntradaHabilitada}
                    onChange={handleSelectBodegaEntrada}
                    ref={bodegaEntradaRef}
                >
                    <option value="">Seleccione...</option>
                    {bodegaEntrada.map((bodega) => (
                        <option key={bodega.id} value={bodega.id}>
                            {bodega.Nombre}
                        </option>
                    ))}
                </select>

                <label className='item11'>Producto:</label>
                <input
                    className='item12'
                    type='text'
                    onKeyDown={handleKeyDown}
                    onBlur={handleBlur}
                    disabled={!habilitarBuscador}
                    value={productoId}
                    onChange={(e) => setProductoId(e.target.value)}
                    placeholder='Ingrese el MLM'
                />
                <label className='item9'>Ubicación salida:</label>
                <select
                    className='item10'
                    disabled={!ubicacionSalidaHabilitada}
                    value={selectedUbicacionSalida}
                    onChange={handleUbicacionSelectSalida}
                    ref={ubicacionSalidaRef}
                >
                    <option value="">Seleccione...</option>
                    {ubicaciones
                        .sort((a, b) => b.cantidad - a.cantidad)
                        .map((ubic, index) => (
                            <option key={index} value={ubic.id}>
                                {`${ubic.descripcion} : ${ubic.cantidad}`}
                            </option>
                        ))}
                </select>
                <label className='item7'>Ubicación entrada:</label>
                <select className='item8'
                    disabled={!ubicacionEntradaHabilitada}
                    value={selectedUbicacionEntrada}
                    onChange={handleUbicacionSelectEntrada}
                    ref={ubicacionEntradaRef}
                >
                    <option value="">Seleccione...</option>
                    {ubicacionEntrada
                        .sort((a, b) => b.cantidad - a.cantidad)
                        .map((ubicacion, index) => (
                            <option key={index} value={ubicacion.id}>
                                {`${ubicacion.descripcion} : ${ubicacion.cantidad}`}
                            </option>
                        ))}
                </select>
                <label className='item14'>Existencias Origen:</label>
                <input className='item15' value={existenciaProducto} readOnly></input>
                <label className='exis-label'>Existencias Destino:</label>
                <input className='exis-destino' value={existenciaProductoDestino} readOnly></input>
                <label className='item16'>Cantidad:</label>
                <input className='item17'
                    disabled={!habilitarCantidad}
                    value={inputValue}
                    ref={cantidadRef}
                    onChange={(e) => setInputValue(e.target.value)}></input>
                <Button className='item13'
                    variant='contained'
                    endIcon={<SendIcon />}
                    onClick={handleGenerarOrder}
                    sx={{ fontSize: '0.8rem', marginTop: 'auto', marginLeft: 'auto', borderRadius: '8px' }}
                >Agregar Fila</Button>
                <label className='coment'>Comentario:</label>
                <input className='comentInput' placeholder='Ingrese un comentario a la linea' value={comment} disabled={!habilitarComentario} onChange={(e) => setComment(e.target.value)}></input>
            </div>
            <div >
                <div className='DataG' style={{ height: 500, width: 'auto' }}>
                    <DataGrid style={{ fontFamily: "Montserrat", fontWeight: "bold" }}
                        rows={rows}
                        columns={columns}
                        pageSize={5}
                        processRowUpdate={processRowUpdate}
                        showCellVerticalBorder
                        showColumnVerticalBorder
                        getRowId={(row) => row.id}
                        onRowClick={handleRowClick}
                        experimentalFeatures={{ newEditingApi: true }}
                        columnVisibilityModel={{
                            id: false,
                        }}
                        isCellEditable={isCellEditable}
                    />
                    <Modal open={openComment} onClose={handleClose}>
                        <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 400, bgcolor: 'background.paper', border: '2px solid #000', boxShadow: 24, p: 4 }}>
                            <p>{selectedComment}</p>
                            <Button variant="contained" onClick={handleClose}>Cerrar</Button>
                        </Box>
                    </Modal>
                </div>
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