import React from 'react';
import Header from '../components/layout/Header';
import { Routes, Route, BrowserRouter } from 'react-router-dom';
import Proveedores from '../components/pages/Proveedores/Proveedores';
import Usuarios from '../components/pages/Usuarios/Usuarios';
import Login from '../components/login/Login';
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
import TableOrdenesCompra from '../components/pages/Inventarios/OrdenCompras/TableOrdenesCompra';
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
import Facturas from '../components/pages/Facturas/Facturas';
import Cajas from '../components/pages/Envios/Cajas';


const Rutas = () => {
    return (
        <div>
            <BrowserRouter>
                <Header />
                <Routes>
                    <Route path='/' element={<Login />} />
                    <Route path="/login" element={<Login />} />
                    <Route path='/proveedores' element={
                        <ProtectedRoute allowedRoles={['administrador', 'superUser']}>
                            <Proveedores />
                        </ProtectedRoute>
                    } />
                    <Route path='/usuarios' element={<Usuarios />} />
                    <Route path='/ventas' element={
                        <ProtectedRoute allowedRoles={['administrador', 'superUser']}>
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
                    <Route path='/envios' element={<Envios />} />
                    <Route path='/ordenesCompra' element={<TableOrdenesCompra />} />
                    <Route path='/reCharts' element={<ReCharts />} />
                    <Route path='/analisisVentas' element={<AnalisisVentas />} />
                    <Route path='/conteociclico' element={<ConteoCiclico />} />
                    <Route path='/ubicaciones' element={<Localidades />} />
                    <Route path='/chartpronostico' element={<ChartPronostico />} />
                    <Route path='/billetes' element={<Billetes />} />
                    <Route path='/componentes' element={<Componentes />} />
                    <Route path='/surtido' element={<Surtido />} />
                    <Route path='/publicaciones' element={<Publicaciones />} />
                    <Route path="/empaque/:envioId/:cajaId" element={<Empaque />} />
                    <Route path="/facturas" element={<Facturas />} />
                    <Route path='/cajas/:envioId' element={<Cajas />} />
                    <Route path='*' element={
                        <div>
                            <h1>Usuario sin permisos suficientes!</h1>
                        </div>
                    } />
                </Routes>
            </BrowserRouter>
        </div>
    )
}

export default Rutas