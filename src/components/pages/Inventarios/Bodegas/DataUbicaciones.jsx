import { Box, Button, Input, Modal } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import axios from 'axios';
import React, { useState, useEffect, useRef } from 'react';
import importExcel from '../../../../images/archivo-excel.png'
import { read, utils } from 'xlsx';


const DataUbicaciones = ({ open, onClose, bodegaId }) => {
    const [ubicaciones, setUbicaciones] = useState([]);
    const [filteredUbicaciones, setFilteredUbicaciones] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    const fileInputRef = useRef(null); // Inicializa la referencia del input

    // Estilos del modal
    const modalStyle = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        bgcolor: 'background.paper',
        border: '2px solid #000',
        borderRadius: 6,
        boxShadow: 24,
        p: 4,
    };

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

    const handleImportExcel = async (e) => {
        const file = e.target.files[0];

        if (!file) {
            console.error("No se seleccionó ningún archivo.");
            return;
        }

        console.log("Archivo seleccionado:", file);

        const reader = new FileReader();

        reader.onload = async (event) => {
            console.log("Archivo cargado, leyendo contenido...");
            const arrayBuffer = event.target.result;
            try {
                const workbook = read(arrayBuffer, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = utils.sheet_to_json(worksheet);

                console.log("Datos leídos del archivo Excel:", jsonData);

                // Iterar sobre cada fila del archivo Excel
                for (const row of jsonData) {
                    const data = {
                        descripcion: row.descripcion,
                        bodega_id: row.bodega_id,
                        disponible: row.disponible
                    }

                    console.log("Enviando datos al servidor:", data);
                    // Realizar la solicitud POST para cada fila
                    try {
                        const response = await axios.post('http://localhost:3304/inventario/localidades/', data);
                        console.log("Respuesta del servidor:", response.data);
                        if (response.data.ok) {
                            // Crear un objeto de fila para agregar al DataGrid
                            fetchUbicaciones(bodegaId);
                        }
                    } catch (error) {
                        console.error("Error al enviar datos:", error);
                    }
                }
                // Restablecer el valor del input después de enviar el archivo
                fileInputRef.current.value = null;
            } catch (error) {
                console.error("Error al leer o procesar el archivo:", error);
            }
        };

        reader.onerror = (error) => {
            console.error("Error al leer el archivo:", error);
        };

        reader.readAsArrayBuffer(file);
    };

    const columns = [
        { field: 'id', headerName: 'Folio', type: 'number', flex: 1, headerAlign: 'center', align: 'left' },
        { field: 'descripcion', headerName: 'Descripción', type: 'text', flex: 2, }
    ]

    return (
        <div>
            <Modal
                open={open} onClose={onClose}
                aria-labelledby="modal-title"
                aria-describedby="modal-description"
            >
                <Box sx={modalStyle}>
                    <Input
                        type='text'
                        placeholder='Buscar ubicaciones'
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        sx={{ marginBottom: '10px' }}
                    />
                    <label
                        htmlFor="file-input"
                        style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
                    >
                        <img src={importExcel} alt="Importar Excel" className="action-icon" />
                        <span style={{ marginLeft: '8px' }}>Importar Excel</span>
                    </label>
                    <input
                        id="file-input"
                        type="file"
                        accept=".xlsx, .xls"
                        style={{ display: 'none' }}
                        ref={fileInputRef}
                        onChange={handleImportExcel}
                    />
                    <DataGrid style={{ fontFamily: "Montserrat", fontWeight: "bold", width: 800, height: 500 }}
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