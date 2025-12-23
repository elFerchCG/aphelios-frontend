import React from 'react'
import '../../../estilos/configuracion.css'
import order from '../../../images/order.png'
// import orderBuy from '../../../images/orderBuy.png'
import transacciones from '../../../images/transacciones.png'
import existencias from '../../../images/existencias.png'
import publicaciones from '../../../images/publicaciones.png'
import { NavLink } from 'react-router-dom'
import conteoCiclico from '../../../images/conteoCiclico.png'

const Inventario = () => {
    return (
        <div className='content'>
            <NavLink to="/ordenes" className="nav-config">
                <img src={order} alt="Usuarios" className="nav-icon-config" />
                <span>Ordenes</span>
            </NavLink>
            {/* <NavLink to="/ordenescompra" className="nav-config">
                <img src={orderBuy} alt="Ordenes Compra" className="nav-icon-config" />
                <span>Ordenes Compra</span>
            </NavLink> */}
            <NavLink to="/publicaciones" className="nav-config">
                <img src={publicaciones} alt="Publicaciones" className='nav-icon-config' />
                <span>Publicaciones</span>
            </NavLink>
            <NavLink to="/conteociclico" className="nav-config">
                <img src={conteoCiclico} alt="Conteo Ciclico" className="nav-icon-config" />
                <span>Conteo Ciclico</span>
            </NavLink>
            <NavLink to="/transaccionesInventario" className="nav-config">
                <img src={transacciones} alt="Transacciones" className="nav-icon-config" />
                <span>Transacciones</span>
            </NavLink>
            <NavLink to="/existencias" className="nav-config">
                <img src={existencias} alt="Existencias" className="nav-icon-config" />
                <span>Existencias</span>
            </NavLink>
        </div>
    )
}

export default Inventario