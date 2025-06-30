import Rutas from './routing/Rutas';
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Login from './components/login/Login';
import useAuthStore from './store/authStore';

const AppWrapper = () => {
  const navigate = useNavigate();
  const { token, validateSession, logout } = useAuthStore();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const check = async () => {
      const valid = await validateSession();
      if (!valid) navigate('/login');
      setChecked(true);
    };
    check();
  }, [validateSession, navigate]);

  useEffect(() => {
    const handleStorageChange = () => {
      if (!localStorage.getItem('token')) {
        logout();
        navigate('/login');
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [logout, navigate]);

  if (!token) return <Navigate to="/login" replace />;
  if (!checked) return null;

  return <Rutas />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/login' element={<Login />} />
        <Route path='/*' element={<AppWrapper />} />
      </Routes>
    </BrowserRouter>
  );
}
export default App; 