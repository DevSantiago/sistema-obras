import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  cambiarEstadoCentroCostoService,
  crearProyectoBaseService,
  listarProyectosBaseService,
  obtenerProyectoBasePorIdService,
} from "../proyectos-base.service";

import {
  cambiarEstadoCentroCostoRepository,
  crearProyectoBaseConCentroCostoRepository,
  existeProyectoBasePorNombreRepository,
  listarProyectosBaseRepository,
  obtenerCentroCostoPorProyectoRepository,
  obtenerProyectoBasePorIdRepository,
} from "../proyectos-base.repository";

vi.mock("../proyectos-base.repository", () => ({
  listarProyectosBaseRepository: vi.fn(),
  obtenerProyectoBasePorIdRepository: vi.fn(),
  existeProyectoBasePorNombreRepository: vi.fn(),
  crearProyectoBaseConCentroCostoRepository: vi.fn(),
  obtenerCentroCostoPorProyectoRepository: vi.fn(),
  cambiarEstadoCentroCostoRepository: vi.fn(),
}));

const fechaMock = new Date("2026-06-23T10:00:00.000Z");

const centroCostoProObraLicitacionMock = {
  id: "centro-pro-obra-1",
  proyecto_base_id: "proyecto-1",
  linea_negocio: "OBRA",
  fase_centro_costo: "LICITACION",
  prefijo: "PRO-OBRA",
  codigo: "PRO-OBRA - CONSTRUCCION SEDE ADMINISTRATIVA",
  nombre: "PRO-OBRA - CONSTRUCCION SEDE ADMINISTRATIVA",
  descripcion: null,
  estado_centro_costo: "EN_LICITACION",
  creado_directamente_en_ejecucion: false,
  motivo_creacion_ejecucion: null,
  fecha_inicio_ejecucion: null,
  soporte_inicio_ejecucion_adjunto_id: null,
  observacion_inicio_ejecucion: null,
  inicio_ejecucion_por: null,
  inicio_ejecucion_en: null,
  activo: true,
  creado_en: fechaMock,
  actualizado_en: fechaMock,
};

const centroCostoProObraFinalizadoMock = {
  ...centroCostoProObraLicitacionMock,
  estado_centro_costo: "FINALIZADO",
};

const centroCostoProIntLicitacionMock = {
  id: "centro-pro-int-1",
  proyecto_base_id: "proyecto-1",
  linea_negocio: "INTERVENTORIA",
  fase_centro_costo: "LICITACION",
  prefijo: "PRO-INT",
  codigo: "PRO-INT - CONSTRUCCION SEDE ADMINISTRATIVA",
  nombre: "PRO-INT - CONSTRUCCION SEDE ADMINISTRATIVA",
  descripcion: null,
  estado_centro_costo: "EN_LICITACION",
  creado_directamente_en_ejecucion: false,
  motivo_creacion_ejecucion: null,
  fecha_inicio_ejecucion: null,
  soporte_inicio_ejecucion_adjunto_id: null,
  observacion_inicio_ejecucion: null,
  inicio_ejecucion_por: null,
  inicio_ejecucion_en: null,
  activo: true,
  creado_en: fechaMock,
  actualizado_en: fechaMock,
};

const centroCostoObraEjecucionMock = {
  id: "centro-obra-1",
  proyecto_base_id: "proyecto-1",
  linea_negocio: "OBRA",
  fase_centro_costo: "EJECUCION",
  prefijo: "OBRA",
  codigo: "OBRA - CONSTRUCCION SEDE ADMINISTRATIVA",
  nombre: "OBRA - CONSTRUCCION SEDE ADMINISTRATIVA",
  descripcion: null,
  estado_centro_costo: "EN_EJECUCION",
  creado_directamente_en_ejecucion: false,
  motivo_creacion_ejecucion:
    "Centro de costo creado por avance desde fase de licitación.",
  fecha_inicio_ejecucion: fechaMock,
  soporte_inicio_ejecucion_adjunto_id: null,
  observacion_inicio_ejecucion: "Inicio de ejecución aprobado",
  inicio_ejecucion_por: "admin-1",
  inicio_ejecucion_en: fechaMock,
  activo: true,
  creado_en: fechaMock,
  actualizado_en: fechaMock,
};

const centroCostoObraFinalizadoMock = {
  ...centroCostoObraEjecucionMock,
  estado_centro_costo: "FINALIZADO",
};

const proyectoBaseMock = {
  id: "proyecto-1",
  nombre: "CONSTRUCCION SEDE ADMINISTRATIVA",
  descripcion: "Proyecto de prueba",
  estado_proyecto: "EN_LICITACION",
  activo: true,
  creado_por: "admin-1",
  creado_en: fechaMock,
  actualizado_en: fechaMock,
  fondo: {
    id: "fondo-1",
    proyecto_base_id: "proyecto-1",
    nombre: "FONDO GENERAL - CONSTRUCCION SEDE ADMINISTRATIVA",
    descripcion: null,
    saldo_actual: "0",
    activo: true,
    creado_por: "admin-1",
    creado_en: fechaMock,
    actualizado_en: fechaMock,
  },
  centros_costo: [centroCostoProObraLicitacionMock],
};

describe("proyectos-base.service - listarProyectosBaseService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe listar proyectos base", async () => {
    vi.mocked(listarProyectosBaseRepository).mockResolvedValue([
      proyectoBaseMock,
    ] as never);

    const resultado = await listarProyectosBaseService({
      estado_proyecto: "EN_LICITACION",
      activo: true,
    });

    expect(resultado).toHaveLength(1);
    expect(resultado[0].id).toBe("proyecto-1");

    expect(listarProyectosBaseRepository).toHaveBeenCalledWith({
      estado_proyecto: "EN_LICITACION",
      activo: true,
    });
  });
});

describe("proyectos-base.service - obtenerProyectoBasePorIdService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe lanzar error si no se envía id", async () => {
    await expect(obtenerProyectoBasePorIdService("")).rejects.toThrow(
      "El ID del proyecto base es obligatorio.",
    );

    expect(obtenerProyectoBasePorIdRepository).not.toHaveBeenCalled();
  });

  it("debe lanzar error si el proyecto base no existe", async () => {
    vi.mocked(obtenerProyectoBasePorIdRepository).mockResolvedValue(null);

    await expect(
      obtenerProyectoBasePorIdService("proyecto-no-existe"),
    ).rejects.toThrow("El proyecto base no existe.");

    expect(obtenerProyectoBasePorIdRepository).toHaveBeenCalledWith(
      "proyecto-no-existe",
    );
  });

  it("debe retornar el proyecto base si existe", async () => {
    vi.mocked(obtenerProyectoBasePorIdRepository).mockResolvedValue(
      proyectoBaseMock as never,
    );

    const resultado = await obtenerProyectoBasePorIdService("proyecto-1");

    expect(resultado.id).toBe("proyecto-1");
    expect(resultado.fondo?.id).toBe("fondo-1");
    expect(resultado.centros_costo).toHaveLength(1);

    expect(obtenerProyectoBasePorIdRepository).toHaveBeenCalledWith(
      "proyecto-1",
    );
  });
});

describe("proyectos-base.service - crearProyectoBaseService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe lanzar error si falta el nombre", async () => {
    await expect(
      crearProyectoBaseService({
        nombre: "",
        centros_costo: [
          {
            linea_negocio: "OBRA",
            fase_centro_costo: "LICITACION",
          },
        ],
      }),
    ).rejects.toThrow("El nombre del proyecto base es obligatorio.");

    expect(existeProyectoBasePorNombreRepository).not.toHaveBeenCalled();
    expect(crearProyectoBaseConCentroCostoRepository).not.toHaveBeenCalled();
  });

  it("debe lanzar error si no se envían centros de costo", async () => {
    await expect(
      crearProyectoBaseService({
        nombre: "Proyecto prueba",
        centros_costo: [],
      }),
    ).rejects.toThrow("Debe seleccionar al menos un centro de costo.");

    expect(existeProyectoBasePorNombreRepository).not.toHaveBeenCalled();
    expect(crearProyectoBaseConCentroCostoRepository).not.toHaveBeenCalled();
  });

  it("debe lanzar error si la línea de negocio no es válida", async () => {
    await expect(
      crearProyectoBaseService({
        nombre: "Proyecto prueba",
        centros_costo: [
          {
            linea_negocio: "CONSULTORIA" as never,
            fase_centro_costo: "LICITACION",
          },
        ],
      }),
    ).rejects.toThrow("La línea de negocio del centro de costo no es válida.");

    expect(existeProyectoBasePorNombreRepository).not.toHaveBeenCalled();
    expect(crearProyectoBaseConCentroCostoRepository).not.toHaveBeenCalled();
  });

  it("debe lanzar error si la fase del centro de costo no es válida", async () => {
    await expect(
      crearProyectoBaseService({
        nombre: "Proyecto prueba",
        centros_costo: [
          {
            linea_negocio: "OBRA",
            fase_centro_costo: "PLANEACION" as never,
          },
        ],
      }),
    ).rejects.toThrow("La fase del centro de costo no es válida.");

    expect(existeProyectoBasePorNombreRepository).not.toHaveBeenCalled();
    expect(crearProyectoBaseConCentroCostoRepository).not.toHaveBeenCalled();
  });

  it("debe lanzar error si se intenta crear inicialmente un centro en fase de ejecución", async () => {
    await expect(
      crearProyectoBaseService({
        nombre: "Proyecto prueba",
        centros_costo: [
          {
            linea_negocio: "INTERVENTORIA",
            fase_centro_costo: "EJECUCION",
          },
        ],
      }),
    ).rejects.toThrow(
      "Los centros de costo iniciales deben crearse en fase de licitación.",
    );

    expect(existeProyectoBasePorNombreRepository).not.toHaveBeenCalled();
    expect(crearProyectoBaseConCentroCostoRepository).not.toHaveBeenCalled();
  });

  it("debe lanzar error si se repiten centros de costo iniciales", async () => {
    await expect(
      crearProyectoBaseService({
        nombre: "Proyecto prueba",
        centros_costo: [
          {
            linea_negocio: "OBRA",
            fase_centro_costo: "LICITACION",
          },
          {
            linea_negocio: "OBRA",
            fase_centro_costo: "LICITACION",
          },
        ],
      }),
    ).rejects.toThrow("No se pueden repetir centros de costo iniciales.");

    expect(existeProyectoBasePorNombreRepository).not.toHaveBeenCalled();
    expect(crearProyectoBaseConCentroCostoRepository).not.toHaveBeenCalled();
  });

  it("debe lanzar error si ya existe un proyecto base activo con ese nombre", async () => {
    vi.mocked(existeProyectoBasePorNombreRepository).mockResolvedValue(true);

    await expect(
      crearProyectoBaseService({
        nombre: "Construccion sede administrativa",
        centros_costo: [
          {
            linea_negocio: "OBRA",
            fase_centro_costo: "LICITACION",
          },
        ],
      }),
    ).rejects.toThrow("Ya existe un proyecto base activo con ese nombre.");

    expect(existeProyectoBasePorNombreRepository).toHaveBeenCalledWith(
      "CONSTRUCCION SEDE ADMINISTRATIVA",
    );
    expect(crearProyectoBaseConCentroCostoRepository).not.toHaveBeenCalled();
  });

  it("debe crear proyecto base con centros iniciales en fase de licitación", async () => {
    vi.mocked(existeProyectoBasePorNombreRepository).mockResolvedValue(false);
    vi.mocked(crearProyectoBaseConCentroCostoRepository).mockResolvedValue(
      {
        ...proyectoBaseMock,
        centros_costo: [
          centroCostoProObraLicitacionMock,
          centroCostoProIntLicitacionMock,
        ],
      } as never,
    );

    const resultado = await crearProyectoBaseService({
      nombre: "  Construccion   sede administrativa  ",
      descripcion: "  Proyecto de prueba  ",
      creado_por: "admin-1",
      centros_costo: [
        {
          linea_negocio: "OBRA",
          fase_centro_costo: "LICITACION",
        },
        {
          linea_negocio: "INTERVENTORIA",
          fase_centro_costo: "LICITACION",
          descripcion: "Proyecto de interventoría",
        },
      ],
    });

    expect(resultado.id).toBe("proyecto-1");

    expect(existeProyectoBasePorNombreRepository).toHaveBeenCalledWith(
      "CONSTRUCCION SEDE ADMINISTRATIVA",
    );

    expect(crearProyectoBaseConCentroCostoRepository).toHaveBeenCalledWith(
      {
        nombre: "CONSTRUCCION SEDE ADMINISTRATIVA",
        descripcion: "Proyecto de prueba",
        creado_por: "admin-1",
        centros_costo: [
          {
            linea_negocio: "OBRA",
            fase_centro_costo: "LICITACION",
          },
          {
            linea_negocio: "INTERVENTORIA",
            fase_centro_costo: "LICITACION",
            descripcion: "Proyecto de interventoría",
          },
        ],
      },
      [
        {
          linea_negocio: "OBRA",
          fase_centro_costo: "LICITACION",
          prefijo: "PRO-OBRA",
          codigo: "PRO-OBRA - CONSTRUCCION SEDE ADMINISTRATIVA",
          nombre: "PRO-OBRA - CONSTRUCCION SEDE ADMINISTRATIVA",
          descripcion: undefined,
          estado_centro_costo: "EN_LICITACION",
        },
        {
          linea_negocio: "INTERVENTORIA",
          fase_centro_costo: "LICITACION",
          prefijo: "PRO-INT",
          codigo: "PRO-INT - CONSTRUCCION SEDE ADMINISTRATIVA",
          nombre: "PRO-INT - CONSTRUCCION SEDE ADMINISTRATIVA",
          descripcion: "Proyecto de interventoría",
          estado_centro_costo: "EN_LICITACION",
        },
      ],
    );
  });
});

describe("proyectos-base.service - cambiarEstadoCentroCostoService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe lanzar error si falta el ID del proyecto base", async () => {
    await expect(
      cambiarEstadoCentroCostoService("", "centro-1", {
        estado_centro_costo: "EN_EJECUCION",
        usuario_id: "admin-1",
      }),
    ).rejects.toThrow("El ID del proyecto base es obligatorio.");

    expect(obtenerCentroCostoPorProyectoRepository).not.toHaveBeenCalled();
    expect(cambiarEstadoCentroCostoRepository).not.toHaveBeenCalled();
  });

  it("debe lanzar error si falta el ID del centro de costo", async () => {
    await expect(
      cambiarEstadoCentroCostoService("proyecto-1", "", {
        estado_centro_costo: "EN_EJECUCION",
        usuario_id: "admin-1",
      }),
    ).rejects.toThrow("El ID del centro de costo es obligatorio.");

    expect(obtenerCentroCostoPorProyectoRepository).not.toHaveBeenCalled();
    expect(cambiarEstadoCentroCostoRepository).not.toHaveBeenCalled();
  });

  it("debe lanzar error si falta el usuario que realiza el cambio", async () => {
    await expect(
      cambiarEstadoCentroCostoService("proyecto-1", "centro-1", {
        estado_centro_costo: "EN_EJECUCION",
        usuario_id: "",
      }),
    ).rejects.toThrow("El usuario que realiza el cambio es obligatorio.");

    expect(obtenerCentroCostoPorProyectoRepository).not.toHaveBeenCalled();
    expect(cambiarEstadoCentroCostoRepository).not.toHaveBeenCalled();
  });

  it("debe lanzar error si el estado nuevo no es válido", async () => {
    await expect(
      cambiarEstadoCentroCostoService("proyecto-1", "centro-1", {
        estado_centro_costo: "ADJUDICADO" as never,
        usuario_id: "admin-1",
      }),
    ).rejects.toThrow("El estado del centro de costo no es válido.");

    expect(obtenerCentroCostoPorProyectoRepository).not.toHaveBeenCalled();
    expect(cambiarEstadoCentroCostoRepository).not.toHaveBeenCalled();
  });

  it("debe lanzar error si el centro de costo no existe para el proyecto base", async () => {
    vi.mocked(obtenerCentroCostoPorProyectoRepository).mockResolvedValue(null);

    await expect(
      cambiarEstadoCentroCostoService("proyecto-1", "centro-no-existe", {
        estado_centro_costo: "EN_EJECUCION",
        usuario_id: "admin-1",
      }),
    ).rejects.toThrow("El centro de costo no existe para este proyecto base.");

    expect(obtenerCentroCostoPorProyectoRepository).toHaveBeenCalledWith(
      "proyecto-1",
      "centro-no-existe",
    );
    expect(cambiarEstadoCentroCostoRepository).not.toHaveBeenCalled();
  });

  it("debe lanzar error si el centro de costo ya está en el estado solicitado", async () => {
    vi.mocked(obtenerCentroCostoPorProyectoRepository).mockResolvedValue(
      centroCostoProObraLicitacionMock as never,
    );

    await expect(
      cambiarEstadoCentroCostoService("proyecto-1", "centro-pro-obra-1", {
        estado_centro_costo: "EN_LICITACION",
        usuario_id: "admin-1",
      }),
    ).rejects.toThrow("El centro de costo ya se encuentra en ese estado.");

    expect(cambiarEstadoCentroCostoRepository).not.toHaveBeenCalled();
  });

  it("debe lanzar error si intenta finalizar directamente un centro PRO-OBRA en licitación", async () => {
    vi.mocked(obtenerCentroCostoPorProyectoRepository).mockResolvedValue(
      centroCostoProObraLicitacionMock as never,
    );

    await expect(
      cambiarEstadoCentroCostoService("proyecto-1", "centro-pro-obra-1", {
        estado_centro_costo: "FINALIZADO",
        usuario_id: "admin-1",
      }),
    ).rejects.toThrow(
      "No se puede cambiar el centro de costo PRO-OBRA de EN_LICITACION a FINALIZADO.",
    );

    expect(cambiarEstadoCentroCostoRepository).not.toHaveBeenCalled();
  });

  it("debe lanzar error si intenta devolver OBRA finalizada a ejecución", async () => {
    vi.mocked(obtenerCentroCostoPorProyectoRepository).mockResolvedValue(
      centroCostoObraFinalizadoMock as never,
    );

    await expect(
      cambiarEstadoCentroCostoService("proyecto-1", "centro-obra-1", {
        estado_centro_costo: "EN_EJECUCION",
        usuario_id: "admin-1",
      }),
    ).rejects.toThrow(
      "No se puede cambiar el centro de costo OBRA de FINALIZADO a EN_EJECUCION.",
    );

    expect(cambiarEstadoCentroCostoRepository).not.toHaveBeenCalled();
  });

  it("debe avanzar PRO-OBRA de licitación a ejecución", async () => {
    vi.mocked(obtenerCentroCostoPorProyectoRepository).mockResolvedValue(
      centroCostoProObraLicitacionMock as never,
    );
    vi.mocked(cambiarEstadoCentroCostoRepository).mockResolvedValue({
      ...proyectoBaseMock,
      estado_proyecto: "EN_EJECUCION",
      centros_costo: [
        centroCostoProObraFinalizadoMock,
        centroCostoObraEjecucionMock,
      ],
    } as never);

    const resultado = await cambiarEstadoCentroCostoService(
      "proyecto-1",
      "centro-pro-obra-1",
      {
        estado_centro_costo: "EN_EJECUCION",
        observacion: " Inicio de ejecución aprobado ",
        usuario_id: "admin-1",
      },
    );

    expect(resultado?.estado_proyecto).toBe("EN_EJECUCION");

    expect(cambiarEstadoCentroCostoRepository).toHaveBeenCalledWith(
      "proyecto-1",
      "centro-pro-obra-1",
      {
        estado_centro_costo: "EN_EJECUCION",
        observacion: "Inicio de ejecución aprobado",
        usuario_id: "admin-1",
      },
    );
  });

  it("debe finalizar un centro OBRA en ejecución", async () => {
    vi.mocked(obtenerCentroCostoPorProyectoRepository).mockResolvedValue(
      centroCostoObraEjecucionMock as never,
    );
    vi.mocked(cambiarEstadoCentroCostoRepository).mockResolvedValue({
      ...proyectoBaseMock,
      estado_proyecto: "FINALIZADO",
      centros_costo: [centroCostoObraFinalizadoMock],
    } as never);

    const resultado = await cambiarEstadoCentroCostoService(
      "proyecto-1",
      "centro-obra-1",
      {
        estado_centro_costo: "FINALIZADO",
        observacion: " Centro de costo finalizado ",
        usuario_id: "admin-1",
      },
    );

    expect(resultado?.estado_proyecto).toBe("FINALIZADO");

    expect(cambiarEstadoCentroCostoRepository).toHaveBeenCalledWith(
      "proyecto-1",
      "centro-obra-1",
      {
        estado_centro_costo: "FINALIZADO",
        observacion: "Centro de costo finalizado",
        usuario_id: "admin-1",
      },
    );
  });
});