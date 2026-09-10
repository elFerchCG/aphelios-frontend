import React, { useMemo } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
} from "@mui/material";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const KaizenTrendChart = ({
  tendencia = [],
}) => {
  const data = useMemo(() => {
    return tendencia.map((item) => ({
      semana: item.semana,
      abiertos: Number(
        item.abiertos || 0,
      ),
      cerrados: Number(
        item.cerrados || 0,
      ),
    }));
  }, [tendencia]);

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
          Evolución de Kaizens
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
        >
          Kaizens creados y cerrados
          durante las últimas semanas.
        </Typography>

        <Box
          sx={{
            height: 320,
            mt: 2,
          }}
        >
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <LineChart
              data={data}
              margin={{
                top: 10,
                right: 20,
                left: 0,
                bottom: 0,
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
              />

              <XAxis
                dataKey="semana"
                tickFormatter={(value) =>
                  `Sem ${String(
                    value,
                  ).slice(-2)}`
                }
              />

              <YAxis
                allowDecimals={false}
              />

              <Tooltip
                labelFormatter={(value) =>
                  `Semana ${String(
                    value,
                  ).slice(-2)}`
                }
              />

              <Legend />

              <Line
                type="monotone"
                dataKey="abiertos"
                name="Creados"
                stroke="#1976d2"
                strokeWidth={3}
                dot={{
                  r: 4,
                }}
                activeDot={{
                  r: 6,
                }}
              />

              <Line
                type="monotone"
                dataKey="cerrados"
                name="Cerrados"
                stroke="#2e7d32"
                strokeWidth={3}
                dot={{
                  r: 4,
                }}
                activeDot={{
                  r: 6,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
};

export default KaizenTrendChart;