import React, { useEffect, useMemo, useState } from "react";
import { useTheme } from "@mui/material/styles";
import JobDetailDialog from "./JobDetailDialog";
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
} from "@mui/material";

import { JobsApi } from "../../../api/jobsApi";

const prettyType = (t) => {
  const map = {
    refreshStocksML: "Actualizar Stocks ML",
    ejecutarMrp: "Ejecutar MRP",
  };
  return map[t] || t;
};

export default function ProcesosPage({ onResumeJob }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState(0);
  const theme = useTheme();
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailJobId, setDetailJobId] = useState(null);

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
      <JobDetailDialog
        open={detailOpen}
        jobId={detailJobId}
        onClose={closeDetail}
        prettyType={prettyType}
        statusColor={statusColor}
        statusLabel={statusLabel}
      />
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="h5">Centro de procesos</Typography>
          <Typography variant="body2" sx={{ opacity: 0.7 }}>
            Procesos en ejecución, terminados y con error.
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
      </Tabs>

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
          const pct = Number(j.progress || 0);

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
                      {j.proveedor_id ? ` · Proveedor ${j.proveedor_razon_social}` : ""}
                    </Typography>

                    <Typography variant="body2">
                      {j.message || "Procesando…"}
                    </Typography>

                    {String(j.status).toLowerCase() !== "error" ? (
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
                    ) : (
                      <Typography variant="body2" sx={{ color: "error.main" }}>
                        {j.error || "Error desconocido"}
                      </Typography>
                    )}

                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => openDetail(j.job_id)}
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
    </Box>
  );
}
