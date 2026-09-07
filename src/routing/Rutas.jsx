import React from "react";
import { Routes, Route } from "react-router-dom";

import Header from "../components/layout/Header";
import ProtectedRoute from "./ProtectedRoute";

// ==============================
// HOME / MENÚS
// ==============================
import Home from "../components/pages/Menu/Home";
import Configuracion from "../components/pages/Menu/Configuracion";
import Inventario from "../components/pages/Menu/Inventario";
import Marketing from "../components/pages/Menu/Marketing";

// ==============================
// CONFIGURACIÓN
// ==============================
import Proveedores from "../components/pages/Proveedores/Proveedores";
import Usuarios from "../components/pages/Usuarios/Usuarios";
import Transacciones from "../components/pages/Inventarios/Transacciones/Transacciones";
import Bodegas from "../components/pages/Inventarios/Bodegas/Bodegas";
import OrdenRetiro from "../components/pages/Orden Retiro/OrdenRetiro";

// ==============================
// INVENTARIO
// ==============================
import Existencias from "../components/pages/Inventarios/Existencias/Existencias";
import Lineas from "../components/pages/Inventarios/Lineas/Lineas";
import OrdenB from "../components/pages/Inventarios/OrdenBodegas/OrdenB";
import TransaccionesI from "../components/pages/Inventarios/TransaccionesInventarios/TransaccionesI";
import OrdenesRegistradas from "../components/pages/Inventarios/OrdenBodegas/OrdenesRegistradas";
import ConteoCiclico from "../components/pages/Inventarios/OrdenBodegas/ConteoCiclico";
import Localidades from "../components/pages/Inventarios/Localidades/Localidades";
import Billetes from "../components/pages/Inventarios/Billetes/Billetes";
import Componentes from "../components/pages/Inventarios/Componentes/Componentes";
import Surtido from "../components/pages/Inventarios/Surtido/Surtido";
import Publicaciones from "../components/pages/Inventarios/Publicaciones/Publicaciones";
import NuevosSKUsManager from "../components/pages/Inventarios/Publicaciones/NuevosSKUsManager";
import TableOrdenes from "../components/pages/Inventarios/OrdenBodegas/TableOrdenes";
import Excedentes from "../components/pages/Inventarios/Excedentes/Excedentes";
import StockComponentes from "../components/pages/Inventarios/Excedentes/StockComponentes";

// ==============================
// ENVÍOS
// ==============================
import Envios from "../components/pages/Envios/Envios";
import EnvioDetalle from "../components/pages/Envios/EnvioDetalle";
import EmpaqueCajaAbierta from "../components/pages/Envios/EmpaqueCajaAbierta";
import Empaque from "../components/pages/Envios/Empaque";
import ResumenEnvio from "../components/pages/Envios/ResumenEnvio";
import EnviosProgresoEmpaque from "../components/pages/Envios/EnviosProgresoEmpaque";

// ==============================
// COMPRAS / FACTURAS
// ==============================
import CargaFacturas from "../components/pages/Facturas/CargaFacturas";
import Facturas from "../components/pages/Facturas/Facturas";
import DetalleFactura from "../components/pages/Facturas/DetalleFactura";
import VistaPedidos from "../components/pages/Pedidos/Pedidos";

// ==============================
// MRP
// ==============================
import Mrp from "../components/pages/Mrp/Mrp";
import Procesos from "../components/pages/Jobs/ProcesosPage";

// ==============================
// MARKETING
// ==============================
import KaizenVentasPerdidas from "../components/pages/Kaizen/KaizenVentasPerdidas";
import KaizenSeguimiento from "../components/pages/Kaizen/KaizenSeguimiento";
import PerformanceComercial from "../components/pages/PerformanceComercial/PerformanceComercial";
import PublicacionesMejoras from "../components/pages/PublicacionesMejoras/PublicacionesMejoras";
import Preguntas from "../components/pages/Preguntas/Preguntas";

// ==============================
// GRÁFICAS / VENTAS
// ==============================
import Ventas from "../components/pages/Ventas/Ventas";
import VentasME from "../components/pages/Ventas/VentasME";
import AnalisisVentas from "../components/pages/Analisi Ventas/AnalisisVentas";
import ReCharts from "../components/pages/Analisi Ventas/ReCharts";
import ChartPronostico from "../components/pages/Analisi Ventas/ChartPronostico";
import Graficas from "../components/pages/Graficas/DashboardAphelios";

// ==============================
// OTROS
// ==============================
import BarraLateral from "../components/layout/BarraLateral";

const Rutas = () => {
  /*
   * Roles reales registrados actualmente en BD:
   *
   * administrador
   * Planeador
   * Almacenista
   * Marketing
   * Produccion
   * Lider Marketing
   * Coordinador comercial
   */

  const rolesMarketing = [
    "administrador",
    "Marketing",
    "Lider Marketing",
    "Coordinador comercial",
    "Planeador",
  ];

  const rolesPerformance = [
    "administrador",
    "Lider Marketing",
    "Coordinador comercial",
  ];

  const rolesPlaneacion = ["administrador", "Planeador"];

  const rolesInventarioEspecial = ["administrador", "Planeador", "Almacenista"];

  const rolesExcluidosEnvios = [
    "Marketing",
    "Lider Marketing",
    "Coordinador comercial",
  ];

  return (
    <>
      <Header />

      <Routes>
        {/* =====================================================
            HOME
        ====================================================== */}

        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />

        {/* =====================================================
            PUBLICACIONES
        ====================================================== */}

        <Route
          path="/componentes"
          element={
            <ProtectedRoute allowedRoles={rolesPlaneacion}>
              <Componentes />
            </ProtectedRoute>
          }
        />

        <Route
          path="/billetes"
          element={
            <ProtectedRoute allowedRoles={rolesPlaneacion}>
              <Billetes />
            </ProtectedRoute>
          }
        />

        <Route
          path="/publicaciones"
          element={
            <ProtectedRoute>
              <Publicaciones />
            </ProtectedRoute>
          }
        />

        {/* =====================================================
            INVENTARIO
        ====================================================== */}

        <Route
          path="/ordenes"
          element={
            <ProtectedRoute>
              <OrdenesRegistradas />
            </ProtectedRoute>
          }
        />

        <Route
          path="/conteociclico"
          element={
            <ProtectedRoute
              allowedRoles={[
                "administrador",
                "Almacenista",
              ]}
            >
              <ConteoCiclico />
            </ProtectedRoute>
          }
        />

        <Route
          path="/transaccionesInventario"
          element={
            <ProtectedRoute>
              <TransaccionesI />
            </ProtectedRoute>
          }
        />

        <Route
          path="/existencias"
          element={
            <ProtectedRoute>
              <Existencias />
            </ProtectedRoute>
          }
        />

        <Route
          path="/nuevos-excedentes"
          element={
            <ProtectedRoute
              allowedRoles={rolesInventarioEspecial}
            >
              <Excedentes />
            </ProtectedRoute>
          }
        />

        <Route
          path="/stock-componentes"
          element={
            <ProtectedRoute
              allowedRoles={rolesInventarioEspecial}
            >
              <StockComponentes />
            </ProtectedRoute>
          }
        />

        {/* Rutas internas / legacy de Inventario.
            Por ahora requieren sesión, pero no hemos definido
            todavía una restricción de rol más específica. */}

        <Route
          path="/traspasos"
          element={
            <ProtectedRoute>
              <Lineas />
            </ProtectedRoute>
          }
        />

        <Route
          path="/ordenBodega"
          element={
            <ProtectedRoute>
              <OrdenB />
            </ProtectedRoute>
          }
        />

        <Route
          path="/ordenes-de-bodega"
          element={
            <ProtectedRoute>
              <TableOrdenes />
            </ProtectedRoute>
          }
        />

        <Route
          path="/ubicaciones"
          element={
            <ProtectedRoute>
              <Localidades />
            </ProtectedRoute>
          }
        />

        <Route
          path="/surtido/:proformaId"
          element={
            <ProtectedRoute>
              <Surtido />
            </ProtectedRoute>
          }
        />

        {/* =====================================================
            ENVÍOS
            Todos excepto roles exclusivamente de Marketing
        ====================================================== */}

        <Route
          path="/envios"
          element={
            <ProtectedRoute
              excludedRoles={rolesExcluidosEnvios}
            >
              <Envios />
            </ProtectedRoute>
          }
        />

        <Route
          path="/empaque/:envioId/detalle"
          element={
            <ProtectedRoute
              excludedRoles={rolesExcluidosEnvios}
            >
              <EnvioDetalle />
            </ProtectedRoute>
          }
        />

        <Route
          path="/empaqueCajaAbierta/envio/:envioId/caja/:cajaId/visual/:visualIdCaja"
          element={
            <ProtectedRoute
              excludedRoles={rolesExcluidosEnvios}
            >
              <EmpaqueCajaAbierta />
            </ProtectedRoute>
          }
        />

        <Route
          path="/empaque/envio/:envioId/caja/:cajaId/visual/:visualIdCaja"
          element={
            <ProtectedRoute
              excludedRoles={rolesExcluidosEnvios}
            >
              <Empaque />
            </ProtectedRoute>
          }
        />

        <Route
          path="/resumenEnvio/envio/:envioId"
          element={
            <ProtectedRoute
              excludedRoles={rolesExcluidosEnvios}
            >
              <ResumenEnvio />
            </ProtectedRoute>
          }
        />

        <Route
          path="/envios/detalle/:envioId/progresoEmpaque"
          element={
            <ProtectedRoute
              excludedRoles={rolesExcluidosEnvios}
            >
              <EnviosProgresoEmpaque />
            </ProtectedRoute>
          }
        />

        {/* =====================================================
            MRP
            Administrador + Planeador
        ====================================================== */}

        <Route
          path="/mrp"
          element={
            <ProtectedRoute allowedRoles={rolesPlaneacion}>
              <Mrp />
            </ProtectedRoute>
          }
        />

        <Route
          path="/procesos"
          element={
            <ProtectedRoute allowedRoles={rolesPlaneacion}>
              <Procesos />
            </ProtectedRoute>
          }
        />

        {/* =====================================================
            COMPRAS
            Solo administrador
        ====================================================== */}

        <Route
          path="/pedidos"
          element={
            <ProtectedRoute
              allowedRoles={["administrador"]}
            >
              <VistaPedidos />
            </ProtectedRoute>
          }
        />

        <Route
          path="/cargaFacturas"
          element={
            <ProtectedRoute
              allowedRoles={["administrador"]}
            >
              <CargaFacturas />
            </ProtectedRoute>
          }
        />

        <Route
          path="/facturas"
          element={
            <ProtectedRoute
              allowedRoles={["administrador"]}
            >
              <Facturas />
            </ProtectedRoute>
          }
        />

        <Route
          path="/detalleFacturas/factura/:facturaId"
          element={
            <ProtectedRoute
              allowedRoles={["administrador"]}
            >
              <DetalleFactura />
            </ProtectedRoute>
          }
        />

        {/* =====================================================
            MARKETING
        ====================================================== */}

        {/* Resumen Kaizen */}
        <Route
          path="/marketing"
          element={
            <ProtectedRoute allowedRoles={rolesMarketing}>
              <Marketing />
            </ProtectedRoute>
          }
        />

        <Route
          path="/kaizenVentasPerdidas"
          element={
            <ProtectedRoute allowedRoles={rolesMarketing}>
              <KaizenVentasPerdidas />
            </ProtectedRoute>
          }
        />

        <Route
          path="/kaizenSeguimiento"
          element={
            <ProtectedRoute allowedRoles={rolesMarketing}>
              <KaizenSeguimiento />
            </ProtectedRoute>
          }
        />

        <Route
          path="/performanceComercial"
          element={
            <ProtectedRoute
              allowedRoles={rolesPerformance}
            >
              <PerformanceComercial />
            </ProtectedRoute>
          }
        />

        <Route
          path="/publicacionesMejoras"
          element={
            <ProtectedRoute allowedRoles={rolesMarketing}>
              <PublicacionesMejoras />
            </ProtectedRoute>
          }
        />

        <Route
          path="/preguntas"
          element={
            <ProtectedRoute allowedRoles={rolesMarketing}>
              <Preguntas />
            </ProtectedRoute>
          }
        />

        <Route
          path="/nuevos-productos"
          element={
            <ProtectedRoute allowedRoles={rolesMarketing}>
              <NuevosSKUsManager />
            </ProtectedRoute>
          }
        />

        {/* =====================================================
            GRÁFICAS
            Solo administrador
        ====================================================== */}

        <Route
          path="/analisisVentas"
          element={
            <ProtectedRoute
              allowedRoles={["administrador"]}
            >
              <AnalisisVentas />
            </ProtectedRoute>
          }
        />

        <Route
          path="/chartpronostico"
          element={
            <ProtectedRoute
              allowedRoles={["administrador"]}
            >
              <ChartPronostico />
            </ProtectedRoute>
          }
        />

        <Route
          path="/graficas"
          element={
            <ProtectedRoute
              allowedRoles={["administrador"]}
            >
              <Graficas />
            </ProtectedRoute>
          }
        />

        {/* Ruta antigua del menú de gráficas */}
        <Route
          path="/reCharts"
          element={
            <ProtectedRoute
              allowedRoles={["administrador"]}
            >
              <ReCharts />
            </ProtectedRoute>
          }
        />

        {/* =====================================================
            CONFIGURACIÓN
        ====================================================== */}

        <Route
          path="/transacciones"
          element={
            <ProtectedRoute
              allowedRoles={rolesInventarioEspecial}
            >
              <Transacciones />
            </ProtectedRoute>
          }
        />

        <Route
          path="/usuarios"
          element={
            <ProtectedRoute
              allowedRoles={rolesPlaneacion}
            >
              <Usuarios />
            </ProtectedRoute>
          }
        />

        <Route
          path="/proveedores"
          element={
            <ProtectedRoute
              allowedRoles={rolesPlaneacion}
            >
              <Proveedores />
            </ProtectedRoute>
          }
        />

        <Route
          path="/bodegas"
          element={
            <ProtectedRoute
              allowedRoles={rolesInventarioEspecial}
            >
              <Bodegas />
            </ProtectedRoute>
          }
        />

        <Route
          path="/ordenes-retiro"
          element={
            <ProtectedRoute
              allowedRoles={rolesPlaneacion}
            >
              <OrdenRetiro />
            </ProtectedRoute>
          }
        />

        {/* =====================================================
            VENTAS ME
            Administrador + Planeador + Almacenista
        ====================================================== */}

        <Route
          path="/ventas-me"
          element={
            <ProtectedRoute
              allowedRoles={rolesInventarioEspecial}
            >
              <VentasME />
            </ProtectedRoute>
          }
        />

        {/* =====================================================
            OTRAS RUTAS ANTIGUAS
            Autenticación obligatoria.
            Falta definir regla de negocio específica.
        ====================================================== */}

        <Route
          path="/ventas"
          element={
            <ProtectedRoute
              allowedRoles={["administrador"]}
            >
              <Ventas />
            </ProtectedRoute>
          }
        />

        <Route
          path="/configuraciones"
          element={
            <ProtectedRoute>
              <Configuracion />
            </ProtectedRoute>
          }
        />

        <Route
          path="/inventario"
          element={
            <ProtectedRoute>
              <Inventario />
            </ProtectedRoute>
          }
        />

        <Route
          path="/barraLateral"
          element={
            <ProtectedRoute>
              <BarraLateral />
            </ProtectedRoute>
          }
        />

        {/* =====================================================
            SIN PERMISOS
        ====================================================== */}

        <Route
          path="/unauthorized"
          element={
            <div
              style={{
                minHeight: "calc(100vh - 100px)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "Montserrat, sans-serif",
                textAlign: "center",
              }}
            >
              <h1>Acceso no autorizado</h1>

              <p>
                Tu usuario no cuenta con permisos para acceder
                a este módulo.
              </p>
            </div>
          }
        />

        {/* =====================================================
            RUTA NO ENCONTRADA
        ====================================================== */}

        <Route
          path="*"
          element={
            <div
              style={{
                minHeight: "calc(100vh - 100px)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "Montserrat, sans-serif",
                textAlign: "center",
              }}
            >
              <h1>Página no encontrada</h1>

              <p>
                La ruta que intentas abrir no existe.
              </p>
            </div>
          }
        />
      </Routes>
    </>
  );
};

export default Rutas;
