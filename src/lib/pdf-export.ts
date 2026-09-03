type ColumnaPdf<T> = {
  titulo: string;
  valor: (fila: T) => string | number | null | undefined;
  ancho: number;
};

type ExportarTablaPdfOpciones<T> = {
  titulo: string;
  nombreArchivo: string;
  columnas: ColumnaPdf<T>[];
  filas: T[];
  filtros?: string[];
};

const ANCHO_PAGINA = 842;
const ALTO_PAGINA = 595;
const MARGEN = 32;
const ALTO_LINEA = 9;

function escaparTextoPdf(valor: string): string {
  return valor
    .replaceAll("\\", "\\\\")
    .replaceAll("(", "\\(")
    .replaceAll(")", "\\)");
}

function normalizarTextoPdf(valor: unknown): string {
  return String(valor ?? "—")
    .replaceAll("\u2013", "-")
    .replaceAll("\u2014", "-")
    .replaceAll("\u2018", "'")
    .replaceAll("\u2019", "'")
    .replaceAll("\u201c", '"')
    .replaceAll("\u201d", '"')
    .replaceAll("\u2026", "...")
    .replace(/[^\x20-\xFF]/g, "?");
}

function dividirTexto(valor: string, ancho: number, tamano = 7): string[] {
  const maximo = Math.max(5, Math.floor(ancho / (tamano * 0.52)));
  const palabras = normalizarTextoPdf(valor).split(/\s+/).filter(Boolean);
  const lineas: string[] = [];
  let linea = "";

  for (const palabraOriginal of palabras) {
    let palabra = palabraOriginal;
    while (palabra.length > maximo) {
      if (linea) {
        lineas.push(linea);
        linea = "";
      }
      lineas.push(palabra.slice(0, maximo));
      palabra = palabra.slice(maximo);
    }

    const candidata = linea ? `${linea} ${palabra}` : palabra;
    if (candidata.length > maximo) {
      lineas.push(linea);
      linea = palabra;
    } else {
      linea = candidata;
    }
  }

  if (linea) lineas.push(linea);
  return lineas.length > 0 ? lineas : ["—"];
}

function codificarWindows1252(valor: string): Uint8Array {
  const bytes = new Uint8Array(valor.length);
  for (let indice = 0; indice < valor.length; indice += 1) {
    const codigo = valor.charCodeAt(indice);
    bytes[indice] = codigo <= 255 ? codigo : 63;
  }
  return bytes;
}

export function crearTablaPdf<T>({
  titulo,
  columnas,
  filas,
  filtros = [],
}: Omit<ExportarTablaPdfOpciones<T>, "nombreArchivo">): Uint8Array {
  const anchoDisponible = ANCHO_PAGINA - MARGEN * 2;
  const sumaAnchos = columnas.reduce((total, columna) => total + columna.ancho, 0);
  const anchos = columnas.map((columna) =>
    (columna.ancho / sumaAnchos) * anchoDisponible,
  );
  const paginas: string[] = [];
  let contenido = "";
  let y = ALTO_PAGINA - MARGEN;

  const texto = (valor: string, x: number, posicionY: number, fuente = "F1", tamano = 7) => {
    contenido += `0.12 0.16 0.23 rg BT /${fuente} ${tamano} Tf 1 0 0 1 ${x.toFixed(2)} ${posicionY.toFixed(2)} Tm (${escaparTextoPdf(normalizarTextoPdf(valor))}) Tj ET\n`;
  };

  const rectangulo = (x: number, posicionY: number, ancho: number, alto: number, relleno: string) => {
    contenido += `${relleno} rg ${x.toFixed(2)} ${posicionY.toFixed(2)} ${ancho.toFixed(2)} ${alto.toFixed(2)} re f\n`;
  };

  const encabezado = () => {
    texto(titulo, MARGEN, y, "F2", 15);
    y -= 18;
    texto(
      `Generado: ${new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short" }).format(new Date())}`,
      MARGEN,
      y,
      "F1",
      7,
    );
    y -= 13;
    if (filtros.length > 0) {
      texto(`Filtros: ${filtros.join(" | ")}`, MARGEN, y, "F1", 7);
      y -= 14;
    }
    rectangulo(MARGEN, y - 13, anchoDisponible, 18, "0.90 0.94 0.98");
    let x = MARGEN + 3;
    columnas.forEach((columna, indice) => {
      texto(columna.titulo, x, y - 7, "F2", 7);
      x += anchos[indice];
    });
    y -= 19;
  };

  const cerrarPagina = () => {
    paginas.push(contenido);
    contenido = "";
    y = ALTO_PAGINA - MARGEN;
  };

  encabezado();
  filas.forEach((fila, indiceFila) => {
    const celdas = columnas.map((columna, indice) =>
      dividirTexto(String(columna.valor(fila) ?? "—"), anchos[indice] - 6),
    );
    const altoFila = Math.max(18, Math.max(...celdas.map((celda) => celda.length)) * ALTO_LINEA + 6);

    if (y - altoFila < MARGEN + 16) {
      cerrarPagina();
      encabezado();
    }

    if (indiceFila % 2 === 1) {
      rectangulo(MARGEN, y - altoFila, anchoDisponible, altoFila, "0.97 0.98 0.99");
    }

    let x = MARGEN + 3;
    celdas.forEach((lineas, indiceColumna) => {
      lineas.forEach((linea, indiceLinea) => {
        texto(linea, x, y - 10 - indiceLinea * ALTO_LINEA);
      });
      x += anchos[indiceColumna];
    });
    y -= altoFila;
  });

  if (filas.length === 0) texto("No hay resultados para exportar.", MARGEN, y - 10);
  cerrarPagina();

  const objetos: string[] = ["", "", "", ""];
  const referenciasPaginas: number[] = [];
  paginas.forEach((pagina) => {
    const numeroPagina = objetos.length + 1;
    const numeroContenido = numeroPagina + 1;
    referenciasPaginas.push(numeroPagina);
    objetos.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${ANCHO_PAGINA} ${ALTO_PAGINA}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${numeroContenido} 0 R >>`,
    );
    objetos.push(`<< /Length ${pagina.length} >>\nstream\n${pagina}endstream`);
  });
  objetos[0] = "<< /Type /Catalog /Pages 2 0 R >>";
  objetos[1] = `<< /Type /Pages /Kids [${referenciasPaginas.map((numero) => `${numero} 0 R`).join(" ")}] /Count ${referenciasPaginas.length} >>`;
  objetos[2] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>";
  objetos[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>";

  let pdf = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
  const offsets = [0];
  objetos.forEach((objeto, indice) => {
    offsets.push(pdf.length);
    pdf += `${indice + 1} 0 obj\n${objeto}\nendobj\n`;
  });
  const inicioXref = pdf.length;
  pdf += `xref\n0 ${objetos.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objetos.length + 1} /Root 1 0 R >>\nstartxref\n${inicioXref}\n%%EOF`;
  return codificarWindows1252(pdf);
}

export function descargarTablaPdf<T>(opciones: ExportarTablaPdfOpciones<T>) {
  const contenido = crearTablaPdf(opciones);
  const buffer = new ArrayBuffer(contenido.byteLength);
  new Uint8Array(buffer).set(contenido);
  const blob = new Blob([buffer], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = opciones.nombreArchivo;
  enlace.click();
  URL.revokeObjectURL(url);
}
