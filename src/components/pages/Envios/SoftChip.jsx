import { Box } from "@mui/material";

import { tono } from "./consolidadoPalette";

/**
 * Pill de estado "soft UI" (fondo tenue + borde + texto de color, sin
 * relleno sólido). Reemplaza el uso de <Chip color="warning"/success"/...>
 * de MUI en el consolidado de producción, para tener un look consistente
 * y profesional en todo el drawer en vez de los colores por defecto de
 * MUI (el "warning" por defecto es amarillo/ámbar, que no se quería).
 *
 * tone: "primary" | "success" | "warning" | "info" | "neutral"
 */
export default function SoftChip({

    label,
    tone = "neutral",
    icon = null,
    size = "small",
    sx = {}

}) {

    const c = tono(tone);

    const isSmall = size !== "medium";

    return (

        <Box

            sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.5,
                px: isSmall ? 1 : 1.5,
                py: isSmall ? 0.375 : 0.625,
                borderRadius: 999,
                bgcolor: c.bg,
                border: `1px solid ${c.border}`,
                color: c.text,
                fontSize: isSmall ? 12 : 13,
                fontWeight: 700,
                lineHeight: 1.5,
                whiteSpace: "nowrap",
                ...sx
            }}

        >

            {icon}

            {label}

        </Box>

    );

}