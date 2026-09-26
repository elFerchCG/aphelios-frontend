import {
  Avatar,
  Box,
  Divider,
  IconButton,
  Typography,
} from "@mui/material";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CloseIcon from "@mui/icons-material/Close";
import PersonIcon from "@mui/icons-material/Person";
import GroupIcon from "@mui/icons-material/Group";
import GroupsIcon from "@mui/icons-material/Groups";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

// ============================================================
// COMPONENTE
// ============================================================

const ConversationHeader = ({
  conversacion,
  onBack,
  onClose,
  onOpenInfo,
}) => {
  // ============================================================
  // NOMBRE
  // ============================================================

  const obtenerNombreConversacion = () => {
    if (conversacion?.tipo === "directa") {
      return (
        conversacion.otro_usuario_nombre ||
        conversacion.nombre ||
        "Conversación directa"
      );
    }

    return conversacion?.nombre || "Conversación";
  };

  // ============================================================
  // ICONO
  // ============================================================

  const obtenerIconoConversacion = () => {
    if (conversacion?.tipo === "directa") {
      return <PersonIcon />;
    }

    if (conversacion?.tipo === "rol") {
      return <GroupsIcon />;
    }

    return <GroupIcon />;
  };

  // ============================================================
  // SUBTÍTULO
  // ============================================================

  const obtenerTipoConversacion = () => {
    if (conversacion?.tipo === "directa") {
      return "Conversación directa";
    }

    if (conversacion?.tipo === "rol") {
      return "Chat de rol";
    }

    return "Grupo";
  };

  // ============================================================
  // ¿PUEDE MOSTRAR INFORMACIÓN?
  // ============================================================

  const puedeVerInfo =
    conversacion?.tipo === "grupo";

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <>
      <Box
        sx={{
          px: 2,
          py: 1.4,

          display: "flex",
          alignItems: "center",

          gap: 1.2,

          backgroundColor: "#ffffff",
        }}
      >
        {/* ====================================================
            REGRESAR
        ==================================================== */}

        <IconButton
          onClick={onBack}
          aria-label="Regresar"
        >
          <ArrowBackIcon />
        </IconButton>

        {/* ====================================================
            AVATAR
        ==================================================== */}

        <Avatar
          sx={{
            width: 42,
            height: 42,

            backgroundColor: "#9fb4bf",
          }}
        >
          {obtenerIconoConversacion()}
        </Avatar>

        {/* ====================================================
            INFORMACIÓN
        ==================================================== */}

        <Box
          sx={{
            flex: 1,
            minWidth: 0,
          }}
        >
          <Typography
            noWrap
            sx={{
              fontFamily:
                "Montserrat, sans-serif",

              fontWeight: 800,

              fontSize: 16,

              color: "#0f2744",
            }}
          >
            {obtenerNombreConversacion()}
          </Typography>

          <Typography
            variant="caption"
            color="text.secondary"
          >
            {obtenerTipoConversacion()}
          </Typography>
        </Box>

        {/* ====================================================
            INFORMACIÓN DEL GRUPO
        ==================================================== */}

        {puedeVerInfo && onOpenInfo && (
          <IconButton
            onClick={onOpenInfo}
            aria-label="Información del grupo"
            title="Información del grupo"
          >
            <InfoOutlinedIcon />
          </IconButton>
        )}

        {/* ====================================================
            CERRAR
        ==================================================== */}

        <IconButton
          onClick={onClose}
          aria-label="Cerrar chat"
        >
          <CloseIcon />
        </IconButton>
      </Box>

      <Divider />
    </>
  );
};

export default ConversationHeader;