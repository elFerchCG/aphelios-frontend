// [MULTICUENTA-ML] Llamadas al backend /multicuentaML (con la sesión del usuario).
import axios from "axios";
import apiUrl from "../../config";

const base = () => `${apiUrl}/multicuentaML`;
const headers = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

export const mcGet = (ruta, params) => axios.get(`${base()}${ruta}`, { headers: headers(), params }).then((r) => r.data);
export const mcPost = (ruta, body) => axios.post(`${base()}${ruta}`, body || {}, { headers: headers() }).then((r) => r.data);
export const mcPatch = (ruta, body) => axios.patch(`${base()}${ruta}`, body || {}, { headers: headers() }).then((r) => r.data);

/** Descarga un archivo (las etiquetas requieren sesión, no se pueden abrir con window.open). */
export const mcDescargar = async (ruta, params, nombre) => {
  const r = await axios.get(`${base()}${ruta}`, { headers: headers(), params, responseType: "blob" });
  const url = URL.createObjectURL(r.data);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
};

/** Mensaje legible de un error del backend (incluye respuestas blob). */
export const mensajeError = async (error, porDefecto = "Ocurrió un error.") => {
  const data = error?.response?.data;
  if (data instanceof Blob) {
    try {
      return JSON.parse(await data.text())?.message || porDefecto;
    } catch (e) {
      return porDefecto;
    }
  }
  return data?.message || error?.message || porDefecto;
};
