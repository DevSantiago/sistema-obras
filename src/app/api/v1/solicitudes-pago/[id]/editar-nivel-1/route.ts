import { cookies } from "next/headers";
import { obtenerUsuarioAutenticado } from "@/modules/auth/auth.service";
import {
  agregarAdjuntosSolicitudNivel1Service,
  editarSolicitudAprobadorNivel1Service,
} from "@/modules/solicitudes-pago/solicitudes-pago.service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const cookieStore = await cookies();
    const resultadoAutenticacion = await obtenerUsuarioAutenticado(
      cookieStore.get("session_token")?.value,
    );

    if (!resultadoAutenticacion.body.ok || !resultadoAutenticacion.body.data) {
      return Response.json(resultadoAutenticacion.body, {
        status: resultadoAutenticacion.status,
      });
    }

    const { id } = await context.params;
    const contentType = request.headers.get("content-type") ?? "";
    let body: Record<string, unknown>;
    let archivos: File[] = [];

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      body = Object.fromEntries(
        Array.from(formData.entries()).filter(([campo]) => campo !== "archivos"),
      );
      archivos = formData.getAll("archivos").filter(
        (valor): valor is File => valor instanceof File && valor.size > 0,
      );

      const archivoInvalido = archivos.find(
        (archivo) =>
          !["application/pdf", "image/png", "image/jpeg"].includes(archivo.type) ||
          archivo.size > 10 * 1024 * 1024,
      );

      if (archivos.length > 10 || archivoInvalido) {
        return Response.json(
          {
            ok: false,
            message: archivos.length > 10
              ? "Puede adjuntar máximo 10 archivos."
              : "Los adjuntos deben ser PDF, PNG o JPEG y pesar máximo 10 MB.",
          },
          { status: 400 },
        );
      }
    } else {
      body = await request.json();
    }

    const resultado = await editarSolicitudAprobadorNivel1Service(
      resultadoAutenticacion.body.data.usuario,
      id,
      body,
    );

    if (resultado.status === 200 && archivos.length > 0) {
      await agregarAdjuntosSolicitudNivel1Service({
        usuarioAutenticado: resultadoAutenticacion.body.data.usuario,
        solicitudId: id,
        archivos,
      });
    }

    return Response.json(resultado.body, { status: resultado.status });
  } catch (error) {
    console.error("Error editando solicitud en aprobación nivel 1:", error);

    return Response.json(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "No fue posible editar la solicitud.",
      },
      { status: 500 },
    );
  }
}
