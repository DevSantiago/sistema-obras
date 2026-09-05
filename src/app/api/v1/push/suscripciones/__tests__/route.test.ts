import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  autenticacionMock,
  consultarMock,
  registrarMock,
  desactivarMock,
} = vi.hoisted(() => ({
  autenticacionMock: vi.fn(),
  consultarMock: vi.fn(),
  registrarMock: vi.fn(),
  desactivarMock: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue({ value: "token-prueba" }),
  }),
}));

vi.mock("@/modules/auth/auth.service", () => ({
  obtenerUsuarioAutenticado: autenticacionMock,
}));

vi.mock("@/modules/push/push.service", () => ({
  consultarSuscripcionesPushService: consultarMock,
  registrarSuscripcionPushService: registrarMock,
  desactivarSuscripcionPushService: desactivarMock,
}));

import { DELETE, GET, POST } from "../route";

const usuario = { id: "usuario-1", roles: ["SOLICITANTE"], permisos: [] };
const respuestaExitosa = {
  status: 200,
  body: {
    ok: true,
    message: "Operación correcta.",
    data: {
      cantidad_dispositivos: 1,
      activa_en_este_dispositivo: true,
    },
  },
};

describe("/api/v1/push/suscripciones", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    autenticacionMock.mockResolvedValue({
      status: 200,
      body: { ok: true, data: { usuario } },
    });
    consultarMock.mockResolvedValue(respuestaExitosa);
    registrarMock.mockResolvedValue({ ...respuestaExitosa, status: 201 });
    desactivarMock.mockResolvedValue(respuestaExitosa);
  });

  it("protege la consulta con la sesión autenticada", async () => {
    autenticacionMock.mockResolvedValue({
      status: 401,
      body: { ok: false, message: "No hay sesión activa." },
    });

    const response = await GET(
      new Request("http://localhost/api/v1/push/suscripciones"),
    );

    expect(response.status).toBe(401);
    expect(consultarMock).not.toHaveBeenCalled();
  });

  it("consulta el estado sin enviar el endpoint completo", async () => {
    const endpointHash = "a".repeat(64);
    const response = await GET(
      new Request("http://localhost/api/v1/push/suscripciones", {
        headers: { "X-Push-Endpoint-Hash": endpointHash },
      }),
    );

    expect(response.status).toBe(200);
    expect(consultarMock).toHaveBeenCalledWith(usuario, endpointHash);
  });

  it("registra la suscripción con el usuario autenticado", async () => {
    const body = {
      endpoint: "https://push.example.com/123",
      keys: { p256dh: "p256dh", auth: "auth" },
    };
    const request = new Request("http://localhost/api/v1/push/suscripciones", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Android de prueba",
      },
      body: JSON.stringify(body),
    });

    const response = await POST(request);

    expect(response.status).toBe(201);
    expect(registrarMock).toHaveBeenCalledWith(
      usuario,
      body,
      "Android de prueba",
    );
  });

  it("rechaza JSON inválido antes de llamar al servicio", async () => {
    const request = new Request("http://localhost/api/v1/push/suscripciones", {
      method: "POST",
      body: "{",
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(registrarMock).not.toHaveBeenCalled();
  });

  it("desactiva solamente el endpoint enviado por el dispositivo", async () => {
    const body = { endpoint: "https://push.example.com/123" };
    const request = new Request("http://localhost/api/v1/push/suscripciones", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const response = await DELETE(request);

    expect(response.status).toBe(200);
    expect(desactivarMock).toHaveBeenCalledWith(usuario, body);
  });
});
