import React from 'react'
import '../../../estilos/configuracion.css'
import ordenes from '../../../images/ordenes.png'
import ordenesCompra from '../../../images/ordenesCompra.png'
import transaccionesI from '../../../images/transaccionesI.png'
import { NavLink } from 'react-router-dom'
import conteo from '../../../images/conteo.png'

const Inventario = () => {
    return (
        <div className='content'>
            <NavLink to="/ordenes" className="nav-config">
                <img src={ordenes} alt="Usuarios" className="nav-icon-config" />
                <span>Ordenes</span>
            </NavLink>
            <NavLink to="/ordenescompra" className="nav-config">
                <img src={ordenesCompra} alt="Usuarios" className="nav-icon-config" />
                <span>Ordenes Compra</span>
            </NavLink>
            <NavLink to="/conteociclico" className="nav-config">
                <img src={conteo} alt="Conteo Ciclico" className="nav-icon-config" />
                <span>Conteo Ciclico</span>
            </NavLink>
            <NavLink to="/transaccionesInventario" className="nav-config">
                <img src={transaccionesI} alt="Usuarios" className="nav-icon-config" />
                <span>Transacciones</span>
            </NavLink>
        </div>
    )
}

export default Inventario