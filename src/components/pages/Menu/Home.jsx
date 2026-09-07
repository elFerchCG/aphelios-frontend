import "./estilos.css";
import recurso from "./images/Recurso 1.svg";
import logo from "./images/LOGO APHELIOS.svg";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import WarehouseOutlinedIcon from "@mui/icons-material/WarehouseOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import ArrowForwardIosOutlinedIcon from "@mui/icons-material/ArrowForwardIosOutlined";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";

const Home = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")));

  useEffect(() => {
    const handleStorageChange = () => {
      setUser(JSON.parse(localStorage.getItem("user")));
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const rolesHomeOperativo = ["administrador", "Planeador", "Almacenista"];

  const puedeVerHomeOperativo =
    user && rolesHomeOperativo.includes(user.rol_descripcion);

  const accesos = [
    {
      titulo: "Orden Bodega",
      descripcion: "Consulta y gestiona órdenes de almacén.",
      icono: WarehouseOutlinedIcon,
      ruta: "/ordenes",
    },
    {
      titulo: "Existencias",
      descripcion: "Revisa el inventario disponible.",
      icono: Inventory2OutlinedIcon,
      ruta: "/existencias",
    },
    {
      titulo: "Ventas ME",
      descripcion: "Consulta ventas y movimientos comerciales.",
      icono: StorefrontOutlinedIcon,
      ruta: "/ventas-me",
    },
  ];

  return (
    <div className="boceto">
      <div className="left-section">
        <div className="home-left-content">
          <img src={logo} alt="Logo Aphelios" className="logoHome" />

          <div
            className={`home-welcome ${
              puedeVerHomeOperativo ? "home-welcome-operativo" : ""
            }`}
          >
            <div className="home-welcome-icon">👋</div>

            <h1>Bienvenido a Aphelios</h1>

            <p>
              Hola <strong>{user?.nombre || "usuario"}</strong>, bienvenido al
              sistema.
            </p>

            {!puedeVerHomeOperativo && (
              <div className="home-menu-message">
                <div className="home-menu-message-content">
                  <span className="home-menu-message-title">
                    Explora tus opciones
                  </span>

                  <div className="home-menu-message-icon">
                    <MenuRoundedIcon />
                  </div>

                  <span className="home-menu-message-text">
                    Abre el menú de navegación para consultar los módulos
                    disponibles para tu usuario.
                  </span>
                </div>
              </div>
            )}

            <div className="home-welcome-footer">
              <span />

              <p>Gestiona, consulta y mantente al día en un solo lugar</p>

              <span />
            </div>
          </div>

          {puedeVerHomeOperativo && (
            <div className="home-actions">
              {accesos.map((acceso) => {
                const Icon = acceso.icono;

                return (
                  <button
                    key={acceso.titulo}
                    type="button"
                    className="home-action-card"
                    onClick={() => navigate(acceso.ruta)}
                  >
                    <div className="home-action-icon">
                      <Icon />
                    </div>

                    <div className="home-action-content">
                      <span className="home-action-title">{acceso.titulo}</span>

                      <span className="home-action-description">
                        {acceso.descripcion}
                      </span>
                    </div>

                    <ArrowForwardIosOutlinedIcon className="home-action-arrow" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="right-section">
        <img src={recurso} alt="Gráfico Aphelios" className="graphic" />
      </div>
    </div>
  );
};

export default Home;
