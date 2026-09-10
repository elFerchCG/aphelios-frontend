import React, { useMemo } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
} from "@mui/material";

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const COLORS = {
  activos: "#1976d2",
  vencidos: "#d32f2f",
  cerrados: "#2e7d32",
};

const KaizenStatusChart = ({
  estatus = {
    activos: 0,
    vencidos: 0,
    cerrados: 0,
  },
}) => {
  const data = useMemo(
    () => [
      {
        key: "activos",
        name: "Activos",
        value: Number(
          estatus.activos || 0,
        ),
      },
      {
        key: "vencidos",
        name: "Vencidos",
        value: Number(
          estatus.vencidos || 0,
        ),
      },
      {
        key: "cerrados",
        name: "Cerrados",
        value: Number(
          estatus.cerrados || 0,
        ),
      },
    ],
    [estatus],
  );

  const total = data.reduce(
    (acc, item) =>
      acc + item.value,
    0,
  );

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
          Estado de Kaizens
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
        >
          Distribución actual de los
          Kaizens.
        </Typography>

        <Box
          sx={{
            position: "relative",
            height: 280,
            mt: 2,
          }}
        >
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={75}
                outerRadius={105}
                paddingAngle={3}
              >
                {data.map((item) => (
                  <Cell
                    key={item.key}
                    fill={
                      COLORS[item.key]
                    }
                  />
                ))}
              </Pie>

              <Tooltip />
            </PieChart>
          </ResponsiveContainer>

          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform:
                "translate(-50%, -50%)",
              textAlign: "center",
              pointerEvents: "none",
            }}
          >
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
              }}
            >
              {total}
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
            >
              Kaizens
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: 2.5,
            mt: 1,
          }}
        >
          {data.map((item) => (
            <Box
              key={item.key}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.75,
              }}
            >
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  backgroundColor:
                    COLORS[item.key],
                }}
              />

              <Typography
                variant="body2"
                color="text.secondary"
              >
                {item.name}
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  fontWeight: 700,
                }}
              >
                {item.value}
              </Typography>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};

export default KaizenStatusChart;