import ExcelJS from "exceljs";
import {
  COLUMNAS_OBLIGATORIAS_NOMINA_GRUPAL,
  COLUMNAS_OPCIONALES_NOMINA_GRUPAL,
  type ColumnaNominaGrupal,
  type FilaExcelNominaGrupalRaw,
  type ResultadoLecturaExcelNominaGrupal,
} from "./nomina-grupal.types";
import {
  MEDIOS_PAGO_NOMINA_GRUPAL,
  TIPOS_CUENTA_NOMINA_GRUPAL,
  TIPOS_DOCUMENTO_NOMINA_GRUPAL,
  normalizarFilaNominaGrupal,
} from "./nomina-grupal.validators";

const MAX_FILAS_BUSQUEDA_ENCABEZADO = 10;
const MAX_FILAS_PERMITIDAS = 5000;
const PRIMERA_FILA_DATOS = 2;
const ULTIMA_FILA_DATOS = MAX_FILAS_PERMITIDAS + 1;

const ALIAS_COLUMNAS: Record<string, ColumnaNominaGrupal> = {
  tipo_documento: "tipo_documento",
  tipo_de_documento: "tipo_documento",
  tipodocumento: "tipo_documento",
  documento_tipo: "tipo_documento",

  numero_documento: "numero_documento",
  numero_de_documento: "numero_documento",
  numerodocumento: "numero_documento",
  documento: "numero_documento",
  cedula: "numero_documento",
  identificacion: "numero_documento",

  nombre_trabajador: "nombre_trabajador",
  nombre_del_trabajador: "nombre_trabajador",
  nombre_completo: "nombre_trabajador",
  trabajador: "nombre_trabajador",
  nombre: "nombre_trabajador",

  concepto_nomina: "concepto_nomina",
  concepto_de_nomina: "concepto_nomina",
  concepto: "concepto_nomina",

  medio_pago: "medio_pago",
  medio_de_pago: "medio_pago",
  mediopago: "medio_pago",
  forma_pago: "medio_pago",

  banco: "banco",
  entidad_bancaria: "banco",

  tipo_cuenta_bancaria: "tipo_cuenta_bancaria",
  tipo_de_cuenta_bancaria: "tipo_cuenta_bancaria",
  tipo_cuenta: "tipo_cuenta_bancaria",

  numero_cuenta_bancaria: "numero_cuenta_bancaria",
  numero_de_cuenta_bancaria: "numero_cuenta_bancaria",
  numero_cuenta: "numero_cuenta_bancaria",
  cuenta_bancaria: "numero_cuenta_bancaria",

  valor_total: "valor_total",
  valortotal: "valor_total",
  total: "valor_total",
  valor_a_pagar: "valor_total",
};

function normalizarEncabezado(valor: unknown): string {
  return String(valor ?? "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function obtenerValorCelda(celda: ExcelJS.Cell): unknown {
  const valor = celda.value;

  if (valor === null || valor === undefined) {
    return "";
  }

  if (typeof valor === "object") {
    if (valor instanceof Date) {
      return valor;
    }

    if ("result" in valor && valor.result !== undefined) {
      return valor.result;
    }

    if ("text" in valor && typeof valor.text === "string") {
      return valor.text;
    }

    if ("richText" in valor && Array.isArray(valor.richText)) {
      return valor.richText
        .map((segmento) => segmento.text)
        .join("");
    }

    if ("hyperlink" in valor && "text" in valor) {
      return valor.text;
    }
  }

  return valor;
}

function filaEstaVacia(fila: ExcelJS.Row): boolean {
  let tieneContenido = false;

  fila.eachCell({ includeEmpty: false }, (celda) => {
    const valor = obtenerValorCelda(celda);

    if (String(valor ?? "").trim() !== "") {
      tieneContenido = true;
    }
  });

  return !tieneContenido;
}

function obtenerMapaEncabezados(fila: ExcelJS.Row): Map<number, ColumnaNominaGrupal> {
  const mapa = new Map<number, ColumnaNominaGrupal>();

  fila.eachCell({ includeEmpty: true }, (celda, numeroColumna) => {
    const encabezado = normalizarEncabezado(obtenerValorCelda(celda));
    const columna = ALIAS_COLUMNAS[encabezado];

    if (columna) {
      mapa.set(numeroColumna, columna);
    }
  });

  return mapa;
}

function buscarFilaEncabezado(hoja: ExcelJS.Worksheet): {
  numeroFila: number;
  mapa: Map<number, ColumnaNominaGrupal>;
} {
  const limite = Math.min(
    hoja.rowCount,
    MAX_FILAS_BUSQUEDA_ENCABEZADO,
  );

  for (let numeroFila = 1; numeroFila <= limite; numeroFila += 1) {
    const fila = hoja.getRow(numeroFila);
    const mapa = obtenerMapaEncabezados(fila);
    const columnasEncontradas = new Set(mapa.values());

    const tieneTodasLasObligatorias =
      COLUMNAS_OBLIGATORIAS_NOMINA_GRUPAL.every((columna) =>
        columnasEncontradas.has(columna),
      );

    if (tieneTodasLasObligatorias) {
      return {
        numeroFila,
        mapa,
      };
    }
  }

  throw new Error(
    `No se encontró una fila de encabezados válida en las primeras ${MAX_FILAS_BUSQUEDA_ENCABEZADO} filas.`,
  );
}

function validarEncabezados(
  mapa: Map<number, ColumnaNominaGrupal>,
): void {
  const columnasEncontradas = Array.from(mapa.values());
  const columnasDuplicadas = columnasEncontradas.filter(
    (columna, indice) => columnasEncontradas.indexOf(columna) !== indice,
  );

  if (columnasDuplicadas.length > 0) {
    const duplicadasUnicas = Array.from(new Set(columnasDuplicadas));

    throw new Error(
      `El archivo contiene columnas duplicadas: ${duplicadasUnicas.join(", ")}.`,
    );
  }

  const columnasFaltantes = COLUMNAS_OBLIGATORIAS_NOMINA_GRUPAL.filter(
    (columna) => !columnasEncontradas.includes(columna),
  );

  if (columnasFaltantes.length > 0) {
    throw new Error(
      `Faltan columnas obligatorias en el archivo: ${columnasFaltantes.join(", ")}.`,
    );
  }
}

function construirFilaRaw(
  fila: ExcelJS.Row,
  mapa: Map<number, ColumnaNominaGrupal>,
): FilaExcelNominaGrupalRaw {
  const resultado: FilaExcelNominaGrupalRaw = {};

  for (const [numeroColumna, columna] of mapa.entries()) {
    resultado[columna] = obtenerValorCelda(fila.getCell(numeroColumna));
  }

  return resultado;
}

function seleccionarHoja(workbook: ExcelJS.Workbook): ExcelJS.Worksheet {
  const hoja = workbook.worksheets.find((item) => item.rowCount > 0);

  if (!hoja) {
    throw new Error("El archivo Excel no contiene hojas con información.");
  }

  return hoja;
}

function validarExtension(nombreArchivo?: string): void {
  if (!nombreArchivo) {
    return;
  }

  const nombreNormalizado = nombreArchivo.trim().toLowerCase();

  if (
    !nombreNormalizado.endsWith(".xlsx") &&
    !nombreNormalizado.endsWith(".xlsm")
  ) {
    throw new Error(
      "El archivo debe tener extensión .xlsx o .xlsm.",
    );
  }
}

export async function leerExcelNominaGrupal(input: {
  contenido: Buffer | ArrayBuffer | Uint8Array;
  nombre_archivo?: string;
}): Promise<ResultadoLecturaExcelNominaGrupal> {
  validarExtension(input.nombre_archivo);

  let buffer: Buffer;

  if (Buffer.isBuffer(input.contenido)) {
    buffer = input.contenido;
  } else if (input.contenido instanceof ArrayBuffer) {
    buffer = Buffer.from(new Uint8Array(input.contenido));
  } else {
    buffer = Buffer.from(
      input.contenido.buffer,
      input.contenido.byteOffset,
      input.contenido.byteLength,
    );
  }

  if (buffer.length === 0) {
    throw new Error("El archivo Excel está vacío.");
  }

  const workbook = new ExcelJS.Workbook();

  try {
    const contenidoExcel = buffer as unknown as Parameters<
      typeof workbook.xlsx.load
    >[0];

    await workbook.xlsx.load(contenidoExcel);
  } catch {
    throw new Error(
      "No fue posible leer el archivo Excel. Verifique que el archivo no esté dañado.",
    );
  }

  const hoja = seleccionarHoja(workbook);
  const encabezado = buscarFilaEncabezado(hoja);

  validarEncabezados(encabezado.mapa);

  const filas = [];

  for (
    let numeroFila = encabezado.numeroFila + 1;
    numeroFila <= hoja.rowCount;
    numeroFila += 1
  ) {
    const filaExcel = hoja.getRow(numeroFila);

    if (filaEstaVacia(filaExcel)) {
      continue;
    }

    const filaRaw = construirFilaRaw(filaExcel, encabezado.mapa);
    const filaNormalizada = normalizarFilaNominaGrupal(
      filaRaw,
      numeroFila,
    );

    filas.push(filaNormalizada);

    if (filas.length > MAX_FILAS_PERMITIDAS) {
      throw new Error(
        `El archivo supera el máximo permitido de ${MAX_FILAS_PERMITIDAS} filas.`,
      );
    }
  }

  if (filas.length === 0) {
    throw new Error(
      "El archivo Excel no contiene filas de nómina para procesar.",
    );
  }

  return {
    nombre_hoja: hoja.name,
    filas,
  };
}

export function obtenerColumnasPlantillaNominaGrupal(): string[] {
  return [
    ...COLUMNAS_OBLIGATORIAS_NOMINA_GRUPAL,
    ...COLUMNAS_OPCIONALES_NOMINA_GRUPAL,
  ];
}

export async function generarPlantillaNominaGrupalExcel(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Sistema Obras";
  workbook.created = new Date();

  const hoja = workbook.addWorksheet("Nomina grupal", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  const columnas = obtenerColumnasPlantillaNominaGrupal();

  hoja.addRow(columnas);
  hoja.columns = [19, 22, 30, 24, 20, 17, 22, 24, 25].map(
    (width) => ({ width }),
  );
  hoja.autoFilter = {
    from: "A1",
    to: "I1",
  };

  hoja.getRow(1).height = 30;
  hoja.getRow(1).eachCell((celda, numeroColumna) => {
    celda.font = {
      bold: true,
      color: { argb: "FFFFFFFF" },
    };
    celda.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: {
        argb: numeroColumna <= COLUMNAS_OBLIGATORIAS_NOMINA_GRUPAL.length
          ? "FF1D4ED8"
          : "FF64748B",
      },
    };
    celda.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    };
  });

  for (
    let numeroFila = PRIMERA_FILA_DATOS;
    numeroFila <= ULTIMA_FILA_DATOS;
    numeroFila += 1
  ) {
    const fila = hoja.getRow(numeroFila);

    fila.getCell(1).dataValidation = {
      type: "list",
      allowBlank: false,
      formulae: [`"${TIPOS_DOCUMENTO_NOMINA_GRUPAL.join(",")}"`],
      showErrorMessage: true,
      errorTitle: "Tipo de documento inválido",
      error: "Seleccione CC, CE u OTRO.",
    };
    fila.getCell(5).dataValidation = {
      type: "list",
      allowBlank: false,
      formulae: [`"${MEDIOS_PAGO_NOMINA_GRUPAL.join(",")}"`],
      showErrorMessage: true,
      errorTitle: "Medio de pago inválido",
      error: "Seleccione un medio de pago de la lista.",
    };
    fila.getCell(8).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: [`"${TIPOS_CUENTA_NOMINA_GRUPAL.join(",")}"`],
      showErrorMessage: true,
      errorTitle: "Tipo de cuenta inválido",
      error: "Seleccione AHORROS, CORRIENTE u OTRO.",
    };

    fila.getCell(2).numFmt = "@";
    fila.getCell(9).numFmt = "@";
    fila.getCell(6).numFmt = "#,##0.00";

    fila.eachCell({ includeEmpty: true }, (celda) => {
      celda.border = {
        bottom: {
          style: "hair",
          color: { argb: "FFD1D5DB" },
        },
      };
    });
  }

  const instrucciones = workbook.addWorksheet("Instrucciones", {
    views: [{ showGridLines: false }],
  });
  instrucciones.columns = [
    { width: 26 },
    { width: 15 },
    { width: 54 },
    { width: 62 },
  ];
  instrucciones.mergeCells("A1:D1");
  instrucciones.getCell("A1").value = "Plantilla de nómina grupal";
  instrucciones.getCell("A1").font = {
    bold: true,
    size: 16,
    color: { argb: "FFFFFFFF" },
  };
  instrucciones.getCell("A1").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1D4ED8" },
  };
  instrucciones.getCell("A1").alignment = { vertical: "middle" };
  instrucciones.getRow(1).height = 28;

  instrucciones.mergeCells("A2:D2");
  instrucciones.getCell("A2").value =
    "Complete una fila por trabajador y concepto. No cambie los encabezados de la hoja Nomina grupal.";
  instrucciones.getCell("A2").alignment = { wrapText: true };
  instrucciones.getRow(2).height = 32;

  instrucciones.addRow([]);
  instrucciones.addRow(["Campo", "Requerido", "Valores o formato", "Observación"]);

  const detalleCampos = [
    ["tipo_documento", "Sí", "CC, CE u OTRO", "Seleccione un valor de la lista."],
    ["numero_documento", "Sí", "Texto", "Se conserva como texto para no perder ceros iniciales."],
    ["nombre_trabajador", "Sí", "Texto", "Nombre completo del trabajador."],
    ["concepto_nomina", "Sí", "Texto", "Ejemplo: SALARIO, AUXILIO_TRANSPORTE o BONIFICACION."],
    ["medio_pago", "Sí", "TRANSFERENCIA, PSE, PORTAL, CONSIGNACION o EFECTIVO", "Seleccione un valor de la lista."],
    ["valor_total", "Sí", "Número mayor que cero", "Valor total que se pagará al trabajador; el sistema no aplica deducciones."],
    ["banco", "Condicional", "Texto", "Obligatorio para TRANSFERENCIA o CONSIGNACION."],
    ["tipo_cuenta_bancaria", "Condicional", "AHORROS, CORRIENTE u OTRO", "Obligatorio para TRANSFERENCIA o CONSIGNACION."],
    ["numero_cuenta_bancaria", "Condicional", "Texto", "Obligatorio para TRANSFERENCIA o CONSIGNACION."],
  ];

  detalleCampos.forEach((detalle) => instrucciones.addRow(detalle));

  instrucciones.getRow(4).eachCell((celda) => {
    celda.font = { bold: true, color: { argb: "FFFFFFFF" } };
    celda.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF334155" },
    };
  });

  instrucciones.eachRow((fila, numeroFila) => {
    if (numeroFila >= 5) {
      fila.height = 32;
      fila.eachCell((celda) => {
        celda.alignment = { vertical: "middle", wrapText: true };
      });
    }
  });

  instrucciones.addRow([]);
  instrucciones.mergeCells("A15:D15");
  instrucciones.getCell("A15").value = "Importante";
  instrucciones.getCell("A15").font = { bold: true };
  instrucciones.getCell("A15").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFDBEAFE" },
  };
  instrucciones.mergeCells("A16:D16");
  instrucciones.getCell("A16").value =
    `• El archivo admite hasta ${MAX_FILAS_PERMITIDAS.toLocaleString("es-CO")} filas de datos.`;
  instrucciones.mergeCells("A17:D17");
  instrucciones.getCell("A17").value =
    "• Para transferencia o consignación complete banco, tipo y número de cuenta.";
  instrucciones.mergeCells("A18:D18");
  instrucciones.getCell("A18").value =
    "• El valor total se registra directamente y no se calculan retenciones ni descuentos.";

  return Buffer.from(await workbook.xlsx.writeBuffer());
}
