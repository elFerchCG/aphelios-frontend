import React from 'react';
import Header  from '../components/layout/Header';
import { Routes, Route, BrowserRouter } from 'react-router-dom';
import { Inicio } from '../components/pages/Inicio';
import { Login } from '../components/pages/Login';
import { RegistroU } from '../components/pages/RegistroU';
import { Proveedores } from '../components/pages/Proveedores';

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
                        <Route path='/registrou' element={<RegistroU />} />
                        <Route path='/proveedores' element={<Proveedores />} />
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