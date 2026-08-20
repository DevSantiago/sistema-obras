import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../local-storage.provider", () => ({
  localStorageProvider: { guardarArchivo: vi.fn() },
}));

vi.mock("../s3-storage.provider", () => ({
  s3StorageProvider: { guardarArchivo: vi.fn() },
}));

import { localStorageProvider } from "../local-storage.provider";
import { s3StorageProvider } from "../s3-storage.provider";
import { obtenerStorageProvider } from "../storage.service";

describe("obtenerStorageProvider", () => {
  beforeEach(() => {
    delete process.env.STORAGE_PROVIDER;
  });

  it("usa almacenamiento local por defecto", () => {
    expect(obtenerStorageProvider()).toBe(localStorageProvider);
  });

  it("usa S3 cuando está configurado", () => {
    process.env.STORAGE_PROVIDER = "s3";
    expect(obtenerStorageProvider()).toBe(s3StorageProvider);
  });

  it("rechaza proveedores no soportados", () => {
    process.env.STORAGE_PROVIDER = "gcs";
    expect(() => obtenerStorageProvider()).toThrow(
      'El proveedor de almacenamiento "gcs" no está soportado.',
    );
  });
});
