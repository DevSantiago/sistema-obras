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
  MedioPagoPreferido,
  ProveedorNormalizadoInput,
  TipoBeneficiario,
  TipoCuentaBancaria,
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
    throw new Error("Debe enviar un cuerpo válido para actualizar el beneficiario.");
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

  const requiereBanco = requiereDatosBancarios(input.medio_pago_preferido);

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

  const tipoDocumento = normalizarTextoMayuscula(input.tipo_documento);
  const numeroDocumento = normalizarTextoMayuscula(input.numero_documento);

  const bancoNormalizado = requiereBanco
    ? normalizarTextoMayuscula(input.banco ?? "")
    : null;

  const tipoCuentaBancariaNormalizada = requiereBanco
    ? input.tipo_cuenta_bancaria ?? null
    : null;

  const numeroCuentaBancariaNormalizada = requiereBanco
    ? normalizarTextoMayuscula(input.numero_cuenta_bancaria ?? "")
    : null;

  const existeBeneficiario = await existeBeneficiarioPorDocumentoRepository(
    tipoDocumento,
    numeroDocumento,
  );

  if (existeBeneficiario) {
    throw new Error("Ya existe un beneficiario activo con ese documento.");
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
          throw new Error("El tipo de cuenta bancaria del proveedor no es válido.");
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

  return actualizarBeneficiarioRepository(id, inputNormalizado);
}