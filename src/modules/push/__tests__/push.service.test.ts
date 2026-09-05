import { beforeEach, describe, expect, it, vi } from "vitest";
import type { UsuarioSesion } from "@/modules/auth/auth.types";

const {
  registrarMock,
  desactivarMock,
  contarMock,
  existeMock,
} = vi.hoisted(() => ({
  registrarMock: vi.fn(),
  desactivarMock: vi.fn(),
  contarMock: vi.fn(),
  existeMock: vi.fn(),
}));

vi.mock("../push.repository", () => ({
  registrarSuscripcionPushRepository: registrarMock,
  desactivarSuscripcionPushRepository: desactivarMock,
  contarSuscripcionesPushActivasRepository: contarMock,
  existeSuscripcionPushActivaRepository: existeMock,
}));

import {
  consultarSuscripcionesPushService,
  desactivarSuscripcionPushService,
  registrarSuscripcionPushService,
} from "../push.service";

const usuario: UsuarioSesion = {
  id: "usuario-1",
  nombre: "Usuario Prueba",
  correo: "usuario@gmail.com",
  telefono: "3001234567",
  estado: "ACTIVO",
  roles: ["SOLICITANTE"],
  permisos: [],
};

const suscripcionValida = {
  endpoint: "https://push.example.com/suscripcion/123",
  keys: {
    p256dh: "clave_publica_-123",
    auth: "clave_auth_123",
  },
};

describe("push.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.APP_ENV = "staging";
    contarMock.mockResolvedValue(1);
    registrarMock.mockResolvedValue(undefined);
    desactivarMock.mockResolvedValue(true);
    existeMock.mockResolvedValue(true);
  });

  it("registra una suscripción para el usuario y ambiente autenticados", async () => {
    const resultado = await registrarSuscripcionPushService(
      usuario,
      suscripcionValida,
      "Navegador de prueba",
    );

    expect(resultado.status).toBe(201);
    expect(registrarMock).toHaveBeenCalledWith(
      expect.objectContaining({
        usuario_id: "usuario-1",
        ambiente: "staging",
        endpoint: suscripcionValida.endpoint,
        endpoint_hash: expect.stringMatching(/^[a-f0-9]{64}$/),
        clave_p256dh: suscripcionValida.keys.p256dh,
        clave_auth: suscripcionValida.keys.auth,
      }),
    );
    expect(resultado.body.data).toEqual({
      cantidad_dispositivos: 1,
      activa_en_este_dispositivo: true,
    });
  });

  it("rechaza una suscripción incompleta", async () => {
    const resultado = await registrarSuscripcionPushService(usuario, {
      endpoint: "https://push.example.com/suscripcion/123",
      keys: { p256dh: "", auth: "" },
    });

    expect(resultado.status).toBe(400);
    expect(registrarMock).not.toHaveBeenCalled();
  });

  it("rechaza endpoints que no usan HTTPS", async () => {
    const resultado = await registrarSuscripcionPushService(usuario, {
      ...suscripcionValida,
      endpoint: "http://push.example.com/suscripcion/123",
    });

    expect(resultado.status).toBe(400);
    expect(registrarMock).not.toHaveBeenCalled();
  });

  it("revoca únicamente la suscripción del usuario y ambiente actuales", async () => {
    contarMock.mockResolvedValue(0);

    const resultado = await desactivarSuscripcionPushService(usuario, {
      endpoint: suscripcionValida.endpoint,
    });

    expect(desactivarMock).toHaveBeenCalledWith({
      usuario_id: "usuario-1",
      ambiente: "staging",
      endpoint_hash: expect.stringMatching(/^[a-f0-9]{64}$/),
    });
    expect(resultado.body.data).toEqual({
      cantidad_dispositivos: 0,
      activa_en_este_dispositivo: false,
    });
  });

  it("consulta solo la cantidad de dispositivos sin exponer suscripciones", async () => {
    contarMock.mockResolvedValue(2);

    const resultado = await consultarSuscripcionesPushService(
      usuario,
      "a".repeat(64),
    );

    expect(resultado.body.data).toEqual({
      cantidad_dispositivos: 2,
      activa_en_este_dispositivo: true,
    });
    expect(resultado.body.data).not.toHaveProperty("endpoint");
    expect(existeMock).toHaveBeenCalledWith({
      usuario_id: "usuario-1",
      ambiente: "staging",
      endpoint_hash: "a".repeat(64),
    });
  });
});
