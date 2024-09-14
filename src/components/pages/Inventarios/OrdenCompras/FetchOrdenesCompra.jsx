import React, { useEffect, useState } from 'react'
import { Button, Modal, Box } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import axios from 'axios';
import { formatISO } from 'date-fns';

const FetchOrdenesCompra = ({ selectedOrder, openModal, setOpenModal }) => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [estatusFilter, setEstatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const handleCloseModal = () => {
    setSearchTerm('');
    setOpenModal(false);
  };

  useEffect(() => {
    if (openModal) {
      const fetchOrders = async () => {
        const token = localStorage.getItem('token');
        try {
          const response = await axios.get(`http://localhost:3304/ordenesCompras/ordenesCompra`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (response.data.ok) {
            const formattedData = response.data.ordenes.map(row => {
              return {
                ...row,
                fecha_creacion: formatISO(new Date(row.fecha_creacion), { representation: 'date' })
              };
            });
            setOrders(formattedData);
            setFilteredOrders(formattedData);
          }
        } catch (error) {
          console.error("Error al obtener las órdenes", error);
          alert('No hay ordenes registradas');
        }
      };
      fetchOrders();
    }
  }, [openModal]);

  useEffect(() => {
    // Filtra las órdenes en base al término de búsqueda y otros filtros
    let filtered = orders;

    // Aplica el filtro de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.idOrden.toString().includes(searchTerm) ||
        order.estatus.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.fecha_creacion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.categoria.toLowerCase().includes(searchTerm.toLocaleLowerCase())
      );
    }

    // Aplica el filtro de estatus
    if (estatusFilter) {
      filtered = filtered.filter(order => order.estatus === estatusFilter);
    }

    // Aplica el filtro de fechas
    if (startDate && endDate) {
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.fecha_creacion);
        return orderDate >= new Date(startDate) && orderDate <= new Date(endDate);
      });
    }

    setFilteredOrders(filtered);
  }, [searchTerm, estatusFilter, startDate, endDate, orders]);

  const handleRowClick = (params) => {
    const selectedOrderId = params.row.idOrden;
    if (typeof selectedOrder === 'function') {
      selectedOrder(selectedOrderId);
    } else {
      console.error('selectedOrder no es una función');
    }
    handleCloseModal();
  };

  const handleFilterChange = (e) => {
    setEstatusFilter(e.target.value);
  };

  const resetFilter = () => {
    setSearchTerm(''); // Limpiar el input de búsqueda
    setStartDate(''); // Vaciar la fecha de inicio
    setEndDate(''); // Vaciar la fecha de fin
    setEstatusFilter(''); // Volver al valor predeterminado en el select
    setFilteredOrders(orders); // Restablecer los resultados filtrados a todas las órdenes
  };

  const columns = [
    { field: 'idOrden', headerName: 'Folio', width: 90 },
    { field: 'descripcion', headerName: 'Descripción', width: 300 },
    { field: 'estatus', headerName: 'Estatus', width: 150 },
    { field: 'categoria', headerName: 'Tipo de Movimiento', width: 200 },
    { field: 'fecha_creacion', headerName: 'Fecha', width: 200 }
  ];

  return (
    <div>
      <Modal
        open={openModal}
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
        <Box sx={{
          width: 1200, height: 600,
          bgcolor: 'background.paper',
          padding: 2, margin: 'auto',
          marginTop: '5%', borderRadius: '40px',
          fontFamily: "Montserrat",
        }}>
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
            <Button variant="contained" onClick={resetFilter}>
              Limpiar filtros
            </Button>
          </div>
          <input
            type='text'
            placeholder='Buscar ordenes'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <h2 id="modal-title">Órdenes Disponibles</h2>
          <DataGrid style={{ height: 400, width: 'auto', fontFamily: "Montserrat", fontWeight: "bold" }}
            rows={filteredOrders}
            columns={columns}
            pageSize={5}
            showCellVerticalBorder
            showColumnVerticalBorder
            onRowClick={handleRowClick}
            getRowId={(row) => row.idOrden} // Utiliza idOrden como el id único
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
  )
}

export default FetchOrdenesCompra