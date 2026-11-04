import { cookies } from "next/headers";
import { obtenerUsuarioAutenticado } from "@/modules/auth/auth.service";
import { registrarPagoNominaGrupalService } from "@/modules/solicitudes-pago/solicitudes-pago.service";
import type { MedioPagoSolicitud, RegistrarPagoNominaGrupalFilaInput } from "@/modules/solicitudes-pago/solicitudes-pago.types";

type PagoManifest = {
  detalle_nomina_id?: unknown;
  medio_pago?: unknown;
  numero_comprobante?: unknown;
  observacion?: unknown;
  archivo_campo?: unknown;
};

function texto(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies();
    const auth = await obtenerUsuarioAutenticado(cookieStore.get("session_token")?.value);
    if (!auth.body.ok || !auth.body.data) {
      return Response.json(auth.body, { status: auth.status });
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return Response.json({ ok: false, message: "La solicitud debe enviarse como multipart/form-data." }, { status: 400 });
    }

    const manifest = formData.get("pagos");
    if (typeof manifest !== "string") {
      return Response.json({ ok: false, message: "El manifiesto de pagos no es válido." }, { status: 400 });
    }

    let pagos: RegistrarPagoNominaGrupalFilaInput[];
    try {
      const rows: unknown = JSON.parse(manifest);
      if (!Array.isArray(rows)) throw new Error("invalid manifest");
      pagos = rows.map((row: PagoManifest) => {
        const soporte = formData.get(texto(row.archivo_campo));
        if (!(soporte instanceof File)) throw new Error("missing support");
        return {
          detalle_nomina_id: texto(row.detalle_nomina_id),
          medio_pago: texto(row.medio_pago) as MedioPagoSolicitud,
          numero_comprobante: texto(row.numero_comprobante) || null,
          observacion: texto(row.observacion) || null,
          soporte,
        };
      });
    } catch {
      return Response.json({ ok: false, message: "El manifiesto es inválido o falta un soporte por trabajador." }, { status: 400 });
    }

    const { id } = await context.params;
    const result = await registrarPagoNominaGrupalService(auth.body.data.usuario, id, pagos);
    return Response.json(result.body, { status: result.status });
  } catch (error) {
    console.error("Error registrando pagos de nómina grupal:", error);
    return Response.json({ ok: false, message: "No fue posible registrar los pagos de nómina grupal." }, { status: 500 });
  }
}
