import React, { useEffect, useState } from 'react'
import '../../../../estilos/barraAcciones.css';
import addOrder from '../../../../images/addOrder.png';
import { DataGrid } from '@mui/x-data-grid';
import { Checkbox } from '@mui/material';
import Swal from 'sweetalert2';
import axios from 'axios';
import apiUrl from '../../../../config';

const formatFecha = (fecha) => {
    const date = new Date(fecha);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Los meses empiezan en 0
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const ConteoCiclico = () => {
    const [rows, setRows] = useState([]);
    const [token, setToken] = useState('');
    const [user, setUser] = useState('');
    const [ubicaciones, setUbicaciones] = useState([]);
    const [selectedLocalidad, setSelectedLocalidad] = useState('');
    const [selectedRows, setSelectedRows] = useState([]); // Estado para filas seleccionadas
    const [bodegas, setBodegas] = useState([]);
    const [selectedBodega, setSelectedBodega] = useState('');
    const [ubicacionHabilitada, setUbicacionHabilitada] = useState(false);
    const [bodegaTemp, setBodegaTemp] = useState('');
    const [ubicacionIdTemp, setUbicacionIdTemp] = useState('');
    const [productoId, setProductoId] = useState('');
    const [productChecked, setProductChecked] = useState(false);
    const [ubicacionChecked, setUbicacionChecked] = useState(false);
    const [fechaChecked, setFechaChecked] = useState(false);

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

    useEffect(() => {
        const fetchBodegas = async () => {
            try {
                const response = await axios.get(`${apiUrl}/inventario/bodegas_y_localidades/nombres/bodegas`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                })
                setBodegas(response.data);
            } catch (error) {
                if (error.response && error.response.data && error.response.data.message) {
                    const { messageText } = error.response.data.message;
                    alert(`Error: ${messageText}`);
                } else {
                    alert('Ocurrio un error al mostrar las bodegas');
                }
            }
        };
        fetchBodegas();
    }, []);

    useEffect(() => {
        const fetchLocalidades = async () => {
            try {
                const response = await axios.get(`${apiUrl}/inventario/ordenBodegas_y_lineasBodegas/${selectedBodega}/ubicaciones`);
                if (response.data && Array.isArray(response.data) && response.data.length > 0) {
                    setUbicaciones(response.data);
                } else {
                    Swal.fire({
                        title: '!No se encontraron ubicacion para la bodega seleccionada!',
                        text: 'No se encontraron ubicaciones, verifique la bodega',
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
        if (selectedBodega) {
            fetchLocalidades();
        } else {
            setRows([]);
            setSelectedBodega('');
        }
    }, [selectedBodega]);

    const fetchProducts = async () => {
        try {
            const response = await axios.get(`${apiUrl}/conteoCiclico/localidad/${selectedLocalidad}`);
            const data = Array.isArray(response.data.data) ? response.data.data : [response.data.data];
            const dataGridRows = data.map((linea) => ({
                existencia_id: linea.existencia_id,
                producto_id: linea.producto_id,
                producto_title: linea.producto_title,
                clasificacion: linea.clasificacion,
                localidad_descripcion: linea.localidad_descripcion,
                existencia: 0,
                fecha_conteo: formatFecha(linea.fecha_conteo),
            }));
            // Ordenar primero por 'clasificacion' ascendente y luego por 'fecha_conteo' descendente
            const sortedRows = dataGridRows.sort((a, b) => {
                const clasificacionCompare = a.clasificacion.localeCompare(b.clasificacion);
                if (clasificacionCompare === 0) {
                    // Si las clasificaciones son iguales, comparar por fecha_conteo (descendente)
                    return new Date(b.fecha_conteo) - new Date(a.fecha_conteo);
                }
                return clasificacionCompare;
            });

            setRows(sortedRows);
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

    useEffect(() => {
        if (ubicacionChecked === true && selectedLocalidad) {
            fetchProducts();
        } else {
            setRows([]);
            setSelectedLocalidad('');
        }
    }, [ubicacionChecked, selectedLocalidad]);

    const fetchProductsMLM = async () => {
        try {
            const response = await axios.get(`${apiUrl}/conteoCiclico/producto/${productoId}/localidades`);
            const data = Array.isArray(response.data.data) ? response.data.data : [response.data.data];
            const dataGridRows = data.map((linea) => ({
                existencia_id: linea.existencia_id,
                producto_id: linea.producto_id,
                producto_title: linea.producto_title,
                clasificacion: linea.clasificacion,
                localidad_descripcion: linea.localidad_descripcion,
                existencia: 0,
                fecha_conteo: formatFecha(linea.fecha_conteo),
            }));
            // Ordenar primero por 'clasificacion' ascendente y luego por 'fecha_conteo' descendente
            const sortedRows = dataGridRows.sort((a, b) => {
                const clasificacionCompare = a.clasificacion.localeCompare(b.clasificacion);
                if (clasificacionCompare === 0) {
                    // Si las clasificaciones son iguales, convertir las fechas formateadas a Date y comparar
                    const dateA = convertStringToDate(a.fecha_conteo);
                    const dateB = convertStringToDate(b.fecha_conteo);
                    return dateA - dateB; // Orden ascendente (más antiguo primero)
                }
                return clasificacionCompare;
            });

            setRows(sortedRows);
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

    useEffect(() => {
        if (productChecked === true && productoId) {
            fetchProductsMLM();
        } else {
            setRows([]);
            setProductoId('');
        }
    }, [productChecked, productoId]);

    const fetchProductsDate = async () => {
        try {
            const response = await axios.get(`${apiUrl}/conteoCiclico/existencias/fechaAntigua`);
            const data = Array.isArray(response.data.data) ? response.data.data : [response.data.data];
            const dataGridRows = data.map((linea) => ({
                existencia_id: linea.existencia_id,
                producto_id: linea.producto_id,
                producto_title: linea.title,
                clasificacion: linea.clasificacion,
                localidad_descripcion: linea.localidad_descripcion,
                existencia: 0,
                fecha_conteo: linea.fecha_conteo,
            }));
            // Ordenar primero por 'clasificacion' ascendente y luego por 'fecha_conteo' descendente
            const sortedRows = dataGridRows.sort((a, b) => {
                const clasificacionCompare = a.clasificacion.localeCompare(b.clasificacion);
                if (clasificacionCompare === 0) {
                    // Si las clasificaciones son iguales, comparar por fecha_conteo (descendente)
                    return new Date(a.fecha_conteo) - new Date(b.fecha_conteo);
                }
                return clasificacionCompare;
            });

            setRows(sortedRows);
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

    useEffect(() => {
        if (fechaChecked === true) {
            fetchProductsDate();
        } else {
            setRows([]);
        }
    }, [fechaChecked])

    // Función para convertir la cadena de fecha formateada en objeto Date
    const convertStringToDate = (dateString) => {
        // Suponiendo que la fecha esté en formato DD/MM/YYYY o similar, ajusta según el formato real
        const [day, month, year] = dateString.split('/'); // Divide por "/"
        return new Date(`${year}-${month}-${day}`); // Crea un objeto Date en formato YYYY-MM-DD
    };

    const handleSelectBodega = (e) => {
        const bodegaId = parseInt(e.target.value);
        setSelectedBodega(bodegaId);

        const selectedBodegaId = bodegas.find(bodega => bodega.id === bodegaId);
        if (selectedBodegaId) {
            setBodegaTemp(selectedBodegaId.id);
            setUbicacionHabilitada(true);
        }
    }

    const handleSelectedUbicacion = (event) => {
        const localidadId = parseInt(event.target.value);
        setSelectedLocalidad(localidadId);

        const selectedUbicacionId = ubicaciones.find(ubicacion => ubicacion.id === localidadId);
        if (selectedUbicacionId) {
            setUbicacionIdTemp(selectedUbicacionId.id);
        }
    }

    // // Manejar el cambio del checkbox
    // const handleCheckboxChange = (event, row) => {
    //     const isChecked = event.target.checked;
    //     setSelectedRows((prevSelectedRows) => {
    //         if (isChecked) {
    //             return [...prevSelectedRows, row]; // Agregar fila seleccionada
    //         } else {
    //             return prevSelectedRows.filter((selectedRow) => selectedRow.existencia_id !== row.existencia_id); // Quitar fila deseleccionada
    //         }
    //     });
    // };

    const handleCheckboxChangeInputs = (type) => {
        if (type === 'product') {
            setProductChecked(true);
            setFechaChecked(false);
            setUbicacionChecked(false);
        } else if (type === 'fecha') {
            setProductChecked(false);
            setFechaChecked(true);
            setUbicacionChecked(false);
        } else if (type === 'ubicacion') {
            setProductChecked(false);
            setFechaChecked(false);
            setUbicacionChecked(true);
        }
    };

    const handleCheckboxChangeRow = async (event, row) => {
        const isChecked = event.target.checked;

        // Guardar temporalmente el valor actual de la existencia antes de actualizar
        const updatedExistencia = row.existencia;

        // Actualizar la fila en el backend
        await handleProcessSelectedRow(row);

        // Actualizar el estado local para deshabilitar la fila y mantener el valor de existencia
        setRows((prevRows) =>
            prevRows.map((r) =>
                r.existencia_id === row.existencia_id
                    ? { ...r, disabled: isChecked, existencia: updatedExistencia } // Actualizar también la existencia
                    : r
            )
        );
    };

    const handleProcessSelectedRow = async (row) => {
        const user = JSON.parse(localStorage.getItem('user')); // Recuperar el usuario del localStorage
        const userName = user?.nombre;
        const token = localStorage.getItem('token'); // Obtener el token desde el localStorage
        // Obtener la fecha de hoy
        const fechaHoy = new Date().toISOString().split('T')[0]; // Formatear a 'YYYY-MM-DD'
        console.log("Esta es la fecha de hoy que se manda al actualizar una linea: ", fechaHoy);
        try {
            // Llamada al backend para actualizar la fila individualmente
            const response = await axios.put(
                `${apiUrl}/conteoCiclico/existencias/${row.existencia_id}`,
                {
                    cantidad: row.existencia, // Usar el valor actualizado de existencia
                    fecha_conteo: fechaHoy // Suponiendo que esto también necesita actualizarse
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}` // Incluir el token en los headers
                    }
                }
            );
            if (response.status === 200) {
                Swal.fire({
                    title: 'Éxito',
                    text: `La fila con ID ${row.existencia_id} ha sido actualizada.`,
                    icon: 'success',
                });
            }
        } catch (error) {
            Swal.fire({
                title: 'Error',
                text: 'Hubo un error al actualizar la fila. Intenta de nuevo.',
                icon: 'error',
            });
            console.error('Error al actualizar la fila:', error);
        }
    };

    const columns = [
        { field: 'existencia_id', headerName: 'Existencia ID', type: 'number' },
        { field: 'producto_id', headerName: 'MLM', type: 'text', flex: 1 },
        { field: 'producto_title', headerName: 'Titulo', type: 'text', flex: 3 },
        { field: 'clasificacion', headerName: 'Clasificación', type: 'text', headerAlign: 'center', flex: 1 },
        { field: 'localidad_descripcion', headerName: 'Ubicación', type: 'text', flex: 1, headerAlign: 'center' },
        {
            field: 'existencia', headerName: 'Cantidad', type: 'number', flex: 1, headerAlign: 'center', editable: true,
            cellClassName: (params) => {
                const baseClass = 'celdaEditable';
                return params.row.disabled ? `${baseClass} disabled-row` : baseClass;
            }
        },
        {
            field: 'fecha_conteo',
            headerName: 'Fecha conteo',
            type: 'Date',
            flex: 1,
            headerAlign: 'center',
        },
        {
            field: 'actions',
            headerName: 'Procesar',
            type: 'actions',
            flex: 1,
            renderCell: (params) => (
                <Checkbox
                    checked={selectedRows.some(row => row.existencia_id === params.row.existencia_id)}
                    onChange={(e) => handleCheckboxChangeRow(e, params.row)}
                    disabled={params.row.disabled} // Deshabilitar checkbox si la fila está deshabilitada
                />
            )
        }
    ];


    return (
        <div>
            <div className='gestorOrdenes'>
                <div className='left-actions'>
                    <div className="action-item"
                        style={{ cursor: 'pointer' }}
                    >
                        <img src={addOrder} alt="Generar conteo" className="action-icon" />
                        <span>Generar conteo</span>
                    </div>
                </div>
            </div>
            <div className='container'>
                <label className='item03'>Bodega de entrada:</label>
                <select className='item04'
                    value={selectedBodega}
                    onChange={handleSelectBodega}
                >
                    <option value="">Seleccione...</option>
                    {bodegas.map((bodega) => (
                        <option key={bodega.id} value={bodega.id}>
                            {bodega.Nombre}
                        </option>
                    ))}
                </select>
                <input
                    className='checkFecha'
                    type='checkbox'
                    checked={fechaChecked}
                    onChange={() => handleCheckboxChangeInputs('fecha')} />
                <label className='labelFecha'>Fecha</label>
                <input
                    className='checkUbicacion'
                    type='checkbox'
                    checked={ubicacionChecked}
                    onChange={() => handleCheckboxChangeInputs('ubicacion')} />
                <label className='item3'>Ubicación de entrada:</label>
                <select className='item4'
                    value={selectedLocalidad}
                    disabled={!ubicacionChecked}
                    onChange={handleSelectedUbicacion}
                >
                    <option value="">Seleccione...</option>
                    {ubicaciones.map((ubicacion) => (
                        <option key={ubicacion.id} value={ubicacion.id}>
                            {ubicacion.descripcion}
                        </option>
                    ))}
                </select>
                <input
                    className='checkProduct'
                    type='checkbox'
                    onChange={() => handleCheckboxChangeInputs('product')}
                    checked={productChecked} />
                <label className='labelProduct'>Producto:</label>
                <input
                    className='inputProduct'
                    type='text'
                    placeholder='Ingresa un MLM'
                    onChange={(e) => setProductoId(e.target.value)}
                    value={productoId}
                    disabled={!productChecked} />
            </div>
            <div className='DataG' style={{ width: 'auto', height: 500 }}>
                <DataGrid style={{ fontFamily: 'Montserrat', fontWeight: 'bold' }}
                    rows={rows}
                    columns={columns}
                    pageSize={5}
                    showCellVerticalBorder
                    showColumnVerticalBorder
                    getRowId={(row) => row.existencia_id}
                    experimentalFeatures={{ newEditingApi: true }}
                    getRowClassName={(params) => params.row.disabled ? 'disabled-row' : ''}
                    columnVisibilityModel={{
                        existencia_id: false,
                    }}
                />
            </div>
        </div>
    )
}

export default ConteoCiclico;