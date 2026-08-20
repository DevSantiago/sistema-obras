import ExcelJS from "exceljs";
import type { SolicitudProgramadaPago } from "./solicitudes-pago.types";

const FORMATEADOR_FECHA_HORA = new Intl.DateTimeFormat("es-CO", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Bogota",
});

function formatearFechaHora(valor?: string | Date | null): string {
  return valor ? FORMATEADOR_FECHA_HORA.format(new Date(valor)) : "";
}

function obtenerBeneficiario(solicitud: SolicitudProgramadaPago) {
  return solicitud.beneficiario ?? solicitud.proveedor ?? null;
}

export async function generarRelacionSolicitudesProgramadasExcel(
  solicitudes: SolicitudProgramadaPago[],
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Sistema Obras";
  workbook.created = new Date();

  const hoja = workbook.addWorksheet("Solicitudes programadas", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  hoja.columns = [
    { header: "Número de solicitud", key: "numero", width: 38 },
    { header: "Estado", key: "estado", width: 22 },
    { header: "Tipo de solicitud", key: "tipo", width: 24 },
    { header: "Proyecto", key: "proyecto", width: 28 },
    { header: "Centro de costo", key: "centro", width: 30 },
    { header: "Beneficiario", key: "beneficiario", width: 34 },
    { header: "Tipo de documento", key: "tipo_documento", width: 20 },
    { header: "Número de documento", key: "numero_documento", width: 22 },
    { header: "Banco", key: "banco", width: 24 },
    { header: "Tipo de cuenta", key: "tipo_cuenta", width: 18 },
    { header: "Número de cuenta", key: "numero_cuenta", width: 24 },
    { header: "Medio de pago", key: "medio_pago", width: 20 },
    { header: "Descripción", key: "descripcion", width: 42 },
    { header: "Valor bruto", key: "valor_bruto", width: 18 },
    { header: "Impuestos y retenciones", key: "retenciones", width: 24 },
    { header: "Descuentos", key: "descuentos", width: 18 },
    { header: "Valor neto", key: "valor_neto", width: 18 },
    { header: "Fecha de creación", key: "creado_en", width: 24 },
    { header: "Fecha aprobación nivel 1", key: "aprobado_1_en", width: 28 },
    { header: "Fecha aprobación nivel 2", key: "aprobado_2_en", width: 28 },
    { header: "Fecha de pago", key: "pagado_en", width: 24 },
  ];

  for (const solicitud of solicitudes) {
    const beneficiario = obtenerBeneficiario(solicitud);

    hoja.addRow({
      numero: solicitud.numero_solicitud ?? "",
      estado: solicitud.estado_actual,
      tipo: solicitud.tipo_solicitud,
      proyecto: solicitud.proyecto_base?.nombre ?? "",
      centro: solicitud.centro_costo?.nombre ?? "",
      beneficiario: beneficiario?.nombre ?? "",
      tipo_documento: beneficiario?.tipo_documento ?? "",
      numero_documento: beneficiario?.numero_documento ?? "",
      banco: solicitud.beneficiario?.banco ?? "",
      tipo_cuenta: solicitud.beneficiario?.tipo_cuenta_bancaria ?? "",
      numero_cuenta: solicitud.beneficiario?.numero_cuenta_bancaria ?? "",
      medio_pago: solicitud.medio_pago ?? "",
      descripcion: solicitud.descripcion,
      valor_bruto: solicitud.valor_bruto,
      retenciones: solicitud.valor_retenciones,
      descuentos: solicitud.valor_descuentos,
      valor_neto: solicitud.valor_neto,
      creado_en: formatearFechaHora(solicitud.creado_en),
      aprobado_1_en: formatearFechaHora(solicitud.aprobado_1_en),
      aprobado_2_en: formatearFechaHora(solicitud.aprobado_2_en),
      pagado_en: formatearFechaHora(solicitud.pagado_en),
    });
  }

  hoja.getRow(1).eachCell((celda) => {
    celda.font = { bold: true, color: { argb: "FFFFFFFF" } };
    celda.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1D4ED8" },
    };
    celda.alignment = { vertical: "middle", horizontal: "center" };
  });
  hoja.getRow(1).height = 26;
  hoja.autoFilter = { from: "A1", to: "U1" };

  for (const columna of ["N", "O", "P", "Q"]) {
    hoja.getColumn(columna).numFmt = '"$"#,##0';
  }

  const contenido = await workbook.xlsx.writeBuffer();
  return Buffer.from(contenido);
}
