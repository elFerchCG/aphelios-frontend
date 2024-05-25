import React from 'react'
import DataTable from 'react-data-table-component'
import { RegistroProveedor } from '../pages/RegistroProveedor';


export const Proveedores = () => {

    const columns = [
        {
            name: 'ID',
            selector: row => row.id,
            sortable: true
        },
        {
            name: 'Mes',
            selector: row => row.mes,
            sortable: true
        },
        {
            name: 'Año',
            selector: row => row.año,
            sortable: true
        },
        {
            name: 'Día',
            selector: row => row.dia,
            sortable: true
        },
        {
            name: 'Pedido',
            selector: row => row.pedido,
            sortable: true
        },
        {
            name: 'Cantidad',
            selector: row => row.cantidad,
            sortable: true
        },
        {
            name: 'Encargado',
            selector: row => row.encargado,
            sortable: true
        },
        {
            name: 'Proveedor',
            selector: row => row.proveedor,
            sortable: true
        },
        {
            name: 'Estatus',
            selector: row => row.estatus,
            sortable: true
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
        <div className='layoutP'>
            <h1>Proveedores</h1>
            <input type='search'  /> 
            <input type='button' value="Buscar" />
            <button className='agregarO' >Agregar Proveedor</button> 
        </div>
    <section>
        <DataTable
            columns={columns}
            data={data}
            fixedHeader
            pagination
        ></DataTable>
    </section>
    </body>
  )
}
