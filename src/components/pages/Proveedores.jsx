import React from 'react'
import DataTable from 'react-data-table-component'

export const Proveedores = () => {

    const columns = [
        {
            name: 'ID',
            selector: row => row.id
        },
        {
            name: 'Mes',
            selector: row => row.mes
        },
        {
            name: 'Año',
            selector: row => row.año
        },
        {
            name: 'Día',
            selector: row => row.dia
        },
        {
            name: 'Pedido',
            selector: row => row.pedido
        },
        {
            name: 'Cantidad',
            selector: row => row.cantidad
        },
        {
            name: 'Encargado',
            selector: row => row.encargado
        },
        {
            name: 'Proveedor',
            selector: row => row.proveedor
        },
        {
            name: 'Estatus',
            selector: row => row.estatus
        },
        {
            name: 'Visualizar',
            selector: row => row.visualizar
        },
        {
            name: 'Eliminar',
            selector: row => row.eliminar
        }
    ];

const data = [
    {
        id: 1,
        mes: 'Enero',
        año: 1996,
        dia: 22,
        pedido: 'Cigueñal vortx 300',
        cantidad: 30,
        encargado: 'Abraham Salvador',
        proveedor: 'Vame',
        estatus: 'Activo',
        visualizar: 'No',
        eliminar: 'No'
    }
];

  return (
    <body>
        <div>
            <h1>Proveedores</h1>
            <input type='search'  /> 
            <input type='button' value="Buscar" />
            <input type='button' className='agregarO' value='Agregar orden' />
        </div>
    <section>
        <DataTable
            columns={columns}
            data={data}
        ></DataTable>
    </section>
    </body>
  )
}
