import AprobacionesManager from "@/components/aprobaciones/AprobacionesManager";
import { PrivateLayout } from "@/components/layout/PrivateLayout";
import { obtenerUsuarioAutenticado } from "@/modules/auth/auth.service";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import styles from "./page.module.css";

export default async function AprobacionesNivel2Page() {
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

  if (!usuario.permisos.includes("APROBAR_NIVEL_2")) {
    redirect("/aprobaciones");
  }

  return (
    <PrivateLayout usuario={usuario}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Aprobaciones</p>

        <h1 className={styles.title}>
          Aprobación de solicitudes — Nivel 2
        </h1>

        <p className={styles.description}>
          Revisa las solicitudes aprobadas en el primer nivel y
          selecciona aquellas que deben quedar programadas para pago.
        </p>
      </header>

      <AprobacionesManager
        usuario={usuario}
        nivel={2}
      />
    </PrivateLayout>
  );
}