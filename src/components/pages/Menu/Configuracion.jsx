import React from 'react'
import '../../../estilos/configuracion.css'
import usuarios from '../../../images/seguidores.png'
import proveedores from '../../../images/proveedor.png'
import inventario from '../../../images/inventario.png'
import bodegas from '../../../images/almacen.png'
import transacciones from '../../../images/traspaso.png'
import movimientos from '../../../images/movimientos.png'

import { NavLink } from 'react-router-dom'

const Navegacion = () => {

    return (
        <div className='content'>
            <NavLink to="/usuarios" className="nav-config">
                <img src={usuarios} alt="Usuarios" className="nav-icon-config" />
                <span>Usuarios</span>
            </NavLink>
            <NavLink to="/proveedores" className="nav-config">
                <img src={proveedores} alt="Proveedores" className="nav-icon-config" />
                <span>Proveedores</span>
            </NavLink>
            <NavLink to="/existencias" className="nav-config">
                <img src={inventario} alt="Existencias" className="nav-icon-config" />
                <span>Existencias</span>
            </NavLink>
            <NavLink to="/bodegas" className="nav-config">
                <img src={bodegas} alt="Bodegas" className="nav-icon-config" />
                <span>Bodegas</span>
            </NavLink>
            <NavLink to="/transacciones" className="nav-config">
                <img src={transacciones} alt="Tipos de Movimientos" className="nav-icon-config" />
                <span>Tipos de Movimientos</span>
            </NavLink>
            <NavLink to="/traspasos" className="nav-config">
                <img src={movimientos} alt="Movimientos" className="nav-icon-config" />
                <span>Movimientos</span>
            </NavLink>
        </div>
    )
}

export default Navegacion;