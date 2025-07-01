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
import useAuthStore from '../../store/authStore';


const Login = () => {
  const [nombre, setNombre] = React.useState('');
  const [password, setPassword] = React.useState('');
  const navigate = useNavigate();
  const { setSession, logout } = useAuthStore();

  const handleLogin = async () => {
    try {
      const response = await axios.post(`${apiUrl}/auth/login`, { nombre, password });

      if (response.data.ok) {
        setSession(response.data.token, response.data.user);
        navigate('/home');
      } else {
        Swal.fire({ title: 'Error', text: 'Login fallido', icon: 'error' });
      }
    } catch (error) {
      const message = error?.response?.data?.message || 'Ocurrió un error inesperado.';
      Swal.fire({
        title: 'Error',
        text: message,
        icon: 'error',
        timer: 5000,
        showCloseButton: true,
        allowEscapeKey: true,
      });
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') handleLogin();
  };

  React.useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        const now = Math.floor(Date.now() / 1000);
        if (decoded.exp < now) {
          logout();
          navigate('/login');
        } else {
          navigate('/home');
        }
      } catch {
        logout();
        navigate('/login');
      }
    }
  }, [logout, navigate]);

  return (
    <div className='layoutLogin'>
      <img src={logo} alt="logo" className="logoAphelios" />
      <div className='cuerpoLogin' onKeyDown={handleKeyDown}>
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