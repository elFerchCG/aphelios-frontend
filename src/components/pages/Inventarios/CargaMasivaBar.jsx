// src/components/common/CargaMasivaBar.jsx
import { useState } from "react";
import {
  Box,
  Button,
  Switch,
  FormControlLabel,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";

import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

function CargaMasivaBar({
  // callbacks opcionales para el menú
  onHowItWorks,
  onDownloadTemplate,
  onUploadSimular,

  // textos
  labelBoton = "CARGA MASIVA",

  // switches
  modoAgregarActualizar,
  onChangeModo,
  simularPrimero,
  onChangeSimular,
}) {
  const [anchorEl, setAnchorEl] = useState(null);
  const openMenu = Boolean(anchorEl);

  const handleOpenMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleHowItWorks = () => {
    handleCloseMenu();
    onHowItWorks?.();
  };

  const handleDownloadTemplate = () => {
    handleCloseMenu();
    onDownloadTemplate?.();
  };

  const handleUploadSim = () => {
    handleCloseMenu();
    onUploadSimular?.();
  };

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
      {/* Botón CARGA MASIVA con menú (3 puntitos) */}
      <Box>
        <Button
          variant="contained"
          color="primary"
          endIcon={<MoreVertIcon />}
          sx={{
            textTransform: "none", // respeta mayúsculas/minúsculas
            fontWeight: 400,       // no negritas
          }}
          onClick={handleOpenMenu}
        >
          {labelBoton}
        </Button>

        <Menu
          anchorEl={anchorEl}
          open={openMenu}
          onClose={handleCloseMenu}
        >
          <MenuItem onClick={handleHowItWorks}>
            <ListItemIcon>
              <InfoOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="¿Cómo funciona la carga?" />
          </MenuItem>

          <MenuItem onClick={handleDownloadTemplate}>
            <ListItemIcon>
              <FileDownloadIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Descargar plantilla (XLSX)" />
          </MenuItem>

          <MenuItem onClick={handleUploadSim}>
            <ListItemIcon>
              <CloudUploadIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Subir Excel" />
          </MenuItem>
        </Menu>
      </Box>

      {/* Switches: Modo + Simular */}
      <FormControlLabel
        control={
          <Switch
            size="small"
            checked={modoAgregarActualizar}
            onChange={(e) => onChangeModo?.(e.target.checked)}
          />
        }
        label={
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <span>Modo: Agregar/Actualizar</span>
            <Tooltip title="En este modo, al cargar, los existentes se actualizan y los nuevos se crean.">
              <InfoOutlinedIcon
                fontSize="small"
                sx={{ color: "text.secondary", cursor: "pointer" }}
              />
            </Tooltip>
          </Box>
        }
        sx={{ m: 0 }}
      />

      <FormControlLabel
        control={
          <Switch
            size="small"
            checked={simularPrimero}
            onChange={(e) => onChangeSimular?.(e.target.checked)}
          />
        }
        label="Simular primero (recomendado)"
        sx={{ m: 0 }}
      />
    </Box>
  );
}

export default CargaMasivaBar;
