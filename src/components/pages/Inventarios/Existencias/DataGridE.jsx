import React from 'react'
import { DataGrid } from '@mui/x-data-grid';
import { useState } from 'react';
import { useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Swal from 'sweetalert2';
import axios from 'axios';
import { TextField } from '@mui/material';



const theme = createTheme({
    palette: {
        primary: { main: '#1976d2' },
    },
});

const DataGridE = () => {
    const [data, setData] = useState([]);
    const [filteredExistencias, setFilteredExistencias] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    const apiUrl =
        process.env.NODE_ENV === 'production'
            ? process.env.REACT_APP_API_URL
            : process.env.REACT_APP_API_URL_LOCAL;

    useEffect(() => {
        const fetchExistencias = async () => {
            try {
                const response = await axios.get(`${apiUrl}/inventario/existencias`);
                if (response.data && Array.isArray(response.data) && response.data.length > 0) {
                    setData(response.data);
                    setFilteredExistencias(response.data);
                } else {
                    Swal.fire({
                        title: '!Existencias no encontradas!',
                        text: 'No se encontraron existencias',
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
        fetchExistencias();
    }, [apiUrl]);

    const columns = [
        { field: 'id', headerName: 'ID', type: 'number' },
        { field: 'producto_id', headerName: 'ID Producto', type: 'text', flex: 3 },
        { field: 'sku', headerName: 'SKU', type: 'text', flex: 3 },
        { field: 'inventory_id', headerName: 'ML', type: 'text', flex: 1 },
        //{ field: 'variation_desc', headerName: 'Variante', type: 'text', flex: 1 },
        { field: 'localidad_id', headerName: 'Ubicacion ID', type: 'number', flex: 1 },
        { field: 'localidad_descripcion', headerName: 'Ubicación', type: 'text', flex: 1 },
        { field: 'cantidad', headerName: 'Cantidad', type: 'number', flex: 1 },
    ];

    useEffect(() => {
        // Filtra los productos en base al término de búsqueda
        let filtered = data;

        if (searchTerm) {

            filtered = filtered.filter(exist => {
                const productMLM = exist.producto_id ? exist.producto_id.toLowerCase() : '';
                const productSku = exist.sku ? exist.sku.toLowerCase() : '';
                const productInventoryId = exist.inventory_id ? exist.inventory_id.toLowerCase() : '';
                const productVariationDesc = exist.variation_desc ? exist.variation_desc.toLowerCase() : '';
                const productoLocalidad = exist.localidad_descripcion ? exist.localidad_descripcion.toLowerCase() : '';

            // Convertir la cantidad a cadena y hacer la búsqueda
            const productoCantidad = exist.cantidad !== undefined ? exist.cantidad.toString().toLowerCase() : '';

                // Verifica si el término de búsqueda está en otras columnas
                const otherColumnsMatch = (
                    productMLM.includes(searchTerm.toLowerCase()) ||
                    productSku.includes(searchTerm.toLowerCase()) ||
                    productInventoryId.includes(searchTerm.toLowerCase()) ||
                    productVariationDesc.includes(searchTerm.toLowerCase()) ||
                    productoLocalidad.includes(searchTerm.toLowerCase()) ||
                    productoCantidad.includes(searchTerm.toLowerCase())
                    
                );

                // El producto debe coincidir en el título o en alguna de las otras columnas
                return otherColumnsMatch;
            });
        }

        setFilteredExistencias(filtered);
    }, [searchTerm, data]);

    return (
        <div className='contenido'  >
            <div className='encabezado'>
                <h1>Existencias</h1>
            </div>
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '500px',
                    width: 'auto',
                    margin: '30px',
                }}
            >
                {/* Contenedor flex para el TextField y el Button */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center', // Para alinear ambos elementos a la misma altura
                        marginBottom: '10px', // Espacio entre el formulario y el DataGrid
                    }}
                >
                    {/* TextField alineado a la izquierda */}
                    <TextField
                        id="outlined-basic"
                        label="Buscar existencias"
                        variant="outlined"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            maxWidth: '300px', // Ajusta el tamaño del TextField según sea necesario
                            marginRight: 'auto', // Para que el TextField ocupe todo el espacio posible
                        }}
                    />
                </div>
                <ThemeProvider theme={theme}>
                    <DataGrid style={{ fontFamily: "Montserrat", fontWeight: "bold" }}
                        rows={filteredExistencias}
                        columns={columns}
                        showCellVerticalBorder
                        showColumnVerticalBorder
                        getRowId={(row) => row.id}
                        experimentalFeatures={{ newEditingApi: true }}
                        columnVisibilityModel={{
                            id: false,
                            producto_id: false,
                            localidad_id: false
                        }}
                    />
                </ThemeProvider>
            </div>
        </div>
    )
}

export default DataGridE;