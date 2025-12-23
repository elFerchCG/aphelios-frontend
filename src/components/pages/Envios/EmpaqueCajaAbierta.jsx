import { Button, FormControl, Input, InputAdornment, InputLabel, Modal, TextField, Tooltip, Typography } from '@mui/material';
import { GridActionsCellItem, GridEditInputCell, GridToolbarDensitySelector, GridToolbarExport, GridToolbarFilterButton } from '@mui/x-data-grid';
import { DataGrid, GridToolbarColumnsButton, GridToolbarContainer } from '@mui/x-data-grid'
import React, { useEffect, useState } from 'react'
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import { Box } from '@mui/system';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import '../Inventarios/estilosPrueba.css'
import { useParams } from 'react-router-dom';
import DeleteForeverRoundedIcon from '@mui/icons-material/DeleteForeverRounded';


const EmpaqueCajaAbierta = () => {
    const { envioId, cajaId, visualIdCaja } = useParams();  // Aquí obtienes ambos parámetros
    const [data, setData] = useState([]);
    const [openCerrarCaja, setOpenCerrarCaja] = useState(false);
    const [inventoryId, setInventoryId] = useState('');
    const [pesoCaja, setPesoCaja] = useState('');
    const [largoCaja, setLargoCaja] = useState('');
    const [anchoCaja, setAnchoCaja] = useState('');
    const [altoCaja, setAltoCaja] = useState('');
    const [errors, setErrors] = useState({
        largo: false,
        ancho: false,
        alto: false,
        peso: false
    });
    const navigate = useNavigate();
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')))

    const [columnVisibilityModel, setColumnVisibilityModel] = useState({
        id: false,
        inventory_id: true,
        orden: false,
        cantidad: true,
        sku: true,
        title: true,
    });

    useEffect(() => {
        console.log('🟢 Montado Escaneos');
        return () => {
            console.log('🔴 Desmontado Escaneos');

            // Llamar metodo de elimicación caja si es necesario
            (async () => {
                await eliminarCajaAutomatico();
            })();
        };
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

    const apiUrl =
        process.env.NODE_ENV === 'production'
            ? process.env.REACT_APP_API_URL
            : process.env.REACT_APP_API_URL_LOCAL;

    // Estilos del modal
    const styleModalCerrarCaja = {
        position: "absolute",
        width: "52%",
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        bgcolor: 'white',
        borderRadius: 4,
        boxShadow: 24,
        p: 4,
    };

    const CustomToolbar = () => (
        <GridToolbarContainer>
            {/* Mantener solo los botones necesarios */}
            <GridToolbarColumnsButton />  {/* Botón de Columnas */}
            <GridToolbarFilterButton />   {/* Botón de Filtros */}
            <GridToolbarDensitySelector />{/* Botón de Densidad */}
            <GridToolbarExport
                csvOptions={{
                    fileName: "exported_data",
                    utf8WithBom: true, // 👈 Esto garantiza que la codificación sea UTF-8
                }}
            />
        </GridToolbarContainer>
    );

    const handleAbrirModalCaja = () => {
        setOpenCerrarCaja(true);
        consultarDimensiones();
    }

    const handleCloseCerrarCaja = () => {
        setOpenCerrarCaja(false);
        setLargoCaja("");
        setAnchoCaja("");
        setAltoCaja("");
        setPesoCaja("");
        setErrors({
            largo: "",
            ancho: "",
            alto: "",
            peso: ""
        });
    }

    const handleDetailCaja = (e) => {
        let value = e.target.value;

        // Permite solo números positivos con hasta 2 decimales
        const regex = /^\d*\.?\d{0,2}$/;

        if (regex.test(value)) {
            setPesoCaja(value);
        }
    }

    const handleDetailAnchoCaja = (e) => {
        let value = e.target.value;

        // Permite solo números positivos con hasta 2 decimales
        const regex = /^\d*\.?\d{0,2}$/;

        if (regex.test(value)) {
            setAnchoCaja(value);
        }
    }

    const handleDetailAltoCaja = (e) => {
        let value = e.target.value;

        // Permite solo números positivos con hasta 2 decimales
        const regex = /^\d*\.?\d{0,2}$/;

        if (regex.test(value)) {
            setAltoCaja(value);
        }
    }

    const handleScan = async () => {
        try {
            const response = await axios.post(`${apiUrl}/empaque/agregarEscaneo/inventory_id/${inventoryId}/caja/${cajaId}`,
                {},
            );

            const newRow = {
                id: response.data.id,
                inventory_id: inventoryId,
                cantidad: 1,
                sku: response.data.sku,
                title: response.data.title,
            };

            setData((prevData) => [newRow, ...prevData]); // agrega al inicio
            setInventoryId(""); // Limpiar input
        } catch (error) {
            const errorMessage = error.response.data.message;
            Swal.fire({
                title: 'Error',
                text: errorMessage,
                icon: 'error',
                timer: 5000,
                showCloseButton: true,
                allowEscapeKey: true,
            });
            setInventoryId("");
        }
    };


    useEffect(() => {
        const timeout = setTimeout(() => {
            if (inventoryId.length === 9) { // Puedes ajustar la longitud mínima esperada
                handleScan();
            }
        }, 150); // Pequeño delay para dejar que el escáner termine de escribir

        return () => clearTimeout(timeout); // Limpiar timeout si el usuario sigue escribiendo
    }, [inventoryId]);

    const generarYDescargarTXT = async (data) => {
        const { envio, numeroCaja } = data; // Extrae los valores desde la respuesta

        // Estructura del contenido del TXT con los valores reemplazados
        const contenido =
            `^XA	
            ^CI28	 
            ^LH0,0	 
            ^FO50,105^A0N,90,90^FD${numeroCaja}^FS
            ^FO50,105^A0N,25,25^FD^FS	 
            ^FB350,2,2	 
            ^FO22,145^A0N,18,18^FD^FS
            ^FO21,145^A0N,18,18^FD^FS
            ^FB350,2,2	 
            ^FT344,152^A0N,22,22^FH\^FD${user.nombre}^FS	
            ^FO65,18^BY3^BCN,54,N,N	 
            ^FD${envio}/${numeroCaja}^FS
            ^FT207,105^A0N,30,30^FH\^FDENVIO:${envio}/${numeroCaja}
            ^FT206,105^A0N,30,30^FH\^FDENVIO:${envio}/${numeroCaja}
            ^PQ1,0,1,Y^XZ`;

        // Crear un Blob con el contenido del archivo
        const blob = new Blob([contenido], { type: "text/plain" });

        // Crear un enlace de descarga
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `archivo_caja_numero:${numeroCaja}.txt`;

        // Simular clic para iniciar la descarga
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleOpenCerrarCaja = async () => {
        // Validación de campos vacíos o cero
        const newErrors = {
            largo: !largoCaja || parseFloat(largoCaja) <= 0,
            ancho: !anchoCaja || parseFloat(anchoCaja) <= 0,
            alto: !altoCaja || parseFloat(altoCaja) <= 0,
            peso: !pesoCaja || parseFloat(pesoCaja) <= 0,
        };

        // Si hay algún error, no continuar
        if (Object.values(newErrors).some(error => error)) {
            setErrors(newErrors);
            Swal.fire({
                title: 'Campos incompletos',
                text: 'Completa todos los campos con valores mayores a cero.',
                icon: 'warning',
                target: document.getElementById("modal-details"),
            });
            return;
        }

        // Si no hay errores, continuar con la petición
        try {
            const response = await axios.post(`${apiUrl}/empaque/consolidar/caja/${cajaId}`,
                {
                    largo: largoCaja,
                    ancho: anchoCaja,
                    alto: altoCaja,
                    peso: pesoCaja
                },
            );
            if (response.data.ok) {
                await generarYDescargarTXT({
                    envio: envioId,
                    numeroCaja: visualIdCaja
                })
                handleCloseCerrarCaja();
                navigate(`/empaque/${envioId}/detalle`)
            }
        } catch (error) {
            const errorMessage = error.response.data.message;
            Swal.fire({
                title: 'Error',
                text: errorMessage,
                icon: 'error',
                timer: 5000,
                showCloseButton: true,
                allowEscapeKey: true,
            });
            handleCloseCerrarCaja();
        }
    }

    const fetchEscaneos = async () => {
        try {
            const response = await axios.get(`${apiUrl}/empaque/fetchEscaneosAbierta/${cajaId}`);
            const result = response.data.data;
            if (Array.isArray(result) && result.length > 0) {
                setData(result);
            }
        } catch (error) {
            setData([]);
        }
    };

    useEffect(() => {
        const fetchEscaneos = async () => {
            try {
                const response = await axios.get(`${apiUrl}/empaque/fetchEscaneosAbierta/${cajaId}`);
                const result = response.data.data;
                if (Array.isArray(result) && result.length > 0) {
                    setData(result);
                }
            } catch (error) {
                setData([]);
            }
        };

        if (cajaId) {
            fetchEscaneos(); // Se ejecuta al montar con el cajaId
        }
    }, [cajaId]);

    const consultarDimensiones = async () => {
        try {
            const response = await axios.get(`${apiUrl}/empaque/consultarCaja/caja/${cajaId}`);
            const result = response.data.cajaCheck;
            if (Array.isArray(result) && result.length > 0) {
                const datosCaja = result[0];
                setLargoCaja(datosCaja.largo);
                setAnchoCaja(datosCaja.ancho);
                setAltoCaja(datosCaja.alto);
                setPesoCaja(datosCaja.peso);
            }
        } catch (error) {
            const errorMessage = error.response.data.message;
            Swal.fire({
                title: 'Error',
                text: errorMessage,
                icon: 'error',
                timer: 5000,
                showCloseButton: true,
                allowEscapeKey: true,
                target: document.getElementById("modal-details"),
            });
        }
    }

    const eliminarEscaneo = async (id) => {
        try {
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
                        const response = await axios.delete(`${apiUrl}/empaque/eliminarEscaneo/${id}`)
                        fetchEscaneos();
                        const message = response.data.message;
                        Swal.fire({
                            title: '¡Eliminado!',
                            text: message,
                            icon: 'success'
                        });
                    } catch (error) {
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
                } else if (result.isDenied) {
                    Swal.fire("¡No se ha eliminado el componente!", "", "info");
                }
            })

        } catch (error) {
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

    const eliminarCajaAutomatico = async () => {
        try {
            await axios.delete(`${apiUrl}/empaque/eliminarCaja/${cajaId}`)
        } catch (error) {
            console.log("No se pudo eliminar la caja automaticamente");
        }
    }

    // const processRowUpdate = async (newRow, oldRow) => {
    //     try {
    //         // Enviar la actualización al backend
    //         const response = await axios.put(`${apiUrl}/empaque/actualizarCantidadEscaneo/${newRow.id}`, {
    //             cantidad: newRow.cantidad,
    //         });

    //         if (response.data.ok) {
    //             Swal.fire({
    //                 title: 'Actualizado!',
    //                 text: response.data.message,
    //                 icon: 'success',
    //                 timer: 3000,
    //                 showCloseButton: true,
    //                 allowEscapeKey: true
    //             });
    //             return newRow; // Devuelve la fila actualizada
    //         }
    //     } catch (error) {
    //         // Capturar errores del backend
    //         const errorMessage = error.response?.data?.message || 'Error desconocido';

    //         Swal.fire({
    //             title: 'Error',
    //             text: errorMessage,
    //             icon: 'error',
    //             timer: 5000,
    //             showCloseButton: true,
    //             allowEscapeKey: true
    //         });

    //         return oldRow; // Revertir cambios en la UI
    //     }
    // };

    const columns = [
        { field: "id", headerName: "# Escaneo", type: "number", flex: 1 },
        { field: "inventory_id", headerName: "ML", type: "text", flex: 1 },
        { field: "orden", headerName: "# Orden", type: "text", flex: 1 },
        // {
        //     field: "cantidad", headerName: "Cantidad", type: "number", flex: 1, headerAlign: 'center', editable: true, cellClassName: "celdaEditable",
        //     renderEditCell: (params) => {
        //         return (
        //             <GridEditInputCell
        //                 {...params}
        //                 type="number"
        //                 inputProps={{
        //                     min: 1,
        //                 }}
        //                 onWheel={(e) => e.target.blur()}
        //             />
        //         )
        //     },
        //     preProcessEditCellProps: (params) => {
        //         const { props } = params;

        //         // Asegurar que el valor sea al menos 0
        //         const value = Math.max(1, props.value);

        //         const isValid = /^[1-9]+$/.test(value);

        //         return {
        //             ...props,
        //             value, // Forzar el valor a 0 si es menor
        //             error: !isValid,  // Marca la celda con error si la validación falla
        //         };
        //     }
        // },
        { field: "cantidad", headerName: "Cantidad", type: "number", flex: 1, headerAlign: 'center' },
        { field: "sku", headerName: "SKU", type: "text", flex: 3 },
        { field: "title", headerName: "Descripción", type: "text", flex: 5 },
        {
            field: "actions",
            headerName: "Acciones",
            type: "actions",
            getActions: (params) => [
                <Tooltip title="Eliminar escaneo" key={`escaneos-${params.row.id}`}>
                    <GridActionsCellItem
                        icon={<DeleteForeverRoundedIcon />}
                        sx={{ color: "red" }}
                        label="Elimiar escaneo"
                        onClick={() => eliminarEscaneo(params.row.id)}
                    />
                </Tooltip>
            ],
        }
    ]

    const handleDetailLargoCaja = (e) => {
        let value = e.target.value;

        // Permite solo números positivos con hasta 2 decimales
        const regex = /^\d*\.?\d{0,2}$/;

        if (regex.test(value)) {
            setLargoCaja(value);
        }
    };

    const totalCantidad = data.reduce((acc, row) => acc + Number(row.cantidad || 0), 0);

    return (
        <div>
            <div className='DataG' style={{ height: 500, width: "90%", position: "relative" }}>
                <div style={{ display: "flex", justifyContent: "center", fontFamily: "Montserrat", fontWeight: "bold", marginTop: "-10px" }}>
                    <h1>Empaque</h1>
                </div>
                <div style={{ position: "absolute", top: "20px", right: "0", display: "flex", gap: "10px", fontFamily: "Montserrat", fontWeight: "bold" }}>
                    <Typography variant='h6' sx={{ fontFamily: "Montserrat", fontWeight: "bold" }}># Envio:</Typography>
                    <Typography variant='h6' sx={{ fontFamily: "Montserrat", fontWeight: "bold", color: "red" }}>{envioId}</Typography>
                </div>
                <div style={{ position: "absolute", top: "60px", right: "0", display: "flex", gap: "10px", fontFamily: "Montserrat", fontWeight: "bold" }}>
                    <Typography variant='h6' sx={{ fontFamily: "Montserrat", fontWeight: "bold", marginTop: "5px" }}># Caja:</Typography>
                    <Typography variant='h6' sx={{ fontFamily: "Montserrat", fontWeight: "bold", color: "blue", marginTop: "5px" }}>{visualIdCaja}</Typography>
                </div>
                <div style={{ position: "absolute", top: "40px", display: "flex", gap: "10px", fontFamily: "Montserrat", fontWeight: "bold" }}>
                    <FormControl variant='outlined'>
                        <InputLabel>
                            Escanear...
                        </InputLabel>
                        <Input
                            value={inventoryId}
                            onChange={(e) => setInventoryId(e.target.value)}
                            //onKeyDown={handleKeyDown} // Detectar Enter o Tab
                            endAdornment={
                                <InputAdornment position='end'>
                                    <QrCodeScannerIcon />
                                </InputAdornment>
                            }
                        />
                    </FormControl>
                </div>
                <DataGrid sx={{ marginTop: 2, borderRadius: 4, boxShadow: 24, borderWidth: 3, borderColor: "#1e88e5", fontFamily: "Montserrat", fontWeight: "bold" }}
                    rows={data}
                    columns={columns}
                    showCellVerticalBorder
                    showColumnVerticalBorder
                    getRowId={(row) => row.id}
                    //processRowUpdate={processRowUpdate}
                    columnVisibilityModel={columnVisibilityModel}
                    onColumnVisibilityModelChange={(newModel) => setColumnVisibilityModel(newModel)}
                    experimentalFeatures={{ newEditingApi: true }}
                    density="compact" // Establece el tamaño de las filas en compacto por defecto
                    slots={{ toolbar: CustomToolbar }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", fontFamily: "Montserrat", fontWeight: "bold" }}>
                    <h3>TOTAL CAJA: {totalCantidad}</h3>
                    <Button
                        variant='contained'
                        sx={{
                            width: "150px",
                            height: "40px",
                            marginTop: "10px",
                            backgroundColor: "blue", "&:hover": { backgroundColor: "darkblue" }
                        }}
                        onClick={handleAbrirModalCaja}
                    >Cerrar Caja</Button>
                </div>
            </div>
            {/* Ventana Modal Cerrar Caja*/}
            <Modal id="modal-details" open={openCerrarCaja} onClose={handleCloseCerrarCaja}>
                <Box sx={styleModalCerrarCaja}>
                    <Typography sx={{ fontFamily: 'Montserrat', fontWeight: "bold", textAlign: "center", marginBottom: "10px" }}>
                        Caja
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'row', flexWrap: "wrap", gap: 2 }}>
                        <TextField
                            className='input'
                            label="Largo"
                            variant='outlined'
                            type='number'
                            value={largoCaja}
                            onChange={handleDetailLargoCaja}
                            error={errors.largo}
                            helperText={errors.largo ? 'Requerido (> 0)' : ''}
                            InputProps={{
                                endAdornment: <InputAdornment position='end'>cm</InputAdornment>
                            }}
                            inputProps={{
                                min: 0,
                                step: 0.1
                            }}
                        />
                        <TextField
                            className='input'
                            label="Ancho"
                            variant='outlined'
                            type='number'
                            value={anchoCaja}
                            onChange={handleDetailAnchoCaja}
                            error={errors.ancho}
                            helperText={errors.ancho ? 'Requerido (> 0)' : ''}
                            InputProps={{
                                endAdornment: <InputAdornment position='end'>cm</InputAdornment>
                            }}
                            inputProps={{
                                min: 0,
                                step: 0.1
                            }}
                        />
                        <TextField
                            className='input'
                            label="Alto"
                            variant='outlined'
                            type='number'
                            value={altoCaja}
                            onChange={handleDetailAltoCaja}
                            error={errors.alto}
                            helperText={errors.alto ? 'Requerido (> 0)' : ''}
                            InputProps={{
                                endAdornment: <InputAdornment position='end'>cm</InputAdornment>
                            }}
                            inputProps={{
                                min: 0,
                                step: 0.1
                            }}
                        />
                    </Box>
                    <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "center", mt: 4, ml: "-10px", gap: 2 }}>
                        <TextField
                            className='input'
                            label="Peso"
                            variant='outlined'
                            type='number'
                            value={pesoCaja}
                            onChange={handleDetailCaja}
                            error={errors.peso}
                            helperText={errors.peso ? 'Requerido (> 0)' : ''}
                            InputProps={{
                                endAdornment: <InputAdornment position='end'>Kg</InputAdornment>
                            }}
                            inputProps={{
                                min: 0,
                                step: 0.1
                            }}
                        />
                    </Box>
                    <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "space-between" }}>
                        <Button onClick={handleCloseCerrarCaja} variant="contained" color="primary">Cerrar</Button>
                        <Button onClick={handleOpenCerrarCaja} variant="contained" color="success">Guardar</Button>
                    </Box>
                </Box>
            </Modal>
        </div>
    )
}

export default EmpaqueCajaAbierta