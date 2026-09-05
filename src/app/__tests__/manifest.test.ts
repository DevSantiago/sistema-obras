import { describe, expect, it } from "vitest";
import manifest from "../manifest";

describe("manifiesto de la aplicación", () => {
  it("publica la configuración requerida para instalar la aplicación", () => {
    const configuracion = manifest();

    expect(configuracion).toMatchObject({
      id: "/",
      name: "Sistema Obras",
      short_name: "Obras",
      start_url: "/dashboard",
      scope: "/",
      display: "standalone",
    });
    expect(configuracion.icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ sizes: "192x192", purpose: "any" }),
        expect.objectContaining({ sizes: "512x512", purpose: "any" }),
        expect.objectContaining({ sizes: "512x512", purpose: "maskable" }),
      ]),
    );
  });
});
