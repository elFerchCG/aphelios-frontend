import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";

import useAuthStore from "../../store/authStore";
import { onSocketDisponible } from "../../services/socketService";

import AvisoDialog from "./AvisoDialog";

const getApiUrl = () => {
  return process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_URL
    : process.env.REACT_APP_API_URL_LOCAL;
};

const AvisosGlobales = () => {
  const { token } = useAuthStore();

  const [avisos, setAvisos] = useState([]);
  const [procesando, setProcesando] = useState(false);

  const [totalCola, setTotalCola] = useState(0);
  const [numeroActual, setNumeroActual] = useState(1);

  /*
   * Evita que dos llamadas simultáneas a pendientes
   * pisen innecesariamente el estado.
   */
  const consultandoRef = useRef(false);

  const apiUrl = getApiUrl();

  // ============================================================
  // OBTENER AVISOS PENDIENTES
  // ============================================================

  const obtenerAvisosPendientes = useCallback(async () => {
    if (!token || consultandoRef.current) {
      return;
    }

    consultandoRef.current = true;

    try {
      const response = await axios.get(`${apiUrl}/avisos/pendientes`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.data?.ok) {
        return;
      }

      const nuevosAvisos = Array.isArray(response.data.avisos)
        ? response.data.avisos
        : [];

      setAvisos((prev) => {
        // Si todavía no existe una cola activa,
        // iniciamos una nueva.
        if (prev.length === 0) {
          setTotalCola(nuevosAvisos.length);
          setNumeroActual(1);

          return nuevosAvisos;
        }

        // Si ya estamos procesando avisos,
        // agregamos solamente avisos nuevos.
        const idsExistentes = new Set(prev.map((aviso) => aviso.id));

        const adicionales = nuevosAvisos.filter(
          (aviso) => !idsExistentes.has(aviso.id),
        );

        if (adicionales.length > 0) {
          setTotalCola((actual) => actual + adicionales.length);
        }

        return [...prev, ...adicionales];
      });
    } catch (error) {
      console.error("[Avisos] Error obteniendo avisos pendientes:", error);
    } finally {
      consultandoRef.current = false;
    }
  }, [apiUrl, token]);

  // ============================================================
  // CONSULTA INICIAL
  // ============================================================

  useEffect(() => {
    if (!token) {
      setAvisos([]);
      return;
    }

    obtenerAvisosPendientes();
  }, [token, obtenerAvisosPendientes]);

  // ============================================================
  // SOCKET.IO
  // ============================================================

  useEffect(() => {
    if (!token) {
      return;
    }

    let socketActual = null;

    const handleActualizarAvisos = () => {
      obtenerAvisosPendientes();
    };

    const unsubscribe = onSocketDisponible((socket) => {
      /*
       * Por seguridad removemos nuestro listener antes de
       * registrarlo. Así evitamos duplicarlo.
       */
      if (socketActual && socketActual !== socket) {
        socketActual.off("avisos:actualizar", handleActualizarAvisos);
      }

      socketActual = socket;

      socket.off("avisos:actualizar", handleActualizarAvisos);

      socket.on("avisos:actualizar", handleActualizarAvisos);
    });

    return () => {
      unsubscribe();

      if (socketActual) {
        socketActual.off("avisos:actualizar", handleActualizarAvisos);
      }
    };
  }, [token, obtenerAvisosPendientes]);

  // ============================================================
  // POLLING DE RESPALDO
  // ============================================================

  useEffect(() => {
    if (!token) {
      return;
    }

    const interval = setInterval(() => {
      obtenerAvisosPendientes();
    }, 60000);

    return () => {
      clearInterval(interval);
    };
  }, [token, obtenerAvisosPendientes]);

  // ============================================================
  // MARCAR AVISO ACTUAL COMO VISTO
  // ============================================================

  const confirmarAviso = async () => {
    const avisoActual = avisos[0];

    if (!avisoActual || procesando) {
      return;
    }

    try {
      setProcesando(true);

      const response = await axios.post(
        `${apiUrl}/avisos/${avisoActual.id}/visto`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.data?.ok) {
        return;
      }

      /*
       * Quitamos únicamente el aviso confirmado.
       *
       * El siguiente aviso de la cola pasa automáticamente
       * a ser avisos[0].
       */
      setAvisos((prev) => {
        const restantes = prev.filter((aviso) => aviso.id !== avisoActual.id);

        if (restantes.length > 0) {
          setNumeroActual((actual) => actual + 1);
        } else {
          setNumeroActual(1);
          setTotalCola(0);
        }

        return restantes;
      });
    } catch (error) {
      console.error("[Avisos] Error marcando aviso como visto:", error);
    } finally {
      setProcesando(false);
    }
  };

  // ============================================================
  // SIN AVISOS
  // ============================================================

  if (avisos.length === 0) {
    return null;
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <AvisoDialog
      aviso={avisos[0]}
      totalAvisos={totalCola}
      numeroAviso={numeroActual}
      procesando={procesando}
      onConfirmar={confirmarAviso}
    />
  );
};

export default AvisosGlobales;
