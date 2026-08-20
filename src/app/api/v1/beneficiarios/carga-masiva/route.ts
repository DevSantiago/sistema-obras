import { cookies } from "next/headers";
import { obtenerUsuarioAutenticado } from "@/modules/auth/auth.service";
import {
  generarPlantillaProveedoresExcel,
  leerProveedoresExcel,
} from "@/modules/beneficiarios/beneficiarios.excel";
import {
  importarCargaMasivaProveedoresService,
  validarCargaMasivaProveedoresService,
} from "@/modules/beneficiarios/beneficiarios.service";

export const runtime = "nodejs";

async function autenticar() {
  const cookieStore = await cookies();
  return obtenerUsuarioAutenticado(cookieStore.get("session_token")?.value);
}

export async function GET() {
  try {
    const autenticacion = await autenticar();
    if (!autenticacion.body.ok || !autenticacion.body.data) {
      return Response.json(autenticacion.body, { status: autenticacion.status });
    }

    const contenido = await generarPlantillaProveedoresExcel();
    return new Response(new Uint8Array(contenido), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition":
          'attachment; filename="plantilla-carga-proveedores.xlsx"',
        "Content-Length": String(contenido.byteLength),
        "Cache-Control": "private, no-store, max-age=0",
      },
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "No fue posible generar la plantilla.",
      },
      { status: 400 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const autenticacion = await autenticar();
    if (!autenticacion.body.ok || !autenticacion.body.data) {
      return Response.json(autenticacion.body, { status: autenticacion.status });
    }

    const formData = await request.formData();
    const archivo = formData.get("archivo");
    const accion = String(formData.get("accion") ?? "VALIDAR").toUpperCase();

    if (!(archivo instanceof File) || archivo.size === 0) {
      return Response.json(
        { ok: false, message: "Debe seleccionar un archivo Excel." },
        { status: 400 },
      );
    }
    if (!archivo.name.toLowerCase().endsWith(".xlsx")) {
      return Response.json(
        { ok: false, message: "El archivo debe tener extensión .xlsx." },
        { status: 400 },
      );
    }
    if (archivo.size > 10 * 1024 * 1024) {
      return Response.json(
        { ok: false, message: "El archivo supera el máximo de 10 MB." },
        { status: 400 },
      );
    }
    if (!["VALIDAR", "IMPORTAR"].includes(accion)) {
      return Response.json(
        { ok: false, message: "La acción de carga no es válida." },
        { status: 400 },
      );
    }

    const filas = await leerProveedoresExcel(
      Buffer.from(await archivo.arrayBuffer()),
    );
    const resultado =
      accion === "IMPORTAR"
        ? await importarCargaMasivaProveedoresService(
            autenticacion.body.data.usuario,
            filas,
          )
        : await validarCargaMasivaProveedoresService(
            autenticacion.body.data.usuario,
            filas,
          );

    return Response.json({
      ok: true,
      message:
        accion === "IMPORTAR"
          ? `${"creados" in resultado ? resultado.creados : 0} proveedores fueron creados.`
          : "Archivo validado correctamente.",
      data: resultado,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No fue posible procesar el archivo.";
    return Response.json(
      { ok: false, message },
      { status: message === "No autorizado." ? 403 : 400 },
    );
  }
}
