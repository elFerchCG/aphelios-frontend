import React from 'react'
import '../../../estilos/configuracion.css'
import ventas from '../../../images/ventas.png';
import pronostico from '../../../images/pronostico.png';
import scoreCard from '../../../images/scoreCard.png'
import { NavLink } from 'react-router-dom'

const ReCharts = () => {
    return (
        <div className='content'>
            <NavLink to="/analisisVentas" className="nav-config">
                <img src={ventas} alt="Ventas" className="nav-icon-config" />
                <span>Ventas</span>
            </NavLink>
            <NavLink to="/chartpronostico" className="nav-config">
                <img src={pronostico} alt="Pronostico" className="nav-icon-config" />
                <span>Pronostico</span>
            </NavLink>
            <NavLink to="/graficas" className="nav-config">
                <img src={scoreCard} alt="scoreCard" className="nav-icon-config" />
                <span>Score Card</span>
            </NavLink>
        </div>
    )
}

export default ReCharts