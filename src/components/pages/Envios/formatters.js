export const formatFecha = (valor) => {

    if (!valor) return null;

    const texto = String(valor);
    const match = texto.match(/^(\d{4}-\d{2}-\d{2})/);

    return match ? match[1] : texto;

};