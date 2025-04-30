import { Typography } from '@mui/material'
import { GridToolbarColumnsButton, GridToolbarContainer, GridToolbarDensitySelector, GridToolbarExport, GridToolbarFilterButton } from '@mui/x-data-grid';
import axios from 'axios';
import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useDropzone } from "react-dropzone";
import BackupSharpIcon from '@mui/icons-material/BackupSharp';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';

const CargaFacturas = () => {
    //const [data, setData] = useState([]);
    //const [openModal, setOpenModal] = useState(true);
    //const [rfc, setRfc] = useState('');
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')))
    const [fileName, setFileName] = useState("");
    const [archivo, setArchivo] = useState("");
    const [mensajeCarga, setMensajeCarga] = useState("");
    const [proveedorNombre, setProveedorNombre] = useState("");
    const [totalFactura, setTotalFactura] = useState("");
    // const [columnVisibilityModel, setColumnVisibilityModel] = useState({
    //     sku: true,
    //     title: true,
    //     cantidad: true,
    //     precio: true,
    //     total: true,
    //     orden_id: true,
    //     linea_id: true,
    // });
    const navigate = useNavigate();

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

    // const CustomToolbar = () => (
    //     <GridToolbarContainer>
    //         {/* Mantener solo los botones necesarios */}
    //         <GridToolbarColumnsButton />  {/* Botón de Columnas */}
    //         <GridToolbarFilterButton />   {/* Botón de Filtros */}
    //         <GridToolbarDensitySelector />{/* Botón de Densidad */}
    //         <GridToolbarExport
    //             csvOptions={{
    //                 fileName: "exported_data",
    //                 utf8WithBom: true, // 👈 Esto garantiza que la codificación sea UTF-8
    //             }}
    //         />
    //     </GridToolbarContainer>
    // );

    // Estilos del modal
    // const styleModal = {
    //     position: 'absolute',
    //     width: "20%",
    //     top: '50%',
    //     left: '50%',
    //     transform: 'translate(-50%, -50%)',
    //     bgcolor: 'background.paper',
    //     borderRadius: 4,
    //     boxShadow: 24,
    //     p: 4,
    // };

    // const handleCloseModal = () => {
    //     setOpenModal(false);
    // }

    // const handleRfc = (event) => {
    //     const rfcVar = event.target.value;
    //     setRfc(rfcVar);
    // }

    // const fetchRfc = async () => {
    //     setOpenModal(false);
    //     try {
    //         const response = await axios.get(`${apiUrl}/facturas/rfc/${rfc}`);
    //         if (response.data && Array.isArray(response.data.facturas)) {
    //             // Extraer los detalles de cada factura y unirlos en un solo array
    //             const detalles = response.data.facturas.flatMap(factura => factura.detalles);
    //             setData(detalles);
    //         }
    //     } catch (error) {
    //         Swal.fire({
    //             title: 'Error',
    //             text: `Error: ${error.message}`,
    //             icon: 'error',
    //             timer: 5000,
    //             showCloseButton: true,
    //             allowEscapeKey: true
    //         });
    //     }
    // }

    const handleFileUpload = async (file) => {
        if (!file || !file.name.endsWith(".xml")) {
            alert("Por favor, selecciona un archivo XML válido.");
            return;
        }
    
        setFileName(file.name);
    
        const formData = new FormData();
        formData.append("archivo_xml", file); // nombre del input: archivo_xml
    
        try {
            const response = await axios.post(`${apiUrl}/facturas/cargarFactura`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
            const result = response.data.resultados[0]; // porque solo subes uno
    
            if (result && !result.error) {
                setArchivo(result.archivo);
                setMensajeCarga(result.mensaje);
                setProveedorNombre(result.proveedor);
                setTotalFactura(result.total_factura);
                Swal.fire({
                    title: "¡Éxito!",
                    text: result.mensaje,
                    icon: "success",
                    timer: 5000,
                    showCloseButton: true,
                    allowEscapeKey: true,
                });
            } else {
                Swal.fire({
                    title: "Error",
                    text: result?.error || "Ocurrió un error al cargar la factura.",
                    icon: "warning",
                    timer: 5000,
                    showCloseButton: true,
                    allowEscapeKey: true,
                });
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || "Error en la carga.";
            Swal.fire({
                title: "Error",
                text: errorMessage,
                icon: "warning",
                timer: 5000,
                showCloseButton: true,
                allowEscapeKey: true,
            });
        }
    };
    
    const onDrop = useCallback((acceptedFiles) => {
        if (acceptedFiles.length > 0) {
            handleFileUpload(acceptedFiles[0]); // ya no es evento, es archivo directamente
        }
    }, []);
    
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        multiple: false,
        accept: { 'text/xml': ['.xml'] }
    });

    // const handleButtonClick = () => {
    //     fileInputRef.current.click();
    // };

    const handleMostrarFacturas = () => {
        navigate(`/facturas`)
    };

    // const columns = [
    //     { field: "id", headerName: "Folio Linea", type: "number" },
    //     { field: "sku", headerName: "SKU", type: "text", flex: 2 },
    //     { field: "title", headerName: "Descripción", type: "text", flex: 3 },
    //     { field: "cantidad", headerName: "Cantidad", type: "number", flex: 1 },
    //     { field: "precio", headerName: "Precio", type: "number", flex: 1 },
    //     { field: "total", headerName: "Total", type: "number", flex: 1 },
    //     { field: "orden_id", headerName: "# Orden", type: "number", },
    //     { field: "linea_id", headerName: "# Linea", type: "number" }
    // ]

    return (
        <div>
            <div className="gestorOrdenes">
                <div className='left-actions'>
                    <div className='action-item'
                        style={{ cursor: "pointer" }} onClick={handleMostrarFacturas}
                    >
                        <DescriptionOutlinedIcon className='action-icon' sx={{ fontSize: 30 }} />
                        <span>Ver Facturas</span>
                    </div>
                </div>
            </div>
            <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
                <div style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center",
                    fontFamily: "Montserrat",
                    fontWeight: "bold",
                    width: "100%"
                }}>
                    <h2>Facturas</h2>
                    {/* Dropzone area */}
                    <div
                        {...getRootProps()}
                        style={{
                            border: "2px dashed #aaa",
                            borderRadius: "10px",
                            padding: "40px",
                            height: "110px",
                            width: "80%",
                            backgroundColor: isDragActive ? "#f0f8ff" : "#fafafa",
                            transition: "background-color 0.3s ease-in-out",
                            cursor: "pointer",
                        }}
                    >
                        <BackupSharpIcon color="primary" sx={{ fontSize: 70 }} />
                        <input {...getInputProps()} />
                        <Typography variant='body1'>
                            {isDragActive ? "Suelta el archivo aquí..." : "Arrastra un archivo XML aquí o haz clic para seleccionarlo"}
                        </Typography>
                    </div>

                    <Typography variant='h6' sx={{ marginTop: 2 }}>
                        Archivo: {fileName || "Ninguno seleccionado"}
                    </Typography>
                    {/* Datos simulados */}
                    <div style={{
                            marginTop: "40px",
                        background: "#fafafa",
                        border: "2px dashed #aaa",
                        borderRadius: "10px",
                        padding: "40px",
                    }}
                    >
                        <Typography variant='h7'>Datos de la factura cargada</Typography>
                        <Typography variant='h6'>Nombre: {archivo}</Typography>
                        <Typography variant='h6'>Proveedor: {proveedorNombre}</Typography>
                        <Typography variant='h6'>Total: {totalFactura}</Typography>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CargaFacturas