// Clasificación de estatus de un producto dentro del Consolidado de
// Producción (ConsolidadoDrawer / ProductoRow). Vive en su propio archivo
// para que el filtro del drawer y la fila usen exactamente la misma
// lógica sin duplicarla — antes obtenerEstadoProducto vivía solo dentro
// de ProductoRow.jsx.

export const ESTADOS_PRODUCTO = [
    { value: 'SIN_ENVIO_PENDIENTE_SURTIR', label: 'Sin Envío | Pendiente por Surtir', tone: 'warning' },
    { value: 'PENDIENTE_SURTIR', label: 'Pendiente por Surtir', tone: 'warning' },
    { value: 'SIN_ENVIO_COMPLETO', label: 'Sin Envío | Surtido Completo', tone: 'success' },
    { value: 'EMPACADO', label: 'Empacado', tone: 'success' },
    { value: 'PENDIENTE_EMPACAR', label: 'Pendiente por Empacar', tone: 'info' }
];

// Orden "de urgencia" para cuando se ordena la lista por estatus: primero
// lo que requiere más atención (pendiente por surtir), al final lo que ya
// está listo (empacado).
export const ORDEN_ESTATUS_PRODUCTO = [
    'SIN_ENVIO_PENDIENTE_SURTIR',
    'PENDIENTE_SURTIR',
    'PENDIENTE_EMPACAR',
    'SIN_ENVIO_COMPLETO',
    'EMPACADO'
];

export const obtenerEstadoProducto = (item) => {
    const { cantidad_a_enviar, cantidad_empacada, componentes = [] } = item;

    const cantEnviar = Number(cantidad_a_enviar || 0);
    const cantEmpacada = Number(cantidad_empacada || 0);

    // Evaluamos si falta surtir algún componente
    const tieneComponentesPendientes = componentes.some((comp) => {
        const cantFacturada = Number(comp.componente_cantidad_facturada || 0);
        const cantContada = Number(comp.cantidad_contada || 0);
        const pendiente = Number(comp.pendiente || 0);

        return pendiente > 0 || cantContada < cantFacturada;
    });

    // 1. Si faltan piezas por surtirse
    if (tieneComponentesPendientes) {
        if (cantEnviar === 0) {
            return {
                status: 'SIN_ENVIO_PENDIENTE_SURTIR',
                resaltar: true,
                label: 'Sin Envío | Pendiente por Surtir',
                tone: 'warning'
            };
        }
        return {
            status: 'PENDIENTE_SURTIR',
            resaltar: true,
            label: 'Pendiente por Surtir',
            tone: 'warning'
        };
    }

    // 2. Si ya está 100% surtido pero NO requiere empaque/envío
    if (cantEnviar === 0) {
        return {
            status: 'SIN_ENVIO_COMPLETO',
            resaltar: false,
            label: 'Sin Envío | Surtido Completo',
            tone: 'success'
        };
    }

    // 3. Si requiere envío y está 100% surtido, evaluamos empaque
    const estaEmpacado = cantEmpacada >= cantEnviar;

    if (estaEmpacado) {
        return {
            status: 'EMPACADO',
            resaltar: false,
            label: 'Empacado',
            tone: 'success'
        };
    }

    return {
        status: 'PENDIENTE_EMPACAR',
        resaltar: true,
        label: 'Pendiente por Empacar',
        tone: 'info'
    };
};
