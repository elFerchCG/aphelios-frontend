import React from 'react';
import Header from '../components/layout/Header';
import { Routes, Route } from 'react-router-dom';
import Proveedores from '../components/pages/Proveedores/Proveedores';
import Usuarios from '../components/pages/Usuarios/Usuarios';
import Transacciones from '../components/pages/Inventarios/Transacciones/Transacciones';
import Bodegas from '../components/pages/Inventarios/Bodegas/Bodegas';
import Ventas from '../components/pages/Ventas/Ventas';
import Existencias from '../components/pages/Inventarios/Existencias/Existencias';
import Lineas from '../components/pages/Inventarios/Lineas/Lineas';
import OrdenB from '../components/pages/Inventarios/OrdenBodegas/OrdenB';
import TransaccionesI from '../components/pages/Inventarios/TransaccionesInventarios/TransaccionesI';
import OrdenesRegistradas from '../components/pages/Inventarios/OrdenBodegas/OrdenesRegistradas';
import Configuracion from '../components/pages/Menu/Configuracion';
import Inventario from '../components/pages/Menu/Inventario';
import ProtectedRoute from './ProtectedRoute';
import Home from '../components/pages/Menu/Home';
import Envios from '../components/pages/Envios/Envios';
// import TableOrdenesCompra from '../components/pages/Inventarios/OrdenCompras/TableOrdenesCompra';
import AnalisisVentas from '../components/pages/Analisi Ventas/AnalisisVentas';
import ConteoCiclico from '../components/pages/Inventarios/OrdenBodegas/ConteoCiclico';
import Localidades from '../components/pages/Inventarios/Localidades/Localidades';
import ReCharts from '../components/pages/Analisi Ventas/ReCharts';
import ChartPronostico from '../components/pages/Analisi Ventas/ChartPronostico';
import Billetes from '../components/pages/Inventarios/Billetes';
import Componentes from '../components/pages/Inventarios/Componentes';
import Surtido from '../components/pages/Inventarios/Surtido/Surtido';
import Publicaciones from '../components/pages/Inventarios/Publicaciones/Publicaciones';
import Empaque from '../components/pages/Envios/Empaque';
import CargaFacturas from '../components/pages/Facturas/CargaFacturas';
import EnvioDetalle from '../components/pages/Envios/EnvioDetalle';
import Facturas from '../components/pages/Facturas/Facturas';
import EmpaqueCajaAbierta from '../components/pages/Envios/EmpaqueCajaAbierta';
import DetalleFactura from '../components/pages/Facturas/DetalleFactura';
import BarraLateral from '../components/layout/BarraLateral';
import ResumenEnvio from '../components/pages/Envios/ResumenEnvio';
import Mercadotecnia from '../components/pages/Inventarios/Publicaciones/Mercadotecnia';
import VistaPedidos from '../components/pages/Pedidos/Pedidos';
import Mrp from '../components/pages/Mrp/Mrp';
import Graficas from '../components/pages/Graficas/DashboardAphelios';
import Procesos from '../components/pages/Jobs/ProcesosPage';
import TableOrdenes from '../components/pages/Inventarios/OrdenBodegas/TableOrdenes';
import OrdenRetiro from '../components/pages/Orden Retiro/OrdenRetiro';
import EnviosProgresoEmpaque from '../components/pages/Envios/EnviosProgresoEmpaque';


const Rutas = () => {
    return (
        <>
            <Header />
            <Routes>
                <Route path='/proveedores' element={
                    <ProtectedRoute allowedRoles={['administrador']}>
                        <Proveedores />
                    </ProtectedRoute>
                } />
                <Route path='/usuarios' element={<Usuarios />} />
                <Route path='/ventas' element={
                    <ProtectedRoute allowedRoles={['administrador']}>
                        <Ventas />
                    </ProtectedRoute>
                } />
                <Route path='/transacciones' element={<Transacciones />} />
                <Route path='/bodegas' element={<Bodegas />} />
                <Route path='/existencias' element={<Existencias />} />
                <Route path='/traspasos' element={<Lineas />} />
                <Route path='/ordenBodega' element={<OrdenB />} />
                <Route path='/transaccionesInventario' element={<TransaccionesI />} />
                <Route path='/ordenes' element={<OrdenesRegistradas />} />
                <Route path='/configuraciones' element={<Configuracion />} />
                <Route path='/inventario' element={<Inventario />} />
                <Route path='/home' element={<Home />} />
                <Route path='/ordenes-de-bodega' element={<TableOrdenes />} />
                {/* <Route path='/ordenesCompra' element={<TableOrdenesCompra />} /> */}
                <Route path='/reCharts' element={<ReCharts />} />
                <Route path='/analisisVentas' element={<AnalisisVentas />} />
                <Route path='/conteociclico' element={<ConteoCiclico />} />
                <Route path='/ubicaciones' element={<Localidades />} />
                <Route path='/chartpronostico' element={<ChartPronostico />} />
                <Route path='/billetes' element={<Billetes />} />
                <Route path='/componentes' element={<Componentes />} />
                <Route path='/surtido' element={<Surtido />} />
                <Route path='/publicaciones' element={<Publicaciones />} />
                <Route path="/cargaFacturas" element={<CargaFacturas />} />
                <Route path="/facturas" element={<Facturas />} />
                <Route path='/detalleFacturas/factura/:facturaId' element={<DetalleFactura />} />
                <Route path='/envios' element={<Envios />} />
                <Route path="/empaque/:envioId/detalle" element={<EnvioDetalle />} />
                <Route path='/empaqueCajaAbierta/envio/:envioId/caja/:cajaId/visual/:visualIdCaja' element={<EmpaqueCajaAbierta />} />
                <Route path='/empaque/envio/:envioId/caja/:cajaId/visual/:visualIdCaja' element={<Empaque />} />
                <Route path='/resumenEnvio/envio/:envioId' element={<ResumenEnvio />} />
                <Route path="/barraLateral" element={<BarraLateral />} />
                <Route path="/nuevosProductos" element={<Mercadotecnia />} />
                <Route path="/pedidos" element={<VistaPedidos />} />
                <Route path="/Mrp" element={<Mrp />} />
                <Route path="/graficas" element={<Graficas />} />
                <Route path="/procesos" element={<Procesos />} />
                <Route path='/ordenes-retiro' element={<OrdenRetiro />} />
                <Route path="/envios/detalle/:envioId/progresoEmpaque" element={<EnviosProgresoEmpaque />} />"
                <Route path='*' element={
                    <div>
                        <h1>Usuario sin permisos suficientes!</h1>
                    </div>
                } />
            </Routes>
        </>
    )
}

export default Rutas