import React, { useState } from "react";

import { Box, Chip, IconButton, Tooltip } from "@mui/material";

import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";

import PageHeader from "../../common/PageHeader";
import AppDataGrid from "../../common/AppDataGrid";

import ProductoApheliosDetalleModal from "./components/ProductoApheliosDetalleModal";
import SeleccionarPublicacionModal from "./components/SeleccionarPublicacionModal";

import ProductosApheliosToolbar from "./components/ProductosApheliosToolbar";
import ProductoCell from "./components/ProductoCell";
import ProductoMetricCell from "./components/ProductoMetricCell";
import ProductoCuentasCell from "./components/ProductoCuentasCell";

import useProductosAphelios from "./hooks/useProductosAphelios";

import { getItemsMercadoLibre } from "./utils/productosApheliosHelpers";

const ProductosAphelios = () => {
  // =====================================================
  // PRODUCTOS / FILTROS / PAGINACIÓN
  // =====================================================

  const {
    productos,
    loading,
    total,

    paginationModel,
    setPaginationModel,

    busqueda,
    setBusqueda,

    estado,
    handleEstadoChange,
  } = useProductosAphelios();

  // =====================================================
  // DETALLE
  // =====================================================

  const [productoSeleccionadoId, setProductoSeleccionadoId] = useState(null);

  const [openDetalle, setOpenDetalle] = useState(false);

  // =====================================================
  // PUBLICACIONES
  // =====================================================

  const [productoPublicaciones, setProductoPublicaciones] = useState(null);

  const [openPublicaciones, setOpenPublicaciones] = useState(false);

  // =====================================================
  // CLICK IMAGEN
  // =====================================================

  const handleClickImagen = (producto) => {
    const relaciones = Array.isArray(producto?.mercado_libre)
      ? producto.mercado_libre
      : [];

    const publicaciones = relaciones.flatMap((relacion) =>
      Array.isArray(relacion?.items)
        ? relacion.items.filter((item) => item?.permalink)
        : [],
    );

    // =====================================================
    // SIN PUBLICACIONES
    // =====================================================

    if (publicaciones.length === 0) {
      return;
    }

    // =====================================================
    // UNA SOLA PUBLICACIÓN
    // =====================================================

    if (publicaciones.length === 1) {
      window.open(publicaciones[0].permalink, "_blank", "noopener,noreferrer");

      return;
    }

    // =====================================================
    // VARIAS PUBLICACIONES
    // Mandamos el producto ORIGINAL.
    // No alteramos mercado_libre.
    // =====================================================

    setProductoPublicaciones(producto);
    setOpenPublicaciones(true);
  };

  // =====================================================
  // VER DETALLE
  // =====================================================

  const handleVerProducto = (producto) => {
    setProductoSeleccionadoId(producto.id);

    setOpenDetalle(true);
  };

  const handleCerrarDetalle = () => {
    setOpenDetalle(false);

    setProductoSeleccionadoId(null);
  };

  // =====================================================
  // CERRAR PUBLICACIONES
  // =====================================================

  const handleCerrarPublicaciones = () => {
    setOpenPublicaciones(false);

    setProductoPublicaciones(null);
  };

  // =====================================================
  // COLUMNAS
  // =====================================================

  const columns = [
    // ===================================================
    // PRODUCTO
    // Imagen + SKU + nombre
    // ===================================================

    {
      field: "producto",
      headerName: "Producto",

      minWidth: 480,
      flex: 1,

      sortable: false,
      filterable: false,
      disableColumnMenu: true,

      renderCell: (params) => (
        <ProductoCell producto={params.row} onClickImagen={handleClickImagen} />
      ),
    },

    // ===================================================
    // COSTO
    // ===================================================

    {
      field: "costo",
      headerName: "Costo",

      width: 120,

      align: "right",
      headerAlign: "right",

      renderCell: (params) => {
        const costo = Number(params.value || 0);

        return `$${costo.toLocaleString("es-MX", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`;
      },
    },

    // ===================================================
    // STOCK ML
    // ===================================================

    {
      field: "stock_ml_total",
      headerName: "Stock ML",

      width: 120,

      align: "center",
      headerAlign: "center",

      sortable: false,

      valueGetter: (value, row) => Number(row?.stock_ml_total || 0),

      renderCell: (params) => (
        <ProductoMetricCell type="stock" value={params.value} />
      ),
    },

    // ===================================================
    // RELACIONES ML
    // ===================================================

    {
      field: "cantidad_relaciones_ml",

      headerName: "Relaciones ML",

      width: 140,

      align: "center",
      headerAlign: "center",

      sortable: false,

      valueGetter: (value, row) => Number(row?.cantidad_relaciones_ml || 0),

      renderCell: (params) => (
        <ProductoMetricCell type="relations" value={params.value} />
      ),
    },

    // ===================================================
    // ITEMS
    // ===================================================

    {
      field: "items_ml_total",
      headerName: "Items",

      width: 100,

      align: "center",
      headerAlign: "center",

      sortable: false,

      valueGetter: (value, row) => Number(row?.items_ml_total || 0),

      renderCell: (params) => (
        <ProductoMetricCell type="items" value={params.value} />
      ),
    },

    // ===================================================
    // CUENTAS
    // ===================================================

    {
      field: "cuentas_ml",
      headerName: "Cuentas",

      width: 220,

      sortable: false,
      filterable: false,

      renderCell: (params) => <ProductoCuentasCell producto={params.row} />,
    },

    // ===================================================
    // ESTADO
    // ===================================================

    {
      field: "estado",
      headerName: "Estado",

      width: 120,

      align: "center",
      headerAlign: "center",

      sortable: false,

      valueGetter: (value, row) =>
        row.producto_obsoleto ? "Obsoleto" : "Activo",

      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          color={params.value === "Activo" ? "success" : "default"}
          variant="outlined"
        />
      ),
    },

    // ===================================================
    // ACCIONES
    // ===================================================

    {
      field: "acciones",
      headerName: "Acciones",

      width: 100,

      align: "center",
      headerAlign: "center",

      sortable: false,
      filterable: false,

      renderCell: (params) => (
        <Tooltip title="Ver producto">
          <IconButton
            size="small"
            color="primary"
            onClick={() => handleVerProducto(params.row)}
          >
            <VisibilityOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <>
      {/* =================================================
          HEADER
      ================================================= */}

      <PageHeader
        icon={CategoryOutlinedIcon}
        title="Productos Aphelios"
        subtitle="Administra el catálogo interno y su relación con Mercado Libre."
      />

      {/* =================================================
          TOOLBAR
      ================================================= */}

      <ProductosApheliosToolbar
        busqueda={busqueda}
        onBusquedaChange={setBusqueda}
        estado={estado}
        onEstadoChange={handleEstadoChange}
      />

      {/* =================================================
          DATAGRID
      ================================================= */}

      <Box
        sx={{
          mx: "30px",
        }}
      >
        <AppDataGrid
          rows={productos}
          columns={columns}
          loading={loading}
          getRowId={(row) => row.id}
          rowHeight={72}
          exportFileName="productos-aphelios"
          rowCount={total}
          paginationMode="server"
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[10, 25, 50, 100]}
        />

        {/* =================================================
            DETALLE
        ================================================= */}

        <ProductoApheliosDetalleModal
          open={openDetalle}
          onClose={handleCerrarDetalle}
          productoId={productoSeleccionadoId}
        />

        {/* =================================================
            SELECTOR PUBLICACIONES
        ================================================= */}

        <SeleccionarPublicacionModal
          open={openPublicaciones}
          onClose={handleCerrarPublicaciones}
          producto={productoPublicaciones}
        />
      </Box>
    </>
  );
};

export default ProductosAphelios;
