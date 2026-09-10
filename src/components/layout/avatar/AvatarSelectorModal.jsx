import React from "react";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Typography,
} from "@mui/material";

import AvatarPresetGrid from "./AvatarPresetGrid";
import AvatarCustomSection from "./AvatarCustomSection";
import useAvatarSelector from "./useAvatarSelector";

const AvatarSelectorModal = ({
  open,
  onClose,
}) => {
  const {
    selectedAvatar,

    hasCustomAvatar,
    loadingCustom,

    saving,
    error,

    hayNuevaImagen,
    customSeleccionada,
    sinCambios,
    imagenCustomVisible,

    selectPreset,
    selectSavedCustom,
    selectCustomFile,
    saveAvatar,
    closeModal,
  } = useAvatarSelector(
    open,
    onClose,
  );

  return (
    <Dialog
      open={open}
      onClose={closeModal}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius:
            "20px",

          p: 1,
        },
      }}
    >
      <DialogTitle
        sx={{
          fontWeight: 700,
          color: "#0f2744",
        }}
      >
        Elige tu avatar
      </DialogTitle>

      <DialogContent>
        <Typography
          sx={{
            fontSize: 14,
            color: "#667085",
            mb: 3,
          }}
        >
          Selecciona el avatar que
          aparecerá en tu perfil de
          Aphelios.
        </Typography>

        <AvatarPresetGrid
          selectedAvatar={
            selectedAvatar
          }
          onSelect={
            selectPreset
          }
        />

        <AvatarCustomSection
          hasCustomAvatar={
            hasCustomAvatar
          }
          loadingCustom={
            loadingCustom
          }
          customSeleccionada={
            customSeleccionada
          }
          hayNuevaImagen={
            hayNuevaImagen
          }
          imagenCustomVisible={
            imagenCustomVisible
          }
          saving={
            saving
          }
          onSelectSaved={
            selectSavedCustom
          }
          onFileChange={
            selectCustomFile
          }
        />

        {error && (
          <Typography
            sx={{
              mt: 2,

              fontSize: 13,
              fontWeight: 600,

              color:
                "#d32f2f",
            }}
          >
            {error}
          </Typography>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          pb: 2,
        }}
      >
        <Button
          onClick={
            closeModal
          }
          disabled={
            saving
          }
          sx={{
            fontWeight: 700,

            textTransform:
              "none",

            color:
              "#667085",
          }}
        >
          Cancelar
        </Button>

        <Button
          variant="contained"
          onClick={
            saveAvatar
          }
          disabled={
            saving ||
            !selectedAvatar ||
            sinCambios
          }
          sx={{
            minWidth:
              110,

            fontWeight:
              700,

            textTransform:
              "none",

            borderRadius:
              "10px",
          }}
        >
          {saving ? (
            <CircularProgress
              size={20}
              color="inherit"
            />
          ) : (
            "Guardar"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AvatarSelectorModal;