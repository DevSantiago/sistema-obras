import { localStorageProvider } from "./local-storage.provider";
import type { StorageProvider } from "./storage.types";

export type StorageProviderName = "local" | "gcs";

function obtenerNombreProvider(): StorageProviderName {
  const provider =
    process.env.STORAGE_PROVIDER?.trim().toLowerCase() || "local";

  if (provider === "local" || provider === "gcs") {
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

  throw new Error(
    "El proveedor GCS todavía no está configurado. Use STORAGE_PROVIDER=local en desarrollo.",
  );
}

export const storageService = {
  guardarArchivo: (...args: Parameters<StorageProvider["guardarArchivo"]>) =>
    obtenerStorageProvider().guardarArchivo(...args),

  eliminarArchivo: (...args: Parameters<StorageProvider["eliminarArchivo"]>) =>
    obtenerStorageProvider().eliminarArchivo(...args),

  obtenerArchivo: (...args: Parameters<StorageProvider["obtenerArchivo"]>) =>
    obtenerStorageProvider().obtenerArchivo(...args),
};
