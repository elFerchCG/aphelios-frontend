import React, { useEffect, useState } from "react";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Typography,
} from "@mui/material";

import axios from "axios";

import Swal from "sweetalert2";

import { avatarOptions } from "../../config/avatarConfig";

import useAuthStore from "../../store/authStore";

const apiUrl =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_URL
    : process.env.REACT_APP_API_URL_LOCAL;

const AvatarSelectorModal = ({ open, onClose }) => {
  const { token, user, updateUser } = useAuthStore();

  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar_key || "");

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  // =====================================================
  // SINCRONIZAR AVATAR ACTUAL
  // =====================================================

  useEffect(() => {
    if (open) {
      setSelectedAvatar(user?.avatar_key || "");

      setError("");
    }
  }, [open, user?.avatar_key]);

  // =====================================================
  // SELECCIONAR AVATAR
  // =====================================================

  const handleSelectAvatar = (avatarKey) => {
    setSelectedAvatar(avatarKey);
    setError("");
  };

  // =====================================================
  // GUARDAR AVATAR
  // =====================================================

  const handleSaveAvatar = async () => {
    if (!selectedAvatar) {
      setError("Selecciona un avatar antes de guardar.");

      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await axios.patch(
        `${apiUrl}/usuarios/me/avatar`,
        {
          avatar_key: selectedAvatar,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.data?.ok) {
        throw new Error(
          response.data?.message || "No se pudo actualizar el avatar.",
        );
      }

      updateUser({
        avatar_key: selectedAvatar,
      });

      await Swal.fire({
        icon: "success",
        title: "Avatar actualizado",
        text: "Tu avatar se actualizó correctamente.",
        timer: 1800,
        showConfirmButton: false,
      });

      onClose();
    } catch (error) {
      console.error("Error al actualizar avatar:", error);

      setError(
        error.response?.data?.message ||
          error.message ||
          "Ocurrió un error al guardar el avatar.",
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // CERRAR
  // =====================================================

  const handleClose = () => {
    if (saving) {
      return;
    }

    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: "20px",
          p: 1,
        },
      }}
    >
      <DialogTitle
        sx={{
          fontFamily: "Montserrat, sans-serif",
          fontWeight: 700,
          color: "#0f2744",
        }}
      >
        Elige tu avatar
      </DialogTitle>

      <DialogContent>
        <Typography
          sx={{
            fontFamily: "Montserrat, sans-serif",
            fontSize: 14,
            color: "#667085",
            mb: 3,
          }}
        >
          Selecciona el avatar que aparecerá en tu perfil de Aphelios.
        </Typography>

        <div className="avatar-grid">
          {avatarOptions.map((avatar) => {
            const selected = selectedAvatar === avatar.key;

            return (
              <button
                key={avatar.key}
                type="button"
                className={`avatar-option ${selected ? "selected" : ""}`}
                onClick={() => handleSelectAvatar(avatar.key)}
              >
                <img src={avatar.image} alt={avatar.name} />

                <span>{avatar.name}</span>
              </button>
            );
          })}
        </div>

        {error && (
          <Typography
            sx={{
              mt: 2,
              fontFamily: "Montserrat, sans-serif",
              fontSize: 13,
              fontWeight: 600,
              color: "#d32f2f",
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
          onClick={handleClose}
          disabled={saving}
          sx={{
            fontFamily: "Montserrat, sans-serif",
            fontWeight: 700,
            textTransform: "none",
            color: "#667085",
          }}
        >
          Cancelar
        </Button>

        <Button
          variant="contained"
          onClick={handleSaveAvatar}
          disabled={
            saving || !selectedAvatar || selectedAvatar === user?.avatar_key
          }
          sx={{
            minWidth: 110,
            fontFamily: "Montserrat, sans-serif",
            fontWeight: 700,
            textTransform: "none",
            borderRadius: "10px",
          }}
        >
          {saving ? <CircularProgress size={20} color="inherit" /> : "Guardar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AvatarSelectorModal;
