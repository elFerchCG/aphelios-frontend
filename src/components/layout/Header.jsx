import React, { useState } from "react";

import { Menu, MenuItem, ListItemIcon, ListItemText } from "@mui/material";

import LogoutIcon from "@mui/icons-material/Logout";
import FaceRetouchingNaturalIcon from "@mui/icons-material/FaceRetouchingNatural";

import { useLocation, useNavigate } from "react-router-dom";

import SidebarNavigation from "../navigation/SidebarNavigation";
import { navigationConfig } from "../../config/navigationConfig";

import "../../estilos/header.css";

import AvatarSelectorModal from "./AvatarSelectorModal";

import logo from "../../images/APHELIOS negro.png";
import sesion from "../../images/sesion.png";

import useAuthStore from "../../store/authStore";

import { getAvatarImage } from "../../config/avatarConfig";

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { token, user, logout } = useAuthStore();

  const [menuOpen, setMenuOpen] = useState(false);

  const [anchorUser, setAnchorUser] = useState(null);

  const [avatarModalOpen, setAvatarModalOpen] = useState(false);

  const openUserMenu = Boolean(anchorUser);

  const avatarImage = getAvatarImage(user?.avatar_key);

  if (!token || location.pathname === "/login") {
    return null;
  }

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = () => {
    setAnchorUser(null);

    logout();

    navigate("/login");
  };

  // =====================================================
  // MENÚ USUARIO
  // =====================================================

  const handleOpenUserMenu = (event) => {
    if (openUserMenu) {
      setAnchorUser(null);
      return;
    }

    setAnchorUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorUser(null);
  };

  const handleOpenAvatarSelector = () => {
    setAnchorUser(null);
    setAvatarModalOpen(true);
  };

  // =====================================================
  // SIDEBAR
  // =====================================================

  const closeSidebar = () => {
    setMenuOpen(false);
  };

  return (
    <>
      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="header">
        {/* IZQUIERDA */}

        <div className="header-left">
          <button
            type="button"
            className="sidebar-toggle"
            onClick={() => setMenuOpen(true)}
            aria-label="Abrir menú"
          >
            ☰
          </button>
        </div>

        {/* CENTRO */}

        <div className="header-center">
          <img src={logo} alt="Aphelios" className="logo" />
        </div>

        {/* DERECHA */}

        <div className="header-right">
          <button
            type="button"
            className={`profile-button ${openUserMenu ? "open" : ""}`}
            onClick={handleOpenUserMenu}
            aria-label="Menú de usuario"
          >
            {avatarImage ? (
              <img
                src={avatarImage}
                alt="Avatar del usuario"
                className="profile-avatar-image"
              />
            ) : (
              <img src={sesion} alt="Usuario" className="profile-icon" />
            )}
          </button>

          {/* =====================================================
              MENÚ DEL USUARIO
          ===================================================== */}

          <Menu
            anchorEl={anchorUser}
            open={openUserMenu}
            onClose={handleCloseUserMenu}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "right",
            }}
            transformOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
            slotProps={{
              root: {
                sx: {
                  zIndex: 2100,
                },
              },

              paper: {
                sx: {
                  mt: 1.5,

                  minWidth: 250,

                  borderRadius: "16px",

                  overflow: "hidden",

                  border: "1px solid rgba(0,0,0,0.06)",

                  boxShadow: "0px 12px 35px rgba(0,0,0,0.22)",

                  backgroundColor: "#ffffff",
                },
              },
            }}
          >
            {/* =====================================================
                INFORMACIÓN DEL USUARIO
            ===================================================== */}

            <div className="profile-menu-user">
              <div className="profile-menu-avatar">
                <img src={avatarImage || sesion} alt="Avatar del usuario" />
              </div>

              <div className="profile-menu-info">
                <span className="profile-menu-label">Sesión iniciada como</span>

                <span className="profile-menu-name">{user?.nombre}</span>
              </div>
            </div>

            <div className="profile-menu-divider" />

            {/* =====================================================
                CAMBIAR AVATAR
            ===================================================== */}

            <MenuItem
              onClick={handleOpenAvatarSelector}
              sx={{
                py: 1.4,
                px: 2,
                fontFamily: "Montserrat, sans-serif",
                fontWeight: 700,

                "&:hover": {
                  backgroundColor: "#f5f7fa",
                },
              }}
            >
              <ListItemIcon>
                <FaceRetouchingNaturalIcon
                  fontSize="small"
                  sx={{
                    color: "#2196f3",
                  }}
                />
              </ListItemIcon>

              <ListItemText
                primary="Cambiar avatar"
                primaryTypographyProps={{
                  fontFamily: "Montserrat, sans-serif",
                  fontWeight: 700,
                  fontSize: 14,
                  color: "#0f2744",
                }}
              />
            </MenuItem>

            <div className="profile-menu-divider" />

            {/* =====================================================
                CERRAR SESIÓN
            ===================================================== */}

            <MenuItem
              onClick={handleLogout}
              sx={{
                py: 1.4,
                px: 2,
                fontFamily: "Montserrat, sans-serif",
                fontWeight: 700,

                "&:hover": {
                  backgroundColor: "#f5f7fa",
                },
              }}
            >
              <ListItemIcon>
                <LogoutIcon
                  fontSize="small"
                  sx={{
                    color: "#d32f2f",
                  }}
                />
              </ListItemIcon>

              <ListItemText
                primary="Cerrar sesión"
                primaryTypographyProps={{
                  fontFamily: "Montserrat, sans-serif",
                  fontWeight: 700,
                  fontSize: 14,
                  color: "#d32f2f",
                }}
              />
            </MenuItem>
          </Menu>
        </div>
      </header>

      {/* =====================================================
          FONDO SIDEBAR Y PERFIL
      ===================================================== */}

      {openUserMenu && (
        <div className="profile-backdrop" onClick={handleCloseUserMenu} />
      )}

      <div
        className={`sidebar-backdrop ${menuOpen ? "open" : ""}`}
        onClick={closeSidebar}
      />

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <span>Menú</span>

          <button
            type="button"
            className="sidebar-close"
            onClick={closeSidebar}
            aria-label="Cerrar menú"
          >
            ✕
          </button>
        </div>

        <SidebarNavigation
          items={navigationConfig}
          userRole={user?.rol_descripcion}
          onNavigate={closeSidebar}
        />
      </aside>

      <AvatarSelectorModal
        open={avatarModalOpen}
        onClose={() => setAvatarModalOpen(false)}
      />
    </>
  );
};

export default Header;
