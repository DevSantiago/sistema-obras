import { PrivateLayout } from "@/components/layout/PrivateLayout";
import { formatearNombrePropio } from "@/lib/text-format";
import { obtenerUsuarioAutenticado } from "@/modules/auth/auth.service";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import styles from "./page.module.css";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;

  const resultado = await obtenerUsuarioAutenticado(sessionToken);

  if (!resultado.body.ok || !resultado.body.data) {
    redirect("/login");
  }

  const { usuario } = resultado.body.data;

  return (
    <PrivateLayout usuario={usuario}>
      <section className={styles.header}>
        <p className={styles.eyebrow}>Panel principal</p>
        <h1 className={styles.title}>Dashboard</h1>
        <p className={styles.description}>
          Bienvenido, {formatearNombrePropio(usuario.nombre)}. Desde este panel
          podrá acceder a los módulos principales del sistema.
        </p>
      </section>

      <section className={styles.grid}>
        <article className={styles.card}>
          <p className={styles.cardLabel}>Usuario</p>
          <h2 className={styles.cardValue}>
            {formatearNombrePropio(usuario.nombre)}
          </h2>
          <p className={styles.cardText}>{usuario.correo}</p>
        </article>

        <article className={styles.card}>
          <p className={styles.cardLabel}>Roles</p>
          <h2 className={styles.cardValue}>{usuario.roles.length}</h2>
          <p className={styles.cardText}>{usuario.roles.join(", ")}</p>
        </article>

        <article className={styles.card}>
          <p className={styles.cardLabel}>Estado</p>
          <h2 className={styles.cardValue}>{usuario.estado}</h2>
          <p className={styles.cardText}>Sesión validada correctamente.</p>
        </article>
      </section>

      <article className={styles.mobileSummary}>
        <div className={styles.mobileSummaryHeader}>
          <div>
            <p className={styles.cardLabel}>Sesión activa</p>
            <h2 className={styles.cardValue}>
              {formatearNombrePropio(usuario.nombre)}
            </h2>
          </div>
          <span>{usuario.estado}</span>
        </div>
        <details>
          <summary>Ver información de la sesión</summary>
          <dl>
            <div>
              <dt>Correo</dt>
              <dd>{usuario.correo}</dd>
            </div>
            <div>
              <dt>Roles</dt>
              <dd>{usuario.roles.join(", ")}</dd>
            </div>
          </dl>
        </details>
      </article>
    </PrivateLayout>
  );
}
