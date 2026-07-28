"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  ConsultarFondosData,
  ProyectoFondoGeneral,
} from "@/modules/fondos/fondos.types";
import styles from "./FondosManager.module.css";

type RespuestaFondos = {
  ok: boolean;
  message: string;
  data?: ConsultarFondosData;
};

const FORMATEADOR_MONEDA = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

function formatearEtiqueta(valor: string): string {
  const etiquetas: Record<string, string> = {
    OBRA: "Obra",
    INTERVENTORIA: "Interventoría",
    LICITACION: "Licitación",
    EJECUCION: "Ejecución",
    EN_LICITACION: "En licitación",
    EN_EJECUCION: "En ejecución",
    FINALIZADO: "Finalizado",
  };

  return etiquetas[valor] ?? valor;
}

export default function FondosManager() {
  const [proyectos, setProyectos] = useState<ProyectoFondoGeneral[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [linea, setLinea] = useState("");
  const [fase, setFase] = useState("");
  const [cargando, setCargando] = useState(true);
  const [mensajeError, setMensajeError] = useState("");

  const cargarFondos = useCallback(async () => {
    setCargando(true);
    setMensajeError("");

    try {
      const response = await fetch("/api/v1/fondos", {
        credentials: "include",
        cache: "no-store",
      });
      const body = (await response.json()) as RespuestaFondos;

      if (!response.ok || !body.ok) {
        throw new Error(
          body.message ?? "No fue posible consultar los fondos.",
        );
      }

      setProyectos(body.data?.proyectos ?? []);
    } catch (error) {
      setProyectos([]);
      setMensajeError(
        error instanceof Error
          ? error.message
          : "No fue posible consultar los fondos.",
      );
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    const tareaCarga = window.setTimeout(() => {
      void cargarFondos();
    }, 0);

    return () => window.clearTimeout(tareaCarga);
  }, [cargarFondos]);

  const proyectosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLocaleLowerCase("es");

    return proyectos
      .map((proyecto) => {
        const centros = proyecto.centros_costo.filter(
          (centro) =>
            (!linea || centro.linea_negocio === linea) &&
            (!fase || centro.fase_centro_costo === fase),
        );
        const coincideTexto =
          !texto ||
          proyecto.proyecto_nombre.toLocaleLowerCase("es").includes(texto) ||
          proyecto.fondo_nombre.toLocaleLowerCase("es").includes(texto) ||
          centros.some(
            (centro) =>
              centro.nombre.toLocaleLowerCase("es").includes(texto) ||
              centro.codigo.toLocaleLowerCase("es").includes(texto),
          );

        if (!coincideTexto || centros.length === 0) {
          return null;
        }

        const agrupar = (
          campo: "linea_negocio" | "fase_centro_costo",
        ) => {
          const resumen = new Map<string, number>();

          for (const centro of centros) {
            resumen.set(
              centro[campo],
              (resumen.get(centro[campo]) ?? 0) +
                centro.gasto_acumulado,
            );
          }

          return Array.from(resumen.entries()).map(
            ([clave, gasto_acumulado]) => ({
              clave,
              gasto_acumulado,
            }),
          );
        };

        return {
          ...proyecto,
          centros_costo: centros,
          gasto_total_visible: centros.reduce(
            (total, centro) => total + centro.gasto_acumulado,
            0,
          ),
          gasto_por_linea: agrupar("linea_negocio"),
          gasto_por_fase: agrupar("fase_centro_costo"),
        };
      })
      .filter(
        (proyecto): proyecto is ProyectoFondoGeneral =>
          proyecto !== null,
      );
  }, [busqueda, fase, linea, proyectos]);

  return (
    <section className={styles.container}>
      <div className={styles.filters}>
        <label className={styles.field}>
          <span>Buscar</span>
          <input
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
            placeholder="Proyecto, fondo o centro de costo"
          />
        </label>
        <label className={styles.field}>
          <span>Línea de negocio</span>
          <select
            value={linea}
            onChange={(event) => setLinea(event.target.value)}
          >
            <option value="">Todas las líneas</option>
            <option value="OBRA">Obra</option>
            <option value="INTERVENTORIA">Interventoría</option>
          </select>
        </label>
        <label className={styles.field}>
          <span>Fase</span>
          <select
            value={fase}
            onChange={(event) => setFase(event.target.value)}
          >
            <option value="">Todas las fases</option>
            <option value="LICITACION">Licitación</option>
            <option value="EJECUCION">Ejecución</option>
          </select>
        </label>
        <button
          className={styles.secondaryButton}
          type="button"
          onClick={() => {
            setBusqueda("");
            setLinea("");
            setFase("");
          }}
        >
          Limpiar filtros
        </button>
      </div>

      {mensajeError ? <p className={styles.error}>{mensajeError}</p> : null}

      {cargando ? (
        <p className={styles.empty}>Consultando fondos generales...</p>
      ) : proyectosFiltrados.length === 0 ? (
        <p className={styles.empty}>
          No existen fondos que coincidan con los filtros o sus accesos.
        </p>
      ) : (
        <div className={styles.projects}>
          {proyectosFiltrados.map((proyecto) => (
            <article
              className={styles.projectCard}
              key={proyecto.proyecto_base_id}
            >
              <header className={styles.projectHeader}>
                <div>
                  <span className={styles.stateBadge}>
                    {formatearEtiqueta(proyecto.estado_proyecto)}
                  </span>
                  <h2>{proyecto.proyecto_nombre}</h2>
                  <p>{proyecto.fondo_nombre}</p>
                </div>
                <div className={styles.balance}>
                  <span>Saldo actual</span>
                  <strong>
                    {FORMATEADOR_MONEDA.format(proyecto.saldo_actual)}
                  </strong>
                </div>
              </header>

              <div className={styles.metrics}>
                <div>
                  <span>Gasto imputado visible</span>
                  <strong>
                    {FORMATEADOR_MONEDA.format(
                      proyecto.gasto_total_visible,
                    )}
                  </strong>
                </div>
                {proyecto.gasto_por_linea.map((resumen) => (
                  <div key={`linea-${resumen.clave}`}>
                    <span>{formatearEtiqueta(resumen.clave)}</span>
                    <strong>
                      {FORMATEADOR_MONEDA.format(
                        resumen.gasto_acumulado,
                      )}
                    </strong>
                  </div>
                ))}
                {proyecto.gasto_por_fase.map((resumen) => (
                  <div key={`fase-${resumen.clave}`}>
                    <span>{formatearEtiqueta(resumen.clave)}</span>
                    <strong>
                      {FORMATEADOR_MONEDA.format(
                        resumen.gasto_acumulado,
                      )}
                    </strong>
                  </div>
                ))}
              </div>

              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Centro de costo</th>
                      <th>Línea</th>
                      <th>Fase</th>
                      <th>Estado</th>
                      <th>Gasto acumulado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {proyecto.centros_costo.map((centro) => (
                      <tr key={centro.id}>
                        <td>
                          <strong>{centro.codigo}</strong>
                          <span>{centro.nombre}</span>
                        </td>
                        <td>{formatearEtiqueta(centro.linea_negocio)}</td>
                        <td>
                          {formatearEtiqueta(centro.fase_centro_costo)}
                        </td>
                        <td>
                          {formatearEtiqueta(centro.estado_centro_costo)}
                        </td>
                        <td className={styles.money}>
                          {FORMATEADOR_MONEDA.format(
                            centro.gasto_acumulado,
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className={styles.centerCards}>
                {proyecto.centros_costo.map((centro) => (
                  <article key={centro.id}>
                    <strong>{centro.codigo}</strong>
                    <span>{centro.nombre}</span>
                    <dl>
                      <div><dt>Línea</dt><dd>{formatearEtiqueta(centro.linea_negocio)}</dd></div>
                      <div><dt>Fase</dt><dd>{formatearEtiqueta(centro.fase_centro_costo)}</dd></div>
                      <div><dt>Estado</dt><dd>{formatearEtiqueta(centro.estado_centro_costo)}</dd></div>
                      <div><dt>Gasto</dt><dd>{FORMATEADOR_MONEDA.format(centro.gasto_acumulado)}</dd></div>
                    </dl>
                  </article>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
