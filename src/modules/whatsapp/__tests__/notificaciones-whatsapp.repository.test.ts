import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { crearNotificacionesTransicionesRepository } from "../notificaciones-whatsapp.repository";

const appBaseUrlOriginal = process.env.APP_BASE_URL;
const plantillaOriginal = process.env.WHATSAPP_TEMPLATE_APROBACION_NIVEL_1;

function crearTransaccionMock() {
  return {
    solicitudes_pago: {
      findUniqueOrThrow: vi.fn().mockResolvedValue({
        id: "solicitud-1",
        numero_solicitud: "SOL-2026-000001",
        proyecto_base_id: "proyecto-1",
        creado_por: "solicitante-1",
        aprobado_1_por: "aprobador-1",
        valor_neto: 250000,
        proyecto_base: { nombre: "Proyecto prueba" },
        centro_costo: { linea_negocio: "OBRA" },
        beneficiario: { nombre: "Beneficiario prueba" },
        proveedor: null,
      }),
    },
    usuarios: {
      findMany: vi.fn(),
    },
    notificaciones_whatsapp: {
      createMany: vi.fn().mockImplementation(({ data }) => ({
        count: data.length,
      })),
    },
  };
}

describe("notificaciones-whatsapp.repository", () => {
  beforeEach(() => {
    process.env.APP_BASE_URL = "https://stg.dimensiones.cloud/";
    process.env.WHATSAPP_TEMPLATE_APROBACION_NIVEL_1 = "aprobacion_nivel_1";
  });

  afterEach(() => {
    if (appBaseUrlOriginal === undefined) {
      delete process.env.APP_BASE_URL;
    } else {
      process.env.APP_BASE_URL = appBaseUrlOriginal;
    }

    if (plantillaOriginal === undefined) {
      delete process.env.WHATSAPP_TEMPLATE_APROBACION_NIVEL_1;
    } else {
      process.env.WHATSAPP_TEMPLATE_APROBACION_NIVEL_1 = plantillaOriginal;
    }
  });

  it("crea una notificación para cada aprobador autorizado del proyecto", async () => {
    const tx = crearTransaccionMock();
    tx.usuarios.findMany.mockResolvedValue([
      { id: "aprobador-1", nombre: "Aprobador Uno", telefono: "+573001111111" },
      { id: "aprobador-2", nombre: "Aprobador Dos", telefono: null },
    ]);

    const resultado = await crearNotificacionesTransicionesRepository(
      {
        transiciones: [
          {
            solicitudId: "solicitud-1",
            estadoOrigen: "BORRADOR",
            estadoDestino: "PENDIENTE_APROBADOR_1",
          },
        ],
        fecha: new Date("2026-08-18T12:00:00.000Z"),
      },
      tx as never,
    );

    expect(resultado.count).toBe(2);
    expect(tx.usuarios.findMany).toHaveBeenCalledWith({
      where: expect.objectContaining({
        roles: { some: { rol: { nombre: "APROBADOR_1", activo: true } } },
        accesos_recibidos: {
          some: {
            proyecto_base_id: "proyecto-1",
            linea_negocio: "OBRA",
            activo: true,
          },
        },
      }),
      select: { id: true, nombre: true, telefono: true },
    });
    const datos = tx.notificaciones_whatsapp.createMany.mock.calls[0][0].data;
    expect(datos).toHaveLength(2);
    expect(datos[0]).toMatchObject({
      destinatario_usuario_id: "aprobador-1",
      destinatario_nombre: "Aprobador Uno",
      plantilla: "aprobacion_nivel_1",
      contenido: {
        numero_solicitud: "SOL-2026-000001",
        proyecto: "Proyecto prueba",
        beneficiario: "Beneficiario prueba",
        valor: 250000,
        estado_nuevo: "PENDIENTE_APROBADOR_1",
        enlace:
          "https://stg.dimensiones.cloud/solicitudes-pago?solicitud_id=solicitud-1",
      },
    });
    expect(datos[0].evento_transicion_id).toBe(datos[1].evento_transicion_id);
  });

  it("dirige la devolución de nivel 2 al aprobador de nivel 1 responsable", async () => {
    const tx = crearTransaccionMock();
    tx.usuarios.findMany.mockResolvedValue([
      { id: "aprobador-1", nombre: "Aprobador Uno", telefono: "+573001111111" },
    ]);

    await crearNotificacionesTransicionesRepository(
      {
        transiciones: [
          {
            solicitudId: "solicitud-1",
            estadoOrigen: "PENDIENTE_APROBADOR_2",
            estadoDestino: "DEVUELTA_APROBADOR_1",
          },
        ],
        fecha: new Date(),
      },
      tx as never,
    );

    expect(tx.usuarios.findMany).toHaveBeenCalledWith({
      where: { id: "aprobador-1", estado: "ACTIVO" },
      select: { id: true, nombre: true, telefono: true },
    });
  });

  it("conserva el evento pendiente aunque el destinatario no tenga teléfono", async () => {
    const tx = crearTransaccionMock();
    tx.usuarios.findMany.mockResolvedValue([
      { id: "solicitante-1", nombre: "Solicitante", telefono: null },
    ]);

    const resultado = await crearNotificacionesTransicionesRepository(
      {
        transiciones: [
          {
            solicitudId: "solicitud-1",
            estadoOrigen: "PENDIENTE_APROBADOR_1",
            estadoDestino: "DEVUELTA_SOLICITANTE",
          },
        ],
        fecha: new Date(),
      },
      tx as never,
    );

    expect(resultado.count).toBe(1);
    expect(
      tx.notificaciones_whatsapp.createMany.mock.calls[0][0].data[0],
    ).toMatchObject({
      destinatario_usuario_id: "solicitante-1",
      telefono_destinatario: null,
    });
  });

  it("no interrumpe la transición cuando no existe un destinatario activo", async () => {
    const tx = crearTransaccionMock();
    tx.usuarios.findMany.mockResolvedValue([]);

    const resultado = await crearNotificacionesTransicionesRepository(
      {
        transiciones: [
          {
            solicitudId: "solicitud-1",
            estadoOrigen: "BORRADOR",
            estadoDestino: "PENDIENTE_APROBADOR_1",
          },
        ],
        fecha: new Date(),
      },
      tx as never,
    );

    expect(resultado.count).toBe(0);
    expect(tx.notificaciones_whatsapp.createMany).not.toHaveBeenCalled();
  });
});
