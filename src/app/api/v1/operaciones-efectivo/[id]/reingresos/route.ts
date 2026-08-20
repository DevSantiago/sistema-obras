import { cookies } from "next/headers";
import { obtenerUsuarioAutenticado } from "@/modules/auth/auth.service";
import { registrarReingresoSobranteService } from "@/modules/operaciones-efectivo/operaciones-efectivo.service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const cookieStore = await cookies();
    const autenticacion = await obtenerUsuarioAutenticado(
      cookieStore.get("session_token")?.value,
    );

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
        { ok: false, message: "El soporte es obligatorio." },
        { status: 400 },
      );
    }

    const { id } = await context.params;
    const resultado = await registrarReingresoSobranteService(
      autenticacion.body.data.usuario,
      {
        operacion_efectivo_id: id,
        valor: Number(formData.get("valor") ?? 0),
        observacion: String(formData.get("observacion") ?? ""),
        soporte,
      },
    );

    return Response.json(resultado.body, {
      status: resultado.status,
    });
  } catch (error) {
    console.error("Error registrando reingreso de sobrante:", error);

    return Response.json(
      { ok: false, message: "No fue posible registrar el reingreso." },
      { status: 500 },
    );
  }
}
