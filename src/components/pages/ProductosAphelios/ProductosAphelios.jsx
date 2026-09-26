import React, { useCallback, useEffect, useState } from "react";
import {
  Box,
  Chip,
  FormControl,
  InputAdornment,
  MenuItem,
  Select,
  TextField,
  Tooltip,
  IconButton,
} from "@mui/material";

import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";

import axios from "axios";

// =====================================================
// COMPONENTES COMUNES APHELIOS
// Ajusta la ruta según dónde esté este módulo
// =====================================================

import PageHeader from "../../common/PageHeader";
import PageToolbarCard from "../../common/PageToolbarCard";
import AppDataGrid from "../../common/AppDataGrid";
import ProductoApheliosDetalleModal from "./components/ProductoApheliosDetalleModal";
import SeleccionarPublicacionModal from "./components/SeleccionarPublicacionModal";
import { toolbarFieldSx, fieldWidths } from "../../common/formStyles";

const API_URL =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_URL
    : process.env.REACT_APP_API_URL_LOCAL;

const ProductosAphelios = () => {
  // =====================================================
  // ESTADOS
  // =====================================================

  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(false);

  const [total, setTotal] = useState(0);

  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 25,
  });

  const [busqueda, setBusqueda] = useState("");
  const [busquedaAplicada, setBusquedaAplicada] = useState("");

  const [estado, setEstado] = useState("todos");
  const [productoSeleccionadoId, setProductoSeleccionadoId] = useState(null);

  const [openDetalle, setOpenDetalle] = useState(false);

  const [productoPublicaciones, setProductoPublicaciones] = useState(null);

  const [openPublicaciones, setOpenPublicaciones] = useState(false);

  // =====================================================
  // OBTENER PRODUCTOS
  // =====================================================

  const obtenerProductos = useCallback(async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      const response = await axios.get(`${API_URL}/productosAphelios`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          pagina: paginationModel.page + 1,
          limite: paginationModel.pageSize,
          busqueda: busquedaAplicada,
          estado,
        },
      });

      setProductos(response.data.productos || []);
      setTotal(response.data.paginacion?.total || 0);
    } catch (error) {
      console.error("Error al obtener Productos Aphelios:", error);

      setProductos([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [
    paginationModel.page,
    paginationModel.pageSize,
    busquedaAplicada,
    estado,
  ]);

  const handleClickImagen = (producto) => {
    const items = producto?.mercado_libre?.items || [];

    const itemsConLink = items.filter((item) => item.permalink);

    // Sin publicaciones navegables
    if (itemsConLink.length === 0) {
      return;
    }

    // Una sola publicación:
    // abrir directamente Mercado Libre
    if (itemsConLink.length === 1) {
      window.open(itemsConLink[0].permalink, "_blank", "noopener,noreferrer");

      return;
    }

    // Varias publicaciones:
    // mostrar selector
    setProductoPublicaciones({
      ...producto,
      mercado_libre: {
        ...producto.mercado_libre,
        items: itemsConLink,
      },
    });

    setOpenPublicaciones(true);
  };

  // =====================================================
  // DEBOUNCE BÚSQUEDA
  // =====================================================

  useEffect(() => {
    const timeout = setTimeout(() => {
      setPaginationModel((prev) => ({
        ...prev,
        page: 0,
      }));

      setBusquedaAplicada(busqueda.trim());
    }, 500);

    return () => clearTimeout(timeout);
  }, [busqueda]);

  // =====================================================
  // CARGAR PRODUCTOS
  // =====================================================

  useEffect(() => {
    obtenerProductos();
  }, [obtenerProductos]);

  // =====================================================
  // CAMBIO DE ESTADO
  // =====================================================

  const handleEstadoChange = (event) => {
    setEstado(event.target.value);

    setPaginationModel((prev) => ({
      ...prev,
      page: 0,
    }));
  };

  // =====================================================
  // VER PRODUCTO
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
  // COLUMNAS
  // =====================================================

  const columns = [
    {
      field: "imagen",
      headerName: "Imagen",
      width: 90,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,

      renderCell: (params) => {
        const producto = params.row;
        const ml = producto?.mercado_libre;

        const imagen = ml?.thumbnail_url;

        const itemsConLink = ml?.items?.filter((item) => item.permalink) || [];

        let tooltip = "Sin publicaciones";

        if (itemsConLink.length === 1) {
          tooltip = "Ver en Mercado Libre";
        }

        if (itemsConLink.length > 1) {
          tooltip = `Elegir entre ${itemsConLink.length} publicaciones`;
        }

        if (!imagen) {
          return (
            <Tooltip title="Sin imagen">
              <Box
                sx={{
                  width: 52,
                  height: 52,
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "text.disabled",
                }}
              >
                <ImageOutlinedIcon fontSize="small" />
              </Box>
            </Tooltip>
          );
        }

        return (
          <Tooltip title={tooltip} arrow>
            <Box
              component="img"
              src={imagen}
              alt={producto.nombre || producto.sku}
              onClick={() => handleClickImagen(producto)}
              sx={{
                width: 52,
                height: 52,
                objectFit: "contain",

                borderRadius: 1,
                border: "1px solid",
                borderColor: "divider",

                cursor: itemsConLink.length > 0 ? "pointer" : "default",

                transition: "transform 0.15s ease, box-shadow 0.15s ease",

                "&:hover": {
                  transform: itemsConLink.length > 0 ? "scale(1.06)" : "none",

                  boxShadow: itemsConLink.length > 0 ? 2 : "none",
                },
              }}
            />
          </Tooltip>
        );
      },
    },
    {
      field: "sku",
      headerName: "SKU",
      minWidth: 160,
      flex: 0.8,
    },
    {
      field: "nombre",
      headerName: "Producto",
      minWidth: 300,
      flex: 2,
    },
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
    {
      field: "stock",
      headerName: "Stock ML",
      width: 120,
      align: "center",
      headerAlign: "center",
      sortable: false,

      valueGetter: (value, row) => row?.mercado_libre?.stock ?? 0,

      renderCell: (params) => (
        <Chip
          size="small"
          icon={<Inventory2OutlinedIcon />}
          label={params.value ?? 0}
          variant="outlined"
        />
      ),
    },
    {
      field: "user_product_id",
      headerName: "User Product",
      width: 175,
      sortable: false,

      valueGetter: (value, row) => row?.mercado_libre?.user_product_id || "",
    },
    {
      field: "cantidad_items",
      headerName: "Items",
      width: 100,
      align: "center",
      headerAlign: "center",
      sortable: false,

      valueGetter: (value, row) => row?.mercado_libre?.cantidad_items ?? 0,

      renderCell: (params) => (
        <Chip
          size="small"
          icon={<StorefrontOutlinedIcon />}
          label={params.value ?? 0}
          variant="outlined"
        />
      ),
    },
    {
      field: "canales",
      headerName: "Canales",
      minWidth: 180,
      flex: 0.7,
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        const tieneMercadoLibre = Boolean(
          params.row?.mercado_libre?.user_product_id,
        );

        return (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.7,
              flexWrap: "wrap",
            }}
          >
            {tieneMercadoLibre && (
              <Chip
                icon={<StorefrontOutlinedIcon />}
                label="Mercado Libre"
                size="small"
                variant="outlined"
              />
            )}
          </Box>
        );
      },
    },
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
          HEADER ESTÁNDAR
      ================================================= */}

      <PageHeader
        icon={CategoryOutlinedIcon}
        title="Productos Aphelios"
        subtitle="Administra el catálogo interno y su relación con Mercado Libre."
      />

      {/* =================================================
          TOOLBAR ESTÁNDAR
      ================================================= */}

      <PageToolbarCard>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          {/* BUSCADOR */}

          <TextField
            label="Buscar producto"
            placeholder="SKU, nombre, MLMU, MLM o Family"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            sx={{
              ...toolbarFieldSx,
              width: fieldWidths.large,
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchOutlinedIcon />
                </InputAdornment>
              ),
            }}
          />

          {/* FILTRO ESTADO */}

          <FormControl
            sx={{
              ...toolbarFieldSx,
              width: fieldWidths.medium,
            }}
          >
            <Select value={estado} onChange={handleEstadoChange} displayEmpty>
              <MenuItem value="todos">Todos</MenuItem>

              <MenuItem value="activos">Activos</MenuItem>

              <MenuItem value="obsoletos">Obsoletos</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </PageToolbarCard>

      {/* =================================================
          DATAGRID ESTÁNDAR
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
          rowHeight={64}
          exportFileName="productos-aphelios"
          rowCount={total}
          paginationMode="server"
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[10, 25, 50, 100]}
          initialColumnVisibilityModel={{
            producto_id_legacy: false,
          }}
        />
        <ProductoApheliosDetalleModal
          open={openDetalle}
          onClose={handleCerrarDetalle}
          productoId={productoSeleccionadoId}
        />
        <SeleccionarPublicacionModal
          open={openPublicaciones}
          onClose={() => {
            setOpenPublicaciones(false);
            setProductoPublicaciones(null);
          }}
          producto={productoPublicaciones}
        />
      </Box>
    </>
  );
};

export default ProductosAphelios;
