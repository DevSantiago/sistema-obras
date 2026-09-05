"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import styles from "./InstallAppButton.module.css";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function estaInstalada(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;

  const navegadorIos = navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    navegadorIos.standalone === true
  );
}

function suscribirEstadoInstalacion(actualizar: () => void) {
  const media = window.matchMedia("(display-mode: standalone)");
  media.addEventListener("change", actualizar);
  window.addEventListener("appinstalled", actualizar);

  return () => {
    media.removeEventListener("change", actualizar);
    window.removeEventListener("appinstalled", actualizar);
  };
}

function obtenerEstadoServidor() {
  return false;
}

export function InstallAppButton() {
  const [eventoInstalacion, setEventoInstalacion] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [instalacionConfirmada, setInstalacionConfirmada] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const instaladaEnDispositivo = useSyncExternalStore(
    suscribirEstadoInstalacion,
    estaInstalada,
    obtenerEstadoServidor,
  );
  const dispositivoIos =
    typeof navigator !== "undefined" &&
    (/iphone|ipad|ipod/i.test(navigator.userAgent) ||
      (/macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1));

  useEffect(() => {
    function prepararInstalacion(event: Event) {
      event.preventDefault();
      setEventoInstalacion(event as BeforeInstallPromptEvent);
    }

    window.addEventListener("beforeinstallprompt", prepararInstalacion);

    return () => {
      window.removeEventListener("beforeinstallprompt", prepararInstalacion);
    };
  }, []);

  async function instalar() {
    if (eventoInstalacion) {
      await eventoInstalacion.prompt();
      const eleccion = await eventoInstalacion.userChoice;
      if (eleccion.outcome === "accepted") setInstalacionConfirmada(true);
      setEventoInstalacion(null);
      return;
    }

    setModalAbierto(true);
  }

  if (instaladaEnDispositivo || instalacionConfirmada) return null;

  return (
    <>
      <button className={styles.openButton} type="button" onClick={instalar}>
        Instalar aplicación
      </button>

      {modalAbierto ? (
        <div className={styles.backdrop} role="presentation">
          <section
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="install-app-title"
          >
            <div className={styles.header}>
              <div>
                <h2 id="install-app-title">Instalar Sistema Obras</h2>
                <p>Accede desde la pantalla de inicio como una aplicación.</p>
              </div>
              <button
                className={styles.closeButton}
                type="button"
                aria-label="Cerrar"
                onClick={() => setModalAbierto(false)}
              >
                ×
              </button>
            </div>

            <div className={styles.content}>
              {dispositivoIos ? (
                <ol>
                  <li>Abre esta página en Safari.</li>
                  <li>Pulsa el botón Compartir.</li>
                  <li>Selecciona “Agregar a pantalla de inicio”.</li>
                  <li>Confirma con “Agregar” y abre el nuevo icono.</li>
                </ol>
              ) : (
                <ol>
                  <li>Abre el menú de tu navegador.</li>
                  <li>Selecciona “Instalar aplicación” o “Agregar a pantalla de inicio”.</li>
                  <li>Confirma la instalación y abre el nuevo icono.</li>
                </ol>
              )}
              <p className={styles.note}>
                La activación de notificaciones se incorporará en el siguiente paso.
              </p>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
