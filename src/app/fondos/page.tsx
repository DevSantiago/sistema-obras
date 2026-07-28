import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PrivateLayout } from "@/components/layout/PrivateLayout";
import FondosManager from "@/components/fondos/FondosManager";
import { obtenerUsuarioAutenticado } from "@/modules/auth/auth.service";
import styles from "./page.module.css";

export default async function FondosPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;
  const resultado = await obtenerUsuarioAutenticado(sessionToken);

  if (!resultado.body.ok || !resultado.body.data) {
    redirect("/login");
  }

  const { usuario } = resultado.body.data;

  if (!usuario.permisos.includes("CONSULTAR_FONDOS")) {
    redirect("/dashboard");
  }

  return (
    <PrivateLayout usuario={usuario}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Financiero</p>
        <h1 className={styles.title}>Fondos generales</h1>
        <p className={styles.description}>
          Consulta el saldo disponible por proyecto y analiza el gasto
          y los movimientos financieros por centro de costo, línea de
          negocio y fase.
        </p>
      </header>

      <FondosManager />
    </PrivateLayout>
  );
}
