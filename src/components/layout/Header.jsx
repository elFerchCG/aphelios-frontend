import React from 'react'
import { NavLink } from 'react-router-dom'
import "../../estilos/header.css"
import { useState } from 'react';

const Header = () => {
  const scrollToHeader = () => {
    document.getElementById('sidebar').classList.toggle('active');
    document.getElementById('toggle-btn').style.visibility = 'hidden';
  };

  const closeToHeader = () => {
    document.getElementById('sidebar').classList.toggle('active');
    document.getElementById('toggle-btn').style.visibility = 'visible';
  };

  const close1 = () => {
    document.getElementById('sidebar').classList.toggle('active');
    document.getElementById('toggle-btn').style.visibility = 'visible';
  };

  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div>
      <header className="header">
        <div className="superior-bar">
          <p className="tittle">Aphelios</p>
        </div>

        <div id="sidebar" className="sidebar" >
          <div onClick={scrollToHeader} id="toggle-btn" className="toggle-btn">
            <span id="menu" className="menu">&#9776;</span>
          </div>
          <ul>
            <div onClick={closeToHeader} id="close" className="close">
              <span id="close" className="close">&#x2715;</span>
            </div>
            <nav>
              <li onClick={close1} className='enlace' id='enlace'> <NavLink to="/inicio">Inicio</NavLink></li>
              <li onClick={close1} className='enlace' id='enlace'> <NavLink to="/proveedores">Proveedores</NavLink></li>
              <li onClick={close1} className='enlace' id='enlace'> <NavLink to="/usuarios">Usuarios</NavLink></li>
              <li onClick={close1} className='enlace' id='enlace'> <NavLink to="/ventas">Ventas</NavLink></li>
              
                <button className="dropdown-toggle" onClick={toggleMenu}>
                  Inventarios
                </button>
                {isOpen && (
                  <div className="dropdown-menu">
                    <NavLink to="/transacciones"  className="dropdown-item" onClick={toggleMenu}>Transacciones</NavLink>
                    <NavLink to="/bodegas"  className="dropdown-item" onClick={toggleMenu}>Bodegas</NavLink>
                    <NavLink to="/localidades"  className="dropdown-item" onClick={toggleMenu}>Localidades</NavLink>
                  </div>
                )}   
            </nav>
          </ul>
        </div>
      </header>

    </div>
  );
};
export default Header;
