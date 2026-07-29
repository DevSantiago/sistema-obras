import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PrivateLayout } from "@/components/layout/PrivateLayout";
import OperacionesEfectivoManager from "@/components/operaciones-efectivo/OperacionesEfectivoManager";
import { obtenerUsuarioAutenticado } from "@/modules/auth/auth.service";
import styles from "../page.module.css";

type Props = {
  searchParams: Promise<{ operacion?: string }>;
};

export default async function RetirosPage({ searchParams }: Props) {
  const cookieStore = await cookies();
  const autenticacion = await obtenerUsuarioAutenticado(
    cookieStore.get("session_token")?.value,
  );

  if (!autenticacion.body.ok || !autenticacion.body.data) {
    redirect("/login");
  }

  const { usuario } = autenticacion.body.data;

  if (
    !usuario.roles.includes("PAGOS") &&
    !usuario.roles.includes("ADMINISTRADOR")
  ) {
    redirect("/dashboard");
  }

  const parametros = await searchParams;

  return (
    <PrivateLayout usuario={usuario}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Pagos</p>
        <h1 className={styles.title}>Seguimiento de retiros</h1>
        <p className={styles.description}>
          Consulta las solicitudes, soportes y sobrantes de las
          operaciones de efectivo registradas.
        </p>
        <nav className={styles.tabs}>
          <Link href="/pagos">Bandeja de pagos</Link>
          <Link className={styles.activeTab} href="/pagos/retiros">
            Retiros
          </Link>
        </nav>
      </header>
      <OperacionesEfectivoManager
        operacionInicialId={parametros.operacion}
      />
    </PrivateLayout>
  );
}
