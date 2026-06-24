import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  crearProyectoBaseService,
  listarProyectosBaseService,
  obtenerProyectoBasePorIdService,
} from "../proyectos-base.service";

import {
  crearProyectoBaseConCentroCostoRepository,
  existeProyectoBasePorNombreRepository,
  listarProyectosBaseRepository,
  obtenerProyectoBasePorIdRepository,
} from "../proyectos-base.repository";

vi.mock("../proyectos-base.repository", () => ({
  listarProyectosBaseRepository: vi.fn(),
  obtenerProyectoBasePorIdRepository: vi.fn(),
  existeProyectoBasePorNombreRepository: vi.fn(),
  crearProyectoBaseConCentroCostoRepository: vi.fn(),
}));

const fechaMock = new Date("2026-06-23T10:00:00.000Z");

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
  centros_costo: [
    {
      id: "centro-1",
      proyecto_base_id: "proyecto-1",
      linea_negocio: "OBRA",
      fase_centro_costo: "LICITACION",
      prefijo: "PRO-OBRA",
      codigo: "PRO-OBRA - CONSTRUCCION SEDE ADMINISTRATIVA",
      nombre: "PRO-OBRA - CONSTRUCCION SEDE ADMINISTRATIVA",
      descripcion: null,
      estado_centro_costo: "EN_LICITACION",
      creado_como_adjudicado: false,
      motivo_creacion_adjudicada: null,
      fecha_adjudicacion: null,
      soporte_adjudicacion_adjunto_id: null,
      observacion_adjudicacion: null,
      adjudicado_por: null,
      adjudicado_en: null,
      activo: true,
      creado_en: fechaMock,
      actualizado_en: fechaMock,
    },
  ],
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

  it("debe crear proyecto base con fondo y centros de costo generados", async () => {
    vi.mocked(existeProyectoBasePorNombreRepository).mockResolvedValue(false);
    vi.mocked(crearProyectoBaseConCentroCostoRepository).mockResolvedValue(
      proyectoBaseMock as never,
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
          fase_centro_costo: "EJECUCION",
          descripcion: "Interventoría adjudicada",
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
            fase_centro_costo: "EJECUCION",
            descripcion: "Interventoría adjudicada",
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
          fase_centro_costo: "EJECUCION",
          prefijo: "INT",
          codigo: "INT - CONSTRUCCION SEDE ADMINISTRATIVA",
          nombre: "INT - CONSTRUCCION SEDE ADMINISTRATIVA",
          descripcion: "Interventoría adjudicada",
          estado_centro_costo: "EN_EJECUCION",
        },
      ],
    );
  });
});