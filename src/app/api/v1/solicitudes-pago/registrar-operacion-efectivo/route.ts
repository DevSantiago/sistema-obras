import { cookies } from "next/headers";
import { obtenerUsuarioAutenticado } from "@/modules/auth/auth.service";
import { registrarOperacionEfectivoService } from "@/modules/solicitudes-pago/solicitudes-pago.service";
import type { RegistrarOperacionEfectivoInput } from "@/modules/solicitudes-pago/solicitudes-pago.types";

type DetalleManifest = {
  solicitud_id?: unknown;
  numero_comprobante?: unknown;
  observacion?: unknown;
  archivo_campo?: unknown;
};

type OperacionManifest = {
  valor_retirado?: unknown;
  observacion?: unknown;
  reintegrar_sobrante?: unknown;
  archivo_retiro_campo?: unknown;
  detalles?: unknown;
};

function obtenerTexto(valor: unknown): string {
  return typeof valor === "string" ? valor.trim() : "";
}

async function obtenerUsuarioSesionDesdeCookie() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;

  return obtenerUsuarioAutenticado(sessionToken);
}

function leerOperacion(
  formData: FormData,
): RegistrarOperacionEfectivoInput | null {
  const manifiesto = formData.get("operacion");

  if (typeof manifiesto !== "string") {
    return null;
  }

  try {
    const datos = JSON.parse(manifiesto) as OperacionManifest;
    const detalles = datos.detalles;
    const campoSoporteRetiro = obtenerTexto(
      datos.archivo_retiro_campo,
    );
    const soporteRetiro = formData.get(campoSoporteRetiro);

    if (!Array.isArray(detalles) || !(soporteRetiro instanceof File)) {
      return null;
    }

    return {
      valor_retirado:
        typeof datos.valor_retirado === "number"
          ? datos.valor_retirado
          : Number.NaN,
      observacion: obtenerTexto(datos.observacion) || null,
      reintegrar_sobrante: datos.reintegrar_sobrante === true,
      soporte_retiro: soporteRetiro,
      detalles: detalles.map((item: DetalleManifest) => {
        const campoArchivo = obtenerTexto(item.archivo_campo);
        const soporte = formData.get(campoArchivo);

        if (!(soporte instanceof File)) {
          throw new Error("Cada pago debe incluir su soporte.");
        }

        return {
          solicitud_id: obtenerTexto(item.solicitud_id),
          numero_comprobante:
            obtenerTexto(item.numero_comprobante) || null,
          observacion: obtenerTexto(item.observacion) || null,
          soporte,
        };
      }),
    };
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

    const operacion = leerOperacion(formData);

    if (!operacion) {
      return Response.json(
        {
          ok: false,
          message:
            "El manifiesto del retiro es inválido o falta un soporte.",
        },
        { status: 400 },
      );
    }

    const resultado = await registrarOperacionEfectivoService(
      resultadoAutenticacion.body.data.usuario,
      operacion,
    );

    return Response.json(resultado.body, {
      status: resultado.status,
    });
  } catch (error) {
    console.error("Error registrando retiro y pagos:", error);

    return Response.json(
      {
        ok: false,
        message: "No fue posible registrar el retiro y los pagos.",
      },
      { status: 500 },
    );
  }
}
