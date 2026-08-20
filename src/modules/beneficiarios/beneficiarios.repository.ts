import { prisma } from "@/lib/prisma";
import type {
  BeneficiarioActualizadoRepositoryInput,
  BeneficiarioListFilters,
  CrearBeneficiarioRepositoryInput,
} from "./beneficiarios.types";

const beneficiarioInclude = {
  proveedor: true,
  usuario_asociado: {
    select: {
      id: true,
      nombre: true,
      correo: true,
      estado: true,
    },
  },
};

export async function listarBeneficiariosRepository(
  filters: BeneficiarioListFilters = {},
) {
  return prisma.beneficiarios_pago.findMany({
    where: {
      ...(filters.tipo_beneficiario
        ? { tipo_beneficiario: filters.tipo_beneficiario }
        : {}),
      ...(typeof filters.activo === "boolean" ? { activo: filters.activo } : {}),
      ...(filters.busqueda
        ? {
            OR: [
              {
                nombre: {
                  contains: filters.busqueda,
                  mode: "insensitive",
                },
              },
              {
                numero_documento: {
                  contains: filters.busqueda,
                  mode: "insensitive",
                },
              },
              {
                correo: {
                  contains: filters.busqueda,
                  mode: "insensitive",
                },
              },
            ],
          }
        : {}),
    },
    include: beneficiarioInclude,
    orderBy: {
      creado_en: "desc",
    },
  });
}

export async function obtenerBeneficiarioPorIdRepository(id: string) {
  return prisma.beneficiarios_pago.findUnique({
    where: { id },
    include: beneficiarioInclude,
  });
}

export async function existeBeneficiarioPorDocumentoRepository(
  tipoDocumento: string,
  numeroDocumento: string,
) {
  return prisma.beneficiarios_pago.findFirst({
    where: {
      tipo_documento: tipoDocumento,
      numero_documento: numeroDocumento,
    },
    select: {
      id: true,
      activo: true,
    },
  });
}

export async function obtenerProveedorPorDocumentoRepository(
  tipoDocumento: string,
  numeroDocumento: string,
) {
  return prisma.proveedores.findFirst({
    where: {
      tipo_documento: tipoDocumento,
      numero_documento: numeroDocumento,
      activo: true,
    },
  });
}

export async function obtenerUsuarioActivoPorIdRepository(usuarioId: string) {
  return prisma.usuarios.findFirst({
    where: {
      id: usuarioId,
      estado: "ACTIVO",
    },
    select: {
      id: true,
      nombre: true,
      correo: true,
      estado: true,
    },
  });
}

export async function crearBeneficiarioRepository(
  input: CrearBeneficiarioRepositoryInput,
) {
  return prisma.$transaction(async (tx) => {
    let proveedorId = input.beneficiario.proveedor_id ?? null;

    if (input.proveedor) {
      const proveedor = await tx.proveedores.create({
        data: {
          nombre: input.proveedor.nombre,
          tipo_documento: input.proveedor.tipo_documento,
          numero_documento: input.proveedor.numero_documento,
          correo: input.proveedor.correo,
          telefono: input.proveedor.telefono,
          direccion: input.proveedor.direccion,
          banco: input.proveedor.banco,
          tipo_cuenta_bancaria: input.proveedor.tipo_cuenta_bancaria,
          numero_cuenta_bancaria: input.proveedor.numero_cuenta_bancaria,
        },
      });

      proveedorId = proveedor.id;
    }

    return tx.beneficiarios_pago.create({
      data: {
        tipo_beneficiario: input.beneficiario.tipo_beneficiario,
        proveedor_id: proveedorId,
        usuario_id: input.beneficiario.usuario_id,
        nombre: input.beneficiario.nombre,
        tipo_documento: input.beneficiario.tipo_documento,
        numero_documento: input.beneficiario.numero_documento,
        medio_pago_preferido: input.beneficiario.medio_pago_preferido,
        banco: input.beneficiario.banco,
        tipo_cuenta_bancaria: input.beneficiario.tipo_cuenta_bancaria,
        numero_cuenta_bancaria: input.beneficiario.numero_cuenta_bancaria,
        telefono: input.beneficiario.telefono,
        correo: input.beneficiario.correo,
        notas: input.beneficiario.notas,
      },
      include: beneficiarioInclude,
    });
  });
}

export async function actualizarBeneficiarioRepository(
  id: string,
  input: BeneficiarioActualizadoRepositoryInput,
) {
  return prisma.$transaction(async (tx) => {
    const actual = await tx.beneficiarios_pago.findUniqueOrThrow({
      where: { id },
    });
    const tipoBeneficiario = input.tipo_beneficiario ?? actual.tipo_beneficiario;
    const tipoDocumento = input.tipo_documento ?? actual.tipo_documento;
    const numeroDocumento = input.numero_documento ?? actual.numero_documento;
    const nombre = input.nombre ?? actual.nombre;
    let proveedorId = actual.proveedor_id;

    if (tipoBeneficiario === "PROVEEDOR" && tipoDocumento && numeroDocumento) {
      if (proveedorId) {
        await tx.proveedores.update({
          where: { id: proveedorId },
          data: {
            nombre,
            tipo_documento: tipoDocumento,
            numero_documento: numeroDocumento,
            ...(input.correo !== undefined ? { correo: input.correo } : {}),
            ...(input.telefono !== undefined ? { telefono: input.telefono } : {}),
            ...(input.banco !== undefined ? { banco: input.banco } : {}),
            ...(input.tipo_cuenta_bancaria !== undefined
              ? { tipo_cuenta_bancaria: input.tipo_cuenta_bancaria }
              : {}),
            ...(input.numero_cuenta_bancaria !== undefined
              ? { numero_cuenta_bancaria: input.numero_cuenta_bancaria }
              : {}),
          },
        });
      } else {
        const proveedorExistente = await tx.proveedores.findFirst({
          where: { tipo_documento: tipoDocumento, numero_documento: numeroDocumento },
        });
        const proveedor = proveedorExistente ?? await tx.proveedores.create({
          data: {
            nombre,
            tipo_documento: tipoDocumento,
            numero_documento: numeroDocumento,
            correo: input.correo ?? actual.correo,
            telefono: input.telefono ?? actual.telefono,
            banco: input.banco ?? actual.banco,
            tipo_cuenta_bancaria: input.tipo_cuenta_bancaria ?? actual.tipo_cuenta_bancaria,
            numero_cuenta_bancaria: input.numero_cuenta_bancaria ?? actual.numero_cuenta_bancaria,
          },
        });
        proveedorId = proveedor.id;
      }
    } else {
      proveedorId = null;
    }

    return tx.beneficiarios_pago.update({
      where: { id },
      data: {
      ...(input.tipo_beneficiario !== undefined
        ? { tipo_beneficiario: input.tipo_beneficiario }
        : {}),
      ...(input.tipo_documento !== undefined
        ? { tipo_documento: input.tipo_documento }
        : {}),
      ...(input.numero_documento !== undefined
        ? { numero_documento: input.numero_documento }
        : {}),
      ...(proveedorId !== actual.proveedor_id ? { proveedor_id: proveedorId } : {}),
      ...(input.nombre !== undefined ? { nombre: input.nombre } : {}),
      ...(input.medio_pago_preferido !== undefined
        ? { medio_pago_preferido: input.medio_pago_preferido }
        : {}),
      ...(input.banco !== undefined ? { banco: input.banco } : {}),
      ...(input.tipo_cuenta_bancaria !== undefined
        ? { tipo_cuenta_bancaria: input.tipo_cuenta_bancaria }
        : {}),
      ...(input.numero_cuenta_bancaria !== undefined
        ? { numero_cuenta_bancaria: input.numero_cuenta_bancaria }
        : {}),
      ...(input.telefono !== undefined ? { telefono: input.telefono } : {}),
      ...(input.correo !== undefined ? { correo: input.correo } : {}),
      ...(input.notas !== undefined ? { notas: input.notas } : {}),
      ...(input.activo !== undefined ? { activo: input.activo } : {}),
    },
      include: beneficiarioInclude,
    });
  });
}
