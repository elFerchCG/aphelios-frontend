import React, { useEffect, useState } from "react";
import axios from "axios";
import DetalleTareaPublicacionModal from "./DetalleTareaPublicacionModal";

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

const TabTareas = () => {
  const LIMITE_DEFAULT = 250;

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [estatusFiltro, setEstatusFiltro] = useState("");
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);

  const [openDetalle, setOpenDetalle] = useState(false);
  const [tareaSeleccionada, setTareaSeleccionada] = useState(null);

  const apiUrl =
    process.env.NODE_ENV === "production"
      ? process.env.REACT_APP_API_URL
      : process.env.REACT_APP_API_URL_LOCAL;

  const token = localStorage.getItem("token");

  const obtenerTareas = async ({
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

      const resp = await axios.get(`${apiUrl}/publicacionesMejoras/tareas`, {
        params: {
          limit: customLimit,
          offset: nuevoOffset,
          busqueda: busqueda || undefined,
          estatus: estatusFiltro || undefined,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (resp.data.ok) {
        const nuevasRows = resp.data.data.map((item) => ({
          ...item,
          id: item.id,
        }));

        setRows((prev) => (reset ? nuevasRows : [...prev, ...nuevasRows]));
        setOffset(nuevoOffset + nuevasRows.length);
        setHasMore(Boolean(resp.data.hasMore));
        setTotal(Number(resp.data.total || 0));
      }
    } catch (error) {
      console.error("Error al obtener tareas:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const actualizarTareas = () => {
    setOffset(0);
    setHasMore(true);
    obtenerTareas({ reset: true });
  };

  const abrirDetalle = (row) => {
    setTareaSeleccionada(row);
    setOpenDetalle(true);
  };

  const cerrarDetalle = () => {
    setOpenDetalle(false);
    setTareaSeleccionada(null);
  };

  const onTareaActualizada = () => {
    cerrarDetalle();
    actualizarTareas();
  };

  const handleTableScroll = (event) => {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
    const cercaDelFinal = scrollHeight - scrollTop - clientHeight < 120;

    if (cercaDelFinal && hasMore && !loading && !loadingMore) {
      obtenerTareas();
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      actualizarTareas();
    }, 500);

    return () => clearTimeout(timeout);
  }, [busqueda, estatusFiltro]);

  const obtenerChipEstatus = (estatus) => {
    const map = {
      pendiente: { label: "Pendiente", color: "warning" },
      en_proceso: { label: "En proceso", color: "info" },
      realizado: { label: "Realizado", color: "success" },
      cancelado: { label: "Cancelado", color: "error" },
    };

    return map[estatus] || { label: estatus || "Sin estatus", color: "default" };
  };

  const formatoFecha = (fecha) => {
    if (!fecha) return "Sin compromiso";

    return new Date(fecha).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
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
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          <TextField
            label="Buscar tarea"
            size="small"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Publicación, SKU, tarea..."
            sx={{ width: 420 }}
          />

          <TextField
            select
            label="Estatus tarea"
            size="small"
            value={estatusFiltro}
            onChange={(e) => setEstatusFiltro(e.target.value)}
            sx={{ width: 180 }}
          >
            <MenuItem value="">Abiertas</MenuItem>
            <MenuItem value="pendiente">Pendientes</MenuItem>
            <MenuItem value="en_proceso">En proceso</MenuItem>
            <MenuItem value="realizado">Realizadas</MenuItem>
            <MenuItem value="cancelado">Canceladas</MenuItem>
          </TextField>
        </Box>

        <Button variant="outlined" onClick={actualizarTareas}>
          Actualizar
        </Button>
      </Box>

      <Typography variant="caption" color="text.secondary">
        Mostrando {rows.length} de {total} tareas
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
              <TableCell sx={{ fontWeight: "bold", minWidth: 130 }}>
                Estatus
              </TableCell>
              <TableCell sx={{ fontWeight: "bold", minWidth: 330 }}>
                Publicación
              </TableCell>
              <TableCell sx={{ fontWeight: "bold", minWidth: 260 }}>
                Tarea
              </TableCell>
              <TableCell sx={{ fontWeight: "bold", minWidth: 180 }}>
                Responsables
              </TableCell>
              <TableCell sx={{ fontWeight: "bold", minWidth: 130 }}>
                Compromiso
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold" }}>
                Acciones
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  Cargando tareas...
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  No se encontraron tareas.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => {
                const estatus = obtenerChipEstatus(row.estatus);

                return (
                  <TableRow hover key={row.id}>
                    <TableCell>
                      <Chip
                        label={estatus.label}
                        color={estatus.color}
                        size="small"
                      />
                    </TableCell>

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
                        row.title || "Sin publicación"
                      )}

                      <Typography variant="caption" display="block">
                        SKU: {row.sku || "Sin SKU"}
                      </Typography>
                    </TableCell>

                    <TableCell>{row.descripcion_mejora}</TableCell>

                    <TableCell>{row.responsables || "Sin asignar"}</TableCell>

                    <TableCell>{formatoFecha(row.fecha_compromiso)}</TableCell>

                    <TableCell align="center">
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => abrirDetalle(row)}
                      >
                        Ver
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {hasMore && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
          <Button
            variant="outlined"
            onClick={() => obtenerTareas({ customLimit: 500 })}
            disabled={loadingMore}
          >
            {loadingMore ? "Cargando..." : "Cargar 500 más"}
          </Button>
        </Box>
      )}

      <DetalleTareaPublicacionModal
        open={openDetalle}
        onClose={cerrarDetalle}
        tarea={tareaSeleccionada}
        onActualizado={onTareaActualizada}
      />
    </>
  );
};

export default TabTareas;