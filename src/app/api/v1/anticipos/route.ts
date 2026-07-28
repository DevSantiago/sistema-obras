import { cookies } from "next/headers";
import { registrarAnticipoService } from "@/modules/anticipos/anticipos.service";
import { obtenerUsuarioAutenticado } from "@/modules/auth/auth.service";

async function obtenerUsuarioSesionDesdeCookie() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;

  return obtenerUsuarioAutenticado(sessionToken);
}

export async function POST(request: Request) {
  try {
    const autenticacion = await obtenerUsuarioSesionDesdeCookie();

    if (!autenticacion.body.ok || !autenticacion.body.data) {
      return Response.json(autenticacion.body, {
        status: autenticacion.status,
      });
    }

    let formData: FormData;

    try {
      formData = await request.formData();
    } catch {
      return Response.json(
        {
          ok: false,
          message:
            "La solicitud debe enviarse como multipart/form-data.",
        },
        { status: 400 },
      );
    }

    const soporte = formData.get("soporte");

    if (!(soporte instanceof File)) {
      return Response.json(
        {
          ok: false,
          message: "El soporte del anticipo es obligatorio.",
        },
        { status: 400 },
      );
    }

    const resultado = await registrarAnticipoService(
      autenticacion.body.data.usuario,
      {
        proyecto_base_id: String(
          formData.get("proyecto_base_id") ?? "",
        ),
        entidad_id: String(formData.get("entidad_id") ?? ""),
        valor: Number(formData.get("valor") ?? 0),
        observacion: String(formData.get("observacion") ?? ""),
        soporte,
      },
    );

    return Response.json(resultado.body, {
      status: resultado.status,
    });
  } catch (error) {
    console.error("Error registrando anticipo:", error);

    return Response.json(
      {
        ok: false,
        message: "No fue posible registrar el anticipo.",
      },
      { status: 500 },
    );
  }
}
