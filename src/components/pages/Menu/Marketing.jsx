import React, { useEffect, useState } from "react";
import axios from "axios";
import "../../../estilos/configuracion.css";
import "../../../estilos/marketing.css";
import kaizen from "../../../images/kaizen.png";
import kaizenFollows from "../../../images/followKaizens.png";
import performanceComercial from "../../../images/performanceComercial.png";
import publicacionesMejoras from "../../../images/publicacionesMejoras.png";
import { NavLink } from "react-router-dom";

const Marketing = () => {
  const [dashboard, setDashboard] = useState({
    activos: 0,
    seguimientosHoy: 0,
    vencidos: 0,
    cerradosSemana: 0,
  });

  const apiUrl =
    process.env.NODE_ENV === "production"
      ? process.env.REACT_APP_API_URL
      : process.env.REACT_APP_API_URL_LOCAL;

  const token = localStorage.getItem("token");

  const usuario = JSON.parse(localStorage.getItem("user"));

  const puedeVerPerformance =
    usuario?.rol_descripcion === "administrador" ||
    usuario?.rol_descripcion === "Lider Marketing" ||
    usuario?.rol_descripcion === "Lider Marketing" ||
    usuario?.rol_descripcion === "Coordinador comercial";

  const obtenerDashboard = async () => {
    try {
      const resp = await axios.get(`${apiUrl}/marketing/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (resp.data.ok) {
        setDashboard(resp.data.data);
      }
    } catch (error) {
      console.error("Error al obtener dashboard marketing:", error);
    }
  };

  useEffect(() => {
    obtenerDashboard();
  }, []);

  const opcionesMarketing = [
    {
      titulo: "Kaizen Ventas",
      descripcion:
        "Detecta productos que no alcanzaron su pronóstico de ventas y registra acciones de mejora.",
      imagen: kaizen,
      ruta: "/kaizenVentasPerdidas",
      estado: "Beta",
      resumen: `${dashboard.activos} kaizens activos`,
    },
    {
      titulo: "Kaizen Seguimiento",
      descripcion:
        "Da seguimiento a las acciones Kaizen activas, responsables y fechas programadas.",
      imagen: kaizenFollows,
      ruta: "/kaizenSeguimiento",
      estado: "Beta",
      resumen: `${dashboard.seguimientosHoy} seguimientos hoy`,
    },
    ...(puedeVerPerformance
      ? [
          {
            titulo: "Performance Comercial",
            descripcion:
              "Analiza proyecciones, ventas reales, ingresos, costos y rentabilidad por producto.",
            imagen: performanceComercial,
            ruta: "/performanceComercial",
            estado: "En desarrollo",
            resumen: "Ventas vs proyección",
          },
        ]
      : []),

    {
      titulo: "Bitácora de Publicaciones",
      descripcion:
        "Registra mejoras, asignaciones y cambios realizados sobre las publicaciones de Mercado Libre.",
      imagen: publicacionesMejoras,
      ruta: "/publicacionesMejoras",
      estado: "En desarrollo",
      resumen: "Mejoras y seguimiento",
    },
  ];

  const metricas = [
    {
      titulo: "Activos",
      valor: dashboard.activos,
      descripcion: "Kaizens abiertos",
    },
    {
      titulo: "Hoy",
      valor: dashboard.seguimientosHoy,
      descripcion: "Seguimientos programados",
    },
    {
      titulo: "Vencidos",
      valor: dashboard.vencidos,
      descripcion: "Requieren atención",
    },
    {
      titulo: "Cerrados",
      valor: dashboard.cerradosSemana,
      descripcion: "Esta semana",
    },
  ];

  return (
    <div className="marketing-page">
      <section className="marketing-hero">
        <p className="marketing-eyebrow">Marketing</p>

        <h1>Centro Marketing</h1>

        <p className="marketing-description">
          Monitoreo y mejora continua de publicaciones, ventas y estrategias
          comerciales de Aphelios.
        </p>
      </section>

      <section className="marketing-stats">
        {metricas.map((metrica) => (
          <div key={metrica.titulo} className="marketing-stat-card">
            <span>{metrica.titulo}</span>
            <strong>{metrica.valor}</strong>
            <p>{metrica.descripcion}</p>
          </div>
        ))}
      </section>

      <section className="marketing-grid">
        {opcionesMarketing.map((opcion) => (
          <NavLink
            key={opcion.titulo}
            to={opcion.ruta}
            className="marketing-card"
          >
            <div className="marketing-card-header">
              <div className="marketing-icon-wrapper">
                <img
                  src={opcion.imagen}
                  alt={opcion.titulo}
                  className="marketing-icon"
                />
              </div>

              <span className="marketing-status">{opcion.estado}</span>
            </div>

            <div className="marketing-card-content">
              <h2>{opcion.titulo}</h2>
              <p>{opcion.descripcion}</p>

              <div className="marketing-card-summary">{opcion.resumen}</div>
            </div>

            <div className="marketing-card-footer">
              <span>Entrar al módulo</span>
              <span>→</span>
            </div>
          </NavLink>
        ))}
      </section>
    </div>
  );
};

export default Marketing;
