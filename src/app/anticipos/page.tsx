import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AnticipoForm from "@/components/anticipos/AnticipoForm";
import { PrivateLayout } from "@/components/layout/PrivateLayout";
import { obtenerUsuarioAutenticado } from "@/modules/auth/auth.service";
import styles from "./page.module.css";

export default async function AnticiposPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;
  const resultado = await obtenerUsuarioAutenticado(sessionToken);

  if (!resultado.body.ok || !resultado.body.data) {
    redirect("/login");
  }

  const { usuario } = resultado.body.data;

  if (!usuario.permisos.includes("REGISTRAR_ANTICIPOS")) {
    redirect("/dashboard");
  }

  return (
    <PrivateLayout usuario={usuario}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Financiero</p>
        <h1 className={styles.title}>Registrar anticipo</h1>
        <p className={styles.description}>
          Registra el ingreso entregado por una entidad al fondo general
          de un proyecto base.
        </p>
      </header>
      <AnticipoForm />
    </PrivateLayout>
  );
}
