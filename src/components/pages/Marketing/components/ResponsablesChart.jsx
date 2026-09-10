import React, { useMemo } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
} from "@mui/material";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const ResponsablesChart = ({
  responsables = [],
}) => {
  const data = useMemo(() => {
    return responsables.map((item) => ({
      nombre: item.nombre,
      activos: Number(item.activos || 0),
      vencidos: Number(item.vencidos || 0),
      cerrados: Number(item.cerrados || 0),
    }));
  }, [responsables]);

  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 3,
      }}
    >
      <CardContent>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
          }}
        >
          Kaizens por responsable
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
        >
          Comparativo de actividad y
          cierres por persona.
        </Typography>

        <Box
          sx={{
            height: Math.max(
              320,
              data.length * 55,
            ),
            mt: 2,
          }}
        >
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <BarChart
              data={data}
              layout="vertical"
              margin={{
                top: 10,
                right: 30,
                left: 30,
                bottom: 10,
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
              />

              <XAxis
                type="number"
                allowDecimals={false}
              />

              <YAxis
                type="category"
                dataKey="nombre"
                width={120}
              />

              <Tooltip />

              <Legend />

              <Bar
                dataKey="activos"
                name="Activos"
                fill="#1976d2"
                radius={[0, 4, 4, 0]}
              />

              <Bar
                dataKey="vencidos"
                name="Vencidos"
                fill="#d32f2f"
                radius={[0, 4, 4, 0]}
              />

              <Bar
                dataKey="cerrados"
                name="Cerrados"
                fill="#2e7d32"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ResponsablesChart;