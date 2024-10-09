import React, { useState } from 'react'
import '../../../../estilos/barraAcciones.css';
import addOrder from '../../../../images/addOrder.png';
import searchOrden from '../../../../images/search.png';
import processOrden from '../../../../images/process.png';
import { DataGrid } from '@mui/x-data-grid';
import { Checkbox } from '@mui/material';

const formatFecha = (fecha) => {
    const date = new Date(fecha);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Los meses empiezan en 0
    const day = String(date.getDate() + 1).padStart(2, '0');
    return `${year}-${month}-${day}`;
};


const ConteoCiclico = () => {

    const handleCheckboxChange = (event, row) => {
        const isChecked = event.target.checked;
        // Aquí puedes manejar el cambio del estado del checkbox para esa fila
        console.log(`Checkbox for row ${row.id} is ${isChecked ? 'checked' : 'unchecked'}`);
    };

    const columns = [
        { field: 'producto_id', headerName: 'MLM', type: 'text', flex: 3 },
        { field: 'clasificacion', headerName: 'Clasificación', type: 'text', flex: 1 },
        { field: 'localidad_id', headerName: 'Ubicación', type: 'text', flex: 1, headerAlign: 'center' },
        { field: 'cantidad', headerName: 'Cantidad', type: 'number', flex: 1, headerAlign: 'center' },
        {
            field: 'fecha_conteo',
            headerName: 'Fecha conteo',
            type: 'Date',
            editable: true,
            cellClassName: 'celdaEditable',
            flex: 1,
            headerAlign: 'center',
            // renderEditCell: (params) => {
            //     // Obtener la fecha sin convertirla a UTC
            //     const formatFecha = (fecha) => {
            //         const date = new Date(fecha);
            //         const year = date.getFullYear();
            //         const month = String(date.getMonth()).padStart(2, '0'); // Los meses empiezan en 0
            //         const day = String(date.getDate()).padStart(2, '0');
            //         return `${year}-${month}-${day}`;
            //     };
            //     return (
            //         <TextField
            //             type="date"
            //             value={params.value ? formatFecha(params.value) : ''}
            //             onChange={(e) => {
            //                 // Mantener la fecha seleccionada sin alterarla
            //                 params.api.setEditCellValue({ id: params.id, field: 'fecha_back', value: e.target.value });
            //             }}
            //             fullWidth
            //         />
            //     )
            // }
        },
        {
            field: 'actions', headerName: 'Acciones', type: 'actions', flex: 1,
            renderCell: (params) => (
                <Checkbox
                    checked={params.row.checked || false} // Controlar el estado del checkbox
                    onChange={(e) => handleCheckboxChange(e, params.row)} // Manejador de eventos
                />
            )
        }
    ]

    return (
        <div>
            <div className='gestorOrdenes'>
                <div className='left-actions'>
                    <div className="action-item"
                        style={{ cursor: 'pointer' }}
                    >
                        <img src={addOrder} alt="Orden Nueva" className="action-icon" />
                        <span>Orden Nueva</span>
                    </div>
                    <div className="action-item"
                        style={{ cursor: 'pointer' }}
                    >
                        <img src={searchOrden} alt="Buscar Orden" className="action-icon" />
                        <span>Buscar Orden</span>
                    </div>
                </div>
                <div className="right-actions">
                    <div className="action-item"
                    // style={{ opacity: enableProcess ? 1 : 0.5, cursor: enableProcess ? 'pointer' : 'not-allowed' }}
                    >
                        <img src={processOrden} alt="Procesar Orden" className="action-icon" />
                        <span>Procesar Orden</span>
                    </div>
                </div>
            </div>
            <div className='container'>
                <label className='item1'>Orden:</label>
                <input className='item2'
                    // value={idOrder}
                    readOnly></input>
                <label className='status'>Estatus:</label>
                <input className='statusValue'
                    //value={estatus}
                    readOnly></input>
                <label className='descripcion'>Descripción:</label>
                <input className='input-descr'
                // disabled={!habilitarTraspaso}
                // value={descripcion}
                // ref={descripcionRef}
                // onKeyDown={handleKeyDown2}
                // onBlur={handleBlur2}
                //</div>onChange={(e) => setDescripcion(e.target.value)}
                ></input>
                <label className='item5' >Tipo de movimiento:</label>
                <select
                    className='item6'
                // value={selectedTraspasoId}
                // onChange={handleSelectedTraspasoChange}
                // disabled={!habilitarTraspaso}
                >
                    <option value="">Seleccione...</option>
                    {/* {traspasos.map((traspaso) => (
                        <option key={traspaso.id} value={traspaso.id}>
                            {`${traspaso.descripcion} : ${traspaso.categoria}`}
                        </option>
                    ))} */}
                </select>
                <label className='item3'>Ubicación de entrada:</label>
                <select className='item4'
                // value={selectedBodegaEntrada}
                // disabled={!bodegaEntradaHabilitada}
                // onChange={handleSelectBodegaEntrada}
                // ref={bodegaEntradaRef}
                >
                    <option value="">Seleccione...</option>
                    {/* {bodegaEntrada.map((bodega) => (
                        <option key={bodega.id} value={bodega.id}>
                            {bodega.Nombre}
                        </option>
                    ))} */}
                </select>
            </div>
            <div className='DataG' style={{ width: 'auto', height: 500 }}>
                <DataGrid style={{ fontFamily: 'Montserrat', fontWeight: 'bold' }}
                    // rows={rows}
                    columns={columns}
                    pageSize={5}
                    showCellVerticalBorder
                    showColumnVerticalBorder
                // getRowId={(row) => row.id}
                />
            </div>
        </div>
    )
}

export default ConteoCiclico;