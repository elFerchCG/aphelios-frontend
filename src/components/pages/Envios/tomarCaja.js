import axios from 'axios';
import Swal from 'sweetalert2';

// Quién puede tomar una caja sin PIN (la regla real la valida el backend)
export const esAutorizadorCaja = (user) => {
    const rol = String(user?.rol_descripcion ?? '').trim().toLowerCase();
    const permisos = String(user?.permisos ?? '').trim().toLowerCase();
    return rol === 'administrador' || permisos === 'supervisor';
};

// Folio visible: "APOYO-001" para cajas de apoyo, "#70" para las normales
export const folioCaja = (caja) => {
    if (caja?.tipo === 'apoyo') return caja.folio || `APOYO-${String(caja.visual_id ?? '').padStart(3, '0')}`;
    return `#${caja?.visual_id ?? ''}`;
};

// Color de acento del equipo de apoyo
export const COLOR_APOYO = '#6a1b9a';

export const esResponsableCaja = (caja, user) =>
    caja?.responsable_id != null && Number(caja.responsable_id) === Number(user?.id_usuario);

const escaparHtml = (texto) =>
    String(texto ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// "Tomar caja": pide PIN de administrador/supervisor si el usuario no lo es.
// Regresa la respuesta del backend o null si se canceló.
export const tomarCajaConAutorizacion = async ({ apiUrl, token, user, caja }) => {
    const necesitaPin = !esAutorizadorCaja(user);
    const responsable = escaparHtml(caja?.nombre_responsable || 'otra persona');

    const result = await Swal.fire({
        title: `Tomar caja ${folioCaja(caja)}`,
        icon: 'question',
        html:
            `Esta caja está a cargo de <b>${responsable}</b>.<br/>` +
            `Al tomarla, <b>solo tú</b> podrás escanear, borrar escaneos y cerrarla.` +
            (necesitaPin ? `<br/><br/>Se necesita el PIN de un administrador o supervisor.` : ''),
        input: necesitaPin ? 'password' : undefined,
        inputPlaceholder: 'PIN de autorización',
        inputAttributes: { autocomplete: 'off', inputmode: 'numeric' },
        showCancelButton: true,
        confirmButtonText: 'Tomar caja',
        cancelButtonText: 'Cancelar',
        reverseButtons: true,
        showLoaderOnConfirm: true,
        allowOutsideClick: () => !Swal.isLoading(),
        preConfirm: async (pin) => {
            if (necesitaPin && !String(pin || '').trim()) {
                Swal.showValidationMessage('Escribe el PIN de autorización');
                return false;
            }
            try {
                const response = await axios.post(
                    `${apiUrl}/empaque/tomarCaja/${caja.id}`,
                    necesitaPin ? { pin: String(pin).trim() } : {},
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                return response.data;
            } catch (error) {
                Swal.showValidationMessage(error.response?.data?.message || 'No se pudo tomar la caja');
                return false;
            }
        },
    });

    if (!result.isConfirmed || !result.value?.ok) return null;

    await Swal.fire({
        icon: 'success',
        title: 'Caja asignada',
        text: result.value.message,
        timer: 2500,
        showConfirmButton: false,
    });
    return result.value;
};
