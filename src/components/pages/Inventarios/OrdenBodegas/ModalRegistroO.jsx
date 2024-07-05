import * as React from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import axios from 'axios';
import Swal from 'sweetalert2';
import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import { format } from 'date-fns';


const ModalRegistroO = ({ openModalRegistroO, setOpenModalRegistroO }) => {

  const estadoInicial = {
    fecha: "",
    tipo_transaccion_id: 0,
    localidad_salida_id: 0,
    localidad_entrada_id: 0,
    estatus: "",

  };

  const [data, setData] = React.useState(estadoInicial);
  const [lineas, setLineas] = React.useState([{ producto_id: "", cantidad: 0, confirmacion_salida: false, confirmacion_entrada: false }]);

  const handleClose = () => {
    setOpenModalRegistroO(false);
  };


  const handleChange = (e) => {
    const { name, value } = e.target;
    setData((prevState) => ({
      ...prevState,
      [name]: name === 'fecha' ? format(new Date(value), 'YYYY-MM-DD') : value,
    }));
  };

  const handleLineaChange = (index, e) => {
    const { name, value, type, checked } = e.target;
    const newLineas = [...lineas];
    newLineas[index][name] = type === 'checkbox' ? checked : value;
    setLineas(newLineas);
  };


  const handleSubmit = async (e) => {
    try {
      e.preventDefault();
      console.log(data);
      const response = await axios.post("http://localhost:3304/inventario/ordenBodegas", {
        fecha: data.fecha,
        tipo_transaccion_id: data.tipo_transaccion_id,
        localidad_salida_id: data.localidad_salida_id,
        localidad_entrada_id: data.localidad_entrada_id,
        estatus: data.estatus,
        lineas: lineas
      });
      setData(estadoInicial);
      setLineas([{ producto_id: "", cantidad: 0, confirmacion_salida: false, confirmacion_entrada: false }]);
      //Mostrar alerta exito
      Swal.fire({
        title: 'Éxito!',
        text: 'Se registro con exito la orden!!!',
        icon: 'success'
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Hubo un error al registrar la orden"
      });
    }
    handleClose();
  };

  const handleReset = () => {
    setData(estadoInicial);
    setLineas([{ producto_id: "", cantidad: 0, confirmacion_salida: false, confirmacion_entrada: false }]);
  };

  const agregarLinea = () => {
    setLineas([...lineas, { producto_id: "", cantidad: 0, confirmacion_salida: false, confirmacion_entrada: false }]);
  };

  const handleButtonClick = () => {

    console.log("Botón clickeado!");
  };



  return (
    <Dialog
      open={openModalRegistroO}
      onClose={handleClose}
    >
      <DialogTitle>Registrar Orden de bodega</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Llena todos los campos requeridos para agregar una nueva orden de bodega a la base de datos
        </DialogContentText>
        <form onSubmit={handleSubmit}>
          <TextField
            autoFocus
            required
            margin="dense"
            id="fecha"
            name="fecha"
            type="Date"
            fullWidth
            variant="standard"
            value={data.fecha}
            onChange={handleChange}
            InputLabelProps={{
              shrink: true,
            }}
          />
          <TextField
            required
            margin="dense"
            id="tipo_transaccion_id"
            name="tipo_transaccion_id"
            label="Tipo de transacción"
            fullWidth
            variant="standard"
            value={data.tipo_transaccion_id}
            onChange={handleChange}

          />
          <TextField
            required
            margin="dense"
            id="localidad_salida_id"
            name="localidad_salida_id"
            label="Localidad de salida"
            fullWidth
            variant="standard"
            value={data.localidad_salida_id}
            onChange={handleChange}
          />
          <TextField
            required
            margin="dense"
            id="localidad_entrada_id"
            name="localidad_entrada_id"
            label="Localidad de entrada"
            fullWidth
            variant="standard"
            value={data.localidad_entrada_id}
            onChange={handleChange}
          />
          <FormControl fullWidth margin='dense' variant='standard'>
            <InputLabel id="estatus-label">Estado</InputLabel>
            <Select
              labelId="estatus-label"
              id="estatus"
              name="estatus"
              value={data.estatus}
              onChange={handleChange}
            >
              <MenuItem value="Activo">Activo</MenuItem>
              <MenuItem value="Inactivo">Inactivo</MenuItem>
            </Select>
          </FormControl>
          <h3>Lineas</h3>
          {lineas.map((linea, index) => (
            <div key={index} className='linea'>
              <TextField
                required
                margin="dense"
                id={`producto_id-${index}`}
                name="producto_id"
                label="Producto"
                fullWidth
                variant="standard"
                value={linea.producto_id}
                onChange={(e) => handleLineaChange(index, e)}
              />
              <TextField
                required
                margin="dense"
                id={`cantidad-${index}`}
                name="cantidad"
                label="Cantidad"
                fullWidth
                variant="standard"
                type="number"
                value={linea.cantidad}
                onChange={(e) => handleLineaChange(index, e)}
              />
              <FormControl fullWidth margin='dense' variant='standard'>
                <InputLabel id={`confirmacion_salida-label-${index}`}>Confirmación Salida</InputLabel>
                <Select
                  labelId={`confirmacion_salida-label-${index}`}
                  id={`confirmacion_salida-${index}`}
                  name="confirmacion_salida"
                  value={linea.confirmacion_salida}
                  onChange={(e) => handleLineaChange(index, e)}
                >
                  <MenuItem value={true}>Sí</MenuItem>
                  <MenuItem value={false}>No</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth margin='dense' variant='standard'>
                <InputLabel id={`confirmacion_entrada-label-${index}`}>Confirmación Entrada</InputLabel>
                <Select
                  labelId={`confirmacion_entrada-label-${index}`}
                  id={`confirmacion_entrada-${index}`}
                  name="confirmacion_entrada"
                  value={linea.confirmacion_entrada}
                  onChange={(e) => handleLineaChange(index, e)}
                >
                  <MenuItem value={true}>Sí</MenuItem>
                  <MenuItem value={false}>No</MenuItem>
                </Select>
              </FormControl>
            </div>
          ))}
          <DialogActions>
            <Button onClick={agregarLinea}>Agregar Linea</Button>
            <Button onClick={handleReset}>Borrar</Button>
            <Button onClick={() => setOpenModalRegistroO(false)}>Cancelar</Button>
            <Button type='submit'>Guardar</Button>
          </DialogActions>
        </form>
      </DialogContent>

    </Dialog>
  );
};

export default ModalRegistroO;