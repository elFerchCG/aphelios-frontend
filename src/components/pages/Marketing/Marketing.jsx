import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import axios from "axios";
import { Box } from "@mui/material";

import "../../../estilos/configuracion.css";
import "../../../estilos/marketing.css";

import MarketingKpis from "./components/MarketingKpis";
import KaizenStatusChart from "./components/KaizenStatusChart";
import KaizenTrendChart from "./components/KaizenTrendChart";
import ResponsablesChart from "./components/ResponsablesChart";
import ResponsablesTable from "./components/ResponsablesTable";

import { handleApiError } from "../../../helpers/apiErrorHandler";

const Marketing = () => {
  const apiUrl =
    process.env.NODE_ENV === "production"
      ? process.env.REACT_APP_API_URL
      : process.env.REACT_APP_API_URL_LOCAL;

  const token = localStorage.getItem("token");

  const [dashboard, setDashboard] = useState({
    kpis: {
      activos: 0,
      seguimientosHoy: 0,
      vencidos: 0,
      cerradosSemana: 0,
    },

    estatus: {
      activos: 0,
      vencidos: 0,
      cerrados: 0,
    },

    tendencia: [],

    responsables: [],
  });

  const [scope, setScope] = useState("own");
  const [loading, setLoading] = useState(true);

  const obtenerDashboard = useCallback(async () => {
    setLoading(true);

    try {
      const resp = await axios.get(
        `${apiUrl}/marketing/dashboard`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (resp.data?.ok) {
        setDashboard({
          kpis: {
            activos: Number(
              resp.data?.data?.kpis?.activos || 0,
            ),

            seguimientosHoy: Number(
              resp.data?.data?.kpis?.seguimientosHoy || 0,
            ),

            vencidos: Number(
              resp.data?.data?.kpis?.vencidos || 0,
            ),

            cerradosSemana: Number(
              resp.data?.data?.kpis?.cerradosSemana || 0,
            ),
          },

          estatus: {
            activos: Number(
              resp.data?.data?.estatus?.activos || 0,
            ),

            vencidos: Number(
              resp.data?.data?.estatus?.vencidos || 0,
            ),

            cerrados: Number(
              resp.data?.data?.estatus?.cerrados || 0,
            ),
          },

          tendencia:
            resp.data?.data?.tendencia || [],

          responsables:
            resp.data?.data?.responsables || [],
        });

        setScope(
          resp.data?.scope || "own",
        );
      }
    } catch (error) {
      handleApiError(error, {
        defaultMessage:
          "No se pudo cargar el dashboard de Marketing.",
      });
    } finally {
      setLoading(false);
    }
  }, [apiUrl, token]);

  useEffect(() => {
    obtenerDashboard();
  }, [obtenerDashboard]);

  return (
    <div className="marketing-page">
      <Box
        sx={{
          width: "100%",
          maxWidth: "1600px",
          mx: "auto",
          px: {
            xs: 2,
            sm: 3,
            md: 4,
          },
          pb: 5,

          // Importante para grids dentro
          minWidth: 0,
          boxSizing: "border-box",
        }}
      >
        {/* =========================
            HEADER
        ========================= */}

        <section className="marketing-hero">
          <p className="marketing-eyebrow">
            Marketing
          </p>

          <h1>
            Centro Marketing
          </h1>

          <p className="marketing-description">
            Monitoreo y mejora continua de
            publicaciones, ventas y estrategias
            comerciales de Aphelios.
          </p>
        </section>

        {/* =========================
            KPIs
        ========================= */}

        <Box
          sx={{
            mt: 3,
            width: "100%",
            minWidth: 0,
          }}
        >
          <MarketingKpis
            kpis={dashboard.kpis}
            loading={loading}
          />
        </Box>

        {/* =========================
            GRÁFICAS GENERALES
        ========================= */}

        <Box
          sx={{
            display: "grid",

            gridTemplateColumns: {
              xs: "minmax(0, 1fr)",
              lg: "minmax(300px, 0.8fr) minmax(0, 1.7fr)",
            },

            gap: 2,
            mt: 3,
            width: "100%",
            minWidth: 0,

            "& > *": {
              minWidth: 0,
            },
          }}
        >
          <KaizenStatusChart
            estatus={dashboard.estatus}
          />

          <KaizenTrendChart
            tendencia={dashboard.tendencia}
          />
        </Box>

        {/* =========================
            RESPONSABLES
            SOLO TEAM / GLOBAL
        ========================= */}

        {scope !== "own" && (
          <>
            <Box
              sx={{
                mt: 3,
                width: "100%",
                minWidth: 0,
              }}
            >
              <ResponsablesChart
                responsables={
                  dashboard.responsables
                }
              />
            </Box>

            <Box
              sx={{
                mt: 3,
                width: "100%",
                minWidth: 0,
              }}
            >
              <ResponsablesTable
                responsables={
                  dashboard.responsables
                }
              />
            </Box>
          </>
        )}
      </Box>
    </div>
  );
};

export default Marketing;