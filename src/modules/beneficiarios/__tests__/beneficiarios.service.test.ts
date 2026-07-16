import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  actualizarBeneficiarioService,
  crearBeneficiarioService,
  listarBeneficiariosService,
  obtenerBeneficiarioPorIdService,
} from "../beneficiarios.service";
import {
  actualizarBeneficiarioRepository,
  crearBeneficiarioRepository,
  existeBeneficiarioPorDocumentoRepository,
  listarBeneficiariosRepository,
  obtenerBeneficiarioPorIdRepository,
  obtenerProveedorPorDocumentoRepository,
  obtenerUsuarioActivoPorIdRepository,
} from "../beneficiarios.repository";
import type { UsuarioSesion } from "@/modules/auth/auth.types";

vi.mock("../beneficiarios.repository", () => ({
  actualizarBeneficiarioRepository: vi.fn(),
  crearBeneficiarioRepository: vi.fn(),
  existeBeneficiarioPorDocumentoRepository: vi.fn(),
  listarBeneficiariosRepository: vi.fn(),
  obtenerBeneficiarioPorIdRepository: vi.fn(),
  obtenerProveedorPorDocumentoRepository: vi.fn(),
  obtenerUsuarioActivoPorIdRepository: vi.fn(),
}));

const usuarioAutorizado: UsuarioSesion = {
  id: "usuario-1",
  nombre: "Usuario Autorizado",
  correo: "autorizado@test.com",
  telefono: null,
  estado: "ACTIVO",
  roles: ["AUXILIAR_CONTABLE"],
  permisos: ["CREAR_SOLICITUDES"],
};

const usuarioSinPermisos: UsuarioSesion = {
  id: "usuario-2",
  nombre: "Usuario Sin Permisos",
  correo: "sinpermisos@test.com",
  telefono: null,
  estado: "ACTIVO",
  roles: ["PAGOS"],
  permisos: ["MARCAR_COMO_PAGADO"],
};

const beneficiarioMock = {
  id: "beneficiario-1",
  tipo_beneficiario: "TRABAJADOR",
  proveedor_id: null,
  usuario_id: null,
  nombre: "JUAN PEREZ",
  tipo_documento: "CC",
  numero_documento: "123456789",
  medio_pago_preferido: "TRANSFERENCIA",
  banco: "BANCOLOMBIA",
  tipo_cuenta_bancaria: "AHORROS",
  numero_cuenta_bancaria: "1234567890",
  telefono: "3001234567",
  correo: "juan@test.com",
  notas: null,
  activo: true,
  creado_en: new Date("2026-07-01T10:00:00.000Z"),
  actualizado_en: new Date("2026-07-01T10:00:00.000Z"),
};

describe("beneficiarios.service - listarBeneficiariosService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe lanzar error si el usuario no tiene permisos", async () => {
    await expect(
      listarBeneficiariosService(usuarioSinPermisos),
    ).rejects.toThrow("No autorizado.");

    expect(listarBeneficiariosRepository).not.toHaveBeenCalled();
  });

  it("debe listar beneficiarios con filtros normalizados", async () => {
    vi.mocked(listarBeneficiariosRepository).mockResolvedValue([
      beneficiarioMock,
    ] as never);

    const resultado = await listarBeneficiariosService(usuarioAutorizado, {
      tipo_beneficiario: "TRABAJADOR",
      activo: true,
      busqueda: "  juan  ",
    });

    expect(resultado).toHaveLength(1);

    expect(listarBeneficiariosRepository).toHaveBeenCalledWith({
      tipo_beneficiario: "TRABAJADOR",
      activo: true,
      busqueda: "juan",
    });
  });
});

describe("beneficiarios.service - obtenerBeneficiarioPorIdService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe lanzar error si el usuario no tiene permisos", async () => {
    await expect(
      obtenerBeneficiarioPorIdService(usuarioSinPermisos, "beneficiario-1"),
    ).rejects.toThrow("No autorizado.");

    expect(obtenerBeneficiarioPorIdRepository).not.toHaveBeenCalled();
  });

  it("debe lanzar error si falta el ID", async () => {
    await expect(
      obtenerBeneficiarioPorIdService(usuarioAutorizado, ""),
    ).rejects.toThrow("El ID del beneficiario es obligatorio.");

    expect(obtenerBeneficiarioPorIdRepository).not.toHaveBeenCalled();
  });

  it("debe lanzar error si el beneficiario no existe", async () => {
    vi.mocked(obtenerBeneficiarioPorIdRepository).mockResolvedValue(null);

    await expect(
      obtenerBeneficiarioPorIdService(usuarioAutorizado, "beneficiario-x"),
    ).rejects.toThrow("El beneficiario no existe.");

    expect(obtenerBeneficiarioPorIdRepository).toHaveBeenCalledWith(
      "beneficiario-x",
    );
  });

  it("debe retornar beneficiario si existe", async () => {
    vi.mocked(obtenerBeneficiarioPorIdRepository).mockResolvedValue(
      beneficiarioMock as never,
    );

    const resultado = await obtenerBeneficiarioPorIdService(
      usuarioAutorizado,
      "beneficiario-1",
    );

    expect(resultado.id).toBe("beneficiario-1");
    expect(obtenerBeneficiarioPorIdRepository).toHaveBeenCalledWith(
      "beneficiario-1",
    );
  });
});

describe("beneficiarios.service - crearBeneficiarioService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const inputBase = {
    tipo_beneficiario: "TRABAJADOR" as const,
    nombre: " Juan   Perez ",
    tipo_documento: "cc",
    numero_documento: " 123456789 ",
    medio_pago_preferido: "TRANSFERENCIA" as const,
    banco: " Bancolombia ",
    tipo_cuenta_bancaria: "AHORROS" as const,
    numero_cuenta_bancaria: " 1234567890 ",
    telefono: " 3001234567 ",
    correo: " JUAN@TEST.COM ",
    notas: "  Beneficiario de prueba  ",
  };

  it("debe lanzar error si el usuario no tiene permisos", async () => {
    await expect(
      crearBeneficiarioService(usuarioSinPermisos, inputBase),
    ).rejects.toThrow("No autorizado.");

    expect(crearBeneficiarioRepository).not.toHaveBeenCalled();
  });

  it("debe lanzar error si el tipo de beneficiario no es válido", async () => {
    await expect(
      crearBeneficiarioService(usuarioAutorizado, {
        ...inputBase,
        tipo_beneficiario: "CLIENTE" as never,
      }),
    ).rejects.toThrow("El tipo de beneficiario no es válido.");

    expect(crearBeneficiarioRepository).not.toHaveBeenCalled();
  });

  it("debe lanzar error si un trabajador tiene tipo de documento NIT", async () => {
    await expect(
      crearBeneficiarioService(usuarioAutorizado, {
        ...inputBase,
        tipo_beneficiario: "TRABAJADOR",
        tipo_documento: "NIT",
      }),
    ).rejects.toThrow(
      "Un beneficiario tipo TRABAJADOR no puede tener tipo de identificación NIT.",
    );

    expect(
      existeBeneficiarioPorDocumentoRepository,
    ).not.toHaveBeenCalled();

    expect(crearBeneficiarioRepository).not.toHaveBeenCalled();
  });

  it("debe lanzar error si falta el nombre", async () => {
    await expect(
      crearBeneficiarioService(usuarioAutorizado, {
        ...inputBase,
        nombre: "",
      }),
    ).rejects.toThrow("El nombre del beneficiario es obligatorio.");

    expect(crearBeneficiarioRepository).not.toHaveBeenCalled();
  });

  it("debe lanzar error si falta el tipo de documento", async () => {
    await expect(
      crearBeneficiarioService(usuarioAutorizado, {
        ...inputBase,
        tipo_documento: "",
      }),
    ).rejects.toThrow(
      "El tipo de documento del beneficiario es obligatorio.",
    );

    expect(crearBeneficiarioRepository).not.toHaveBeenCalled();
  });

  it("debe lanzar error si falta el número de documento", async () => {
    await expect(
      crearBeneficiarioService(usuarioAutorizado, {
        ...inputBase,
        numero_documento: "",
      }),
    ).rejects.toThrow(
      "El número de documento del beneficiario es obligatorio.",
    );

    expect(crearBeneficiarioRepository).not.toHaveBeenCalled();
  });

  it("debe lanzar error si el medio de pago no es válido", async () => {
    await expect(
      crearBeneficiarioService(usuarioAutorizado, {
        ...inputBase,
        medio_pago_preferido: "CHEQUE" as never,
      }),
    ).rejects.toThrow("El medio de pago preferido no es válido.");

    expect(crearBeneficiarioRepository).not.toHaveBeenCalled();
  });

  it("debe lanzar error si el tipo de cuenta no es válido", async () => {
    await expect(
      crearBeneficiarioService(usuarioAutorizado, {
        ...inputBase,
        tipo_cuenta_bancaria: "DAVIPLATA" as never,
      }),
    ).rejects.toThrow("El tipo de cuenta bancaria no es válido.");

    expect(crearBeneficiarioRepository).not.toHaveBeenCalled();
  });

  it("debe lanzar error si ya existe un beneficiario activo con el documento", async () => {
    vi.mocked(
      existeBeneficiarioPorDocumentoRepository,
    ).mockResolvedValue({
      id: "beneficiario-existente",
      activo: true,
    });

    await expect(
      crearBeneficiarioService(usuarioAutorizado, inputBase),
    ).rejects.toThrow(
      "Ya existe un beneficiario activo con ese tipo y número de documento.",
    );

    expect(
      existeBeneficiarioPorDocumentoRepository,
    ).toHaveBeenCalledWith(
      "CC",
      "123456789",
    );

    expect(crearBeneficiarioRepository).not.toHaveBeenCalled();
  });

  it("debe indicar que se reactive un beneficiario inactivo con el mismo documento", async () => {
    vi.mocked(
      existeBeneficiarioPorDocumentoRepository,
    ).mockResolvedValue({
      id: "beneficiario-inactivo",
      activo: false,
    });

    await expect(
      crearBeneficiarioService(usuarioAutorizado, inputBase),
    ).rejects.toThrow(
      "Ya existe un beneficiario inactivo con ese tipo y número de documento. Reactívelo en lugar de crear uno nuevo.",
    );

    expect(
      existeBeneficiarioPorDocumentoRepository,
    ).toHaveBeenCalledWith(
      "CC",
      "123456789",
    );

    expect(crearBeneficiarioRepository).not.toHaveBeenCalled();
  });

  it("debe lanzar error si el usuario asociado no existe o está inactivo", async () => {
    vi.mocked(existeBeneficiarioPorDocumentoRepository).mockResolvedValue(false);
    vi.mocked(obtenerUsuarioActivoPorIdRepository).mockResolvedValue(null);

    await expect(
      crearBeneficiarioService(usuarioAutorizado, {
        ...inputBase,
        usuario_id: "usuario-inactivo",
      }),
    ).rejects.toThrow("El usuario asociado no existe o está inactivo.");

    expect(obtenerUsuarioActivoPorIdRepository).toHaveBeenCalledWith(
      "usuario-inactivo",
    );

    expect(crearBeneficiarioRepository).not.toHaveBeenCalled();
  });

  it("debe crear beneficiario trabajador normalizado", async () => {
    vi.mocked(existeBeneficiarioPorDocumentoRepository).mockResolvedValue(false);

    vi.mocked(crearBeneficiarioRepository).mockResolvedValue(
      beneficiarioMock as never,
    );

    const resultado = await crearBeneficiarioService(
      usuarioAutorizado,
      inputBase,
    );

    expect(resultado.id).toBe("beneficiario-1");

    expect(crearBeneficiarioRepository).toHaveBeenCalledWith({
      beneficiario: {
        tipo_beneficiario: "TRABAJADOR",
        proveedor_id: null,
        usuario_id: null,
        nombre: "JUAN PEREZ",
        tipo_documento: "CC",
        numero_documento: "123456789",
        medio_pago_preferido: "TRANSFERENCIA",
        banco: "BANCOLOMBIA",
        tipo_cuenta_bancaria: "AHORROS",
        numero_cuenta_bancaria: "1234567890",
        telefono: "3001234567",
        correo: "juan@test.com",
        notas: "Beneficiario de prueba",
      },
      proveedor: null,
    });
  });

  it("debe lanzar error si se envía proveedor_id y proveedor nuevo al mismo tiempo", async () => {
    vi.mocked(existeBeneficiarioPorDocumentoRepository).mockResolvedValue(false);

    await expect(
      crearBeneficiarioService(usuarioAutorizado, {
        ...inputBase,
        tipo_beneficiario: "PROVEEDOR",
        proveedor_id: "proveedor-1",
        proveedor: {
          nombre: "Proveedor Uno",
          tipo_documento: "NIT",
          numero_documento: "900123456",
          banco: "Bancolombia",
          tipo_cuenta_bancaria: "CORRIENTE",
          numero_cuenta_bancaria: "111222333",
        },
      }),
    ).rejects.toThrow(
      "Debe enviar proveedor_id o proveedor nuevo, pero no ambos.",
    );

    expect(crearBeneficiarioRepository).not.toHaveBeenCalled();
  });

  it("debe lanzar error si ya existe proveedor activo con ese documento", async () => {
    vi.mocked(existeBeneficiarioPorDocumentoRepository).mockResolvedValue(false);

    vi.mocked(obtenerProveedorPorDocumentoRepository).mockResolvedValue({
      id: "proveedor-1",
    } as never);

    await expect(
      crearBeneficiarioService(usuarioAutorizado, {
        ...inputBase,
        tipo_beneficiario: "PROVEEDOR",
        proveedor: {
          nombre: "Proveedor Uno",
          tipo_documento: "NIT",
          numero_documento: "900123456",
          banco: "Bancolombia",
          tipo_cuenta_bancaria: "CORRIENTE",
          numero_cuenta_bancaria: "111222333",
        },
      }),
    ).rejects.toThrow("Ya existe un proveedor activo con ese documento.");

    expect(obtenerProveedorPorDocumentoRepository).toHaveBeenCalledWith(
      "NIT",
      "900123456",
    );

    expect(crearBeneficiarioRepository).not.toHaveBeenCalled();
  });

  it("debe crear beneficiario proveedor con proveedor nuevo", async () => {
    vi.mocked(existeBeneficiarioPorDocumentoRepository).mockResolvedValue(false);
    vi.mocked(obtenerProveedorPorDocumentoRepository).mockResolvedValue(null);

    vi.mocked(crearBeneficiarioRepository).mockResolvedValue(
      {
        ...beneficiarioMock,
        tipo_beneficiario: "PROVEEDOR",
        proveedor_id: "proveedor-1",
      } as never,
    );

    const resultado = await crearBeneficiarioService(usuarioAutorizado, {
      ...inputBase,
      tipo_beneficiario: "PROVEEDOR",
      proveedor: {
        nombre: " Proveedor   Uno ",
        tipo_documento: "nit",
        numero_documento: " 900123456 ",
        correo: " PROVEEDOR@TEST.COM ",
        telefono: " 6011234567 ",
        direccion: " Calle 1 ",
        banco: " Davivienda ",
        tipo_cuenta_bancaria: "CORRIENTE",
        numero_cuenta_bancaria: " 111222333 ",
      },
    });

    expect(resultado.tipo_beneficiario).toBe("PROVEEDOR");

    expect(obtenerProveedorPorDocumentoRepository).toHaveBeenCalledWith(
      "NIT",
      "900123456",
    );

    expect(crearBeneficiarioRepository).toHaveBeenCalledWith({
      beneficiario: {
        tipo_beneficiario: "PROVEEDOR",
        proveedor_id: null,
        usuario_id: null,
        nombre: "JUAN PEREZ",
        tipo_documento: "CC",
        numero_documento: "123456789",
        medio_pago_preferido: "TRANSFERENCIA",
        banco: "BANCOLOMBIA",
        tipo_cuenta_bancaria: "AHORROS",
        numero_cuenta_bancaria: "1234567890",
        telefono: "3001234567",
        correo: "juan@test.com",
        notas: "Beneficiario de prueba",
      },
      proveedor: {
        nombre: "PROVEEDOR UNO",
        tipo_documento: "NIT",
        numero_documento: "900123456",
        correo: "proveedor@test.com",
        telefono: "6011234567",
        direccion: "Calle 1",
        banco: "DAVIVIENDA",
        tipo_cuenta_bancaria: "CORRIENTE",
        numero_cuenta_bancaria: "111222333",
      },
    });
  });
});

describe("beneficiarios.service - actualizarBeneficiarioService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe lanzar error si el usuario no tiene permisos", async () => {
    await expect(
      actualizarBeneficiarioService(usuarioSinPermisos, "beneficiario-1", {
        telefono: "3101234567",
      }),
    ).rejects.toThrow("No autorizado.");

    expect(obtenerBeneficiarioPorIdRepository).not.toHaveBeenCalled();
    expect(actualizarBeneficiarioRepository).not.toHaveBeenCalled();
  });

  it("debe lanzar error si falta el ID", async () => {
    await expect(
      actualizarBeneficiarioService(usuarioAutorizado, "", {
        telefono: "3101234567",
      }),
    ).rejects.toThrow("El ID del beneficiario es obligatorio.");

    expect(obtenerBeneficiarioPorIdRepository).not.toHaveBeenCalled();
    expect(actualizarBeneficiarioRepository).not.toHaveBeenCalled();
  });

  it("debe lanzar error si el beneficiario no existe", async () => {
    vi.mocked(obtenerBeneficiarioPorIdRepository).mockResolvedValue(null);

    await expect(
      actualizarBeneficiarioService(usuarioAutorizado, "beneficiario-x", {
        telefono: "3101234567",
      }),
    ).rejects.toThrow("El beneficiario no existe.");

    expect(obtenerBeneficiarioPorIdRepository).toHaveBeenCalledWith(
      "beneficiario-x",
    );

    expect(actualizarBeneficiarioRepository).not.toHaveBeenCalled();
  });

  it("debe lanzar error si el cuerpo está vacío", async () => {
    vi.mocked(obtenerBeneficiarioPorIdRepository).mockResolvedValue(
      beneficiarioMock as never,
    );

    await expect(
      actualizarBeneficiarioService(usuarioAutorizado, "beneficiario-1", {}),
    ).rejects.toThrow("Debe enviar al menos un campo para actualizar.");

    expect(obtenerBeneficiarioPorIdRepository).toHaveBeenCalledWith(
      "beneficiario-1",
    );

    expect(actualizarBeneficiarioRepository).not.toHaveBeenCalled();
  });

  it("debe lanzar error si el nombre viene vacío", async () => {
    vi.mocked(obtenerBeneficiarioPorIdRepository).mockResolvedValue(
      beneficiarioMock as never,
    );

    await expect(
      actualizarBeneficiarioService(usuarioAutorizado, "beneficiario-1", {
        nombre: "   ",
      }),
    ).rejects.toThrow("El campo nombre es obligatorio.");

    expect(actualizarBeneficiarioRepository).not.toHaveBeenCalled();
  });

  it("debe lanzar error si el medio de pago no es válido", async () => {
    vi.mocked(obtenerBeneficiarioPorIdRepository).mockResolvedValue(
      beneficiarioMock as never,
    );

    await expect(
      actualizarBeneficiarioService(usuarioAutorizado, "beneficiario-1", {
        medio_pago_preferido: "CHEQUE" as never,
      }),
    ).rejects.toThrow("El medio de pago preferido no es válido.");

    expect(actualizarBeneficiarioRepository).not.toHaveBeenCalled();
  });

  it("debe lanzar error si el tipo de cuenta bancaria no es válido", async () => {
    vi.mocked(obtenerBeneficiarioPorIdRepository).mockResolvedValue(
      beneficiarioMock as never,
    );

    await expect(
      actualizarBeneficiarioService(usuarioAutorizado, "beneficiario-1", {
        tipo_cuenta_bancaria: "DAVIPLATA" as never,
      }),
    ).rejects.toThrow("El tipo de cuenta bancaria no es válido.");

    expect(actualizarBeneficiarioRepository).not.toHaveBeenCalled();
  });

  it("debe lanzar error si el correo no tiene formato válido", async () => {
    vi.mocked(obtenerBeneficiarioPorIdRepository).mockResolvedValue(
      beneficiarioMock as never,
    );

    await expect(
      actualizarBeneficiarioService(usuarioAutorizado, "beneficiario-1", {
        correo: "correo-malo",
      }),
    ).rejects.toThrow(
      "El correo del beneficiario no tiene un formato válido.",
    );

    expect(actualizarBeneficiarioRepository).not.toHaveBeenCalled();
  });

  it("debe lanzar error si activo no es booleano", async () => {
    vi.mocked(obtenerBeneficiarioPorIdRepository).mockResolvedValue(
      beneficiarioMock as never,
    );

    await expect(
      actualizarBeneficiarioService(usuarioAutorizado, "beneficiario-1", {
        activo: "false" as never,
      }),
    ).rejects.toThrow("El campo activo debe ser verdadero o falso.");

    expect(actualizarBeneficiarioRepository).not.toHaveBeenCalled();
  });

  it("debe actualizar datos de contacto normalizados", async () => {
    vi.mocked(obtenerBeneficiarioPorIdRepository).mockResolvedValue(
      beneficiarioMock as never,
    );

    vi.mocked(actualizarBeneficiarioRepository).mockResolvedValue({
      ...beneficiarioMock,
      telefono: "3101234567",
      correo: "proveedor.actualizado@test.com",
      notas: "Nota actualizada",
    } as never);

    const resultado = await actualizarBeneficiarioService(
      usuarioAutorizado,
      "beneficiario-1",
      {
        telefono: " 3101234567 ",
        correo: " PROVEEDOR.ACTUALIZADO@TEST.COM ",
        notas: "  Nota   actualizada  ",
      },
    );

    expect(resultado.telefono).toBe("3101234567");
    expect(resultado.correo).toBe("proveedor.actualizado@test.com");
    expect(resultado.notas).toBe("Nota actualizada");

    expect(actualizarBeneficiarioRepository).toHaveBeenCalledWith(
      "beneficiario-1",
      {
        telefono: "3101234567",
        correo: "proveedor.actualizado@test.com",
        notas: "Nota actualizada",
      },
    );
  });

  it("debe actualizar datos bancarios normalizados", async () => {
    vi.mocked(obtenerBeneficiarioPorIdRepository).mockResolvedValue(
      beneficiarioMock as never,
    );

    vi.mocked(actualizarBeneficiarioRepository).mockResolvedValue({
      ...beneficiarioMock,
      banco: "BBVA",
      numero_cuenta_bancaria: "12345",
    } as never);

    const resultado = await actualizarBeneficiarioService(
      usuarioAutorizado,
      "beneficiario-1",
      {
        medio_pago_preferido: "TRANSFERENCIA",
        banco: " bbva ",
        tipo_cuenta_bancaria: "AHORROS",
        numero_cuenta_bancaria: " 12345 ",
      },
    );

    expect(resultado.banco).toBe("BBVA");
    expect(resultado.numero_cuenta_bancaria).toBe("12345");

    expect(actualizarBeneficiarioRepository).toHaveBeenCalledWith(
      "beneficiario-1",
      {
        medio_pago_preferido: "TRANSFERENCIA",
        banco: "BBVA",
        tipo_cuenta_bancaria: "AHORROS",
        numero_cuenta_bancaria: "12345",
      },
    );
  });

  it("debe activar o inactivar beneficiario", async () => {
    vi.mocked(obtenerBeneficiarioPorIdRepository).mockResolvedValue(
      beneficiarioMock as never,
    );

    vi.mocked(actualizarBeneficiarioRepository).mockResolvedValue({
      ...beneficiarioMock,
      activo: false,
    } as never);

    const resultado = await actualizarBeneficiarioService(
      usuarioAutorizado,
      "beneficiario-1",
      {
        activo: false,
      },
    );

    expect(resultado.activo).toBe(false);

    expect(actualizarBeneficiarioRepository).toHaveBeenCalledWith(
      "beneficiario-1",
      {
        activo: false,
      },
    );
  });

  it("debe permitir limpiar campos opcionales enviando null", async () => {
    vi.mocked(obtenerBeneficiarioPorIdRepository).mockResolvedValue(
      beneficiarioMock as never,
    );

    vi.mocked(actualizarBeneficiarioRepository).mockResolvedValue({
      ...beneficiarioMock,
      telefono: null,
      correo: null,
      notas: null,
    } as never);

    const resultado = await actualizarBeneficiarioService(
      usuarioAutorizado,
      "beneficiario-1",
      {
        telefono: null,
        correo: null,
        notas: null,
      },
    );

    expect(resultado.telefono).toBeNull();
    expect(resultado.correo).toBeNull();
    expect(resultado.notas).toBeNull();

    expect(actualizarBeneficiarioRepository).toHaveBeenCalledWith(
      "beneficiario-1",
      {
        telefono: null,
        correo: null,
        notas: null,
      },
    );
  });
});