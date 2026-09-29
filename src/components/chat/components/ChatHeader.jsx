import {
  Box,
  Divider,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";

import VolumeUpOutlinedIcon from "@mui/icons-material/VolumeUpOutlined";
import VolumeOffOutlinedIcon from "@mui/icons-material/VolumeOffOutlined";

const ChatHeader = ({
  onClose,

  chatSilenciado = false,
  loadingPreferencias = false,
  onToggleSilencio,
}) => {
  return (
    <>
      <Box
        sx={{
          px: 2.5,
          py: 2,

          display: "flex",
          alignItems: "center",
          justifyContent:
            "space-between",
        }}
      >
        <Box
          sx={{
            minWidth: 0,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontFamily:
                "Montserrat, sans-serif",

              fontWeight: 800,

              color: "#0f2744",
            }}
          >
            Mensajes
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
          >
            Comunicación interna de
            APHELIOS
          </Typography>
        </Box>

        {/* ===============================================
            ACCIONES
        =============================================== */}

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
          }}
        >
          {/* =============================================
              SONIDO GLOBAL
          ============================================= */}

          <Tooltip
            title={
              chatSilenciado
                ? "Activar sonidos del chat"
                : "Silenciar todos los sonidos"
            }
            placement="bottom"
          >
            <span>
              <IconButton
                onClick={
                  onToggleSilencio
                }
                disabled={
                  loadingPreferencias
                }
                aria-label={
                  chatSilenciado
                    ? "Activar sonidos del chat"
                    : "Silenciar todos los sonidos"
                }
                sx={{
                  color:
                    chatSilenciado
                      ? "#d32f2f"
                      : "#607d8b",

                  "&:hover": {
                    backgroundColor:
                      chatSilenciado
                        ? "rgba(211, 47, 47, 0.08)"
                        : "rgba(96, 125, 139, 0.08)",
                  },
                }}
              >
                {chatSilenciado ? (
                  <VolumeOffOutlinedIcon />
                ) : (
                  <VolumeUpOutlinedIcon />
                )}
              </IconButton>
            </span>
          </Tooltip>

          {/* =============================================
              CERRAR
          ============================================= */}

          <Tooltip
            title="Cerrar"
            placement="bottom"
          >
            <IconButton
              onClick={onClose}
              aria-label="Cerrar chat"
            >
              <CloseIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Divider />
    </>
  );
};

export default ChatHeader;