import * as React from 'react';
import { Button, FormControl, IconButton, InputAdornment, InputLabel, OutlinedInput } from '@mui/material';
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
import { Visibility, VisibilityOff } from '@mui/icons-material';


const Login = () => {
  const [nombre, setNombre] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const navigate = useNavigate();
  const { setSession, logout } = useAuthStore();

  const handleClickShowPassword = () => {
    setShowPassword((prev) => !prev);
  }

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  const handleMouseUpPassword = (event) => {
    event.preventDefault();
  };


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
    <div
      className='layoutLogin'
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        padding: '2vw',
        boxSizing: 'border-box',
      }}
    >
      <img
        src={logo}
        alt="logo"
        className="logoAphelios"
        style={{
          // 🔑 CAMBIO CLAVE: Fija el tamaño con px para que no cambie con el zoom
          width: '180px',
          maxWidth: '220px',
          minWidth: '100px',
          height: 'auto',
          marginBottom: '2vh', // Esto ahora no afecta la posición
        }}
      />

      <div
        className='cuerpoLogin'
        onKeyDown={handleKeyDown}
        style={{
          width: '100%',
          maxWidth: '28vw',        // escala con la pantalla
          minWidth: '280px',       // nunca más pequeño que esto
          padding: '2vw',
          boxSizing: 'border-box',
          transform: 'scale(1)',   // mantiene proporción visual si luego quieres ajustar zoom
          transition: 'all 0.3s ease',
        }}
      >
        <FormControl sx={{ m: 1, width: '100%' }} variant="outlined" className='itemLogin'>
          <InputLabel htmlFor="outlined-adornment-username">Usuario</InputLabel>
          <OutlinedInput
            id="outlined-adornment-username"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            startAdornment={
              <InputAdornment position="start">
                <AccountCircleOutlinedIcon sx={{ color: 'action.active', mr: 1, my: 0.5 }} />
              </InputAdornment>
            }
            label="Usuario"
          />
        </FormControl>
        <FormControl sx={{ m: 1, width: '100%' }} variant="outlined" className='itemLogin'>
          <InputLabel htmlFor="outlined-adornment-password">Contraseña</InputLabel>
          <OutlinedInput
            id="outlined-adornment-password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            startAdornment={
              <InputAdornment position='start'>
                <LockOutlinedIcon sx={{ color: 'action.active', mr: 1, my: 0.5 }} />
              </InputAdornment>
            }
            endAdornment={
              <InputAdornment position="end">
                <IconButton
                  aria-label={
                    showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
                  }
                  onClick={handleClickShowPassword}
                  onMouseDown={handleMouseDownPassword}
                  onMouseUp={handleMouseUpPassword}
                  edge="end"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            }
            label="Contraseña"
          />
        </FormControl>
        <Button
          variant='contained'
          className='botonLogin'
          onClick={handleLogin}
          sx={{
            borderRadius: '20px',
            width: '100%',
            boxShadow: '0px 0px 30px 20px rgba(0, 0, 0, 0.30)',
          }}
        >
          INICIAR SESIÓN
        </Button>
      </div>
    </div>
  );
}

export default Login