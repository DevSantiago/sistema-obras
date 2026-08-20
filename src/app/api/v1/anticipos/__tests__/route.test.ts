import { beforeEach, describe, expect, it, vi } from "vitest";

const { autenticacionMock, registrarAnticipoServiceMock } = vi.hoisted(
  () => ({
    autenticacionMock: vi.fn(),
    registrarAnticipoServiceMock: vi.fn(),
  }),
);

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue({ value: "token" }),
  }),
}));

vi.mock("@/modules/auth/auth.service", () => ({
  obtenerUsuarioAutenticado: autenticacionMock,
}));

vi.mock("@/modules/anticipos/anticipos.service", () => ({
  registrarAnticipoService: registrarAnticipoServiceMock,
}));

import { POST } from "../route";

const usuario = {
  id: "usuario-1",
  roles: ["AUXILIAR_CONTABLE"],
  permisos: ["REGISTRAR_ANTICIPOS"],
};

function crearRequest(incluirSoporte = true) {
  const formData = new FormData();
  formData.set("proyecto_base_id", "proyecto-1");
  formData.set("entidad_id", "entidad-1");
  formData.set("valor", "500000");

  if (incluirSoporte) {
    formData.set(
      "soporte",
      new File(["soporte"], "soporte.pdf", {
        type: "application/pdf",
      }),
    );
  }

  return new Request("http://localhost/api/v1/anticipos", {
    method: "POST",
    body: formData,
  });
}

describe("POST /api/v1/anticipos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    autenticacionMock.mockResolvedValue({
      status: 200,
      body: {
        ok: true,
        data: { usuario },
      },
    });
    registrarAnticipoServiceMock.mockResolvedValue({
      status: 201,
      body: {
        ok: true,
        message: "Anticipo registrado correctamente.",
      },
    });
  });

  it("debe enviar el anticipo y el soporte al servicio", async () => {
    const response = await POST(crearRequest());

    expect(response.status).toBe(201);
    expect(registrarAnticipoServiceMock).toHaveBeenCalledWith(
      usuario,
      expect.objectContaining({
        proyecto_base_id: "proyecto-1",
        entidad_id: "entidad-1",
        valor: 500000,
        soporte: expect.any(File),
      }),
    );
    expect(
      registrarAnticipoServiceMock.mock.calls[0][1],
    ).not.toHaveProperty("fecha_anticipo");
  });

  it("debe exigir el soporte", async () => {
    const response = await POST(crearRequest(false));

    expect(response.status).toBe(400);
    expect(registrarAnticipoServiceMock).not.toHaveBeenCalled();
  });
});
