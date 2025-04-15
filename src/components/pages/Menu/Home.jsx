import { Button } from '@mui/material'
import './estilos.css';
import recurso from './images/Recurso 1.svg';
import logo from './images/LOGO APHELIOS.svg';
import React from 'react'
import { useNavigate } from 'react-router-dom';


const Home = () => {
  const navigate = useNavigate();


  return (
    <div className='boceto'>
      <div className='left-section'>
        <img src={logo} alt='Logo Aphelios' className='logoHome' />
        <div className='buttons'>
          <Button onClick={() => navigate('/surtido')}>Surtido</Button>
          <Button onClick={() => navigate('/ordenes')}>Orden Bodega</Button>
          <Button onClick={() => navigate('/existencias')}>Existencias</Button>
        </div>
      </div>
      <div className='right-section'>
        <img src={recurso} alt='grafico' className='graphic' />
      </div>
    </div>
  )
}

export default Home