export const mostrarValor = (valor) => {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return "—";
  }

  return valor;
};

export const formatearMoneda = (valor) => {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return "—";
  }

  return Number(valor).toLocaleString(
    "es-MX",
    {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  );
};

export const formatearFecha = (fecha) => {
  if (!fecha) {
    return "—";
  }

  const date =
    new Date(fecha);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return fecha;
  }

  return date.toLocaleString(
    "es-MX",
  );
};

export const getNombreCuenta = (
  relacion,
) => {
  return (
    relacion?.cuenta
      ?.cuenta_ecommerce_nombre ||
    relacion?.cuenta?.nombre ||
    "Mercado Libre"
  );
};

export const getRelacionesMercadoLibre = (
  detalle,
) => {
  return Array.isArray(
    detalle?.mercado_libre,
  )
    ? detalle.mercado_libre
    : [];
};

export const getItemsRelacion = (
  relacion,
) => {
  return Array.isArray(
    relacion?.items,
  )
    ? relacion.items
    : [];
};

export const getAtributosRelacion = (
  relacion,
) => {
  return Array.isArray(
    relacion?.atributos,
  )
    ? relacion.atributos
    : [];
};

export const getImagenesRelacion = (
  relacion,
) => {
  return Array.isArray(
    relacion?.imagenes,
  )
    ? relacion.imagenes
    : [];
};