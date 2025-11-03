import { DataGrid, GridToolbarContainer, GridToolbarExport, GRID_DEFAULT_LOCALE_TEXT, GridToolbarColumnsButton, GridToolbarFilterButton, GridToolbarDensitySelector } from '@mui/x-data-grid';
import { useState } from 'react';
import { useEffect } from 'react';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import Swal from 'sweetalert2';
import axios from 'axios';
import { TextField, Button } from '@mui/material';
import useAuthStore from '../../../../store/authStore';
import CircularProgressWithLabel from './circularProgress';


const DataGridE = () => {
    const [data, setData] = useState([]);
    const [filteredExistencias, setFilteredExistencias] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);


    const { token, user } = useAuthStore();

    const overlayStyle = {
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0, 0, 0, 0.66)", // fondo semitransparente elegante
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999, // ✅ por encima de TODO
    };


    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setLoading(true);
        setProgress(0);

        // Simular progreso (incremento cada 300 ms)
        const interval = setInterval(() => {
            setProgress((old) => {
                if (old >= 95) return 95; // No llegar a 100 hasta que el backend responda
                return old + 5;
            });
        }, 300);

        try {
            const response = await axios.post(`${apiUrl}/inventario/existencias/ajustarExistencias`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data"
                }
            });

            clearInterval(interval);
            setProgress(100);

            setTimeout(() => setLoading(false), 300);

            document.getElementById("excelInput").value = "";

            if (response.data.ok) {
                Swal.fire({
                    title: '¡Éxito!',
                    text: 'Las existencias se han ajustado correctamente.',
                    icon: 'success',
                    confirmButtonText: 'Aceptar'
                });

                fetchExistencias();
            }
        } catch (error) {
            clearInterval(interval);
            setLoading(false);

            document.getElementById("excelInput").value = "";

            const errorMessage = error.response.data.message;
            Swal.fire({
                title: '¡Error!',
                text: errorMessage || 'Hubo un problema al cargar el archivo Excel.',
                icon: 'error',
                confirmButtonText: 'Aceptar'
            });
        }
    };

    const handleUploadClick = () => {
        document.getElementById('excelInput').click();
    };

    const [columnVisibilityModel, setColumnVisibilityModel] = useState({
        id: false,
        producto_id: false,
        localidad_id: false,
        mlm: true, // Asegúrate de incluir todas las columnas
        catalog_id: false,
        title: true,
        sku: true,
        inventory_id: true,
        variation_desc: false,
        localidad_descripcion: true,
        cantidad: true,
    });

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

    const columns = [
        { field: 'cantidad', headerName: 'Cantidad', type: 'number', flex: 0.5 },
        { field: 'id', headerName: 'ID', type: 'number' },
        { field: 'producto_id', headerName: 'ID Producto', type: 'text', flex: 1 },
        { field: 'mlm', headerName: '#De Publicación', type: 'text', flex: 1, pinned: 'left' },
        { field: 'catalog_id', headerName: '#De Catalogo', type: 'text', flex: 1 },
        { field: 'title', headerName: 'Titulo', type: 'text', flex: 2 },
        { field: 'sku', headerName: 'SKU', type: 'text', flex: 1.7 },
        { field: 'inventory_id', headerName: 'ML', type: 'text', flex: 0.7 },
        { field: 'variation_desc', headerName: 'Variante', type: 'text', flex: 1 },
        { field: 'localidad_id', headerName: 'Ubicacion ID', type: 'number', flex: 1 },
        { field: 'localidad_descripcion', headerName: 'Ubicación', type: 'text', flex: 0.5 },
    ];

    useEffect(() => {
        // Filtra los productos en base al término de búsqueda
        let filtered = data;

        if (searchTerm) {
            const searchWords = searchTerm.toLowerCase().split(' ').filter(word => word);

            filtered = filtered.filter(exist => {
                const productMLM = exist.mlm ? exist.mlm.toLowerCase() : '';
                const productTitle = exist.title ? exist.title.toLowerCase() : '';
                const productSku = exist.sku ? exist.sku.toLowerCase() : '';
                const productInventoryId = exist.inventory_id ? exist.inventory_id.toLowerCase() : '';
                const productVariationDesc = exist.variation_desc ? exist.variation_desc.toLowerCase() : '';
                const productoLocalidad = exist.localidad_descripcion ? exist.localidad_descripcion.toLowerCase() : '';

                // Convertir la cantidad a cadena y hacer la búsqueda
                const productoCantidad = exist.cantidad !== undefined ? exist.cantidad.toString().toLowerCase() : '';
                // Verifica si todas las palabras están en el título
                const titleMatch = searchWords.every(word => productTitle.includes(word));

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
                return titleMatch || otherColumnsMatch;
            });
        }

        setFilteredExistencias(filtered);
    }, [searchTerm, data]);

    return (
        <div className='contenido'>
            <div className='encabezado'>
                <h1>Existencias</h1>
            </div>
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '600px',
                    width: 'auto',
                    marginTop: '-20px',
                    marginLeft: '30px',
                    marginRight: '30px'
                }}
            >
                {/* Contenedor flex para TextField y Botón */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginBottom: '10px',
                        justifyContent: 'space-between',
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
                            minWidth: '400px',
                            marginRight: '20px',
                        }}
                    />
                    {['administrador'].includes(user?.rol_descripcion) && (
                        <>
                            <input
                                id="excelInput"
                                type="file"
                                accept=".xlsx, .csv"
                                style={{ display: 'none' }}
                                onChange={handleFileChange}
                            />
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={<CloudUploadIcon />}
                                onClick={handleUploadClick}
                            >
                                Cargar Existencias
                            </Button>
                            {loading && (
                                <div style={overlayStyle}>
                                    <CircularProgressWithLabel value={progress} />
                                </div>
                            )}
                        </>
                    )}
                </div>
                <div style={{ width: '100%', height: 500, overflowX: 'auto' }}>
                    <DataGrid
                        sx={{ borderRadius: 4, boxShadow: 24, borderWidth: 3, borderColor: "#1e88e5" }}
                        rows={filteredExistencias}
                        columns={columns}
                        showCellVerticalBorder
                        showColumnVerticalBorder
                        getRowId={(row) => row.id}
                        experimentalFeatures={{ newEditingApi: true }}
                        columnVisibilityModel={columnVisibilityModel}
                        density="compact"
                        onColumnVisibilityModelChange={(newModel) => setColumnVisibilityModel(newModel)}
                        localeText={{
                            ...GRID_DEFAULT_LOCALE_TEXT, ...{
                                toolbarColumns: 'Columnas',
                                toolbarDensity: 'Densidad',
                                toolbarExport: 'Exportar',
                                toolbarFilters: 'Filtros',
                                filterPanelOperator: 'Operador',
                                toolbarFiltersTooltipHide: 'Ocultar filtros',
                                toolbarFiltersTooltipShow: 'Mostrar filtros',
                                footerRowSelected: (count) => `${count} fila(s) seleccionada(s)`,
                                footerTotalVisibleRows: (visibleCount, totalCount) =>
                                    `${visibleCount} de ${totalCount}`,
                                footerPaginationRowsPerPage: 'Filas por página', // Traducción de Rows per page
                            }
                        }} // Localización en español
                        slots={{ toolbar: CustomToolbar }}
                    />

                </div>
            </div>
        </div>
    )
}

export default DataGridE;