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

  const [isOpenI, setIsOpenI] = useState(false);

  const toggleMenuI = () => {
    setIsOpenI(!isOpenI);
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
              <li onClick={close1} className='enlace' id='enlace'> <NavLink to="/ventas">Ventas</NavLink></li>
              <button className="dropdown-toggle" onClick={toggleMenuI}>
                Inventarios
              </button>
              {isOpenI && (
                <div className="dropdown-menu">
                  <NavLink to="/existencias" className="dropdown-item" onClick={toggleMenuI}>Existencias</NavLink>
                  <NavLink to="/transaccionesInventario" className="dropdown-item" onClick={toggleMenuI}>Movimientos de inventarios</NavLink>
                  <NavLink to="/ordenBodega" className="dropdown-item" onClick={toggleMenuI}>Ordenes de bodega</NavLink>
                </div>
              )}
              <p></p>
              <br></br>
              <br></br>
              <br></br>
              <br></br>
              <br></br>
              <br></br>
              <br></br>
              <br></br>
              <br></br>
              <br></br>
              <br></br>
              <button className="dropdown-toggle" onClick={toggleMenu}>
                Configuracion
              </button>
              {isOpen && (
                <div className="dropdown-menu">
                  <NavLink to="/bodegas" className="dropdown-item" onClick={toggleMenu}>Bodegas</NavLink>
                  <NavLink to="/ubicaciones" className="dropdown-item" onClick={toggleMenu}>Ubicaciones</NavLink>
                  <NavLink to="/transacciones" className="dropdown-item" onClick={toggleMenu}>Tipo De Movimientos</NavLink>
                  <NavLink to="/proveedores" className="dropdown-item" onClick={toggleMenu}>Proveedores</NavLink>
                  <NavLink to="/usuarios" className="dropdown-item" onClick={toggleMenu}>Usuarios</NavLink>
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
