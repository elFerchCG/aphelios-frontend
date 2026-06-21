import React, { useEffect, useState } from "react";
import axios from "axios";

import HistorialMejorasPublicacion from "./HistorialMejorasPublicacionModal";
import NuevaMejoraPublicacionModal from "./NuevaMejoraPublicacionModal";

import {
  Box,
  Button,
  Chip,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

const TabPublicaciones = () => {
  const LIMITE_DEFAULT = 250;

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [estatusFiltro, setEstatusFiltro] = useState("");
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);

  const [publicacionSeleccionada, setPublicacionSeleccionada] = useState(null);
  const [openHistorial, setOpenHistorial] = useState(false);
  const [openNuevaMejora, setOpenNuevaMejora] = useState(false);

  const apiUrl =
    process.env.NODE_ENV === "production"
      ? process.env.REACT_APP_API_URL
      : process.env.REACT_APP_API_URL_LOCAL;

  const token = localStorage.getItem("token");

  const obtenerPublicaciones = async ({
    reset = false,
    customLimit = LIMITE_DEFAULT,
  } = {}) => {
    try {
      const nuevoOffset = reset ? 0 : offset;

      if (reset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const resp = await axios.get(
        `${apiUrl}/publicacionesMejoras/publicaciones`,
        {
          params: {
            limit: customLimit,
            offset: nuevoOffset,
            busqueda: busqueda || undefined,
            estatus: estatusFiltro || undefined,
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (resp.data.ok) {
        const nuevasRows = resp.data.data.map((item) => ({
          ...item,
          id: item.producto_id,
        }));

        setRows((prev) => (reset ? nuevasRows : [...prev, ...nuevasRows]));
        setOffset(nuevoOffset + nuevasRows.length);
        setHasMore(Boolean(resp.data.hasMore));
        setTotal(Number(resp.data.total || 0));
      }
    } catch (error) {
      console.error("Error al obtener publicaciones:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const cargarTodo = async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);

    let offsetActual = offset;
    let seguir = hasMore;

    try {
      while (seguir) {
        const resp = await axios.get(
          `${apiUrl}/publicacionesMejoras/publicaciones`,
          {
            params: {
              offset: offsetActual,
              limit: 500,
              busqueda: busqueda || undefined,
              estatus: estatusFiltro || undefined,
            },
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!resp.data.ok) break;

        const nuevos = resp.data.data.map((item) => ({
          ...item,
          id: item.producto_id,
        }));

        if (nuevos.length === 0) break;

        setRows((prev) => [...prev, ...nuevos]);

        offsetActual += nuevos.length;
        setOffset(offsetActual);
        setTotal(Number(resp.data.total || 0));

        seguir = Boolean(resp.data.hasMore) && nuevos.length > 0;
        setHasMore(seguir);
      }
    } catch (error) {
      console.error("Error al cargar todas las publicaciones:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  const actualizarPublicaciones = () => {
    setOffset(0);
    setHasMore(true);
    obtenerPublicaciones({ reset: true });
  };

  const handleTableScroll = (event) => {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
    const cercaDelFinal = scrollHeight - scrollTop - clientHeight < 120;

    if (cercaDelFinal && hasMore && !loading && !loadingMore) {
      obtenerPublicaciones();
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      actualizarPublicaciones();
    }, 500);

    return () => clearTimeout(timeout);
  }, [busqueda, estatusFiltro]);

  const obtenerEstatusML = (estatus) => {
    const map = {
      active: { label: "Activa", color: "success" },
      paused: { label: "Pausada", color: "warning" },
      closed: { label: "Cerrada", color: "error" },
      under_review: { label: "En revisión", color: "info" },
    };

    return map[estatus] || { label: estatus || "Sin estatus", color: "default" };
  };

  const formatoFechaHora = (fecha) => {
    if (!fecha) return "Sin registros";

    return new Date(fecha).toLocaleString("es-MX", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const abrirHistorial = (row) => {
    setPublicacionSeleccionada(row);
    setOpenHistorial(true);
  };

  const abrirNuevaMejora = (row) => {
    setPublicacionSeleccionada(row);
    setOpenNuevaMejora(true);
  };

  const cerrarHistorial = () => {
    setOpenHistorial(false);
    setPublicacionSeleccionada(null);
  };

  const cerrarNuevaMejora = () => {
    setOpenNuevaMejora(false);
    setPublicacionSeleccionada(null);
  };

  const onMejoraGuardada = () => {
    cerrarNuevaMejora();
    actualizarPublicaciones();
  };

  return (
    <>
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
            gap: 2,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <TextField
            label="Buscar publicación"
            size="small"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Producto, SKU o ID publicación..."
            sx={{ width: 420 }}
          />

          <TextField
            select
            label="Estatus ML"
            size="small"
            value={estatusFiltro}
            onChange={(e) => setEstatusFiltro(e.target.value)}
            sx={{ width: 180 }}
          >
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="active">Activas</MenuItem>
            <MenuItem value="paused">Pausadas</MenuItem>
            <MenuItem value="closed">Cerradas</MenuItem>
            <MenuItem value="under_review">En revisión</MenuItem>
          </TextField>
        </Box>

        <Button variant="outlined" onClick={actualizarPublicaciones}>
          Actualizar
        </Button>
      </Box>

      <Typography variant="caption" color="text.secondary">
        Mostrando {rows.length} de {total} publicaciones
      </Typography>

      <TableContainer
        component={Paper}
        onScroll={handleTableScroll}
        sx={{
          mt: 1,
          maxHeight: "68vh",
          borderRadius: 3,
          border: "3px solid #1e88e5",
          boxShadow: 8,
        }}
      >
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: "bold", minWidth: 360 }}>
                Producto
              </TableCell>
              <TableCell sx={{ fontWeight: "bold", minWidth: 170 }}>
                SKU
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold" }}>
                Estatus ML
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold" }}>
                Stock ML
              </TableCell>
              <TableCell
                align="center"
                sx={{ fontWeight: "bold", minWidth: 220 }}
              >
                Estado tareas
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold" }}>
                Total mejoras
              </TableCell>
              <TableCell sx={{ fontWeight: "bold", minWidth: 170 }}>
                Última mejora
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold" }}>
                Acciones
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  Cargando publicaciones...
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  No se encontraron publicaciones.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => {
                const estatus = obtenerEstatusML(row.status);

                return (
                  <TableRow hover key={row.producto_id}>
                    <TableCell>
                      {row.permalink ? (
                        <a
                          href={row.permalink}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: "#1976d2",
                            textDecoration: "none",
                            fontWeight: 500,
                          }}
                        >
                          {row.title}
                        </a>
                      ) : (
                        row.title
                      )}
                    </TableCell>

                    <TableCell>{row.sku}</TableCell>

                    <TableCell align="center">
                      <Chip
                        label={estatus.label}
                        color={estatus.color}
                        size="small"
                      />
                    </TableCell>

                    <TableCell align="center">
                      {row.available_quantity ?? 0}
                    </TableCell>

                    <TableCell align="center">
                      <Box
                        sx={{
                          display: "flex",
                          gap: 0.5,
                          justifyContent: "center",
                          flexWrap: "wrap",
                        }}
                      >
                        <Chip
                          label={`${Number(row.pendientes || 0)} Pend.`}
                          color={
                            Number(row.pendientes || 0) > 0
                              ? "warning"
                              : "default"
                          }
                          size="small"
                        />

                        <Chip
                          label={`${Number(row.en_proceso || 0)} Proc.`}
                          color={
                            Number(row.en_proceso || 0) > 0 ? "info" : "default"
                          }
                          size="small"
                        />

                        <Chip
                          label={`${Number(row.realizadas || 0)} Fin.`}
                          color={
                            Number(row.realizadas || 0) > 0
                              ? "success"
                              : "default"
                          }
                          size="small"
                        />
                      </Box>
                    </TableCell>

                    <TableCell align="center">
                      {Number(row.total_mejoras || 0)}
                    </TableCell>

                    <TableCell>{formatoFechaHora(row.ultima_mejora)}</TableCell>

                    <TableCell align="center">
                      <Box
                        sx={{
                          display: "flex",
                          gap: 1,
                          justifyContent: "center",
                        }}
                      >
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => abrirHistorial(row)}
                        >
                          Historial
                        </Button>

                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => abrirNuevaMejora(row)}
                        >
                          Registrar
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {hasMore && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            gap: 2,
            mt: 2,
          }}
        >
          <Button
            variant="outlined"
            onClick={() => obtenerPublicaciones({ customLimit: 500 })}
            disabled={loadingMore}
          >
            {loadingMore ? "Cargando..." : "Cargar 500 más"}
          </Button>

          <Button
            variant="contained"
            onClick={cargarTodo}
            disabled={loadingMore}
          >
            Cargar todo
          </Button>
        </Box>
      )}

      <HistorialMejorasPublicacion
        open={openHistorial}
        onClose={cerrarHistorial}
        publicacion={publicacionSeleccionada}
      />

      <NuevaMejoraPublicacionModal
        open={openNuevaMejora}
        onClose={cerrarNuevaMejora}
        publicacion={publicacionSeleccionada}
        onGuardado={onMejoraGuardada}
      />
    </>
  );
};

export default TabPublicaciones;