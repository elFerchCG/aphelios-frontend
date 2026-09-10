import {
  useEffect,
  useState,
} from "react";

import axios from "axios";

import {
  getAvatarImage,
} from "../config/avatarConfig";

const apiUrl =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_URL
    : process.env.REACT_APP_API_URL_LOCAL;

const useUserAvatar = (
  user,
  token,
) => {
  const [avatarSrc, setAvatarSrc] =
    useState(null);

  useEffect(() => {
    let objectUrl = null;
    let cancelled = false;

    const cargarAvatar = async () => {
      // ==========================================
      // SIN USUARIO / SIN TOKEN
      // ==========================================

      if (
        !user ||
        !token ||
        !user?.avatar_key
      ) {
        setAvatarSrc(null);
        return;
      }

      // ==========================================
      // AVATAR PREDETERMINADO
      // ==========================================

      if (
        user.avatar_key !== "custom"
      ) {
        setAvatarSrc(
          getAvatarImage(
            user.avatar_key,
          ),
        );

        return;
      }

      // ==========================================
      // AVATAR PERSONALIZADO
      // ==========================================

      try {
        const response =
          await axios.get(
            `${apiUrl}/usuarios/avatar`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },

              responseType:
                "blob",
            },
          );

        objectUrl =
          URL.createObjectURL(
            response.data,
          );

        if (!cancelled) {
          setAvatarSrc(
            objectUrl,
          );
        }
      } catch (error) {
        console.error(
          "Error al cargar avatar personalizado:",
          error,
        );

        if (!cancelled) {
          setAvatarSrc(null);
        }
      }
    };

    cargarAvatar();

    return () => {
      cancelled = true;

      if (objectUrl) {
        URL.revokeObjectURL(
          objectUrl,
        );
      }
    };
  }, [
    user?.avatar_key,
    user?.avatar_version,
    token,
  ]);

  return avatarSrc;
};

export default useUserAvatar;