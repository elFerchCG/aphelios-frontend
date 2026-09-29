import { useEffect, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";

import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import BuildOutlinedIcon from "@mui/icons-material/BuildOutlined";

// ============================================================
// CONFIGURACIÓN VISUAL POR TIPO
// ============================================================

const CONFIG_TIPOS = {
  general: {
    label: "Aviso general",
    severity: "info",
    icon: <CampaignOutlinedIcon />,
  },

  importante: {
    label: "Importante",
    severity: "warning",
    icon: <WarningAmberOutlinedIcon />,
  },

  novedad: {
    label: "Novedad",
    severity: "success",
    icon: <AutoAwesomeOutlinedIcon />,
  },

  sistema: {
    label: "Sistema",
    severity: "info",
    icon: <InfoOutlinedIcon />,
  },

  mantenimiento: {
    label: "Mantenimiento",
    severity: "warning",
    icon: <BuildOutlinedIcon />,
  },
};

const SEGUNDOS_ESPERA = 5;

const AvisoDialog = ({
  aviso,
  numeroAviso,
  totalAvisos,
  procesando,
  onConfirmar,
}) => {
  const [segundosRestantes, setSegundosRestantes] =
    useState(SEGUNDOS_ESPERA);

  // ============================================================
  // REINICIAR CONTADOR POR CADA AVISO
  // ============================================================

  useEffect(() => {
    setSegundosRestantes(SEGUNDOS_ESPERA);

    const interval = setInterval(() => {
      setSegundosRestantes((actual) => {
        if (actual <= 1) {
          clearInterval(interval);
          return 0;
        }

        return actual - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [aviso.id]);

  const config =
    CONFIG_TIPOS[aviso.tipo] ||
    CONFIG_TIPOS.general;

  const puedeConfirmar =
    segundosRestantes === 0 && !procesando;

  // ============================================================
  // BLOQUEAR CIERRE
  // ============================================================

  const handleClose = (event, reason) => {
    /*
     * No permitimos cerrar:
     *
     * - Escape
     * - click en backdrop
     * - cualquier cierre externo
     *
     * La única salida es "Entendido".
     */
    return;
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <Dialog
      open
      onClose={handleClose}
      disableEscapeKeyDown
      fullWidth
      maxWidth="sm"
      aria-labelledby="aviso-global-titulo"
    >
      <DialogTitle id="aviso-global-titulo">
        <Stack
          direction="row"
          spacing={1.5}
          alignItems="center"
          justifyContent="space-between"
        >
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
          >
            {config.icon}

            <Typography
              variant="h6"
              component="span"
              fontWeight={700}
            >
              {aviso.titulo}
            </Typography>
          </Stack>

          <Chip
            label={config.label}
            size="small"
            variant="outlined"
          />
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        {totalAvisos > 1 && (
          <Box mb={2}>
            <Typography
              variant="caption"
              color="text.secondary"
            >
              Aviso {numeroAviso} de {totalAvisos}
            </Typography>
          </Box>
        )}

        <Alert
          severity={config.severity}
          icon={config.icon}
          sx={{
            mb: 2,
          }}
        >
          {config.label}
        </Alert>

        <Typography
          variant="body1"
          sx={{
            whiteSpace: "pre-wrap",
            lineHeight: 1.7,
          }}
        >
          {aviso.mensaje}
        </Typography>

        {segundosRestantes > 0 && (
          <Box mt={3}>
            <Typography
              variant="caption"
              color="text.secondary"
            >
              Podrás continuar en {segundosRestantes}{" "}
              {segundosRestantes === 1
                ? "segundo"
                : "segundos"}
            </Typography>

            <LinearProgress
              variant="determinate"
              value={
                ((SEGUNDOS_ESPERA -
                  segundosRestantes) /
                  SEGUNDOS_ESPERA) *
                100
              }
              sx={{
                mt: 1,
                borderRadius: 1,
              }}
            />
          </Box>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          py: 2,
        }}
      >
        <Button
          variant="contained"
          disabled={!puedeConfirmar}
          onClick={onConfirmar}
        >
          {procesando
            ? "Confirmando..."
            : segundosRestantes > 0
              ? `Entendido (${segundosRestantes})`
              : "Entendido"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AvisoDialog;