import { DataGrid, GridActionsCellItem, GridDeleteIcon } from '@mui/x-data-grid';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { IconButton, Tooltip } from '@mui/material';
import AddTaskIcon from '@mui/icons-material/AddTask';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import FactCheckIcon from '@mui/icons-material/FactCheck';

const TableOrdenes = () => {
    const [bodegas, setBodegas] = useState([]);
    const [productos, setProductos] = useState([]);
    const [traspasos, setTraspasos] = useState([]);
    const [selectedProductoId, setSelectedProductoId] = useState('');
    const [selectedBodegaId, setSelectedBodegaId] = useState('');
    const [selectedTraspasoId, setSelectedTraspasoId] = useState('');
    const [inputValue, setInputValue] = useState('');
    const [rows, setRows] = useState([]);
    const [idActual, setIdActual] = useState("");
    const [ubicacionEntrada, setUbicacionEntrada] = useState([]);
    const [ubicacionSalida, setUbicacionSalida] = useState([]);
    const [tipoTraspasoSeleccionado, setTipoTraspasoSeleccionado] = useState(null);
    const [bodegaEntradaHabilitada, setBodegaEntradaHabilitada] = useState(false);
    const [bodegaSalidaHabilitada, setBodegaSalidaHabilitada] = useState(false);
    const [ubicacionEntradaHabilitada, setUbicacionEntradaHabilitada] = useState(false);
    const [ubicacionSalidaHabilitada, setUbicacionSalidaHabilitada] = useState(false);
    const [existenciaProducto, setExistenciaProducto] = useState([]);
    const [ubicacionProducto, setUbicacionProducto] = useState([]);
    const [productoId, setProductoId] = useState([]);
    const [productoSku, setProductoSku] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [ubicaciones, setUbicaciones] = useState([]);
    const [selectedUbicacion, setSelectedUbicacion] = useState('')

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
                console.log('Datos de traspasos:', response.data); // Log de los datos de traspasos
                setTraspasos(response.data);
            } catch (error) {
                console.error('Error fetching tipo de traspaso:', error);
            }
        };


        fetchTipoTraspaso();
        fetchBodegas();
    }, []);

    // const fetchordenId = async () => {
    //     try {
    //         const response = await axios.get('http://localhost:3304/productos/MLM841742986/existencias');
    //         const data = response.data;
    //         console.log('Response:', response.data);
    //         setIdActual(data.orden_id + 1);
    //     } catch (error) {
    //         console.error('Error fetching orden_id:', error);
    //     }
    // };

    // useEffect(() => {
    //     fetchordenId();
    // }, []);

    const fetchExistencias = async () => {
        try {
            const response = await axios.get(`http://localhost:3304/productos/${productoId}/existencias`);
            const data = response.data; //En esta parte accedemos a los datos consultados
            console.log("Existencias", response.data)
            if (Array.isArray(data)) {
                setUbicaciones(data.localidad_descripcion); // Asegúrate de que `data` es un array
            } else if (data && Array.isArray(data.localidad_descripcion)) {
                setUbicaciones(data.localidad_descripcion); // Asume que `localidad_descripcion` es un array
            } else {
                console.error("La estructura de los datos no es la esperada:", data);
            }
            setExistenciaProducto(data.cantidad);
        } catch (error) {
            console.log("Error al obtener el arreglo", error);
        }
    };

    const handleUbicacionSelect = (e) => {
        const ubicacion = ubicaciones.find(ubic => ubic.id === parseInt(e.target.value));
        if (ubicacion) {
            setSelectedUbicacion(ubicacion.localidad);
            setExistenciaProducto(ubicacion.cantidad);
        }
    };

    const handleMlmSearch = (e) => {
        setProductos(e.target.value);
    };

    const handleSearch = () => {
        fetchExistencias(productoId);
    };

    const handleSelectBodegaChange = (e) => {
        const bodegaId = e.target.value;
        setSelectedBodegaId(bodegaId);
    };

    const handleSelectedTraspasoChange = (e) => {
        const traspasoId = parseInt(e.target.value); // Asegurarnos de que sea un número
        setSelectedTraspasoId(traspasoId);
        console.log('Tipo de Traspaso seleccionado:', traspasoId);

        const tipoTraspasoSeleccionado = traspasos.find(traspaso => traspaso.id === traspasoId);
        console.log('Tipo de Traspaso encontrado:', tipoTraspasoSeleccionado);

        if (tipoTraspasoSeleccionado) {
            setTipoTraspasoSeleccionado(tipoTraspasoSeleccionado);
            console.log('Categoria del Traspaso seleccionado:', tipoTraspasoSeleccionado.categoria);

            if (tipoTraspasoSeleccionado.categoria === 'Entrada' || tipoTraspasoSeleccionado.categoria === 'Conteo ciclico') {
                setBodegaEntradaHabilitada(true);
                setUbicacionEntradaHabilitada(true);
                setBodegaSalidaHabilitada(false);
                setUbicacionSalidaHabilitada(false);
            } else if (tipoTraspasoSeleccionado.categoria === 'Salida') {
                setBodegaEntradaHabilitada(false);
                setUbicacionEntradaHabilitada(false);
                setBodegaSalidaHabilitada(true);
                setUbicacionSalidaHabilitada(true);
            } else if (tipoTraspasoSeleccionado.categoria === 'Transferencia') {
                setBodegaEntradaHabilitada(true);
                setUbicacionEntradaHabilitada(true);
                setBodegaSalidaHabilitada(true);
                setUbicacionSalidaHabilitada(true);
            }
        }
    };

    // const handleAddRow = () => {
    //     const selectedBodega = bodegas.find(bodega => bodega.id === parseInt(selectedBodegaId));
    //     const selectedProducto = productos.find(producto => producto.id === parseInt(selectedProductoId));

    //     const newRow = {
    //         id: rows.length + 1, // Asigna un ID único
    //         cantidad: inputValue,
    //         producto_id: selectedProducto ? selectedProducto.id : '', // ID del producto seleccionado
    //         sku: selectedProducto ? selectedProducto.sku : '',
    //         producto_title: selectedProducto ? selectedProducto.title : '',
    //         bodega_id: selectedBodega ? selectedBodegaId : '',
    //         bodega_nombre: selectedBodega ? selectedBodega.Nombre : '', // Nombre de la bodega seleccionada
    //         localidad_origen: '',
    //         localidad_salida: ''
    //     };

    //     setRows((prevRows) => [...prevRows, newRow]);
    //     setInputValue(''); // Limpiar el valor del input después de agregar la fila
    // };

    const handleDeleteClick = (id) => () => {
        setRows((prevRows) => prevRows.filter((row) => row.id !== id));
    };

    const processRowUpdate = (updatedRow) => {
        setRows((prevRows) =>
            prevRows.map((row) => (row.id === updatedRow.id ? updatedRow : row))
        );
        return updatedRow;
    };

    const handleConfirmOrder = async () => {
        const data = {
            fecha: "2024-07-05",
            tipo_transaccion_id: selectedTraspasoId,
            estatus: "Abierto",
            lineas: rows.map(row => ({
                producto_id: row.producto_id,
                cantidad: row.cantidad
            }))
        };

        try {
            await axios.post('http://localhost:3304/inventario/ordenBodegas_y_lineasBodegas', data);
            console.log("Datos enviados", data);
            alert('Orden confirmada exitosamente');
        } catch (error) {
            console.error('Error confirmando la orden:', error);
            alert('Error confirmando la orden');
        }
    };

    const columns = [
        { field: 'cantidad', headerName: 'Cantidad', editable: true, type: 'number', width: 100 },
        { field: 'sku', headerName: 'SKU', width: 150 },
        { field: 'localidad_origen', headerName: 'Ubicación Origen', width: 150 },
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
                <IconButton className='bCrearO' sx={{ color: 'green' }} onClick={handleConfirmOrder}>
                    <AddTaskIcon >
                        <Tooltip title='Crear Orden'>
                            Crear Orden
                        </Tooltip>
                    </AddTaskIcon>
                </IconButton>
                <IconButton className='bConfirmar' sx={{ color: 'green' }} >
                    <DoneAllIcon ></DoneAllIcon>
                    <Tooltip title='Confirmar Todo'>
                    </Tooltip>
                </IconButton>
                <IconButton className='bProcesar' sx={{ color: 'green' }} >
                    <FactCheckIcon ></FactCheckIcon>
                    <Tooltip title='Procesar'>
                    </Tooltip>
                </IconButton>
                <label className='item1'>Folio:</label>
                <input className='item2' value={idActual} readOnly></input>
                <label className='ordenesT' >Ordenes:</label>
                <select
                    className='selectO'
                    label='tipoOrdenes'
                    id='tipoOrdenes'
                >
                    <option value=''>Seleccione...</option>

                </select>
                <label className='item5' htmlFor='tipoSelect'>Tipo de movimiento:</label>
                <select className='item6'
                    label='tipoSelect'
                    id='tipoSelect'
                    value={selectedTraspasoId}
                    onChange={handleSelectedTraspasoChange}
                >
                    <option value=''>Seleccione...</option>
                    {traspasos.map((traspaso) => (
                        <option key={traspaso.id} value={traspaso.id}>
                            {traspaso.descripcion}
                        </option>
                    ))}
                </select>
                <label className='categoriaM'></label>
                <label className='labelB' htmlFor='bodegaSelect'>Bodega de salida:</label>
                <select
                    className='selectB'
                    label='bodegaSelect'
                    id='bodegaSelect'
                    value={selectedBodegaId}
                    onChange={handleSelectBodegaChange}
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
                    value={selectedBodegaId}
                    onChange={handleSelectBodegaChange}
                    disabled={!bodegaEntradaHabilitada}
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
                    value={productoId}
                    onChange={(e) => setProductoId(e.target.value)}
                    placeholder='Ingrese el SKU'
                />
                <button onClick={fetchExistencias}>Buscar</button>
                <label className='item9'>Ubicación salida:</label>
                <select
                    className='item10'
                    disabled={!ubicacionSalidaHabilitada}
                    onChange={handleUbicacionSelect}
                    value={selectedUbicacion}
                >
                    <option value=''>Seleccione...</option>
                    {ubicaciones.map((ubicacion) => (
                        <option key={ubicacion.id} value={ubicacion.id}>
                            {ubicacion.localidad}
                        </option>
                    ))}
                </select>
                <label className='item7'>Ubicación entrada:</label>
                <select className='item8'
                    disabled={!ubicacionEntradaHabilitada}
                >
                    <option value=''>Seleccione...</option>
                    {ubicacionEntrada.map((ubicacion) => (
                        <option key={ubicacion.id} value={ubicacion.id}>
                            {ubicacion.localidad_descripcion}
                        </option>
                    ))}
                </select>
                <label className='item14'>Existencias Origen:</label>
                <input className='item15' value={existenciaProducto}></input>
                <label className='item16'>Cantidad:</label>
                <input className='item17' value={inputValue} onChange={(e) => setInputValue(e.target.value)}></input>

                <button className='item13' >Agregar Fila</button>
            </div>
            <div className='contenido'>
                <div id='contenidoUsuarios' style={{ height: 500, width: '82%' }}>
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
