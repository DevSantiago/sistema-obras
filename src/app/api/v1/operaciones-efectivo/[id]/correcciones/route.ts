import { cookies } from "next/headers";
import { obtenerUsuarioAutenticado } from "@/modules/auth/auth.service";
import { registrarCorreccionOperacionEfectivoService } from "@/modules/operaciones-efectivo/operaciones-efectivo.service";

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

    const { id } = await context.params;
    const body = (await request.json()) as {
      tipo?: string;
      direccion?: string;
      valor?: number;
      motivo?: string;
      observacion?: string;
    };
    const resultado =
      await registrarCorreccionOperacionEfectivoService(
        autenticacion.body.data.usuario,
        {
          operacion_efectivo_id: id,
          tipo: body.tipo as "AJUSTE" | "ANULACION",
          direccion:
            body.direccion as "INGRESO" | "EGRESO" | undefined,
          valor: body.valor,
          motivo: body.motivo ?? "",
          observacion: body.observacion,
        },
      );

    return Response.json(resultado.body, {
      status: resultado.status,
    });
  } catch (error) {
    console.error("Error corrigiendo operación de efectivo:", error);

    return Response.json(
      {
        ok: false,
        message: "No fue posible corregir la operación de efectivo.",
      },
      { status: 500 },
    );
  }
}
