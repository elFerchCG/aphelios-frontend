import { Box, Button } from "@mui/material";

import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import GroupAddIcon from "@mui/icons-material/GroupAdd";

const ChatActions = ({
  onNuevoChat,
  onNuevoGrupo,
  puedeCrearGrupos = false,
}) => {
  return (
    <Box
      sx={{
        px: 2,
        pb: 1.5,

        display: "flex",
        gap: 1,
      }}
    >
      {/* =====================================================
          NUEVO CHAT
      ===================================================== */}

      <Button
        fullWidth
        variant="contained"
        startIcon={<PersonAddAlt1Icon />}
        onClick={onNuevoChat}
        sx={{
          textTransform: "none",

          fontFamily: "Montserrat, sans-serif",

          fontWeight: 700,

          borderRadius: 2,

          backgroundColor: "#2389dc",

          boxShadow: "none",

          "&:hover": {
            backgroundColor: "#1976c5",

            boxShadow: "none",
          },
        }}
      >
        Nuevo chat
      </Button>

      {/* =====================================================
          NUEVO GRUPO
          Solo visible para administradores
      ===================================================== */}

      {puedeCrearGrupos && (
        <Button
          fullWidth
          variant="outlined"
          startIcon={<GroupAddIcon />}
          onClick={onNuevoGrupo}
          sx={{
            textTransform: "none",

            fontFamily: "Montserrat, sans-serif",

            fontWeight: 700,

            borderRadius: 2,
          }}
        >
          Grupo
        </Button>
      )}
    </Box>
  );
};

export default ChatActions;