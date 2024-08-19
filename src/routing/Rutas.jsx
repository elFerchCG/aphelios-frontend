import React from 'react';
import Header from '../components/layout/Header';
import { Routes, Route, BrowserRouter } from 'react-router-dom';
import { Proveedores } from '../components/pages/Proveedores/Proveedores';
import { Usuarios } from '../components/pages/Usuarios/Usuarios';
import Login from '../components/login/Login';
import Transacciones from '../components/pages/Inventarios/Transacciones/Transacciones';
import Localidades from '../components/pages/Inventarios/Localidades/Localidades';
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

const Rutas = () => {
    return (
        <div>
            <BrowserRouter>
                <Header />
                <Routes>
                    <Route path='/' element={<Login />} />
                    <Route path="/login" element={<Login />} />
                    <Route path='/proveedores' element={<Proveedores />} />
                    <Route path='/usuarios' element={<Usuarios />} />
                    <Route path='/ventas' element={
                        <ProtectedRoute allowedRoles={['administrador']}>
                            <Ventas />
                        </ProtectedRoute>
                    } />
                    <Route path='/transacciones' element={<Transacciones />} />
                    <Route path='/ubicaciones' element={<Localidades />} />
                    <Route path='/bodegas' element={<Bodegas />} />
                    <Route path='/existencias' element={<Existencias />} />
                    <Route path='/traspasos' element={<Lineas />} />
                    <Route path='/ordenBodega' element={<OrdenB />} />
                    <Route path='/transaccionesInventario' element={<TransaccionesI />} />
                    <Route path='/ordenes' element={<OrdenesRegistradas />} />
                    <Route path='/configuraciones' element={<Configuracion />} />
                    <Route path='/inventario' element={<Inventario />} />
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