import * as React from 'react';
import { Button, InputAdornment, TextField } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import logo from '../../images/Logo aphelios blanco.png';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import '../../estilos/login.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import apiUrl from '../../config';

const Login = () => {
  const [nombre, setNombre] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [errorMessage, setErrorMessage] = React.useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const response = await axios.post(`${apiUrl}/auth/login`, { nombre, password });
      if (response.data.ok) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        navigate('/home');
      } else {
        alert('Login fallido');
      }
    } catch (error) {
      // Captura el error y extrae el mensaje
      if (error.response && error.response.data) {
        const message = error.response.data.message;
        setErrorMessage(message);
        Swal.fire({
          title: 'Error',
          text: message,
          icon: 'error',
          timer: 5000,
          showCloseButton: true,
          allowEscapeKey: true
        });
      } else {
        const defaultMessage = 'Ocurrió un error inesperado.';
        setErrorMessage(defaultMessage);
        alert(`Error: ${defaultMessage}`);
      }
    }
  }

  return (
    <div className='layoutLogin'>
       <img src={logo} alt="logo" className="logoAphelios" />
      <div className='cuerpoLogin'>
        <TextField
          className='itemLogin'
          variant="standard"
          label="Usuario"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          sx={{
            marginBottom: '20px', width: '100%'
          }}
          InputLabelProps={{
            shrink: true,  // Forzar que el label se mantenga arriba
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <AccountCircleOutlinedIcon sx={{ color: 'action.active', mr: 1, my: 0.5 }} />
              </InputAdornment>
            ),
          }}
        />
        <TextField
          className='itemLogin'
          variant='standard'
          label='Contraseña'
          type='password'
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          sx={{
            width: '100%'
          }}
          InputProps={{
            startAdornment:
              <InputAdornment position='start'>
                <LockOutlinedIcon sx={{ color: 'action.active', mr: 1, my: 0.5 }} />
              </InputAdornment>
          }}
        />
        <Button
          variant='contained'
          className='botonLogin'
          onClick={handleLogin}
          sx={{
            borderRadius: '20px',
            width: '100%',
            boxShadow: '0px 0px 30px 20px rgba(0, 0, 0, 0.30)'
          }}>INICIAR SESIÓN</Button>
      </div>
    </div>
  )
}

export default Login