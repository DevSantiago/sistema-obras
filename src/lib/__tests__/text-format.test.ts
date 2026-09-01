import { describe, expect, it } from "vitest";

import { formatearNombrePropio } from "../text-format";

describe("formatearNombrePropio", () => {
  it("presenta nombres almacenados en mayúsculas de forma legible", () => {
    expect(formatearNombrePropio("COMPAÑÍA MUNDIAL DE SEGUROS SA")).toBe(
      "Compañía Mundial de Seguros SA",
    );
  });

  it("conserva siglas empresariales y normaliza espacios", () => {
    expect(formatearNombrePropio("  GRUPO   DIMENSIONES   S.A.S. ")).toBe(
      "Grupo Dimensiones S.A.S.",
    );
  });

  it("mantiene conectores en minúscula dentro del nombre", () => {
    expect(formatearNombrePropio("ALCALDÍA DE SAN JOSÉ DEL GUAVIARE")).toBe(
      "Alcaldía de San José del Guaviare",
    );
  });

  it("uniforma nombres de usuarios escritos con capitalización inconsistente", () => {
    expect(formatearNombrePropio("Luis mario beltran")).toBe(
      "Luis Mario Beltran",
    );
    expect(formatearNombrePropio("ALEJANDRA SILVA")).toBe(
      "Alejandra Silva",
    );
  });
});
