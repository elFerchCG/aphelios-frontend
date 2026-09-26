import {
  Box,
  Divider,
  IconButton,
  Typography,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";

const ChatHeader = ({
  onClose,
}) => {
  return (
    <>
      <Box
        sx={{
          px: 2.5,
          py: 2,

          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
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
            Comunicación interna de APHELIOS
          </Typography>
        </Box>

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

export default ChatHeader;