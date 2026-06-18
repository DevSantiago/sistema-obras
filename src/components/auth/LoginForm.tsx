"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import styles from "./LoginForm.module.css";

type LoginResponse = {
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

export function LoginForm() {
  const router = useRouter();

  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [mensajeError, setMensajeError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function manejarSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMensajeError(null);
    setCargando(true);

    try {
      const respuesta = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          correo,
          password,
        }),
      });

      const data: LoginResponse = await respuesta.json();

      if (!respuesta.ok || !data.ok) {
        setMensajeError(data.message || "No fue posible iniciar sesión.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setMensajeError("Ocurrió un error inesperado al iniciar sesión.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={manejarSubmit}>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="correo">
          Correo
        </label>
        <input
          className={styles.input}
          id="correo"
          name="correo"
          type="email"
          value={correo}
          onChange={(event) => setCorreo(event.target.value)}
          autoComplete="email"
          placeholder="ejemplo@correo.com"
          required
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="password">
          Contraseña
        </label>
        <input
          className={styles.input}
          id="password"
          name="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          placeholder="Ingrese su contraseña"
          required
        />
      </div>

      {mensajeError && <p className={styles.error}>{mensajeError}</p>}

      <button className={styles.button} type="submit" disabled={cargando}>
        {cargando ? "Ingresando..." : "Ingresar"}
      </button>
    </form>
  );
}