import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import FinanciacionManager from "@/components/financiacion/FinanciacionManager";
import { PrivateLayout } from "@/components/layout/PrivateLayout";
import { obtenerUsuarioAutenticado } from "@/modules/auth/auth.service";
import styles from "./page.module.css";

export default async function FinanciacionPage() {
  const cookieStore = await cookies();
  const resultado = await obtenerUsuarioAutenticado(
    cookieStore.get("session_token")?.value,
  );

  if (!resultado.body.ok || !resultado.body.data) {
    redirect("/login");
  }

  const { usuario } = resultado.body.data;
  const autorizado = [
    "REGISTRAR_ANTICIPOS",
    "REGISTRAR_PRESTAMOS",
  ].some((permiso) => usuario.permisos.includes(permiso));

  if (!autorizado) {
    redirect("/dashboard");
  }

  return (
    <PrivateLayout usuario={usuario}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Financiero</p>
        <h1 className={styles.title}>Financiación del proyecto</h1>
        <p className={styles.description}>
          Registra anticipos y préstamos que ingresan al fondo general de
          un proyecto base.
        </p>
      </header>
      <FinanciacionManager />
    </PrivateLayout>
  );
}
