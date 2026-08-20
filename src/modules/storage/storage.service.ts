import { localStorageProvider } from "./local-storage.provider";
import { s3StorageProvider } from "./s3-storage.provider";
import type { StorageProvider } from "./storage.types";

export type StorageProviderName = "local" | "s3";

function obtenerNombreProvider(): StorageProviderName {
  const provider =
    process.env.STORAGE_PROVIDER?.trim().toLowerCase() || "local";

  if (provider === "local" || provider === "s3") {
    return provider;
  }

  throw new Error(
    `El proveedor de almacenamiento "${provider}" no está soportado.`,
  );
}

export function obtenerStorageProvider(): StorageProvider {
  const provider = obtenerNombreProvider();

  if (provider === "local") {
    return localStorageProvider;
  }

  return s3StorageProvider;
}

export const storageService = {
  guardarArchivo: (...args: Parameters<StorageProvider["guardarArchivo"]>) =>
    obtenerStorageProvider().guardarArchivo(...args),

  eliminarArchivo: (...args: Parameters<StorageProvider["eliminarArchivo"]>) =>
    obtenerStorageProvider().eliminarArchivo(...args),

  obtenerArchivo: (...args: Parameters<StorageProvider["obtenerArchivo"]>) =>
    obtenerStorageProvider().obtenerArchivo(...args),
};
