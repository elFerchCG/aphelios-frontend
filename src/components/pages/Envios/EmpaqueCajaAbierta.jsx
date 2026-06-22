import { Button, FormControl, Input, InputAdornment, InputLabel, Modal, TextField, Tooltip, Typography } from '@mui/material';
import { GridActionsCellItem, GridEditInputCell, GridToolbarDensitySelector, GridToolbarExport, GridToolbarFilterButton } from '@mui/x-data-grid';
import { DataGrid, GridToolbarColumnsButton, GridToolbarContainer } from '@mui/x-data-grid'
import React, { useEffect, useMemo, useState } from 'react'
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import { Box } from '@mui/system';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import '../Inventarios/estilosPrueba.css'
import { useParams } from 'react-router-dom';
import DeleteForeverRoundedIcon from '@mui/icons-material/DeleteForeverRounded';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import ReceiptIcon from '@mui/icons-material/Receipt';
import StoreIcon from '@mui/icons-material/Store';


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
    const [tipoEmpaque, setTipoEmpaque] = useState("factura");

    const soundError = new Audio("/sounds/sound-error-scan.mp3");
    soundError.volume = 1;

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
            // (async () => {
            //     await eliminarCajaAutomatico();
            // })();
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
        // 1. Guardamos el ID actual en una constante local y vaciamos el input INMEDIATAMENTE
        const idAProcesar = inventoryId.trim();
        setInventoryId("");

        if (!idAProcesar) return;

        try {
            const response = await axios.post(
                `${apiUrl}/empaque/agregarEscaneo/inventory_id/${idAProcesar}/caja/${cajaId}/envio/${envioId}/tipo/${tipoEmpaque}`,
                {}
            );

            console.log(response.data);

            // Creamos el nuevo registro de escaneo de forma simple
            const newRow = {
                id: response.data.id,
                producto_id: response.data.producto_id,
                inventory_id: idAProcesar,
                cantidad: 1,
                sku: response.data.sku,
                title: response.data.title
                // Ya no es necesario 'total_producto_caja' aquí, valueGetter lo calculará
            };

            // Simplemente agregamos el nuevo escaneo al principio del array anterior
            setData((prevData) => [newRow, ...prevData]);

        } catch (error) {
            const errorMessage = error.response?.data?.message || "Error al procesar el escaneo";

            soundError.currentTime = 0;
            soundError.play();

            Swal.fire({
                title: 'Error',
                text: errorMessage,
                icon: 'error',
                confirmButtonText: 'Revisado',
                showCloseButton: false,
                allowEscapeKey: false,
                allowOutsideClick: false
            });
        }
    };

    const handleKeyDown = (e) => {
        // La mayoría de los escáneres mandan 'Enter' al final
        if (e.key === 'Enter') {
            e.preventDefault(); // Evitamos que el formulario intente recargar la página
            if (inventoryId.trim()) {
                handleScan();
            }
        }
    };

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

                const ordenados = result.sort((a, b) => b.id - a.id);

                const conteoProductos = {};

                ordenados.forEach((item) => {
                    const productoId = item.producto_id;

                    conteoProductos[productoId] =
                        (conteoProductos[productoId] || 0) + Number(item.cantidad || 0);
                });

                const dataConTotales = ordenados.map((item) => ({
                    ...item,
                    total_producto_caja: conteoProductos[item.producto_id]
                }));

                setData(dataConTotales);
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

                    const ordenados = result.sort((a, b) => b.id - a.id);

                    const conteoProductos = {};

                    ordenados.forEach((item) => {
                        const productoId = item.producto_id;

                        conteoProductos[productoId] =
                            (conteoProductos[productoId] || 0) + Number(item.cantidad || 0);
                    });

                    const dataConTotales = ordenados.map((item) => ({
                        ...item,
                        total_producto_caja: conteoProductos[item.producto_id]
                    }));

                    setData(dataConTotales);
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

    // const eliminarCajaAutomatico = async () => {
    //     try {
    //         await axios.delete(`${apiUrl}/empaque/eliminarCaja/${cajaId}`)
    //     } catch (error) {
    //         console.log("No se pudo eliminar la caja automaticamente");
    //     }
    // }

    // Asegúrate de agregar useMemo a tus imports de React arriba:
    // import React, { useEffect, useState, useMemo } from 'react'

    const columns = useMemo(() => [
        { field: "id", headerName: "# Escaneo", type: "number", flex: 1 },
        { field: "inventory_id", headerName: "ML", type: "text", flex: 1 },
        { field: "orden", headerName: "# Orden", type: "text", flex: 1 },
        { field: "cantidad", headerName: "Cantidad", type: "number", flex: 1, headerAlign: 'center' },
        {
            field: "total_producto_caja",
            headerName: "Suma producto",
            type: "number",
            flex: 1,
            headerAlign: 'center',
            align: 'center',
            valueGetter: (value, row) => {
                const rowData = row || value;
                if (!rowData) return 0;

                // Filtramos el estado 'data' (que ahora se actualiza gracias a la dependencia del useMemo)
                return data
                    .filter(item => String(item.producto_id) === String(rowData.producto_id))
                    .reduce((acc, item) => acc + Number(item.cantidad || 0), 0);
            }
        },
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
                        label="Eliminar escaneo"
                        onClick={() => eliminarEscaneo(params.row.id)}
                    />
                </Tooltip>
            ],
        }
    ], [data]); // 👈 CRUCIAL: Cada vez que 'data' cambie, las columnas se refrescan con el nuevo conteo.

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
                <div style={{
                    position: "absolute",
                    top: "20px",
                    right: "0",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    gap: "5px",
                    fontFamily: "Montserrat",
                    fontWeight: "bold"
                }}
                >
                    <div style={{ display: "flex", gap: "10px" }}>
                        <Typography variant='h6' sx={{ fontFamily: "Montserrat", fontWeight: "bold" }}># Envio:</Typography>
                        <Typography variant='h6' sx={{ fontFamily: "Montserrat", fontWeight: "bold", color: "red" }}>{envioId}</Typography>
                    </div>
                    <div style={{ display: "flex", gap: "10px" }}>
                        <Typography variant='h6' sx={{ fontFamily: "Montserrat", fontWeight: "bold", marginTop: "5px" }}># Caja:</Typography>
                        <Typography variant='h6' sx={{ fontFamily: "Montserrat", fontWeight: "bold", color: "blue", marginTop: "5px" }}>{visualIdCaja}</Typography>
                    </div>
                    <ToggleButtonGroup
                        value={tipoEmpaque}
                        exclusive
                        onChange={(e, newValue) => {
                            if (newValue !== null) setTipoEmpaque(newValue);
                        }}
                        size="small"
                    >
                        <ToggleButton value="factura" >
                            <ReceiptIcon color="success" sx={{ mr: 1 }} />
                            Factura
                        </ToggleButton>
                        <ToggleButton value="retiro">
                            <StoreIcon color="primary" sx={{ mr: 1 }} />
                            Retiro
                        </ToggleButton>
                    </ToggleButtonGroup>
                </div>
                <div style={{ position: "absolute", display: "flex", gap: "10px", fontFamily: "Montserrat", fontWeight: "bold" }}>
                    <FormControl variant='outlined'>
                        <InputLabel>
                            Escanear...
                        </InputLabel>
                        <Input
                            autoFocus
                            value={inventoryId}
                            onChange={(e) => setInventoryId(e.target.value)}
                            onKeyDown={handleKeyDown} // 👈 Agregamos el detector de Enter instantáneo
                            endAdornment={
                                <InputAdornment position='end'>
                                    <QrCodeScannerIcon />
                                </InputAdornment>
                            }
                        />
                    </FormControl>
                </div>
                <DataGrid sx={{ marginTop: 8, borderRadius: 4, boxShadow: 24, borderWidth: 3, borderColor: "#1e88e5", fontFamily: "Montserrat", fontWeight: "bold" }}
                    rows={data}
                    columns={columns}
                    showCellVerticalBorder
                    showColumnVerticalBorder
                    getRowId={(row) => row.id}
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