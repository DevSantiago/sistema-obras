import { PrivateLayout } from "@/components/layout/PrivateLayout";
import { UsersManager } from "@/components/usuarios/UsersManager";
import type { ProyectoAccesoDisponible } from "@/components/usuarios/UserForm";
import { obtenerUsuarioAutenticado } from "@/modules/auth/auth.service";
import { listarProyectosBaseService } from "@/modules/proyectos-base/proyectos-base.service";
import type { LineaNegocioAcceso } from "@/modules/usuarios/usuarios.types";
import { listarUsuarios } from "@/modules/usuarios/usuarios.service";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import styles from "./page.module.css";

function esLineaNegocioAcceso(
  lineaNegocio: string,
): lineaNegocio is LineaNegocioAcceso {
  return lineaNegocio === "OBRA" || lineaNegocio === "INTERVENTORIA";
}

export default async function UsuariosPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;
  const resultadoAutenticacion =
    await obtenerUsuarioAutenticado(sessionToken);

  if (!resultadoAutenticacion.body.ok || !resultadoAutenticacion.body.data) {
    redirect("/login");
  }

  const { usuario } = resultadoAutenticacion.body.data;
  const [resultadoUsuarios, proyectosBase] = await Promise.all([
    listarUsuarios(usuario),
    listarProyectosBaseService({ activo: true }),
  ]);

  if (resultadoUsuarios.status === 403) {
    redirect("/dashboard");
  }

  const usuarios = resultadoUsuarios.body.data?.usuarios ?? [];
  const proyectos: ProyectoAccesoDisponible[] = proyectosBase
    .map((proyecto) => ({
      id: proyecto.id,
      nombre: proyecto.nombre,
      lineas_negocio: Array.from(
        new Set(
          proyecto.centros_costo
            .filter((centro) => centro.activo)
            .map((centro) => centro.linea_negocio)
            .filter(esLineaNegocioAcceso),
        ),
      ),
    }))
    .filter((proyecto) => proyecto.lineas_negocio.length > 0);

  return (
    <PrivateLayout usuario={usuario}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Administración</p>
        <h1 className={styles.title}>Usuarios</h1>
        <p className={styles.description}>
          Administre usuarios, roles y acceso a las líneas de cada proyecto.
        </p>
      </header>

      <UsersManager usuarios={usuarios} proyectos={proyectos} />
    </PrivateLayout>
  );
}
