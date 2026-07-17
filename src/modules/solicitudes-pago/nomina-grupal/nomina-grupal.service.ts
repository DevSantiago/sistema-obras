import type { UsuarioSesion } from "@/modules/auth/auth.types";
import { generarNumeroSolicitudPagoService } from "@/modules/secuencias/secuencias.service";
import {
  obtenerAccesoActivoUsuarioProyectoLineaRepository,
  obtenerCentroCostoActivoRepository,
  obtenerFondoActivoPorProyectoRepository,
  obtenerProyectoBaseActivoRepository,
} from "../solicitudes-pago.repository";
import type {
  EstadoSolicitudPago,
  MedioPagoSolicitud,
  ModalidadNomina,
  ServiceResponse,
  SolicitudPagoListado,
  TipoSolicitudPago,
} from "../solicitudes-pago.types";
import {
  buscarDuplicadosNominaGrupalRepository,
  crearSolicitudNominaGrupalRepository,
  obtenerAdjuntoNominaGrupalPorIdRepository,
  obtenerBeneficiariosNominaPorDocumentosRepository,
  obtenerNominaGrupalPorSolicitudIdRepository,
} from "./nomina-grupal.repository";
import type {
  BeneficiarioNominaGrupalRepositoryResult,
  CrearBeneficiarioNominaGrupalRepositoryInput,
  CrearDetalleNominaGrupalRepositoryInput,
  CrearNominaGrupalInput,
  CrearNominaGrupalResponse,
  DuplicadoNominaGrupalRepositoryResult,
  ErrorValidacionNominaGrupal,
  FilaNominaGrupalNormalizada,
  FilaNominaGrupalValidada,
  ResultadoValidacionNominaGrupal,
  ValidarNominaGrupalResponse,
} from "./nomina-grupal.types";
import {
  construirResultadoValidacionNominaGrupal,
  nominaGrupalPuedeCrearse,
  validarFilaNominaGrupal,
} from "./nomina-grupal.validators";

type ContextoFinancieroNominaGrupal = {
  proyectoBase: {
    id: string;
    nombre: string;
  };
  centroCosto: {
    id: string;
    proyecto_base_id: string;
    linea_negocio: string;
    fase_centro_costo: string;
  };
  fondo: {
    id: string;
  };
  centroCostoReferencia: string;
};

type SolicitudNominaGrupalRepositoryResult = {
  id: string;
  numero_solicitud: string;
  tipo_solicitud: string;
  modalidad_nomina: string | null;
  periodo_nomina: string | null;
  proyecto_base_id: string;
  fondo_id: string;
  centro_costo_id: string;
  beneficiario_id: string | null;
  proveedor_id: string | null;
  categoria_gasto: string | null;
  categoria_reembolso: string | null;
  concepto_nomina: string | null;
  medio_pago: string | null;
  adjunto_archivo_origen_id: string | null;
  descripcion: string;
  valor_bruto: unknown;
  valor_impuestos: unknown;
  valor_retenciones: unknown;
  valor_descuentos: unknown;
  valor_neto: unknown;
  estado_actual: string;
  creado_por: string | null;
  enviado_en: Date | null;
  creado_en: Date;
  actualizado_en: Date;
  proyecto_base?: {
    id: string;
    nombre: string;
    estado_proyecto: string;
  };
  centro_costo?: {
    id: string;
    nombre: string;
    linea_negocio: string;
    fase_centro_costo: string;
    estado_centro_costo: string;
  };
  beneficiario?: {
    id: string;
    nombre: string;
    tipo_beneficiario: string;
    tipo_documento: string | null;
    numero_documento: string | null;
  } | null;
  proveedor?: {
    id: string;
    nombre: string;
    tipo_documento: string;
    numero_documento: string;
  } | null;
  creador?: {
    id: string;
    nombre: string;
    correo: string;
  } | null;
};

function normalizarTexto(valor?: string | null): string {
  return valor?.trim() ?? "";
}

function normalizarTextoDominio(valor?: string | null): string {
  return normalizarTexto(valor).toUpperCase();
}

function obtenerPermisosUsuario(usuario: UsuarioSesion): string[] {
  if ("permisos" in usuario && Array.isArray(usuario.permisos)) {
    return usuario.permisos;
  }

  return [];
}

function usuarioTieneRol(usuario: UsuarioSesion, rol: string): boolean {
  return usuario.roles.includes(rol);
}

function usuarioEsAdministrador(usuario: UsuarioSesion): boolean {
  return usuarioTieneRol(usuario, "ADMINISTRADOR");
}

function usuarioEsDirector(usuario: UsuarioSesion): boolean {
  return usuarioTieneRol(usuario, "DIRECTOR");
}

function usuarioTienePermiso(
  usuario: UsuarioSesion,
  permiso: string,
): boolean {
  return (
    usuarioEsAdministrador(usuario) ||
    obtenerPermisosUsuario(usuario).includes(permiso)
  );
}

function usuarioPuedeCrearNominaGrupal(usuario: UsuarioSesion): boolean {
  if (usuarioEsAdministrador(usuario)) {
    return true;
  }

  return (
    usuarioEsDirector(usuario) &&
    usuarioTienePermiso(usuario, "CREAR_SOLICITUDES")
  );
}

function obtenerReferenciaCentroCosto(input: {
  linea_negocio: string;
  fase_centro_costo: string;
}): string {
  const lineaNegocio = normalizarTextoDominio(input.linea_negocio);
  const faseCentroCosto = normalizarTextoDominio(
    input.fase_centro_costo,
  );

  if (lineaNegocio === "OBRA" && faseCentroCosto === "LICITACION") {
    return "PRO-OBRA";
  }

  if (lineaNegocio === "OBRA" && faseCentroCosto === "EJECUCION") {
    return "OBRA";
  }

  if (
    lineaNegocio === "INTERVENTORIA" &&
    faseCentroCosto === "LICITACION"
  ) {
    return "PRO-INT";
  }

  if (
    lineaNegocio === "INTERVENTORIA" &&
    faseCentroCosto === "EJECUCION"
  ) {
    return "INT";
  }

  throw new Error(
    "La línea de negocio y la fase del centro de costo no permiten construir el consecutivo documental.",
  );
}

function obtenerPeriodoActualColombia(): string {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());

  const anio = partes.find((parte) => parte.type === "year")?.value;
  const mes = partes.find((parte) => parte.type === "month")?.value;

  if (!anio || !mes) {
    throw new Error("No fue posible determinar el periodo actual.");
  }

  return `${anio}-${mes}`;
}

function validarPeriodoNomina(periodo: string): string | null {
  if (!/^[0-9]{4}-(0[1-9]|1[0-2])$/.test(periodo)) {
    return "El periodo de nómina debe tener formato YYYY-MM.";
  }

  const periodoActual = obtenerPeriodoActualColombia();

  if (periodo.slice(0, 4) !== periodoActual.slice(0, 4)) {
    return "El periodo de nómina debe corresponder al año vigente.";
  }

  if (periodo > periodoActual) {
    return "El periodo de nómina no puede ser posterior al mes actual.";
  }

  return null;
}

function construirClaveDocumento(input: {
  tipo_documento: string;
  numero_documento: string;
}): string {
  return `${normalizarTextoDominio(input.tipo_documento)}|${normalizarTextoDominio(
    input.numero_documento,
  )}`;
}

function construirClaveDuplicado(input: {
  tipo_documento: string;
  numero_documento: string;
  concepto_nomina: string;
}): string {
  return `${construirClaveDocumento(input)}|${normalizarTextoDominio(
    input.concepto_nomina,
  )}`;
}

function convertirDecimalANumero(valor: unknown): number {
  if (typeof valor === "number") {
    return valor;
  }

  if (typeof valor === "string") {
    return Number(valor);
  }

  if (
    valor &&
    typeof valor === "object" &&
    "toNumber" in valor &&
    typeof valor.toNumber === "function"
  ) {
    return valor.toNumber();
  }

  return Number(valor);
}

function convertirSolicitudPago(
  solicitud: SolicitudNominaGrupalRepositoryResult,
): SolicitudPagoListado {
  return {
    id: solicitud.id,
    numero_solicitud: solicitud.numero_solicitud,
    tipo_solicitud: solicitud.tipo_solicitud as TipoSolicitudPago,
    modalidad_nomina: solicitud.modalidad_nomina as ModalidadNomina | null,
    periodo_nomina: solicitud.periodo_nomina,
    proyecto_base_id: solicitud.proyecto_base_id,
    fondo_id: solicitud.fondo_id,
    centro_costo_id: solicitud.centro_costo_id,
    beneficiario_id: solicitud.beneficiario_id,
    proveedor_id: solicitud.proveedor_id,
    categoria_gasto: solicitud.categoria_gasto,
    categoria_reembolso: null,
    concepto_nomina: solicitud.concepto_nomina,
    tipo_impuesto: null,
    periodo_impuesto: null,
    medio_pago: solicitud.medio_pago as MedioPagoSolicitud | null,
    adjunto_archivo_origen_id: solicitud.adjunto_archivo_origen_id,
    descripcion: solicitud.descripcion,
    valor_bruto: convertirDecimalANumero(solicitud.valor_bruto),
    valor_impuestos: convertirDecimalANumero(
      solicitud.valor_impuestos,
    ),
    valor_retenciones: convertirDecimalANumero(
      solicitud.valor_retenciones,
    ),
    valor_descuentos: convertirDecimalANumero(
      solicitud.valor_descuentos,
    ),
    valor_neto: convertirDecimalANumero(solicitud.valor_neto),
    estado_actual: solicitud.estado_actual as EstadoSolicitudPago,
    creado_por: solicitud.creado_por,
    enviado_en: solicitud.enviado_en,
    creado_en: solicitud.creado_en,
    actualizado_en: solicitud.actualizado_en,
    proyecto_base: solicitud.proyecto_base,
    centro_costo: solicitud.centro_costo,
    beneficiario: solicitud.beneficiario,
    proveedor: solicitud.proveedor,
    creador: solicitud.creador,
  };
}

async function obtenerContextoFinancieroNominaGrupal(input: {
  usuarioAutenticado: UsuarioSesion;
  proyectoBaseId: string;
  centroCostoId: string;
}): Promise<
  | {
      ok: true;
      data: ContextoFinancieroNominaGrupal;
    }
  | {
      ok: false;
      response: ServiceResponse<never>;
    }
> {
  const proyectoBase = await obtenerProyectoBaseActivoRepository(
    input.proyectoBaseId,
  );

  if (!proyectoBase) {
    return {
      ok: false,
      response: {
        status: 404,
        body: {
          ok: false,
          message: "El proyecto base no existe o está inactivo.",
        },
      },
    };
  }

  const centroCosto = await obtenerCentroCostoActivoRepository(
    input.centroCostoId,
  );

  if (!centroCosto) {
    return {
      ok: false,
      response: {
        status: 404,
        body: {
          ok: false,
          message: "El centro de costo no existe o está inactivo.",
        },
      },
    };
  }

  if (centroCosto.proyecto_base_id !== input.proyectoBaseId) {
    return {
      ok: false,
      response: {
        status: 400,
        body: {
          ok: false,
          message:
            "El centro de costo no pertenece al proyecto base seleccionado.",
        },
      },
    };
  }

  if (!usuarioEsAdministrador(input.usuarioAutenticado)) {
    const acceso =
      await obtenerAccesoActivoUsuarioProyectoLineaRepository(
        input.usuarioAutenticado.id,
        input.proyectoBaseId,
        centroCosto.linea_negocio,
      );

    if (!acceso) {
      return {
        ok: false,
        response: {
          status: 403,
          body: {
            ok: false,
            message:
              "No tiene acceso activo al proyecto y línea de negocio seleccionados.",
          },
        },
      };
    }
  }

  const fondo = await obtenerFondoActivoPorProyectoRepository(
    input.proyectoBaseId,
  );

  if (!fondo) {
    return {
      ok: false,
      response: {
        status: 404,
        body: {
          ok: false,
          message: "El proyecto base no tiene un fondo activo asociado.",
        },
      },
    };
  }

  let centroCostoReferencia: string;

  try {
    centroCostoReferencia = obtenerReferenciaCentroCosto({
      linea_negocio: centroCosto.linea_negocio,
      fase_centro_costo: centroCosto.fase_centro_costo,
    });
  } catch (error) {
    return {
      ok: false,
      response: {
        status: 400,
        body: {
          ok: false,
          message:
            error instanceof Error
              ? error.message
              : "No fue posible construir la referencia del centro de costo.",
        },
      },
    };
  }

  return {
    ok: true,
    data: {
      proyectoBase: {
        id: proyectoBase.id,
        nombre: proyectoBase.nombre,
      },
      centroCosto: {
        id: centroCosto.id,
        proyecto_base_id: centroCosto.proyecto_base_id,
        linea_negocio: centroCosto.linea_negocio,
        fase_centro_costo: centroCosto.fase_centro_costo,
      },
      fondo: {
        id: fondo.id,
      },
      centroCostoReferencia,
    },
  };
}

async function validarFilasNominaGrupal(
  filas: FilaNominaGrupalNormalizada[],
): Promise<ResultadoValidacionNominaGrupal> {
  const beneficiarios =
    await obtenerBeneficiariosNominaPorDocumentosRepository(
      filas.map((fila) => ({
        tipo_documento: fila.tipo_documento,
        numero_documento: fila.numero_documento,
      })),
    );

  const beneficiariosPorDocumento = new Map<
    string,
    BeneficiarioNominaGrupalRepositoryResult
  >();

  for (const beneficiario of beneficiarios) {
    if (
      beneficiario.tipo_documento &&
      beneficiario.numero_documento
    ) {
      beneficiariosPorDocumento.set(
        construirClaveDocumento({
          tipo_documento: beneficiario.tipo_documento,
          numero_documento: beneficiario.numero_documento,
        }),
        beneficiario,
      );
    }
  }

  const filasValidadas = filas.map((fila) => {
    const beneficiario =
      beneficiariosPorDocumento.get(
        construirClaveDocumento({
          tipo_documento: fila.tipo_documento,
          numero_documento: fila.numero_documento,
        }),
      ) ?? null;

    return validarFilaNominaGrupal({
      filaRaw: fila,
      filaNormalizada: fila,
      beneficiario,
    });
  });

  return construirResultadoValidacionNominaGrupal(filasValidadas);
}

function agregarErroresDuplicadosPersistidos(input: {
  resultado: ResultadoValidacionNominaGrupal;
  duplicados: DuplicadoNominaGrupalRepositoryResult[];
}): ResultadoValidacionNominaGrupal {
  if (input.duplicados.length === 0) {
    return input.resultado;
  }

  const duplicadosPorClave = new Map<
    string,
    DuplicadoNominaGrupalRepositoryResult[]
  >();

  for (const duplicado of input.duplicados) {
    const clave = construirClaveDuplicado(duplicado);
    const existentes = duplicadosPorClave.get(clave) ?? [];
    existentes.push(duplicado);
    duplicadosPorClave.set(clave, existentes);
  }

  const filasConDuplicados: FilaNominaGrupalValidada[] =
    input.resultado.filas.map((fila) => {
      const duplicadosFila =
        duplicadosPorClave.get(construirClaveDuplicado(fila)) ?? [];

      if (duplicadosFila.length === 0) {
        return fila;
      }

      const referencias = Array.from(
        new Set(
          duplicadosFila.map(
            (duplicado) => duplicado.numero_solicitud,
          ),
        ),
      );

      const error: ErrorValidacionNominaGrupal = {
        campo: "numero_documento",
        codigo: "NOMINA_DUPLICADA_EXISTENTE",
        mensaje: `Ya existe una solicitud no anulada para este trabajador, concepto y periodo: ${referencias.join(
          ", ",
        )}.`,
      };

      return {
        ...fila,
        estado_validacion: "INVALIDO",
        errores_validacion: [
          ...fila.errores_validacion.filter(
            (item) =>
              item.codigo !== "NOMINA_DUPLICADA_EXISTENTE",
          ),
          error,
        ],
      };
    });

  return construirResultadoValidacionNominaGrupal(
    filasConDuplicados,
  );
}

async function ejecutarValidacionCompleta(input: {
  proyectoBaseId: string;
  centroCostoId: string;
  periodoNomina: string;
  filas: FilaNominaGrupalNormalizada[];
}): Promise<ResultadoValidacionNominaGrupal> {
  const resultadoInicial = await validarFilasNominaGrupal(input.filas);

  const combinaciones = resultadoInicial.filas
    .filter(
      (fila) =>
        fila.estado_validacion !== "INVALIDO" &&
        fila.tipo_documento &&
        fila.numero_documento &&
        fila.concepto_nomina,
    )
    .map((fila) => ({
      beneficiario_id: fila.beneficiario_id,
      tipo_documento: fila.tipo_documento,
      numero_documento: fila.numero_documento,
      concepto_nomina: fila.concepto_nomina,
    }));

  const duplicados =
    await buscarDuplicadosNominaGrupalRepository({
      proyecto_base_id: input.proyectoBaseId,
      centro_costo_id: input.centroCostoId,
      periodo_nomina: input.periodoNomina,
      combinaciones,
    });

  return agregarErroresDuplicadosPersistidos({
    resultado: resultadoInicial,
    duplicados,
  });
}

function validarEntradaBasica(input: CrearNominaGrupalInput):
  | {
      ok: true;
      data: {
        proyectoBaseId: string;
        centroCostoId: string;
        periodoNomina: string;
        descripcion: string;
        adjuntoArchivoOrigenId: string;
        crearBeneficiariosFaltantes: boolean;
        filas: FilaNominaGrupalNormalizada[];
      };
    }
  | {
      ok: false;
      response: ServiceResponse<never>;
    } {
  const tipoSolicitud = normalizarTextoDominio(
    input.tipo_solicitud,
  );
  const modalidadNomina = normalizarTextoDominio(
    input.modalidad_nomina,
  );
  const proyectoBaseId = normalizarTexto(
    input.proyecto_base_id,
  );
  const centroCostoId = normalizarTexto(input.centro_costo_id);
  const periodoNomina = normalizarTexto(input.periodo_nomina);
  const descripcion = normalizarTexto(input.descripcion);
  const adjuntoArchivoOrigenId = normalizarTexto(
    input.adjunto_archivo_origen_id,
  );
  const crearBeneficiariosFaltantes =
    input.crear_beneficiarios_faltantes === true;
  const filas = Array.isArray(input.filas) ? input.filas : [];

  if (
    tipoSolicitud !== "PAGO_NOMINA" ||
    modalidadNomina !== "AGRUPADA_EXCEL"
  ) {
    return {
      ok: false,
      response: {
        status: 400,
        body: {
          ok: false,
          message:
            "El tipo de solicitud debe ser PAGO_NOMINA y la modalidad debe ser AGRUPADA_EXCEL.",
        },
      },
    };
  }

  if (
    !proyectoBaseId ||
    !centroCostoId ||
    !periodoNomina ||
    !descripcion ||
    !adjuntoArchivoOrigenId
  ) {
    return {
      ok: false,
      response: {
        status: 400,
        body: {
          ok: false,
          message:
            "Proyecto base, centro de costo, periodo de nómina, descripción y archivo de origen son obligatorios.",
        },
      },
    };
  }

  if (filas.length === 0) {
    return {
      ok: false,
      response: {
        status: 400,
        body: {
          ok: false,
          message:
            "La nómina grupal debe contener al menos una fila.",
        },
      },
    };
  }

  const errorPeriodo = validarPeriodoNomina(periodoNomina);

  if (errorPeriodo) {
    return {
      ok: false,
      response: {
        status: 400,
        body: {
          ok: false,
          message: errorPeriodo,
        },
      },
    };
  }

  return {
    ok: true,
    data: {
      proyectoBaseId,
      centroCostoId,
      periodoNomina,
      descripcion,
      adjuntoArchivoOrigenId,
      crearBeneficiariosFaltantes,
      filas,
    },
  };
}

export async function validarNominaGrupalService(
  usuarioAutenticado: UsuarioSesion,
  input: CrearNominaGrupalInput,
): Promise<ValidarNominaGrupalResponse> {
  if (!usuarioPuedeCrearNominaGrupal(usuarioAutenticado)) {
    return {
      status: 403,
      body: {
        ok: false,
        message:
          "Solo un Director autorizado o un Administrador puede validar solicitudes de nómina grupal.",
      },
    };
  }

  const entrada = validarEntradaBasica(input);

  if (!entrada.ok) {
    return entrada.response;
  }

  const contexto = await obtenerContextoFinancieroNominaGrupal({
    usuarioAutenticado,
    proyectoBaseId: entrada.data.proyectoBaseId,
    centroCostoId: entrada.data.centroCostoId,
  });

  if (!contexto.ok) {
    return contexto.response;
  }

  const adjunto = await obtenerAdjuntoNominaGrupalPorIdRepository(
    entrada.data.adjuntoArchivoOrigenId,
  );

  if (!adjunto) {
    return {
      status: 404,
      body: {
        ok: false,
        message: "El archivo Excel de origen no existe.",
      },
    };
  }

  if (adjunto.solicitud_pago_id) {
    return {
      status: 409,
      body: {
        ok: false,
        message:
          "El archivo Excel ya está asociado a otra solicitud de pago.",
      },
    };
  }

  const validacion = await ejecutarValidacionCompleta({
    proyectoBaseId: entrada.data.proyectoBaseId,
    centroCostoId: entrada.data.centroCostoId,
    periodoNomina: entrada.data.periodoNomina,
    filas: entrada.data.filas,
  });

  return {
    status: 200,
    body: {
      ok: true,
      message: nominaGrupalPuedeCrearse(validacion)
        ? "La nómina grupal fue validada correctamente."
        : "La nómina grupal contiene observaciones que deben corregirse.",
      data: {
        validacion,
      },
    },
  };
}

export async function obtenerDetalleNominaGrupalService(
  solicitudId: string,
) {
  const solicitud =
    await obtenerNominaGrupalPorSolicitudIdRepository(solicitudId);

  if (!solicitud) {
    return {
      status: 404,
      body: {
        ok: false,
        message: "La solicitud de nómina grupal no existe.",
      },
    };
  }

  const solicitudSerializada = {
    ...solicitud,
    archivo_origen: solicitud.archivo_origen
      ? {
          ...solicitud.archivo_origen,
          tamano_archivo:
            solicitud.archivo_origen.tamano_archivo === null
              ? null
              : Number(
                  solicitud.archivo_origen.tamano_archivo,
                ),
        }
      : null,
  };

  return {
    status: 200,
    body: {
      ok: true,
      message:
        "Solicitud de nómina grupal consultada correctamente.",
      data: {
        solicitud: solicitudSerializada,
      },
    },
  };
}

export async function crearNominaGrupalService(
  usuarioAutenticado: UsuarioSesion,
  input: CrearNominaGrupalInput,
): Promise<CrearNominaGrupalResponse> {
  if (!usuarioPuedeCrearNominaGrupal(usuarioAutenticado)) {
    return {
      status: 403,
      body: {
        ok: false,
        message:
          "Solo un Director autorizado o un Administrador puede crear solicitudes de nómina grupal.",
      },
    };
  }

  const entrada = validarEntradaBasica(input);

  if (!entrada.ok) {
    return entrada.response;
  }

  const contexto = await obtenerContextoFinancieroNominaGrupal({
    usuarioAutenticado,
    proyectoBaseId: entrada.data.proyectoBaseId,
    centroCostoId: entrada.data.centroCostoId,
  });

  if (!contexto.ok) {
    return contexto.response;
  }

  const adjunto = await obtenerAdjuntoNominaGrupalPorIdRepository(
    entrada.data.adjuntoArchivoOrigenId,
  );

  if (!adjunto) {
    return {
      status: 404,
      body: {
        ok: false,
        message: "El archivo Excel de origen no existe.",
      },
    };
  }

  if (adjunto.solicitud_pago_id) {
    return {
      status: 409,
      body: {
        ok: false,
        message:
          "El archivo Excel ya está asociado a otra solicitud de pago.",
      },
    };
  }

  const validacion = await ejecutarValidacionCompleta({
    proyectoBaseId: entrada.data.proyectoBaseId,
    centroCostoId: entrada.data.centroCostoId,
    periodoNomina: entrada.data.periodoNomina,
    filas: entrada.data.filas,
  });

  if (validacion.resumen.filas_invalidas > 0) {
    return {
      status: 422,
      body: {
        ok: false,
        message:
          "La solicitud no puede crearse porque existen filas inválidas.",
      },
    };
  }

  if (
    validacion.resumen.filas_pendientes_beneficiario > 0 &&
    !entrada.data.crearBeneficiariosFaltantes
  ) {
    return {
      status: 422,
      body: {
        ok: false,
        message:
          "Existen trabajadores pendientes. Confirme la creación de beneficiarios faltantes para continuar.",
      },
    };
  }

  const secuencia = await generarNumeroSolicitudPagoService({
    proyecto_base_id: entrada.data.proyectoBaseId,
    centro_costo_id: entrada.data.centroCostoId,
    proyecto_referencia: contexto.data.proyectoBase.nombre,
    centro_costo_referencia:
      contexto.data.centroCostoReferencia,
  });

  const beneficiariosFaltantes = Array.from(
    new Map(
      validacion.filas
        .filter(
          (fila) =>
            fila.estado_validacion === "PENDIENTE_BENEFICIARIO",
        )
        .map((fila) => [
          construirClaveDocumento(fila),
          {
            tipo_documento: fila.tipo_documento,
            numero_documento: fila.numero_documento,
            nombre: fila.nombre_trabajador,
            medio_pago_preferido: fila.medio_pago as MedioPagoSolicitud,
            banco: fila.banco,
            tipo_cuenta_bancaria: fila.tipo_cuenta_bancaria,
            numero_cuenta_bancaria:
              fila.numero_cuenta_bancaria,
          } satisfies CrearBeneficiarioNominaGrupalRepositoryInput,
        ]),
    ).values(),
  );

  const detalles: CrearDetalleNominaGrupalRepositoryInput[] =
    validacion.filas.map((fila) => {
      if (
        !fila.medio_pago ||
        fila.estado_validacion === "INVALIDO"
      ) {
        throw new Error(
          `La fila ${fila.numero_fila} no está lista para persistirse.`,
        );
      }

      return {
        numero_fila: fila.numero_fila,
        beneficiario_id: fila.beneficiario_id,
        tipo_documento: fila.tipo_documento,
        numero_documento: fila.numero_documento,
        nombre_trabajador: fila.nombre_trabajador,
        concepto_nomina: fila.concepto_nomina,
        medio_pago: fila.medio_pago,
        banco: fila.banco,
        tipo_cuenta_bancaria: fila.tipo_cuenta_bancaria,
        numero_cuenta_bancaria: fila.numero_cuenta_bancaria,
        valor_bruto: fila.valor_bruto,
        valor_retenciones: fila.valor_retenciones,
        valor_descuentos: fila.valor_descuentos,
        valor_neto: fila.valor_neto,
        estado_validacion: "VALIDO",
        errores_validacion: null,
      };
    });

  const resultadoCreacion =
    await crearSolicitudNominaGrupalRepository({
      numero_solicitud: secuencia.referencia,
      proyecto_base_id: entrada.data.proyectoBaseId,
      fondo_id: contexto.data.fondo.id,
      centro_costo_id: entrada.data.centroCostoId,
      periodo_nomina: entrada.data.periodoNomina,
      descripcion: entrada.data.descripcion,
      adjunto_archivo_origen_id:
        entrada.data.adjuntoArchivoOrigenId,
      valor_bruto: validacion.resumen.valor_bruto_total,
      valor_retenciones:
        validacion.resumen.valor_retenciones_total,
      valor_descuentos:
        validacion.resumen.valor_descuentos_total,
      valor_neto: validacion.resumen.valor_neto_total,
      creado_por: usuarioAutenticado.id,
      beneficiarios_faltantes: beneficiariosFaltantes,
      detalles,
    });

  const solicitudCreada =
    resultadoCreacion.solicitud as SolicitudNominaGrupalRepositoryResult;

  return {
    status: 201,
    body: {
      ok: true,
      message: "Solicitud de nómina grupal creada correctamente.",
      data: {
        solicitud: convertirSolicitudPago(solicitudCreada),
        resumen: {
          ...validacion.resumen,
          filas_validas: validacion.resumen.total_filas,
          filas_pendientes_beneficiario: 0,
        },
        beneficiarios_creados:
          resultadoCreacion.beneficiarios_creados,
      },
    },
  };
}