import React, { useEffect, useMemo, useState } from "react";
import { useTheme } from "@mui/material/styles";
import JobDetailDialog from "./JobDetailDialog";
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import {
  Box,
  Typography,
  Tooltip,
  Paper,
  Button,
  LinearProgress,
  Stack,
  Divider,
  Tabs,
  Tab,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
} from "@mui/material";

import { JobsApi } from "../../../api/jobsApi";
import axios from "axios";


const prettyType = (t) => {
  const map = {
    refreshStocksML: "Actualizar Stocks ML",
    ejecutarMrp: "Ejecutar MRP",
  };
  return map[t] || t;
};

const apiUrl =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_URL
    : process.env.REACT_APP_API_URL_LOCAL;

export default function ProcesosPage({ onResumeJob }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState(0);
  const theme = useTheme();
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailJobId, setDetailJobId] = useState(null);
  const [fakeMap, setFakeMap] = useState({});

  // Hooks y funciones para listrar y descargar archivos MRP
  const [archivosMRP, setArchivosMRP] = useState([]);
  const [archivosLoading, setArchivosLoading] = useState(false);


  const fetchArchivosMRP = async () => {
    setArchivosLoading(true);
    try {
      const res = await axios.get(`${apiUrl}/mrp/listarArchivosMRP`);
      const data = res.data;
      if (data.ok === true) {
        setArchivosMRP(data.archivos);
      }
    } finally {
      setArchivosLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 3) {
      fetchArchivosMRP();
    }
  }, [tab]);

  const archivosPorProveedor = archivosMRP.reduce((acc, a) => {
    const pid = a.proveedor_id ?? "sin_proveedor";

    if (!acc[pid]) {
      acc[pid] = {
        proveedor: a.proveedor_nombre || "Sin proveedor",
        items: [],
      };
    }

    acc[pid].items.push(a);
    return acc;
  }, {});

  const descargarArchivo = async (archivoId) => {
    const res = await axios.get(`${apiUrl}/mrp/descargarArchivoMRP/${archivoId}/descargar`);
    const data = res.data;

    if (!data.ok) {
      alert("No se pudo descargar el archivo");
      return;
    }

    window.open(data.url, "_blank");
  };

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const data = await JobsApi.getRecent({ limit: 100 });
      setJobs(Array.isArray(data?.jobs) ? data.jobs : []);
    } catch (e) {
      console.error(e);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const openDetail = (jobId) => {
    setDetailJobId(jobId);
    setDetailOpen(true);
  };

  const closeDetail = () => {
    setDetailOpen(false);
    setDetailJobId(null);
  };

  useEffect(() => {
    fetchJobs();
    const t = setInterval(fetchJobs, 3000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setFakeMap((prev) => {
        const next = { ...prev };

        for (const j of jobs) {
          const status = String(j.status || "").toLowerCase();
          const serverPct = Number(j.progress || 0);
          const id = j.job_id;

          const canFake =
            (status === "pending" || status === "running") && serverPct < 40;

          if (!canFake) {
            if (next[id] != null) delete next[id];
            continue;
          }

          const currentFake = Number(next[id] ?? 0);

          if (currentFake < 39) next[id] = currentFake + 1;
        }

        return next;
      });
    }, 30000);

    return () => clearInterval(t);
  }, [jobs]);

  // setInterval(() => {
  //   setFakeMap((prev) => {
  //     const next = { ...prev };

  //     for (const j of jobs) {
  //       const status = String(j.status || "").toLowerCase();
  //       const serverPct = Number(j.progress || 0);
  //       const id = j.job_id;

  //       const canFake =
  //         (status === "pending" || status === "running") && serverPct < 40;

  //       if (!canFake) {
  //         delete next[id];
  //         continue;
  //       }

  //       const currentFake = Number(next[id] ?? 0);

  //       if (currentFake < 39) next[id] = currentFake + 1;
  //     }

  //     return next;
  //   });
  // }, 30000);

  const getDisplayPct = (j) => {
    const status = String(j.status || "").toLowerCase();
    const serverPct = Number(j.progress || 0);
    const fakePct = Number(fakeMap[j.job_id] ?? 0);

    if (status === "done") return 100;

    if (status === "error") return 100;

    if (serverPct >= 40) return serverPct;

    return Math.min(39, Math.max(serverPct, fakePct));
  };

  const running = useMemo(
    () =>
      jobs.filter((j) =>
        ["pending", "running"].includes(String(j.status).toLowerCase())
      ),
    [jobs]
  );
  const done = useMemo(
    () => jobs.filter((j) => String(j.status).toLowerCase() === "done"),
    [jobs]
  );
  const errors = useMemo(
    () => jobs.filter((j) => String(j.status).toLowerCase() === "error"),
    [jobs]
  );

  const current = tab === 0 ? running : tab === 1 ? done : errors;

  const statusColor = (status) => {
    const s = String(status || "").toLowerCase();
    if (s === "pending" || s === "running") return theme.palette.warning.light;
    if (s === "done") return theme.palette.success.main;
    if (s === "error") return theme.palette.error.main;
    return theme.palette.grey[400];
  };

  const statusLabel = (status) => {
    const s = String(status || "").toLowerCase();
    if (s === "pending") return "En cola";
    if (s === "running") return "En ejecución";
    if (s === "done") return "Terminado";
    if (s === "error") return "Error";
    return s || "—";
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="h5">Centro de procesos</Typography>
          <Typography variant="body2" sx={{ opacity: 0.7 }}>
            Running, Done y con Error.
          </Typography>
        </Box>

        <Button variant="contained" onClick={fetchJobs} disabled={loading}>
          Refrescar
        </Button>
      </Stack>

      <Divider sx={{ my: 2 }} />

      <Paper sx={{ p: 2, mb: 2, backgroundColor: "#f9fafb" }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          ℹ️ Información de procesos
        </Typography>

        <Tooltip
          title={
            <>
              <Typography variant="subtitle2">Actualizar Stocks ML</Typography>
              <Typography variant="body2">
                Sincroniza inventario desde Mercado Libre y recalcula el stock
                total.
              </Typography>
              <Typography variant="caption">
                Duración estimada: 10–15 minutos
              </Typography>
            </>
          }
          arrow
        >
          <Typography
            variant="caption"
            sx={{ cursor: "help", textDecoration: "underline dotted" }}
          >
            Actualizar Stocks ML
          </Typography>
        </Tooltip>

        <Divider sx={{ my: 1.5 }} />

        <Typography variant="body2">
          <b>Estados:</b>
          <br />
          🟠 En ejecución/Running
          <br />
          🟢 Terminado/Done
          <br />
          🔴 Error
        </Typography>
      </Paper>

      {loading && <LinearProgress />}

      <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mt: 1 }}>
        <Tab label={`En ejecución (${running.length})`} />
        <Tab label={`Terminados (${done.length})`} />
        <Tab label={`Con errores (${errors.length})`} />
        <Tab label={`Archivos`} />
      </Tabs>

      {tab === 3 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            📁 Archivos generados por MRP
          </Typography>

          {archivosLoading && <LinearProgress />}

          {Object.values(archivosPorProveedor).map((grupo) => (
            <Box key={grupo.proveedor} sx={{ mb: 4 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                🏭 {grupo.proveedor}
              </Typography>

              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Archivo</TableCell>
                    <TableCell align="right">Acción</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {grupo.items.map((a) => (
                    <TableRow key={a.archivo_id}>
                      <TableCell>
                        {new Date(a.fecha_ejecucion).toLocaleString()}
                      </TableCell>

                      <TableCell>
                        <Chip
                          size="small"
                          label={a.tipo}
                          color={a.tipo === "RETIRO" ? "warning" : "success"}
                        />
                      </TableCell>

                      <TableCell>{a.nombre_archivo}</TableCell>

                      <TableCell align="right">
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => descargarArchivo(a.archivo_id)}
                          startIcon={<CloudDownloadIcon />}
                        >
                          Descargar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          ))}
        </Paper>
      )}

      <Stack spacing={2} sx={{ mt: 2 }}>
        {current.length === 0 && (
          <Paper sx={{ p: 2 }}>
            <Typography>
              {tab === 0 && "No hay procesos en ejecución."}
              {tab === 1 && "No hay procesos terminados."}
              {tab === 2 && "No hay procesos con error."}
            </Typography>
          </Paper>
        )}

        {current.map((j) => {
          const barColor = statusColor(j.status);
          const pct = getDisplayPct(j);

          return (
            <Paper key={j.job_id} sx={{ p: 2 }}>
              <Box sx={{ display: "flex", gap: 2 }}>
                <Box
                  sx={{
                    width: 6,
                    borderRadius: 2,
                    bgcolor: barColor,
                    flexShrink: 0,
                  }}
                />

                <Box sx={{ flex: 1 }}>
                  <Stack spacing={1}>
                    <Typography sx={{ fontWeight: 700 }}>
                      {prettyType(j.job_type)}
                      {j.proveedor_razon_social
                        ? ` · ${j.proveedor_razon_social}`
                        : ""}
                    </Typography>

                    <Typography variant="body2">
                      {j.message || "Procesando…"}
                    </Typography>

                    {String(j.status).toLowerCase() !== "error" && (
                      <>
                        <LinearProgress
                          variant="determinate"
                          value={pct}
                          sx={{
                            height: 8,
                            borderRadius: 999,
                            bgcolor: "grey.200",
                            "& .MuiLinearProgress-bar": {
                              bgcolor: barColor,
                              borderRadius: 999,
                              transition: "transform 600ms linear",
                            },
                          }}
                        />

                        <Stack direction="row" justifyContent="space-between">
                          <Typography
                            variant="caption"
                            sx={{ color: barColor }}
                          >
                            {statusLabel(j.status)}
                          </Typography>
                          <Typography variant="caption">{pct}%</Typography>
                        </Stack>
                      </>
                    )}

                    {String(j.status).toLowerCase() === "error" && (
                      <Typography variant="body2" sx={{ color: "error.main" }}>
                        {j.error || "Error desconocido"}
                      </Typography>
                    )}

                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => openDetail(j.job_id)} // 👈 recomendado usar tu openDetail
                    >
                      Ver detalle
                    </Button>
                  </Stack>
                </Box>
              </Box>
            </Paper>
          );
        })}
      </Stack>

      {/* Modal detalle */}
      <JobDetailDialog
        open={detailOpen}
        jobId={detailJobId}
        onClose={closeDetail}
        prettyType={prettyType}
        statusColor={(s) => statusColor(s)} // si tu dialog espera color
        statusLabel={statusLabel}
      />
    </Box>
  );
}
