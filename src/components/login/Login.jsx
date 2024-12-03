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
import { jwtDecode } from 'jwt-decode';


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

  // Función para verificar si el token está presente y es válido
  const checkTokenValidity = () => {
    const token = localStorage.getItem('token');
    if (token) {
      // Aquí puedes hacer una petición al backend si necesitas validar el token
      // o realizar una validación con JWT en frontend (si es necesario)
      try {
        const decodedToken = jwtDecode(token); // Usar jwt-decode o similar si lo necesitas
        const currentTime = Math.floor(Date.now() / 1000); // Obtener tiempo actual en segundos
        if (decodedToken.exp < currentTime) {
          // El token ha expirado
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
        } else {
          // El token es válido
          navigate('/home');
        }
      } catch (error) {
        // Si no se puede decodificar el token, lo eliminamos y redirigimos a login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      }
    }
  };

  React.useEffect(() => {
    checkTokenValidity();
  }, []); // Este useEffect se ejecutará al cargar el componente

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