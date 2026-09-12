import React, { useEffect, useMemo, useState } from "react";

import { Box, Button, Chip, Typography } from "@mui/material";

import PlayArrowOutlinedIcon from "@mui/icons-material/PlayArrowOutlined";
import StopCircleOutlinedIcon from "@mui/icons-material/StopCircleOutlined";

import { modalPrimaryButtonSx } from "../../../common/modalStyles";

// =========================================================
// HELPERS
// =========================================================

const formatearCronometro = (segundos) => {
  const total = Math.max(0, Number(segundos) || 0);

  const horas = Math.floor(total / 3600);
  const minutos = Math.floor((total % 3600) / 60);
  const segundosRestantes = total % 60;

  return [horas, minutos, segundosRestantes]
    .map((valor) => String(valor).padStart(2, "0"))
    .join(":");
};

const obtenerFechaInicioMs = (fecha) => {
  if (!fecha) {
    return null;
  }

  /*
   * MariaDB normalmente puede regresar:
   *
   * 2026-09-11 00:45:20
   *
   * Para que JavaScript la interprete mejor,
   * sustituimos el espacio por T:
   *
   * 2026-09-11T00:45:20
   */
  const fechaNormalizada =
    typeof fecha === "string" ? fecha.replace(" ", "T") : fecha;

  const fechaInicio = new Date(fechaNormalizada);

  const inicioMs = fechaInicio.getTime();

  if (Number.isNaN(inicioMs)) {
    return null;
  }

  return inicioMs;
};

// =========================================================
// COMPONENTE
// =========================================================

const PlanTrabajoTiempo = ({
  tarea,
  usuarioActualId,
  procesandoTiempo,
  onIniciar,
  onDetener,
}) => {
  const [segundosActuales, setSegundosActuales] = useState(0);

  // =========================================================
  // ¿EL CRONÓMETRO ES MÍO?
  // =========================================================

  const cronometroEsMio = useMemo(() => {
    return (
      Boolean(tarea?.cronometro_activo) &&
      Number(tarea?.cronometro_usuario_id) === Number(usuarioActualId)
    );
  }, [tarea?.cronometro_activo, tarea?.cronometro_usuario_id, usuarioActualId]);

  // =========================================================
  // CRONÓMETRO EN TIEMPO REAL
  // =========================================================

  useEffect(() => {
    const acumulado = Number(tarea?.tiempo_total_segundos) || 0;

    if (!tarea) {
      setSegundosActuales(0);
      return;
    }

    if (!tarea.cronometro_activo || !tarea.cronometro_fecha_inicio) {
      setSegundosActuales(acumulado);
      return;
    }

    const inicioMs = obtenerFechaInicioMs(tarea.cronometro_fecha_inicio);

    if (inicioMs === null) {
      console.error(
        "Fecha de inicio del cronómetro inválida:",
        tarea.cronometro_fecha_inicio,
      );

      setSegundosActuales(acumulado);
      return;
    }

    const actualizarCronometro = () => {
      const ahoraMs = Date.now();

      const segundosSesionActual = Math.max(
        0,
        Math.floor((ahoraMs - inicioMs) / 1000),
      );

      setSegundosActuales(acumulado + segundosSesionActual);
    };

    actualizarCronometro();

    const intervalo = setInterval(actualizarCronometro, 1000);

    return () => {
      clearInterval(intervalo);
    };
  }, [tarea]);
  // =========================================================
  // SIN TAREA
  // =========================================================

  if (!tarea) {
    return null;
  }

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: {
            xs: "column",
            sm: "row",
          },
          justifyContent: "space-between",
          alignItems: {
            xs: "flex-start",
            sm: "center",
          },
          gap: 2,
        }}
      >
        {/* =====================================================
            INFORMACIÓN
        ====================================================== */}

        <Box>
          <Typography
            fontWeight={700}
            sx={{
              color: "#263238",
            }}
          >
            Tiempo de trabajo
          </Typography>

          <Typography
            sx={{
              mt: 0.75,
              fontSize: "1.9rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
              fontVariantNumeric: "tabular-nums",
              color: "#263238",
            }}
          >
            {formatearCronometro(segundosActuales)}
          </Typography>

          <Typography variant="caption" color="text.secondary">
            HH:MM:SS
          </Typography>

          {tarea.cronometro_activo && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mt: 1,
              }}
            >
              Cronómetro iniciado por:{" "}
              <strong>{tarea.cronometro_usuario_nombre || "Usuario"}</strong>
            </Typography>
          )}
        </Box>

        {/* =====================================================
            ACCIÓN
        ====================================================== */}

        {!tarea.cronometro_activo ? (
          <Button
            variant="contained"
            startIcon={<PlayArrowOutlinedIcon />}
            onClick={onIniciar}
            disabled={
              procesandoTiempo ||
              tarea.estatus === "finalizada" ||
              tarea.estatus === "cancelada"
            }
            sx={modalPrimaryButtonSx}
          >
            {procesandoTiempo ? "Iniciando..." : "Iniciar tiempo"}
          </Button>
        ) : cronometroEsMio ? (
          <Button
            variant="outlined"
            startIcon={<StopCircleOutlinedIcon />}
            onClick={onDetener}
            disabled={procesandoTiempo}
          >
            {procesandoTiempo ? "Deteniendo..." : "Detener tiempo"}
          </Button>
        ) : (
          <Chip label="Cronómetro activo" color="info" variant="outlined" />
        )}
      </Box>
    </Box>
  );
};

export default PlanTrabajoTiempo;
