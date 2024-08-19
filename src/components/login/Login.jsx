import * as React from 'react';
import Box from '@mui/system/Box';
import { Button, InputAdornment, TextField } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import KeyIcon from '@mui/icons-material/Key';
import '../../estilos/login.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';

const Login = () => {
  const [nombre, setNombre] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [errorMessage, setErrorMessage] = React.useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const response = await axios.post('http://localhost:3304/auth/login', { nombre, password });
      if (response.data.ok) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        navigate('/ordenesregistradas');
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
    <div className='cuerpoLogin'>
    <Box
      height={250}
      width={250}
      marginTop={15}
      marginLeft={"39%"}
      alignItems="center"
      padding={'40px'}
      sx={{ border: '2px solid #507fdc', 
      boxShadow: '5px 5px 5px 5px rgba(124, 124, 145, 0.5)',
      background: 'rgba(221, 232, 235, 0.5)',
      borderRadius: '40px'
    }}
    >
      <PersonOutlineOutlinedIcon
      color='primary' 
      sx={{ fontSize: 60 }}
      /><br/><br></br>
      <TextField
        label='Usuario'
        type='text'
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        InputProps={{
          startAdornment: <InputAdornment position='start'>
            <PersonIcon />
          </InputAdornment>
        }}
      />
      <p></p>
      <TextField 
        label='Contraseña'
        type='password'
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        InputProps={{
          startAdornment: <InputAdornment position='start'>
            <KeyIcon />
          </InputAdornment>
        }}
        />
       <p/>
        <Button
        variant='contained'
        onClick={handleLogin}
        sx={{background:'#507fdc'}}
        >
        Iniciar Sesión  
        </Button>
    </Box>
  </div>
  )
}

export default Login