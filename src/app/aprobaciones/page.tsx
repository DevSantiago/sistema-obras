import { PrivateLayout } from "@/components/layout/PrivateLayout";
import AprobacionesInicio from "@/components/aprobaciones/AprobacionesInicio";
import { obtenerUsuarioAutenticado } from "@/modules/auth/auth.service";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import styles from "./page.module.css";


export default async function AprobacionesPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;

  const resultadoAutenticacion = await obtenerUsuarioAutenticado(sessionToken);

  if (!resultadoAutenticacion.body.ok || !resultadoAutenticacion.body.data) {
    redirect("/login");
  }

  const { usuario } = resultadoAutenticacion.body.data;


  return (
    <PrivateLayout usuario={usuario}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Aprobaciones</p>

        <h1 className={styles.title}>
          Aprobación de solicitudes
        </h1>

        <p className={styles.description}>
          Accede a los niveles de aprobación disponibles de acuerdo con tus
          permisos y revisa las solicitudes de pago pendientes.
        </p>
      </header>

      <AprobacionesInicio usuario={usuario} />
    </PrivateLayout>
  );
}