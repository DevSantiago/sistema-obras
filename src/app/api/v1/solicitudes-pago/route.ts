import { obtenerUsuarioAutenticado } from "@/modules/auth/auth.service";
import {
  crearSolicitudNominaIndividualService,
  crearSolicitudPagoImpuestoService,
  crearSolicitudPagoProveedorService,
  listarSolicitudesPagoService,
  registrarAdjuntosSolicitudPagoService,
} from "@/modules/solicitudes-pago/solicitudes-pago.service";
import type {
  CrearSolicitudNominaIndividualInput,
  CrearSolicitudPagoImpuestoInput,
  CrearSolicitudPagoProveedorInput,
  ServiceResponse,
  SolicitudPagoListFilters,
  SolicitudPagoListado,
} from "@/modules/solicitudes-pago/solicitudes-pago.types";
import type { UsuarioSesion } from "@/modules/auth/auth.types";
import { cookies } from "next/headers";

type JsonObject = Record<string, unknown>;

type DatosSolicitudCreada = {
  solicitud: SolicitudPagoListado;
};

type ResultadoCreacionSolicitud = ServiceResponse<DatosSolicitudCreada>;

type SolicitudMultipart = {
  body: JsonObject;
  archivos: File[];
};

const CAMPOS_NUMERICOS = new Set([
  "valor_bruto",
  "valor_impuestos",
  "valor_retenciones",
  "valor_descuentos",
]);

async function obtenerUsuarioSesionDesdeCookie() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;

  return obtenerUsuarioAutenticado(sessionToken);
}

function esObjetoJson(valor: unknown): valor is JsonObject {
  return (
    typeof valor === "object" &&
    valor !== null &&
    !Array.isArray(valor)
  );
}

function normalizarTextoDominio(valor: unknown): string {
  return typeof valor === "string" ? valor.trim().toUpperCase() : "";
}

function obtenerTipoSolicitud(body: JsonObject): string {
  return normalizarTextoDominio(body.tipo_solicitud);
}

function obtenerModalidadNomina(body: JsonObject): string {
  return normalizarTextoDominio(body.modalidad_nomina);
}

function esSolicitudNominaIndividual(body: JsonObject): boolean {
  return (
    obtenerTipoSolicitud(body) === "PAGO_NOMINA" &&
    obtenerModalidadNomina(body) === "INDIVIDUAL"
  );
}

function esSolicitudPagoProveedor(body: JsonObject): boolean {
  return obtenerTipoSolicitud(body) === "PAGO_PROVEEDOR";
}

function esSolicitudPagoImpuesto(body: JsonObject): boolean {
  return obtenerTipoSolicitud(body) === "PAGO_IMPUESTO";
}

function convertirValorFormulario(
  campo: string,
  valor: FormDataEntryValue,
): unknown {
  if (valor instanceof File) {
    return valor;
  }

  const texto = valor.trim();

  if (CAMPOS_NUMERICOS.has(campo)) {
    return texto === "" ? "" : Number(texto);
  }

  return texto;
}

function convertirFormDataAObjeto(formData: FormData): SolicitudMultipart {
  const body: JsonObject = {};
  const archivos: File[] = [];

  for (const [campo, valor] of formData.entries()) {
    if (campo === "archivos") {
      if (valor instanceof File && valor.size > 0) {
        archivos.push(valor);
      }

      continue;
    }

    body[campo] = convertirValorFormulario(campo, valor);
  }

  return {
    body,
    archivos,
  };
}

async function leerCuerpoSolicitud(
  request: Request,
): Promise<
  | {
      ok: true;
      body: JsonObject;
      archivos: File[];
    }
  | {
      ok: false;
      response: Response;
    }
> {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";

  if (contentType.includes("multipart/form-data")) {
    try {
      const formData = await request.formData();
      const resultado = convertirFormDataAObjeto(formData);

      return {
        ok: true,
        body: resultado.body,
        archivos: resultado.archivos,
      };
    } catch {
      return {
        ok: false,
        response: Response.json(
          {
            ok: false,
            message:
              "El cuerpo multipart de la solicitud no pudo ser procesado.",
          },
          {
            status: 400,
          },
        ),
      };
    }
  }

  if (contentType.includes("application/json")) {
    let json: unknown;

    try {
      json = await request.json();
    } catch {
      return {
        ok: false,
        response: Response.json(
          {
            ok: false,
            message: "El cuerpo de la solicitud debe ser JSON válido.",
          },
          {
            status: 400,
          },
        ),
      };
    }

    if (!esObjetoJson(json)) {
      return {
        ok: false,
        response: Response.json(
          {
            ok: false,
            message:
              "El cuerpo de la solicitud debe ser un objeto JSON válido.",
          },
          {
            status: 400,
          },
        ),
      };
    }

    return {
      ok: true,
      body: json,
      archivos: [],
    };
  }

  return {
    ok: false,
    response: Response.json(
      {
        ok: false,
        message:
          "El tipo de contenido debe ser application/json o multipart/form-data.",
      },
      {
        status: 415,
      },
    ),
  };
}

function obtenerCarpetaAdjuntos(body: JsonObject): string {
  if (esSolicitudPagoProveedor(body)) {
    return "solicitudes-pago/proveedores";
  }

  if (esSolicitudPagoImpuesto(body)) {
    return "solicitudes-pago/impuestos";
  }

  if (esSolicitudNominaIndividual(body)) {
    return "solicitudes-pago/nomina-individual";
  }

  return "solicitudes-pago";
}

async function responderCreacionSolicitud(
  resultado: ResultadoCreacionSolicitud,
  archivos: File[],
  usuario: UsuarioSesion,
  body: JsonObject,
): Promise<Response> {
  if (
    resultado.status === 201 &&
    resultado.body.ok &&
    resultado.body.data &&
    archivos.length > 0
  ) {
    await registrarAdjuntosSolicitudPagoService({
      solicitudPagoId: resultado.body.data.solicitud.id,
      archivos,
      usuarioId: usuario.id,
      carpeta: obtenerCarpetaAdjuntos(body),
    });
  }

  return Response.json(resultado.body, {
    status: resultado.status,
  });
}

export async function GET(request: Request) {
  try {
    const resultadoAutenticacion = await obtenerUsuarioSesionDesdeCookie();

    if (!resultadoAutenticacion.body.ok || !resultadoAutenticacion.body.data) {
      return Response.json(resultadoAutenticacion.body, {
        status: resultadoAutenticacion.status,
      });
    }

    const { searchParams } = new URL(request.url);

    const filters: SolicitudPagoListFilters = {
      tipo_solicitud:
        searchParams.get("tipo_solicitud")?.trim().toUpperCase() || undefined,
      modalidad_nomina:
        searchParams.get("modalidad_nomina")?.trim().toUpperCase() || undefined,
      periodo_nomina:
        searchParams.get("periodo_nomina")?.trim() || undefined,
      tipo_impuesto:
        searchParams.get("tipo_impuesto")?.trim().toUpperCase() || undefined,
      periodo_impuesto:
        searchParams.get("periodo_impuesto")?.trim() || undefined,
      estado_actual:
        searchParams.get("estado_actual")?.trim().toUpperCase() || undefined,
      proyecto_base_id:
        searchParams.get("proyecto_base_id")?.trim() || undefined,
      centro_costo_id:
        searchParams.get("centro_costo_id")?.trim() || undefined,
      beneficiario_id:
        searchParams.get("beneficiario_id")?.trim() || undefined,
      medio_pago:
        searchParams.get("medio_pago")?.trim().toUpperCase() || undefined,
      busqueda: searchParams.get("busqueda")?.trim() || undefined,
    } as SolicitudPagoListFilters;

    const resultado = await listarSolicitudesPagoService(
      resultadoAutenticacion.body.data.usuario,
      filters,
    );

    return Response.json(resultado.body, {
      status: resultado.status,
    });
  } catch (error) {
    console.error("Error consultando solicitudes de pago:", error);

    return Response.json(
      {
        ok: false,
        message: "No fue posible consultar las solicitudes de pago.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(request: Request) {
  try {
    const resultadoAutenticacion = await obtenerUsuarioSesionDesdeCookie();

    if (!resultadoAutenticacion.body.ok || !resultadoAutenticacion.body.data) {
      return Response.json(resultadoAutenticacion.body, {
        status: resultadoAutenticacion.status,
      });
    }

    const resultadoCuerpo = await leerCuerpoSolicitud(request);

    if (!resultadoCuerpo.ok) {
      return resultadoCuerpo.response;
    }

    const body = resultadoCuerpo.body;
    const archivos = resultadoCuerpo.archivos;
    const usuario = resultadoAutenticacion.body.data.usuario;
    const tipoSolicitud = obtenerTipoSolicitud(body);
    const modalidadNomina = obtenerModalidadNomina(body);

    if (esSolicitudNominaIndividual(body)) {
      const resultado = await crearSolicitudNominaIndividualService(
        usuario,
        body as CrearSolicitudNominaIndividualInput,
      );

      return await responderCreacionSolicitud(
        resultado,
        archivos,
        usuario,
        body,
      );
    }

    if (esSolicitudPagoProveedor(body)) {
      const resultado = await crearSolicitudPagoProveedorService(
        usuario,
        body as CrearSolicitudPagoProveedorInput,
      );

      return await responderCreacionSolicitud(
        resultado,
        archivos,
        usuario,
        body,
      );
    }

    if (esSolicitudPagoImpuesto(body)) {
      const resultado = await crearSolicitudPagoImpuestoService(
        usuario,
        body as CrearSolicitudPagoImpuestoInput,
      );

      return await responderCreacionSolicitud(
        resultado,
        archivos,
        usuario,
        body,
      );
    }

    if (
      tipoSolicitud === "PAGO_NOMINA" &&
      modalidadNomina !== "INDIVIDUAL"
    ) {
      return Response.json(
        {
          ok: false,
          message:
            "La modalidad de nómina indicada todavía no está soportada por este endpoint.",
        },
        {
          status: 400,
        },
      );
    }

    return Response.json(
      {
        ok: false,
        message: "El tipo de solicitud indicado no está soportado.",
      },
      {
        status: 400,
      },
    );
  } catch (error) {
    console.error("Error creando solicitud de pago:", error);

    return Response.json(
      {
        ok: false,
        message: "No fue posible crear la solicitud de pago.",
      },
      {
        status: 500,
      },
    );
  }
}