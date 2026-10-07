// =====================================================
// RELACIONES MERCADO LIBRE
// =====================================================

export const getRelacionesMercadoLibre = (
  producto,
) => {
  return Array.isArray(
    producto?.mercado_libre,
  )
    ? producto.mercado_libre
    : [];
};

// =====================================================
// ITEMS MERCADO LIBRE
// =====================================================

export const getItemsMercadoLibre = (
  producto,
) => {
  const relaciones =
    getRelacionesMercadoLibre(
      producto,
    );

  return relaciones.flatMap(
    (relacion) =>
      Array.isArray(relacion?.items)
        ? relacion.items
        : [],
  );
};

// =====================================================
// IMAGEN PRINCIPAL
// =====================================================

export const getImagenProducto = (
  producto,
) => {
  const relaciones =
    getRelacionesMercadoLibre(
      producto,
    );

  // Primero intentamos usar thumbnail del User Product.
  for (const relacion of relaciones) {
    const thumbnail =
      relacion?.user_product
        ?.thumbnail_url;

    if (thumbnail) {
      return thumbnail;
    }
  }

  // Si no existe, buscamos una imagen
  // dentro de las publicaciones.
  const items =
    getItemsMercadoLibre(producto);

  const itemConImagen =
    items.find(
      (item) =>
        item?.thumbnail_url,
    );

  return (
    itemConImagen?.thumbnail_url ||
    null
  );
};

// =====================================================
// CUENTAS MERCADO LIBRE
// =====================================================

export const getCuentasMercadoLibre = (
  producto,
) => {
  const relaciones =
    getRelacionesMercadoLibre(
      producto,
    );

  const cuentas = relaciones
    .map((relacion) => ({
      id:
        relacion?.cuenta
          ?.cuenta_ml_id,

      nombre:
        relacion?.cuenta
          ?.cuenta_ecommerce_nombre ||
        relacion?.cuenta?.nombre,
    }))
    .filter(
      (cuenta) =>
        cuenta.id &&
        cuenta.nombre,
    );

  // Una cuenta puede tener varios MLMU.
  // Mostramos la cuenta una sola vez.
  return [
    ...new Map(
      cuentas.map((cuenta) => [
        cuenta.id,
        cuenta,
      ]),
    ).values(),
  ];
};