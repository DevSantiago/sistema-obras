"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "./UsersTable.module.css";

type CambiarEstadoResponse = {
  ok: boolean;
  message: string;
  data?: {
    usuario: {
      id: string;
      nombre: string;
      correo: string;
      telefono: string | null;
      estado: string;
      roles: string[];
    };
  };
};

type UserStatusButtonProps = {
  usuarioId: string;
  estadoActual: string;
};

export function UserStatusButton({
  usuarioId,
  estadoActual,
}: UserStatusButtonProps) {
  const router = useRouter();
  const [cambiandoEstado, setCambiandoEstado] = useState(false);
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  const nuevoEstado = estadoActual === "ACTIVO" ? "INACTIVO" : "ACTIVO";
  const esDesactivacion = nuevoEstado === "INACTIVO";

  async function manejarCambioEstado() {
    const confirmarCambio = window.confirm(
      `¿Está seguro de ${
        nuevoEstado === "ACTIVO" ? "activar" : "desactivar"
      } este usuario?`
    );

    if (!confirmarCambio) {
      return;
    }

    setMensajeError(null);
    setCambiandoEstado(true);

    try {
      const respuesta = await fetch(`/api/v1/usuarios/${usuarioId}/estado`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          estado: nuevoEstado,
        }),
      });

      const data: CambiarEstadoResponse = await respuesta.json();

      if (!respuesta.ok || !data.ok) {
        setMensajeError(data.message || "No fue posible cambiar el estado.");
        return;
      }

      router.refresh();
    } catch {
      setMensajeError("Ocurrió un error inesperado al cambiar el estado.");
    } finally {
      setCambiandoEstado(false);
    }
  }

  return (
    <div className={styles.statusAction}>
      <button
        className={
          esDesactivacion ? styles.deactivateButton : styles.activateButton
        }
        type="button"
        onClick={manejarCambioEstado}
        disabled={cambiandoEstado}
      >
        {cambiandoEstado
          ? "Procesando..."
          : esDesactivacion
          ? "Desactivar"
          : "Activar"}
      </button>

      {mensajeError && <p className={styles.actionError}>{mensajeError}</p>}
    </div>
  );
}