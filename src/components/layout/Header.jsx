import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import '../../estilos/header.css';
import logo from '../../images/APHELIOS negro.png';
import inicio from '../../images/hogar.svg';
import envio from '../../images/shipment.svg';
import monedas from '../../images/money.png';
import inventario from '../../images/inventory.png';
import configuracion from '../../images/settings.png';
import sesion from '../../images/sesion.png';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const location = useLocation();
  const isLoggedIn = !!localStorage.getItem('token');
  let navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const response = JSON.parse(localStorage.getItem('user'));
  const user = response ? response.nombre : '';
  const rolDescripcion = response ? response.rol_descripcion : '';

  return (
    <>
      {location.pathname !== '/login' && isLoggedIn && (
        <header className="header">
          <div className="logo-container">
            <img src={logo} alt="logo" className="logo" />
          </div>

          <>
            <nav className="nav">
              <NavLink to="/home" className="nav-link">
                <img src={inicio} alt="Home" className="nav-icon" />
                <span>Home</span>
              </NavLink>
              <NavLink to="/envios" className="nav-link">
                <img src={envio} alt="Envios" className="nav-icon" />
                <span>Envios</span>
              </NavLink>
              <NavLink to="/ventas" className="nav-link">
                <img src={monedas} alt="Ventas" className="nav-icon" />
                <span>Ventas</span>
              </NavLink>
              <NavLink to="/inventario" className="nav-link">
                <img src={inventario} alt="Inventario" className="nav-icon" />
                <span>Inventario</span>
              </NavLink>
              {['administrador', 'superUser'].includes(rolDescripcion) && (
                <NavLink to="/configuraciones" className="nav-link">
                  <img src={configuracion} alt="Configuracion" className="nav-icon" />
                  <span>Configuracion</span>
                </NavLink>
              )}
            </nav>
            <div className="person-container">
              <div className="person-nav">
                <img src={sesion} alt="user" className="logo-person" />
                <span className="letra-person">{user}</span>
              </div>
              <div className="person-nav">
                <button className="logout-button" onClick={handleLogout}>Cerrar sesión</button>
              </div>
            </div>
          </>

        </header>
      )}
    </>
  );
};

export default Header;
