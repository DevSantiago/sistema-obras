import { PrivateLayout } from "@/components/layout/PrivateLayout";
import SolicitudesPagoManager from "@/components/solicitudes-pago/SolicitudesPagoManager";
import { obtenerUsuarioAutenticado } from "@/modules/auth/auth.service";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import styles from "./page.module.css";

export default async function SolicitudesPagoPage() {
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
        <p className={styles.eyebrow}>Solicitudes</p>
        <h1 className={styles.title}>Solicitudes de pago</h1>
        <p className={styles.description}>
          Crea y consulta solicitudes de pago asociadas a proyectos base,
          centros de costo, beneficiarios y categorías de gasto.
        </p>
      </header>

      <SolicitudesPagoManager usuario={usuario} />
    </PrivateLayout>
  );
}