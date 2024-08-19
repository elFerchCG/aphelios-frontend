import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  if (!token) {
    return <Navigate to="/login" />;
  }

  if (!allowedRoles.includes(user.rol_descripcion)) {
    return <Navigate to="/unauthorized" />;
  }

  return children;
};

export default ProtectedRoute;