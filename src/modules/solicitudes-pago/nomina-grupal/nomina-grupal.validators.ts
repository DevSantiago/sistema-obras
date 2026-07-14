import type { MedioPagoSolicitud } from "../solicitudes-pago.types";
import type {
  BeneficiarioNominaGrupalRepositoryResult,
  ErrorValidacionNominaGrupal,
  FilaExcelNominaGrupalRaw,
  FilaNominaGrupalNormalizada,
  FilaNominaGrupalValidada,
  ResumenValidacionNominaGrupal,
  ResultadoValidacionNominaGrupal,
} from "./nomina-grupal.types";

const MEDIOS_PAGO_VALIDOS: MedioPagoSolicitud[] = [
  "TRANSFERENCIA",
  "CONSIGNACION",
  "EFECTIVO",
];

const TIPOS_DOCUMENTO_VALIDOS = [
  "CC",
  "CE",
  "OTRO",
] as const;

const TIPOS_CUENTA_VALIDOS = ["AHORROS", "CORRIENTE", "OTRO"] as const;

type TipoDocumentoValido = (typeof TIPOS_DOCUMENTO_VALIDOS)[number];
type TipoCuentaValido = (typeof TIPOS_CUENTA_VALIDOS)[number];

function normalizarTexto(valor: unknown): string {
  if (valor === null || valor === undefined) {
    return "";
  }

  return String(valor).trim();
}

function normalizarTextoDominio(valor: unknown): string {
  return normalizarTexto(valor)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s-]+/g, "_")
    .toUpperCase();
}

function normalizarTextoOpcional(valor: unknown): string | null {
  const texto = normalizarTexto(valor);

  return texto || null;
}

function normalizarDocumento(valor: unknown): string {
  return normalizarTexto(valor)
    .replace(/\s+/g, "")
    .replace(/[.,-]/g, "")
    .toUpperCase();
}

function normalizarNombre(valor: unknown): string {
  return normalizarTexto(valor).replace(/\s+/g, " ").toUpperCase();
}

function convertirNumero(valor: unknown): number | null {
  if (valor === null || valor === undefined || valor === "") {
    return 0;
  }

  if (typeof valor === "number") {
    return Number.isFinite(valor) ? valor : null;
  }

  if (typeof valor !== "string") {
    return null;
  }

  const texto = valor.trim();

  if (!texto) {
    return 0;
  }

  let valorNormalizado = texto.replace(/\$/g, "").replace(/\s/g, "");
  const contienePunto = valorNormalizado.includes(".");
  const contieneComa = valorNormalizado.includes(",");

  if (contienePunto && contieneComa) {
    const ultimoPunto = valorNormalizado.lastIndexOf(".");
    const ultimaComa = valorNormalizado.lastIndexOf(",");

    if (ultimaComa > ultimoPunto) {
      valorNormalizado = valorNormalizado.replace(/\./g, "").replace(",", ".");
    } else {
      valorNormalizado = valorNormalizado.replace(/,/g, "");
    }
  } else if (contieneComa) {
    const partes = valorNormalizado.split(",");

    if (partes.length === 2 && partes[1].length <= 2) {
      valorNormalizado = `${partes[0].replace(/\./g, "")}.${partes[1]}`;
    } else {
      valorNormalizado = valorNormalizado.replace(/,/g, "");
    }
  } else if (contienePunto) {
    const partes = valorNormalizado.split(".");

    if (partes.length > 2) {
      valorNormalizado = partes.join("");
    } else if (partes.length === 2 && partes[1].length === 3) {
      valorNormalizado = partes.join("");
    }
  }

  const numero = Number(valorNormalizado);

  return Number.isFinite(numero) ? numero : null;
}

function agregarError(
  errores: ErrorValidacionNominaGrupal[],
  campo: string,
  codigo: string,
  mensaje: string,
): void {
  errores.push({ campo, codigo, mensaje });
}

function medioPagoEsValido(
  medioPago: string,
): medioPago is MedioPagoSolicitud {
  return MEDIOS_PAGO_VALIDOS.includes(medioPago as MedioPagoSolicitud);
}

function tipoDocumentoEsValido(
  tipoDocumento: string,
): tipoDocumento is TipoDocumentoValido {
  return TIPOS_DOCUMENTO_VALIDOS.includes(
    tipoDocumento as TipoDocumentoValido,
  );
}

function tipoCuentaEsValido(tipoCuenta: string): tipoCuenta is TipoCuentaValido {
  return TIPOS_CUENTA_VALIDOS.includes(tipoCuenta as TipoCuentaValido);
}

export function normalizarFilaNominaGrupal(
  fila: FilaExcelNominaGrupalRaw,
  numeroFila: number,
): FilaNominaGrupalNormalizada {
  const valorBruto = convertirNumero(fila.valor_bruto);
  const valorRetenciones = convertirNumero(fila.valor_retenciones);
  const valorDescuentos = convertirNumero(fila.valor_descuentos);

  const valorBrutoNormalizado = valorBruto ?? 0;
  const valorRetencionesNormalizado = valorRetenciones ?? 0;
  const valorDescuentosNormalizado = valorDescuentos ?? 0;

  return {
    numero_fila: numeroFila,
    tipo_documento: normalizarTextoDominio(fila.tipo_documento),
    numero_documento: normalizarDocumento(fila.numero_documento),
    nombre_trabajador: normalizarNombre(fila.nombre_trabajador),
    concepto_nomina: normalizarTextoDominio(fila.concepto_nomina),
    medio_pago: normalizarTextoDominio(
      fila.medio_pago,
    ) as MedioPagoSolicitud | "",
    banco: normalizarTextoOpcional(fila.banco),
    tipo_cuenta_bancaria:
      normalizarTextoDominio(fila.tipo_cuenta_bancaria) || null,
    numero_cuenta_bancaria: normalizarTextoOpcional(
      fila.numero_cuenta_bancaria,
    ),
    valor_bruto: valorBrutoNormalizado,
    valor_retenciones: valorRetencionesNormalizado,
    valor_descuentos: valorDescuentosNormalizado,
    valor_neto:
      valorBrutoNormalizado -
      valorRetencionesNormalizado -
      valorDescuentosNormalizado,
  };
}

export function validarFilaNominaGrupal(input: {
  filaRaw: FilaExcelNominaGrupalRaw;
  filaNormalizada: FilaNominaGrupalNormalizada;
  beneficiario: BeneficiarioNominaGrupalRepositoryResult | null;
}): FilaNominaGrupalValidada {
  const { filaRaw, filaNormalizada, beneficiario } = input;
  const errores: ErrorValidacionNominaGrupal[] = [];

  if (!filaNormalizada.tipo_documento) {
    agregarError(
      errores,
      "tipo_documento",
      "TIPO_DOCUMENTO_OBLIGATORIO",
      "El tipo de documento es obligatorio.",
    );
  } else if (!tipoDocumentoEsValido(filaNormalizada.tipo_documento)) {
    agregarError(
      errores,
      "tipo_documento",
      "TIPO_DOCUMENTO_INVALIDO",
      "El tipo de documento no es válido.",
    );
  }

  if (!filaNormalizada.numero_documento) {
    agregarError(
      errores,
      "numero_documento",
      "NUMERO_DOCUMENTO_OBLIGATORIO",
      "El número de documento es obligatorio.",
    );
  }

  if (!filaNormalizada.nombre_trabajador) {
    agregarError(
      errores,
      "nombre_trabajador",
      "NOMBRE_TRABAJADOR_OBLIGATORIO",
      "El nombre del trabajador es obligatorio.",
    );
  }

  if (!filaNormalizada.concepto_nomina) {
    agregarError(
      errores,
      "concepto_nomina",
      "CONCEPTO_NOMINA_OBLIGATORIO",
      "El concepto de nómina es obligatorio.",
    );
  }

  if (!filaNormalizada.medio_pago) {
    agregarError(
      errores,
      "medio_pago",
      "MEDIO_PAGO_OBLIGATORIO",
      "El medio de pago es obligatorio.",
    );
  } else if (!medioPagoEsValido(filaNormalizada.medio_pago)) {
    agregarError(
      errores,
      "medio_pago",
      "MEDIO_PAGO_INVALIDO",
      "El medio de pago no es válido.",
    );
  }

  const valorBrutoOriginal = convertirNumero(filaRaw.valor_bruto);
  const valorRetencionesOriginal = convertirNumero(filaRaw.valor_retenciones);
  const valorDescuentosOriginal = convertirNumero(filaRaw.valor_descuentos);

  if (valorBrutoOriginal === null) {
    agregarError(
      errores,
      "valor_bruto",
      "VALOR_BRUTO_INVALIDO",
      "El valor bruto debe ser numérico.",
    );
  } else if (filaNormalizada.valor_bruto <= 0) {
    agregarError(
      errores,
      "valor_bruto",
      "VALOR_BRUTO_NO_POSITIVO",
      "El valor bruto debe ser mayor a cero.",
    );
  }

  if (valorRetencionesOriginal === null) {
    agregarError(
      errores,
      "valor_retenciones",
      "VALOR_RETENCIONES_INVALIDO",
      "El valor de las retenciones debe ser numérico.",
    );
  } else if (filaNormalizada.valor_retenciones < 0) {
    agregarError(
      errores,
      "valor_retenciones",
      "VALOR_RETENCIONES_NEGATIVO",
      "El valor de las retenciones no puede ser negativo.",
    );
  }

  if (valorDescuentosOriginal === null) {
    agregarError(
      errores,
      "valor_descuentos",
      "VALOR_DESCUENTOS_INVALIDO",
      "El valor de los descuentos debe ser numérico.",
    );
  } else if (filaNormalizada.valor_descuentos < 0) {
    agregarError(
      errores,
      "valor_descuentos",
      "VALOR_DESCUENTOS_NEGATIVO",
      "El valor de los descuentos no puede ser negativo.",
    );
  }

  if (filaNormalizada.valor_neto < 0) {
    agregarError(
      errores,
      "valor_neto",
      "VALOR_NETO_NEGATIVO",
      "El valor neto no puede ser negativo.",
    );
  }

  if (
    filaNormalizada.medio_pago === "TRANSFERENCIA" ||
    filaNormalizada.medio_pago === "CONSIGNACION"
  ) {
    if (!filaNormalizada.banco) {
      agregarError(
        errores,
        "banco",
        "BANCO_OBLIGATORIO",
        "El banco es obligatorio para transferencia o consignación.",
      );
    }

    if (!filaNormalizada.tipo_cuenta_bancaria) {
      agregarError(
        errores,
        "tipo_cuenta_bancaria",
        "TIPO_CUENTA_OBLIGATORIO",
        "El tipo de cuenta bancaria es obligatorio para transferencia o consignación.",
      );
    } else if (!tipoCuentaEsValido(filaNormalizada.tipo_cuenta_bancaria)) {
      agregarError(
        errores,
        "tipo_cuenta_bancaria",
        "TIPO_CUENTA_INVALIDO",
        "El tipo de cuenta bancaria no es válido.",
      );
    }

    if (!filaNormalizada.numero_cuenta_bancaria) {
      agregarError(
        errores,
        "numero_cuenta_bancaria",
        "NUMERO_CUENTA_OBLIGATORIO",
        "El número de cuenta bancaria es obligatorio para transferencia o consignación.",
      );
    }
  }

  if (beneficiario && beneficiario.tipo_beneficiario !== "TRABAJADOR") {
    agregarError(
      errores,
      "numero_documento",
      "BENEFICIARIO_NO_ES_TRABAJADOR",
      "El beneficiario asociado al documento no es de tipo TRABAJADOR.",
    );
  }

  if (beneficiario && !beneficiario.activo) {
    agregarError(
      errores,
      "numero_documento",
      "BENEFICIARIO_INACTIVO",
      "El trabajador asociado al documento está inactivo.",
    );
  }

  if (
    beneficiario &&
    filaNormalizada.nombre_trabajador &&
    normalizarNombre(beneficiario.nombre) !== filaNormalizada.nombre_trabajador
  ) {
    agregarError(
      errores,
      "nombre_trabajador",
      "NOMBRE_NO_COINCIDE",
      "El nombre del trabajador no coincide con el beneficiario registrado.",
    );
  }

  if (errores.length > 0) {
    return {
      ...filaNormalizada,
      beneficiario_id: beneficiario?.id ?? null,
      estado_validacion: "INVALIDO",
      errores_validacion: errores,
    };
  }

  if (!beneficiario) {
    return {
      ...filaNormalizada,
      beneficiario_id: null,
      estado_validacion: "PENDIENTE_BENEFICIARIO",
      errores_validacion: [
        {
          campo: "numero_documento",
          codigo: "BENEFICIARIO_NO_EXISTE",
          mensaje:
            "El trabajador no existe y debe crearse o asociarse antes de continuar.",
        },
      ],
    };
  }

  return {
    ...filaNormalizada,
    beneficiario_id: beneficiario.id,
    estado_validacion: "VALIDO",
    errores_validacion: [],
  };
}

export function validarDuplicadosDentroDelArchivo(
  filas: FilaNominaGrupalValidada[],
): FilaNominaGrupalValidada[] {
  const ocurrencias = new Map<string, number[]>();

  for (const fila of filas) {
    const clave = [
      fila.tipo_documento,
      fila.numero_documento,
      fila.concepto_nomina,
    ].join("|");

    const filasEncontradas = ocurrencias.get(clave) ?? [];
    filasEncontradas.push(fila.numero_fila);
    ocurrencias.set(clave, filasEncontradas);
  }

  return filas.map((fila) => {
    const clave = [
      fila.tipo_documento,
      fila.numero_documento,
      fila.concepto_nomina,
    ].join("|");

    const numerosFila = ocurrencias.get(clave) ?? [];

    if (numerosFila.length <= 1) {
      return fila;
    }

    const yaTieneError = fila.errores_validacion.some(
      (error) => error.codigo === "FILA_DUPLICADA_ARCHIVO",
    );

    if (yaTieneError) {
      return fila;
    }

    return {
      ...fila,
      estado_validacion: "INVALIDO",
      errores_validacion: [
        ...fila.errores_validacion,
        {
          campo: "numero_documento",
          codigo: "FILA_DUPLICADA_ARCHIVO",
          mensaje: `La combinación documento y concepto está repetida en las filas ${numerosFila.join(
            ", ",
          )}.`,
        },
      ],
    };
  });
}

export function construirResumenNominaGrupal(
  filas: FilaNominaGrupalValidada[],
): ResumenValidacionNominaGrupal {
  return filas.reduce<ResumenValidacionNominaGrupal>(
    (resumen, fila) => {
      resumen.total_filas += 1;

      if (fila.estado_validacion === "VALIDO") {
        resumen.filas_validas += 1;
      }

      if (fila.estado_validacion === "INVALIDO") {
        resumen.filas_invalidas += 1;
      }

      if (fila.estado_validacion === "PENDIENTE_BENEFICIARIO") {
        resumen.filas_pendientes_beneficiario += 1;
      }

      resumen.valor_bruto_total += fila.valor_bruto;
      resumen.valor_retenciones_total += fila.valor_retenciones;
      resumen.valor_descuentos_total += fila.valor_descuentos;
      resumen.valor_neto_total += fila.valor_neto;

      return resumen;
    },
    {
      total_filas: 0,
      filas_validas: 0,
      filas_invalidas: 0,
      filas_pendientes_beneficiario: 0,
      valor_bruto_total: 0,
      valor_retenciones_total: 0,
      valor_descuentos_total: 0,
      valor_neto_total: 0,
    },
  );
}

export function construirResultadoValidacionNominaGrupal(
  filas: FilaNominaGrupalValidada[],
): ResultadoValidacionNominaGrupal {
  const filasConDuplicados = validarDuplicadosDentroDelArchivo(filas);

  return {
    filas: filasConDuplicados,
    resumen: construirResumenNominaGrupal(filasConDuplicados),
  };
}

export function nominaGrupalPuedeCrearse(
  resultado: ResultadoValidacionNominaGrupal,
): boolean {
  return (
    resultado.resumen.total_filas > 0 &&
    resultado.resumen.filas_invalidas === 0 &&
    resultado.resumen.filas_pendientes_beneficiario === 0
  );
}
