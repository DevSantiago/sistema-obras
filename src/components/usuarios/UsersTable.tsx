"use client";

import type { UsuarioListado } from "@/modules/usuarios/usuarios.types";
import { UserStatusButton } from "./UserStatusButton";
import styles from "./UsersTable.module.css";

type UsersTableProps = {
  usuarios: UsuarioListado[];
  onEditarUsuario: (usuario: UsuarioListado) => void;
};

function formatearFechaColombia(fecha: string | Date) {
  const fechaUsuario = fecha instanceof Date ? fecha : new Date(fecha);

  if (Number.isNaN(fechaUsuario.getTime())) {
    return "Sin fecha";
  }

  const dia = String(fechaUsuario.getDate()).padStart(2, "0");
  const mes = String(fechaUsuario.getMonth() + 1).padStart(2, "0");
  const anio = String(fechaUsuario.getFullYear()).slice(-2);

  let hora = fechaUsuario.getHours();
  const minutos = String(fechaUsuario.getMinutes()).padStart(2, "0");
  const periodo = hora >= 12 ? "p. m." : "a. m.";

  hora = hora % 12;
  hora = hora === 0 ? 12 : hora;

  return `${dia}/${mes}/${anio}, ${hora}:${minutos} ${periodo}`;
}

function UserActions({
  usuario,
  onEditarUsuario,
}: {
  usuario: UsuarioListado;
  onEditarUsuario: (usuario: UsuarioListado) => void;
}) {
  return (
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
  );
}

function AccessList({ usuario }: { usuario: UsuarioListado }) {
  if (usuario.accesos.length === 0) {
    return <span className={styles.muted}>Sin accesos</span>;
  }

  return (
    <div className={styles.accesses}>
      {usuario.accesos.map((acceso) => (
        <span className={styles.access} key={acceso.id}>
          {acceso.proyecto_nombre} · {acceso.linea_negocio}
        </span>
      ))}
    </div>
  );
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
      <div className={styles.desktopTable}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Contacto</th>
              <th>Estado</th>
              <th>Rol</th>
              <th>Accesos</th>
              <th>Creado</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {usuarios.map((usuario) => (
              <tr key={usuario.id}>
                <td>
                  <strong className={styles.userName}>{usuario.nombre}</strong>

                  <span className={styles.document}>
                    {usuario.tipo_documento} {usuario.numero_documento}
                  </span>
                </td>

                <td>
                  <span className={styles.contact}>{usuario.correo}</span>

                  <span className={styles.contact}>
                    {usuario.telefono ?? "Sin teléfono"}
                  </span>
                </td>

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
                  <span
                    className={usuario.rol ? styles.role : styles.roleMissing}
                  >
                    {usuario.rol || "Sin rol"}
                  </span>
                </td>

                <td>
                  <AccessList usuario={usuario} />
                </td>

                <td>{formatearFechaColombia(usuario.creado_en)}</td>

                <td>
                  <UserActions
                    usuario={usuario}
                    onEditarUsuario={onEditarUsuario}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.mobileList}>
        {usuarios.map((usuario) => (
          <article className={styles.mobileUser} key={usuario.id}>
            <div className={styles.mobileHeader}>
              <div>
                <h3>{usuario.nombre}</h3>

                <p>
                  {usuario.tipo_documento} {usuario.numero_documento}
                </p>
              </div>

              <span
                className={
                  usuario.estado === "ACTIVO"
                    ? styles.statusActive
                    : styles.statusInactive
                }
              >
                {usuario.estado}
              </span>
            </div>

            <dl className={styles.mobileDetails}>
              <div>
                <dt>Correo</dt>
                <dd>{usuario.correo}</dd>
              </div>

              <div>
                <dt>Teléfono</dt>
                <dd>{usuario.telefono ?? "Sin teléfono"}</dd>
              </div>

              <div>
                <dt>Rol</dt>
                <dd>{usuario.rol || "Sin rol"}</dd>
              </div>

              <div>
                <dt>Creado</dt>
                <dd>{formatearFechaColombia(usuario.creado_en)}</dd>
              </div>
            </dl>

            <div className={styles.mobileAccesses}>
              <p>Accesos</p>
              <AccessList usuario={usuario} />
            </div>

            <UserActions
              usuario={usuario}
              onEditarUsuario={onEditarUsuario}
            />
          </article>
        ))}
      </div>
    </section>
  );
}