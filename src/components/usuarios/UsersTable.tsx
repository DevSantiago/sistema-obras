"use client";

import type { UsuarioListado } from "@/modules/usuarios/usuarios.types";
import { UserStatusButton } from "./UserStatusButton";
import styles from "./UsersTable.module.css";


type UsersTableProps = {
  usuarios: UsuarioListado[];
  onEditarUsuario: (usuario: UsuarioListado) => void;
};

function formatearFechaColombia(fecha: string | Date) {
  const fechaOriginal = new Date(fecha);

  const cincoHorasEnMilisegundos = 5 * 60 * 60 * 1000;
  const fechaBogota = new Date(
    fechaOriginal.getTime() - cincoHorasEnMilisegundos
  );

  const dia = String(fechaBogota.getUTCDate()).padStart(2, "0");
  const mes = String(fechaBogota.getUTCMonth() + 1).padStart(2, "0");
  const anio = fechaBogota.getUTCFullYear();

  const hora24 = fechaBogota.getUTCHours();
  const minutos = String(fechaBogota.getUTCMinutes()).padStart(2, "0");

  const hora12 = hora24 % 12 || 12;
  const periodo = hora24 >= 12 ? "p. m." : "a. m.";

  return `${dia}/${mes}/${anio}, ${hora12}:${minutos} ${periodo}`;
}

export function UsersTable({ usuarios, onEditarUsuario }: UsersTableProps) {
  if (usuarios.length === 0) {
    return (
      <section className={styles.empty}>
        <h2>No hay usuarios registrados</h2>
        <p>Cuando cree usuarios, aparecerán en esta sección.</p>
      </section>
    );
  }

  return (
    <section className={styles.card}>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Identificación</th>
              <th>Correo</th>
              <th>Teléfono</th>
              <th>Estado</th>
              <th>Roles</th>
              <th>Creado</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {usuarios.map((usuario) => (
              <tr key={usuario.id}>
                <td>
                  <strong>{usuario.nombre}</strong>
                </td>

                <td>
                  <span className={styles.document}>
                    {usuario.tipo_documento && usuario.numero_documento
                      ? `${usuario.tipo_documento} ${usuario.numero_documento}`
                      : "Sin identificación"}
                  </span>
                </td>

                <td>{usuario.correo}</td>
                <td>{usuario.telefono ?? "Sin teléfono"}</td>

                <td>
                  <span
                    className={
                      usuario.estado === "ACTIVO"
                        ? styles.statusActive
                        : styles.statusInactive
                    }
                  >
                    {usuario.estado}
                  </span>
                </td>

                <td>
                  <div className={styles.roles}>
                    {usuario.roles.map((rol) => (
                      <span key={rol} className={styles.role}>
                        {rol}
                      </span>
                    ))}
                  </div>
                </td>

                <td>{formatearFechaColombia(usuario.creado_en)}</td>

                <td>
                  <div className={styles.actions}>
                    <button
                      className={styles.editButton}
                      type="button"
                      onClick={() => onEditarUsuario(usuario)}
                    >
                      Editar
                    </button>

                    <UserStatusButton
                      usuarioId={usuario.id}
                      estadoActual={usuario.estado}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}