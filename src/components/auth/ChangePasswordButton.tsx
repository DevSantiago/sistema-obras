"use client";

import { useState } from "react";
import styles from "./ChangePasswordButton.module.css";

type ApiResponse = {
  ok: boolean;
  message: string;
};

export function ChangePasswordButton() {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [passwordActual, setPasswordActual] = useState("");
  const [passwordNuevo, setPasswordNuevo] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [esError, setEsError] = useState(false);

  function limpiarFormulario() {
    setPasswordActual("");
    setPasswordNuevo("");
    setConfirmarPassword("");
    setMensaje("");
    setEsError(false);
  }

  function cerrarModal() {
    if (guardando) {
      return;
    }

    setModalAbierto(false);
    limpiarFormulario();
  }

  async function manejarSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setGuardando(true);
    setMensaje("");

    try {
      const response = await fetch("/api/v1/auth/cambiar-contrasena", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password_actual: passwordActual,
          password_nuevo: passwordNuevo,
          confirmar_password: confirmarPassword,
        }),
      });

      const resultado = (await response.json()) as ApiResponse;

      setMensaje(resultado.message);
      setEsError(!response.ok);

      if (response.ok) {
        setPasswordActual("");
        setPasswordNuevo("");
        setConfirmarPassword("");
      }
    } catch {
      setMensaje("No fue posible cambiar la contraseña.");
      setEsError(true);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <>
      <button
        className={styles.openButton}
        type="button"
        onClick={() => setModalAbierto(true)}
      >
        Cambiar contraseña
      </button>

      {modalAbierto ? (
        <div className={styles.modalBackdrop} role="presentation">
          <section
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="change-password-title"
          >
            <div className={styles.modalHeader}>
              <div>
                <h2 id="change-password-title">Cambiar contraseña</h2>
                <p>
                  Usa una contraseña diferente a la temporal y de mínimo 8
                  caracteres.
                </p>
              </div>

              <button
                className={styles.closeButton}
                type="button"
                aria-label="Cerrar"
                onClick={cerrarModal}
                disabled={guardando}
              >
                ×
              </button>
            </div>

            <form className={styles.form} onSubmit={manejarSubmit}>
              <label>
                Contraseña actual
                <input
                  type="password"
                  value={passwordActual}
                  onChange={(event) => setPasswordActual(event.target.value)}
                  autoComplete="current-password"
                  required
                />
              </label>

              <label>
                Nueva contraseña
                <input
                  type="password"
                  value={passwordNuevo}
                  onChange={(event) => setPasswordNuevo(event.target.value)}
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </label>

              <label>
                Confirmar nueva contraseña
                <input
                  type="password"
                  value={confirmarPassword}
                  onChange={(event) =>
                    setConfirmarPassword(event.target.value)
                  }
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </label>

              {mensaje ? (
                <p
                  className={esError ? styles.errorMessage : styles.successMessage}
                  role="status"
                >
                  {mensaje}
                </p>
              ) : null}

              <div className={styles.actions}>
                <button
                  className={styles.cancelButton}
                  type="button"
                  onClick={cerrarModal}
                  disabled={guardando}
                >
                  Cancelar
                </button>
                <button
                  className={styles.submitButton}
                  type="submit"
                  disabled={guardando}
                >
                  {guardando ? "Guardando..." : "Guardar contraseña"}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </>
  );
}
