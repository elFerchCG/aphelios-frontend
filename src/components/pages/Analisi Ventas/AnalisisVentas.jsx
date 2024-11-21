import { Accordion, AccordionSummary, Button, Input, MenuItem, Select } from '@mui/material'
import React, { useEffect, useState } from 'react'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, RadialBar, RadialBarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import '../../../estilos/estilosAccordion.css'
import axios from 'axios';
import * as XLSX from 'xlsx';
import { DataGrid } from '@mui/x-data-grid';
import DatePicker from 'react-datepicker';


const formatFecha = (fecha) => {
    const date = new Date(fecha);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Los meses empiezan en 0
    const day = String(date.getDate() + 1).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const AnalisisVentas = () => {
    const [data, setData] = useState([]);
    const [data2, setData2] = useState([]);
    const [data3, setData3] = useState([]);
    const [data4, setData4] = useState([]);
    const [data5, setData5] = useState([]);
    const [rows, setRows] = useState([]);
    const [producto, setProducto] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [startDate1, setStartDate1] = useState('');
    const [endDate1, setEndDate1] = useState('');
    const [startDate2, setStartDate2] = useState('');
    const [endDate2, setEndDate2] = useState('');
    const [startDate3, setStartDate3] = useState('');
    const [endDate3, setEndDate3] = useState('');
    const [month, setMonth] = useState('');
    const [year1, setYear1] = useState('');
    const [year, setYear] = useState('');

    const apiUrl =
    process.env.NODE_ENV === 'production'
      ? process.env.REACT_APP_API_URL
      : process.env.REACT_APP_API_URL_LOCAL;

    useEffect(() => {
        const totalAnual = async () => {
            const yearData = {
                year: year
            }
            try {
                const response = await axios.post(`${apiUrl}/analisisGraficas/ventas/totalVentasAnual`, yearData);
                const result = response.data.map(item => ({
                    mes: item.mes,
                    año: item.año,
                    Ventas: parseFloat(item.total_ventas),
                }))
                setData(result);
                console.log("fomat data", result);
            } catch (error) {
                console.error("Error fetching data", error);
            }
        };
        if (year) {
            totalAnual();
        }
    }, [year]);

    useEffect(() => {
        const topProducts = async () => {
            const dates = {
                startDate: startDate,
                endDate: endDate,
            }
            try {
                const response = await axios.post(`${apiUrl}/analisisGraficas/ventas/topProductosSemana`, dates);
                const result = response.data.map(item => ({
                    producto_id: item.producto_id,
                    Ventas: parseFloat(item.total_ventas),
                }));
                setData2(result);
                console.log("Estas son las fechas que se mandan al endpoint: ", dates);
            } catch (error) {
                console.error("Error fetching data", error);
            }
        };
        if (startDate && endDate) {
            topProducts();
        }
    }, [startDate, endDate]);

    useEffect(() => {
        const fetchSelles = async () => {
            const dates = {
                startDate: startDate1,
                endDate: endDate1
            }
            try {
                const response = await axios.post(`${apiUrl}/analisisGraficas/ventas/ultimaSemana`, dates);
                // Verificar la respuesta completa del servidor
                console.log("Response data del servidor: ", response.data);
                const result = response.data.map(item => ({
                    fecha_venta: item.fecha_venta,
                    dia_semana: item.dia_semana,
                    Ventas: parseFloat(item.total_ventas),
                }));
                setData3(result);
                console.log("Estas son las fechas que se mandan al endpoint: ", dates);
            } catch (error) {
                console.error("Error fetching data", error);
            }
        };
        if (startDate1 && endDate1) {
            fetchSelles();
        }
    }, [startDate1, endDate1]);

    useEffect(() => {
        const tendenciaIndividual = async () => {
            const dates = {
                startDate: startDate2,
                endDate: endDate2
            }
            try {
                console.log("Producto seleccionado:", producto);
                const response = await axios.post(`${apiUrl}/analisisGraficas/ventas/tendenciaProducto/${producto}`, dates);
                const result = response.data.map(item => ({
                    fecha_venta: formatFecha(item.fecha_venta),
                    Ventas: parseFloat(item.total_ventas),
                }));
                setData4(result);
            } catch (error) {
                console.error("Error fetching data", error);
            }
        };
        if (startDate2 && endDate2) {
            tendenciaIndividual();
        }
    }, [startDate2, endDate2, producto]);

    useEffect(() => {
        const topProductosUnidades = async () => {
            const dates = {
                startDate: startDate3,
                endDate: endDate3
            }
            try {
                const response = await axios.post(`${apiUrl}/analisisGraficas/ventas/topProductosPorUnidades`, dates);
                console.log("Response data del servidor: ", response.data);
                const result = response.data.map(item => ({
                    producto_id: item.producto_id,
                    Ventas: item.total_unidades_vendidas,
                }));
                setData5(result);
                console.log("Estas son las fechas que se mandan al endpoint: ", dates);
            } catch (error) {
                console.error("Error fetching data", error);
            }
        };
        if (startDate3 && endDate3) {
            topProductosUnidades();
        }
    }, [startDate3, endDate3]);

    useEffect(() => {
        const productosABC = async () => {
            const dates = {
                month: month,
                year: year1,
            }
            try {
                const response = await axios.post(`${apiUrl}/analisisGraficas/ventas/clasificacionABC`, dates);
                const result = response.data.map(item => ({
                    producto_id: item.producto_id,
                    valor_total_ventas: item.valor_total_ventas,
                    porcentaje_acumulado: item.porcentaje_acumulado,
                    porcentaje_individual: item.porcentaje_individual,
                    tipo: item.tipo
                }));
                setRows(result);
            } catch (error) {
                console.log("Error fetching data", error);
            }
        };
        if (year1 && month) {
            productosABC();
        }
    }, [month, year1]);

    const exportToExcel = (data, filename = 'data.xlsx') => {
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Data');
        XLSX.writeFile(wb, filename);
    };

    const daysOfWeekOrder = {
        'Lunes': 1,
        'Martes': 2,
        'Miércoles': 3,
        'Jueves': 4,
        'Viernes': 5,
        'Sábado': 6,
        'Domingo': 7
    };

    // Ordenar data3 según los días de la semana
    const sortedData = data3.sort((a, b) => {
        return daysOfWeekOrder[a.dia_semana] - daysOfWeekOrder[b.dia_semana];
    });

    const COLORS = ['#1976d2', '#075658', '#38369c', '#7544b6', '#d459d8', '#e25d7a', '#4ba5a0', '#337c42ee', '#9ba736ee', '#4156ceee'];

    const columns = [
        { field: 'producto_id', headerName: 'MLM', type: 'text', flex: 1 },
        { field: 'valor_total_ventas', headerName: 'Ventas', type: 'number', flex: 1, valueFormatter: (value) => (value ? `$${value}` : '') },
        { field: 'porcentaje_acumulado', headerName: 'Porcentaje Acumulado', type: 'number', flex: 1, valueFormatter: (value) => (value ? `%${value}` : '') },
        { field: 'porcentaje_individual', headerName: 'Porcenta individual', type: 'number', flex: 1 },
        { field: 'tipo', headerName: 'Tipo', type: 'text', flex: 1 }
    ];


    return (
        <div className='titleAnalisis'>
            Recharts
            <div className='accordionsContainer'>
                <div className='accordions'>
                    <ResponsiveContainer width='auto' className='grafic'>
                        <Accordion sx={{ width: 'auto' }}>
                            <AccordionSummary
                                expandIcon={<ExpandMoreIcon />}
                            >
                                Top 10 Productos por unidades
                            </AccordionSummary>
                            {/* Select para elegir el producto a filtrar */}
                            <DatePicker
                                className='customDatePicker'
                                onChange={(date) => setStartDate3(date)}
                                selected={startDate3}
                                dateFormat="yyyy-MM-dd"
                                minDate={new Date(2023, 0, 1)}
                                maxDate={new Date()}
                                placeholderText='Fecha inicio'
                                portalId="root-portal"
                            />
                            <DatePicker
                                className='customDatePicker1'
                                onChange={(date) => setEndDate3(date)}
                                selected={endDate3}
                                dateFormat="yyyy-MM-dd"
                                minDate={new Date(2023, 0, 1)}
                                maxDate={new Date()}
                                placeholderText='Fecha fin'
                                portalId="root-portal"
                            />
                            <Button
                                variant='contained'
                                sx={{ marginLeft: 2 }}
                                onClick={() => exportToExcel(data5, 'Top_Productos_Unidades.xlsx')}>
                                Exportar datos a Excel
                            </Button>
                            <BarChart width={1300} height={600} data={data5} layout='vertical'>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number"
                                    domain={[0, 'dataMax']} 
                                     />
                                <YAxis type='category' dataKey="producto_id" tick={false} />
                                <Tooltip formatter={(value) => [`Unidades vendidas: ${value}`, null]} />
                                <Bar dataKey="Ventas" fill='#1e88e5' maxBarSize={50}>
                                </Bar>
                            </BarChart>
                        </Accordion>
                    </ResponsiveContainer>
                    <ResponsiveContainer width="auto" className='grafic'>
                        <Accordion sx={{ width: 'auto' }}>
                            <AccordionSummary
                                expandIcon={<ExpandMoreIcon />}
                            >
                                Ventas por semana
                            </AccordionSummary>
                            <DatePicker
                                className='customDatePicker'
                                onChange={(date) => setStartDate1(date)}
                                selected={startDate1}
                                dateFormat="yyyy-MM-dd"
                                minDate={new Date(2023, 0, 1)}
                                maxDate={new Date()}
                                placeholderText='Fecha inicio'
                                portalId="root-portal"
                            />
                            <DatePicker
                                className='customDatePicker1'
                                onChange={(date) => setEndDate1(date)}
                                selected={endDate1}
                                dateFormat="yyyy-MM-dd"
                                minDate={new Date(2023, 0, 1)}
                                maxDate={new Date()}
                                placeholderText='Fecha fin'
                                portalId="root-portal"
                            />
                            <Button
                                variant='contained'
                                sx={{ marginLeft: 2 }}
                                onClick={() => exportToExcel(sortedData, 'Ventas_en_semana.xlsx')}>
                                Exportar datos a Excel
                            </Button>
                            <LineChart
                                width={1300}
                                height={600}
                                cx="50%" cy="50%"
                                data={sortedData}
                            >
                                <CartesianGrid strokeDasharray='3 3' />
                                <XAxis dataKey='dia_semana' />
                                <YAxis tickFormatter={(value) =>
                                    new Intl.NumberFormat('es-MX', {
                                        style: 'currency',
                                        currency: 'MXN',
                                        notation: value >= 1000 ? 'compact' : 'standard', // Muestra $123K para valores grandes
                                        compactDisplay: 'short'
                                    }).format(value)
                                } />
                                <Tooltip formatter={(value) =>
                                    new Intl.NumberFormat('es-MX', {
                                        style: 'currency',
                                        currency: 'MXN'
                                    }).format(value)
                                } />
                                <Line type='monotone' dataKey='Ventas' stroke='#6b48ff' activeDot={{ r: 8 }} />
                            </LineChart>
                        </Accordion>
                    </ResponsiveContainer>
                    <ResponsiveContainer width='auto' className='grafic'>
                        <Accordion sx={{ width: 'auto' }}>
                            <AccordionSummary
                                expandIcon={<ExpandMoreIcon />}
                            >
                                Tendencia en venta individual
                            </AccordionSummary>
                            <Input
                                type='text'
                                onChange={(e) => setProducto(e.target.value)}
                                value={producto}
                                placeholder='Ingrese el producto'
                                sx={{ marginRight: 2 }}
                            />
                            <DatePicker
                                className='customDatePicker'
                                onChange={(date) => setStartDate2(date)}
                                selected={startDate2}
                                dateFormat="yyyy-MM-dd"
                                minDate={new Date(2023, 0, 1)}
                                maxDate={new Date()}
                                placeholderText='Fecha inicio'
                                portalId="root-portal"
                            />
                            <DatePicker
                                className='customDatePicker1'
                                onChange={(date) => setEndDate2(date)}
                                selected={endDate2}
                                dateFormat="yyyy-MM-dd"
                                minDate={new Date(2023, 0, 1)}
                                maxDate={new Date()}
                                placeholderText='Fecha fin'
                                portalId="root-portal"
                            />
                            <Button
                                variant='contained'
                                sx={{ marginLeft: 2 }}
                                onClick={() => exportToExcel(data4, 'Tendencia_venta_individual.xlsx')}>
                                Exportar datos a Excel
                            </Button>
                            <LineChart
                                width={1300}
                                height={600}
                                cx="50%" cy="50%"
                                data={data4}
                                margin={{
                                    top: 20,
                                    right: 20,
                                    left: 20,
                                    bottom: 5
                                }}
                            >
                                <CartesianGrid strokeDasharray='3 3' />
                                <XAxis dataKey='fecha_venta' />
                                <YAxis />
                                <Tooltip formatter={(value) => [`${producto} - $${value}`, null]} />
                                <Legend />
                                <Line type='monotone' dataKey='Ventas' stroke='#1976d2' activeDot={{ r: 8 }} />
                            </LineChart>
                        </Accordion>
                    </ResponsiveContainer>
                    <ResponsiveContainer width="auto" className='grafic'>
                        <Accordion sx={{ width: 'auto' }}>
                            <AccordionSummary
                                expandIcon={<ExpandMoreIcon />}
                            >
                                Ventas por año
                            </AccordionSummary>
                            <Select
                                value={year}
                                onChange={(e) => setYear(e.target.value)}
                                displayEmpty
                                inputProps={{ 'aria-label': 'Seleccione el año' }}
                                sx={{ marginRight: 2 }}
                            >
                                <MenuItem value="" disabled>
                                    Seleccione el año
                                </MenuItem>
                                <MenuItem key={2024} value={2024}>
                                    2024
                                </MenuItem>

                            </Select>
                            <Button
                                variant='contained'
                                onClick={() => exportToExcel(data, 'Total_ventas_año.xlsx')}>
                                Exportar datos a Excel
                            </Button>
                            <BarChart
                                width={1300}
                                height={600}
                                data={data}
                                cx="50%" cy="50%"
                                margin={{
                                    top: 20,
                                    right: 20,
                                    left: 20,
                                    bottom: 5
                                }}
                            >
                                <CartesianGrid strokeDasharray='3 3' />
                                <XAxis dataKey='mes' />
                                <Tooltip formatter={(value) => `$${value}`} />
                                <Legend />
                                <Bar dataKey='Ventas' fill='#1976d2' maxBarSize={50} />
                            </BarChart>
                        </Accordion>
                    </ResponsiveContainer>
                    <ResponsiveContainer width="auto" className='grafic'>
                        <Accordion sx={{ width: 'auto' }}>
                            <AccordionSummary
                                expandIcon={<ExpandMoreIcon />}
                            >
                                Top Productos por dinero
                            </AccordionSummary>
                            <DatePicker
                                className='customDatePicker'
                                onChange={(date) => setStartDate(date)}
                                selected={startDate}
                                dateFormat="yyyy-MM-dd"
                                minDate={new Date(2023, 0, 1)}
                                maxDate={new Date()}
                                placeholderText='Fecha inicio'
                                portalId="root-portal"
                            />
                            <DatePicker
                                className='customDatePicker1'
                                onChange={(date) => setEndDate(date)}
                                selected={endDate}
                                dateFormat="yyyy-MM-dd"
                                minDate={new Date(2023, 0, 1)}
                                maxDate={new Date()}
                                placeholderText='Fecha fin'
                                portalId="root-portal"
                            />
                            <Button
                                variant='contained'
                                sx={{ marginLeft: 2 }}
                                onClick={() => exportToExcel(data2, 'Top_productos_dinero.xlsx')}>
                                Exportar datos a Excel
                            </Button>
                            <PieChart
                                width={1300}
                                height={600}
                                data={data2}
                                cx="50%" cy="50%"
                                margin={{
                                    top: 20,
                                    right: 20,
                                    left: 20,
                                    bottom: 5
                                }}
                            >
                                <Pie data={data2} dataKey="Ventas" nameKey="producto_id" cx="50%" cy="50%" innerRadius={120} outerRadius={140} fill="#82ca9d" label>
                                    {
                                        data2.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[Math.floor(Math.random() * COLORS.length)]} />
                                        ))
                                    }
                                </Pie>
                                <Tooltip formatter={(value) => `$${value}`} />
                            </PieChart>
                        </Accordion>
                    </ResponsiveContainer>
                    <ResponsiveContainer width="auto" className='grafic'>
                        <Accordion sx={{ width: 'auto' }}>
                            <AccordionSummary
                                expandIcon={<ExpandMoreIcon />}
                            >
                                Productos ABC
                            </AccordionSummary>
                            <Select
                                value={year1}
                                onChange={(e) => setYear1(e.target.value)}
                                displayEmpty
                                inputProps={{ 'aria-label': 'Seleccione el año' }}
                                sx={{ marginRight: 2 }}
                            >
                                <MenuItem value="" disabled>
                                    Seleccione el año
                                </MenuItem>
                                <MenuItem key={2024} value={2024}>
                                    2024
                                </MenuItem>
                            </Select>
                            <Select
                                value={month}
                                onChange={(e) => setMonth(e.target.value)}
                                displayEmpty
                                inputProps={{ 'aria-label': 'Seleccione el mes' }}
                                sx={{ marginRight: 2 }}
                            >
                                <MenuItem value="" disabled>
                                    Seleccione el mes
                                </MenuItem>
                                <MenuItem value={6}>Junio</MenuItem>
                                <MenuItem value={7}>Julio</MenuItem>
                                <MenuItem value={8}>Agosto</MenuItem>
                                <MenuItem value={9}>Septiembre</MenuItem>
                                <MenuItem value={10}>Octubre</MenuItem>
                            </Select>
                            <DataGrid style={{ width: 1300, height: 600 }}
                                rows={rows}
                                columns={columns}
                                getRowId={(row) => row.producto_id}
                                pageSize={5}
                                showCellVerticalBorder
                                showColumnVerticalBorder
                            />
                        </Accordion>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    )
}

export default AnalisisVentas