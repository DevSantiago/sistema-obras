import type { UsuarioSesion } from "@/modules/auth/auth.types";
import {
  crearBeneficiarioRepository,
  existeBeneficiarioPorDocumentoRepository,
  listarBeneficiariosRepository,
  obtenerBeneficiarioPorIdRepository,
  obtenerProveedorPorDocumentoRepository,
  obtenerUsuarioActivoPorIdRepository,
} from "./beneficiarios.repository";
import type {
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

function validarCampoObligatorio(
  valor: string | null | undefined,
  mensaje: string,
) {
  if (!valor?.trim()) {
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
  validarCampoObligatorio(
    input.medio_pago_preferido,
    "El medio de pago preferido es obligatorio.",
  );
  validarCampoObligatorio(input.banco, "El banco es obligatorio.");
  validarCampoObligatorio(
    input.tipo_cuenta_bancaria,
    "El tipo de cuenta bancaria es obligatorio.",
  );
  validarCampoObligatorio(
    input.numero_cuenta_bancaria,
    "El número de cuenta bancaria es obligatorio.",
  );

  if (!validarMedioPago(input.medio_pago_preferido)) {
    throw new Error("El medio de pago preferido no es válido.");
  }

  if (!validarTipoCuenta(input.tipo_cuenta_bancaria)) {
    throw new Error("El tipo de cuenta bancaria no es válido.");
  }

  const tipoDocumento = normalizarTextoMayuscula(input.tipo_documento);
  const numeroDocumento = normalizarTextoMayuscula(input.numero_documento);

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
      validarCampoObligatorio(
        input.proveedor.banco,
        "El banco del proveedor es obligatorio.",
      );
      validarCampoObligatorio(
        input.proveedor.tipo_cuenta_bancaria,
        "El tipo de cuenta bancaria del proveedor es obligatorio.",
      );
      validarCampoObligatorio(
        input.proveedor.numero_cuenta_bancaria,
        "El número de cuenta bancaria del proveedor es obligatorio.",
      );

      if (!validarTipoCuenta(input.proveedor.tipo_cuenta_bancaria)) {
        throw new Error("El tipo de cuenta bancaria del proveedor no es válido.");
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
        banco: normalizarTextoMayuscula(input.proveedor.banco),
        tipo_cuenta_bancaria: input.proveedor.tipo_cuenta_bancaria,
        numero_cuenta_bancaria: normalizarTextoMayuscula(
          input.proveedor.numero_cuenta_bancaria,
        ),
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
      banco: normalizarTextoMayuscula(input.banco),
      tipo_cuenta_bancaria: input.tipo_cuenta_bancaria,
      numero_cuenta_bancaria: normalizarTextoMayuscula(
        input.numero_cuenta_bancaria,
      ),
      telefono: normalizarTextoOpcional(input.telefono),
      correo: normalizarCorreo(input.correo),
      notas: normalizarTextoOpcional(input.notas),
    },
    proveedor: proveedorNormalizado,
  });
}