import Swal from "sweetalert2";

const customClass = {
  container: "mi-swal",
};

export const swalSuccess = (
  title,
  text,
  timer = 1800
) => {
  return Swal.fire({
    icon: "success",
    title,
    text,
    timer,
    showConfirmButton: false,
    customClass,
  });
};

export const swalError = (
  title,
  text
) => {
  return Swal.fire({
    icon: "error",
    title,
    text,
    customClass,
  });
};

export const swalWarning = (
  title,
  text
) => {
  return Swal.fire({
    icon: "warning",
    title,
    text,
    customClass,
  });
};

export const swalInfo = (
  title,
  text
) => {
  return Swal.fire({
    icon: "info",
    title,
    text,
    customClass,
  });
};