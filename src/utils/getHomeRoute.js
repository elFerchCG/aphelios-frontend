export const getHomeRoute = (user) => {
  if (!user) {
    return "/login";
  }

  const role = user.rol_descripcion;

  switch (role) {
    case "Marketing":
    case "Coordinador Comercial":
    case "Lider Marketing":
      return "/kaizenVentasPerdidas";

    case "administrador":
    case "Planeador":
    case "Almacenista":
    default:
      return "/home";
  }
};