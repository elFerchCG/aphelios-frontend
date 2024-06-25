import React from 'react';
import Header  from '../components/layout/Header';
import { Routes, Route, BrowserRouter } from 'react-router-dom';
import { Proveedores } from '../components/pages/Proveedores/Proveedores';
import { Usuarios } from '../components/pages/Usuarios/Usuarios';
import Login from '../components/login/Login';
import Transacciones from '../components/pages/Inventarios/Transacciones/Transacciones';
import Localidades from '../components/pages/Inventarios/Localidades/Localidades';
import Bodegas from '../components/pages/Inventarios/Bodegas/Bodegas';
import Ventas from '../components/pages/Ventas/Ventas';

const Rutas = () => {
    return ( 
        <div>
            <BrowserRouter>
                <Header />
                <section id="content" className="content">
                    <Routes>
                        <Route path='/' element={<Login />} />
                        <Route path="/login" element={<Login />} />
                        <Route path='/proveedores' element={<Proveedores />} />
                        <Route path='/usuarios' element={<Usuarios />} />
                        <Route path='/ventas' element={<Ventas /> } />
                        <Route path='/transacciones' element={<Transacciones /> } />
                        <Route path='/localidades' element={<Localidades />} />
                        <Route path='/bodegas' element={<Bodegas />} />
                        <Route path='*' element={
                            <div>
                                <h1>Error 404</h1>
                            </div>
                        } />
                    </Routes>
                </section>
            </BrowserRouter>
        </div>
    )
}

export default Rutas