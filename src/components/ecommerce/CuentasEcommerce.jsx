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
import SyncOutlinedIcon from "@mui/icons-material/SyncOutlined";

// =====================================================
// MODALES
// =====================================================

import ConectarMercadoLibreModal from "./ConectarMercadoLibreModal";
import SincronizacionMercadoLibreModal from "./components/SincronizacionMercadoLibreModal";

// =====================================================
// COMPONENTES COMUNES APHELIOS
// =====================================================

import PageHeader from "../common/PageHeader";
import PageToolbarCard from "../common/PageToolbarCard";
import AppDataGrid from "../common/AppDataGrid";

import { toolbarButtonSx } from "../common/formStyles";


// [MULTICUENTA-ML]
import PublishOutlinedIcon from "@mui/icons-material/PublishOutlined";
import PublicarEnCuentaDialog from "../multicuentaML/PublicarEnCuentaDialog";
// [/MULTICUENTA-ML]

const apiUrl =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_URL
    : process.env.REACT_APP_API_URL_LOCAL;

// =====================================================
// COMPONENTE
// =====================================================

const CuentasEcommerce = () => {
  // ===================================================
  // ESTADOS
  // ===================================================

  const [cuentas, setCuentas] = useState([]);
  const [loading, setLoading] = useState(false);

  const [openMercadoLibre, setOpenMercadoLibre] =
    useState(false);

  // [MULTICUENTA-ML]
  const [openPublicar, setOpenPublicar] = useState(false);
  // [/MULTICUENTA-ML]

  // ---------------------------------------------------
  // SINCRONIZACIÓN MERCADO LIBRE
  // ---------------------------------------------------

  const [sincronizando, setSincronizando] =
    useState(false);

  const [
    openSincronizacion,
    setOpenSincronizacion,
  ] = useState(false);

  const [
    resultadoSincronizacion,
    setResultadoSincronizacion,
  ] = useState(null);

  const [
    errorSincronizacion,
    setErrorSincronizacion,
  ] = useState(null);

  const [
    tiempoTranscurrido,
    setTiempoTranscurrido,
  ] = useState(0);

  // ===================================================
  // OBTENER CUENTAS
  // ===================================================

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

  // ===================================================
  // CARGA INICIAL
  // ===================================================

  useEffect(() => {
    obtenerCuentas();
  }, []);

  // ===================================================
  // CRONÓMETRO DE SINCRONIZACIÓN
  // ===================================================

  useEffect(() => {
    if (!sincronizando) {
      return;
    }

    const inicio = Date.now();

    setTiempoTranscurrido(0);

    const interval = setInterval(() => {
      const segundos = Math.floor(
        (Date.now() - inicio) / 1000
      );

      setTiempoTranscurrido(segundos);
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [sincronizando]);

  // ===================================================
  // AUTORIZAR / REAUTORIZAR MERCADO LIBRE
  // ===================================================

  const autorizarMercadoLibre = (row) => {
    const cuentaMlId =
      row?.cuenta_ml_id;

    if (!cuentaMlId) {
      console.error(
        "La cuenta no tiene cuenta_ml_id."
      );

      return;
    }

    window.location.href =
      `${apiUrl}/mercadoLibre/oauth/autorizar/${cuentaMlId}`;
  };

  // ===================================================
  // SINCRONIZAR PRODUCTOS MERCADO LIBRE
  // ===================================================

  const sincronizarProductosMercadoLibre =
    async () => {
      if (sincronizando) {
        return;
      }

      try {
        // Limpiamos resultado anterior
        setResultadoSincronizacion(null);
        setErrorSincronizacion(null);
        setTiempoTranscurrido(0);

        // Abrimos modal
        setOpenSincronizacion(true);

        // Iniciamos loader
        setSincronizando(true);

        const response =
          await axios.post(
            `${apiUrl}/mercadoLibreSync/sincronizarTodo`,
            {
              concurrenciaDescubrimiento: 5,
            }
          );

        console.log(
          "Resultado sincronización Mercado Libre:",
          response.data
        );

        setResultadoSincronizacion(
          response.data
        );

        // Refrescamos cuentas
        await obtenerCuentas();
      } catch (error) {
        console.error(
          "Error sincronizando Mercado Libre:",
          error
        );

        setErrorSincronizacion(
          error.response?.data?.message ||
            error.response?.data?.error ||
            error.message ||
            "Ocurrió un error durante la sincronización."
        );
      } finally {
        setSincronizando(false);
      }
    };

  // ===================================================
  // COLUMNAS
  // ===================================================

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

    // =================================================
    // OAUTH
    // =================================================

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

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <>
      {/* =================================================
          HEADER
      ================================================= */}

      <PageHeader
        icon={
          StorefrontOutlinedIcon
        }
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
            gap: "12px",
            flexWrap: "wrap",
            justifyContent:
              "flex-end",
          }}
        >
          {/* =============================================
              SINCRONIZAR
          ============================================= */}

          <Button
            variant="outlined"
            startIcon={
              <SyncOutlinedIcon />
            }
            sx={
              toolbarButtonSx
            }
            disabled={
              sincronizando
            }
            onClick={
              sincronizarProductosMercadoLibre
            }
          >
            {sincronizando
              ? "Sincronizando..."
              : "Sincronizar productos"}
          </Button>

          {/* =============================================
              CONECTAR CUENTA
          ============================================= */}

          <Button
            variant="contained"
            startIcon={
              <AddLinkOutlinedIcon />
            }
            sx={
              toolbarButtonSx
            }
            disabled={
              sincronizando
            }
            onClick={() =>
              setOpenMercadoLibre(
                true
              )
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
          TABLA
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
          getRowId={(row) =>
            row.id
          }
          exportFileName="cuentas-ecommerce"
        />
      </div>

      {/* =================================================
          MODAL CONECTAR MERCADO LIBRE
      ================================================= */}

      <ConectarMercadoLibreModal
        open={
          openMercadoLibre
        }
        onClose={() =>
          setOpenMercadoLibre(
            false
          )
        }
        onSuccess={
          obtenerCuentas
        }
      />

        {/* [MULTICUENTA-ML] */}
        <PublicarEnCuentaDialog
          open={openPublicar}
          onClose={() => setOpenPublicar(false)}
        />
        {/* [/MULTICUENTA-ML] */}

      {/* =================================================
          MODAL SINCRONIZACIÓN
      ================================================= */}

      <SincronizacionMercadoLibreModal
        open={
          openSincronizacion
        }
        sincronizando={
          sincronizando
        }
        resultado={
          resultadoSincronizacion
        }
        error={
          errorSincronizacion
        }
        tiempoTranscurrido={
          tiempoTranscurrido
        }
        onClose={() => {
          setOpenSincronizacion(
            false
          );

          setResultadoSincronizacion(
            null
          );

          setErrorSincronizacion(
            null
          );
        }}
      />
    </>
  );
};

export default CuentasEcommerce;