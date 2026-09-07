import React, { useState } from "react";
import { NavLink } from "react-router-dom";

import "../../estilos/header.css";

const SidebarNavigation = ({
  items,
  userRole,
  onNavigate,
}) => {
  const [openMenus, setOpenMenus] = useState({});

  const toggleMenu = (key) => {
    setOpenMenus((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const puedeVer = (item) => {
    if (
      item.excludeRoles &&
      item.excludeRoles.includes(userRole)
    ) {
      return false;
    }

    if (item.roles) {
      return item.roles.includes(userRole);
    }

    return true;
  };

  const renderIcon = (
    icon,
    muiClassName,
    imageClassName
  ) => {
    if (!icon) return null;

    if (typeof icon === "string") {
      return (
        <img
          src={icon}
          alt=""
          className={imageClassName}
        />
      );
    }

    const IconComponent = icon;

    return (
      <IconComponent
        className={muiClassName}
      />
    );
  };

  const renderItems = (
    menuItems,
    level = 0,
    parentKey = ""
  ) => {
    return menuItems
      .filter(puedeVer)
      .map((item) => {
        const itemKey = parentKey
          ? `${parentKey}-${item.label}`
          : item.label;

        const tieneSubmenu =
          Array.isArray(item.children) &&
          item.children.filter(puedeVer).length > 0;

        const abierto = Boolean(
          openMenus[itemKey]
        );

        if (tieneSubmenu) {
          return (
            <div
              key={itemKey}
              className={`sidebar-group sidebar-level-${level}`}
            >
              <button
                type="button"
                className={`sidebar-link sidebar-parent ${
                  level > 0
                    ? "sidebar-nested-parent"
                    : ""
                } ${
                  abierto
                    ? "submenu-active"
                    : ""
                }`}
                onClick={() =>
                  toggleMenu(itemKey)
                }
              >
                {renderIcon(
                  item.icon,
                  level === 0
                    ? "sidebar-mui-icon"
                    : "sidebar-mui-subicon",
                  level === 0
                    ? "sidebar-image-icon"
                    : "sidebar-subicon"
                )}

                <span>{item.label}</span>

                <span
                  className={`sidebar-chevron ${
                    abierto ? "open" : ""
                  }`}
                >
                  ▾
                </span>
              </button>

              <div
                className={`sidebar-submenu ${
                  abierto ? "open" : ""
                } ${
                  level > 0
                    ? "sidebar-submenu-nested"
                    : ""
                }`}
              >
                {renderItems(
                  item.children,
                  level + 1,
                  itemKey
                )}
              </div>
            </div>
          );
        }

        return (
          <NavLink
            key={item.path || itemKey}
            to={item.path}
            className={
              level === 0
                ? "sidebar-link"
                : "sidebar-sublink"
            }
            onClick={onNavigate}
          >
            {renderIcon(
              item.icon,
              level === 0
                ? "sidebar-mui-icon"
                : "sidebar-mui-subicon",
              level === 0
                ? "sidebar-image-icon"
                : "sidebar-subicon"
            )}

            <span>{item.label}</span>
          </NavLink>
        );
      });
  };

  return (
    <nav className="sidebar-nav">
      {renderItems(items)}
    </nav>
  );
};

export default SidebarNavigation;