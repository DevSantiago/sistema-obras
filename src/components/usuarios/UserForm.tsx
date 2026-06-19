"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import type { UsuarioListado } from "@/modules/usuarios/usuarios.types";
import styles from "./UserForm.module.css";

type UsuarioResponse = {
  ok: boolean;
  message: string;
  data?: {
    usuario: {
      id: string;
      tipo_documento: string;
      numero_documento: string;
      nombre: string;
      correo: string;
      telefono: string | null;
      estado: string;
      roles: string[];
    };
  };
};

type UserFormProps = {
  usuarioEditando?: UsuarioListado | null;
  onCancelarEdicion?: () => void;
  onGuardado?: () => void;
};

export function UserForm({
  usuarioEditando,
  onCancelarEdicion,
  onGuardado,
}: UserFormProps) {
  const router = useRouter();

  const esEdicion = Boolean(usuarioEditando);

  const [tipoDocumento, setTipoDocumento] = useState(
    usuarioEditando?.tipo_documento ?? "CC"
  );
  const [numeroDocumento, setNumeroDocumento] = useState(
    usuarioEditando?.numero_documento ?? ""
  );
  const [nombre, setNombre] = useState(usuarioEditando?.nombre ?? "");
  const [correo, setCorreo] = useState(usuarioEditando?.correo ?? "");
  const [telefono, setTelefono] = useState(usuarioEditando?.telefono ?? "");
  const [password, setPassword] = useState("");
  const [estado, setEstado] = useState<"ACTIVO" | "INACTIVO">(
    usuarioEditando?.estado === "INACTIVO" ? "INACTIVO" : "ACTIVO"
  );

  const [mensajeError, setMensajeError] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  async function manejarSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMensajeError(null);
    setMensajeExito(null);
    setGuardando(true);

    try {
      const url = esEdicion
        ? `/api/v1/usuarios/${usuarioEditando?.id}`
        : "/api/v1/usuarios";

      const method = esEdicion ? "PATCH" : "POST";

      const body = esEdicion
        ? {
            nombre,
            correo,
            telefono: telefono.trim() === "" ? null : telefono,
          }
        : {
            tipo_documento: tipoDocumento,
            numero_documento: numeroDocumento,
            nombre,
            correo,
            telefono: telefono.trim() === "" ? null : telefono,
            password,
            estado,
          };

      const respuesta = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data: UsuarioResponse = await respuesta.json();

      if (!respuesta.ok || !data.ok) {
        setMensajeError(data.message || "No fue posible guardar el usuario.");
        return;
      }

      setMensajeExito(data.message || "Usuario guardado correctamente.");

      if (!esEdicion) {
        setTipoDocumento("CC");
        setNumeroDocumento("");
        setNombre("");
        setCorreo("");
        setTelefono("");
        setPassword("");
        setEstado("ACTIVO");
      }

      onGuardado?.();
      router.refresh();
    } catch {
      setMensajeError("Ocurrió un error inesperado al guardar el usuario.");
    } finally {
      setGuardando(false);
    }
  }

  function manejarCancelar() {
    onCancelarEdicion?.();
  }

  return (
    <section className={styles.card}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          {esEdicion ? "Editar usuario" : "Crear usuario"}
        </h2>
        <p className={styles.description}>
          {esEdicion
            ? "Actualice los datos básicos del usuario seleccionado. El tipo y número de identificación no se pueden modificar."
            : "Registre un nuevo usuario para permitirle acceder al sistema."}
        </p>
      </div>

      <form className={styles.form} onSubmit={manejarSubmit} method="post">
        <div className={styles.grid}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="tipo_documento">
              Tipo de identificación
            </label>
            <select
              className={styles.input}
              id="tipo_documento"
              name="tipo_documento"
              value={tipoDocumento}
              onChange={(event) => setTipoDocumento(event.target.value)}
              disabled={esEdicion}
              required
            >
              <option value="CC">Cédula de ciudadanía</option>
              <option value="CE">Cédula de extranjería</option>
              <option value="PASAPORTE">Pasaporte</option>
              <option value="OTRO">Otro</option>
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="numero_documento">
              Número de identificación
            </label>
            <input
              className={styles.input}
              id="numero_documento"
              name="numero_documento"
              type="text"
              value={numeroDocumento}
              onChange={(event) => setNumeroDocumento(event.target.value)}
              placeholder="Número de documento"
              disabled={esEdicion}
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="nombre">
              Nombre
            </label>
            <input
              className={styles.input}
              id="nombre"
              name="nombre"
              type="text"
              value={nombre}
              onChange={(event) => setNombre(event.target.value)}
              placeholder="Nombre completo"
              required
            />
          </div>

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
              placeholder="usuario@correo.com"
              autoComplete="email"
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="telefono">
              Teléfono
            </label>
            <input
              className={styles.input}
              id="telefono"
              name="telefono"
              type="text"
              value={telefono}
              onChange={(event) => setTelefono(event.target.value)}
              placeholder="Opcional"
            />
          </div>

          {!esEdicion && (
            <>
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
                  placeholder="Contraseña temporal"
                  autoComplete="new-password"
                  required
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="estado">
                  Estado
                </label>
                <select
                  className={styles.input}
                  id="estado"
                  name="estado"
                  value={estado}
                  onChange={(event) =>
                    setEstado(event.target.value as "ACTIVO" | "INACTIVO")
                  }
                >
                  <option value="ACTIVO">ACTIVO</option>
                  <option value="INACTIVO">INACTIVO</option>
                </select>
              </div>
            </>
          )}
        </div>

        {mensajeError && <p className={styles.error}>{mensajeError}</p>}
        {mensajeExito && <p className={styles.success}>{mensajeExito}</p>}

        <div className={styles.actions}>
          {esEdicion && (
            <button
              className={styles.secondaryButton}
              type="button"
              onClick={manejarCancelar}
              disabled={guardando}
            >
              Cancelar
            </button>
          )}

          <button className={styles.button} type="submit" disabled={guardando}>
            {guardando
              ? "Guardando..."
              : esEdicion
              ? "Guardar cambios"
              : "Crear usuario"}
          </button>
        </div>
      </form>
    </section>
  );
}