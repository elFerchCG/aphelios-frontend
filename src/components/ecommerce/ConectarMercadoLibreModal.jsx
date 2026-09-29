import { useState } from "react";
import axios from "axios";
import { swalSuccess, swalError, swalWarning } from "../../helpers/sweetAlert";

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
} from "@mui/material";

import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import KeyOutlinedIcon from "@mui/icons-material/KeyOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";

import {
  modalTitleSx,
  modalContentSx,
  modalActionsSx,
  modalPrimaryButtonSx,
  modalSecondaryButtonSx,
} from "../common/modalStyles";

const apiUrl =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_URL
    : process.env.REACT_APP_API_URL_LOCAL;

const formularioInicial = {
  nombre: "",
  descripcion: "",
  sellerId: "",
  clientId: "",
  clientSecret: "",
  redirectUri: "",
  siteId: "MLM",
};

const ConectarMercadoLibreModal = ({ open, onClose, onSuccess }) => {
  const [form, setForm] = useState(formularioInicial);
  const [guardando, setGuardando] = useState(false);

  // =====================================================
  // CAMBIAR CAMPOS
  // =====================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =====================================================
  // CERRAR
  // =====================================================

  const handleClose = () => {
    if (guardando) {
      return;
    }

    setForm(formularioInicial);
    onClose();
  };

  // =====================================================
  // CONECTAR CUENTA
  // =====================================================

  const handleGuardar = async () => {
    if (!form.nombre.trim()) {
      return swalWarning(
        "Nombre requerido",
        "Ingresa un nombre para identificar la cuenta.",
      );
    }

    if (!form.sellerId.trim()) {
      return swalWarning(
        "Seller ID requerido",
        "Ingresa el Seller ID de Mercado Libre.",
      );
    }

    if (!form.clientId.trim()) {
      return swalWarning(
        "Client ID requerido",
        "Ingresa el Client ID de la aplicación.",
      );
    }

    if (!form.clientSecret.trim()) {
      return swalWarning(
        "Client Secret requerido",
        "Ingresa el Client Secret de la aplicación.",
      );
    }

    try {
      setGuardando(true);

      const response = await axios.post(
        `${apiUrl}/ecommerce/cuentas/mercadoLibre`,
        {
          nombre: form.nombre.trim(),
          descripcion: form.descripcion.trim() || null,
          sellerId: form.sellerId.trim(),
          clientId: form.clientId.trim(),
          clientSecret: form.clientSecret.trim(),
          redirectUri: form.redirectUri.trim(),
          siteId: form.siteId,
        },
      );

      await swalSuccess(
        "Cuenta conectada",
        response.data?.message ||
          "La cuenta de Mercado Libre fue conectada correctamente.",
      );

      setForm(formularioInicial);

      onClose();

      if (onSuccess) {
        await onSuccess();
      }
    } catch (error) {
      console.error("Error conectando cuenta Mercado Libre:", error);

      const mensaje =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "No se pudo conectar la cuenta de Mercado Libre.";

      await swalError("No se pudo conectar", mensaje);
    } finally {
      setGuardando(false);
    }
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle sx={modalTitleSx}>Conectar Mercado Libre</DialogTitle>

      <DialogContent
        sx={{
          ...modalContentSx,
          pt: "28px !important",
          pb: 3,
        }}
      >
        <Stack spacing={2.2}>
          <TextField
            name="nombre"
            label="Nombre de la cuenta"
            value={form.nombre}
            onChange={handleChange}
            fullWidth
            required
            disabled={guardando}
            placeholder="Ej. Mercado Libre Principal"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <StorefrontOutlinedIcon />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            name="descripcion"
            label="Descripción"
            value={form.descripcion}
            onChange={handleChange}
            fullWidth
            disabled={guardando}
            placeholder="Descripción opcional"
          />

          <TextField
            name="sellerId"
            label="Seller ID"
            value={form.sellerId}
            onChange={handleChange}
            fullWidth
            required
            disabled={guardando}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <BadgeOutlinedIcon />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            name="clientId"
            label="Client ID"
            value={form.clientId}
            onChange={handleChange}
            fullWidth
            required
            disabled={guardando}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <KeyOutlinedIcon />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            name="clientSecret"
            label="Client Secret"
            type="password"
            value={form.clientSecret}
            onChange={handleChange}
            fullWidth
            required
            disabled={guardando}
            autoComplete="new-password"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockOutlinedIcon />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            name="redirectUri"
            label="Redirect URI"
            value={form.redirectUri}
            onChange={handleChange}
            fullWidth
            required
            disabled={guardando}
            placeholder="https://www.testaphelios.com"
          />

          <TextField
            name="siteId"
            label="Sitio"
            value={form.siteId}
            onChange={handleChange}
            select
            fullWidth
            disabled={guardando}
          >
            <MenuItem value="MLM">México (MLM)</MenuItem>
          </TextField>
        </Stack>
      </DialogContent>

      <DialogActions sx={modalActionsSx}>
        <Button
          variant="outlined"
          sx={modalSecondaryButtonSx}
          onClick={handleClose}
          disabled={guardando}
        >
          Cancelar
        </Button>

        <Button
          variant="contained"
          sx={modalPrimaryButtonSx}
          onClick={handleGuardar}
          disabled={guardando}
        >
          {guardando ? "Conectando..." : "Conectar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConectarMercadoLibreModal;
