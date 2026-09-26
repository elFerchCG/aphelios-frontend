import {
  Box,
  CircularProgress,
  Divider,
  IconButton,
  TextField,
} from "@mui/material";

import SendIcon from "@mui/icons-material/Send";

// ============================================================
// COMPONENTE
// ============================================================

const MessageInput = ({
  value,
  enviando,
  onChange,
  onSend,
}) => {
  // ============================================================
  // ENTER PARA ENVIAR
  // SHIFT + ENTER PARA SALTO DE LÍNEA
  // ============================================================

  const handleKeyDown = (event) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      if (
        !enviando &&
        value.trim()
      ) {
        onSend();
      }
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <>
      <Divider />

      <Box
        sx={{
          p: 1.5,

          display: "flex",

          alignItems: "flex-end",

          gap: 1,

          backgroundColor: "#ffffff",
        }}
      >
        {/* ====================================================
            CAMPO DE MENSAJE
        ==================================================== */}

        <TextField
          fullWidth
          multiline
          maxRows={4}
          size="small"
          placeholder="Escribe un mensaje..."
          value={value}
          disabled={enviando}
          onChange={(event) =>
            onChange(event.target.value)
          }
          onKeyDown={handleKeyDown}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 2,

              fontFamily:
                "Montserrat, sans-serif",

              backgroundColor:
                "#ffffff",
            },
          }}
        />

        {/* ====================================================
            BOTÓN ENVIAR
        ==================================================== */}

        <IconButton
          onClick={onSend}
          disabled={
            enviando ||
            !value.trim()
          }
          aria-label="Enviar mensaje"
          sx={{
            width: 42,
            height: 42,

            backgroundColor: "#1565a8",

            color: "#ffffff",

            "&:hover": {
              backgroundColor:
                "#0f527f",
            },

            "&.Mui-disabled": {
              backgroundColor:
                "#d9dde2",

              color: "#ffffff",
            },
          }}
        >
          {enviando ? (
            <CircularProgress
              size={20}
              sx={{
                color: "#ffffff",
              }}
            />
          ) : (
            <SendIcon />
          )}
        </IconButton>
      </Box>
    </>
  );
};

export default MessageInput;