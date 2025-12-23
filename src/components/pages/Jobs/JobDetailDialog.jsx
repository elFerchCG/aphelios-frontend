import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Stack,
  LinearProgress,
  Paper,
  Box,
  Chip,
  Grid,
} from "@mui/material";
import { JobsApi } from "../../../api/jobsApi";

const fmtDate = (d) => {
  if (!d) return "—";
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? String(d) : dt.toLocaleString("es-MX");
};

export default function JobDetailDialog({
  open,
  jobId,
  onClose,
  prettyType,
  statusColor,
  statusLabel,
}) {
  const [loading, setLoading] = useState(false);
  const [job, setJob] = useState(null);

  useEffect(() => {
    if (!open || !jobId) return;

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setJob(null);
      try {
        const data = await JobsApi.getById(jobId);
        if (!cancelled) setJob(data?.job || null);
      } catch (e) {
        console.error(e);
        if (!cancelled)
          setJob({
            job_id: jobId,
            status: "error",
            error: "No se pudo cargar el detalle",
          });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [open, jobId]);

  const pct = Number(job?.progress || 0);
  const chipColor = statusColor(job?.status);

  const handleClose = (event, reason) => {
    if (reason === "backdropClick" || reason === "escapeKeyDown") return;
    onClose?.();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
      disableEscapeKeyDown
    >
      <DialogTitle>Detalle del proceso</DialogTitle>

      <DialogContent dividers>
        {loading && <LinearProgress />}

        {!loading && !job && <Typography>No hay información.</Typography>}

        {!loading && job && (
          <Stack spacing={2}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip
                label={statusLabel(job.status)}
                sx={{
                  bgcolor: chipColor,
                  color: "#fff",
                  fontWeight: 700,
                }}
              />
            </Stack>

            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Typography variant="caption" sx={{ opacity: 0.7 }}>
                  Tipo
                </Typography>
                <Typography>{prettyType(job.job_type)}</Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="caption" sx={{ opacity: 0.7 }}>
                  Proveedor
                </Typography>
                <Typography>{job.proveedor_razon_social ?? "—"}</Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="caption" sx={{ opacity: 0.7 }}>
                  Usuario
                </Typography>
                <Typography>{job.usuario_nombre ?? "—"}</Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="caption" sx={{ opacity: 0.7 }}>
                  Progreso
                </Typography>
                <Typography>{pct}%</Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="caption" sx={{ opacity: 0.7 }}>
                  Mensaje
                </Typography>
                <Typography>{job.message || "—"}</Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="caption" sx={{ opacity: 0.7 }}>
                  Inicio
                </Typography>
                <Typography>{fmtDate(job.started_at)}</Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="caption" sx={{ opacity: 0.7 }}>
                  Fin
                </Typography>
                <Typography>{fmtDate(job.finished_at)}</Typography>
              </Grid>
            </Grid>

            {String(job.status).toLowerCase() !== "error" && (
              <LinearProgress
                variant="determinate"
                value={pct}
                sx={{
                  height: 10,
                  borderRadius: 999,
                  bgcolor: "grey.200",
                  "& .MuiLinearProgress-bar": {
                    bgcolor: chipColor,
                    borderRadius: 999,
                  },
                }}
              />
            )}

            {String(job.status).toLowerCase() === "error" && (
              <Paper
                sx={{
                  p: 2,
                  borderLeft: "6px solid",
                  borderLeftColor: "error.main",
                }}
              >
                <Typography sx={{ fontWeight: 700, color: "error.main" }}>
                  Error
                </Typography>
                <Typography variant="body2">
                  {job.error || "Error desconocido"}
                </Typography>
              </Paper>
            )}

            {job.result_json && (
              <Paper sx={{ p: 2 }}>
                <Typography sx={{ fontWeight: 700 }}>Resultado</Typography>
                <Box
                  component="pre"
                  sx={{ m: 0, whiteSpace: "pre-wrap", fontSize: 12 }}
                >
                  {typeof job.result_json === "string"
                    ? job.result_json
                    : JSON.stringify(job.result_json, null, 2)}
                </Box>
              </Paper>
            )}
          </Stack>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}
