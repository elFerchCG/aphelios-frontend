import React from 'react'
import DataTable from 'react-data-table-component'
import { Link } from 'react-router-dom';

export const Proveedores = () => {

    const columns = [
        {
            name: 'ID',
            selector: row => row.id,
            sortable: true
        },
        {
            name: 'Razon social',
            selector: row => row.id,
            sortable: true
        },
        {
            name: 'Telefono',
            selector: row => row.id,
            sortable: true
        },
        {
            name: 'Domicilio',
            selector: row => row.id,
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
        <div>
            <div className='layoutP'>
                <h1>Proveedores</h1>
                <input type='search' />
                <input type='button' value="Buscar" />
                <Link to="/registroproveedor">
                    <button type="button">
                        Agregar Proveedor
                    </button>
                </Link>
            </div>
            <section>
                <DataTable
                    columns={columns}
                    data={data}
                    fixedHeader
                    pagination
                ></DataTable>
            </section>
        </div>
    )
}
