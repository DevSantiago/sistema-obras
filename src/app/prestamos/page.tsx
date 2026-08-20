import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PrivateLayout } from "@/components/layout/PrivateLayout";
import PrestamoForm from "@/components/prestamos/PrestamoForm";
import { obtenerUsuarioAutenticado } from "@/modules/auth/auth.service";
import styles from "./page.module.css";

export default async function PrestamosPage() {
  const cookieStore = await cookies();
  const resultado = await obtenerUsuarioAutenticado(
    cookieStore.get("session_token")?.value,
  );

  if (!resultado.body.ok || !resultado.body.data) {
    redirect("/login");
  }

  const { usuario } = resultado.body.data;

  if (!usuario.permisos.includes("REGISTRAR_PRESTAMOS")) {
    redirect("/dashboard");
  }

  return (
    <PrivateLayout usuario={usuario}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Financiero</p>
        <h1 className={styles.title}>Registrar préstamo</h1>
        <p className={styles.description}>
          Registra recursos prestados por una persona al fondo general de
          un proyecto.
        </p>
      </header>
      <PrestamoForm />
    </PrivateLayout>
  );
}
