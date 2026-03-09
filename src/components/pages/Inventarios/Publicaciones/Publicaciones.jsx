import { Box, Button, FormControl, InputAdornment, InputLabel, Modal, OutlinedInput, Switch, TextField, Tooltip, Typography } from '@mui/material';
import { DataGrid, GridActionsCellItem, GridToolbarColumnsButton, GridToolbarContainer, GridToolbarDensitySelector, GridToolbarExport, GridToolbarFilterButton } from '@mui/x-data-grid';
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import ModeEditIcon from '@mui/icons-material/ModeEdit';
import axios from 'axios';
import React, { useEffect, useState } from 'react'
import Swal from 'sweetalert2';
import LabelIcon from '@mui/icons-material/Label';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';


const Publicaciones = () => {
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
    const [openDetailsProduct, setOpenDetailsProduct] = useState(false);
    const [productoId, setProductoId] = useState('');
    const [invSeguridad, setInvSeguridad] = useState('');
    const [invMaximo, setInvMaximo] = useState('');
    const [invRetiros, setInvRetiros] = useState('');
    const [rowsProducts, setRowsProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [openImprimir, setOpenImprimir] = useState(false);
    const [ml, setMl] = useState("");
    const [titleEtiquetasModal, setTitleEtiquetasModal] = useState("");
    const [skuEtiquetasModal, setSkuEtiquetasModal] = useState("");
    const [cantidadEtiquetasModal, setCantidadEtiquetasModal] = useState("");
    const [columnsProducts, setColumnsProducts] = useState([
        { field: 'producto_id', headerName: 'Folio' },
        { field: 'id', headerName: '#Publicación', type: 'text', minWidth: 150 },
        { field: 'catalog_id', headerName: '#Catálogo', type: 'text', minWidth: 150 },
        { field: 'family_id', headerName: '#Familia', type: 'text', minWidth: 150 },
        { field: 'user_product_id', headerName: 'User Product', type: 'text', minWidth: 150 },
        { field: 'title', headerName: 'Título', type: 'text', maxWidth: 490 },
        { field: 'sku', headerName: 'SKU', type: 'text', maxWidth: 350 },
        { field: 'inventory_id', headerName: 'ML', type: 'text', minWidth: 150 },
        { field: 'available_quantity', headerName: 'Stock disponible', type: 'number', minWidth: 130 },
        { field: 'status', headerName: 'Estatus', type: 'text', minWidth: 100 },
        {
            field: 'logistic_type', headerName: 'Logistica', type: 'text', minWidth: 100,
            renderCell: (params) => {
                if (params.value === 'fulfillment') {
                    return 'FULL';
                } else if (params.value === 'cross_docking') {
                    return 'ME';
                } else {
                    return 'ME';
                }
            }
        },
        { field: 'costo', headerName: 'Costo', type: 'number', minWidth: 100 },
        {
            field: 'free_shipping', headerName: 'Envio Gratis', type: 'number', minWidth: 100,
            renderCell: (params) => {
                const value = params.value;

                return value === 1 ? 'Sí' : 'No';
            }
        },
        { field: 'costo_envio', headerName: 'Costo de envio', type: 'number', minWidth: 120 },
        {
            field: "actions",
            headerName: "Acciones",
            type: "actions",
            getActions: (params) => [
                <Tooltip title="Mostrar detalles" key={`actions-${params.row.producto_id}`}>
                    <GridActionsCellItem
                        icon={<ModeEditIcon />}
                        sx={{ color: "orange" }}
                        onClick={() => handleOpenDetailsProduct(params.row.producto_id)}
                        label='Mostrar detalles'
                    />
                </Tooltip>,
                <Tooltip title="Ver publicación" key={`link-${params.row.producto_id}`}>
                    <GridActionsCellItem
                        icon={<OpenInNewIcon />}
                        sx={{ color: "green" }}
                        onClick={() => window.open(params.row.permalink, "_blank")}
                        label="Ver publicación"
                        disabled={!params.row.permalink} // por si el campo viene nulo
                    />
                </Tooltip>,
                // 👇 solo si existe inventory_id
                ...(params.row.inventory_id
                    ? [
                        <Tooltip
                            title="Imprimir etiquetas"
                            key={`labels-${params.row.producto_id}`}
                        >
                            <GridActionsCellItem
                                icon={<LabelIcon />}
                                sx={{ color: "blue" }}
                                onClick={() => handleOpenImprimir(params.row)}
                                label="Imprimir etiquetas"
                            />
                        </Tooltip>,
                    ]
                    : []),
            ],
        },
        {
            field: 'producto_obsoleto',
            headerName: 'Obsoleto',
            width: 130,
            renderCell: (params) => {
                const isObsoleto = params.value === 1;

                return (
                    <Switch
                        checked={isObsoleto}
                        onChange={(e) =>
                            handleToggleObsoleto(params.row.producto_id, e.target.checked)
                        }
                        color={isObsoleto ? "error" : "success"}
                    />
                );
            }
        }
    ]);

    const handleToggleObsoleto = async (producto_id, checked) => {
        try {
            const response = await axios.put(
                `${apiUrl}/productos/marcar_producto_obsoleto/${producto_id}`,
                { producto_obsoleto: checked ? 1 : 0 }
            );

            setRowsProducts((prev) =>
                prev.map((row) =>
                    row.producto_id === producto_id
                        ? { ...row, producto_obsoleto: checked ? 1 : 0 }
                        : row
                )
            );

            if (response?.data?.message) {
                Swal.fire({
                    title: '¡Correcto!',
                    text: response.data.message,
                    icon: 'success',
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
    };

    const handleOpenImprimir = (row) => {
        setMl(row.inventory_id);
        setTitleEtiquetasModal(row.title);
        setSkuEtiquetasModal(row.sku);
        setOpenImprimir(true);
    }

    const handleCloseImprimir = () => {
        setOpenImprimir(false);
        setMl("");
        setCantidadEtiquetasModal("");
    };

    const imprimirEtiquetas = async () => {
        try {
            await generarYDescargarTXT({
                title: titleEtiquetasModal,
                sku: skuEtiquetasModal,
                inventory_id: ml,
                cantidadEtiquetas: cantidadEtiquetasModal
            });

            handleCloseImprimir();
        } catch (error) {
            Swal.fire({
                title: 'Error',
                text: 'Ocurrió un error al generar las etiquetas',
                icon: 'error',
                timer: 5000,
                showCloseButton: true,
                allowEscapeKey: true
            });
            handleCloseImprimir();
        }
    }

    const generarYDescargarTXT = async (data) => {
        const { sku, title, inventory_id, cantidadEtiquetas } = data; // Extrae los valores desde la respuesta

        // Estructura del contenido del TXT con los valores reemplazados
        const contenido =
            `^XA
            ^CI28
            ^LH0,0
            ^FO22,165^A0N,25,25^FDSKU:${sku}^FS
            ^FO22,165^A0N,25,25^FD^FS
            ^FB350,2,2
            ^FO22,145^A0N,18,18^FD^FS
            ^FO21,145^A0N,18,18^FD^FS
            ^FB350,2,2
            ^FO22,105^A0N,20,20^FD${title}^FS
            ^FT385,105^A0B,22,22^FHFD${user.nombre}/env^FS
            ^FO65,18^BY2^BCN,54,N,N
            ^FD${inventory_id}^FS
        ^FT150,98^A0N,22,22^FHFD${inventory_id}^FS
        ^FT149,98^A0N,22,22^FHFD${inventory_id}^FS
            ^PQ${cantidadEtiquetas},0,1,Y^XZ`;

        // Crear un Blob con el contenido del archivo
        const blob = new Blob([contenido], { type: "text/plain" });

        // Crear un enlace de descarga
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `archivo_${inventory_id}.txt`;

        // Simular clic para iniciar la descarga
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Estilos del modal etiquetas
    const styleModalEtiquetas = {
        position: 'absolute',
        width: "20%",
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        bgcolor: 'background.paper',
        borderRadius: 4,
        boxShadow: 24,
        p: 4,
    };

    const handleOpenDetailsProduct = (producto_id) => {
        setOpenDetailsProduct(true);
        setProductoId(producto_id);
        fetchProduct(producto_id);
    }

    const fetchProduct = async (producto_id) => {
        try {
            console.log("Este es el producto buscado:", producto_id);
            const response = await axios.get(`${apiUrl}/buscador/${producto_id}`);
            if (response.data.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
                const producto = response.data.data[0];
                console.log("Esta es la respuesta del componente:", producto);
                setInvSeguridad(producto.inv_seguridad);
                setInvMaximo(producto.inv_maximo);
                setInvRetiros(producto.inv_retiros);
            } else {
                Swal.fire({
                    title: '!Producto no encontrado!',
                    text: 'No se encontraron productos',
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

    const CustomToolbar = () => (
        <GridToolbarContainer>
            {/* Mantener solo los botones necesarios */}
            <GridToolbarColumnsButton />  {/* Botón de Columnas */}
            <GridToolbarFilterButton />   {/* Botón de Filtros */}
            <GridToolbarDensitySelector />{/* Botón de Densidad */}
            <GridToolbarExport
                csvOptions={{
                    fileName: "publicaciones_exportadas",
                    utf8WithBom: true, // 👈 Esto garantiza que la codificación sea UTF-8
                }}
            />
        </GridToolbarContainer>
    );

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

    const [columnVisibilityModelProducts, setColumnVisibilityModelProducts] = useState({
        producto_id: false,
        tipo_publicacion: false,
        id: true,
        catalog_id: false,
        family_id: false,
        user_product_id: false,
        available_quantity: false,
        status: false,
        logistic_type: true,
        costo: false,
        free_shipping: false,
        costo_envio: false,
        title: true,
        sku: true,
        inventory_id: true,
        actions: true,
    })

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await axios.get(`${apiUrl}/buscador/productos/todo`);
                if (response.data && Array.isArray(response.data) && response.data.length > 0) {
                    setRowsProducts(response.data);
                    setFilteredProducts(response.data);
                    calcularAnchosColumnas(response.data, setColumnsProducts);
                } else {
                    Swal.fire({
                        title: '!Productos no encontrados!',
                        text: 'No se encontraron productos',
                        icon: 'error',
                        timer: 5000,
                        showCloseButton: true,
                        allowEscapeKey: true
                    });
                }
            } catch (error) {
                Swal.fire({
                    title: 'Error',
                    text: error.response?.data?.message?.messageText || 'Error desconocido',
                    icon: 'error',
                    timer: 5000,
                    showCloseButton: true,
                    allowEscapeKey: true
                });
            }
        };
        fetchProducts();
    }, [apiUrl]);

    const fetchProducts = async () => {
        try {
            const response = await axios.get(`${apiUrl}/buscador/productos/todo`);
            if (response.data && Array.isArray(response.data) && response.data.length > 0) {
                setRowsProducts(response.data);
                setFilteredProducts(response.data);
                calcularAnchosColumnas(response.data, setColumnsProducts);
            } else {
                Swal.fire({
                    title: '!Productos no encontrados!',
                    text: 'No se encontraron productos',
                    icon: 'error',
                    timer: 5000,
                    showCloseButton: true,
                    allowEscapeKey: true
                });
            }
        } catch (error) {
            Swal.fire({
                title: 'Error',
                text: error.response?.data?.message?.messageText || 'Error desconocido',
                icon: 'error',
                timer: 5000,
                showCloseButton: true,
                allowEscapeKey: true
            });
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
                const family_id = product.family_id ? product.family_id.toLowerCase() : '';
                const user_product_id = product.user_product_id ? product.user_product_id.toLowerCase() : '';
                const productTitle = product.title ? product.title.toLowerCase() : '';
                const productSku = product.sku ? product.sku.toLowerCase() : '';
                const productInventoryId = product.inventory_id ? product.inventory_id.toLowerCase() : '';
                const status = product.status ? product.status.toLowerCase() : '';
                const logistic_type = product.logistic_type ? product.logistic_type.toLowerCase() : '';

                // Verifica si todas las palabras están en el título
                const titleMatch = searchWords.every(word => productTitle.includes(word));

                // Verifica si el término de búsqueda está en otras columnas
                const otherColumnsMatch = (
                    productMLM.includes(searchTerm.toLowerCase()) ||
                    productCatalog.includes(searchTerm.toLowerCase()) ||
                    family_id.includes(searchTerm.toLowerCase()) ||
                    user_product_id.includes(searchTerm.toLowerCase()) ||
                    productSku.includes(searchTerm.toLowerCase()) ||
                    productInventoryId.includes(searchTerm.toLowerCase()) ||
                    status.includes(searchTerm.toLowerCase()) ||
                    logistic_type.includes(searchTerm.toLowerCase())
                );

                // El producto debe coincidir en el título o en alguna de las otras columnas
                return titleMatch || otherColumnsMatch;
            });
        }

        setFilteredProducts(filtered);
    }, [searchTerm, rowsProducts]);

    const calcularAnchosColumnas = (data, setColumns) => {
        const anchoBasePorCaracter = 7;
        const maxAnchoColumnas = {};

        data.forEach(row => {
            Object.keys(row).forEach(field => {
                const valor = row[field] ? String(row[field]) : "";
                maxAnchoColumnas[field] = Math.max(maxAnchoColumnas[field] || 0, valor.length);
            });
        });

        setColumns(prevColumns => prevColumns.map(col => ({
            ...col,
            width: Math.max(100, maxAnchoColumnas[col.field] * anchoBasePorCaracter)
        })));
    };

    const handleCloseDetailsProduct = () => {
        setOpenDetailsProduct(false);
    }

    // Estilos del modal
    const styleDetailsProduct = {
        position: 'absolute',
        width: "30%",
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        bgcolor: 'background.paper',
        borderRadius: 4,
        boxShadow: 24,
        p: 4,
    };

    const updateDetailProduct = async (producto_id) => {
        setOpenDetailsProduct(false);
        try {
            const result = await Swal.fire({
                title: '¿Estás seguro?',
                text: '¡No podrás revertir esto!',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Sí, actualizarlo!',
                backdrop: false,
            });

            if (result.isConfirmed) {

                try {

                    const data = {
                        inv_seguridad: invSeguridad,
                        inv_maximo: invMaximo,
                        inv_retiros: invRetiros
                    };

                    await axios.put(`${apiUrl}/buscador/actualizarProducto/${producto_id}`, data);
                    fetchProducts();

                    setOpenDetailsProduct(false); // ✅ Cierra la modal primero

                    setTimeout(() => {  // ✅ Espera a que la modal cierre antes de mostrar Swal
                        Swal.fire({
                            title: 'Actualizado!',
                            text: 'Tu publicación ha sido actualizada.',
                            icon: 'success',
                        });
                    }, 300);

                } catch (error) {
                    const errorMessage = error.response?.data?.message || 'Error desconocido';
                    Swal.fire({
                        title: 'Error',
                        text: errorMessage,
                        icon: 'error',
                        timer: 5000,
                        showCloseButton: true,
                        allowEscapeKey: true,
                        backdrop: false,
                    });
                }
            } else {
                setOpenDetailsProduct(false);
                setTimeout(() => {
                    Swal.fire({
                        title: "¡Revertido!",
                        text: "¡No se ha actualizado la publicación!",
                        icon: "info",
                    });
                }, 300);
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Error desconocido';
            Swal.fire({
                title: 'Error',
                text: errorMessage,
                icon: 'error',
                timer: 5000,
                showCloseButton: true,
                allowEscapeKey: true,
                backdrop: false,
            });
        }
    };

    const handleDetailSeguridad = (event) => {
        setInvSeguridad(parseFloat(event.target.value));
    }

    const handleDetailMaximo = (event) => {
        setInvMaximo(parseFloat(event.target.value));
    }

    const handleDetailRetiros = (event) => {
        setInvRetiros(parseFloat(event.target.value));
    }

    const handleUpdateDetailProducto = (productoId) => {
        console.log("actualizando componente:", productoId);
        updateDetailProduct(productoId);
    }

    return (
        <div>
            <div className='DataG' style={{ height: 500, width: "90%", marginTop: '-20px' }}>
                <div style={{ display: "flex", justifyContent: "center", fontFamily: "Montserrat", fontWeight: "bold" }}>
                    <h1>Publicaciones</h1>
                </div>
                <div style={{ display: "flex", justifyContent: "flex-start", fontFamily: "Montserrat", fontWeight: "bold" }}>
                    <TextField
                        id="outlined-basic"
                        label="Buscar publicación"
                        variant='outlined'
                        sx={{
                            fontFamily: "Montserrat",
                            width: '20rem',
                            marginTop: "-20px",
                            marginBottom: '10px',
                            backgroundColor: "white"
                        }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <DataGrid
                    sx={{ borderRadius: 4, boxShadow: 24, borderWidth: 3, borderColor: "#1e88e5", ontFamily: "Montserrat", fontWeight: "bold" }}
                    rows={filteredProducts}
                    columns={columnsProducts}
                    showCellVerticalBorder
                    showColumnVerticalBorder
                    getRowId={(row) => row.producto_id}
                    //processRowUpdate={processRowUpdate}
                    columnVisibilityModel={columnVisibilityModelProducts}
                    onColumnVisibilityModelChange={(newModel) => setColumnVisibilityModelProducts(newModel)}
                    experimentalFeatures={{ newEditingApi: true }}
                    density="compact" // Establece el tamaño de las filas en compacto por defecto
                    slots={{ toolbar: CustomToolbar }}
                />
            </div>
            {/* Ventana Modal Details Producto*/}
            <Modal id="modal-details" open={openDetailsProduct} onClose={handleCloseDetailsProduct}>
                <Box sx={styleDetailsProduct}>
                    <Typography sx={{ fontFamily: 'Montserrat', fontWeight: "bold", textAlign: "center", marginBottom: "10px" }}>
                        Publicación
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'row', flexWrap: "wrap", gap: 2 }}>
                        <TextField
                            className='input'
                            label="Inventario Seguridad"
                            variant='outlined'
                            type='number'
                            value={invSeguridad}
                            onChange={handleDetailSeguridad}
                            inputProps={{
                                step: "0.1",
                                min: 0,
                                style: {
                                    backgroundColor: 'white',
                                    color: 'black',
                                },
                            }}
                        />
                        <TextField
                            className='input'
                            label="Inventario Máximo"
                            variant='outlined'
                            type='number'
                            value={invMaximo}
                            onChange={handleDetailMaximo}
                            inputProps={{
                                step: "0.1",
                                min: 0,
                                style: {
                                    backgroundColor: 'white',
                                    color: 'black',
                                },
                            }}
                        />
                        <TextField
                            className='input'
                            label="Inventario Retiros"
                            variant='outlined'
                            type='number'
                            value={invRetiros}
                            onChange={handleDetailRetiros}
                            inputProps={{
                                step: "0.1",
                                min: 0,
                                style: {
                                    backgroundColor: 'white',
                                    color: 'black',
                                },
                            }}
                        />
                    </Box>
                    <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "space-between", marginTop: "50px" }}>
                        <Button onClick={handleCloseDetailsProduct} variant="contained" color="primary">Cerrar</Button>
                        <Button onClick={() => handleUpdateDetailProducto(productoId)} variant="contained" color="success">Guardar</Button>
                    </Box>
                </Box>
            </Modal>
            {/* Modal para imprimir etiquetas */}
            <Modal id={'modal-imprimir'} open={openImprimir} onClose={handleCloseImprimir}>
                <Box sx={styleModalEtiquetas}>
                    <Typography sx={{ fontFamily: 'Montserrat', fontWeight: "bold", textAlign: "center", marginBottom: "10px" }}>
                        Imprimir Etiquetas
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', flexWrap: "wrap", gap: 2 }}>
                        <FormControl sx={{ m: 1, width: '25ch' }} variant="outlined" >
                            <InputLabel>ML</InputLabel>
                            <OutlinedInput
                                type={'text'}
                                label="ML"
                                value={ml}
                                onChange={(e) => setMl(e.target.value)}
                                disabled
                                endAdornment={
                                    <InputAdornment position='end'>
                                        <QrCodeScannerIcon />
                                    </InputAdornment>
                                }
                            />
                        </FormControl>
                        <FormControl sx={{ ml: 1, width: '15ch' }} variant="outlined">
                            <InputLabel>Cantidad</InputLabel>
                            <OutlinedInput
                                type={'number'}
                                label="Cantidad"
                                value={cantidadEtiquetasModal}
                                onChange={(e) => setCantidadEtiquetasModal(e.target.value)}
                                inputProps={{ min: 1 }}
                            />
                        </FormControl>
                    </Box>
                    <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "space-between", marginTop: "50px" }}>
                        <Button onClick={handleCloseImprimir} variant="contained" color="primary" sx={{ width: 80 }}>Cerrar</Button>
                        <Button onClick={imprimirEtiquetas} variant="contained" color="success" sx={{ width: 190 }}>Imprimir</Button>
                    </Box>
                </Box>
            </Modal>
        </div>
    )
}

export default Publicaciones