import { useEffect, useState } from "react";
import axios from "axios";

import { Button, Chip, IconButton, Tooltip } from "@mui/material";

import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import AddLinkOutlinedIcon from "@mui/icons-material/AddLinkOutlined";
import LinkOutlinedIcon from "@mui/icons-material/LinkOutlined";
import SyncOutlinedIcon from "@mui/icons-material/SyncOutlined";
import PublishOutlinedIcon from "@mui/icons-material/PublishOutlined";
import DynamicFeedOutlinedIcon from "@mui/icons-material/DynamicFeedOutlined";

import { swalError } from "../../helpers/sweetAlert";

// =====================================================
// MODALES
// =====================================================

import ConectarMercadoLibreModal from "./ConectarMercadoLibreModal";
import SincronizacionMercadoLibreModal from "./components/SincronizacionMercadoLibreModal";
import PublicarEnCuentaDialog from "../multicuentaML/PublicarEnCuentaDialog";
import PublicadorMasivoDialog from "../multicuentaML/PublicadorMasivoDialog";

// =====================================================
// COMPONENTES COMUNES APHELIOS
// =====================================================

import PageHeader from "../common/PageHeader";
import PageToolbarCard from "../common/PageToolbarCard";
import AppDataGrid from "../common/AppDataGrid";

import { toolbarButtonSx } from "../common/formStyles";

// =====================================================
// API
// =====================================================

const apiUrl =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_URL
    : process.env.REACT_APP_API_URL_LOCAL;

// =====================================================
// COMPONENTE
// =====================================================

const CuentasEcommerce = () => {
  // ===================================================
  // ESTADOS GENERALES
  // ===================================================

  const [cuentas, setCuentas] = useState([]);
  const [loading, setLoading] = useState(false);

  const [openMercadoLibre, setOpenMercadoLibre] = useState(false);

  const [openPublicar, setOpenPublicar] = useState(false);
  const [openMasivo, setOpenMasivo] = useState(false);

  // ===================================================
  // ESTADOS SINCRONIZACIÓN INDIVIDUAL
  // ===================================================

  const [sincronizando, setSincronizando] = useState(false);

  const [cuentaSincronizando, setCuentaSincronizando] = useState(null);

  const [openSincronizacion, setOpenSincronizacion] = useState(false);

  const [resultadoSincronizacion, setResultadoSincronizacion] = useState(null);

  const [errorSincronizacion, setErrorSincronizacion] = useState(null);

  const [tiempoTranscurrido, setTiempoTranscurrido] = useState(0);

  // ===================================================
  // OBTENER CUENTAS
  // ===================================================

  const obtenerCuentas = async () => {
    try {
      setLoading(true);

      const response = await axios.get(`${apiUrl}/ecommerce/cuentas`);

      setCuentas(response.data?.cuentas || []);
    } catch (error) {
      console.error("Error obteniendo cuentas ecommerce:", error);

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
  // CRONÓMETRO SINCRONIZACIÓN
  // ===================================================

  useEffect(() => {
    if (!sincronizando) return;

    const inicio = Date.now();

    setTiempoTranscurrido(0);

    const interval = setInterval(() => {
      const segundos = Math.floor((Date.now() - inicio) / 1000);

      setTiempoTranscurrido(segundos);
    }, 1000);

    return () => clearInterval(interval);
  }, [sincronizando]);

  // ===================================================
  // AUTORIZAR / REAUTORIZAR MERCADO LIBRE
  // ===================================================

  const autorizarMercadoLibre = (row) => {
    const cuentaMlId = Number(row?.cuenta_ml_id);

    if (!Number.isInteger(cuentaMlId) || cuentaMlId <= 0) {
      console.error("La cuenta no tiene cuenta_ml_id válido.");

      return;
    }

    window.location.href = `${apiUrl}/mercadoLibre/oauth/autorizar/${cuentaMlId}`;
  };

  // ===================================================
  // SINCRONIZAR UNA CUENTA MERCADO LIBRE
  // ===================================================

  const sincronizarCuentaMercadoLibre = async (row) => {
    if (sincronizando) return;

    const cuentaMlId = Number(row?.cuenta_ml_id);

    if (!Number.isInteger(cuentaMlId) || cuentaMlId <= 0) {
      await swalError(
        "Cuenta inválida",
        "No se encontró el identificador de Mercado Libre.",
      );

      return;
    }

    if (Number(row?.activo) !== 1) {
      await swalError(
        "Cuenta inactiva",
        "No puedes sincronizar una cuenta inactiva.",
      );

      return;
    }

    try {
      // -------------------------------------------------
      // LIMPIAR ESTADO ANTERIOR
      // -------------------------------------------------

      setCuentaSincronizando(row);

      setResultadoSincronizacion(null);
      setErrorSincronizacion(null);
      setTiempoTranscurrido(0);

      // -------------------------------------------------
      // ABRIR MODAL Y ACTIVAR LOADER
      // -------------------------------------------------

      setOpenSincronizacion(true);
      setSincronizando(true);

      console.log(`Iniciando sincronización de ${row.nombre}`, { cuentaMlId });

      // -------------------------------------------------
      // PETICIÓN AL BACKEND
      // -------------------------------------------------

      const response = await axios.post(
        `${apiUrl}/mercadoLibreSync/cuenta/${cuentaMlId}/sincronizar`,
        {},
      );

      console.log("Resultado sincronización individual:", response.data);

      // -------------------------------------------------
      // RESULTADO
      // -------------------------------------------------

      setResultadoSincronizacion(response.data);

      if (response.data?.ok === false) {
        setErrorSincronizacion(
          response.data?.message || "La sincronización terminó con errores.",
        );
      }

      // -------------------------------------------------
      // ACTUALIZAR CUENTAS
      // -------------------------------------------------

      await obtenerCuentas();
    } catch (error) {
      console.error("Error sincronizando cuenta Mercado Libre:", error);

      const mensaje =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Ocurrió un error durante la sincronización.";

      setErrorSincronizacion(mensaje);
    } finally {
      setSincronizando(false);
    }
  };

  // ===================================================
  // CERRAR MODAL DE SINCRONIZACIÓN
  // ===================================================

  const cerrarModalSincronizacion = () => {
    if (sincronizando) return;

    setOpenSincronizacion(false);
    setResultadoSincronizacion(null);
    setErrorSincronizacion(null);
    setCuentaSincronizando(null);
    setTiempoTranscurrido(0);
  };

  // ===================================================
  // COLUMNAS DATAGRID
  // ===================================================

  const columns = [
    // -------------------------------------------------
    // CANAL
    // -------------------------------------------------

    {
      field: "canal_nombre",
      headerName: "Canal",
      flex: 0.8,
      minWidth: 160,
    },

    // -------------------------------------------------
    // CUENTA
    // -------------------------------------------------

    {
      field: "nombre",
      headerName: "Cuenta",
      flex: 1,
      minWidth: 200,
    },

    // -------------------------------------------------
    // SELLER ID
    // -------------------------------------------------

    {
      field: "seller_id",
      headerName: "Seller ID",
      flex: 0.7,
      minWidth: 150,

      valueGetter: (_, row) => row?.seller_id || "-",
    },

    // -------------------------------------------------
    // SITIO
    // -------------------------------------------------

    {
      field: "site_id",
      headerName: "Sitio",
      flex: 0.4,
      minWidth: 100,

      valueGetter: (_, row) => row?.site_id || "-",
    },

    // -------------------------------------------------
    // ESTADO
    // -------------------------------------------------

    {
      field: "activo",
      headerName: "Estado",
      flex: 0.4,
      minWidth: 120,

      renderCell: (params) => {
        const activo = Number(params.row.activo) === 1;

        return (
          <Chip
            label={activo ? "Activa" : "Inactiva"}
            color={activo ? "success" : "default"}
            size="small"
            variant="outlined"
          />
        );
      },
    },

    // -------------------------------------------------
    // OAUTH
    // -------------------------------------------------

    {
      field: "oauth",
      headerName: "OAuth",
      width: 110,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      align: "center",
      headerAlign: "center",

      renderCell: (params) => {
        const row = params.row;

        const esMercadoLibre =
          row?.canal_codigo === "mercado_libre" ||
          row?.canal_nombre === "Mercado Libre";

        if (!esMercadoLibre) return null;

        const autorizada = Number(row?.oauth_autorizado) === 1;

        const cuentaActiva = Number(row?.activo) === 1;

        return (
          <Tooltip
            title={
              !cuentaActiva
                ? "Cuenta inactiva"
                : autorizada
                  ? "Cuenta vinculada correctamente"
                  : "Autorizar Mercado Libre"
            }
          >
            <span>
              <IconButton
                size="small"
                color={autorizada ? "success" : "primary"}
                disabled={autorizada || !cuentaActiva}
                onClick={() => autorizarMercadoLibre(row)}
              >
                <LinkOutlinedIcon />
              </IconButton>
            </span>
          </Tooltip>
        );
      },
    },

    // -------------------------------------------------
    // SINCRONIZACIÓN INDIVIDUAL
    // -------------------------------------------------

    {
      field: "sincronizacion",
      headerName: "Sincronizar",
      width: 130,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      align: "center",
      headerAlign: "center",

      renderCell: (params) => {
        const row = params.row;

        const esMercadoLibre =
          row?.canal_codigo === "mercado_libre" ||
          row?.canal_nombre === "Mercado Libre";

        if (!esMercadoLibre) return null;

        const esEstaCuenta =
          sincronizando &&
          Number(cuentaSincronizando?.cuenta_ml_id) ===
            Number(row?.cuenta_ml_id);

        const cuentaActiva = Number(row?.activo) === 1;

        return (
          <Tooltip
            title={
              !cuentaActiva
                ? "La cuenta está inactiva"
                : `Sincronizar productos de ${row.nombre}`
            }
          >
            <span>
              <IconButton
                size="small"
                color="primary"
                disabled={sincronizando || !cuentaActiva}
                onClick={() => sincronizarCuentaMercadoLibre(row)}
              >
                <SyncOutlinedIcon
                  sx={
                    esEstaCuenta
                      ? {
                          animation: "rotarSync 1.5s linear infinite",

                          "@keyframes rotarSync": {
                            from: {
                              transform: "rotate(0deg)",
                            },
                            to: {
                              transform: "rotate(360deg)",
                            },
                          },
                        }
                      : {}
                  }
                />
              </IconButton>
            </span>
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
            gap: "12px",
            flexWrap: "wrap",
            justifyContent: "flex-end",
          }}
        >
          {/* =============================================
              CONECTAR CUENTA
          ============================================= */}

          <Button
            variant="contained"
            startIcon={<AddLinkOutlinedIcon />}
            sx={toolbarButtonSx}
            disabled={sincronizando}
            onClick={() => setOpenMercadoLibre(true)}
          >
            Conectar Mercado Libre
          </Button>

          {/* =============================================
              PUBLICAR EN OTRA CUENTA
          ============================================= */}

          <Button
            variant="outlined"
            startIcon={<PublishOutlinedIcon />}
            sx={toolbarButtonSx}
            onClick={() => setOpenPublicar(true)}
          >
            Publicar en otra cuenta
          </Button>

          {/* =============================================
              PUBLICADOR MASIVO
          ============================================= */}

          <Button
            variant="outlined"
            startIcon={<DynamicFeedOutlinedIcon />}
            sx={toolbarButtonSx}
            disabled={sincronizando}
            onClick={() => setOpenMasivo(true)}
          >
            Publicador masivo
          </Button>
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
          getRowId={(row) => row.id}
          exportFileName="cuentas-ecommerce"
        />
      </div>

      {/* =================================================
          MODAL CONECTAR MERCADO LIBRE
      ================================================= */}

      <ConectarMercadoLibreModal
        open={openMercadoLibre}
        onClose={() => setOpenMercadoLibre(false)}
        onSuccess={obtenerCuentas}
      />

      {/* =================================================
          MODAL PUBLICAR EN OTRA CUENTA
      ================================================= */}

      <PublicarEnCuentaDialog
        open={openPublicar}
        onClose={() => setOpenPublicar(false)}
      />

      {/* =================================================
          PUBLICADOR MASIVO
      ================================================= */}

      <PublicadorMasivoDialog
        open={openMasivo}
        onClose={() => setOpenMasivo(false)}
      />

      {/* =================================================
          MODAL SINCRONIZACIÓN
      ================================================= */}

      <SincronizacionMercadoLibreModal
        open={openSincronizacion}
        sincronizando={sincronizando}
        resultado={resultadoSincronizacion}
        error={errorSincronizacion}
        tiempoTranscurrido={tiempoTranscurrido}
        cuentaNombre={cuentaSincronizando?.nombre}
        onClose={cerrarModalSincronizacion}
      />
    </>
  );
};

export default CuentasEcommerce;
