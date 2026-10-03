import { useEffect, useState } from "react";
import axios from "axios";

import {
  Button,
  Chip,
  IconButton,
  Tooltip,
} from "@mui/material";

import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import AddLinkOutlinedIcon from "@mui/icons-material/AddLinkOutlined";
import LinkOutlinedIcon from "@mui/icons-material/LinkOutlined";

// =====================================================
// COMPONENTES COMUNES APHELIOS
// =====================================================

import PageHeader from "../common/PageHeader";
import PageToolbarCard from "../common/PageToolbarCard";
import AppDataGrid from "../common/AppDataGrid";

import { toolbarButtonSx } from "../common/formStyles";

import ConectarMercadoLibreModal from "./ConectarMercadoLibreModal";

// [MULTICUENTA-ML]
import PublishOutlinedIcon from "@mui/icons-material/PublishOutlined";
import PublicarEnCuentaDialog from "../multicuentaML/PublicarEnCuentaDialog";
// [/MULTICUENTA-ML]

const apiUrl =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_URL
    : process.env.REACT_APP_API_URL_LOCAL;

const CuentasEcommerce = () => {
  const [cuentas, setCuentas] = useState([]);
  const [loading, setLoading] = useState(false);

  const [openMercadoLibre, setOpenMercadoLibre] =
    useState(false);

  // [MULTICUENTA-ML]
  const [openPublicar, setOpenPublicar] = useState(false);
  // [/MULTICUENTA-ML]

  // =====================================================
  // OBTENER CUENTAS
  // =====================================================

  const obtenerCuentas = async () => {
    try {
      setLoading(true);

      const response = await axios.get(
        `${apiUrl}/ecommerce/cuentas`
      );

      setCuentas(
        response.data?.cuentas || []
      );
    } catch (error) {
      console.error(
        "Error obteniendo cuentas ecommerce:",
        error
      );

      setCuentas([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    obtenerCuentas();
  }, []);

  // =====================================================
  // AUTORIZAR / REAUTORIZAR MERCADO LIBRE
  // =====================================================

  const autorizarMercadoLibre = (row) => {
    const cuentaMlId =
      row?.cuenta_ml_id;

    if (!cuentaMlId) {
      console.error(
        "La cuenta no tiene cuenta_ml_id."
      );

      return;
    }

    // ---------------------------------------------------
    // Navegamos directamente al backend.
    //
    // El backend:
    // 1. obtiene la configuración de la cuenta
    // 2. genera el state
    // 3. redirige a Mercado Libre
    // ---------------------------------------------------

    window.location.href =
      `${apiUrl}/mercadoLibre/oauth/autorizar/${cuentaMlId}`;
  };

  // =====================================================
  // COLUMNAS
  // =====================================================

  const columns = [
    {
      field: "canal_nombre",
      headerName: "Canal",
      flex: 0.8,
      minWidth: 160,
    },
    {
      field: "nombre",
      headerName: "Cuenta",
      flex: 1,
      minWidth: 200,
    },
    {
      field: "seller_id",
      headerName: "Seller ID",
      flex: 0.7,
      minWidth: 150,

      valueGetter: (_, row) =>
        row?.seller_id || "-",
    },
    {
      field: "site_id",
      headerName: "Sitio",
      flex: 0.4,
      minWidth: 100,

      valueGetter: (_, row) =>
        row?.site_id || "-",
    },
    {
      field: "activo",
      headerName: "Estado",
      flex: 0.4,
      minWidth: 120,

      renderCell: (params) => {
        const activo =
          Number(params.row.activo) === 1;

        return (
          <Chip
            label={
              activo
                ? "Activa"
                : "Inactiva"
            }
            color={
              activo
                ? "success"
                : "default"
            }
            size="small"
            variant="outlined"
          />
        );
      },
    },

    // ===================================================
    // OAUTH
    // ===================================================

    {
      field: "oauth",
      headerName: "OAuth",
      width: 100,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      align: "center",
      headerAlign: "center",

      renderCell: (params) => {
        const row = params.row;

        // Por ahora esta acción únicamente aplica
        // para cuentas de Mercado Libre.
        const esMercadoLibre =
          row?.canal_codigo ===
            "mercado_libre" ||
          row?.canal_nombre ===
            "Mercado Libre";

        if (!esMercadoLibre) {
          return null;
        }

        return (
          <Tooltip title="Autorizar / reautorizar Mercado Libre">
            <IconButton
              size="small"
              color="primary"
              onClick={() =>
                autorizarMercadoLibre(
                  row
                )
              }
            >
              <LinkOutlinedIcon />
            </IconButton>
          </Tooltip>
        );
      },
    },
  ];

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <>
      {/* =================================================
          HEADER ESTÁNDAR
      ================================================= */}

      <PageHeader
        icon={StorefrontOutlinedIcon}
        title="Cuentas Ecommerce"
        subtitle="Administra las cuentas conectadas a los diferentes canales de venta."
      />

      {/* =================================================
          TOOLBAR
      ================================================= */}

      <PageToolbarCard>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          <Button
            variant="contained"
            startIcon={
              <AddLinkOutlinedIcon />
            }
            sx={{
              ...toolbarButtonSx,
              ml: "auto",
            }}
            onClick={() =>
              setOpenMercadoLibre(true)
            }
          >
            Conectar Mercado Libre
          </Button>

          {/* [MULTICUENTA-ML] */}
          <Button
            variant="outlined"
            startIcon={<PublishOutlinedIcon />}
            sx={toolbarButtonSx}
            onClick={() => setOpenPublicar(true)}
          >
            Publicar en otra cuenta
          </Button>
          {/* [/MULTICUENTA-ML] */}
        </div>
      </PageToolbarCard>

      {/* =================================================
          TABLA ESTÁNDAR
      ================================================= */}

      <div
        style={{
          marginLeft: "30px",
          marginRight: "30px",
        }}
      >
        <AppDataGrid
          rows={cuentas}
          columns={columns}
          loading={loading}
          getRowId={(row) => row.id}
          exportFileName="cuentas-ecommerce"
        />

        <ConectarMercadoLibreModal
          open={openMercadoLibre}
          onClose={() =>
            setOpenMercadoLibre(false)
          }
          onSuccess={obtenerCuentas}
        />

        {/* [MULTICUENTA-ML] */}
        <PublicarEnCuentaDialog
          open={openPublicar}
          onClose={() => setOpenPublicar(false)}
        />
        {/* [/MULTICUENTA-ML] */}
      </div>
    </>
  );
};

export default CuentasEcommerce;