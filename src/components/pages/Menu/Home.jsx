import { Button } from '@mui/material'
import './estilos.css';
import recurso from './images/Recurso 1.svg';
import logo from './images/LOGO APHELIOS.svg';
import React from 'react'
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useEffect } from 'react';


const Home = () => {
  const navigate = useNavigate();

  const [token, setToken] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")));

  useEffect(() => {
    const handleStorageChange = () => {
      setToken(localStorage.getItem("token"));
      setUser(JSON.parse(localStorage.getItem("user")));
    };

    // Añadir un listener para el evento `storage`
    window.addEventListener("storage", handleStorageChange);

    // Limpieza al desmontar el componente
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const puedeVerMenuHome = user && (
    user.rol_descripcion === 'administrador' ||
    (user.rol_descripcion === 'Produccion' && user.permisos === 'supervisor') ||
    user.rol_descripcion === 'Almacenista'
  );

  return (
    <div className='boceto'>
      <div className='left-section'>
        <img src={logo} alt='Logo Aphelios' className='logoHome' />
        {puedeVerMenuHome && (
          <div className='buttons'>
            <Button onClick={() => navigate('/ordenes')}>Orden Bodega</Button>
            <Button onClick={() => navigate('/existencias')}>Existencias</Button>
            <Button onClick={() => navigate('/ventas-me')}>Ventas ME</Button>
          </div>
        )}
      </div>
      <div className='right-section'>
        <img src={recurso} alt='grafico' className='graphic' />
      </div>
    </div>
  )
}

export default Home