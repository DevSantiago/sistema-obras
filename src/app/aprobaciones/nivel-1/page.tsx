import AprobacionesManager from "@/components/aprobaciones/AprobacionesManager";
import { PrivateLayout } from "@/components/layout/PrivateLayout";
import { obtenerUsuarioAutenticado } from "@/modules/auth/auth.service";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import styles from "./page.module.css";

export default async function AprobacionesNivel1Page() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;

  const resultadoAutenticacion =
    await obtenerUsuarioAutenticado(sessionToken);

  if (
    !resultadoAutenticacion.body.ok ||
    !resultadoAutenticacion.body.data
  ) {
    redirect("/login");
  }

  const { usuario } = resultadoAutenticacion.body.data;

  if (!usuario.permisos.includes("APROBAR_NIVEL_1")) {
    redirect("/aprobaciones");
  }

  return (
    <PrivateLayout usuario={usuario}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Aprobaciones</p>

        <h1 className={styles.title}>
          Aprobación de solicitudes — Nivel 1
        </h1>

        <p className={styles.description}>
          Revisa las solicitudes de pago pendientes y selecciona aquellas
          que cumplen las condiciones para ser aprobadas en el primer nivel.
        </p>
      </header>

      <AprobacionesManager
        usuario={usuario}
        nivel={1}
      />
    </PrivateLayout>
  );
}