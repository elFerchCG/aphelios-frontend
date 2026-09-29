import {
  Box,
  Typography,
} from "@mui/material";

import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

const ChatNotice = () => {
  return (
    <Box
      sx={{
        mx: 2,
        mb: 1.5,
        px: 1.5,
        py: 1.2,

        display: "flex",
        alignItems: "flex-start",
        gap: 1,

        borderRadius: 2,

        backgroundColor: "#F4F9FD",

        border:
          "1px solid #D6EAF8",
      }}
    >
      {/* =====================================================
          ICONO
      ===================================================== */}

      <InfoOutlinedIcon
        sx={{
          mt: "2px",

          fontSize: 18,

          color: "#2389dc",

          flexShrink: 0,
        }}
      />

      {/* =====================================================
          MENSAJE
      ===================================================== */}

      <Typography
        variant="caption"
        sx={{
          color: "#546E7A",

          lineHeight: 1.5,

          fontFamily:
            "Montserrat, sans-serif",
        }}
      >
        <Box
          component="span"
          sx={{
            fontWeight: 700,

            color: "#37474F",
          }}
        >
          Uso interno:
        </Box>

        {" "}Este chat está destinado
        exclusivamente a comunicación
        relacionada con el trabajo.
        Actualmente se encuentra en{" "}

        <Box
          component="span"
          sx={{
            fontWeight: 700,

            color: "#2389dc",
          }}
        >
          fase de prueba
        </Box>

        .
      </Typography>
    </Box>
  );
};

export default ChatNotice;