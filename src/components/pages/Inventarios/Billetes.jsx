import React, { useEffect, useState } from 'react'
import '../../../estilos/billetes.css';
import SearchIcon from '@mui/icons-material/Search';
import { DataGrid, GridActionsCellItem, GridDeleteIcon, GridEditInputCell, GridToolbar } from '@mui/x-data-grid';
import axios from 'axios';
import Swal from 'sweetalert2';
import { Box, Button, FormControl, InputAdornment, InputLabel, MenuItem, Modal, Select, TextField, Tooltip, Typography } from '@mui/material';

const Componentes = () => {

    const [data, setData] = useState([]);
    const [productoId, setProductoId] = useState('');
    const [productoIdComponent, setProductoIdComponent] = useState('');
    const [title, setTitle] = useState('');
    const [titleComponente, setTitleComponente] = useState('');
    const [tipo, setTipo] = useState('');
    const [cantidad, setCantidad] = useState('');
    const [productoSku, setProductoSku] = useState('');
    const [productoSkuComponente, setProductoSkuComponente] = useState('');
    const [open, setOpen] = useState(false);
    const [openComponentes, setOpenComponentes] = useState(false);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [filteredProductsComponente, setFilteredProductsComponente] = useState([]);
    const [rowsProducts, setRowsProducts] = useState([]);
    const [rowsComponentes, setRowsComponentes] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchTermComponente, setSearchTermComponente] = useState('');
    const [openAddComponent, setOpenAddComponent] = useState(false);
    const [inputActivo, setInputActivo] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));

    const [columnVisibilityModel, setColumnVisibilityModel] = useState({
        billete_id: false,
        producto_id: false,
        componente_id: false,
    });

    const [columnVisibilityModelProducts, setColumnVisibilityModelProducts] = useState({
        producto_id: false,
        tipo_publicacion: false,
        id: false,
        catalog_id: false,
        variation_id: false,
    })

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
        width: 1400,
        height: 600,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        bgcolor: 'background.paper',
        borderRadius: 4,
        boxShadow: 24,
        p: 4,
    };

    // Estilos del modal
    const styleAddComponent = {
        position: 'absolute',
        width: 300,
        height: 300,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        bgcolor: 'background.paper',
        borderRadius: 4,
        boxShadow: 24,
        p: 4,
    };

    // Función que abre la modal y realiza la búsqueda al hacer clic en el ícono de búsqueda
    const handleOpenSearchProducts = async () => {
        setOpen(true);
    };

    const handleCloseSearchProducts = () => setOpen(false);

    const handleOpenSearchProductsComponentes = async () => {
        setOpenComponentes(true);
    }

    const handleCloseComponentes = () => setOpenComponentes(false);

    const handleOpenAddComponent = async () => {
        setOpenAddComponent(true);
    }

    const handleCloseAddComponent = () => {
        setOpenAddComponent(false);
        setProductoIdComponent('');
        setProductoSkuComponente('');
        setTipo('');
        setCantidad('');
    }

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await axios.get(`${apiUrl}/buscador/productos/todo`);
                if (response.data && Array.isArray(response.data) && response.data.length > 0) {
                    setRowsProducts(response.data);
                    setFilteredProducts(response.data);
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
        if (open) {
            fetchProducts();
        }
    }, [apiUrl, open]);

    // useEffect(() => {
    //     const fetchProductsComponente = async () => {
    //         try {
    //             const response = await axios.get(`${apiUrl}/componentes`);
    //             if (response.data && Array.isArray(response.data) && response.data.length > 0) {
    //                 setRowsComponentes(response.data);
    //                 setFilteredProductsComponente(response.data);
    //             } else {
    //                 Swal.fire({
    //                     title: '!Productos no encontrados!',
    //                     text: 'No se encontraron productos',
    //                     icon: 'error',
    //                     timer: 5000,
    //                     showCloseButton: true,
    //                     allowEscapeKey: true
    //                 });
    //             }
    //         } catch (error) {
    //             if (error.response && error.response.data && error.response.data.message) {
    //                 const { messageText } = error.response.data.message;
    //                 Swal.fire({
    //                     title: 'Error',
    //                     text: `Error: ${messageText}`,
    //                     icon: 'error',
    //                     timer: 5000,
    //                     showCloseButton: true,
    //                     allowEscapeKey: true
    //                 });
    //             }
    //         }
    //     }
    //     fetchProductsComponente();
    // }, [apiUrl]);

    useEffect(() => {
        const fetchComponentesTodos = async () => {
            try {
                const response = await axios.get(`${apiUrl}/componentes/todos`);
                if (response.data.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
                    setRowsComponentes(response.data.data);
                    setFilteredProductsComponente(response.data.data);
                } else {
                    Swal.fire({
                        title: '!Componentes no encontrados!',
                        text: 'No se encontraron componentes',
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
        if (openComponentes) {
            fetchComponentesTodos();
        }
    }, [apiUrl, openComponentes]);

    const fetchData = async (productoId) => {
        try {
            // Llamada para obtener componentes
            console.log(`Este es el title: ${title} y este es el producto_id: ${productoId}`);
            const componentesResponse = await axios.get(`${apiUrl}/billetes/${productoId}`);
            if (componentesResponse.data.data && Array.isArray(componentesResponse.data.data) && componentesResponse.data.data.length > 0) {
                setData(componentesResponse.data.data);
            } else if (componentesResponse.data.data && Array.isArray(componentesResponse.data.data) && componentesResponse.data.data.length === 0) {
                setData([]); // Limpiar datos si no hay resultados
            }
            //No entra a esta parte del codigo, se va directo al catch
            console.log(`Intentando obtener el título de: ${apiUrl}/billetes/${productoId}/title`);
            // Llamada para obtener el título
            const titleResponse = await axios.get(`${apiUrl}/billetes/${productoId}/title`);
            console.log("Respuesta del título:", titleResponse.data);
            if (titleResponse.data && Array.isArray(titleResponse.data) && titleResponse.data.length > 0) {
                setTitle(titleResponse.data[0].title);
            }
        } catch (error) {
            setData([]); // Limpiar datos si no hay resultados
            console.log(`Intentando obtener el título de: ${apiUrl}/billetes/${productoId}/title`);
            // Llamada para obtener el título
            const titleResponse = await axios.get(`${apiUrl}/billetes/${productoId}/title`);
            console.log("Respuesta del título:", titleResponse.data);
            if (titleResponse.data && Array.isArray(titleResponse.data) && titleResponse.data.length > 0) {
                setTitle(titleResponse.data[0].title);
            }
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
    };

    const fetchDataComponente = async (productoIdComponent) => {
        try {
            // Llamada para obtener componentes
            const componentesResponse = await axios.get(`${apiUrl}/billetes/${productoIdComponent}`);

            // Llamada para obtener el título
            const titleResponse = await axios.get(`${apiUrl}/billetes/${productoIdComponent}/title`);
            if (titleResponse.data && Array.isArray(titleResponse.data) && titleResponse.data.length > 0) {
                setTitleComponente(titleResponse.data[0].title);
            } else if (componentesResponse.data && Array.isArray(componentesResponse.data) && componentesResponse.data.length === 0) {
                setTitleComponente('Producto no encontrado');
            }
        } catch (error) {
            setTitleComponente('');
            setProductoIdComponent('');
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

    const fetchskuComponente = async (productoSkuComponente) => {
        try {
            const response = await axios.get(`${apiUrl}/inventario/ordenBodegas_y_lineasBodegas/producto/${productoSkuComponente}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            // Si llega aquí, significa que hay un resultado válido en el array
            if (Array.isArray(response.data) && response.data.length === 1) {
                const producto = response.data[0];  // Accede al único producto
                setProductoIdComponent(producto.producto_id);
                setProductoSkuComponente(producto.sku);
                await fetchDataComponente(productoIdComponent);
            } else {
                // Para cuando el array no tiene exactamente un elemento
                setSearchTermComponente(productoSkuComponente);
                setOpenComponentes(true);
            }
        } catch (error) {
            // Maneja el caso específico de "Producto no encontrado"
            if (error.response && error.response.data && error.response.data.message === "Producto no encontrado") {
                setSearchTermComponente(productoSkuComponente);
                setOpenComponentes(true);
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

    const addComponent = async () => {
        try {
            const data = {
                producto_id: productoId,
                componente_id: productoIdComponent,
                cantidad: cantidad,
                tipo: tipo
            }
            console.log("Esto es lo que se manda al post:", data);
            const response = await axios.post(`${apiUrl}/billetes/addComponente/${productoId}`, data);
            if (response.data) {
                const message = response.data.message;
                Swal.fire({
                    title: 'Registrado!',
                    text: message,
                    icon: 'success',
                    timer: 5000,
                    showCloseButton: true,
                    allowEscapeKey: true
                });
            }
            fetchData(productoId);
            handleCloseAddComponent();
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
            handleCloseAddComponent();
        }
    }

    const processRowUpdate = async (newRow, oldRow) => {
        try {
            // Enviar la actualización al backend
            const response = await axios.put(`${apiUrl}/billetes/${newRow.billete_id}`, {
                cantidad: newRow.cantidad,
            });

            if (response.data.ok) {
                Swal.fire({
                    title: 'Actualizado!',
                    text: response.data.message,
                    icon: 'success',
                    timer: 3000,
                    showCloseButton: true,
                    allowEscapeKey: true
                });
                return newRow; // Devuelve la fila actualizada
            }
        } catch (error) {
            // Capturar errores del backend
            const errorMessage = error.response?.data?.message || 'Error desconocido';

            Swal.fire({
                title: 'Error',
                text: errorMessage,
                icon: 'error',
                timer: 5000,
                showCloseButton: true,
                allowEscapeKey: true
            });

            return oldRow; // Revertir cambios en la UI
        }
    };

    const handleKeyDown = (event) => {
        console.log("Tecla presionada:", event.key, "SKU:", productoSku); // <-- Verifica el valor
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

    const handleKeyDownComponent = (event) => {
        console.log("Tecla presionada:", event.key, "SKU:", productoSkuComponente); // <-- Verifica el valor
        if (event.key === 'Enter' || event.key === 'Tab' || event.type === 'click') {
            if (productoSkuComponente.trim() === '') {
                return;
            }
            fetchskuComponente(productoSkuComponente);
        }
    };

    const handleBlurComponent = () => {
        if (productoSkuComponente.trim()) {
            fetchskuComponente(productoSkuComponente);
        }
    };

    const handleProductId = (event) => {
        const sku = event.target.value;
        setProductoSku(sku);
        setSearchTerm(sku);
    };

    const handleProductIdComponent = (event) => {
        const skuComponente = event.target.value;
        setProductoSkuComponente(skuComponente);
        setSearchTermComponente(skuComponente);
    };

    const handleRowSelection = (params) => {
        const selectedProduct = rowsProducts.find(product => product.producto_id === params.row.producto_id);

        if (selectedProduct) {
            setProductoSku(selectedProduct.sku);
            setProductoId(selectedProduct.producto_id);
            fetchData(selectedProduct.producto_id);
            setOpen(false);
        }
    };

    const handleRowSelectionComponente = (params) => {
        const selectedProductComponente = rowsComponentes.find(component => component.componente_id === params.row.componente_id);

        if (selectedProductComponente) {
            setProductoSkuComponente(selectedProductComponente.sku);
            setProductoIdComponent(selectedProductComponente.componente_id);
            setOpenComponentes(false);
        }
    };

    const handleChangeTipo = (e) => {
        setTipo(e.target.value);
    }

    const handleChangeCantidad = (e) => {
        setCantidad(parseInt(e.target.value, 10) || 0)
    }

    const deleteComponent = (billete_id) => async (e) => {
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
                        console.log("Este es el id del billete a eliminar:", billete_id);
                        await axios.delete(`${apiUrl}/billetes/${billete_id}`)
                        fetchData(productoId);

                        Swal.fire({
                            title: '¡Eliminado!',
                            text: 'Tu línea ha sido eliminada.',
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

    useEffect(() => {
        // Filtra los productos en base al término de búsqueda
        let filtered = rowsComponentes;

        if (searchTermComponente) {
            const searchWords = searchTermComponente.toLowerCase().split(' ').filter(word => word);

            filtered = filtered.filter(component => {
                const productTitle = component.descripcion ? component.descripcion.toLowerCase() : '';
                const productSku = component.sku ? component.sku.toLowerCase() : '';
                const productProveedor = component.razon_social ? component.razon_social.toLowerCase() : '';
                const productTipo = component.tipo ? component.tipo.toLowerCase() : '';

                // Verifica si todas las palabras están en el título
                const titleMatch = searchWords.every(word => productTitle.includes(word));

                // Verifica si el término de búsqueda está en otras columnas
                const otherColumnsMatch = (
                    productSku.includes(searchTermComponente.toLowerCase()) ||
                    productProveedor.includes(searchTermComponente.toLowerCase()) ||
                    productTipo.includes(searchTermComponente.toLowerCase())
                );

                // El producto debe coincidir en el título o en alguna de las otras columnas
                return titleMatch || otherColumnsMatch;
            });
        }

        setFilteredProductsComponente(filtered);
    }, [searchTermComponente, rowsComponentes]);

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
        { field: 'producto_id', headerName: 'ID producto', type: 'number', flex: 1 },
        { field: 'tipo_publicacion', headerName: 'Tipo\npublicación', type: 'number', flex: 1, headerClassName: 'header-wrap', headerAlign: 'center' },
        { field: 'id', headerName: '#Publicación', type: 'text', flex: 1 },
        { field: 'catalog_id', headerName: '#Catalogo', type: 'text', flex: 1 },
        { field: 'title', headerName: 'Titulo', type: 'text', flex: 3 },
        { field: 'sku', headerName: 'SKU', type: 'text', flex: 2, headerAlign: 'center' },
        { field: 'variation_id', headerName: '#Variación', type: 'number', flex: 1, headerAlign: 'center' },
        { field: 'inventory_id', headerName: 'ML', type: 'text', flex: 1, headerAlign: 'center' },
        { field: 'variation_desc', headerName: 'Variante', type: 'text', flex: 1 },
    ]

    const columnsProductsComponentes = [
        {
            field: 'select',
            headerName: 'Seleccionar',
            width: 150,
            renderCell: (params) => (
                <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    disabled={!rowsComponentes.some(component => component.componente_id === params.row.componente_id)}
                    onClick={() => handleRowSelectionComponente(params)}
                >
                    Seleccionar
                </Button>
            ),
            sortable: false,
            filterable: false,
        },
        { field: 'componente_id', headerName: 'ID Componente', type: 'number', flex: 1 },
        { field: 'sku', headerName: 'SKU', type: 'text', flex: 2, headerClassName: 'header-wrap', headerAlign: 'center' },
        { field: 'descripcion', headerName: 'Descripcion', type: 'text', flex: 3 },
        { field: 'razon_social', headerName: 'Proveedor', type: 'text', flex: 1 },
    ]

    const columns = [
        { field: 'billete_id', headerName: "ID", type: "number", flex: 1, headerAlign: 'center' },
        { field: 'producto_id', headerName: "# De producto", type: "number", flex: 1, headerAlign: 'center' },
        { field: 'componente_id', headerName: "# De componente", type: "text", flex: 1, headerAlign: 'center' },
        { field: 'sku', headerName: "SKU Componente", type: "text", flex: 1, headerAlign: 'center' },
        { field: 'descripcion', headerName: "Descripcion", type: "number", flex: 1, headerAlign: 'center' },
        {
            field: "cantidad", headerName: "Cantidad", type: "number", flex: 1, headerAlign: 'center', editable: true, cellClassName: "celdaEditable",
            renderEditCell: (params) => {
                return (
                    <GridEditInputCell
                        {...params}
                        type="number"
                        inputProps={{
                            min: 1,
                        }}
                        onWheel={(e) => e.target.blur()}
                    />
                )
            },
            preProcessEditCellProps: (params) => {
                const { props } = params;

                // Asegurar que el valor sea al menos 0
                const value = Math.max(1, props.value);

                const isValid = /^[1-9]+$/.test(value);

                return {
                    ...props,
                    value, // Forzar el valor a 0 si es menor
                    error: !isValid,  // Marca la celda con error si la validación falla
                };
            }
        },
        { field: "tipo", headerName: "Tipo", type: "text", flex: 1, headerAlign: 'center' },
        {
            field: "actions",
            headerName: "Acciones",
            type: "actions",
            getActions: (params) => {
                return [
                    <Tooltip title="Borrar componente del billete" key={`delete-${params.row.billete_id}`}>
                        <GridActionsCellItem
                            icon={<GridDeleteIcon />}
                            sx={{ color: "red" }}
                            onClick={deleteComponent(params.row.billete_id)}
                            label="Eliminar"
                        />
                    </Tooltip>
                ]
            }
        }
    ]

    return (
        <div>
            {/* Ventana Modal Productos*/}
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
                    <div style={{ width: '100%', height: 500, overflowX: 'auto' }}>
                        <div style={{ minWidth: columnsProducts.length * 160 }}>
                            <DataGrid style={{ fontFamily: "Montserrat", fontWeight: "bold" }} sx={{ borderRadius: 4, boxShadow: 24, borderWidth: 3, borderColor: "#1e88e5" }}
                                rows={filteredProducts}
                                columns={columnsProducts}
                                pageSize={5}
                                showCellVerticalBorder
                                showColumnVerticalBorder
                                getRowId={(row) => row.producto_id}
                                experimentalFeatures={{ newEditingApi: true }}
                                columnVisibilityModel={columnVisibilityModelProducts}
                                onColumnVisibilityModelChange={(newModel) => setColumnVisibilityModelProducts(newModel)}
                                density="compact" // Establece el tamaño de las filas en compacto por defecto
                                slots={{ toolbar: GridToolbar }}
                                autoWidth
                            />
                        </div>
                    </div>
                    <Button onClick={handleCloseSearchProducts} variant="contained" color="primary"
                        sx={{
                            marginTop: '10px',
                            marginLeft: '93%'
                        }}
                    >Cerrar</Button>
                </Box>
            </Modal>
            {/* Ventana Modal Componentes*/}
            <Modal open={openComponentes} onClose={handleCloseComponentes}>
                <Box sx={modalStyle}>
                    <TextField
                        label="Buscador..."
                        color='primary'
                        focused
                        sx={{ width: '20rem', marginBottom: '10px' }}
                        value={searchTermComponente}
                        onChange={(e) => setSearchTermComponente(e.target.value)}
                    />
                    <div style={{ width: '100%', height: '85%', overflowX: 'auto' }}>
                        <DataGrid style={{ fontFamily: "Montserrat", fontWeight: "bold", width: "100%" }} sx={{ borderRadius: 4, boxShadow: 24, borderWidth: 3, borderColor: "#1e88e5" }}
                            rows={filteredProductsComponente}
                            columns={columnsProductsComponentes}
                            pageSize={5}
                            showCellVerticalBorder
                            showColumnVerticalBorder
                            getRowId={(row) => row.componente_id}
                            experimentalFeatures={{ newEditingApi: true }}
                            density="compact" // Establece el tamaño de las filas en compacto por defecto
                            columnVisibilityModel={{
                                variation_id: false,
                                componente_id: false
                            }}
                        />
                    </div>
                    <Button onClick={handleCloseComponentes} variant="contained" color="primary"
                        sx={{
                            marginTop: '10px',
                            marginLeft: '93%'
                        }}
                    >Cerrar</Button>
                </Box>
            </Modal>
            <div className='contenedor-billetes'>
                <div className='buscador-productos'>
                    <label className='label'>Producto:</label>
                    <TextField
                        className='input'
                        onKeyDown={handleKeyDown}
                        onBlur={handleBlur}
                        value={productoSku}
                        onChange={handleProductId}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position='end'>
                                    <SearchIcon
                                        style={{
                                            cursor: 'pointer',
                                            color: 'blue',
                                        }}
                                        onClick={handleOpenSearchProducts}
                                    />
                                </InputAdornment>
                            ),
                        }}
                        InputLabelProps={{
                            style: {
                                transform: 'translate(10px, 8px)',  // Ajusta la posición del label
                            },
                        }}
                        inputProps={{
                            style: {
                                width: "20rem",
                                height: '5px', // Altura interna del input
                                backgroundColor: 'white',
                                color: 'black',
                            },
                        }}
                    />
                    <label className='label'>Título: {title}</label>
                </div>
            </div>
            <div className='DataG' style={{ height: 500, width: "90%" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                    <Button variant='contained' style={{
                        marginLeft: 'auto',
                        marginBottom: '10px'
                    }}
                        onClick={handleOpenAddComponent}
                    >Agregar componente</Button>
                </div>
                <DataGrid style={{ fontFamily: "Montserrat", fontWeight: "bold" }} sx={{ borderRadius: 4, boxShadow: 24, borderWidth: 3, borderColor: "#1e88e5" }}
                    rows={data}
                    columns={columns}
                    showCellVerticalBorder
                    showColumnVerticalBorder
                    getRowId={(row) => row.billete_id}
                    processRowUpdate={processRowUpdate}
                    columnVisibilityModel={columnVisibilityModel}
                    onColumnVisibilityModelChange={(newModel) => setColumnVisibilityModel(newModel)}
                    experimentalFeatures={{ newEditingApi: true }}
                    density="compact" // Establece el tamaño de las filas en compacto por defecto
                    slots={{ toolbar: GridToolbar }}
                />
            </div>
            {/* Ventana Modal ADD Componente*/}
            <Modal open={openAddComponent} onClose={handleCloseAddComponent}>
                <Box sx={styleAddComponent}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Typography sx={{ fontFamily: 'Montserrat', fontWeight: "bold", textAlign: "center" }}>
                            Agregar nuevo componente
                        </Typography>
                        <TextField
                            className='input'
                            onKeyDown={handleKeyDownComponent}
                            onBlur={handleBlurComponent}
                            label="Componente"
                            variant='outlined'
                            value={productoSkuComponente}
                            onChange={handleProductIdComponent}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position='end'>
                                        <SearchIcon
                                            style={{
                                                cursor: 'pointer',
                                                color: 'blue',
                                            }}
                                            onClick={handleOpenSearchProductsComponentes}
                                        />
                                    </InputAdornment>
                                ),
                            }}
                            inputProps={{
                                style: {
                                    backgroundColor: 'white',
                                    color: 'black',
                                },
                            }}
                        />
                        <TextField
                            className='input'
                            label="Cantidad"
                            variant='outlined'
                            type='number'
                            value={cantidad}
                            onChange={handleChangeCantidad}
                            inputProps={{
                                style: {
                                    backgroundColor: 'white',
                                    color: 'black',
                                },
                            }}
                        />
                        <FormControl>
                            <InputLabel id='select-tipo-label'>Tipo</InputLabel>
                            <Select
                                labelId='select-tipo-label'
                                id='select-tipo'
                                value={tipo}
                                label="Tipo"
                                onChange={handleChangeTipo}
                                inputProps={{
                                    style: {
                                        backgroundColor: 'white',
                                        color: 'black',
                                    },
                                }}
                            >
                                <MenuItem value={"Inventario"}>Inventario</MenuItem>
                                <MenuItem value={"Costo"}>Costo</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                    <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "space-between", marginTop: "40px" }}>
                        <Button onClick={handleCloseAddComponent} variant="contained" color="primary">Cerrar</Button>
                        <Button onClick={addComponent} variant="contained" color="success">Guardar</Button>
                    </Box>
                </Box>
            </Modal>
        </div>
    )
}

export default Componentes