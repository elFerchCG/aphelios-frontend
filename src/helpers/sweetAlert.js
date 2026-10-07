import Swal from "sweetalert2";

const customClass = {
  container: "mi-swal",
};

export const swalSuccess = (title, text, timer = 1800) => {
  return Swal.fire({
    icon: "success",
    title,
    text,
    timer,
    showConfirmButton: false,
    customClass,
  });
};

export const swalError = (title, text) => {
  return Swal.fire({
    icon: "error",
    title,
    text,
    customClass,
  });
};

export const swalWarning = (title, text) => {
  return Swal.fire({
    icon: "warning",
    title,
    text,
    customClass,
  });
};

export const swalInfo = (title, text) => {
  return Swal.fire({
    icon: "info",
    title,
    text,
    customClass,
  });
};

export const swalTextarea = ({
  title,
  text,
  placeholder = "",
  confirmButtonText = "Confirmar",
  cancelButtonText = "Cancelar",
  maxLength = 1000,
  requiredMessage = "Este campo es obligatorio.",
}) => {
  return Swal.fire({
    icon: "warning",
    title,
    text,
    input: "textarea",
    inputPlaceholder: placeholder,

    inputAttributes: {
      maxlength: String(maxLength),
    },

    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    reverseButtons: true,

    customClass,

    inputValidator: (value) => {
      const valor = value?.trim();

      if (!valor) {
        return requiredMessage;
      }

      if (valor.length > maxLength) {
        return `El texto no puede superar los ${maxLength} caracteres.`;
      }

      return undefined;
    },
  });
};
