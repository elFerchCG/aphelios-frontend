import {
  useEffect,
  useState,
} from "react";

import axios from "axios";

import useAuthStore from "../../../store/authStore";

import {
  swalSuccess,
} from "../../../helpers/sweetAlert";

import {
  handleApiError,
} from "../../../helpers/apiErrorHandler";

const apiUrl =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_URL
    : process.env.REACT_APP_API_URL_LOCAL;

const useAvatarSelector = (
  open,
  onClose,
) => {
  const {
    token,
    user,
    updateUser,
  } = useAuthStore();

  const [
    selectedAvatar,
    setSelectedAvatar,
  ] = useState(
    user?.avatar_key || "",
  );

  const [
    customFile,
    setCustomFile,
  ] = useState(null);

  const [
    customPreview,
    setCustomPreview,
  ] = useState(null);

  const [
    customSavedImage,
    setCustomSavedImage,
  ] = useState(null);

  const [
    hasCustomAvatar,
    setHasCustomAvatar,
  ] = useState(false);

  const [
    loadingCustom,
    setLoadingCustom,
  ] = useState(false);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  // =====================================================
  // RESET AL ABRIR
  // =====================================================

  useEffect(() => {
    if (!open) {
      return;
    }

    setSelectedAvatar(
      user?.avatar_key || "",
    );

    setCustomFile(null);
    setCustomPreview(null);
    setError("");
  }, [
    open,
    user?.avatar_key,
  ]);

  // =====================================================
  // STATUS CUSTOM
  // =====================================================

  useEffect(() => {
    if (
      !open ||
      !token
    ) {
      return;
    }

    let cancelled = false;

    const cargarEstadoAvatar =
      async () => {
        try {
          setLoadingCustom(true);

          const response =
            await axios.get(
              `${apiUrl}/usuarios/avatar/status`,
              {
                headers: {
                  Authorization:
                    `Bearer ${token}`,
                },
              },
            );

          if (cancelled) {
            return;
          }

          setHasCustomAvatar(
            Boolean(
              response.data
                ?.data
                ?.has_custom_avatar,
            ),
          );
        } catch (error) {
          console.error(
            "Error al consultar estado del avatar:",
            error,
          );

          if (!cancelled) {
            setHasCustomAvatar(
              false,
            );
          }
        } finally {
          if (!cancelled) {
            setLoadingCustom(
              false,
            );
          }
        }
      };

    cargarEstadoAvatar();

    return () => {
      cancelled = true;
    };
  }, [
    open,
    token,
  ]);

  // =====================================================
  // CARGAR CUSTOM GUARDADA
  // =====================================================

  useEffect(() => {
    if (
      !open ||
      !token ||
      !hasCustomAvatar
    ) {
      setCustomSavedImage(
        null,
      );

      return;
    }

    let objectUrl = null;
    let cancelled = false;

    const cargarCustom =
      async () => {
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
            setCustomSavedImage(
              objectUrl,
            );
          }
        } catch (error) {
          console.error(
            "Error al cargar avatar custom:",
            error,
          );

          if (!cancelled) {
            setCustomSavedImage(
              null,
            );
          }
        }
      };

    cargarCustom();

    return () => {
      cancelled = true;

      if (objectUrl) {
        URL.revokeObjectURL(
          objectUrl,
        );
      }
    };
  }, [
    open,
    token,
    hasCustomAvatar,
    user?.avatar_version,
  ]);

  // =====================================================
  // CLEANUP PREVIEW
  // =====================================================

  useEffect(() => {
    return () => {
      if (customPreview) {
        URL.revokeObjectURL(
          customPreview,
        );
      }
    };
  }, [
    customPreview,
  ]);

  // =====================================================
  // SELECCIONAR PRESET
  // =====================================================

  const selectPreset = (
    avatarKey,
  ) => {
    setSelectedAvatar(
      avatarKey,
    );

    setCustomFile(null);
    setCustomPreview(null);
    setError("");
  };

  // =====================================================
  // SELECCIONAR CUSTOM EXISTENTE
  // =====================================================

  const selectSavedCustom =
    () => {
      if (
        !hasCustomAvatar
      ) {
        return;
      }

      setSelectedAvatar(
        "custom",
      );

      setCustomFile(null);
      setCustomPreview(null);
      setError("");
    };

  // =====================================================
  // SELECCIONAR NUEVO ARCHIVO
  // =====================================================

  const selectCustomFile = (
    event,
  ) => {
    const file =
      event.target.files?.[0];

    event.target.value = "";

    if (!file) {
      return;
    }

    const tiposPermitidos = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (
      !tiposPermitidos.includes(
        file.type,
      )
    ) {
      setError(
        "Solo puedes subir imágenes JPG, PNG o WEBP.",
      );

      return;
    }

    if (
      file.size >
      1024 * 1024
    ) {
      setError(
        "La imagen no puede superar 1 MB.",
      );

      return;
    }

    if (customPreview) {
      URL.revokeObjectURL(
        customPreview,
      );
    }

    const preview =
      URL.createObjectURL(
        file,
      );

    setCustomFile(file);
    setCustomPreview(preview);

    setSelectedAvatar(
      "custom",
    );

    setError("");
  };

  // =====================================================
  // GUARDAR
  // =====================================================

  const saveAvatar =
    async () => {
      if (!selectedAvatar) {
        setError(
          "Selecciona un avatar antes de guardar.",
        );

        return;
      }

      try {
        setSaving(true);
        setError("");

        // ===============================================
        // NUEVA CUSTOM
        // ===============================================

        if (
          selectedAvatar ===
            "custom" &&
          customFile
        ) {
          const formData =
            new FormData();

          formData.append(
            "avatar",
            customFile,
          );

          const response =
            await axios.post(
              `${apiUrl}/usuarios/avatar`,
              formData,
              {
                headers: {
                  Authorization:
                    `Bearer ${token}`,
                },
              },
            );

          if (
            !response.data?.ok
          ) {
            throw new Error(
              response.data
                ?.message ||
                "No se pudo actualizar el avatar.",
            );
          }

          updateUser({
            avatar_key:
              "custom",

            avatar_version:
              Date.now(),
          });
        }

        // ===============================================
        // PRESET O CUSTOM YA GUARDADA
        // ===============================================

        else {
          const response =
            await axios.patch(
              `${apiUrl}/usuarios/me/avatar`,
              {
                avatar_key:
                  selectedAvatar,
              },
              {
                headers: {
                  Authorization:
                    `Bearer ${token}`,
                },
              },
            );

          if (
            !response.data?.ok
          ) {
            throw new Error(
              response.data
                ?.message ||
                "No se pudo actualizar el avatar.",
            );
          }

          updateUser({
            avatar_key:
              selectedAvatar,

            avatar_version:
              Date.now(),
          });
        }

        onClose();

        await swalSuccess(
          "Avatar actualizado",
          "Tu avatar se actualizó correctamente.",
        );
      } catch (error) {
        console.error(
          "Error al actualizar avatar:",
          error,
        );

        handleApiError(
          error,
          {
            defaultMessage:
              "No se pudo actualizar el avatar.",
          },
        );
      } finally {
        setSaving(false);
      }
    };

  // =====================================================
  // CERRAR
  // =====================================================

  const closeModal = () => {
    if (saving) {
      return;
    }

    setCustomFile(null);
    setCustomPreview(null);
    setError("");

    onClose();
  };

  // =====================================================
  // DERIVADOS
  // =====================================================

  const hayNuevaImagen =
    Boolean(customFile);

  const customSeleccionada =
    selectedAvatar ===
    "custom";

  const sinCambios =
    !hayNuevaImagen &&
    selectedAvatar ===
      user?.avatar_key;

  const imagenCustomVisible =
    customPreview ||
    customSavedImage;

  return {
    user,

    selectedAvatar,
    customFile,
    customPreview,
    customSavedImage,
    hasCustomAvatar,

    loadingCustom,
    saving,
    error,

    hayNuevaImagen,
    customSeleccionada,
    sinCambios,
    imagenCustomVisible,

    selectPreset,
    selectSavedCustom,
    selectCustomFile,
    saveAvatar,
    closeModal,
  };
};

export default useAvatarSelector;