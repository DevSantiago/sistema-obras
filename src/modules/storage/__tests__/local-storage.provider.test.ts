import { access, rm } from "node:fs/promises";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { localStorageProvider } from "../local-storage.provider";

const CARPETA_PRUEBA = "tests-storage-provider";

function rutaAbsoluta(rutaRelativa: string): string {
  return path.join(
    process.cwd(),
    ...rutaRelativa.split("/"),
  );
}

afterEach(async () => {
  await rm(
    path.join(process.cwd(), "storage", CARPETA_PRUEBA),
    {
      recursive: true,
      force: true,
    },
  );
});

describe("local-storage.provider", () => {
  it("debe guardar y leer un archivo dentro de storage", async () => {
    const contenido = Buffer.from("contenido de prueba");

    const guardado = await localStorageProvider.guardarArchivo({
      contenido,
      nombre_original: "soporte prueba.pdf",
      tipo_mime: "application/pdf",
      carpeta: CARPETA_PRUEBA,
    });

    expect(guardado.nombre_archivo).toBe(
      "soporte prueba.pdf",
    );
    expect(guardado.nombre_bucket).toBe("LOCAL");
    expect(guardado.ruta_archivo).toMatch(
      new RegExp(
        `^storage/${CARPETA_PRUEBA}/[a-f0-9-]+-soporte_prueba\\.pdf$`,
      ),
    );
    expect(guardado.tipo_mime).toBe("application/pdf");
    expect(guardado.tamano_archivo).toBe(
      BigInt(contenido.byteLength),
    );

    await expect(
      access(rutaAbsoluta(guardado.ruta_archivo)),
    ).resolves.toBeUndefined();

    const leido = await localStorageProvider.obtenerArchivo(
      guardado.ruta_archivo,
    );

    expect(leido.equals(contenido)).toBe(true);
  });

  it("debe eliminar un archivo almacenado", async () => {
    const guardado = await localStorageProvider.guardarArchivo({
      contenido: Buffer.from("archivo a eliminar"),
      nombre_original: "eliminar.png",
      tipo_mime: "image/png",
      carpeta: CARPETA_PRUEBA,
    });

    await localStorageProvider.eliminarArchivo(
      guardado.ruta_archivo,
    );

    await expect(
      access(rutaAbsoluta(guardado.ruta_archivo)),
    ).rejects.toMatchObject({
      code: "ENOENT",
    });
  });

  it("debe ignorar la eliminación de un archivo inexistente", async () => {
    await expect(
      localStorageProvider.eliminarArchivo(
        `storage/${CARPETA_PRUEBA}/no-existe.pdf`,
      ),
    ).resolves.toBeUndefined();
  });

  it("debe rechazar carpetas con path traversal", async () => {
    await expect(
      localStorageProvider.guardarArchivo({
        contenido: Buffer.from("contenido"),
        nombre_original: "archivo.pdf",
        tipo_mime: "application/pdf",
        carpeta: "../fuera",
      }),
    ).rejects.toThrow(
      "La carpeta de almacenamiento no es válida.",
    );
  });

  it("debe rechazar rutas fuera del almacenamiento local", async () => {
    await expect(
      localStorageProvider.obtenerArchivo(
        "/tmp/archivo.pdf",
      ),
    ).rejects.toThrow(
      "La ruta del archivo no pertenece al almacenamiento local.",
    );
  });
});
