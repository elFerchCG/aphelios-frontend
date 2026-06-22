import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  TextField,
  Typography,
  Chip,
  MenuItem,
  Alert,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import HistorialKaizenModal from "./HistorialKaizenModal";

const KaizenVentasPerdidas = () => {
  const [top, setTop] = useState(10);
  const [anio, setAnio] = useState(2026);
  const [semana, setSemana] = useState(21);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [proveedorId, setProveedorId] = useState("");
  const [proveedores, setProveedores] = useState([]);
  const [ordenCosto, setOrdenCosto] = useState("");
  const [totalResultados, setTotalResultados] = useState(0);
  const [limiteResultados, setLimiteResultados] = useState(10);
  const [aniosDisponibles, setAniosDisponibles] = useState([]);
  const [semanasDisponibles, setSemanasDisponibles] = useState([]);
  const [busqueda, setBusqueda] = useState("");

  const [openModal, setOpenModal] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);

  const abrirKaizen = (producto) => {
    setProductoSeleccionado(producto);
    setOpenModal(true);
  };

  const cerrarKaizen = () => {
    setOpenModal(false);
    setProductoSeleccionado(null);
  };

  const apiUrl =
    process.env.NODE_ENV === "production"
      ? process.env.REACT_APP_API_URL
      : process.env.REACT_APP_API_URL_LOCAL;

  const usuarioLocal = JSON.parse(localStorage.getItem("user"));

  const token = localStorage.getItem("token");

  const obtenerRangoSemana = (anioSeleccionado, semanaSeleccionada) => {
    const fecha = new Date(Number(anioSeleccionado), 0, 1);
    const dias = (Number(semanaSeleccionada) - 1) * 7;

    fecha.setDate(fecha.getDate() + dias);

    const diaSemana = fecha.getDay();
    const ajusteLunes = diaSemana === 0 ? -6 : 1 - diaSemana;

    const inicio = new Date(fecha);
    inicio.setDate(fecha.getDate() + ajusteLunes);

    const fin = new Date(inicio);
    fin.setDate(inicio.getDate() + 6);

    const formato = (date) =>
      date.toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });

    return {
      inicio: formato(inicio),
      fin: formato(fin),
    };
  };

  const rangoSemana = obtenerRangoSemana(anio, semana);

  const obtenerKaizen = async () => {
    try {
      setLoading(true);

      const resp = await axios.get(`${apiUrl}/kaizen`, {
        params: {
          top,
          anio,
          semana,
          proveedorId: proveedorId || undefined,
          ordenCosto: ordenCosto || undefined,
          busqueda: busqueda || undefined,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (resp.data.ok) {
        const dataConId = resp.data.data.map((item) => ({
          ...item,
          id: item.producto_id,
        }));

        setRows(dataConId);
        setTotalResultados(Number(resp.data.total || 0));
        setLimiteResultados(Number(resp.data.limit || top));
      }
    } catch (error) {
      console.error("Error al obtener kaizen:", error);
    } finally {
      setLoading(false);
    }
  };

  const obtenerFiltrosKaizen = async (anioSeleccionado = anio) => {
    try {
      const resp = await axios.get(`${apiUrl}/kaizen/filtros`, {
        params: {
          anio: anioSeleccionado,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (resp.data.ok) {
        const { anios = [], semanas = [] } = resp.data.data;

        setAniosDisponibles(anios);
        setSemanasDisponibles(semanas);

        if (anios.length && !anios.includes(Number(anio))) {
          setAnio(anios[0]);
        }

        if (semanas.length && !semanas.includes(Number(semana))) {
          setSemana(semanas[0]);
        }
      }
    } catch (error) {
      console.error("Error al obtener filtros Kaizen:", error);
    }
  };

  const obtenerProveedores = async () => {
    try {
      const resp = await axios.get(`${apiUrl}/proveedores`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = Array.isArray(resp.data) ? resp.data : resp.data.data || [];

      setProveedores(data);
    } catch (error) {
      console.error("Error al obtener proveedores:", error);
    }
  };

  useEffect(() => {
    obtenerProveedores();
    obtenerFiltrosKaizen();
    obtenerKaizen();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      obtenerKaizen();
    }, 500);

    return () => clearTimeout(timeout);
  }, [busqueda, top, anio, semana, proveedorId, ordenCosto]);

  const columns = [
    {
      field: "title",
      headerName: "Producto",
      flex: 2,
      minWidth: 320,
      renderCell: (params) => {
        const url = params.row.permalink;

        if (!url) {
          return params.value;
        }

        return (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "#1976d2",
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            {params.value}
          </a>
        );
      },
    },
    {
      field: "sku",
      headerName: "SKU",
      flex: 1,
      minWidth: 160,
    },
    {
      field: "ventas_reales",
      headerName: "Ventas",
      width: 110,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "costo_producto",
      headerName: "Costo",
      width: 130,
      align: "center",
      headerAlign: "center",
      renderCell: (params) =>
        Number(params.value || 0).toLocaleString("es-MX", {
          style: "currency",
          currency: "MXN",
        }),
    },
    {
      field: "pronostico",
      headerName: "Pronóstico",
      width: 130,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "diferencia",
      headerName: "Diferencia",
      width: 130,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={params.value < 0 ? "error" : "success"}
          size="small"
        />
      ),
    },
    {
      field: "stock_total",
      headerName: "Stock Total",
      width: 130,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "fecha_seguimiento_kaizen",
      headerName: "Fecha Seguimiento",
      width: 170,
      renderCell: (params) => {
        if (!params.value) return "";

        return new Date(params.value).toLocaleDateString("es-MX", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
      },
    },
    {
      field: "accion",
      headerName: "Acción",
      width: 180,
      align: "center",
      headerAlign: "center",
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Button
          variant="contained"
          size="small"
          color={params.row.tieneAccionKaizen ? "inherit" : "primary"}
          onClick={() => abrirKaizen(params.row)}
        >
          {params.row.tieneAccionKaizen ? "Acción tomada" : "KAIZEN"}
        </Button>
      ),
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight="bold" mb={2}>
        Kaizen Ventas no cumplidas
      </Typography>

      <Card sx={{ mb: 3, backgroundColor: "#f8f9fa" }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            ¿Qué es Kaizen Ventas no Cumplidas?
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Este módulo ayuda a identificar los productos que no alcanzaron su
            pronóstico de ventas. El objetivo es registrar acciones de mejora,
            dar seguimiento a los resultados y tomar decisiones oportunas para
            incrementar las ventas o reducir el inventario.
          </Typography>
        </CardContent>
      </Card>

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 2,
          mb: 2,
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            flex: 1,
          }}
        >
          <Stack direction="row" spacing={2} flexWrap="wrap">
            <TextField
              label="Top"
              type="number"
              size="small"
              value={top}
              inputProps={{ min: 1, step: 1 }}
              onChange={(e) => {
                setTop(e.target.value);
              }}
              onBlur={() => {
                if (!top || Number(top) < 1) {
                  setTop("1");
                }
              }}
              sx={{ width: 140 }}
            />

            <TextField
              select
              label="Año"
              size="small"
              value={anio}
              onChange={(e) => {
                const nuevoAnio = Number(e.target.value);
                setAnio(nuevoAnio);
                obtenerFiltrosKaizen(nuevoAnio);
              }}
              sx={{ width: 140 }}
            >
              {aniosDisponibles.map((anioItem) => (
                <MenuItem key={anioItem} value={anioItem}>
                  {anioItem}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Semana"
              size="small"
              value={semana}
              onChange={(e) => setSemana(Number(e.target.value))}
              sx={{ width: 160 }}
            >
              {semanasDisponibles.map((semanaItem) => (
                <MenuItem key={semanaItem} value={semanaItem}>
                  Semana {semanaItem}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Proveedor"
              size="small"
              value={proveedorId}
              onChange={(e) => setProveedorId(e.target.value)}
              sx={{ minWidth: 260 }}
            >
              <MenuItem value="">Todos</MenuItem>

              {proveedores.map((proveedor) => (
                <MenuItem
                  key={proveedor.id_proveedor}
                  value={proveedor.id_proveedor}
                >
                  {proveedor.razon_social}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Orden costo"
              size="small"
              value={ordenCosto}
              onChange={(e) => setOrdenCosto(e.target.value)}
              sx={{ minWidth: 190 }}
            >
              <MenuItem value="">Diferencia</MenuItem>
              <MenuItem value="asc">Costo menor a mayor</MenuItem>
              <MenuItem value="desc">Costo mayor a menor</MenuItem>
            </TextField>
          </Stack>

          <TextField
            label="Buscar producto o SKU"
            size="small"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Escribe un SKU o nombre del producto..."
            sx={{ maxWidth: 480 }}
          />
        </Box>

        <Button variant="outlined" onClick={obtenerKaizen}>
          Actualizar pendientes
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: 2 }}>
        <strong>Periodo analizado:</strong> Semana {semana} del {anio} del{" "}
        {rangoSemana.inicio} al {rangoSemana.fin}. Los productos mostrados no
        alcanzaron su pronóstico de ventas durante este periodo.
      </Alert>

      {totalResultados > rows.length && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Mostrando {rows.length} de {totalResultados} productos encontrados.
          Aumenta el Top si deseas ver más resultados.
        </Alert>
      )}

      <Box sx={{ width: "100%", overflowX: "auto" }}>
        <Box
          sx={{
            minWidth: 1450,
            height: 600,
          }}
        >
          <DataGrid
            sx={{
              height: "100%",
              "& .MuiDataGrid-main": {
                height: "100%",
              },
              "& .MuiDataGrid-virtualScroller": {
                minHeight: "100%",
              },
            }}
            rows={rows}
            columns={columns}
            loading={loading}
            pageSizeOptions={[10, 25, 50, 100]}
            initialState={{
              pagination: {
                paginationModel: {
                  pageSize: 50,
                },
              },
            }}
            getRowClassName={(params) =>
              params.row.tieneAccionKaizen ? "row-kaizen-tomado" : ""
            }
            disableRowSelectionOnClick
          />
        </Box>
      </Box>

      <HistorialKaizenModal
        open={openModal}
        onClose={cerrarKaizen}
        producto={productoSeleccionado}
        onAccionRegistrada={(productoId) => {
          setRows((prevRows) =>
            prevRows.map((row) =>
              row.producto_id === productoId
                ? { ...row, tieneAccionKaizen: true }
                : row,
            ),
          );
        }}
      />
    </Box>
  );
};

export default KaizenVentasPerdidas;
