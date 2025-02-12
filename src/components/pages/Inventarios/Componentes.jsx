import React, { useEffect, useState } from 'react'
import '../../../estilos/billetes.css';
import SearchIcon from '@mui/icons-material/Search';
import { DataGrid } from '@mui/x-data-grid';
import axios from 'axios';
import Swal from 'sweetalert2';
import { Box, Button, InputAdornment, Modal, TextField } from '@mui/material';

const Componentes = () => {

    const [data, setData] = useState([]);
    const [productoId, setProductoId] = useState('');
    const [title, setTitle] = useState('');
    const [productoSku, setProductoSku] = useState('');
    const [open, setOpen] = useState(false);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [rowsProducts, setRowsProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));

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
    const modalStyle = {
        position: 'absolute',
        width: 1480,
        height: 600,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        bgcolor: 'background.paper',
        border: '2px solid #000',
        borderRadius: 6,
        boxShadow: 24,
        p: 4,
    };

    // Función que abre la modal y realiza la búsqueda al hacer clic en el ícono de búsqueda
    const handleOpenSearchProducts = async () => {
        setOpen(true);  // Abre la modal después de la búsqueda
    };

    const handleCloseSearchProducts = () => setOpen(false);

    const fetchData = async (productoId) => {
        try {
            // Llamada para obtener componentes
            const componentesResponse = await axios.get(`${apiUrl}/inventario/existencias/${productoId}/componentes`);
            if (componentesResponse.data.data && Array.isArray(componentesResponse.data.data) && componentesResponse.data.data.length > 0) {
                setData(componentesResponse.data.data);
            } else if (componentesResponse.data.data && Array.isArray(componentesResponse.data.data) && componentesResponse.data.data.length === 0) {
                setData([]); // Limpiar datos si no hay resultados
                setTitle('');
            }

            // Llamada para obtener el título
            const titleResponse = await axios.get(`${apiUrl}/inventario/existencias/${productoId}/title`);
            if (titleResponse.data && Array.isArray(titleResponse.data) && titleResponse.data.length > 0) {
                setTitle(titleResponse.data[0].title);
            } else if (componentesResponse.data && Array.isArray(componentesResponse.data) && componentesResponse.data.length === 0) {
                setTitle('Producto no encontrado');
            }
        } catch (error) {
            setData([]); // Limpiar datos si no hay resultados
            setTitle('');
            setProductoId('');
            const messageText = error?.response?.data?.message || 'Error desconocido';
            Swal.fire({
                title: 'Error',
                text: `Error: ${messageText}`,
                icon: 'error',
                timer: 5000,
                showCloseButton: true,
                allowEscapeKey: true,
            });
        }
    };

    const fetchsku = async (productoSku) => {
        try {
            const response = await axios.get(`${apiUrl}/inventario/ordenBodegas_y_lineasBodegas/producto/${productoSku}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            // Si llega aquí, significa que hay un resultado válido en el array
            if (Array.isArray(response.data) && response.data.length === 1) {
                const producto = response.data[0];  // Accede al único producto
                setProductoId(producto.producto_id);
                setProductoSku(producto.sku);
                await fetchData(producto.producto_id);
            } else {
                // Para cuando el array no tiene exactamente un elemento
                setSearchTerm(productoSku);
                setOpen(true);
            }
        } catch (error) {
            // Maneja el caso específico de "Producto no encontrado"
            if (error.response && error.response.data && error.response.data.message === "Producto no encontrado") {
                setSearchTerm(productoSku);
                setOpen(true);
            } else if (error.response && error.response.data && error.response.data.message) {
                // Otros mensajes de error
                const errorMessage = error.response.data.message;
                Swal.fire({
                    title: 'Error',
                    text: errorMessage,
                    icon: 'error',
                    timer: 5000,
                    showCloseButton: true,
                    allowEscapeKey: true
                });
            } else {
                Swal.fire({
                    title: 'Error',
                    text: 'Error en la comunicación con el servidor.',
                    icon: 'error',
                    timer: 5000,
                    showCloseButton: true,
                    allowEscapeKey: true
                });
            }
        }
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Enter' || event.key === 'Tab' || event.type === 'click') {
            if (productoSku.trim() === '') {
                setData([]); // Limpia los datos si el productoId está vacío
                setTitle('');
                return;
            }
            fetchsku(productoSku);
        }
    };

    const handleBlur = () => {
        if (productoSku.trim()) {
            fetchsku(productoSku);
        }
    };

    const handleProductId = (event) => {
        const sku = event.target.value;
        setProductoSku(sku);
        setSearchTerm(sku);
    }

    const handleRowSelection = (params) => {
        // Encuentra el producto en los datos originales por ID
        const selectedProduct = rowsProducts.find(product => product.producto_id === params.row.producto_id);

        if (selectedProduct) {
            setProductoSku(selectedProduct.sku);
            setProductoId(selectedProduct.producto_id);
            fetchData(selectedProduct.producto_id);
            setOpen(false); // Cierra la modal
        }
    };
    useEffect(() => {
        // Filtra los productos en base al término de búsqueda
        let filtered = rowsProducts;

        if (searchTerm) {
            const searchWords = searchTerm.toLowerCase().split(' ').filter(word => word);

            filtered = filtered.filter(product => {
                const productMLM = product.id ? product.id.toLowerCase() : '';
                const productCatalog = product.catalog_id ? product.catalog_id.toLowerCase() : '';
                const productTitle = product.title ? product.title.toLowerCase() : '';
                const productSku = product.sku ? product.sku.toLowerCase() : '';
                const productVariation = product.variation_id ? product.variation_id.toLowerCase() : '';
                const productInventoryId = product.inventory_id ? product.inventory_id.toLowerCase() : '';
                const productVariationDesc = product.variation_desc ? product.variation_desc.toLowerCase() : '';

                // Verifica si todas las palabras están en el título
                const titleMatch = searchWords.every(word => productTitle.includes(word));

                // Verifica si el término de búsqueda está en otras columnas
                const otherColumnsMatch = (
                    productMLM.includes(searchTerm.toLowerCase()) ||
                    productCatalog.includes(searchTerm.toLowerCase()) ||
                    // productTitle.includes(searchTerm.toLowerCase()) ||
                    productSku.includes(searchTerm.toLowerCase()) ||
                    productVariation.includes(searchTerm.toLowerCase()) ||
                    productInventoryId.includes(searchTerm.toLowerCase()) ||
                    productVariationDesc.includes(searchTerm.toLowerCase())
                );

                // El producto debe coincidir en el título o en alguna de las otras columnas
                return titleMatch || otherColumnsMatch;
            });
        }

        setFilteredProducts(filtered);
    }, [searchTerm, rowsProducts]);

    const columnsProducts = [
        {
            field: 'select',
            headerName: 'Seleccionar',
            width: 150,
            renderCell: (params) => (
                <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    disabled={!rowsProducts.some(product => product.producto_id === params.row.producto_id)}
                    onClick={() => handleRowSelection(params)}
                >
                    Seleccionar
                </Button>
            ),
            sortable: false,
            filterable: false,
        },
        { field: 'producto_id', headerName: 'ID producto', type: 'number' },
        { field: 'tipo_publicacion', headerName: 'Tipo\npublicación', type: 'number', flex: 1, headerClassName: 'header-wrap', headerAlign: 'center' },
        { field: 'id', headerName: '#Publicación', type: 'text', flex: 1 },
        { field: 'catalog_id', headerName: '#Catalogo', type: 'text', flex: 1 },
        { field: 'title', headerName: 'Titulo', type: 'text', flex: 3 },
        { field: 'sku', headerName: 'SKU', type: 'text', flex: 2, headerAlign: 'center' },
        { field: 'variation_id', headerName: '#Variación', type: 'number', headerAlign: 'center' },
        { field: 'inventory_id', headerName: 'ML', type: 'text', flex: 1, headerAlign: 'center' },
        { field: 'variation_desc', headerName: 'Variante', type: 'text', flex: 1.7 },
    ]

    const columns = [
        { field: 'producto_id', headerName: "ID", type: "number", flex: 1 },
        { field: 'id', headerName: "MLM", type: "text", flex: 1 },
        { field: 'inventory_id', headerName: "ML", type: "text", flex: 1 },
        { field: 'variation_id', headerName: "Variante ID", type: "number", flex: 1 },
        { field: "title", headerName: "Descripción", type: "text", flex: 3 },
        { field: 'componente_id', headerName: "Componente ID", type: "number", flex: 1 },
        { field: "cantidad", headerName: "Cantidad", type: "number", flex: 1 },
        { field: "tipo", headerName: "Tipo", type: "text", flex: 1 }
    ]

    return (
        <div>
            {/* Ventana Modal */}
            <Modal open={open} onClose={handleCloseSearchProducts}>
                <Box sx={modalStyle}>
                    <TextField
                        label="Buscador..."
                        color='primary'
                        focused
                        sx={{ width: '20rem', marginBottom: '10px' }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <div style={{ width: '100%', height: '85%', overflowX: 'auto' }}>
                        <DataGrid style={{ fontFamily: "Montserrat", fontWeight: "bold", width: "1800px" }}
                            rows={filteredProducts}
                            columns={columnsProducts}
                            pageSize={5}
                            // processRowUpdate={processRowUpdate}
                            showCellVerticalBorder
                            showColumnVerticalBorder
                            //onRowClick={handleRowSelection}
                            getRowId={(row) => row.producto_id}
                            experimentalFeatures={{ newEditingApi: true }}
                            columnVisibilityModel={{
                                producto_id: true,
                                variation_id: false
                            }}
                        />
                    </div>
                    <Button onClick={handleCloseSearchProducts} variant="contained" color="primary"
                        sx={{
                            marginTop: '10px',
                            marginLeft: '93%'
                        }}
                    >Cerrar</Button>
                </Box>
            </Modal>
            <div className='contenedor-billetes'>
                <div className='buscador-productos'>
                    <label className='label'>Producto ID:</label>
                    <TextField
                        className='item12'
                        onKeyDown={handleKeyDown}
                        onBlur={handleBlur}
                        //disabled={!habilitarBuscador}
                        value={productoSku}
                        onChange={handleProductId}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position='end'>
                                    <SearchIcon
                                        onClick={handleOpenSearchProducts}  // Desactiva onClick si está deshabilitado
                                    />
                                </InputAdornment>
                            ),
                        }}
                        InputLabelProps={{
                            style: {
                                transform: 'translate(10px, 8px)',  // Ajusta la posición del label
                            },
                        }}
                        style={{
                            height: '10px', // Altura del TextField completo
                            marginTop: 20,
                            marginLeft: 90,
                        }}
                        inputProps={{
                            style: {
                                height: '10px', // Altura interna del input
                                padding: '10px', // Padding interno
                                backgroundColor: 'white',
                                color: 'black',
                            },
                        }}
                    />
                    <label>Título: {title}</label>
                </div>
            </div>
            <div className='DataG' style={{ height: 500, width: "80%" }}>
                <button>Agregar componente</button>
                <DataGrid style={{ fontFamily: "Montserrat", fontWeight: "bold" }}
                    rows={data}
                    columns={columns}
                    showCellVerticalBorder
                    showColumnVerticalBorder
                    getRowId={(row) => row.componente_id}
                    experimentalFeatures={{ newEditingApi: true }}
                />
            </div>
        </div>
    )
}

export default Componentes