import ExcelJS from "exceljs";
import {
  COLUMNAS_OBLIGATORIAS_NOMINA_GRUPAL,
  COLUMNAS_OPCIONALES_NOMINA_GRUPAL,
  type ColumnaNominaGrupal,
  type FilaExcelNominaGrupalRaw,
  type ResultadoLecturaExcelNominaGrupal,
} from "./nomina-grupal.types";
import { normalizarFilaNominaGrupal } from "./nomina-grupal.validators";

const MAX_FILAS_BUSQUEDA_ENCABEZADO = 10;
const MAX_FILAS_PERMITIDAS = 5000;

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

  valor_bruto: "valor_bruto",
  valorbruto: "valor_bruto",
  bruto: "valor_bruto",

  valor_retenciones: "valor_retenciones",
  retenciones: "valor_retenciones",
  valor_retencion: "valor_retenciones",

  valor_descuentos: "valor_descuentos",
  descuentos: "valor_descuentos",
  valor_descuento: "valor_descuentos",
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
