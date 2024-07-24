import { DataGrid, GridActionsCellItem, GridDeleteIcon } from '@mui/x-data-grid';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import AddTaskIcon from '@mui/icons-material/AddTask';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import FactCheckIcon from '@mui/icons-material/FactCheck';

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
    const [bodegas, setBodegas] = useState([]);
    const [productos, setProductos] = useState([]);
    const [traspasos, setTraspasos] = useState([]);
    const [selectedProductoId, setSelectedProductoId] = useState('');
    const [selectedBodegaId, setSelectedBodeId] = useState('');
    const [selectedBodegaSalida, setSelectedBodegaSalida] = useState('');
    const [selectedBodegaEntrada, setSelectedBodegaEntrada] = useState('');
    const [selectedTraspasoId, setSelectedTraspasoId] = useState('');
    const [inputValue, setInputValue] = useState('');
    const [rows, setRows] = useState([]);
    const [idActual, setIdActual] = useState("");
    const [ubicacionEntrada, setUbicacionEntrada] = useState([]);
    const [tipoTraspasoSeleccionado, setTipoTraspasoSeleccionado] = useState(null);
    const [bodegaEntradaHabilitada, setBodegaEntradaHabilitada] = useState(false);
    const [bodegaSalidaHabilitada, setBodegaSalidaHabilitada] = useState(false);
    const [ubicacionEntradaHabilitada, setUbicacionEntradaHabilitada] = useState(false);
    const [ubicacionSalidaHabilitada, setUbicacionSalidaHabilitada] = useState(false);
    const [existenciaProducto, setExistenciaProducto] = useState([]);
    const [productoId, setProductoId] = useState('');
    const [ubicaciones, setUbicaciones] = useState([]);
    const [selectedUbicacionEntrada, setSelectedUbicacionEntrada] = useState('');
    const [selectedUbicacionSalida, setSelectedUbicacionSalida] = useState('');
    const [habilitarTraspaso, setHabilitarTraspaso] = useState(false);
    const [habilitarBuscador, setHabilitarBuscador] = useState(false);
    const [habilitarExistencias, setHabilitarExistencias] = useState(false);
    const [habilitarCantidad, setHabilitarCantidad] = useState(false);
    const [categoria, setCategoria] = useState('');
    const [errorMessage, setErrorMessage] = useState(''); // Estado para manejar los mensajes de error
    const [descripcion, setDescripcion] = useState('');
    const [checkboxState, setCheckboxState] = useState({
        checkbox1: false,
        checkbox2: false,
    })

    const [dateTime, setDateTime] = useState(getCurrentDateTime());

    useEffect(() => {
        const timer = setInterval(() => {
            setDateTime(getCurrentDateTime());
        }, 1000);

        return () => clearInterval(timer);
    }, []);
 
    useEffect(() => {
        const fetchBodegas = async () => {
            try {
                const response = await axios.get('http://localhost:3304/inventario/bodegas_y_localidades/nombres/bodegas');
                setBodegas(response.data);
            } catch (error) {
                console.error('Error fetching bodegas:', error);
            }
        };

        const fetchTipoTraspaso = async () => {
            try {
                const response = await axios.get('http://localhost:3304/inventario/tipoTransaccion');
                setTraspasos(response.data);
            } catch (error) {
                console.error('Error fetching tipo de traspaso:', error);
            }
        };

        const fetchUbicaciones = async () => {
            try {
                const response = await axios.get('http://localhost:3304/inventario/ordenBodegas_y_lineasBodegas/localidadesActivas');
                const data = response.data;
                setUbicacionEntrada(data);
                console.log("Localidades activas:", data);
            } catch (error) {
                console.log("Error al obtener las localidades", error);
            }
        }

        fetchUbicaciones();
        fetchTipoTraspaso();
        fetchBodegas();
    }, []);

    const fetchExistencias = async () => {
        try {
            if (bodegaSalidaHabilitada === true) {
                const response = await axios.get(`http://localhost:3304/productos/${productoId}/existencias`);
                const data = response.data;

                console.log("Existencias", data);
                if (data && data.data) {
                    const agrupadas = data.data.reduce((acc, item) => {
                        const existing = acc.find(ubic => ubic.localidad_id === item.localidad_id);
                        if (existing) {
                            existing.cantidad += item.cantidad;
                        } else {
                            acc.push({ ...item });
                        }
                        return acc;
                    }, []);

                    setUbicaciones(agrupadas);

                    if (agrupadas.length > 0) {
                        const primeraUbicacion = agrupadas[0];
                        setSelectedUbicacionSalida(primeraUbicacion.localidad_id);
                        setExistenciaProducto(primeraUbicacion.cantidad);
                    }
                }
                else {
                    setSelectedUbicacionSalida('');
                    setExistenciaProducto('');
                }
            } else {
                setUbicaciones([]);
                setSelectedUbicacionSalida('');
                setExistenciaProducto('');
            }
        } catch (error) {
            console.log("Error al obtener el arreglo", error);
        }
    };

    const handleInputChange = (event) => {
        setIdActual(event.target.value);
    };

    const handleUbicacionSelectSalida = (e) => {
        const selectedId = parseInt(e.target.value, 10); //selectedId sea un número
        setSelectedUbicacionSalida(selectedId);

        const selectedUbicacionSalidaTemp = ubicaciones.find(ubic => ubic.localidad_id === selectedId);
        setExistenciaProducto(selectedUbicacionSalidaTemp ? selectedUbicacionSalidaTemp.cantidad : '');
    };

    const handleUbicacionSelectEntrada = (e) => {
        const selectedIdEntrada = parseInt(e.target.value, 10);
        setSelectedUbicacionEntrada(selectedIdEntrada);

    };

    const handleSearch = () => {
        fetchExistencias();
        if (bodegaSalidaHabilitada === true) {
            setUbicacionSalidaHabilitada(true);
            setHabilitarCantidad(true);
        } else if (bodegaEntradaHabilitada === true) {
            setUbicacionEntradaHabilitada(true);
            setHabilitarCantidad(true);
        }
    };

    const handleSelectBodegaSalida = (e) => {
        const bodegaId = e.target.value;
        setSelectedBodegaSalida(bodegaId);
        setHabilitarBuscador(true);
    }

    const handleSelectBodegaEntrada = (e) => {
        const bodegaId = e.target.value;
        setSelectedBodegaEntrada(bodegaId);
        setHabilitarBuscador(true);
    };

    const handleHabilitarTraspaso = () => {
        setHabilitarTraspaso(true);
    }

    const handleSelectedTraspasoChange = (e) => {
        const traspasoId = parseInt(e.target.value);
        setSelectedTraspasoId(traspasoId);

        const tipoTraspasoSeleccionado = traspasos.find(traspaso => traspaso.id === traspasoId);
        if (tipoTraspasoSeleccionado) {
            setTipoTraspasoSeleccionado(tipoTraspasoSeleccionado);
            setCategoria(tipoTraspasoSeleccionado.categoria);

            if (tipoTraspasoSeleccionado.categoria === 'entrada' || tipoTraspasoSeleccionado.categoria === 'conteo ciclico') {
                setBodegaEntradaHabilitada(true);
                setBodegaSalidaHabilitada(false);
            } else if (tipoTraspasoSeleccionado.categoria === 'salida') {
                setBodegaEntradaHabilitada(false);
                setBodegaSalidaHabilitada(true);
            } else if (tipoTraspasoSeleccionado.categoria === 'transferencia') {
                setBodegaEntradaHabilitada(true);
                setBodegaSalidaHabilitada(true);
            }
        }
    };

    const handleDeleteClick = (id) => () => {
        setRows((prevRows) => prevRows.filter((row) => row.id !== id));
    };

    const processRowUpdate = (updatedRow) => {
        setRows((prevRows) =>
            prevRows.map((row) => (row.id === updatedRow.id ? updatedRow : row))
        );
        return updatedRow;
    };

    const clearFormat = () => {
        setDescripcion('');
        setSelectedTraspasoId('');
        setSelectedBodegaEntrada('');
        setSelectedBodegaSalida('');
        setProductoId('');
        setSelectedUbicacionEntrada('');
        setSelectedUbicacionSalida('');
        setExistenciaProducto('');
        setInputValue('');
    }

    const handleGenerarOrder = async () => {
        const dateTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
        const parseOrNull = (value) => {
            const parsedValue = parseInt(value);
            return isNaN(parsedValue) ? null : parsedValue;
        };
        const data = {
            fecha_abierto: dateTime,
            tipo_transaccion_id: selectedTraspasoId,
            bodega_salida_id: parseOrNull(selectedBodegaSalida),
            bodega_entrada_id: parseOrNull(selectedBodegaEntrada),
            estatus: "abierto",
            descripcion: descripcion
        };

        // Solo agrega localidad_salida_id si el select está habilitado
        // if (ubicacionSalidaHabilitada) {
        //     data.localidad_salida_id = parseOrNull(selectedUbicacionSalida);
        // }

        try {
            await axios.post('http://localhost:3304/inventario/ordenBodegas_y_lineasBodegas/orden', data);
            clearFormat();
            alert('Orden generada exitosamente');
        } catch (error) {
            console.error('Error generando la orden:', error);
            alert('Error generando la orden');
        }
        setDescripcion('');
        setSelectedTraspasoId('');
        setSelectedBodegaSalida('');
        setSelectedBodegaEntrada('');
    };

    const handleAddRow = () => {

        if (parseInt(inputValue) > parseInt(existenciaProducto)) {
            alert('La cantidad no puede ser mayor que las existencias disponibles.');
            return;
        }

        const parseOrNull = (value) => {
            const parsedValue = parseInt(value);
            return isNaN(parsedValue) ? null : parsedValue;
        };

        const selectedUbicacionSalidaDescripcion = ubicaciones.find(ubic => ubic.localidad_id === selectedUbicacionSalida)?.localidad_descripcion || '';
        const selectedUbicacionEntradaDescripcion = ubicacionEntrada.find(ubicacion => ubicacion.id === selectedUbicacionEntrada)?.descripcion || '';

        const newRow = {
            id: rows.length + 1, // Asigna un ID único
            cantidad: inputValue,
            producto_id: productoId, // ID del producto seleccionado,
            existencias: existenciaProducto,
            localidad_entrada: selectedUbicacionEntradaDescripcion,
            localidad_salida: selectedUbicacionSalidaDescripcion,
        };

        setRows((prevRows) => [...prevRows, newRow]);

        const lineasData = {
            lineas: [{
                producto_id: productoId,
                cantidad: parseInt(inputValue),
                localidad_salida_id: parseOrNull(selectedUbicacionSalida),
                localidad_entrada_id: parseOrNull(selectedUbicacionEntrada)
            }]
        };

        const enviarLineas = async (ordenId) => {
            try {
                console.log("Estas son las lineas", lineasData);
                const response = await axios.post(`http://localhost:3304/inventario/ordenBodegas_y_lineasBodegas/orden/${ordenId}/lineas`, lineasData, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                console.log('Respuesta del servidor:', response.data);
                alert('Las líneas de la orden de bodega fueron registradas con éxito');
            } catch (error) {
                console.error('Error al enviar las líneas de la orden de bodega:', error.response ? error.response.data : error.message);
                alert('Error al enviar las líneas de la orden de bodega');
            }
        };

        // Llamar a la función con el ID de la orden correspondiente
        const ordenId = idActual; // Cambia esto por el ID de la orden real
        enviarLineas(ordenId);

        setProductoId(''); 
        setSelectedUbicacionSalida('');
        setSelectedUbicacionEntrada('');
        setExistenciaProducto('');
        setInputValue('');
    };

    const handleConfirmarOrden = async () => {
        const dateTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
        const data = {
            fecha_confirmada: dateTime,
        };

        try {
            const response = await axios.post(`http://localhost:3304/inventario/ordenBodegas_y_lineasBodegas/confirmar/${idActual}`, data);
            alert('Orden confirmada exitosamente');
        } catch (error) {
            if (error.response && error.response.data && error.response.data.message) {
                const errorMsg = error.response.data.message.messageText || 'Error desconocido';
                setErrorMessage(errorMsg);
                alert(errorMsg);
            } else {
                console.error('Error confirmando la orden:', error);
                alert('Error confirmando la orden');
            }
        }
    }

    const handleProcesarOrden = async () => {
        const dateTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
        const data = {
            fecha_procesada: dateTime,
        };

        try {
            const response = await axios.post(`http://localhost:3304/inventario/ordenBodegas_y_lineasBodegas/procesar/${idActual}`, data);
            alert('Orden procesada exitosamente');
        } catch (error) {
            if (error.response && error.response.data && error.response.data.message) {
                const errorMsg = error.response.data.message.messageText || 'Error desconocido';
                setErrorMessage(errorMsg);
                alert(errorMsg);
            } else {
                console.error('Error procesando la orden:', error);
                alert('Error procesando la orden');
            }
        }
    }

    const handleCheckboxChange = (checkboxName) => {
        if (checkboxName === 'checkbox1') {
            setHabilitarTraspaso(false);
            setCheckboxState({
                checkbox1: true,
                checkbox2: false,
            });
        }
        else if (checkboxName === 'checkbox2') {
            setHabilitarTraspaso(true);
            setCheckboxState({
                checkbox1: false,
                checkbox2: true,
            });

        }
    };

    const columns = [
        { field: 'cantidad', headerName: 'Cantidad', editable: true, type: 'number', width: 100 },
        { field: 'producto_id', headerName: 'MLM', width: 150 },
        { field: 'localidad_entrada', headerName: 'Ubicación Origen', width: 150 },
        { field: 'existencias', headerName: 'Existencias de origen', width: 150 },
        { field: 'localidad_salida', headerName: 'Ubicación Salida', width: 150 },
        { field: 'producto_title', headerName: 'Descripción', width: 420 },
        {
            field: 'actions', headerName: 'Acciones', type: 'actions', width: 150, getActions: (params) => [
                <Tooltip title='Borrar producto'>
                    <GridActionsCellItem
                        icon={<GridDeleteIcon />}
                        sx={{ color: 'red' }}
                        onClick={handleDeleteClick(params.id)}
                    />
                </Tooltip>
            ]
        }
    ];

    return (
        <div>
            <div className='container'>
                <div className='confirmar-all'>
                <IconButton sx={{ color: 'green' }} onClick={handleGenerarOrder}>
                        <Tooltip title='Generar Orden'>
                            <DoneAllIcon sx={{ fontSize: 40 }} />
                        </Tooltip>
                        <Typography >
                            Generar Orden
                        </Typography>
                    </IconButton>
                    <IconButton sx={{ color: 'blue' }} onClick={handleConfirmarOrden}>
                        <Tooltip title='Confirmar Orden'>
                            <DoneAllIcon sx={{ fontSize: 40 }} />
                        </Tooltip>
                        <Typography >
                            Confirmar Orden
                        </Typography>
                    </IconButton>
                </div>
                <div className='procesar-all'>
                    <IconButton sx={{ color: 'orange' }} onClick={handleProcesarOrden}>
                        <Tooltip title='Procesar'>
                            <FactCheckIcon sx={{ fontSize: 40 }} />
                        </Tooltip>
                        <Typography >
                            Procesar Orden
                        </Typography>
                    </IconButton>
                </div>
                <label className='item1'>Folio:</label>
                <input className='item2' value={idActual} onChange={handleInputChange}></input>
                <h3 className='textBuscar' >Buscar ordenes</h3>
                <input
                    className='checkBuscar'
                    type='checkbox'
                    checked={checkboxState.checkbox1}
                    onChange={() => handleCheckboxChange('checkbox1')}
                />
                {checkboxState.checkbox1 && (
                    <>
                        <label className='ordenesT' >Ordenes:</label>
                        <select
                            className='selectO'
                            label='tipoOrdenes'
                            id='tipoOrdenes'
                        >
                            <option value=''>Seleccione...</option>

                        </select>
                        <label className='descripcion'>Descripción:</label>
                        <input className='input-descr' disabled={!habilitarTraspaso} value={descripcion} onChange={(e) => setDescripcion(e.target.value)}></input>
                        <label className='item5' htmlFor='tipoSelect'>Tipo de movimiento:</label>
                        <select
                            className='item6'
                            label='tipoSelect'
                            id='tipoSelect'
                            value={selectedTraspasoId}
                            onChange={handleSelectedTraspasoChange}
                            disabled={!habilitarTraspaso}
                        >
                            <option value=''>Seleccione...</option>
                            {traspasos.map((traspaso) => (
                                <option key={traspaso.id} value={traspaso.id}>
                                    {traspaso.descripcion}
                                </option>
                            ))}
                        </select>
                    </>
                )}
                <h3 className='textOrden'>Orden nueva</h3>
                <input
                    className='checkNuevaOrden'
                    type='checkbox'
                    checked={checkboxState.checkbox2}
                    onChange={() => handleCheckboxChange('checkbox2')}
                />
                {checkboxState.checkbox2 && (
                    <>
                        <label className='descripcion'>Descripción:</label>
                        <input className='input-descr' disabled={!habilitarTraspaso} value={descripcion} onChange={(e) => setDescripcion(e.target.value)}></input>
                        <label className='item5' htmlFor='tipoSelect'>Tipo de movimiento:</label>
                        <select
                            className='item6'
                            label='tipoSelect'
                            id='tipoSelect'
                            value={selectedTraspasoId}
                            onChange={handleSelectedTraspasoChange}
                            disabled={!habilitarTraspaso}
                        >
                            <option value=''>Seleccione...</option>
                            {traspasos.map((traspaso) => (
                                <option key={traspaso.id} value={traspaso.id}>
                                    {traspaso.descripcion}
                                </option>
                            ))}
                        </select></>
                )}
                <label className='categoria-label'>Categoria:</label>
                <label className='categoriaM'>{categoria}</label>
                <label className='labelB' htmlFor='bodegaSelect'>Bodega de salida:</label>
                <select
                    className='selectB'
                    label='bodegaSelect'
                    id='bodegaSelect'
                    value={selectedBodegaSalida}
                    onChange={handleSelectBodegaSalida}
                    disabled={!bodegaSalidaHabilitada}
                >
                    <option value=''>Seleccione...</option>
                    {bodegas.map((bodega) => (
                        <option key={bodega.id} value={bodega.id}>
                            {bodega.Nombre}
                        </option>
                    ))}
                </select>
                <label className='item3' htmlFor='bodegaSelect'>Bodega de entrada:</label>
                <select className='item4'
                    label='bodegaSelect'
                    id='bodegaSelect'
                    value={selectedBodegaEntrada}
                    disabled={!bodegaEntradaHabilitada}
                    onChange={handleSelectBodegaEntrada}
                >
                    <option value=''>Seleccione...</option>
                    {bodegas.map((bodega) => (
                        <option key={bodega.id} value={bodega.id}>
                            {bodega.Nombre}
                        </option>
                    ))}
                </select>

                <label className='item11'>MLM:</label>
                <input
                    className='item12'
                    type='text'
                    disabled={!habilitarBuscador}
                    value={productoId}
                    onChange={(e) => setProductoId(e.target.value)}
                    placeholder='Ingrese el MLM'
                />
                <button className='bBuscar' disabled={!habilitarBuscador} onClick={handleSearch}>Buscar</button>
                <label className='item9'>Ubicación salida:</label>
                <select
                    className='item10'
                    disabled={!ubicacionSalidaHabilitada}
                    value={selectedUbicacionSalida}
                    onChange={handleUbicacionSelectSalida}
                >
                    <option value=''>Seleccione...</option>
                    {ubicaciones.map((ubic, index) => (
                        <option key={index} value={ubic.localidad_id}>
                            {ubic.localidad_descripcion}
                        </option>
                    ))}
                </select>
                <label className='item7'>Ubicación entrada:</label>
                <select className='item8'
                    disabled={!ubicacionEntradaHabilitada}
                    value={selectedUbicacionEntrada}
                    onChange={handleUbicacionSelectEntrada}
                >
                    <option value=''>Seleccione...</option>
                    {ubicacionEntrada.map((ubicacion, index) => (
                        <option key={index} value={ubicacion.id}>
                            {ubicacion.descripcion}
                        </option>
                    ))}
                </select>
                <label className='item14'>Existencias Origen:</label>
                <input className='item15' disabled={!habilitarExistencias} value={existenciaProducto} readOnly></input>
                <label className='item16'>Cantidad:</label>
                <input className='item17' disabled={!habilitarCantidad} value={inputValue} onChange={(e) => setInputValue(e.target.value)}></input>

                <button className='item13' onClick={handleAddRow} >Agregar Fila</button>
            </div>
            <div >
                <div className='DataG' style={{ height: 500, width: '82%' }}>
                    <DataGrid
                        rows={rows}
                        columns={columns}
                        pageSize={5}
                        processRowUpdate={processRowUpdate}
                    />

                </div>
            </div>
        </div>
    );
};

export default TableOrdenes;