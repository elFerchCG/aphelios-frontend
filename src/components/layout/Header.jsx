import React from 'react';
import { NavLink } from 'react-router-dom';
import '../../estilos/header.css'; // Importar el archivo CSS
import logo from '../../images/APHELIOS.svg'
import inicio from '../../images/hogar.svg'
import envio from '../../images/shipment.svg'
import monedas from '../../images/money.png'
import inventario from '../../images/inventory.png'
import configuracion from '../../images/settings.png'

const Header = () => {
  return (
    <header className="header">
      <nav className="nav">
        <NavLink to="/usuarios" className="nav-link">
          <img src={inicio} alt="Home" className="nav-icon" />
          <span>Home</span>
        </NavLink>
        <NavLink to="/proveedores" className="nav-link">
          <img src={envio} alt="Envios" className="nav-icon" />
          <span>Envios</span>
        </NavLink>
        <NavLink to="/ventas" className="nav-link">
          <img src={monedas} alt="Ventas" className="nav-icon" />
          <span>Ventas</span>
        </NavLink>
        <NavLink to="/ubicaciones" className="nav-link">
          <img src={inventario} alt="Inventario" className="nav-icon" />
          <span>Inventario</span>
        </NavLink>
        <NavLink to="/bodegas" className="nav-link">
          <img src={configuracion} alt="Configuracion" className="nav-icon" />
          <span>Configuracion</span>
        </NavLink>
      </nav>
      <div className="logo-container">
        <img src={logo} alt='logo' className="logo" />
      </div>
      <button className="logout-button">Cerrar sesión</button>
    </header>
  );
};

export default Header;
