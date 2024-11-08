import React from 'react'
import { DataGrid } from '@mui/x-data-grid';
import { useState } from 'react';
import { getExistencias } from '../../../actions/getUsers';
import { useEffect } from 'react';


const DataGridE = ({ filter }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refresh, setRefresh] = useState(false);

    const url = 'http://localhost:3304/inventario/existencias';

    const columns = [
        { field: 'id', headerName: 'MLM', type: 'number' },
        { field: 'producto_id', headerName: 'SKU',  flex: 3 },
        { field: 'inventory_id', headerName: 'ML',  flex: 1 },
        { field: 'variation_desc', headerName: 'Variante', flex: 1 },
        { field: 'ubicacion_desc', headerName: 'Ubicación', flex: 1 },
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
            <div id='contenidoUsuarios' style={{ height: 500, width: '70%' }}>
                <DataGrid style={{ fontFamily: "Montserrat", fontWeight: "bold" }}
                    rows={filteredRows}
                    columns={columns}
                    showCellVerticalBorder
                    showColumnVerticalBorder
                    getRowId={(row) => row.id}
                    experimentalFeatures={{ newEditingApi: true }}
                    columnVisibilityModel={{
                        id: false
                    }}
                />
            </div>
        </div>
    )
}

export default DataGridE;