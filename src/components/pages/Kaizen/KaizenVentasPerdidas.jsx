import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import HistorialKaizenModal from "./HistorialKaizenModal";

const obtenerAnioSemanaActualISO = () => {
  const fecha = new Date();
  const fechaUTC = new Date(
    Date.UTC(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()),
  );

  const dia = fechaUTC.getUTCDay() || 7;

  fechaUTC.setUTCDate(fechaUTC.getUTCDate() + 4 - dia);

  const anioISO = fechaUTC.getUTCFullYear();

  const inicioAnio = new Date(Date.UTC(anioISO, 0, 1));

  const semanaISO = Math.ceil(((fechaUTC - inicioAnio) / 86400000 + 1) / 7);

  return {
    anio: anioISO,
    semana: semanaISO,
  };
};

const obtenerInicioSemanaISO = (anio, semana) => {
  const enero4 = new Date(Date.UTC(Number(anio), 0, 4));

  const diaSemana = enero4.getUTCDay() || 7;

  const lunesSemana1 = new Date(enero4);

  lunesSemana1.setUTCDate(enero4.getUTCDate() - diaSemana + 1);

  const fecha = new Date(lunesSemana1);

  fecha.setUTCDate(lunesSemana1.getUTCDate() + (Number(semana) - 1) * 7);

  fecha.setUTCHours(0, 0, 0, 0);

  return fecha;
};

const formatearFecha = (fecha) =>
  fecha.toLocaleDateString("es-MX", {
    timeZone: "UTC",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

const formatearOpcionSemana = (anio, semana) => {
  const inicio = obtenerInicioSemanaISO(anio, semana);

  return `Semana ${semana} — lunes ${formatearFecha(inicio)}`;
};

const formatearFechaBackend = (valor) => {
  if (!valor) {
    return "";
  }

  const fecha = new Date(valor);

  if (Number.isNaN(fecha.getTime())) {
    return "";
  }

  return fecha.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  });
};

const KaizenVentasPerdidas = () => {
  const periodoActual = obtenerAnioSemanaActualISO();

  const [top, setTop] = useState(10);

  const [anioInicio, setAnioInicio] = useState(periodoActual.anio);

  const [semanaInicio, setSemanaInicio] = useState(periodoActual.semana);

  const [anioFin, setAnioFin] = useState(periodoActual.anio);

  const [semanaFin, setSemanaFin] = useState(periodoActual.semana);

  const [aniosDisponibles, setAniosDisponibles] = useState([]);

  const [semanasInicioDisponibles, setSemanasInicioDisponibles] = useState([]);

  const [semanasFinDisponibles, setSemanasFinDisponibles] = useState([]);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const [proveedorId, setProveedorId] = useState("");

  const [proveedores, setProveedores] = useState([]);

  const [busqueda, setBusqueda] = useState("");

  const [totalResultados, setTotalResultados] = useState(0);

  const [mensajeError, setMensajeError] = useState("");

  const [openModal, setOpenModal] = useState(false);

  const [productoSeleccionado, setProductoSeleccionado] = useState(null);

  const apiUrl =
    process.env.NODE_ENV === "production"
      ? process.env.REACT_APP_API_URL
      : process.env.REACT_APP_API_URL_LOCAL;

  const token = localStorage.getItem("token");

  const formatearMoneda = (valor) =>
    Number(valor || 0).toLocaleString("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const llaveInicio = Number(anioInicio) * 100 + Number(semanaInicio);

  const llaveFin = Number(anioFin) * 100 + Number(semanaFin);

  const llaveActual = periodoActual.anio * 100 + periodoActual.semana;

  const rangoValido = llaveInicio <= llaveFin && llaveFin <= llaveActual;

  const semanasInicioPermitidas = useMemo(() => {
    return semanasInicioDisponibles
      .map(Number)
      .filter((semanaItem) => {
        const llave = Number(anioInicio) * 100 + semanaItem;

        return llave <= llaveActual;
      })
      .sort((a, b) => b - a);
  }, [semanasInicioDisponibles, anioInicio, llaveActual]);

  const semanasFinPermitidas = useMemo(() => {
    return semanasFinDisponibles
      .map(Number)
      .filter((semanaItem) => {
        const llave = Number(anioFin) * 100 + semanaItem;

        return llave >= llaveInicio && llave <= llaveActual;
      })
      .sort((a, b) => b - a);
  }, [semanasFinDisponibles, anioFin, llaveInicio, llaveActual]);

  const rangoVisual = useMemo(() => {
    const inicio = obtenerInicioSemanaISO(anioInicio, semanaInicio);

    const fin = obtenerInicioSemanaISO(anioFin, semanaFin);

    fin.setUTCDate(fin.getUTCDate() + 6);

    return {
      inicio: formatearFecha(inicio),
      fin: formatearFecha(fin),
    };
  }, [anioInicio, semanaInicio, anioFin, semanaFin]);

  const abrirKaizen = (producto) => {
    setProductoSeleccionado(producto);
    setOpenModal(true);
  };

  const cerrarKaizen = () => {
    setOpenModal(false);
    setProductoSeleccionado(null);
  };

  const consultarFiltrosKaizen = async (anioSeleccionado) => {
    const resp = await axios.get(`${apiUrl}/kaizen/filtros`, {
      params: {
        anio: anioSeleccionado,
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!resp.data.ok) {
      return {
        anios: [],
        semanas: [],
      };
    }

    return {
      anios: resp.data.data?.anios || [],
      semanas: resp.data.data?.semanas || [],
    };
  };

  const cargarSemanasInicio = async () => {
    try {
      const resultado = await consultarFiltrosKaizen(anioInicio);

      if (resultado.anios.length) {
        setAniosDisponibles(resultado.anios);
      }

      const semanas = resultado.semanas
        .map(Number)
        .filter((item) => {
          const llave = Number(anioInicio) * 100 + item;

          return llave <= llaveActual;
        })
        .sort((a, b) => b - a);

      setSemanasInicioDisponibles(semanas);

      if (semanas.length && !semanas.includes(Number(semanaInicio))) {
        setSemanaInicio(semanas[0]);
      }
    } catch (error) {
      console.error("Error al obtener semanas iniciales:", error);
    }
  };

  const cargarSemanasFin = async () => {
    try {
      const resultado = await consultarFiltrosKaizen(anioFin);

      if (resultado.anios.length) {
        setAniosDisponibles(resultado.anios);
      }

      const semanas = resultado.semanas
        .map(Number)
        .filter((item) => {
          const llave = Number(anioFin) * 100 + item;

          return llave <= llaveActual;
        })
        .sort((a, b) => b - a);

      setSemanasFinDisponibles(semanas);

      const semanasValidas = semanas.filter(
        (item) => Number(anioFin) * 100 + item >= llaveInicio,
      );

      if (
        semanasValidas.length &&
        !semanasValidas.includes(Number(semanaFin))
      ) {
        setSemanaFin(semanasValidas[0]);
      }
    } catch (error) {
      console.error("Error al obtener semanas finales:", error);
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

  const obtenerKaizen = async () => {
    if (!rangoValido) {
      setRows([]);
      setTotalResultados(0);

      setMensajeError(
        "La semana inicial debe ser anterior o igual a la semana final y la semana final no puede ser futura.",
      );

      return;
    }

    try {
      setLoading(true);
      setMensajeError("");

      const resp = await axios.get(`${apiUrl}/kaizen`, {
        params: {
          top: Number(top) || 10,

          anioInicio,
          semanaInicio,

          anioFin,
          semanaFin,

          proveedorId: proveedorId || undefined,

          busqueda: busqueda || undefined,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (resp.data.ok) {
        const dataConId = (resp.data.data || []).map((item) => ({
          ...item,
          id: item.producto_id,
        }));

        setRows(dataConId);

        setTotalResultados(Number(resp.data.total || 0));
      }
    } catch (error) {
      console.error("Error al obtener Kaizen:", error);

      setRows([]);
      setTotalResultados(0);

      setMensajeError(
        error.response?.data?.message ||
          "No fue posible obtener la información del periodo seleccionado.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    obtenerProveedores();
  }, []);

  useEffect(() => {
    cargarSemanasInicio();
  }, [anioInicio]);

  useEffect(() => {
    cargarSemanasFin();
  }, [anioFin, llaveInicio]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      obtenerKaizen();
    }, 500);

    return () => clearTimeout(timeout);
  }, [
    busqueda,
    top,
    anioInicio,
    semanaInicio,
    anioFin,
    semanaFin,
    proveedorId,
  ]);

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
      field: "publicacion_id",
      headerName: "MLM",
      minWidth: 160,
      flex: 1,
      renderCell: (params) => (
        <Box
          sx={{
            height: "100%",
            display: "flex",
            alignItems: "center",
          }}
        >
          <Typography variant="body2">{params.value || "-"}</Typography>
        </Box>
      ),
    },

    {
      field: "user_product_id",
      headerName: "MLMU",
      minWidth: 180,
      flex: 1,
      renderCell: (params) => (
        <Box
          sx={{
            height: "100%",
            display: "flex",
            alignItems: "center",
          }}
        >
          <Typography variant="body2">{params.value || "-"}</Typography>
        </Box>
      ),
    },

    {
      field: "logistic_type",
      headerName: "Logística",
      width: 140,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => {
        const logisticType = String(params.value || "")
          .trim()
          .toLowerCase();

        let label = params.value || "-";
        let color = "default";

        if (logisticType === "fulfillment") {
          label = "Fulfillment";
          color = "success";
        } else if (logisticType === "cross_docking") {
          label = "Cross docking";
          color = "primary";
        } else if (logisticType === "xd_drop_off") {
          label = "Drop off";
          color = "warning";
        }

        return (
          <Chip label={label} color={color} size="small" variant="outlined" />
        );
      },
    },
    {
      field: "ventas_dinero",
      headerName: "Ventas $",
      width: 150,
      align: "right",
      headerAlign: "right",
      type: "number",
      valueFormatter: (value) => formatearMoneda(value),
    },
    {
      field: "pronostico_dinero",
      headerName: "Pronóstico $",
      width: 160,
      align: "right",
      headerAlign: "right",
      type: "number",
      valueFormatter: (value) => formatearMoneda(value),
    },
    {
      field: "diferencia_dinero",
      headerName: "Diferencia $",
      width: 180,
      align: "center",
      headerAlign: "center",
      type: "number",
      renderCell: (params) => (
        <Chip
          label={formatearMoneda(params.value)}
          color={Number(params.value || 0) < 0 ? "error" : "success"}
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      field: "stock_fisico",
      headerName: "Stock Físico",
      width: 130,
      align: "center",
      headerAlign: "center",
    },

    {
      field: "stock_ml",
      headerName: "Stock ML",
      width: 120,
      align: "center",
      headerAlign: "center",
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
      headerName: "Fecha seguimiento",
      width: 170,
      renderCell: (params) => formatearFechaBackend(params.value),
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

      <Card
        sx={{
          mb: 3,
          backgroundColor: "#f8f9fa",
        }}
      >
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            ¿Qué es Kaizen Ventas no Cumplidas?
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Este módulo identifica los productos que no alcanzaron su pronóstico
            de ventas dentro del rango seleccionado y los prioriza por el
            importe económico dejado de vender.
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
          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
            <TextField
              label="Top"
              type="number"
              size="small"
              value={top}
              inputProps={{
                min: 1,
                step: 1,
              }}
              onChange={(e) => setTop(e.target.value)}
              onBlur={() => {
                if (!top || Number(top) < 1) {
                  setTop(1);
                }
              }}
              sx={{ width: 110 }}
            />

            <TextField
              select
              label="Año inicial"
              size="small"
              value={anioInicio}
              onChange={(e) => setAnioInicio(Number(e.target.value))}
              sx={{ width: 135 }}
            >
              {aniosDisponibles.map((anioItem) => (
                <MenuItem key={anioItem} value={anioItem}>
                  {anioItem}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Semana inicial"
              size="small"
              value={semanaInicio}
              onChange={(e) => setSemanaInicio(Number(e.target.value))}
              sx={{ minWidth: 285 }}
            >
              {semanasInicioPermitidas.map((semanaItem) => (
                <MenuItem key={semanaItem} value={semanaItem}>
                  {formatearOpcionSemana(anioInicio, semanaItem)}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Año final"
              size="small"
              value={anioFin}
              onChange={(e) => setAnioFin(Number(e.target.value))}
              sx={{ width: 135 }}
            >
              {aniosDisponibles.map((anioItem) => (
                <MenuItem key={anioItem} value={anioItem}>
                  {anioItem}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Semana final"
              size="small"
              value={semanaFin}
              onChange={(e) => setSemanaFin(Number(e.target.value))}
              sx={{ minWidth: 285 }}
            >
              {semanasFinPermitidas.map((semanaItem) => (
                <MenuItem key={semanaItem} value={semanaItem}>
                  {formatearOpcionSemana(anioFin, semanaItem)}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Proveedor"
              size="small"
              value={proveedorId}
              onChange={(e) => setProveedorId(e.target.value)}
              sx={{ minWidth: 250 }}
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
          </Stack>

          <TextField
            label="Buscar producto, SKU, MLM o User Product ID"
            size="small"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar producto, SKU, MLM o User Product ID..."
            sx={{ maxWidth: 520 }}
          />
        </Box>

        <Button
          variant="outlined"
          onClick={obtenerKaizen}
          disabled={loading || !rangoValido}
        >
          Actualizar pendientes
        </Button>
      </Box>

      {!rangoValido && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          La semana inicial no puede ser posterior a la semana final y la semana
          final no puede ser futura.
        </Alert>
      )}

      {mensajeError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {mensajeError}
        </Alert>
      )}

      {rangoValido && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <strong>Periodo analizado:</strong> desde la semana {semanaInicio} de{" "}
          {anioInicio}, iniciando el {rangoVisual.inicio}, hasta la semana{" "}
          {semanaFin} de {anioFin}, terminando el {rangoVisual.fin}. Los
          resultados acumulan las ventas y el pronóstico de todas las semanas
          incluidas.
        </Alert>
      )}

      {totalResultados > rows.length && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Mostrando {rows.length} de {totalResultados} productos encontrados.
          Aumenta el Top para mostrar más resultados.
        </Alert>
      )}

      <Box
        sx={{
          width: "100%",
          overflowX: "auto",
        }}
      >
        <Box
          sx={{
            minWidth: 1900,
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
                ? {
                    ...row,
                    tieneAccionKaizen: true,
                  }
                : row,
            ),
          );
        }}
      />
    </Box>
  );
};

export default KaizenVentasPerdidas;
