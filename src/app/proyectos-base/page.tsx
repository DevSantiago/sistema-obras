import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { PrivateLayout } from "@/components/layout/PrivateLayout";
import { ProyectosBaseManager } from "@/components/proyectos-base/ProyectosBaseManager";
import { obtenerUsuarioAutenticado } from "@/modules/auth/auth.service";

export default async function ProyectosBasePage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;

  const usuarioAutenticado = await obtenerUsuarioAutenticado(sessionToken);
  const usuario = usuarioAutenticado.body.data?.usuario;

  if (!usuarioAutenticado.body.ok || !usuario) {
    redirect("/login");
  }

  return (
    <PrivateLayout usuario={usuario}>
      <ProyectosBaseManager />
    </PrivateLayout>
  );
}