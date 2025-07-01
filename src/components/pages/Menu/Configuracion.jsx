import React from 'react'
import '../../../estilos/configuracion.css'
import usuarios from '../../../images/usuarios.png'
import proveedores from '../../../images/proveedores.png'
import bodegas from '../../../images/bodegas.png'
import movimientosI from '../../../images/movimientosI.png'
import billetes from '../../../images/billetes.png'
import componentes from '../../../images/componentes.png'
import cargaFactura from "../../../images/cargaFactura.png"
import pedidos from "../../../images/pedidos.png"
import { NavLink } from 'react-router-dom'

const Navegacion = () => {

    return (
        <div className='content'>
            <NavLink to="/billetes" className="nav-config">
                <img src={billetes} alt='Billetes' className='nav-icon-config' />
                <span>Billetes</span>
            </NavLink>
            <NavLink to="/componentes" className="nav-config">
                <img src={componentes} alt='Componentes' className='nav-icon-config' />
                <span>Componentes</span>
            </NavLink>
            <NavLink to="/pedidos" className="nav-config">
                <img src={pedidos} alt='Pedidos' className='nav-icon-config' />
                <span>Pedidos</span>
            </NavLink>
            <NavLink to="/cargaFacturas" className="nav-config">
                <img src={cargaFactura} alt='Facturas' className='nav-icon-config' />
                <span>Facturas</span>
            </NavLink>
            <NavLink to="/transacciones" className="nav-config">
                <img src={movimientosI} alt="Tipos de Movimientos" className="nav-icon-config" />
                <span>Tipos de Movimientos</span>
            </NavLink>
            <NavLink to="/usuarios" className="nav-config">
                <img src={usuarios} alt="Usuarios" className="nav-icon-config" />
                <span>Usuarios</span>
            </NavLink>
            <NavLink to="/proveedores" className="nav-config">
                <img src={proveedores} alt="Proveedores" className="nav-icon-config" />
                <span>Proveedores</span>
            </NavLink>
            <NavLink to="/bodegas" className="nav-config">
                <img src={bodegas} alt="Bodegas" className="nav-icon-config" />
                <span>Bodegas</span>
            </NavLink>
        </div>
    )
}

export default Navegacion;