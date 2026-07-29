import { cookies } from "next/headers";
import { obtenerUsuarioAutenticado } from "@/modules/auth/auth.service";
import { registrarDevolucionPrestamoService } from "@/modules/prestamos/prestamos.service";

export async function POST(request: Request) {
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

    const resultado = await registrarDevolucionPrestamoService(
      autenticacion.body.data.usuario,
      {
        prestamo_proyecto_id: String(
          formData.get("prestamo_proyecto_id") ?? "",
        ),
        valor: Number(formData.get("valor") ?? 0),
        observacion: String(formData.get("observacion") ?? ""),
        soporte,
      },
    );

    return Response.json(resultado.body, {
      status: resultado.status,
    });
  } catch (error) {
    console.error("Error registrando devolución de préstamo:", error);

    return Response.json(
      {
        ok: false,
        message: "No fue posible registrar la devolución.",
      },
      { status: 500 },
    );
  }
}
