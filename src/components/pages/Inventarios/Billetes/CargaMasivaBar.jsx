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
  Alert,
} from "@mui/material";

import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

function CargaMasivaBar({
  onHowItWorks,
  onDownloadTemplate,
  onUploadSimular,

  labelBoton = "CARGA MASIVA",

  modoAgregarActualizar = false,
  onChangeModo,
  simularPrimero = true,
  onChangeSimular,

  modoLabel = "Modo: Agregar/Actualizar",
  modoTooltip = "En este modo, al cargar, los existentes se actualizan y los nuevos se crean.",
  simularLabel = "Simular primero (recomendado)",

  showModoAlert = false,
  modoAlertSeverity = "warning",
  modoAlertText = "",

  showSimularAlert = false,
  simularAlertSeverity = "info",
  simularAlertText = "",
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
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25, flex: 1 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: { xs: "stretch", md: "center" },
          flexDirection: { xs: "column", md: "row" },
          gap: 2,
        }}
      >
        <Box>
          <Button
            variant="contained"
            color="primary"
            endIcon={<MoreVertIcon />}
            sx={{
              textTransform: "none",
              fontWeight: 500,
              minWidth: 180,
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

        <FormControlLabel
          sx={{ m: 0 }}
          control={
            <Switch
              size="small"
              checked={modoAgregarActualizar}
              onChange={(e) => onChangeModo?.(e.target.checked)}
            />
          }
          label={
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <span>{modoLabel}</span>
              <Tooltip title={modoTooltip}>
                <InfoOutlinedIcon
                  fontSize="small"
                  sx={{ color: "text.secondary", cursor: "pointer" }}
                />
              </Tooltip>
            </Box>
          }
        />

        <FormControlLabel
          sx={{ m: 0 }}
          control={
            <Switch
              size="small"
              checked={simularPrimero}
              onChange={(e) => onChangeSimular?.(e.target.checked)}
            />
          }
          label={simularLabel}
        />
      </Box>

      {showModoAlert && modoAlertText ? (
        <Alert severity={modoAlertSeverity} variant="outlined">
          {modoAlertText}
        </Alert>
      ) : null}

      {showSimularAlert && simularAlertText ? (
        <Alert severity={simularAlertSeverity} variant="outlined">
          {simularAlertText}
        </Alert>
      ) : null}
    </Box>
  );
}

export default CargaMasivaBar;