import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();

  cookieStore.delete("session_token");

  return Response.json(
    {
      ok: true,
      message: "Sesión cerrada correctamente.",
    },
    { status: 200 }
  );
}