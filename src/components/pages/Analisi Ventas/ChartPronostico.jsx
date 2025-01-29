import { Box } from '@mui/material';
import React from 'react'
import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const ChartPronostico = () => {

    const data = [
        {
            "producto": "producto A",
            "semana": "enero",
            "ventas": 5,
            "pronostico": 8,
            "pendiente": 2,
        },
        {
            "producto": "producto B",
            "semana": "febrero",
            "ventas": 3,
            "pronostico": 4,
            "pendiente": 1,
        },
        {
            "producto": "producto C",
            "semana": "marzo",
            "ventas": 5,
            "pronostico": 8,
            "pendiente": 2,
        },
        {
            "producto": "producto D",
            "semana": "abril",
            "ventas": 5,
            "pronostico": 8,
            "pendiente": 3,
        },
        {
            "producto": "producto E",
            "semana": "mayo",
            "ventas": 5,
            "pronostico": 8,
            "pendiente": 3,
        },
        {
            "producto": "producto F",
            "semana": "junio",
            "ventas": 5,
            "pronostico": 8,
            "pendiente": 3,
        },
        {
            "producto": "producto G",
            "semana": "julio",
            "ventas": 5,
            "pronostico": 8,
            "pendiente": 5,
        },
        {
            "producto": "producto H",
            "semana": "agosto",
            "ventas": 5,
            "pronostico": 8,
            "pendiente": 6,
        },
        {
            "producto": "producto I",
            "semana": "septiembre",
            "ventas": 5,
            "pronostico": 8,
            "pendiente": 4,
        },
        {
            "producto": "producto J",
            "semana": "octubre",
            "ventas": 5,
            "pronostico": 8,
            "pendiente": 2,
        },
        {
            "producto": "producto K",
            "semana": "noviembre",
            "ventas": 5,
            "pronostico": 8,
            "pendiente": -3,
        },
        {
            "producto": "producto L",
            "semana": "diciembre",
            "ventas": 5,
            "pronostico": 8,
            "pendiente": -5,
        }
    ]

    // Altura base + incremento por cada elemento
    const baseHeight = 100;
    const rowHeight = 30;
    const chartHeight = baseHeight + data.length * rowHeight;

    return (
        <Box style={{
            width: '100%',
            maxWidth: "1200px",
            height: chartHeight,
            margin: "50px auto",
            backgroundColor: "rgb(237, 237, 237)",
            padding: '16px',
            border: "1px solid #ccc",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            borderRadius: "8px",
            boxShadow: "0px 0px 15px rgba(0, 0, 0, 0.5)",
        }}>
            <h3 style={{ textAlign: 'center' }}>Hooooy</h3>
            <ResponsiveContainer width="100%" height="80%" style={{ marginLeft: 0 }}>
                <ComposedChart data={data}>
                    <XAxis dataKey="semana" />
                    <YAxis
                        dataKey="ventas"
                        domain={[0, (dataMax) => Math.ceil(dataMax / 10) * 10]} // Comienza en 0 y redondea hacia arriba
                        tickCount={6}
                        label={{ value: "Unidades", angle: 270, position: "left", textAnchor: 'middle' }}
                    />
                    <Tooltip />
                    <Legend />
                    <CartesianGrid stroke='rgb(187, 187, 187)' />
                    <Bar dataKey="ventas" barSize={20} fill='#413ea0' />
                    <Bar dataKey="pronostico" barSize={20} fill='#8884d8' />
                    <Line type="monotone" dataKey="pendiente" stroke="#ff7300" />
                </ComposedChart>
            </ResponsiveContainer>
        </Box>
    )
}

export default ChartPronostico