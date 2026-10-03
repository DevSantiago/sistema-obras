import { PrivateLayout } from "@/components/layout/PrivateLayout";
import PagosManager from "@/components/pagos/PagosManager";
import { obtenerUsuarioAutenticado } from "@/modules/auth/auth.service";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
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
    usuario.roles.includes("ADMINISTRADOR") ||
    (usuario.roles.includes("AUXILIAR_CONTABLE") &&
      usuario.permisos.includes("MARCAR_COMO_PAGADO"));

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
        <nav className={styles.tabs}>
          <Link className={styles.activeTab} href="/pagos" aria-current="page">
            Pagos programados
          </Link>
          <Link href="/pagos/retiros">Seguimiento de retiros</Link>
        </nav>
      </header>

      <PagosManager />
    </PrivateLayout>
  );
}
