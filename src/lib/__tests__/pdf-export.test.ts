import { describe, expect, it } from "vitest";
import { crearTablaPdf } from "@/lib/pdf-export";

describe("crearTablaPdf", () => {
  it("genera un PDF paginado con las filas y filtros visibles", () => {
    const filas = Array.from({ length: 70 }, (_, indice) => ({
      numero: `SOL-${indice + 1}`,
      estado: "Pendiente aprobación",
    }));

    const pdf = crearTablaPdf({
      titulo: "Solicitudes filtradas",
      filtros: ["Proyecto: Central"],
      resumen: ["2 solicitudes", "Valor total: $ 100.000"],
      filas,
      columnas: [
        { titulo: "Solicitud", ancho: 50, valor: (fila) => fila.numero },
        { titulo: "Estado", ancho: 50, valor: (fila) => fila.estado },
      ],
    });
    const contenido = new TextDecoder("windows-1252").decode(pdf);

    expect(contenido.startsWith("%PDF-1.4")).toBe(true);
    expect(contenido).toContain("Solicitudes filtradas");
    expect(contenido).toContain("Proyecto: Central");
    expect(contenido).toContain("Valor total: $ 100.000");
    expect(contenido).toContain("SOL-70");
    expect(contenido).toMatch(/\/Count [2-9]/);
    expect(contenido.endsWith("%%EOF")).toBe(true);
  });

  it("envuelve los números largos para que no invadan la columna siguiente", () => {
    const solicitud =
      "SOL-PRO-OBRA-VIA URBANA GUAMAL - CARRERA 6-2026-000002";
    const pdf = crearTablaPdf({
      titulo: "Solicitudes pendientes",
      filas: [{
        numero: solicitud,
        proyecto: "Proyecto",
        centro: "Centro",
        beneficiario: "Beneficiario",
        tipo: "Pago proveedor",
        descripcion: "Descripción",
        estado: "Pendiente",
        valor: "$ 100.000",
      }],
      columnas: [
        { titulo: "Proyecto", ancho: 17, valor: (fila) => fila.proyecto },
        { titulo: "Centro de costo", ancho: 17, valor: (fila) => fila.centro },
        { titulo: "Solicitud", ancho: 19, valor: (fila) => fila.numero },
        { titulo: "Beneficiario", ancho: 18, valor: (fila) => fila.beneficiario },
        { titulo: "Tipo", ancho: 11, valor: (fila) => fila.tipo },
        { titulo: "Descripción", ancho: 20, valor: (fila) => fila.descripcion },
        { titulo: "Estado", ancho: 10, valor: (fila) => fila.estado },
        { titulo: "Valor neto", ancho: 10, valor: (fila) => fila.valor },
      ],
    });
    const contenido = new TextDecoder("windows-1252").decode(pdf);
    const lineasSolicitud = Array.from(
      contenido.matchAll(/\(([^()]*)\) Tj ET/g),
      ([, texto]) => texto,
    ).filter((texto) => texto.startsWith("SOL-"));

    expect(lineasSolicitud).toHaveLength(1);
    expect(lineasSolicitud[0].length).toBeLessThanOrEqual(26);
    expect(contenido).not.toContain(`(${solicitud}) Tj ET`);
  });
});
