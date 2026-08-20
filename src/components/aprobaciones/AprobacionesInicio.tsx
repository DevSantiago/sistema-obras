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
  return usuario.permisos.includes("APROBAR_NIVEL_2");
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

        <article className={styles.levelCard}>
          <div className={styles.levelCardHeader}>
            <span className={styles.levelNumber}>2</span>

            <span
              className={
                puedeAccederNivel2
                  ? styles.availableBadge
                  : styles.unavailableBadge
              }
            >
              {puedeAccederNivel2 ? "Disponible" : "Sin acceso"}
            </span>
          </div>

          <div className={styles.levelCardContent}>
            <h2>Aprobación nivel 2</h2>

            <p>
              Revisa las solicitudes aprobadas en el primer nivel y
              apruébalas para dejarlas programadas para pago.
            </p>
          </div>

          {puedeAccederNivel2 ? (
            <Link
              className={styles.primaryLink}
              href="/aprobaciones/nivel-2"
            >
              Ingresar a nivel 2
            </Link>
          ) : (
            <span className={styles.disabledLink}>
              No tiene permiso para este nivel
            </span>
          )}
        </article>
      </div>
    </section>
  );
}