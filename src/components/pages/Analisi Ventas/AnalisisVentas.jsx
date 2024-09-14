import { Accordion, AccordionSummary } from '@mui/material'
import React from 'react'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, PolarAngleAxis, PolarGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import '../../../estilos/estilosAccordion.css'

const AnalisisVentas = () => {

const data1 = [
    {sku: 'CAB-1200-0012', ventas: 1999},
    {sku: '1224-5656', ventas: 1555},
    {sku: 'CUB-4505-1265', ventas: 1455},
    {sku: 'F107564874', ventas: 1875},
    {sku: 'VC10023564', ventas: 1777},
    {sku: 'CLU-4506-1232', ventas: 1669},
    {sku: 'VC40569878', ventas: 1298},
    {sku: '173-879878', ventas: 1111},
    {sku: 'MAJ-1123-4598', ventas: 1099},
    {sku: 'POS-1122-9878', ventas: 989},
]

const data2 = [
    {fecha: '2024-09-14', ventas: 1999},
    {fecha: '2024-09-13', ventas: 1555},
    {fecha: '2024-09-12', ventas: 1455},
    {fecha: '2024-09-11', ventas: 1875},
    {fecha: '2024-09-10', ventas: 1777},
    {fecha: '2024-09-09', ventas: 1669},
    {fecha: '2024-09-08', ventas: 1669},
]

const data3 = [
    {sku: 'CAB-1200-0012', fecha: '2024-09-14', ventas: 399},
    {sku: '1224-5656', fecha: '2024-09-13', ventas: 545},
    {sku: 'CUB-4505-1265', fecha: '2024-09-12', ventas: 410},
    {sku: 'F107564874', fecha: '2024-09-11', ventas: 189},
    {sku: 'VC10023564', fecha: '2024-09-10', ventas: 210},
    {sku: 'CLU-4506-1232', fecha: '2024-09-09', ventas: 666},
    {sku: 'VC40569878', fecha: '2024-09-08', ventas: 258},
]

const data4 = [
    {sku: 'CAB-1200-0012', mes: 'Enero', ventas: 4599},
    {sku: '1224-5656', mes: 'Febrero', ventas: 6879},
    {sku: 'CUB-4505-1265', mes: 'Marzo', ventas: 3988},
    {sku: 'F107564874', mes: 'Abril', ventas: 5579},
    {sku: 'VC10023564', mes: 'Mayo', ventas: 4598},
    {sku: 'CLU-4506-1232', mes: 'Junio', ventas: 4897},
    {sku: 'VC40569878', mes: 'Julio', ventas: 6874},
    {sku: 'DJ459878', mes: 'Agosto', ventas: 3958},
    {sku: '710089798797', mes: 'Septiembre', ventas: 3512},
    {sku: 'MAN-7898-1256', mes: 'Octubre', ventas: 2697},
    {sku: 'FAR-5698-7895', mes: 'Noviembre', ventas: 2654},
    {sku: 'LLA-1298-7898', mes: 'Diciembre', ventas: 1987},
]

const COLORS = [ '#1976d2', '#075658', '#38369c', '#7544b6', '#d459d8', '#e25d7a', '#4ba5a0', '#337c42ee', '#9ba736ee', '#4156ceee' ]

  return (
    <div className='accordionsContainer'>
        <div className='accordions'>
        <ResponsiveContainer width={700} aspect={2} className='grafic'>
        <Accordion sx={{ width: 700}}>
            <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
            >
                Top 10 Productos
            </AccordionSummary>
            <PieChart width={700} height={250}>
                <Pie 
                data={data1}
                dataKey='ventas'
                nameKey='sku'
                cx="50%" cy="50%"
                innerRadius={60}
                outerRadius={85}
                fill='#82ca9d'
                >   
                {data1.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]}/>
                ))}
                </Pie>
                <Tooltip />
            </PieChart>
        </Accordion>
        </ResponsiveContainer>
        <ResponsiveContainer width={700} aspect={2} className='grafic'>
        <Accordion sx={{ width: 700 }}>
            <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
            >
                Ventas en los ultimos 10 días
            </AccordionSummary>
            <LineChart 
            width={700}
            height={250}
            data={data2}
            margin={{ 
                top: 20,
                right: 20,
                left: 20,
                bottom: 5
             }}
            >
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis dataKey='fecha' />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type='monotone' dataKey='ventas' stroke='#6b48ff' />
            </LineChart>
        </Accordion>
        </ResponsiveContainer>
        <ResponsiveContainer width={700} aspect={2} className='grafic'>
        <Accordion sx={{ width: 700 }}>
            <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
            >
                Tendencia en venta individual
            </AccordionSummary>
            <LineChart 
            width={700}
            height={250}
            data={data3}
            margin={{ 
                top: 20,
                right: 20,
                left: 20,
                bottom: 5
             }}
            >
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis dataKey='fecha' />
                <YAxis dataKey='ventas'/>
                <Tooltip />
                <Legend />
                <Line type='monotone' dataKey='ventas' stroke='#1976d2' />
                <Line type='monotone' dataKey='sku' stroke='#1976d2' />
            </LineChart>
        </Accordion>
        </ResponsiveContainer>
        <ResponsiveContainer width={700} aspect={2} className='grafic'>
        <Accordion sx={{ width: 700 }}>
            <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
            >
                Ventas 2023
            </AccordionSummary>
            <BarChart 
            width={700}
            height={250}
            data={data4}
            margin={{ 
                top: 20,
                right: 20,
                left: 20,
                bottom: 5
             }}
            >
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis dataKey='mes' />
                <YAxis dataKey='ventas'/>
                <Tooltip />
                <Legend />
                <Bar dataKey='ventas' fill='#1976d2' />
                <Bar dataKey='sku' fill='#1976d2' />
            </BarChart>
        </Accordion>
        </ResponsiveContainer>
        </div>
        </div>
  )
}

export default AnalisisVentas