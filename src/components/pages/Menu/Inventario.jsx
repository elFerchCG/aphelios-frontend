import React from 'react'
import '../../../estilos/configuracion.css'
import ordenes from '../../../images/ordenes.png'
import { NavLink } from 'react-router-dom'

const Inventario = () => {
    return (
        <div className='content'>
            <NavLink to="/ordenes" className="nav-config">
                <img src={ordenes} alt="Usuarios" className="nav-icon-config" />
                <span>Ordenes</span>
            </NavLink>
        </div>
    )
}

export default Inventario