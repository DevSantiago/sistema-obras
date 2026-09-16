import { describe, expect, it } from "vitest";
import type {
  SolicitudPagoListado,
  UsuarioSesionSolicitudesPago,
} from "@/modules/solicitudes-pago/solicitudes-pago.types";
import {
  obtenerSolicitudesParaExportar,
  usuarioPuedeEditarSolicitud,
  usuarioPuedeEnviarSolicitud,
} from "../lists/SolicitudesPagoList";

describe("obtenerSolicitudesParaExportar", () => {
  const solicitudes = [
    { id: "1" },
    { id: "2" },
    { id: "3" },
  ] as SolicitudPagoListado[];
  const solicitudesFiltradas = [solicitudes[1]];

  it("exporta todas las solicitudes cuando no hay filtros activos", () => {
    expect(
      obtenerSolicitudesParaExportar(
        solicitudes,
        solicitudesFiltradas,
        false,
      ).map((solicitud) => solicitud.id),
    ).toEqual(["1", "2", "3"]);
  });

  it("exporta solo los resultados cuando hay filtros activos", () => {
    expect(
      obtenerSolicitudesParaExportar(
        solicitudes,
        solicitudesFiltradas,
        true,
      ).map((solicitud) => solicitud.id),
    ).toEqual(["2"]);
  });
});

describe("usuarioPuedeEnviarSolicitud", () => {
  const usuario = {
    id: "usuario-1",
    nombre: "Usuario",
    correo: "usuario@example.com",
    roles: ["ADMINISTRADOR"],
    permisos: ["APROBAR_NIVEL_1"],
  } satisfies UsuarioSesionSolicitudesPago;

  const solicitud = {
    creado_por: usuario.id,
  } as SolicitudPagoListado;

  it("no permite reenviar desde Solicitudes una devolución al aprobador nivel 1", () => {
    expect(
      usuarioPuedeEnviarSolicitud(
        { ...solicitud, estado_actual: "DEVUELTA_APROBADOR_1" },
        usuario,
      ),
    ).toBe(false);
  });

  it.each(["PENDIENTE_APROBADOR_1", "PENDIENTE_APROBADOR_2"] as const)(
    "no permite enviar desde Solicitudes cuando está en %s",
    (estadoActual) => {
      expect(
        usuarioPuedeEnviarSolicitud(
          { ...solicitud, estado_actual: estadoActual },
          usuario,
        ),
      ).toBe(false);
    },
  );

  it("permite al solicitante reenviar una solicitud que le fue devuelta", () => {
    expect(
      usuarioPuedeEnviarSolicitud(
        { ...solicitud, estado_actual: "DEVUELTA_SOLICITANTE" },
        usuario,
      ),
    ).toBe(true);
  });
});

describe("usuarioPuedeEditarSolicitud", () => {
  const usuario = {
    id: "usuario-1",
    nombre: "Usuario",
    correo: "usuario@example.com",
    roles: ["ADMINISTRADOR"],
    permisos: ["APROBAR_NIVEL_1"],
  } satisfies UsuarioSesionSolicitudesPago;

  const solicitud = {
    creado_por: usuario.id,
  } as SolicitudPagoListado;

  it("no permite editar desde Solicitudes una devolución al aprobador nivel 1", () => {
    expect(
      usuarioPuedeEditarSolicitud(
        { ...solicitud, estado_actual: "DEVUELTA_APROBADOR_1" },
        usuario,
      ),
    ).toBe(false);
  });

  it.each(["PENDIENTE_APROBADOR_1", "PENDIENTE_APROBADOR_2"] as const)(
    "no permite editar desde Solicitudes cuando está en %s",
    (estadoActual) => {
      expect(
        usuarioPuedeEditarSolicitud(
          { ...solicitud, estado_actual: estadoActual },
          usuario,
        ),
      ).toBe(false);
    },
  );

  it("permite al solicitante editar una solicitud que le fue devuelta", () => {
    expect(
      usuarioPuedeEditarSolicitud(
        { ...solicitud, estado_actual: "DEVUELTA_SOLICITANTE" },
        usuario,
      ),
    ).toBe(true);
  });
});
