// src/modules/beneficiarios/beneficiarios.service.ts

import type { UsuarioSesion } from "@/modules/auth/auth.types";
import {
  actualizarBeneficiarioRepository,
  crearBeneficiarioRepository,
  existeBeneficiarioPorDocumentoRepository,
  listarBeneficiariosRepository,
  obtenerBeneficiarioPorIdRepository,
  obtenerProveedorPorDocumentoRepository,
  obtenerUsuarioActivoPorIdRepository,
} from "./beneficiarios.repository";
import { esBancoValido } from "./bancos.constants";
import type {
  ActualizarBeneficiarioInput,
  BeneficiarioActualizadoRepositoryInput,
  BeneficiarioListFilters,
  CrearBeneficiarioInput,
  FilaProveedorMasivo,
  MedioPagoPreferido,
  ProveedorNormalizadoInput,
  TipoBeneficiario,
  TipoCuentaBancaria,
  ResultadoCargaMasivaProveedores,
} from "./beneficiarios.types";

const TIPOS_BENEFICIARIO_VALIDOS: TipoBeneficiario[] = [
  "PROVEEDOR",
  "TRABAJADOR",
  "OTRO",
];

const MEDIOS_PAGO_VALIDOS: MedioPagoPreferido[] = [
  "TRANSFERENCIA",
  "CONSIGNACION",
  "EFECTIVO",
];

const TIPOS_CUENTA_VALIDOS: TipoCuentaBancaria[] = [
  "AHORROS",
  "CORRIENTE",
  "OTRO",
];

const PERMISOS_GESTION_BENEFICIARIOS = [
  "CREAR_SOLICITUDES",
  "CREAR_USUARIOS",
  "CONSULTAR_TODO",
];

function usuarioTieneAlgunPermiso(usuario: UsuarioSesion, permisos: string[]) {
  return permisos.some((permiso) => usuario.permisos?.includes(permiso));
}

function normalizarTexto(texto: string) {
  return texto.trim().replace(/\s+/g, " ");
}

function normalizarTextoMayuscula(texto: string) {
  return normalizarTexto(texto).toUpperCase();
}

function normalizarTextoOpcional(texto?: string | null) {
  const valor = texto?.trim().replace(/\s+/g, " ");

  return valor || null;
}

function normalizarCorreo(correo?: string | null) {
  const valor = correo?.trim().toLowerCase();

  return valor || null;
}

function validarTipoBeneficiario(
  tipoBeneficiario: string,
): tipoBeneficiario is TipoBeneficiario {
  return TIPOS_BENEFICIARIO_VALIDOS.includes(
    tipoBeneficiario as TipoBeneficiario,
  );
}

function validarMedioPago(
  medioPago: string,
): medioPago is MedioPagoPreferido {
  return MEDIOS_PAGO_VALIDOS.includes(medioPago as MedioPagoPreferido);
}

function validarTipoCuenta(
  tipoCuenta: string,
): tipoCuenta is TipoCuentaBancaria {
  return TIPOS_CUENTA_VALIDOS.includes(tipoCuenta as TipoCuentaBancaria);
}

function requiereDatosBancarios(medioPago: MedioPagoPreferido) {
  return medioPago === "TRANSFERENCIA" || medioPago === "CONSIGNACION";
}

function validarCampoObligatorio(
  valor: string | null | undefined,
  mensaje: string,
) {
  if (!valor?.trim()) {
    throw new Error(mensaje);
  }
}

function validarSoloNumeros(valor: string, mensaje: string) {
  if (!/^\d+$/.test(valor.trim())) {
    throw new Error(mensaje);
  }
}

function validarBanco(banco: string, mensaje: string) {
  if (!esBancoValido(banco)) {
    throw new Error(mensaje);
  }
}

function validarTipoDocumentoPorBeneficiario(
  tipoBeneficiario: TipoBeneficiario,
  tipoDocumento: string,
) {
  if (tipoBeneficiario === "TRABAJADOR" && tipoDocumento === "NIT") {
    throw new Error(
      "Un beneficiario tipo TRABAJADOR no puede tener tipo de identificación NIT.",
    );
  }
}

function validarPermisoGestionBeneficiarios(usuario: UsuarioSesion) {
  if (!usuarioTieneAlgunPermiso(usuario, PERMISOS_GESTION_BENEFICIARIOS)) {
    throw new Error("No autorizado.");
  }
}

function normalizarBusqueda(busqueda?: string) {
  return busqueda?.trim() || undefined;
}

function validarCorreoBeneficiario(correo: string | null | undefined) {
  if (!correo) {
    return;
  }

  const correoRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!correoRegex.test(correo)) {
    throw new Error("El correo del beneficiario no tiene un formato válido.");
  }
}

function validarObjetoActualizacion(input: unknown) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error(
      "Debe enviar un cuerpo válido para actualizar el beneficiario.",
    );
  }
}

function normalizarTextoObligatorioActualizacion(
  value: unknown,
  fieldName: string,
) {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`El campo ${fieldName} es obligatorio.`);
  }

  return normalizarTextoMayuscula(value);
}

function normalizarTextoOpcionalActualizacion(value: unknown) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new Error("Los campos de texto deben ser cadenas válidas.");
  }

  const valor = value.trim().replace(/\s+/g, " ");

  return valor || null;
}

function normalizarTextoOpcionalMayusculaActualizacion(value: unknown) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new Error("Los campos de texto deben ser cadenas válidas.");
  }

  const valor = value.trim().replace(/\s+/g, " ");

  return valor ? valor.toUpperCase() : null;
}

function normalizarCorreoActualizacion(value: unknown) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new Error("El correo del beneficiario debe ser una cadena válida.");
  }

  const correo = value.trim().toLowerCase() || null;

  validarCorreoBeneficiario(correo);

  return correo;
}

function normalizarBooleanOpcional(value: unknown, fieldName: string) {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "boolean") {
    throw new Error(`El campo ${fieldName} debe ser verdadero o falso.`);
  }

  return value;
}

function normalizarMedioPagoActualizacion(value: unknown) {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string" || !validarMedioPago(value)) {
    throw new Error("El medio de pago preferido no es válido.");
  }

  return value;
}

function normalizarTipoCuentaActualizacion(value: unknown) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (typeof value !== "string" || !validarTipoCuenta(value)) {
    throw new Error("El tipo de cuenta bancaria no es válido.");
  }

  return value;
}

function normalizarActualizarBeneficiarioInput(
  input: ActualizarBeneficiarioInput,
): BeneficiarioActualizadoRepositoryInput {
  validarObjetoActualizacion(input);

  let tipoBeneficiario: TipoBeneficiario | undefined;

  if (input.tipo_beneficiario !== undefined) {
    if (!validarTipoBeneficiario(input.tipo_beneficiario)) {
      throw new Error("El tipo de beneficiario no es válido.");
    }
    tipoBeneficiario = input.tipo_beneficiario;
  }

  const tipoDocumento = normalizarTextoObligatorioActualizacion(
    input.tipo_documento,
    "tipo_documento",
  );
  const numeroDocumento = normalizarTextoObligatorioActualizacion(
    input.numero_documento,
    "numero_documento",
  );

  if (numeroDocumento !== undefined) {
    validarSoloNumeros(
      numeroDocumento,
      "El número de documento debe contener solo números.",
    );
  }

  const nombre = normalizarTextoObligatorioActualizacion(
    input.nombre,
    "nombre",
  );

  const medioPagoPreferido = normalizarMedioPagoActualizacion(
    input.medio_pago_preferido,
  );

  const banco = normalizarTextoOpcionalMayusculaActualizacion(input.banco);

  if (banco !== undefined && banco !== null) {
    validarBanco(banco, "El banco seleccionado no es válido.");
  }

  const tipoCuentaBancaria = normalizarTipoCuentaActualizacion(
    input.tipo_cuenta_bancaria,
  );

  const numeroCuentaBancaria = normalizarTextoOpcionalActualizacion(
    input.numero_cuenta_bancaria,
  );

  if (numeroCuentaBancaria !== undefined && numeroCuentaBancaria !== null) {
    validarSoloNumeros(
      numeroCuentaBancaria,
      "El número de cuenta bancaria debe contener solo números.",
    );
  }

  const telefono = normalizarTextoOpcionalActualizacion(input.telefono);
  const correo = normalizarCorreoActualizacion(input.correo);
  const notas = normalizarTextoOpcionalActualizacion(input.notas);
  const activo = normalizarBooleanOpcional(input.activo, "activo");

  const inputNormalizado: BeneficiarioActualizadoRepositoryInput = {
    ...(tipoBeneficiario !== undefined ? { tipo_beneficiario: tipoBeneficiario } : {}),
    ...(tipoDocumento !== undefined ? { tipo_documento: tipoDocumento } : {}),
    ...(numeroDocumento !== undefined ? { numero_documento: numeroDocumento } : {}),
    ...(nombre !== undefined ? { nombre } : {}),
    ...(medioPagoPreferido !== undefined
      ? { medio_pago_preferido: medioPagoPreferido }
      : {}),
    ...(banco !== undefined ? { banco } : {}),
    ...(tipoCuentaBancaria !== undefined
      ? { tipo_cuenta_bancaria: tipoCuentaBancaria }
      : {}),
    ...(numeroCuentaBancaria !== undefined
      ? { numero_cuenta_bancaria: numeroCuentaBancaria }
      : {}),
    ...(telefono !== undefined ? { telefono } : {}),
    ...(correo !== undefined ? { correo } : {}),
    ...(notas !== undefined ? { notas } : {}),
    ...(activo !== undefined ? { activo } : {}),
  };

  if (Object.keys(inputNormalizado).length === 0) {
    throw new Error("Debe enviar al menos un campo para actualizar.");
  }

  return inputNormalizado;
}

export async function listarBeneficiariosService(
  usuario: UsuarioSesion,
  filters: BeneficiarioListFilters = {},
) {
  validarPermisoGestionBeneficiarios(usuario);

  return listarBeneficiariosRepository({
    tipo_beneficiario: filters.tipo_beneficiario,
    activo: filters.activo,
    busqueda: normalizarBusqueda(filters.busqueda),
  });
}

export async function obtenerBeneficiarioPorIdService(
  usuario: UsuarioSesion,
  id: string,
) {
  validarPermisoGestionBeneficiarios(usuario);

  if (!id) {
    throw new Error("El ID del beneficiario es obligatorio.");
  }

  const beneficiario = await obtenerBeneficiarioPorIdRepository(id);

  if (!beneficiario) {
    throw new Error("El beneficiario no existe.");
  }

  return beneficiario;
}

export async function crearBeneficiarioService(
  usuario: UsuarioSesion,
  input: CrearBeneficiarioInput,
) {
  validarPermisoGestionBeneficiarios(usuario);

  if (!validarTipoBeneficiario(input.tipo_beneficiario)) {
    throw new Error("El tipo de beneficiario no es válido.");
  }

  validarCampoObligatorio(
    input.nombre,
    "El nombre del beneficiario es obligatorio.",
  );

  validarCampoObligatorio(
    input.tipo_documento,
    "El tipo de documento del beneficiario es obligatorio.",
  );

  validarCampoObligatorio(
    input.numero_documento,
    "El número de documento del beneficiario es obligatorio.",
  );

  validarSoloNumeros(
    input.numero_documento,
    "El número de documento debe contener solo números.",
  );

  validarCampoObligatorio(
    input.medio_pago_preferido,
    "El medio de pago preferido es obligatorio.",
  );

  if (!validarMedioPago(input.medio_pago_preferido)) {
    throw new Error("El medio de pago preferido no es válido.");
  }

  const tipoDocumento = normalizarTextoMayuscula(input.tipo_documento);
  const numeroDocumento = normalizarTextoMayuscula(input.numero_documento);

  validarTipoDocumentoPorBeneficiario(
    input.tipo_beneficiario,
    tipoDocumento,
  );

  const requiereBanco =
    input.tipo_beneficiario === "PROVEEDOR" ||
    requiereDatosBancarios(input.medio_pago_preferido);

  if (input.tipo_beneficiario === "PROVEEDOR") {
    validarCampoObligatorio(
      input.correo,
      "El correo del proveedor es obligatorio.",
    );
    validarCampoObligatorio(
      input.telefono,
      "El teléfono del proveedor es obligatorio.",
    );
    validarCampoObligatorio(
      input.notas,
      "El concepto de pago del proveedor es obligatorio.",
    );
    validarCorreoBeneficiario(normalizarCorreo(input.correo));
  }

  if (requiereBanco) {
    validarCampoObligatorio(input.banco, "El banco es obligatorio.");

    const bancoNormalizadoValidacion = normalizarTextoMayuscula(
      input.banco ?? "",
    );

    validarBanco(
      bancoNormalizadoValidacion,
      "El banco seleccionado no es válido.",
    );

    validarCampoObligatorio(
      input.tipo_cuenta_bancaria,
      "El tipo de cuenta bancaria es obligatorio.",
    );

    validarCampoObligatorio(
      input.numero_cuenta_bancaria,
      "El número de cuenta bancaria es obligatorio.",
    );

    validarSoloNumeros(
      input.numero_cuenta_bancaria ?? "",
      "El número de cuenta bancaria debe contener solo números.",
    );

    if (
      !input.tipo_cuenta_bancaria ||
      !validarTipoCuenta(input.tipo_cuenta_bancaria)
    ) {
      throw new Error("El tipo de cuenta bancaria no es válido.");
    }
  }

  const bancoNormalizado = requiereBanco
    ? normalizarTextoMayuscula(input.banco ?? "")
    : null;

  const tipoCuentaBancariaNormalizada = requiereBanco
    ? input.tipo_cuenta_bancaria ?? null
    : null;

  const numeroCuentaBancariaNormalizada = requiereBanco
    ? normalizarTextoMayuscula(input.numero_cuenta_bancaria ?? "")
    : null;

  const beneficiarioExistente =
    await existeBeneficiarioPorDocumentoRepository(
      tipoDocumento,
      numeroDocumento,
    );

  if (beneficiarioExistente?.activo) {
    throw new Error(
      "Ya existe un beneficiario activo con ese tipo y número de documento.",
    );
  }

  if (beneficiarioExistente && !beneficiarioExistente.activo) {
    throw new Error(
      "Ya existe un beneficiario inactivo con ese tipo y número de documento. Reactívelo en lugar de crear uno nuevo.",
    );
  }

  if (input.usuario_id) {
    const usuarioAsociado = await obtenerUsuarioActivoPorIdRepository(
      input.usuario_id,
    );

    if (!usuarioAsociado) {
      throw new Error("El usuario asociado no existe o está inactivo.");
    }
  }

  let proveedorNormalizado: ProveedorNormalizadoInput | null = null;
  let proveedorId = input.proveedor_id ?? null;

  if (input.tipo_beneficiario === "PROVEEDOR") {
    if (input.proveedor_id && input.proveedor) {
      throw new Error(
        "Debe enviar proveedor_id o proveedor nuevo, pero no ambos.",
      );
    }

    if (input.proveedor) {
      validarCampoObligatorio(
        input.proveedor.nombre,
        "El nombre del proveedor es obligatorio.",
      );

      validarCampoObligatorio(
        input.proveedor.tipo_documento,
        "El tipo de documento del proveedor es obligatorio.",
      );

      validarCampoObligatorio(
        input.proveedor.numero_documento,
        "El número de documento del proveedor es obligatorio.",
      );

      validarSoloNumeros(
        input.proveedor.numero_documento,
        "El número de documento del proveedor debe contener solo números.",
      );

      if (requiereBanco) {
        validarCampoObligatorio(
          input.proveedor.banco,
          "El banco del proveedor es obligatorio.",
        );

        const bancoProveedorNormalizadoValidacion = normalizarTextoMayuscula(
          input.proveedor.banco ?? "",
        );

        validarBanco(
          bancoProveedorNormalizadoValidacion,
          "El banco del proveedor seleccionado no es válido.",
        );

        validarCampoObligatorio(
          input.proveedor.tipo_cuenta_bancaria,
          "El tipo de cuenta bancaria del proveedor es obligatorio.",
        );

        validarCampoObligatorio(
          input.proveedor.numero_cuenta_bancaria,
          "El número de cuenta bancaria del proveedor es obligatorio.",
        );

        validarSoloNumeros(
          input.proveedor.numero_cuenta_bancaria ?? "",
          "El número de cuenta bancaria del proveedor debe contener solo números.",
        );

        if (
          !input.proveedor.tipo_cuenta_bancaria ||
          !validarTipoCuenta(input.proveedor.tipo_cuenta_bancaria)
        ) {
          throw new Error(
            "El tipo de cuenta bancaria del proveedor no es válido.",
          );
        }
      }

      const tipoDocumentoProveedor = normalizarTextoMayuscula(
        input.proveedor.tipo_documento,
      );

      const numeroDocumentoProveedor = normalizarTextoMayuscula(
        input.proveedor.numero_documento,
      );

      const proveedorExistente = await obtenerProveedorPorDocumentoRepository(
        tipoDocumentoProveedor,
        numeroDocumentoProveedor,
      );

      if (proveedorExistente) {
        throw new Error("Ya existe un proveedor activo con ese documento.");
      }

      proveedorNormalizado = {
        nombre: normalizarTextoMayuscula(input.proveedor.nombre),
        tipo_documento: tipoDocumentoProveedor,
        numero_documento: numeroDocumentoProveedor,
        correo: normalizarCorreo(input.proveedor.correo),
        telefono: normalizarTextoOpcional(input.proveedor.telefono),
        direccion: normalizarTextoOpcional(input.proveedor.direccion),
        banco: requiereBanco
          ? normalizarTextoMayuscula(input.proveedor.banco ?? "")
          : null,
        tipo_cuenta_bancaria: requiereBanco
          ? input.proveedor.tipo_cuenta_bancaria ?? null
          : null,
        numero_cuenta_bancaria: requiereBanco
          ? normalizarTextoMayuscula(
              input.proveedor.numero_cuenta_bancaria ?? "",
            )
          : null,
      };
    }
  }

  if (input.tipo_beneficiario !== "PROVEEDOR") {
    proveedorId = null;
    proveedorNormalizado = null;
  }

  return crearBeneficiarioRepository({
    beneficiario: {
      tipo_beneficiario: input.tipo_beneficiario,
      proveedor_id: proveedorId,
      usuario_id: input.usuario_id ?? null,
      nombre: normalizarTextoMayuscula(input.nombre),
      tipo_documento: tipoDocumento,
      numero_documento: numeroDocumento,
      medio_pago_preferido: input.medio_pago_preferido,
      banco: bancoNormalizado,
      tipo_cuenta_bancaria: tipoCuentaBancariaNormalizada,
      numero_cuenta_bancaria: numeroCuentaBancariaNormalizada,
      telefono: normalizarTextoOpcional(input.telefono),
      correo: normalizarCorreo(input.correo),
      notas: normalizarTextoOpcional(input.notas),
    },
    proveedor: proveedorNormalizado,
  });
}

export async function validarCargaMasivaProveedoresService(
  usuario: UsuarioSesion,
  filas: FilaProveedorMasivo[],
): Promise<ResultadoCargaMasivaProveedores> {
  validarPermisoGestionBeneficiarios(usuario);
  const documentosArchivo = new Map<string, number>();
  const resultados = [];

  for (const fila of filas) {
    const tipoDocumento = normalizarTextoMayuscula(fila.tipo_documento);
    const numeroDocumento = fila.numero_documento.trim();
    const medioPago = normalizarTextoMayuscula(fila.medio_pago_preferido);
    const banco = normalizarTextoMayuscula(fila.banco);
    const tipoCuenta = normalizarTextoMayuscula(fila.tipo_cuenta_bancaria);
    const errores: string[] = [];

    const obligatorios = [
      [fila.tipo_documento, "Tipo de identificación"],
      [fila.numero_documento, "Número de identificación"],
      [fila.nombre, "Nombre o razón social"],
      [fila.correo, "Correo"],
      [fila.telefono, "Teléfono"],
      [fila.medio_pago_preferido, "Medio de pago sugerido"],
      [fila.banco, "Banco"],
      [fila.tipo_cuenta_bancaria, "Tipo de cuenta"],
      [fila.numero_cuenta_bancaria, "Número de cuenta"],
      [fila.concepto_pago, "Concepto de pago"],
    ];
    for (const [valor, nombreCampo] of obligatorios) {
      if (!valor.trim()) errores.push(`${nombreCampo} es obligatorio.`);
    }

    if (tipoDocumento && !["NIT", "CC", "CE"].includes(tipoDocumento)) {
      errores.push("Tipo de identificación no válido.");
    }
    if (numeroDocumento && !/^\d+$/.test(numeroDocumento)) {
      errores.push("El número de identificación debe contener solo números.");
    }
    if (fila.telefono && !/^\d{7,15}$/.test(fila.telefono.trim())) {
      errores.push("El teléfono debe contener entre 7 y 15 números.");
    }
    if (fila.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fila.correo.trim())) {
      errores.push("El correo no tiene un formato válido.");
    }
    if (medioPago && !MEDIOS_PAGO_VALIDOS.includes(medioPago as MedioPagoPreferido)) {
      errores.push("Medio de pago sugerido no válido.");
    }
    if (banco && !esBancoValido(banco)) errores.push("Banco no válido.");
    if (tipoCuenta && !TIPOS_CUENTA_VALIDOS.includes(tipoCuenta as TipoCuentaBancaria)) {
      errores.push("Tipo de cuenta no válido.");
    }
    if (fila.numero_cuenta_bancaria && !/^\d+$/.test(fila.numero_cuenta_bancaria.trim())) {
      errores.push("El número de cuenta debe contener solo números.");
    }

    const claveDocumento = `${tipoDocumento}:${numeroDocumento}`;
    if (tipoDocumento && numeroDocumento) {
      const filaAnterior = documentosArchivo.get(claveDocumento);
      if (filaAnterior) {
        errores.push(`Documento duplicado en el archivo (fila ${filaAnterior}).`);
      } else {
        documentosArchivo.set(claveDocumento, fila.fila);
      }

      const [beneficiarioExistente, proveedorExistente] = await Promise.all([
        existeBeneficiarioPorDocumentoRepository(tipoDocumento, numeroDocumento),
        obtenerProveedorPorDocumentoRepository(tipoDocumento, numeroDocumento),
      ]);
      if (beneficiarioExistente || proveedorExistente) {
        errores.push("El proveedor ya existe y no será modificado.");
      }
    }

    resultados.push({
      ...fila,
      tipo_documento: tipoDocumento,
      numero_documento: numeroDocumento,
      nombre: normalizarTextoMayuscula(fila.nombre),
      correo: fila.correo.trim().toLowerCase(),
      telefono: fila.telefono.trim(),
      medio_pago_preferido: medioPago,
      banco,
      tipo_cuenta_bancaria: tipoCuenta,
      numero_cuenta_bancaria: fila.numero_cuenta_bancaria.trim(),
      concepto_pago: normalizarTextoMayuscula(fila.concepto_pago),
      valido: errores.length === 0,
      errores,
    });
  }

  const validos = resultados.filter((fila) => fila.valido).length;
  return {
    total: resultados.length,
    validos,
    rechazados: resultados.length - validos,
    filas: resultados,
  };
}

export async function importarCargaMasivaProveedoresService(
  usuario: UsuarioSesion,
  filas: FilaProveedorMasivo[],
) {
  const validacion = await validarCargaMasivaProveedoresService(usuario, filas);
  let creados = 0;

  for (const fila of validacion.filas.filter((item) => item.valido)) {
    try {
      await crearBeneficiarioService(usuario, {
        tipo_beneficiario: "PROVEEDOR",
        nombre: fila.nombre,
        tipo_documento: fila.tipo_documento,
        numero_documento: fila.numero_documento,
        medio_pago_preferido: fila.medio_pago_preferido as MedioPagoPreferido,
        banco: fila.banco,
        tipo_cuenta_bancaria: fila.tipo_cuenta_bancaria as TipoCuentaBancaria,
        numero_cuenta_bancaria: fila.numero_cuenta_bancaria,
        telefono: fila.telefono,
        correo: fila.correo,
        notas: fila.concepto_pago,
        proveedor: {
          nombre: fila.nombre,
          tipo_documento: fila.tipo_documento,
          numero_documento: fila.numero_documento,
          correo: fila.correo,
          telefono: fila.telefono,
          banco: fila.banco,
          tipo_cuenta_bancaria: fila.tipo_cuenta_bancaria as TipoCuentaBancaria,
          numero_cuenta_bancaria: fila.numero_cuenta_bancaria,
        },
      });
      creados += 1;
    } catch (error) {
      fila.valido = false;
      fila.errores.push(
        error instanceof Error ? error.message : "No fue posible crear el proveedor.",
      );
    }
  }

  return {
    ...validacion,
    validos: creados,
    rechazados: validacion.total - creados,
    creados,
  };
}

export async function actualizarBeneficiarioService(
  usuario: UsuarioSesion,
  id: string,
  input: ActualizarBeneficiarioInput,
) {
  validarPermisoGestionBeneficiarios(usuario);

  if (!id) {
    throw new Error("El ID del beneficiario es obligatorio.");
  }

  const beneficiarioExistente = await obtenerBeneficiarioPorIdRepository(id);

  if (!beneficiarioExistente) {
    throw new Error("El beneficiario no existe.");
  }

  const inputNormalizado = normalizarActualizarBeneficiarioInput(input);

  const tipoBeneficiario =
    inputNormalizado.tipo_beneficiario ?? beneficiarioExistente.tipo_beneficiario;
  const tipoDocumento =
    inputNormalizado.tipo_documento ?? beneficiarioExistente.tipo_documento;
  const numeroDocumento =
    inputNormalizado.numero_documento ?? beneficiarioExistente.numero_documento;

  validarCampoObligatorio(
    tipoDocumento,
    "El tipo de documento del beneficiario es obligatorio.",
  );
  validarCampoObligatorio(
    numeroDocumento,
    "El número de documento del beneficiario es obligatorio.",
  );
  validarTipoDocumentoPorBeneficiario(
    tipoBeneficiario as TipoBeneficiario,
    tipoDocumento ?? "",
  );

  if (tipoBeneficiario === "PROVEEDOR") {
    const correoFinal =
      inputNormalizado.correo !== undefined
        ? inputNormalizado.correo
        : beneficiarioExistente.correo;
    const telefonoFinal =
      inputNormalizado.telefono !== undefined
        ? inputNormalizado.telefono
        : beneficiarioExistente.telefono;
    const bancoFinal =
      inputNormalizado.banco !== undefined
        ? inputNormalizado.banco
        : beneficiarioExistente.banco;
    const tipoCuentaFinal =
      inputNormalizado.tipo_cuenta_bancaria !== undefined
        ? inputNormalizado.tipo_cuenta_bancaria
        : beneficiarioExistente.tipo_cuenta_bancaria;
    const numeroCuentaFinal =
      inputNormalizado.numero_cuenta_bancaria !== undefined
        ? inputNormalizado.numero_cuenta_bancaria
        : beneficiarioExistente.numero_cuenta_bancaria;
    const notasFinales =
      inputNormalizado.notas !== undefined
        ? inputNormalizado.notas
        : beneficiarioExistente.notas;

    validarCampoObligatorio(correoFinal, "El correo del proveedor es obligatorio.");
    validarCampoObligatorio(telefonoFinal, "El teléfono del proveedor es obligatorio.");
    validarCampoObligatorio(bancoFinal, "El banco del proveedor es obligatorio.");
    validarCampoObligatorio(tipoCuentaFinal, "El tipo de cuenta del proveedor es obligatorio.");
    validarCampoObligatorio(numeroCuentaFinal, "El número de cuenta del proveedor es obligatorio.");
    validarCampoObligatorio(notasFinales, "El concepto de pago del proveedor es obligatorio.");
  }

  const documentoExistente = await existeBeneficiarioPorDocumentoRepository(
    tipoDocumento ?? "",
    numeroDocumento ?? "",
  );

  if (documentoExistente && documentoExistente.id !== id) {
    throw new Error(
      "Ya existe otro beneficiario con ese tipo y número de documento.",
    );
  }

  if (tipoBeneficiario === "PROVEEDOR") {
    const proveedorExistente = await obtenerProveedorPorDocumentoRepository(
      tipoDocumento ?? "",
      numeroDocumento ?? "",
    );

    if (
      proveedorExistente &&
      beneficiarioExistente.proveedor_id &&
      proveedorExistente.id !== beneficiarioExistente.proveedor_id
    ) {
      throw new Error("Ya existe otro proveedor con ese documento.");
    }
  }

  return actualizarBeneficiarioRepository(id, inputNormalizado);
}
