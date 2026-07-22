import Link from "next/link";
import styles from "./AprobacionesInicio.module.css";
import type { UsuarioSesion } from "@/modules/auth/auth.types";

type AprobacionesInicioProps = {
  usuario: UsuarioSesion;
};

function usuarioPuedeAccederNivel1(usuario: UsuarioSesion): boolean {
  return usuario.permisos.includes("APROBAR_NIVEL_1");
}

function usuarioPuedeAccederNivel2(usuario: UsuarioSesion): boolean {
  return usuario.permisos.includes("APROBAR_SOLICITUDES_NIVEL_2");
}

export default function AprobacionesInicio({
  usuario,
}: AprobacionesInicioProps) {
  const puedeAccederNivel1 = usuarioPuedeAccederNivel1(usuario);
  const puedeAccederNivel2 = usuarioPuedeAccederNivel2(usuario);

  return (
    <section className={styles.moduleContainer}>
      <div className={styles.levelGrid}>
        <article className={styles.levelCard}>
          <div className={styles.levelCardHeader}>
            <span className={styles.levelNumber}>1</span>

            <span
              className={
                puedeAccederNivel1
                  ? styles.availableBadge
                  : styles.unavailableBadge
              }
            >
              {puedeAccederNivel1 ? "Disponible" : "Sin acceso"}
            </span>
          </div>

          <div className={styles.levelCardContent}>
            <h2>Aprobación nivel 1</h2>

            <p>
              Revisa las solicitudes enviadas, selecciona una o varias y
              apruébalas para continuar al segundo nivel.
            </p>
          </div>

          {puedeAccederNivel1 ? (
            <Link
              className={styles.primaryLink}
              href="/aprobaciones/nivel-1"
            >
              Ingresar a nivel 1
            </Link>
          ) : (
            <span className={styles.disabledLink}>
              No tiene permiso para este nivel
            </span>
          )}
        </article>

        <article className={`${styles.levelCard} ${styles.levelCardDisabled}`}>
          <div className={styles.levelCardHeader}>
            <span className={styles.levelNumber}>2</span>

            <span className={styles.pendingBadge}>
              Próximamente
            </span>
          </div>

          <div className={styles.levelCardContent}>
            <h2>Aprobación nivel 2</h2>

            <p>
              Permitirá realizar la aprobación final de las solicitudes que
              hayan superado el primer nivel.
            </p>
          </div>

          <span className={styles.disabledLink}>
            {puedeAccederNivel2
              ? "Pendiente de implementación"
              : "No tiene permiso para este nivel"}
          </span>
        </article>
      </div>
    </section>
  );
}