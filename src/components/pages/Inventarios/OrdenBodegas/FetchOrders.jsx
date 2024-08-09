import React, { useEffect, useState } from 'react';
import { Button, Modal, Box } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import axios from 'axios';
import { formatISO } from 'date-fns';

const BuscarOrdenes = ({ selectedOrder, setSelectedOrder, openModal, setOpenModal }) => {
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [estatusFilter, setEstatusFilter] = useState('');

    const handleCloseModal = () => {
        setOpenModal(false);
    };

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const response = await axios.get(`http://localhost:3304/inventario/ordenBodegas_y_lineasBodegas/`);
                if (response.data.ok) {
                    const formattedData = response.data.data.map(row => ({
                        ...row,
                        fecha_abierto: formatISO(new Date(row.fecha_abierto), { representation: 'date' })
                    }))
                    setOrders(formattedData);
                    setFilteredOrders(formattedData);
                    console.log("Órdenes obtenidas:", response.data.data);
                }
            } catch (error) {
                console.error("Error al obtener las órdenes", error);
                alert('Ocurrió un error al obtener las órdenes');
            }
        };
        fetchOrders();
    }, []);


    const handleRowClick = (params) => {
        const selectedOrderId = params.row.id;
        if (typeof selectedOrder === 'function') {
            selectedOrder(selectedOrderId);
        } else {
            console.error('onSelectOrder is not a function');
        }
        handleCloseModal();
    };

    const handleFilterChange = (e) => {
        const estatus = e.target.value;
        setEstatusFilter(estatus);

        if (estatus === "") {
            // Si se selecciona "Todos los estatus", muestra todas las órdenes
            setFilteredOrders(orders);
        } else {
            // Filtra por estatus
            const filtered = orders.filter(order => order.estatus === estatus);
            setFilteredOrders(filtered);
        }
    }

    const handleDateFilterChange = () => {
        if (startDate && endDate) {
            const filtered = orders.filter(order => {
                const orderDate = new Date(order.fecha_abierto);
                return orderDate >= new Date(startDate) && orderDate <= new Date(endDate);
            });
            setFilteredOrders(filtered);
        }
    };

    const columns = [
        { field: 'id', headerName: 'ID', width: 90 },
        { field: 'descripcion', headerName: 'Descripción', width: 300 },
        { field: 'estatus', headerName: 'Estatus', width: 150 },
        { field: 'fecha_abierto', headerName: 'Fecha', width: 200 },
        // { field: 'actions', 
        //   headerName: 'Acciones', 
        //   type: 'actions', 
        //   width: 150,
        //   getActions: (params) => {

        //   }


        // }
        // Agrega más columnas según tus necesidades
    ];

    return (
        <div>
            <Modal
                open={openModal}
                aria-labelledby="modal-title"
                aria-describedby="modal-description"
            >
                <Box sx={{ width: 1200, height: 600, bgcolor: 'background.paper', padding: 2, margin: 'auto', marginTop: '5%' }}>
                    <div style={{ display: 'flex', gap: '16px', margin: '16px 0' }}>
                        <select value={estatusFilter} onChange={handleFilterChange}>
                            <option value="">Todas las ordenes</option>
                            <option value="abierto">Ordenes Abiertas</option>
                            <option value="confirmado">Ordenes Confirmadas</option>
                            <option value="procesado">Ordenes Procesadas</option>
                        </select>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                        <Button variant="contained" onClick={handleDateFilterChange}>
                            Filtrar
                        </Button>
                    </div>
                    <h2 id="modal-title">Órdenes Disponibles</h2>
                    <DataGrid style={{ height: 400, width: 1000 }}
                        rows={filteredOrders}
                        columns={columns}
                        pageSize={5}
                        showCellVerticalBorder
                        showColumnVerticalBorder
                        onRowClick={handleRowClick}
                        experimentalFeatures={{ newEditingApi: true }}
                        columnVisibilityModel={{
                            id: true,
                        }}
                    />
                    <Button sx={{ marginTop: '10px', marginLeft: '92%' }}
                        variant="contained"
                        onClick={handleCloseModal}>
                        Cerrar
                    </Button>
                </Box>
            </Modal>
        </div>
    );
};

export default BuscarOrdenes;
