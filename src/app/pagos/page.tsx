import { PrivateLayout } from "@/components/layout/PrivateLayout";
import PagosManager from "@/components/pagos/PagosManager";
import { obtenerUsuarioAutenticado } from "@/modules/auth/auth.service";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import styles from "./page.module.css";

export default async function PagosPage() {
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
  const puedeConsultar =
    usuario.roles.includes("PAGOS") ||
    usuario.roles.includes("ADMINISTRADOR");

  if (!puedeConsultar) {
    redirect("/dashboard");
  }

  return (
    <PrivateLayout usuario={usuario}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Pagos</p>
        <h1 className={styles.title}>Bandeja de pagos</h1>
        <p className={styles.description}>
          Consulta las solicitudes programadas para pago y filtra por
          beneficiario, proyecto, centro de costo o medio de pago.
        </p>
      </header>

      <PagosManager />
    </PrivateLayout>
  );
}
