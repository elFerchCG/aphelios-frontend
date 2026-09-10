import {
  swalError,
  swalWarning,
} from "./sweetAlert";

export const handleApiError = (
  error,
  options = {},
) => {
  const {
    defaultMessage = "Ocurrió un error inesperado.",
    serverMessage = "Ocurrió un error interno en el servidor. Intenta nuevamente más tarde.",
    connectionMessage = "No fue posible comunicarse con el servidor.",
    warningTitle = "No se pudo completar la operación",
    errorTitle = "Error",
    serverTitle = "Error en el servidor",
    connectionTitle = "Error de conexión",
  } = options;

  const status = error?.response?.status;

  const backendMessage =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    null;

  // Sin respuesta del backend
  if (!error?.response) {
    return swalError(
      connectionTitle,
      connectionMessage,
    );
  }

  // Errores internos del servidor
  if (status >= 500) {
    return swalError(
      serverTitle,
      serverMessage,
    );
  }

  // Errores de negocio / validación / permisos / conflictos
  if (status >= 400 && status < 500) {
    return swalWarning(
      warningTitle,
      backendMessage ||
        defaultMessage,
    );
  }

  // Cualquier otro caso inesperado
  return swalError(
    errorTitle,
    backendMessage ||
      defaultMessage,
  );
};