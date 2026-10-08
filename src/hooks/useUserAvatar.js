
import { useEffect, useState } from "react";
import axios from "axios";

import { getAvatarImage } from "../config/avatarConfig";

// ============================================================
// CONFIGURACIÓN API
// ============================================================

const apiUrl =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_URL
    : process.env.REACT_APP_API_URL_LOCAL;

// ============================================================
// HOOK - AVATAR DEL USUARIO
// ============================================================

const useUserAvatar = (user, token) => {
  const [avatarSrc, setAvatarSrc] = useState(null);

  // ==========================================================
  // DATOS NECESARIOS DEL USUARIO
  // ==========================================================

  const avatarKey = user?.avatar_key;
  const avatarVersion = user?.avatar_version;

  // ==========================================================
  // CARGAR AVATAR
  // ==========================================================

  useEffect(() => {
    let objectUrl = null;
    let cancelled = false;

    const cargarAvatar = async () => {
      // ======================================================
      // SIN AVATAR O SIN AUTENTICACIÓN
      // ======================================================

      if (!avatarKey || !token) {
        setAvatarSrc(null);
        return;
      }

      // ======================================================
      // AVATAR PREDETERMINADO
      // ======================================================

      if (avatarKey !== "custom") {
        setAvatarSrc(getAvatarImage(avatarKey));
        return;
      }

      // ======================================================
      // AVATAR PERSONALIZADO
      // ======================================================

      try {
        const response = await axios.get(
          `${apiUrl}/usuarios/avatar`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            responseType: "blob",
          },
        );

        // Evitar crear URLs si el efecto ya fue limpiado.
        if (cancelled) return;

        objectUrl = URL.createObjectURL(response.data);

        setAvatarSrc(objectUrl);
      } catch (error) {
        if (cancelled) return;

        console.error(
          "[useUserAvatar] Error al cargar avatar personalizado:",
          error,
        );

        setAvatarSrc(null);
      }
    };

    cargarAvatar();

    // ========================================================
    // LIMPIEZA
    // ========================================================

    return () => {
      cancelled = true;

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [avatarKey, avatarVersion, token]);

  return avatarSrc;
};

export default useUserAvatar;
