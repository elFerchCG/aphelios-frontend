import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({
  children,
  allowedRoles,
  excludedRoles,
}) => {
  const token = localStorage.getItem("token");

  let user = null;

  try {
    user = JSON.parse(localStorage.getItem("user"));
  } catch {
    user = null;
  }

  if (!token || !user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  const userRole = user.rol_descripcion;

  if (
    excludedRoles &&
    excludedRoles.includes(userRole)
  ) {
    return (
      <Navigate
        to="/unauthorized"
        replace
      />
    );
  }

  if (
    allowedRoles &&
    !allowedRoles.includes(userRole)
  ) {
    return (
      <Navigate
        to="/unauthorized"
        replace
      />
    );
  }

  return children;
};

export default ProtectedRoute;