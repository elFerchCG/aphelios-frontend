import React, { useEffect, useState } from 'react'
import '../../../estilos/billetes.css';
import { DataGrid } from '@mui/x-data-grid';
import axios from 'axios';
import Swal from 'sweetalert2';

const Billetes = () => {
    const [data, setData] = useState([]);
    const [productoId, setProductoId] = useState('');
    const [title, setTitle] = useState('');

    const apiUrl =
        process.env.NODE_ENV === 'production'
            ? process.env.REACT_APP_API_URL
            : process.env.REACT_APP_API_URL_LOCAL;

    const fetchData = async (productoId) => {
        try {
            // Llamada para obtener componentes
            const componentesResponse = await axios.get(`${apiUrl}/inventario/existencias/${productoId}`);
            if (componentesResponse.data.data && Array.isArray(componentesResponse.data.data) && componentesResponse.data.data.length > 0) {
                setData(componentesResponse.data.data);
            } else if (componentesResponse.data.data && Array.isArray(componentesResponse.data.data) && componentesResponse.data.data.length === 0) {
                setData([]); // Limpiar datos si no hay resultados
                setTitle('');
            }

            // Llamada para obtener el título
            const titleResponse = await axios.get(`${apiUrl}/inventario/existencias/${productoId}/title`);
            if (titleResponse.data && Array.isArray(titleResponse.data) && titleResponse.data.length > 0) {
                setTitle(titleResponse.data[0].title);
            } else if (componentesResponse.data && Array.isArray(componentesResponse.data) && componentesResponse.data.length === 0) {
                setTitle('Producto no encontrado');
            }
        } catch (error) {
            setData([]); // Limpiar datos si no hay resultados
            setTitle('');
            setProductoId('');
            const messageText = error?.response?.data?.message || 'Error desconocido';
            Swal.fire({
                title: 'Error',
                text: `Error: ${messageText}`,
                icon: 'error',
                timer: 5000,
                showCloseButton: true,
                allowEscapeKey: true,
            });
        }
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Enter' || event.key === 'Tab' || event.type === 'click') {
            if (productoId.trim() === '') {
                setData([]); // Limpia los datos si el productoId está vacío
                setTitle('');
                return;
            }
            fetchData(productoId.trim());
        }
    };

    const handleProductId = (event) => {
        const productoId = event.target.value;
        setProductoId(productoId);
    }

    const columns = [
        { field: 'componente_id', headerName: "Componente ID", type: "number", flex: 1 },
        { field: "title", headerName: "Descripción", type: "text", flex: 3 },
        { field: "cantidad", headerName: "Cantidad", type: "number", flex: 1 },
        { field: "tipo", headerName: "Tipo", type: "text", flex: 1 }
    ]

    return (
        <div>
            <div className='contenedor-billetes'>
                <div className='buscador-productos'>
                    <label className='label'>Producto ID:</label>
                    <input
                        className='input'
                        value={productoId}
                        onKeyDown={handleKeyDown}
                        onChange={handleProductId}
                    />
                    <label>Título: {title}</label>
                </div>
            </div>
            <div className='DataG' style={{ height: 500, width: "80%" }}>
                <DataGrid style={{ fontFamily: "Montserrat", fontWeight: "bold" }}
                    rows={data}
                    columns={columns}
                    showCellVerticalBorder
                    showColumnVerticalBorder
                    getRowId={(row) => row.componente_id}
                    experimentalFeatures={{ newEditingApi: true }}
                />
            </div>
        </div>
    )
}

export default Billetes