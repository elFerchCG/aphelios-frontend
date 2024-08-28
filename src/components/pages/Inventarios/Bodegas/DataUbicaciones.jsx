import { Box, Button, Modal } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import axios from 'axios';
import React, { useState, useEffect } from 'react';


const DataUbicaciones = ({ open, onClose, bodegaId }) => {
    const [ubicaciones, setUbicaciones] = useState([]);
    const [filteredUbicaciones, setFilteredUbicaciones] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (bodegaId) {
            fetchUbicaciones(bodegaId);
        }
    }, [bodegaId]);

    useEffect(() => {
        if (bodegaId) {
            const fetchUbicaciones = async () => {
                try {
                    const response = await axios.get(`http://localhost:3304/inventario/ordenBodegas_y_lineasBodegas/${bodegaId}/ubicaciones`);
                    setUbicaciones(response.data);
                } catch (error) {
                    console.error("Error fetching ubicaciones:", error);
                }
            };
            fetchUbicaciones();
        }
    }, [bodegaId]);

    const fetchUbicaciones = async (bodegaId) => {
        // Reemplaza con la URL correcta de tu API
        const response = await fetch(`http://localhost:3304/inventario/ordenBodegas_y_lineasBodegas/${bodegaId}/ubicaciones`);
        const data = await response.json();
        setUbicaciones(data);
        setFilteredUbicaciones(data);
    };

    useEffect(() => {
        setFilteredUbicaciones(
            ubicaciones.filter(ubicacion =>
                ubicacion.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
            )
        );
    }, [searchTerm, ubicaciones]);

    const columns = [
        { field: 'id', headerName: 'Folio', type: 'number', width: 100 },
        { field: 'descripcion', headerName: 'Descripción', type: 'text', width: 200 }
    ]

    return (
        <div>
            <Modal
                open={open} onClose={onClose}
                aria-labelledby="modal-title"
                aria-describedby="modal-description"
            >
                <Box sx={{
                    width: 350, height: 600,
                    bgcolor: 'background.paper',
                    padding: 2, margin: 'auto',
                    marginTop: '5%', borderRadius: '40px',
                    fontFamily: "Montserrat",
                }}>
                    <input
                        type='text'
                        placeholder='Buscar ubicaciones'
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <h2 id="modal-title">Ubicaciones Disponibles</h2>
                    <DataGrid style={{ height: 400, width: 350, fontFamily: "Montserrat", fontWeight: "bold" }}
                        rows={filteredUbicaciones}
                        columns={columns}
                        pageSize={5}
                        showCellVerticalBorder
                        showColumnVerticalBorder
                        experimentalFeatures={{ newEditingApi: true }}
                        columnVisibilityModel={{
                            id: true,
                        }}
                    />
                    <Button sx={{ marginTop: '20px', marginLeft: '50%' }}
                        variant="contained"
                        onClick={onClose}>
                        Cerrar
                    </Button>
                </Box>
            </Modal>
        </div>
    )
}

export default DataUbicaciones