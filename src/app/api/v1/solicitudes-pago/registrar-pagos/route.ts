import { obtenerUsuarioAutenticado } from "@/modules/auth/auth.service";
import { registrarTransferenciasService } from "@/modules/solicitudes-pago/solicitudes-pago.service";
import type { RegistrarTransferenciaLoteInput } from "@/modules/solicitudes-pago/solicitudes-pago.types";
import { cookies } from "next/headers";

type PagoManifest = {
  solicitud_id?: unknown;
  fecha_pago?: unknown;
  numero_comprobante?: unknown;
  observacion?: unknown;
  archivo_campo?: unknown;
};

function obtenerTexto(valor: unknown): string {
  return typeof valor === "string" ? valor.trim() : "";
}

async function obtenerUsuarioSesionDesdeCookie() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;

  return obtenerUsuarioAutenticado(sessionToken);
}

function leerPagos(formData: FormData): RegistrarTransferenciaLoteInput[] | null {
  const manifiesto = formData.get("pagos");

  if (typeof manifiesto !== "string") {
    return null;
  }

  try {
    const datos: unknown = JSON.parse(manifiesto);

    if (!Array.isArray(datos)) {
      return null;
    }

    return datos.map((item: PagoManifest) => {
      const campoArchivo = obtenerTexto(item.archivo_campo);
      const soporte = formData.get(campoArchivo);

      if (!(soporte instanceof File)) {
        throw new Error("Cada transferencia debe incluir su soporte.");
      }

      return {
        solicitud_id: obtenerTexto(item.solicitud_id),
        fecha_pago: obtenerTexto(item.fecha_pago),
        numero_comprobante: obtenerTexto(item.numero_comprobante),
        observacion: obtenerTexto(item.observacion) || null,
        soporte,
      };
    });
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const resultadoAutenticacion =
      await obtenerUsuarioSesionDesdeCookie();

    if (
      !resultadoAutenticacion.body.ok ||
      !resultadoAutenticacion.body.data
    ) {
      return Response.json(resultadoAutenticacion.body, {
        status: resultadoAutenticacion.status,
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

    const pagos = leerPagos(formData);

    if (!pagos) {
      return Response.json(
        {
          ok: false,
          message:
            "El manifiesto de pagos es inválido o falta un soporte.",
        },
        { status: 400 },
      );
    }

    const resultado = await registrarTransferenciasService(
      resultadoAutenticacion.body.data.usuario,
      pagos,
    );

    return Response.json(resultado.body, {
      status: resultado.status,
    });
  } catch (error) {
    console.error("Error registrando transferencias:", error);

    return Response.json(
      {
        ok: false,
        message: "No fue posible registrar las transferencias.",
      },
      { status: 500 },
    );
  }
}
