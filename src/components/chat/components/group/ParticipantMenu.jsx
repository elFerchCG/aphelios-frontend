import { Menu, MenuItem, ListItemIcon, ListItemText } from "@mui/material";

import PersonRemoveOutlinedIcon from "@mui/icons-material/PersonRemoveOutlined";

const ParticipantMenu = ({
  anchorEl,
  open,
  participante,
  esUsuarioActual = false,
  onClose,
  onRemove,
}) => {
  // ============================================================
  // QUITAR PARTICIPANTE
  // ============================================================

  const handleRemove = (event) => {
    console.log("[ParticipantMenu] CLICK QUITAR", {
      participante,
      event,
    });

    if (!participante) {
      console.log("[ParticipantMenu] No hay participante");
      return;
    }

    console.log("[ParticipantMenu] Ejecutando onRemove", participante);

    if (onRemove) {
      onRemove(participante);
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "right",
      }}
      transformOrigin={{
        vertical: "top",
        horizontal: "right",
      }}
      slotProps={{
        paper: {
          sx: {
            minWidth: 190,
            borderRadius: 2,
          },
        },
      }}
    >
      {!esUsuarioActual && (
        <MenuItem
          onClick={handleRemove}
          sx={{
            color: "error.main",
          }}
        >
          <ListItemIcon>
            <PersonRemoveOutlinedIcon fontSize="small" color="error" />
          </ListItemIcon>

          <ListItemText>Quitar del grupo</ListItemText>
        </MenuItem>
      )}

      {esUsuarioActual && (
        <MenuItem disabled>
          <ListItemText>Sin acciones disponibles</ListItemText>
        </MenuItem>
      )}
    </Menu>
  );
};

export default ParticipantMenu;
