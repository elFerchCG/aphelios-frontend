import React from 'react'
import { DataGrid } from '@mui/x-data-grid';
import { useState } from 'react';
import { getExistencias } from '../../../actions/getUsers';
import { useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import apiUrl from '../../../../config';


const theme = createTheme({
    palette: {
        primary: { main: '#1976d2' },
    },
});

const DataGridE = ({ filter }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refresh, setRefresh] = useState(false);

    const url = `${apiUrl}/inventario/existencias`;

    const columns = [
        { field: 'id', headerName: 'ID', type: 'number' },
        { field: 'producto_id', headerName: 'ID Producto', flex: 3 },
        { field: 'sku', headerName: 'SKU', flex: 3 },
        { field: 'inventory_id', headerName: 'ML', flex: 1 },
        { field: 'variation_desc', headerName: 'Variante', flex: 1 },
        { field: 'localidad_id', headerName: 'Ubicacion ID', flex: 1 },
        { field: 'localidad_descripcion', headerName: 'Ubicación', flex: 1 },
        { field: 'cantidad', headerName: 'Cantidad', type: 'number', flex: 1 },
    ];

    const filteredRows = data.filter(row =>
        (row.producto_id && row.producto_id.toLowerCase().includes(filter.toLowerCase())) ||
        (row.cantidad && row.cantidad.toString().includes(filter)) ||
        (row.sku && row.sku.toLowerCase().includes(filter.toLowerCase())) ||
        (row.inventory_id && row.inventory_id.toLowerCase().includes(filter.toLowerCase())) ||
        (row.variation_desc && row.variation_desc.toLowerCase().includes(filter.toLowerCase()))
    );

    const fetchData = async () => {
        setLoading(true);
        const result = await getExistencias(url);
        setData(result.data);
        setError(result.error);
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, [refresh]);

    return (
        <div className='contenido'  >
            <div className='encabezado'>
                <h1>Existencias</h1>
            </div>
            <div style={{ height: 500, width: 'auto', margin: '30px' }}>
                <ThemeProvider theme={theme}>
                    <DataGrid style={{ fontFamily: "Montserrat", fontWeight: "bold" }}
                        rows={filteredRows}
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