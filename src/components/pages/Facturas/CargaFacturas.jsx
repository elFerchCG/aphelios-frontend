import { Typography } from '@mui/material'
import axios from 'axios';
import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useDropzone } from "react-dropzone";
import BackupSharpIcon from '@mui/icons-material/BackupSharp';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import BreadcrumbsNav from './BreadcrumbsNav';

const CargaFacturas = () => {
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')))
    const [fileName, setFileName] = useState("");
    const [archivo, setArchivo] = useState("");
    const [proveedorNombre, setProveedorNombre] = useState("");
    const [totalFactura, setTotalFactura] = useState("");
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

    const handleFileUpload = async (files) => {
        const formData = new FormData();
        files.forEach(file => {
            if (file.name.toLowerCase().endsWith(".xml")) {
                formData.append("archivo_xml", file);
            }
        });

        try {
            const response = await axios.post(`${apiUrl}/facturas/cargarFactura`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            const resultados = response.data.resultados;
            resultados.forEach(result => {
                if (!result.error) {
                    Swal.fire({
                        title: "¡Éxito!",
                        text: `${result.archivo} - ${result.mensaje}`,
                        icon: "success",
                        timer: 5000,
                        showCloseButton: true,
                    });
                } else {
                    Swal.fire({
                        title: "Error",
                        text: `${result.archivo} - ${result.error}`,
                        icon: "warning",
                        timer: 5000,
                        showCloseButton: true,
                    });
                }
            });
        } catch (error) {
            Swal.fire({
                title: "Error",
                text: error.response?.data?.message || "Error en la carga.",
                icon: "error",
            });
        }
    };

    const onDrop = useCallback((acceptedFiles) => {
        handleFileUpload(acceptedFiles);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        multiple: true, // ahora acepta varios
        accept: { 'text/xml': ['.xml'] }
    });

    const handleMostrarFacturas = () => {
        navigate(`/facturas`)
    };

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