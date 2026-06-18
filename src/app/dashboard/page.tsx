import { obtenerUsuarioAutenticado } from "@/modules/auth/auth.service";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/auth/LogoutButton";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;

  const resultado = await obtenerUsuarioAutenticado(sessionToken);

  if (!resultado.body.ok || !resultado.body.data) {
    redirect("/login");
  }

  const { usuario } = resultado.body.data;

  return (
    <main>
      <h1>Dashboard</h1>
      <p>Sesión iniciada correctamente.</p>
      <p>Usuario: {usuario.nombre}</p>
      <p>Correo: {usuario.correo}</p>
      <p>Roles: {usuario.roles.join(", ")}</p>

      <LogoutButton />
    </main>
  );
}