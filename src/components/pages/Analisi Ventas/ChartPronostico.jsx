import { Box } from '@mui/material';
import React from 'react';
import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const ChartPronostico = () => {
    const data = [
        { "semana": "enero", "ventas": 5, "pronostico": 8, "pendiente": 2 },
        { "semana": "febrero", "ventas": 3, "pronostico": 4, "pendiente": 1 },
        { "semana": "marzo", "ventas": 5, "pronostico": 8, "pendiente": 2 },
        { "semana": "abril", "ventas": 5, "pronostico": 8, "pendiente": 3 },
        { "semana": "mayo", "ventas": 5, "pronostico": 8, "pendiente": 3 },
        { "semana": "junio", "ventas": 5, "pronostico": 8, "pendiente": 3 },
        { "semana": "julio", "ventas": 5, "pronostico": 8, "pendiente": 5 },
        { "semana": "agosto", "ventas": 5, "pronostico": 8, "pendiente": 6 },
        { "semana": "septiembre", "ventas": 5, "pronostico": 8, "pendiente": 4 },
        { "semana": "octubre", "ventas": 5, "pronostico": 8, "pendiente": 2 },
        { "semana": "noviembre", "ventas": 5, "pronostico": 8, "pendiente": -5 },
        { "semana": "diciembre", "ventas": 5, "pronostico": 8, "pendiente": -5 }
    ];

    // Calcular valores mínimo y máximo considerando ventas, pronóstico y pendiente
    const valoresY = data.flatMap(d => [d.ventas, d.pronostico, d.pendiente]);
    const minValue = Math.min(...valoresY); // Resta 5 para mejor visualización
    const maxValue = Math.max(...valoresY); // Suma 5 para mejor visualización

    return (
        <Box style={{
            width: '100%',
            maxWidth: "1200px",
            height: "500px",
            margin: "50px auto",
            backgroundColor: "#f7f7f7",
            padding: '16px',
            border: "1px solid #ccc",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            borderRadius: "8px",
            boxShadow: "0px 0px 15px rgba(0, 0, 0, 0.2)",
        }}>
            <h3 style={{ textAlign: 'center' }}>Ventas y Pronóstico</h3>
            <ResponsiveContainer width="100%" height="80%">
                <ComposedChart data={data}>
                    <XAxis dataKey="semana" />
                    <YAxis
                        domain={[minValue, maxValue]}
                        tickCount={10}
                        label={{ value: "Unidades", angle: -90, position: "insideLeft" }}
                    />
                    <Tooltip />
                    <Legend />
                    <CartesianGrid strokeDasharray="3 3" />
                    <Bar dataKey="ventas" barSize={20} fill='#413ea0' name="Ventas" />
                    <Bar dataKey="pronostico" barSize={20} fill='#8884d8' name="Pronóstico" />
                    <Line type="monotone" dataKey="pendiente" stroke="#ff7300" strokeWidth={2} name="Pendiente" />
                </ComposedChart>
            </ResponsiveContainer>
        </Box>
    );
}

export default ChartPronostico;
