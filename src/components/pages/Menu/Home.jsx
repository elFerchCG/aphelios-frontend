import { Button } from '@mui/material'
import './estilos.css';
import recurso from './images/Recurso 1.svg';
import logo from './images/LOGO APHELIOS.svg';
import React from 'react'



const Home = () => {



  return (
    <div className='boceto'>
      <div className='left-section'>
        <img src={logo} alt='Logo Aphelios' className='logoHome' />
        <div className='buttons'>
          <Button>Envio actual</Button>
          <Button>Crear Orden</Button>
          <Button>Existencias</Button>
          <Button>Contar producto</Button>
        </div>
      </div>
      <div className='right-section'>
        <img src={recurso} alt='grafico' className='graphic' />
      </div>
    </div>
  )
}

export default Home