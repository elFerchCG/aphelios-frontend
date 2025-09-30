import { Breadcrumbs, Link, Typography } from "@mui/material";
import { useLocation, useNavigate, matchPath } from "react-router-dom";

// Aquí definimos la jerarquía manualmente
const breadcrumbNameMap = {
  "/cargaFacturas": "Carga de Facturas",
  "/facturas": "Lista de Facturas",
  "/detalleFacturas/factura/:facturaId": "Detalle de Factura",
};

export default function BreadcrumbsNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const paths = [];

  // Siempre mostrar Carga de Facturas como raíz
  paths.push({ path: "/cargaFacturas", label: breadcrumbNameMap["/cargaFacturas"] });

  // Si estamos en /facturas o dentro de detalle
  if (matchPath("/facturas", location.pathname) || matchPath("/detalleFacturas/*", location.pathname)) {
    paths.push({ path: "/facturas", label: breadcrumbNameMap["/facturas"] });
  }

  // Si estamos en detalle
  if (matchPath("/detalleFacturas/factura/:facturaId", location.pathname)) {
    paths.push({
      path: location.pathname, // se queda en la actual
      label: breadcrumbNameMap["/detalleFacturas/factura/:facturaId"],
    });
  }

  return (
    <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
      {paths.map((crumb, index) => {
        const isLast = index === paths.length - 1;

        return isLast ? (
          <Typography color="text.primary" key={crumb.path}>
            {crumb.label}
          </Typography>
        ) : (
          <Link
            key={crumb.path}
            underline="hover"
            color="inherit"
            sx={{ cursor: "pointer" }}
            onClick={() => navigate(crumb.path)}
          >
            {crumb.label}
          </Link>
        );
      })}
    </Breadcrumbs>
  );
}