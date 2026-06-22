import React, { useEffect, useState } from "react";
import axios from "axios";

import {
  Box,
  Card,
  CardContent,
  TextField,
  Typography,
  MenuItem,
  Button,
} from "@mui/material";

import { DataGrid } from "@mui/x-data-grid";

import PerformanceMrpDialog from "./PerformanceMrpDialog";
import { getPerformanceColumns } from "./PerformanceColumns";
import PerformanceInfoDialog from "./PerformanceInfoDialog";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";

import "../../../estilos/performanceComercial.css";

const PerformanceComercial = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const [anio, setAnio] = useState(2026);
  const [semana, setSemana] = useState(21);

  const [proveedorId, setProveedorId] = useState("");
  const [busqueda, setBusqueda] = useState("");

  const [proveedores, setProveedores] = useState([]);

  const [openDetalleMrp, setOpenDetalleMrp] = useState(false);
  const [detalleMrp, setDetalleMrp] = useState(null);

  const [openInfo, setOpenInfo] = useState(false);

  const apiUrl =
    process.env.NODE_ENV === "production"
      ? process.env.REACT_APP_API_URL
      : process.env.REACT_APP_API_URL_LOCAL;

  const token = localStorage.getItem("token");

  const formatoMoneda = (valor) =>
    Number(valor || 0).toLocaleString("es-MX", {
      style: "currency",
      currency: "MXN",
    });

  const abrirDetalleMrp = (row) => {
    setDetalleMrp(row);
    setOpenDetalleMrp(true);
  };

  const cerrarDetalleMrp = () => {
    setDetalleMrp(null);
    setOpenDetalleMrp(false);
  };

  const obtenerPerformance = async () => {
    try {
      setLoading(true);

      const resp = await axios.get(`${apiUrl}/performanceComercial`, {
        params: {
          anio,
          semana,
          proveedorId: proveedorId || undefined,
          busqueda: busqueda || undefined,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (resp.data.ok) {
        setRows(
          resp.data.data.map((item) => ({
            ...item,
            id: item.producto_id,
          })),
        );
      }
    } catch (error) {
      console.error("Error al obtener Performance Comercial:", error);
    } finally {
      setLoading(false);
    }
  };

  const obtenerProveedores = async () => {
    try {
      const resp = await axios.get(`${apiUrl}/proveedores`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = Array.isArray(resp.data) ? resp.data : resp.data.data || [];
      setProveedores(data);
    } catch (error) {
      console.error("Error al obtener proveedores:", error);
    }
  };

  const descargarExcel = async () => {
    try {
      const resp = await axios.get(`${apiUrl}/performanceComercial/excel`, {
        params: {
          anio,
          semana,
          proveedorId: proveedorId || undefined,
          busqueda: busqueda || undefined,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([resp.data]));
      const link = document.createElement("a");

      link.href = url;
      link.setAttribute(
        "download",
        `performance_comercial_${anio}_semana_${semana}.xlsx`,
      );

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error al descargar Excel:", error);
    }
  };

  useEffect(() => {
    obtenerProveedores();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      obtenerPerformance();
    }, 500);

    return () => clearTimeout(timeout);
  }, [anio, semana, proveedorId, busqueda]);

  const columns = getPerformanceColumns(abrirDetalleMrp, formatoMoneda);

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h5" fontWeight="bold">
          Performance Comercial
        </Typography>

        <Button
          variant="outlined"
          startIcon={<HelpOutlineIcon />}
          onClick={() => setOpenInfo(true)}
        >
          ¿Cómo se calcula?
        </Button>
      </Box>

      <Card sx={{ mb: 3, backgroundColor: "#f8f9fa" }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Proyección vs Ventas Reales
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Este reporte compara la proyección semanal contra las ventas reales,
            incluyendo ingresos, comisiones, envíos, costos y ganancia real por
            producto.
          </Typography>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <TextField
              label="Año"
              type="number"
              size="small"
              value={anio}
              onChange={(e) => setAnio(Number(e.target.value))}
              sx={{ width: 130 }}
            />

            <TextField
              label="Semana"
              type="number"
              size="small"
              value={semana}
              onChange={(e) => setSemana(Number(e.target.value))}
              sx={{ width: 130 }}
            />

            <TextField
              select
              label="Proveedor"
              size="small"
              value={proveedorId}
              onChange={(e) => setProveedorId(e.target.value)}
              sx={{ minWidth: 260 }}
            >
              <MenuItem value="">Todos</MenuItem>

              {proveedores.map((proveedor) => (
                <MenuItem
                  key={proveedor.id_proveedor}
                  value={proveedor.id_proveedor}
                >
                  {proveedor.razon_social}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Buscar producto o SKU"
              size="small"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              sx={{ minWidth: 320 }}
            />

            <Button variant="contained" onClick={descargarExcel}>
              Descargar Excel
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Box sx={{ width: "100%", overflowX: "auto" }}>
        <Box sx={{ minWidth: 1750, height: 620 }}>
          <DataGrid
            sx={{ height: "100%" }}
            rows={rows}
            columns={columns}
            loading={loading}
            pageSizeOptions={[10, 25, 50, 100]}
            initialState={{
              pagination: {
                paginationModel: {
                  pageSize: 50,
                },
              },
            }}
            disableRowSelectionOnClick
          />
        </Box>
      </Box>

      <PerformanceMrpDialog
        open={openDetalleMrp}
        onClose={cerrarDetalleMrp}
        detalle={detalleMrp}
      />

      <PerformanceInfoDialog
        open={openInfo}
        onClose={() => setOpenInfo(false)}
      />
    </Box>
  );
};

export default PerformanceComercial;
