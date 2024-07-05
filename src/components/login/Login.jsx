import * as React from 'react';
import Box from '@mui/system/Box';
import { Button, TextField } from '@mui/material';
import '../../estilos/login.css'


const Login = () => {
 // const userRef


  return (
    <div className='cuerpoLogin'>
    <Box
      height={250}
      width={250}
      marginTop={10}
      marginLeft={"40%"}
      alignItems="center"
      p={6}
      padding={'40px'}
      sx={{ border: '2px solid grey', 
      boxShadow: '0 3px 5px 2px rgba(124, 124, 145, 0.5)',
      background: 'rgba(124, 124, 145, 0.5)'  }}
    >
      <h2 id='titulo'> ¡¡Bienvenido!! </h2><br/><br></br>
      <TextField
        label='Usuario'
        type='text'
      />
      <p></p>
      <TextField
        label='Contraseña'
        type='password'
        />
       <p/>
        <Button
        variant='contained'>
        Iniciar Sesión  
        </Button>
    </Box>
  </div>
  )
}

export default Login