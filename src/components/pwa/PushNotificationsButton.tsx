"use client";

import { useState } from "react";
import styles from "./PushNotificationsButton.module.css";

type EstadoDispositivo =
  | "CARGANDO"
  | "ACTIVA"
  | "INACTIVA"
  | "BLOQUEADA"
  | "NO_COMPATIBLE"
  | "REQUIERE_INSTALACION";

type ApiResponse = {
  ok: boolean;
  message: string;
  data?: {
    cantidad_dispositivos: number;
    activa_en_este_dispositivo: boolean;
  };
};

function esIos() {
  return (
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (/macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1)
  );
}

function estaInstalada() {
  const navegadorIos = navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    navegadorIos.standalone === true
  );
}

function convertirClaveVapid(clave: string) {
  const relleno = "=".repeat((4 - (clave.length % 4)) % 4);
  const base64 = (clave + relleno).replace(/-/g, "+").replace(/_/g, "/");
  const bytes = window.atob(base64);
  return Uint8Array.from(bytes, (caracter) => caracter.charCodeAt(0));
}

async function leerRespuesta(response: Response) {
  return (await response.json()) as ApiResponse;
}

async function calcularHashEndpoint(endpoint: string) {
  const contenido = new TextEncoder().encode(endpoint);
  const hash = await window.crypto.subtle.digest("SHA-256", contenido);
  return Array.from(new Uint8Array(hash), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

export function PushNotificationsButton() {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [estado, setEstado] = useState<EstadoDispositivo>("CARGANDO");
  const [cantidadDispositivos, setCantidadDispositivos] = useState(0);
  const [procesando, setProcesando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [esError, setEsError] = useState(false);

  async function obtenerSuscripcionActual() {
    const registro = await navigator.serviceWorker.ready;
    return {
      registro,
      suscripcion: await registro.pushManager.getSubscription(),
    };
  }

  async function consultarEstado() {
    setMensaje("");
    setEsError(false);

    if (
      !window.isSecureContext ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window) ||
      !("Notification" in window)
    ) {
      setEstado("NO_COMPATIBLE");
      return;
    }

    if (esIos() && !estaInstalada()) {
      setEstado("REQUIERE_INSTALACION");
      return;
    }

    try {
      const { suscripcion } = await obtenerSuscripcionActual();
      const endpointHash = suscripcion
        ? await calcularHashEndpoint(suscripcion.endpoint)
        : undefined;
      const response = await fetch("/api/v1/push/suscripciones", {
        headers: endpointHash
          ? { "X-Push-Endpoint-Hash": endpointHash }
          : undefined,
      });
      const resultado = await leerRespuesta(response);

      if (!response.ok) throw new Error(resultado.message);

      setCantidadDispositivos(resultado.data?.cantidad_dispositivos ?? 0);
      setEstado(
        Notification.permission === "denied"
          ? "BLOQUEADA"
          : suscripcion && resultado.data?.activa_en_este_dispositivo
            ? "ACTIVA"
            : "INACTIVA",
      );
    } catch (error) {
      setEstado("INACTIVA");
      setMensaje(
        error instanceof Error
          ? error.message
          : "No fue posible consultar las notificaciones.",
      );
      setEsError(true);
    }
  }

  function abrirModal() {
    setModalAbierto(true);
    setEstado("CARGANDO");
    void consultarEstado();
  }

  function cerrarModal() {
    if (procesando) return;
    setModalAbierto(false);
    setMensaje("");
  }

  async function activarNotificaciones() {
    setProcesando(true);
    setMensaje("");

    try {
      const clavePublica = process.env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY;
      if (!clavePublica) {
        throw new Error("La clave pública Push no está configurada en este ambiente.");
      }

      const permiso =
        Notification.permission === "default"
          ? await Notification.requestPermission()
          : Notification.permission;

      if (permiso !== "granted") {
        setEstado("BLOQUEADA");
        setMensaje(
          "El navegador bloqueó las notificaciones. Habilítalas en la configuración del sitio.",
        );
        setEsError(true);
        return;
      }

      const { registro, suscripcion: existente } =
        await obtenerSuscripcionActual();
      const suscripcion =
        existente ??
        (await registro.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertirClaveVapid(clavePublica),
        }));

      const response = await fetch("/api/v1/push/suscripciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(suscripcion.toJSON()),
      });
      const resultado = await leerRespuesta(response);

      if (!response.ok) {
        if (!existente) await suscripcion.unsubscribe();
        throw new Error(resultado.message);
      }

      setEstado("ACTIVA");
      setCantidadDispositivos(resultado.data?.cantidad_dispositivos ?? 1);
      setMensaje(resultado.message);
      setEsError(false);
    } catch (error) {
      setMensaje(
        error instanceof Error
          ? error.message
          : "No fue posible activar las notificaciones.",
      );
      setEsError(true);
    } finally {
      setProcesando(false);
    }
  }

  async function desactivarNotificaciones() {
    setProcesando(true);
    setMensaje("");

    try {
      const { suscripcion } = await obtenerSuscripcionActual();
      if (!suscripcion) {
        setEstado("INACTIVA");
        return;
      }

      const response = await fetch("/api/v1/push/suscripciones", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: suscripcion.endpoint }),
      });
      const resultado = await leerRespuesta(response);

      if (!response.ok) throw new Error(resultado.message);

      await suscripcion.unsubscribe();
      setEstado("INACTIVA");
      setCantidadDispositivos(resultado.data?.cantidad_dispositivos ?? 0);
      setMensaje(resultado.message);
      setEsError(false);
    } catch (error) {
      setMensaje(
        error instanceof Error
          ? error.message
          : "No fue posible desactivar las notificaciones.",
      );
      setEsError(true);
    } finally {
      setProcesando(false);
    }
  }

  return (
    <>
      <button className={styles.openButton} type="button" onClick={abrirModal}>
        Notificaciones Push
      </button>

      {modalAbierto ? (
        <div className={styles.backdrop} role="presentation">
          <section
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="push-notifications-title"
          >
            <div className={styles.header}>
              <div>
                <h2 id="push-notifications-title">Notificaciones Push</h2>
                <p>Controla los avisos de Sistema Obras en este dispositivo.</p>
              </div>
              <button
                className={styles.closeButton}
                type="button"
                aria-label="Cerrar"
                onClick={cerrarModal}
                disabled={procesando}
              >
                ×
              </button>
            </div>

            <div className={styles.content}>
              {estado === "CARGANDO" ? <p>Consultando estado...</p> : null}
              {estado === "ACTIVA" ? (
                <p className={styles.active}>Notificaciones activas en este dispositivo.</p>
              ) : null}
              {estado === "INACTIVA" ? (
                <p>Las notificaciones están desactivadas en este dispositivo.</p>
              ) : null}
              {estado === "BLOQUEADA" ? (
                <p className={styles.warning}>
                  El permiso está bloqueado. Debes habilitarlo desde la configuración del navegador o de la aplicación.
                </p>
              ) : null}
              {estado === "NO_COMPATIBLE" ? (
                <p className={styles.warning}>
                  Este navegador o conexión no admite notificaciones Push. Usa la aplicación instalada mediante HTTPS.
                </p>
              ) : null}
              {estado === "REQUIERE_INSTALACION" ? (
                <p className={styles.warning}>
                  En iPhone o iPad debes instalar Sistema Obras en la pantalla de inicio y abrirlo desde su icono.
                </p>
              ) : null}

              {cantidadDispositivos > 0 ? (
                <p className={styles.devices}>
                  Dispositivos activos asociados a tu usuario: {cantidadDispositivos}
                </p>
              ) : null}

              {mensaje ? (
                <p className={esError ? styles.error : styles.success} role="status">
                  {mensaje}
                </p>
              ) : null}

              <div className={styles.actions}>
                {estado === "INACTIVA" ? (
                  <button
                    className={styles.primaryButton}
                    type="button"
                    onClick={activarNotificaciones}
                    disabled={procesando}
                  >
                    {procesando ? "Activando..." : "Activar notificaciones"}
                  </button>
                ) : null}
                {estado === "ACTIVA" ? (
                  <button
                    className={styles.secondaryButton}
                    type="button"
                    onClick={desactivarNotificaciones}
                    disabled={procesando}
                  >
                    {procesando ? "Desactivando..." : "Desactivar en este dispositivo"}
                  </button>
                ) : null}
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
