import React from 'react'
import { NavLink } from 'react-router-dom'
import "../../estilos/header.css"

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
    

  return (
    <div>
         <header className="header">
    <div className="superior-bar">
        <p className="tittle">Aphelios</p>
    </div> 
    
    <div id="sidebar" className="sidebar" >
        <div onClick={scrollToHeader} id="toggle-btn" className="toggle-btn">
        <span  id="menu" className="menu">&#9776;</span>
    </div>
      <ul>
    <div onClick={closeToHeader} id="close" className="close">
                <span id="close" className="close">&#x2715;</span>
    </div>
      <nav>
        <li onClick={close1} className='enlace' id='enlace'> <NavLink to="/inicio">Inicio</NavLink></li>
        <li onClick={close1} className='enlace' id='enlace'> <NavLink to="/proveedores">Proveedores</NavLink></li>
        <li onClick={close1} className='enlace' id='enlace'> <NavLink to="/registroU">Usuarios</NavLink></li>
      </nav>
      </ul>
    </div>
    </header>

    </div>
  )
}

export default Header
