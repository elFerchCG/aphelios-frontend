export const handleRowSelection = (params, rowsProducts, setProductoSku, setProductoId, fetchData, setOpen) => {
    // Encuentra el producto en los datos originales por ID
    const selectedProduct = rowsProducts.find(product => product.producto_id === params.row.producto_id);

    if (selectedProduct) {
        setProductoSku(selectedProduct.sku);
        setProductoId(selectedProduct.producto_id);
        fetchData(selectedProduct.producto_id);
        setOpen(false); // Cierra la modal
    }
};
