import React, { useEffect, useState } from 'react'
import { Button, Modal, Box, Select, MenuItem, TextField } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import axios from 'axios';
import { formatISO } from 'date-fns';
import DatePicker from 'react-datepicker';

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
    if (estatusFilter !== "") {
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
    { field: 'idOrden', headerName: 'Folio', flex: 1 },
    { field: 'descripcion', headerName: 'Descripción', flex: 3 },
    { field: 'estatus', headerName: 'Estatus', flex: 1 },
    { field: 'categoria', headerName: 'Tipo de Movimiento', flex: 1 },
    { field: 'fecha_creacion', headerName: 'Fecha', flex: 1 }
  ];

  return (
    <div>
      <Modal
        open={openModal}
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
        <Box sx={{
          width: 1200, height: 650,
          bgcolor: 'background.paper',
          padding: 2, margin: 'auto',
          marginTop: '30px', borderRadius: '20px',
          fontFamily: "Montserrat",
        }}>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '10px' }}>
            <Select
              value={estatusFilter}
              onChange={handleFilterChange}
              displayEmpty
              sx={{ width: "200px", height: "41px", padding: "8px", borderRadius: "8px" }}
            >
              <MenuItem value="">Todas las ordenes</MenuItem>
              <MenuItem value="abierto">Ordenes Abiertas</MenuItem>
              <MenuItem value="confirmado">Ordenes Confirmadas</MenuItem>
              <MenuItem value="procesado">Ordenes Procesadas</MenuItem>
            </Select>
            <DatePicker
              selected={startDate}
              onChange={(date) => setStartDate(date)}
              dateFormat="yyyy-MM-dd"
              minDate={new Date(2024, 0, 1)}
              maxDate={new Date()}
              placeholderText='fecha inicio'
              className="custom-datepicker"
            />
            <DatePicker
              selected={endDate}
              onChange={(date) => setEndDate(date)}
              dateFormat="yyyy-MM-dd"
              minDate={new Date(2024, 0, 1)}
              maxDate={new Date()}
              placeholderText='fecha fin'
              className="custom-datepicker"
            />
            <Button variant="contained" onClick={resetFilter}>
              Limpiar filtros
            </Button>
          </div>
          <TextField
            variant='standard'
            type='text'
            label='Buscar ordenes'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{
              width: "300px"
            }}
          />
          <h2 id="modal-title">Órdenes Disponibles</h2>
          <DataGrid style={{ height: 400, width: 'auto', fontFamily: "Montserrat", fontWeight: "bold" }}
            rows={filteredOrders}
            columns={columns}
            sortModel={[
              {
                  field: 'idOrden',
                  sort: 'desc'
              }
          ]}
            pageSize={5}
            showCellVerticalBorder
            showColumnVerticalBorder
            onRowClick={handleRowClick}
            getRowId={(row) => row.idOrden} // Utiliza idOrden como el id único
            experimentalFeatures={{ newEditingApi: true }}
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