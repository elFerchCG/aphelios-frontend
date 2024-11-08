import React, { useEffect, useState } from 'react'
import FetchOrdenesCompra from './FetchOrdenesCompra';
import { DataGrid, GridActionsCellItem, GridDeleteIcon, GridEditInputCell } from '@mui/x-data-grid';
import axios from 'axios';
import { Box, Button, Modal, TextField, Tooltip } from '@mui/material';
import '../../../../estilos/barraAcciones.css'; // Importar el archivo CSS
import confirmOrden from '../../../../images/confirm.png'
import processOrden from '../../../../images/process.png'
import revertir from '../../../../images/revertir.png'
import addOrder from '../../../../images/addOrder.png'
import searchOrden from '../../../../images/search.png'
import RateReviewIcon from '@mui/icons-material/RateReview';
import SendIcon from '@mui/icons-material/Send';
import cancelOrder from '../../../../images/cancel.png'
import { useRef } from 'react';
import Swal from 'sweetalert2';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';


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

const formatFecha = (fecha) => {
    const date = new Date(fecha);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Los meses empiezan en 0
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const formatFechaGet = (fechaBack) => {
    const date = new Date(fechaBack); // Crear objeto Date usando la fecha recibida
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // Los meses empiezan en 0
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`; // Formato YYYY-MM-DD
};


const TableOrdenesCompra = () => {
    const [bodegaTemp, setBodegaTemp] = useState('');
    const [rows, setRows] = useState([]);
    const [habilitarComentario, setHabilitarComentario] = useState(false);
    const [bodegaEntradaHabilitada, setBodegaEntradaHabilitada] = useState(false);
    const [idMovimiento, setIdMovimiento] = useState('');
    const [habilitarCantidad, setHabilitarCantidad] = useState(false);
    const [selectedBodegaEntrada, setSelectedBodegaEntrada] = useState('');
    const [selectedUbicacionEntrada, setSelectedUbicacionEntrada] = useState('');
    const [ubicacionEntradaHabilitada, setUbicacionEntradaHabilitada] = useState(false);
    const [bodegasEntrada, setBodegasEntrada] = useState([]);
    const [selectedMovimiento, setSelectedMovimiento] = useState('');
    const [ubicacionLineas, setUbicacionLineas] = useState('');
    const [movimientos, setMovimientos] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [estatus, setEstatus] = useState('');
    const [idOrder, setIdOrder] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [comment, setComment] = useState('');
    const [selectedRow, setSelectedRow] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
    const [producto, setProducto] = useState('');
    const [ubicacionesEntrada, setUbicacionesEntrada] = useState([]);
    const [openModal, setOpenModal] = useState(false);
    const [rolIdTempEntrada, setRolIdTempEntrada] = useState('');
    const [categoriaTemp, setCategoriaTemp] = useState('');
    const [habilitarMovimiento, setHabilitarMovimiento] = useState(false);
    const [productoTitle, setProductoTitle] = useState('');
    const [isButtonDisabled, setIsButtonDisabled] = useState(false);
    const [enableConfirm, setEnableConfirm] = useState(false);
    const [enableProcess, setEnableProcess] = useState(false);
    const [enableRevertir, setEnableRevertir] = useState(false);
    const [enableCancel, setEnableCancel] = useState(false);
    const [habilitarBuscador, setHabilitarBuscador] = useState(false);
    const [precio, setPrecio] = useState('');
    const [rolMovimiento, setRolMovimiento] = useState('');
    const [selectedFechaCompromiso, setSelectedFechaCompromiso] = useState(null);
    const [fechaCompromisoHabilitada, setFechaCompromisoHabilitada] = useState(false);
    const [habilitarPrecio, setHabilitarPrecio] = useState(false);
    const [selectedComment, setSelectedComment] = useState('');
    const [openComment, setOpenComment] = useState(false);

    const bodegaEntradaRef = useRef(null);
    const ubicacionEntradaRef = useRef(null);
    const descripcionRef = useRef(null);
    const cantidadRef = useRef(null);
    const fechaCompromisoRef = useRef(null);
    const precioRef = useRef(null);

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

    const today = new Date();
    const minDate = today;

    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + 90);

    useEffect(() => {
        const fetchBodegas = async () => {
            try {
                const response = await axios.get('http://localhost:3304/inventario/bodegas_y_localidades/nombres/bodegas', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                })
                setBodegasEntrada(response.data);
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
                const resultadosFiltrados = response.data.filter(item => item.rol_id === user.rol_id && item.categoria === 'entrada' && item.conteo === 1);

                if (resultadosFiltrados.length > 0) {
                    setMovimientos(resultadosFiltrados);
                } else {
                    console.log("Sin movimientos asignados");
                }
            } catch (error) {
                if (error.response && error.response.data && error.response.data.message) {
                    const { messageText } = error.response.data.message;
                    alert(`Error: ${messageText}`);
                } else {
                    alert('Ocurrio un error al mostrar los tipos de movimientos');
                }
            }
        }

        fetchBodegas();
        fetchTipoTraspaso();
    }, []);


    const fetchExistencias = async (bodegaTemp) => {
        // Verificar si las refs no son null antes de acceder a classList
        if (bodegaEntradaRef.current) {
            bodegaEntradaRef.current.classList.remove('error');
        }

        if (ubicacionEntradaRef.current) {
            ubicacionEntradaRef.current.classList.remove('error');
        }

        let isValid = true;

        try {
            console.log("Esta es la bodega id seleccionada:", bodegaTemp);
            const response = await axios.get(`http://localhost:3304/inventario/ordenBodegas_y_lineasBodegas/${bodegaTemp}/ubicaciones`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.data && Array.isArray(response.data) && response.data.length > 0) {
                setUbicacionesEntrada(response.data);
            } else {
                Swal.fire({
                    title: '!Producto no encontrado!',
                    text: 'No se encontraron existencias, verifique el producto',
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
        };
    };

    const processRowUpdate = async (updatedRow, oldRow) => {
        try {
            // Llamar a handleUpdateLinea para realizar la actualización en la base de datos
            await handleUpdateLinea(updatedRow);

            // Si todo sale bien, devolver la fila actualizada
            return updatedRow;
        } catch (error) {
            console.error("Error al actualizar la fila:", error);
            // Si hay un error, revertir la fila al estado original
            return oldRow;
        }
    };

    const parseOrNull = (value) => {
        const parsedValue = parseInt(value);
        return isNaN(parsedValue) ? null : parsedValue;
    };

    const handleGenerarOrder = async () => {
        const handleAddRow = (lineasIds = [], ubicacionEntradaDescripcionBackend = '') => {

            const selectedUbicacionEntradaDescripcion = ubicacionesEntrada.find(ubicacion => ubicacion.id === selectedUbicacionEntrada)?.descripcion || '';

            const newRow = {
                id: lineasIds[0] || (rows.length + 1), // Asigna un ID único
                cantidad_ordenada: inputValue,
                cantidad_recibida: 0,
                producto_id: producto, // ID del producto seleccionado,
                producto_title: productoTitle,
                ubicacion_entrada_descripcion: selectedUbicacionEntradaDescripcion || ubicacionEntradaDescripcionBackend,
                ubicacion_entrada_id: selectedUbicacionEntrada,
                back_order: inputValue - 0,
                fecha_recibo: null,
                fecha_back: formatFecha(selectedFechaCompromiso),
                precio: parseFloat(precio) || 0,
                precio_factura: parseFloat(precio) || 0,
                comentario: comment
            };

            setRows((prevRows) => [...prevRows, newRow]);

            setProducto('');
            setSelectedUbicacionEntrada('');
            setInputValue('');
            setComment('');
            setIsButtonDisabled(true);
        }

        if (estatus === 'abierto') {
            const lineasData = {
                lineas: [{
                    producto_id: producto,
                    cantidad_ordenada: parseInt(inputValue),
                    precio: parseFloat(precio) || 0,
                    fecha_recibo: null,
                    back_order: parseInt(inputValue),
                    fecha_back: null,
                    comentario: comment,
                    cantidad_recibida: 0,
                    precio_factura: parseFloat(precio) || 0,
                }]
            };

            const enviarLineas = async (ordenId) => {

                if (cantidadRef.current) {
                    cantidadRef.current.classList.remove('error');
                }

                let isValid = true;

                try {
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
                    const response = await axios.post(`http://localhost:3304/ordenesCompras/ordenDeCompra/${ordenId}/lineas`, lineasData, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    // Actualiza la ubicación con la descripción recibida del backend
                    const ubicacionEntradaDescripcionBackend = response.data.data.ubicacionEntradaDescripcion;

                    // Actualiza el estado de ubicacionLineas
                    setUbicacionLineas(ubicacionEntradaDescripcionBackend);
                    handleAddRow(response.data.data.lineasIds, ubicacionEntradaDescripcionBackend); // Pasar los IDs de las líneas al método de agregar filas

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
            //const dateTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
            const data = {
                descripcion: descripcion,
                tipo_transaccion_id: idMovimiento,
                bodega_entrada_id: parseOrNull(selectedBodegaEntrada),
                ubicacion_compra_id: parseOrNull(selectedUbicacionEntrada),
                fecha_compromiso: formatFecha(selectedFechaCompromiso),
                lineas: [
                    {
                        producto_id: producto,
                        cantidad_ordenada: parseInt(inputValue),
                        precio: precio,
                        fecha_recibo: null,
                        back_order: parseInt(inputValue),
                        fecha_back: formatFecha(selectedFechaCompromiso),
                        comentario: comment,
                        ubicacion_entrada_id: parseOrNull(selectedUbicacionEntrada),
                        cantidad_recibida: 0,
                        precio_factura: parseFloat(precio) || 0,
                    }
                ]
            };

            if (descripcionRef.current) {
                descripcionRef.current.classList.remove('error');
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
                const response = await axios.post(`http://localhost:3304/ordenesCompras/ordenDeCompra`, data, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (response.data) {
                    setRolIdTempEntrada(response.data.rolIdEntrada);
                    setIdOrder(response.data.idOrder);
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
    };

    const handleSearch = () => {
        setIsButtonDisabled(false);
        setComment('');
        setPrecio('');
        setHabilitarComentario(true);
        setHabilitarCantidad(true);
        setHabilitarPrecio(true);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === 'Tab') {
            handleSearch();
        }
    }

    const handleBlur = () => {
        handleSearch();
    };

    const handleOrderNew = () => {
        setRows([]);
        setHabilitarMovimiento(true);
        setBodegaEntradaHabilitada(false);
        setHabilitarBuscador(false);
        setHabilitarComentario(false);
        setUbicacionEntradaHabilitada(false);
        setHabilitarCantidad(false);
        setDescripcion('');
        setSelectedMovimiento('');
        setSelectedBodegaEntrada('');
        setProducto('');
        setSelectedUbicacionEntrada('');
        setInputValue('');
        setComment('');
        setEstatus('');
        setIdOrder('');
        setSelectedFechaCompromiso('');

        if (bodegaEntradaRef.current) {
            bodegaEntradaRef.current.classList.remove('error');
        }

        if (ubicacionEntradaRef.current) {
            ubicacionEntradaRef.current.classList.remove('error');
        }

        if (cantidadRef.current) {
            cantidadRef.current.classList.remove('error');
        }

        let isValid = true;
    };

    const handleSelectedTraspasoChange = (e) => {
        const traspasoId = parseInt(e.target.value);
        setSelectedMovimiento(traspasoId);
        setBodegaEntradaHabilitada(true);

        const tipoTraspasoSeleccionado = movimientos.find(movimiento => movimiento.id === traspasoId);
        if (tipoTraspasoSeleccionado) {
            setCategoriaTemp(tipoTraspasoSeleccionado.categoria);
            setIdMovimiento(tipoTraspasoSeleccionado.id);
        }

    };

    const handleSelectBodegaEntrada = (e) => {
        const bodegaId = parseInt(e.target.value, 10);
        setSelectedBodegaEntrada(bodegaId);

        const selectedBodegaEntradaTemp = bodegasEntrada.find(bodega => bodega.id === bodegaId);

        if (selectedBodegaEntradaTemp) {
            setBodegaTemp(selectedBodegaEntradaTemp.id);
            setUbicacionEntradaHabilitada(true);
            fetchExistencias(selectedBodegaEntradaTemp.id);  // Cambia aquí
        }

        if (bodegaEntradaRef.current) {
            bodegaEntradaRef.current.classList.remove('error');
        }
    };


    const handleUbicacionSelectEntrada = (e) => {
        const selectedIdEntrada = parseInt(e.target.value, 10);
        setSelectedUbicacionEntrada(selectedIdEntrada);
        setFechaCompromisoHabilitada(true);
    };

    // Manejador de cambio para capturar la fecha seleccionada sin desfases
    const handleFechaCompromiso = (date) => {
        setSelectedFechaCompromiso(date); // Almacena la fecha como cadena
        setHabilitarBuscador(true);
    };

    const isCellEditable = () => {
        if (estatus === 'confirmado') {
            return user.rol_id === rolMovimiento;
        }
        return estatus !== 'abierto' && estatus !== 'procesado' && estatus !== 'cancelada';
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
            console.log("Este es el orderId:", orderId);
            const response = await axios.get(`http://localhost:3304/ordenesCompras/ordenesCompra/${orderId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setProducto('');
            setSelectedUbicacionEntrada('');
            setInputValue('');
            setComment('');
            setSelectedBodegaEntrada('');
            setDescripcion('');
            setSelectedMovimiento('');
            setIdOrder(response.data.data.idOrder);
            setEstatus(response.data.data.estatus);
            setSelectedBodegaEntrada(response.data.data.bodega_entrada_id);
            setRolIdTempEntrada(response.data.data.rol_id_entrada);
            setDescripcion(response.data.data.descripcion);
            setSelectedMovimiento(response.data.data.tipo_transaccion_id);
            setCategoriaTemp(response.data.data.categoria);
            setRolMovimiento(response.data.data.rol_id_tipo_transaccion);

            setHabilitarBuscador(user.rol_id === response.data.data.rol_id_tipo_transaccion && response.data.data.estatus === 'abierto');
            setHabilitarComentario(user.rol_id === response.data.data.rol_id_tipo_transaccion && response.data.data.estatus === 'abierto');

            const dataGridRows = response.data.data.lineas.map((linea) => ({
                id: linea.id,
                producto_id: linea.producto_id,
                cantidad_ordenada: linea.cantidad_ordenada,
                comentario: linea.comentario,
                precio: linea.precio,
                fecha_recibo: null || '',
                ubicacion_entrada_descripcion: linea.ubicacion_entrada_descripcion,
                ubicacion_entrada_id: linea.ubicacion_entrada_id,
                back_order: linea.back_order,
                cantidad_recibida: linea.cantidad_recibida,
                precio_factura: parseFloat(linea.precio_factura) || 0,
                fecha_back: formatFechaGet(linea.fecha_back),
                producto_title: linea.producto_title,

            }));
            // Limpia las filas actuales y luego añade las nuevas filas
            setRows(dataGridRows);
        } catch (error) {
            if (error.response && error.response.data && error.response.data.message) {
                const { messageText } = error.response.data.message;
                alert(`Error: ${messageText}`);
            } else {
                alert('Ocurrio un error al verificar el producto o las existencias');
            }
        }
    };

    const handleConfirmarOrden = async () => {
        try {
            const response = await axios.post(`http://localhost:3304/ordenesCompras/ordenDeCompra/${idOrder}/confirmar`,
                {},
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
            if (response.data.data) {
                setIdOrder(response.data.data.id);
                setEstatus(response.data.data.status);
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

    const handleProcesarOrden = async () => {
        try {
            const response = await axios.post(`http://localhost:3304/ordenesCompras/ordenDeCompra/${idOrder}/procesar`,
                {},
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
            if (response.data) {
                setIdOrder(response.data.data.id);
                setEstatus(response.data.data.status);
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
                alert('Ocurrio un error al procesar la orden');
            }
        }
    }

    const handleCancelOrden = async () => {
        try {
            const response = await axios.put(`http://localhost:3304/ordenesCompras/orden/${idOrder}/cancelar`,
                {},
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
            if (response.data) {
                // setIdOrder(response.data.ordenId);
                // setEstatus(response.data.estatus);
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
                const { messageText } = error.response.data.message;
                alert(`Error: ${messageText}`);
            } else {
                alert('Ocurrió un error al revertir la orden');
            }
        }
    }

    const handleRevertirOrden = async () => {
        try {
            const response = await axios.put(
                `http://localhost:3304/ordenesCompras/orden/${idOrder}/revertirConfirmacion`,
                {}, // Este es el cuerpo de la solicitud (si no envías datos, puedes pasar un objeto vacío)
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            if (response.data) {
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
                const { messageText } = error.response.data.message;
                alert(`Error: ${messageText}`);
            } else {
                alert('Ocurrió un error al revertir la orden');
            }
        }
    }

    const handleUpdateLinea = async (updatedRow) => {
        const { id, cantidad_recibida, fecha_back } = updatedRow;

        try {
            const updatedFields = {
                cantidad_recibida: parseOrNull(cantidad_recibida),
                fecha_back: formatFechaGet(fecha_back),
            };

            const response = await axios.put(`http://localhost:3304/ordenesCompras/lineasOrden/${id}`, updatedFields, {
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
            } else {
                // Manejo de errores generales
                Swal.fire({
                    title: 'Error',
                    text: 'Ha ocurrido un error inesperado.',
                    icon: 'error',
                    timer: 5000,
                    showCloseButton: true,
                    allowEscapeKey: true
                });
            }
            console.error('Error al actualizar la línea:', error);
            throw error; // Lanzar el error para que pueda ser capturado por processRowUpdate
        }
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
            confirmButtonText: 'Sí, eliminarlo'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    console.log("Esta es la orden id del delete:", id);
                    // Eliminar la línea en el backend
                    await axios.delete(`http://localhost:3304/ordenesCompras/lineasOrden/${id}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    fetchOrderSelected(idOrder);

                    Swal.fire({
                        title: '¡Eliminado!',
                        text: 'Tu línea ha sido eliminada.',
                        icon: 'success'
                    });
                } catch (error) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Oops...',
                        text: 'Hubo un error al eliminar la línea.'
                    });
                    console.error('Error al eliminar la línea:', error);
                }
            }
        });
    };

    useEffect(() => {
        if (estatus === 'abierto') {
            setHabilitarMovimiento(false);
            setBodegaEntradaHabilitada(false);
            setEnableRevertir(false);
            setEnableProcess(false);
            setUbicacionEntradaHabilitada(false);
            setFechaCompromisoHabilitada(false);
            if (user?.rol_id === rolIdTempEntrada) {
                setEnableConfirm(true);
            } else {
                setEnableConfirm(false);
                setEnableProcess(false);
            }
            if (user?.rol_id === rolMovimiento) {
                setHabilitarBuscador(true);
            }
        }
        if (estatus === 'confirmado') {
            setHabilitarBuscador(false);
            setEnableConfirm(false);
            setHabilitarMovimiento(false);
            setBodegaEntradaHabilitada(false);
            if (user?.rol_id === rolIdTempEntrada) {
                setEnableProcess(true);
            }
            if (user?.rol_id === rolMovimiento) {
                setEnableCancel(true);
                setEnableRevertir(true);
            }
        }
        if (estatus === 'procesado') {
            setEnableCancel(false);
            setEnableRevertir(false);
            setEnableProcess(false);
            setHabilitarMovimiento(false);
            setBodegaEntradaHabilitada(false);
            setHabilitarComentario(false);
        }
        if (estatus === 'cancelada') {
            setHabilitarBuscador(false);
            setHabilitarMovimiento(false);
            setEnableCancel(false);
            setEnableConfirm(false);
            setEnableProcess(false);
            setEnableRevertir(false);
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

    }, [estatus, rolIdTempEntrada, rolMovimiento, user]);

    useEffect(() => {
        if (producto === '') {
            setPrecio('');
            setHabilitarCantidad(false);
            setHabilitarComentario(false);
            setHabilitarPrecio(false);
            setInputValue('');
            setComment('');
            setIsButtonDisabled(true);
        } else {
            console.log("Este es el valor actual del producto buscado:", producto);
        }
    }, [producto])

    const handleBlurComment = async () => {
        if (habilitarComentario) {
            // Actualiza la fila seleccionada con el nuevo comentario
            const updatedRow = { ...selectedRow, comentario: comment };
            await handleUpdateLinea(updatedRow);
        }
    };

    const handleRowClick = (params) => {
        setSelectedRow(params.row);  // Almacena toda la fila seleccionada en el estado
        setComment(params.row.comentario || '');  // Obtiene el comentario de la fila o establece un valor por defecto
        setHabilitarComentario(true);
    };

    const handleOpenComment = (comentario) => {
        setSelectedComment(comentario || 'Sin comentario');
        setOpenComment(true);
    };

    const handleClose = () => setOpenComment(false);

    const columns = [
        { field: 'id', headerName: 'ID', type: 'number', hide: true },
        { field: 'producto_id', headerName: 'Producto', type: 'text', flex: 2 },
        { field: 'producto_title', headerName: 'Descripción', flex: 3 },
        { field: 'precio', headerName: 'Precio', type: 'float', flex: 1, headerAlign: 'center' },
        { field: 'cantidad_ordenada', headerName: 'Cantidad', type: 'number', flex: 1, headerAlign: 'center' },
        { field: 'back_order', headerName: 'Back Order', type: 'number', flex: 1, headerAlign: 'center' },
        { field: 'fecha_recibo', headerName: 'Fecha Recibo', flex: 1 },
        { field: 'ubicacion_entrada_descripcion', headerName: 'Ubicacion', type: 'text', flex: 1, headerClassName: 'header-wrap', headerAlign: 'center' },
        { field: 'ubicacion_entrada_id', headerName: 'Ubicacion Entrada ID', type: 'number', flex: 1 },
        {
            field: 'cantidad_recibida', headerName: 'Cantidad\nRecibida', type: 'number', flex: 1, headerClassName: 'header-wrap', headerAlign: 'center', cellClassName: 'celdaEditable', editable: true,
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
            },
        },
        {
            field: 'precio_factura',
            headerName: 'Precio Factura',
            width: 150,
            cellClassName: 'celdaEditable',
            editable: true,
            renderCell: (params) => {
                const value = parseFloat(params.value);
                // Asegúrate de que si el valor es válido, se formatea a 4 decimales
                return (
                    <span>{!isNaN(value) ? value.toFixed(4) : ''}</span>
                );
            },
            renderEditCell: (params) => {
                const formatPrecio = (precio) => {
                    const value = parseFloat(precio);
                    return !isNaN(value) ? value.toFixed(4) : '';
                };

                return (
                    <TextField
                        type="text"
                        value={params.value ? formatPrecio(params.value) : ''}
                        onChange={(e) => {
                            const value = e.target.value;
                            if (/^\d+(\.\d{0,4})?$/.test(value)) {
                                params.api.setEditCellValue({ id: params.id, field: 'precio_factura', value });
                            }
                        }}
                        fullWidth
                    />
                );
            },
        },
        {
            field: 'fecha_back',
            headerName: 'Fecha Back',
            type: 'Date',
            editable: true,
            cellClassName: 'celdaEditable',
            flex: 1,
            renderEditCell: (params) => {
                return (
                    <TextField
                        type="date"
                        value={params.value ? formatFechaGet(params.value) : ''}
                        onChange={(e) => {
                            const selectedDate = e.target.value;  // YYYY-MM-DD
                            const updatedDate = new Date(`${selectedDate}T00:00:00.000Z`); // Forzar UTC
                            params.api.setEditCellValue({ id: params.id, field: 'fecha_back', value: updatedDate.toISOString() });
                        }}
                        fullWidth
                    />
                )
            }
        },
        {
            field: 'actions',
            headerName: 'Acciones',
            type: 'actions',
            flex: 1,
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
                                    onClick={() => handleOpenComment(params.row.comentario)}
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
                                    onClick={() => handleOpenComment(params.row.comentario)}
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
                                onClick={() => handleOpenComment(params.row.comentario)}
                            />
                        </Tooltip>
                    ) : null,
                    <Tooltip title='Borrar línea' key={`delete-${params.row.id}`}>
                        <GridActionsCellItem
                            icon={<GridDeleteIcon />}
                            sx={{ color: 'red' }}
                            onClick={deleteLine(params.id)} // Asegúrate de usar una función que acepte params.id
                            label="Delete"
                        />
                    </Tooltip>
                ].filter(Boolean);
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
                    {/* <div className="action-item" style={{ cursor: 'pointer' }} onClick={handleButtonClick}>
            <img src={importExcel} alt="Importar Excel" className="action-icon" />
            <span>Importar Excel</span>
            <input
                id="file-input"
                type="file"
                accept=".xlsx, .xls"
                style={{ display: 'none' }}
                onChange={handleImportExcel}
            />
        </div> */}
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
            <div className='container'>
                <label className='item1'>Orden:</label>
                <input className='item2'
                    value={idOrder}
                    readOnly
                ></input>
                <label className='status'>Estatus:</label>
                <input className='statusValue'
                    value={estatus}
                    readOnly
                ></input>
                <label className='item005'>Descripción:</label>
                <input className='item6'
                    disabled={!habilitarMovimiento}
                    value={descripcion}
                    ref={descripcionRef}
                    onChange={(e) => setDescripcion(e.target.value)}
                ></input>
                <label className='descripcion' >Tipo de movimiento:</label>
                <select
                    className='input-descr'
                    value={selectedMovimiento}
                    onChange={handleSelectedTraspasoChange}
                    disabled={!habilitarMovimiento}
                >
                    <option value="">Seleccione...</option>
                    {movimientos.map((movimiento) => (
                        <option key={movimiento.id} value={movimiento.id}>
                            {`${movimiento.descripcion} : ${movimiento.categoria}`}
                        </option>
                    ))}
                </select>
                <label className='item03'>Bodega de entrada:</label>
                <select className='item04'
                    value={selectedBodegaEntrada}
                    disabled={!bodegaEntradaHabilitada}
                    onChange={handleSelectBodegaEntrada}
                    ref={bodegaEntradaRef}
                >
                    <option value="">Seleccione...</option>
                    {bodegasEntrada.map((bodega) => (
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
                    value={producto}
                    onChange={(e) => setProducto(e.target.value)}
                    placeholder='Ingrese el MLM'
                />
                <label className='item07'>Ubicación compra:</label>
                <select className='item08'
                    disabled={!ubicacionEntradaHabilitada}
                    value={selectedUbicacionEntrada}
                    onChange={handleUbicacionSelectEntrada}
                    ref={ubicacionEntradaRef}
                >
                    <option value="">Seleccione...</option>
                    {ubicacionesEntrada
                        .map((ubicacion, index) => (
                            <option key={index} value={ubicacion.id}>
                                {`${ubicacion.descripcion}`}
                            </option>
                        ))}
                </select>
                <label className='fC'>Fecha Compromiso:</label>
                <DatePicker
                    className='fCCalendar'
                    selected={selectedFechaCompromiso}
                    onChange={handleFechaCompromiso}
                    disabled={!fechaCompromisoHabilitada}
                    dateFormat="yyyy-MM-dd"
                    minDate={minDate}
                    maxDate={maxDate}
                    placeholderText='YYYY-MM-DD'
                />
                <label className='item016'>Cantidad:</label>
                <input className='item017'
                    disabled={!habilitarCantidad}
                    value={inputValue}
                    ref={cantidadRef}
                    onChange={(e) => {
                        const value = e.target.value;
                        // Expresión regular para permitir solo números y evitar caracteres especiales
                        const regex = /^[1-9]\d*$/;
                        if (value === '' || regex.test(value)) {
                            setInputValue(value);
                        }
                    }}
                ></input>
                <label className='item0016'>Precio:</label>
                <input className='item001'
                    type='float'
                    disabled={!habilitarPrecio}
                    value={precio}
                    ref={precioRef}
                    onChange={(e) => setPrecio(e.target.value)}
                ></input>
                {/* <label className='fR'>Fecha Recibo</label>
                <input
                    className='fechaRecibo' 
                    type="date"
                    // value={endDate}
                    // onChange={(e) => setEndDate(e.target.value)}
                /> */}
                <Button className='item13'
                    variant='contained'
                    endIcon={<SendIcon />}
                    onClick={handleGenerarOrder}
                    sx={{ fontSize: '0.8rem', marginTop: 'auto', marginLeft: 'auto', borderRadius: '8px' }}
                    disabled={isButtonDisabled} // Deshabilita el botón según la condición
                >Agregar Fila</Button>
                <label className='coment'>Comentario:</label>
                <input className='comentInput'
                    placeholder='Ingrese un comentario a la linea'
                    value={comment} disabled={!habilitarComentario}
                    onChange={(e) => setComment(e.target.value)}
                    onBlur={handleBlurComment}
                ></input>
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
                            ubicacion_entrada_id: false,
                            ubicacion_entrada_descripcion: true,
                            precio_factura: false,
                        }}
                        isCellEditable={isCellEditable}
                    />
                    <Modal
                        open={openComment}
                        onClose={handleClose}
                    >
                        <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 400, bgcolor: 'background.paper', border: '2px solid #000', boxShadow: 24, p: 4 }}>
                            <p>{selectedComment}</p>
                            <Button variant="contained"
                                onClick={handleClose}
                            >Cerrar</Button>
                        </Box>
                    </Modal>
                </div>
                <FetchOrdenesCompra
                    selectedOrder={handleOrderSelection}
                    openModal={openModal}
                    setOpenModal={setOpenModal}
                />
            </div>
        </div>
    )
}

export default TableOrdenesCompra