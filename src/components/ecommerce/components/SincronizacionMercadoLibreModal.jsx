import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";

import SyncOutlinedIcon from "@mui/icons-material/SyncOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import ErrorOutlineOutlinedIcon from "@mui/icons-material/ErrorOutlineOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";

const formatearTiempo = (segundos = 0) => {
  const minutos = Math.floor(segundos / 60);
  const segundosRestantes = segundos % 60;

  return `${String(minutos).padStart(2, "0")}:${String(
    segundosRestantes
  ).padStart(2, "0")}`;
};

const formatearDuracion = (ms = 0) => {
  const totalSegundos = Math.floor(ms / 1000);

  const minutos = Math.floor(totalSegundos / 60);
  const segundos = totalSegundos % 60;

  if (minutos <= 0) {
    return `${segundos} s`;
  }

  return `${minutos} min ${segundos} s`;
};

const ResumenItem = ({ label, value }) => (
  <Box
    sx={{
      p: 2,
      border: "1px solid",
      borderColor: "divider",
      borderRadius: 2,
      minWidth: 0,
    }}
  >
    <Typography
      variant="body2"
      color="text.secondary"
      sx={{ mb: 0.5 }}
    >
      {label}
    </Typography>

    <Typography
      variant="h6"
      sx={{
        fontWeight: 700,
        lineHeight: 1.2,
      }}
    >
      {value ?? 0}
    </Typography>
  </Box>
);

const SincronizacionMercadoLibreModal = ({
  open,
  sincronizando,
  resultado,
  error,
  tiempoTranscurrido,
  onClose,
}) => {
  const finalizado =
    !sincronizando && Boolean(resultado);

  const fallo =
    !sincronizando && Boolean(error);

  const resumen =
    resultado?.resultado || resultado || null;

  return (
    <Dialog
      open={open}
      onClose={
        sincronizando
          ? undefined
          : onClose
      }
      fullWidth
      maxWidth="sm"
      disableEscapeKeyDown={sincronizando}
      PaperProps={{
        sx: {
          borderRadius: 3,
        },
      }}
    >
      <DialogTitle>
        <Stack
          direction="row"
          spacing={1.5}
          alignItems="center"
        >
          {sincronizando && (
            <SyncOutlinedIcon color="primary" />
          )}

          {finalizado && (
            <CheckCircleOutlineOutlinedIcon
              color="success"
            />
          )}

          {fallo && (
            <ErrorOutlineOutlinedIcon
              color="error"
            />
          )}

          <Box>
            <Typography
              variant="h6"
              sx={{ fontWeight: 700 }}
            >
              {sincronizando
                ? "Sincronizando productos"
                : finalizado
                ? "Sincronización terminada"
                : fallo
                ? "Error de sincronización"
                : "Sincronizar productos"}
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
            >
              Mercado Libre
            </Typography>
          </Box>
        </Stack>
      </DialogTitle>

      <Divider />

      <DialogContent>
        {/* ================================================ */}
        {/* SINCRONIZANDO */}
        {/* ================================================ */}

        {sincronizando && (
          <Stack
            spacing={3}
            sx={{ py: 2 }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                py: 1,
              }}
            >
              <CircularProgress size={54} />
            </Box>

            <Box sx={{ textAlign: "center" }}>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 600,
                  mb: 0.75,
                }}
              >
                Consultando Mercado Libre
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
              >
                Estamos procesando las cuentas conectadas,
                sus publicaciones, User Products y Families.
              </Typography>
            </Box>

            <LinearProgress />

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 1,
              }}
            >
              <AccessTimeOutlinedIcon
                fontSize="small"
                color="action"
              />

              <Typography
                variant="body2"
                color="text.secondary"
              >
                Tiempo transcurrido:
              </Typography>

              <Typography
                variant="body2"
                sx={{ fontWeight: 700 }}
              >
                {formatearTiempo(
                  tiempoTranscurrido
                )}
              </Typography>
            </Box>

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                textAlign: "center",
                display: "block",
              }}
            >
              La primera sincronización puede tardar varios
              minutos dependiendo de la cantidad de productos.
            </Typography>
          </Stack>
        )}

        {/* ================================================ */}
        {/* TERMINADO */}
        {/* ================================================ */}

        {finalizado && resumen && (
          <Stack
            spacing={3}
            sx={{ py: 1 }}
          >
            <Box sx={{ textAlign: "center" }}>
              <CheckCircleOutlineOutlinedIcon
                color="success"
                sx={{
                  fontSize: 54,
                  mb: 1,
                }}
              />

              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 700 }}
              >
                Proceso completado
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
              >
                Mercado Libre terminó de procesar las cuentas
                configuradas en APHELIOS.
              </Typography>
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                },
                gap: 1.5,
              }}
            >
              <ResumenItem
                label="Cuentas encontradas"
                value={
                  resumen.cuentas_encontradas
                }
              />

              <ResumenItem
                label="Cuentas exitosas"
                value={
                  resumen.cuentas_exitosas
                }
              />

              <ResumenItem
                label="Items descubiertos"
                value={
                  resumen.items_descubiertos
                }
              />

              <ResumenItem
                label="Families descubiertas"
                value={
                  resumen.families_descubiertas
                }
              />

              <ResumenItem
                label="Families sincronizadas"
                value={
                  resumen.families_sincronizadas
                }
              />

              <ResumenItem
                label="User Products sincronizados"
                value={
                  resumen.user_products_sincronizados
                }
              />

              <ResumenItem
                label="Items sincronizados"
                value={
                  resumen.items_sincronizados
                }
              />

              <ResumenItem
                label="Tiempo total"
                value={formatearDuracion(
                  resumen.duracion_ms
                )}
              />
            </Box>

            {resumen.families_con_error > 0 && (
              <Typography
                variant="body2"
                color="warning.main"
                sx={{
                  textAlign: "center",
                  fontWeight: 600,
                }}
              >
                {resumen.families_con_error} Family(s)
                terminaron con error.
              </Typography>
            )}
          </Stack>
        )}

        {/* ================================================ */}
        {/* ERROR GENERAL */}
        {/* ================================================ */}

        {fallo && (
          <Stack
            spacing={2}
            sx={{
              py: 3,
              textAlign: "center",
            }}
          >
            <ErrorOutlineOutlinedIcon
              color="error"
              sx={{
                fontSize: 54,
                mx: "auto",
              }}
            />

            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 700 }}
            >
              No se pudo completar la sincronización
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
            >
              {error}
            </Typography>
          </Stack>
        )}
      </DialogContent>

      {!sincronizando && (
        <>
          <Divider />

          <DialogActions sx={{ p: 2 }}>
            <Button
              variant="contained"
              onClick={onClose}
            >
              Cerrar
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
};

export default SincronizacionMercadoLibreModal;