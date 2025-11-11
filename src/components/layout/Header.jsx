import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import '../../estilos/header.css';
import logo from '../../images/APHELIOS negro.png';
import inicio from '../../images/hogar.svg';
import envio from '../../images/shipment.svg';
import reCharts from '../../images/reCharts.png';
import inventario from '../../images/inventory.png';
import configuracion from '../../images/settings.png';
import sesion from '../../images/sesion.png';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { token, user, logout } = useAuthStore();

  if (!token || location.pathname === '/login') return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="header">
      <div className="left">
        <div className="nav">
          <NavLink to="/home" className="nav-link">
            <img src={inicio} alt="Inicio" className="nav-icon" />
            <span>Inicio</span>
          </NavLink>
          <NavLink to="/envios" className="nav-link">
            <img src={envio} alt="Envios" className="nav-icon" />
            <span>Envios</span>
          </NavLink>
          {['administrador'].includes(user?.rol_descripcion) && (
            <NavLink to="/reCharts" className="nav-link">
              <img src={reCharts} alt="reCharts" className="nav-icon" />
              <span>Graficas</span>
            </NavLink>
          )}
          <NavLink to="/inventario" className="nav-link">
            <img src={inventario} alt="Inventario" className="nav-icon" />
            <span>Inventario</span>
          </NavLink>
          {['administrador'].includes(user?.rol_descripcion) && (
            <NavLink to="/configuraciones" className="nav-link">
              <img src={configuracion} alt="Configuracion" className="nav-icon" />
              <span>Configuracion</span>
            </NavLink>
          )}
        </div>
      </div>

      <div className="center">
        <div className="logo-container">
          <img src={logo} alt="logo" className="logo" />
        </div>
      </div>

      <div className="right">
        <div className="person-container">
          <div className="person-nav">
            <img src={sesion} alt="user" className="logo-person" />
            <span className="letra-person">{user?.nombre}</span>
          </div>
          <div className="person-nav">
            <button className="logout-button" onClick={handleLogout}>Cerrar sesión</button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
