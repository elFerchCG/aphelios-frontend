import React from 'react';
import Header  from '../components/layout/Header';
import { Routes, Route, BrowserRouter } from 'react-router-dom';
import { Inicio } from '../components/pages/Inicio';
import { Login } from '../components/pages/Login';
import { Proveedores } from '../components/pages/Proveedores/Proveedores';
import { Usuarios } from '../components/pages/Usuarios/Usuarios';

const Rutas = () => {
    return (
        <div>
            <BrowserRouter>
                <Header />
                <section id="content" className="content">
                    <Routes>
                        <Route path='/' element={<Login />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/inicio" element={<Inicio />} />
                        <Route path='/proveedores' element={<Proveedores />} />
                        <Route path='/usuarios' element={<Usuarios />} />
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