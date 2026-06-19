import { PrivateLayout } from "@/components/layout/PrivateLayout";
import { UsersManager } from "@/components/usuarios/UsersManager";
import { obtenerUsuarioAutenticado } from "@/modules/auth/auth.service";
import { listarUsuarios } from "@/modules/usuarios/usuarios.service";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import styles from "./page.module.css";

export default async function UsuariosPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;

  const resultadoAutenticacion = await obtenerUsuarioAutenticado(sessionToken);

  if (!resultadoAutenticacion.body.ok || !resultadoAutenticacion.body.data) {
    redirect("/login");
  }

  const { usuario } = resultadoAutenticacion.body.data;

  const resultadoUsuarios = await listarUsuarios(usuario);

  if (resultadoUsuarios.status === 403) {
    redirect("/dashboard");
  }

  const usuarios = resultadoUsuarios.body.data?.usuarios ?? [];

  return (
    <PrivateLayout usuario={usuario}>
      <section className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Administración</p>
          <h1 className={styles.title}>Usuarios</h1>
          <p className={styles.description}>
            Consulte, cree y administre los usuarios que tendrán acceso al
            sistema.
          </p>
        </div>
      </section>

      <UsersManager usuarios={usuarios} />
    </PrivateLayout>
  );
}