"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type {
  ConsultarFondosData,
  ConsultarMovimientosFondoData,
  MovimientoFondoConsulta,
  ProyectoFondoGeneral,
} from "@/modules/fondos/fondos.types";
import styles from "./FondosManager.module.css";

type RespuestaFondos = {
  ok: boolean;
  message: string;
  data?: ConsultarFondosData;
};

type RespuestaMovimientos = {
  ok: boolean;
  message: string;
  data?: ConsultarMovimientosFondoData;
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

function formatearTipoMovimiento(valor: string): string {
  return valor
    .toLocaleLowerCase("es")
    .split("_")
    .map((parte) => parte.charAt(0).toLocaleUpperCase("es") + parte.slice(1))
    .join(" ");
}

function formatearCentroCosto(
  codigo: string | null | undefined,
  nombre: string | null | undefined,
): string {
  const codigoLimpio = codigo?.trim() ?? "";
  const nombreLimpio = nombre?.trim() ?? "";

  if (!codigoLimpio && !nombreLimpio) {
    return "Movimiento general del fondo";
  }

  if (
    codigoLimpio.localeCompare(nombreLimpio, "es", {
      sensitivity: "base",
    }) === 0
  ) {
    return nombreLimpio || codigoLimpio;
  }

  return [codigoLimpio, nombreLimpio].filter(Boolean).join(" · ");
}

const FORMATEADOR_FECHA = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default function FondosManager() {
  const [vista, setVista] = useState<"FONDOS" | "MOVIMIENTOS">(
    "FONDOS",
  );
  const [proyectos, setProyectos] = useState<ProyectoFondoGeneral[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [linea, setLinea] = useState("");
  const [fase, setFase] = useState("");
  const [cargando, setCargando] = useState(true);
  const [mensajeError, setMensajeError] = useState("");
  const [movimientos, setMovimientos] = useState<
    MovimientoFondoConsulta[]
  >([]);
  const [tiposMovimiento, setTiposMovimiento] = useState<string[]>([]);
  const [proyectoMovimiento, setProyectoMovimiento] = useState("");
  const [centroMovimiento, setCentroMovimiento] = useState("");
  const [lineaMovimiento, setLineaMovimiento] = useState("");
  const [faseMovimiento, setFaseMovimiento] = useState("");
  const [direccionMovimiento, setDireccionMovimiento] = useState("");
  const [tipoMovimiento, setTipoMovimiento] = useState("");
  const [fechaDesdeMovimiento, setFechaDesdeMovimiento] = useState("");
  const [fechaHastaMovimiento, setFechaHastaMovimiento] = useState("");
  const [cargandoMovimientos, setCargandoMovimientos] = useState(false);
  const [errorMovimientos, setErrorMovimientos] = useState("");
  const [filtrosMovilesVisibles, setFiltrosMovilesVisibles] = useState(false);
  const [fondoDetalle, setFondoDetalle] = useState<ProyectoFondoGeneral | null>(null);
  const [movimientoDetalle, setMovimientoDetalle] = useState<MovimientoFondoConsulta | null>(null);

  useEffect(() => {
    if (!fondoDetalle && !movimientoDetalle) return;
    function cerrarConEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setFondoDetalle(null);
        setMovimientoDetalle(null);
      }
    }
    window.addEventListener("keydown", cerrarConEscape);
    return () => window.removeEventListener("keydown", cerrarConEscape);
  }, [fondoDetalle, movimientoDetalle]);

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

  const cargarMovimientos = useCallback(async () => {
    setCargandoMovimientos(true);
    setErrorMovimientos("");

    const parametros = new URLSearchParams();

    if (proyectoMovimiento) {
      parametros.set("proyecto_base_id", proyectoMovimiento);
    }
    if (centroMovimiento) {
      parametros.set("centro_costo_id", centroMovimiento);
    }
    if (lineaMovimiento) {
      parametros.set("linea_negocio", lineaMovimiento);
    }
    if (faseMovimiento) {
      parametros.set("fase_centro_costo", faseMovimiento);
    }
    if (direccionMovimiento) {
      parametros.set("direccion", direccionMovimiento);
    }
    if (tipoMovimiento) {
      parametros.set("tipo_movimiento", tipoMovimiento);
    }
    if (fechaDesdeMovimiento) {
      parametros.set("fecha_desde", fechaDesdeMovimiento);
    }
    if (fechaHastaMovimiento) {
      parametros.set("fecha_hasta", fechaHastaMovimiento);
    }

    try {
      const query = parametros.toString();
      const response = await fetch(
        `/api/v1/fondos/movimientos${query ? `?${query}` : ""}`,
        {
          credentials: "include",
          cache: "no-store",
        },
      );
      const body = (await response.json()) as RespuestaMovimientos;

      if (!response.ok || !body.ok) {
        throw new Error(
          body.message ??
            "No fue posible consultar los movimientos financieros.",
        );
      }

      setMovimientos(body.data?.movimientos ?? []);
      setTiposMovimiento((tiposActuales) =>
        Array.from(
          new Set([
            ...tiposActuales,
            ...(body.data?.tipos_movimiento ?? []),
          ]),
        ).sort(),
      );
    } catch (error) {
      setMovimientos([]);
      setErrorMovimientos(
        error instanceof Error
          ? error.message
          : "No fue posible consultar los movimientos financieros.",
      );
    } finally {
      setCargandoMovimientos(false);
    }
  }, [
    centroMovimiento,
    direccionMovimiento,
    faseMovimiento,
    fechaDesdeMovimiento,
    fechaHastaMovimiento,
    lineaMovimiento,
    proyectoMovimiento,
    tipoMovimiento,
  ]);

  useEffect(() => {
    if (vista !== "MOVIMIENTOS") {
      return;
    }

    const tareaCarga = window.setTimeout(() => {
      void cargarMovimientos();
    }, 0);

    return () => window.clearTimeout(tareaCarga);
  }, [cargarMovimientos, vista]);

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

  const centrosDisponibles = useMemo(
    () =>
      proyectos
        .filter(
          (proyecto) =>
            !proyectoMovimiento ||
            proyecto.proyecto_base_id === proyectoMovimiento,
        )
        .flatMap((proyecto) => proyecto.centros_costo)
        .filter(
          (centro) =>
            (!lineaMovimiento ||
              centro.linea_negocio === lineaMovimiento) &&
            (!faseMovimiento ||
              centro.fase_centro_costo === faseMovimiento),
        ),
    [
      faseMovimiento,
      lineaMovimiento,
      proyectoMovimiento,
      proyectos,
    ],
  );

  const selectorVista = (
    <div className={styles.tabs} role="tablist" aria-label="Consulta financiera">
      <button
        aria-selected={vista === "FONDOS"}
        className={vista === "FONDOS" ? styles.activeTab : ""}
        onClick={() => setVista("FONDOS")}
        role="tab"
        type="button"
      >
        Fondos generales
      </button>
      <button
        aria-selected={vista === "MOVIMIENTOS"}
        className={vista === "MOVIMIENTOS" ? styles.activeTab : ""}
        onClick={() => setVista("MOVIMIENTOS")}
        role="tab"
        type="button"
      >
        Movimientos
      </button>
    </div>
  );

  const modalDetalle = fondoDetalle || movimientoDetalle ? (
    <div
      className={`${styles.modalBackdrop} ${styles.detailBackdrop} appModalBackdrop`}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          setFondoDetalle(null);
          setMovimientoDetalle(null);
        }
      }}
    >
      <section
        className={`${styles.detailDialog} appModalDialog`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="detalle-financiero-titulo"
      >
        <header className={styles.detailHeader}>
          <div>
            <span>{fondoDetalle ? "Detalle del fondo" : "Detalle del movimiento"}</span>
            <h2 id="detalle-financiero-titulo">
              {fondoDetalle
                ? fondoDetalle.fondo_nombre
                : formatearTipoMovimiento(movimientoDetalle!.tipo_movimiento)}
            </h2>
          </div>
          <button
            type="button"
            aria-label="Cerrar detalle"
            onClick={() => {
              setFondoDetalle(null);
              setMovimientoDetalle(null);
            }}
          >
            ×
          </button>
        </header>

        {fondoDetalle ? (
          <section className={styles.detailSection}>
            <h3>Resumen del fondo</h3>
            <dl className={styles.detailGrid}>
              <div><dt>Proyecto</dt><dd>{fondoDetalle.proyecto_nombre}</dd></div>
              <div><dt>Estado</dt><dd>{formatearEtiqueta(fondoDetalle.estado_proyecto)}</dd></div>
              <div className={styles.detailHighlight}><dt>Saldo actual</dt><dd>{FORMATEADOR_MONEDA.format(fondoDetalle.saldo_actual)}</dd></div>
              <div><dt>Gasto imputado visible</dt><dd>{FORMATEADOR_MONEDA.format(fondoDetalle.gasto_total_visible)}</dd></div>
              <div><dt>Centros de costo visibles</dt><dd>{fondoDetalle.centros_costo.length}</dd></div>
            </dl>
          </section>
        ) : (
          <>
            <section className={styles.detailSection}>
              <h3>Información del movimiento</h3>
              <dl className={styles.detailGrid}>
                <div><dt>Proyecto</dt><dd>{movimientoDetalle!.proyecto_nombre}</dd></div>
                <div><dt>Centro de costo</dt><dd>{formatearCentroCosto(movimientoDetalle!.centro_costo_codigo, movimientoDetalle!.centro_costo_nombre)}</dd></div>
                <div><dt>Fecha</dt><dd>{FORMATEADOR_FECHA.format(new Date(movimientoDetalle!.registrado_en))}</dd></div>
                <div><dt>Dirección</dt><dd>{formatearEtiqueta(movimientoDetalle!.direccion)}</dd></div>
                <div className={styles.detailWide}><dt>Referencia</dt><dd>{movimientoDetalle!.referencia_sistema ?? "Sin referencia"}</dd></div>
                <div className={styles.detailWide}><dt>Descripción</dt><dd>{movimientoDetalle!.descripcion ?? "Sin descripción"}</dd></div>
              </dl>
            </section>
            <section className={styles.detailSection}>
              <h3>Impacto en el saldo</h3>
              <dl className={`${styles.detailGrid} ${styles.detailFinancialGrid}`}>
                <div><dt>Valor</dt><dd>{FORMATEADOR_MONEDA.format(movimientoDetalle!.valor)}</dd></div>
                <div><dt>Saldo anterior</dt><dd>{FORMATEADOR_MONEDA.format(movimientoDetalle!.saldo_anterior)}</dd></div>
                <div className={styles.detailWide}><dt>Operación</dt><dd>{`${FORMATEADOR_MONEDA.format(movimientoDetalle!.saldo_anterior)} ${movimientoDetalle!.direccion === "INGRESO" ? "+" : "−"} ${FORMATEADOR_MONEDA.format(movimientoDetalle!.valor)}`}</dd></div>
                <div className={`${styles.detailWide} ${styles.detailHighlight}`}><dt>Saldo nuevo</dt><dd>{FORMATEADOR_MONEDA.format(movimientoDetalle!.saldo_nuevo)}</dd></div>
              </dl>
            </section>
            <section className={styles.attachmentSection}>
              <h3>Soportes del movimiento</h3>
              {movimientoDetalle!.adjuntos.length > 0 ? (
                <div className={styles.attachmentList}>
                  {movimientoDetalle!.adjuntos.map((adjunto) => (
                    <a
                      key={adjunto.id}
                      href={adjunto.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <span>{adjunto.nombre_archivo}</span>
                      <strong>Ver adjunto</strong>
                    </a>
                  ))}
                </div>
              ) : (
                <p>Este movimiento no tiene un soporte asociado.</p>
              )}
            </section>
          </>
        )}
      </section>
    </div>
  ) : null;

  if (vista === "MOVIMIENTOS") {
    return (
      <section className={styles.container}>
        {selectorVista}

        <button
          type="button"
          className={styles.mobileFiltersToggle}
          aria-expanded={filtrosMovilesVisibles}
          aria-controls="filtros-movimientos-fondos"
          onClick={() => setFiltrosMovilesVisibles((visible) => !visible)}
        >
          <span>Filtros</span>
          <span>
            {[proyectoMovimiento, centroMovimiento, lineaMovimiento, faseMovimiento, direccionMovimiento, tipoMovimiento, fechaDesdeMovimiento, fechaHastaMovimiento].filter(Boolean).length > 0
              ? `${[proyectoMovimiento, centroMovimiento, lineaMovimiento, faseMovimiento, direccionMovimiento, tipoMovimiento, fechaDesdeMovimiento, fechaHastaMovimiento].filter(Boolean).length} activos`
              : "Mostrar"}
          </span>
        </button>
        <div
          id="filtros-movimientos-fondos"
          className={`${styles.movementFilters} ${
            filtrosMovilesVisibles ? "" : styles.mobileFiltersCollapsed
          }`}
        >
          <label className={styles.field}>
            <span>Proyecto base</span>
            <select
              value={proyectoMovimiento}
              onChange={(event) => {
                setProyectoMovimiento(event.target.value);
                setCentroMovimiento("");
              }}
            >
              <option value="">Todos los proyectos</option>
              {proyectos.map((proyecto) => (
                <option
                  key={proyecto.proyecto_base_id}
                  value={proyecto.proyecto_base_id}
                >
                  {proyecto.proyecto_nombre}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            <span>Centro de costo</span>
            <select
              value={centroMovimiento}
              onChange={(event) =>
                setCentroMovimiento(event.target.value)
              }
            >
              <option value="">Todos los centros</option>
              {centrosDisponibles.map((centro) => (
                <option key={centro.id} value={centro.id}>
                  {formatearCentroCosto(centro.codigo, centro.nombre)}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            <span>Línea de negocio</span>
            <select
              value={lineaMovimiento}
              onChange={(event) => {
                setLineaMovimiento(event.target.value);
                setCentroMovimiento("");
              }}
            >
              <option value="">Todas las líneas</option>
              <option value="OBRA">Obra</option>
              <option value="INTERVENTORIA">Interventoría</option>
            </select>
          </label>
          <label className={styles.field}>
            <span>Fase</span>
            <select
              value={faseMovimiento}
              onChange={(event) => {
                setFaseMovimiento(event.target.value);
                setCentroMovimiento("");
              }}
            >
              <option value="">Todas las fases</option>
              <option value="LICITACION">Licitación</option>
              <option value="EJECUCION">Ejecución</option>
            </select>
          </label>
          <label className={styles.field}>
            <span>Dirección</span>
            <select
              value={direccionMovimiento}
              onChange={(event) =>
                setDireccionMovimiento(event.target.value)
              }
            >
              <option value="">Ingresos y egresos</option>
              <option value="INGRESO">Ingreso</option>
              <option value="EGRESO">Egreso</option>
            </select>
          </label>
          <label className={styles.field}>
            <span>Tipo de movimiento</span>
            <select
              value={tipoMovimiento}
              onChange={(event) =>
                setTipoMovimiento(event.target.value)
              }
            >
              <option value="">Todos los tipos</option>
              {tiposMovimiento.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {formatearTipoMovimiento(tipo)}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            <span>Desde</span>
            <input
              type="date"
              value={fechaDesdeMovimiento}
              max={fechaHastaMovimiento || undefined}
              onChange={(event) =>
                setFechaDesdeMovimiento(event.target.value)
              }
            />
          </label>
          <label className={styles.field}>
            <span>Hasta</span>
            <input
              type="date"
              value={fechaHastaMovimiento}
              min={fechaDesdeMovimiento || undefined}
              onChange={(event) =>
                setFechaHastaMovimiento(event.target.value)
              }
            />
          </label>
          <button
            className={styles.secondaryButton}
            type="button"
            onClick={() => {
              setProyectoMovimiento("");
              setCentroMovimiento("");
              setLineaMovimiento("");
              setFaseMovimiento("");
              setDireccionMovimiento("");
              setTipoMovimiento("");
              setFechaDesdeMovimiento("");
              setFechaHastaMovimiento("");
            }}
          >
            Limpiar filtros
          </button>
        </div>

        {errorMovimientos ? (
          <p className={styles.error}>{errorMovimientos}</p>
        ) : null}

        {cargandoMovimientos ? (
          <p className={styles.empty}>
            Consultando movimientos financieros...
          </p>
        ) : movimientos.length === 0 ? (
          <p className={styles.empty}>
            No existen movimientos que coincidan con los filtros.
          </p>
        ) : (
          <>
            <div className={styles.tableWrapper}>
              <table className={`${styles.table} ${styles.movementTable}`}>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Proyecto / centro</th>
                    <th>Movimiento</th>
                    <th>Dirección</th>
                    <th>Valor</th>
                    <th>Saldo anterior</th>
                    <th>Saldo nuevo</th>
                  </tr>
                </thead>
                <tbody>
                  {movimientos.map((movimiento) => (
                    <tr
                      key={movimiento.id}
                      className={styles.clickableRow}
                      onClick={() => setMovimientoDetalle(movimiento)}
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setMovimientoDetalle(movimiento);
                        }
                      }}
                    >
                      <td>
                        {FORMATEADOR_FECHA.format(
                          new Date(movimiento.registrado_en),
                        )}
                      </td>
                      <td>
                        <strong>{movimiento.proyecto_nombre}</strong>
                        <span>
                          {formatearCentroCosto(
                            movimiento.centro_costo_codigo,
                            movimiento.centro_costo_nombre,
                          )}
                        </span>
                      </td>
                      <td>
                        <strong>
                          {formatearTipoMovimiento(
                            movimiento.tipo_movimiento,
                          )}
                        </strong>
                        <span>
                          {movimiento.referencia_sistema ??
                            movimiento.descripcion ??
                            "Sin referencia"}
                        </span>
                        {movimiento.tipo_movimiento ===
                          "EGRESO_RETIRO_EFECTIVO" &&
                        movimiento.operacion_efectivo_id ? (
                          <Link
                            className={styles.detailLink}
                            href={`/pagos/retiros?operacion=${movimiento.operacion_efectivo_id}`}
                            onClick={(event) => event.stopPropagation()}
                          >
                            Ver detalle operativo
                          </Link>
                        ) : null}
                      </td>
                      <td>
                        <span
                          className={
                            movimiento.direccion === "INGRESO"
                              ? styles.incomeBadge
                              : styles.expenseBadge
                          }
                        >
                          {formatearEtiqueta(movimiento.direccion)}
                        </span>
                      </td>
                      <td className={styles.money}>
                        {FORMATEADOR_MONEDA.format(movimiento.valor)}
                      </td>
                      <td className={styles.money}>
                        {FORMATEADOR_MONEDA.format(
                          movimiento.saldo_anterior,
                        )}
                      </td>
                      <td className={styles.money}>
                        {FORMATEADOR_MONEDA.format(
                          movimiento.saldo_nuevo,
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={styles.movementCards}>
              {movimientos.map((movimiento) => (
                <article
                  key={movimiento.id}
                  className={styles.clickableCard}
                  onClick={() => setMovimientoDetalle(movimiento)}
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setMovimientoDetalle(movimiento);
                    }
                  }}
                >
                  <header>
                    <div>
                      <strong>
                        {formatearTipoMovimiento(
                          movimiento.tipo_movimiento,
                        )}
                      </strong>
                      <span>{movimiento.proyecto_nombre}</span>
                    </div>
                    <span
                      className={
                        movimiento.direccion === "INGRESO"
                          ? styles.incomeBadge
                          : styles.expenseBadge
                      }
                    >
                      {formatearEtiqueta(movimiento.direccion)}
                    </span>
                  </header>
                  <p>
                    {formatearCentroCosto(
                      movimiento.centro_costo_codigo,
                      movimiento.centro_costo_nombre,
                    )}
                  </p>
                  <div className={styles.mobilePrimaryAmount}>
                    <span>
                      {FORMATEADOR_FECHA.format(new Date(movimiento.registrado_en))}
                    </span>
                    <strong>{FORMATEADOR_MONEDA.format(movimiento.valor)}</strong>
                  </div>
                  {movimiento.tipo_movimiento ===
                    "EGRESO_RETIRO_EFECTIVO" &&
                  movimiento.operacion_efectivo_id ? (
                    <Link
                      className={styles.detailLink}
                      href={`/pagos/retiros?operacion=${movimiento.operacion_efectivo_id}`}
                      onClick={(event) => event.stopPropagation()}
                    >
                      Ver detalle operativo
                    </Link>
                  ) : null}
                  <details className={styles.mobileDisclosure}>
                    <summary>Ver impacto en el saldo</summary>
                    <dl>
                      <div>
                        <dt>Saldo anterior</dt>
                        <dd>
                          {FORMATEADOR_MONEDA.format(
                            movimiento.saldo_anterior,
                          )}
                        </dd>
                      </div>
                      <div>
                        <dt>Saldo nuevo</dt>
                        <dd>
                          {FORMATEADOR_MONEDA.format(
                            movimiento.saldo_nuevo,
                          )}
                        </dd>
                      </div>
                    </dl>
                  </details>
                </article>
              ))}
            </div>
          </>
        )}
        {modalDetalle}
      </section>
    );
  }

  return (
    <section className={styles.container}>
      {selectorVista}
      <button
        type="button"
        className={styles.mobileFiltersToggle}
        aria-expanded={filtrosMovilesVisibles}
        aria-controls="filtros-fondos"
        onClick={() => setFiltrosMovilesVisibles((visible) => !visible)}
      >
        <span>Filtros</span>
        <span>
          {[busqueda, linea, fase].filter(Boolean).length > 0
            ? `${[busqueda, linea, fase].filter(Boolean).length} activos`
            : "Mostrar"}
        </span>
      </button>
      <div
        id="filtros-fondos"
        className={`${styles.filters} ${
          filtrosMovilesVisibles ? "" : styles.mobileFiltersCollapsed
        }`}
      >
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
                <button
                  className={styles.fundDetailButton}
                  type="button"
                  onClick={() => setFondoDetalle(proyecto)}
                >
                  Ver detalle del fondo
                </button>
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
                          <strong>
                            {formatearCentroCosto(
                              centro.codigo,
                              centro.nombre,
                            )}
                          </strong>
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
                    <strong>
                      {formatearCentroCosto(centro.codigo, centro.nombre)}
                    </strong>
                    <div className={styles.mobilePrimaryAmount}>
                      <span>Gasto acumulado</span>
                      <strong>{FORMATEADOR_MONEDA.format(centro.gasto_acumulado)}</strong>
                    </div>
                    <details className={styles.mobileDisclosure}>
                      <summary>Ver clasificación</summary>
                      <dl>
                        <div><dt>Línea</dt><dd>{formatearEtiqueta(centro.linea_negocio)}</dd></div>
                        <div><dt>Fase</dt><dd>{formatearEtiqueta(centro.fase_centro_costo)}</dd></div>
                        <div><dt>Estado</dt><dd>{formatearEtiqueta(centro.estado_centro_costo)}</dd></div>
                      </dl>
                    </details>
                  </article>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
      {modalDetalle}
    </section>
  );
}
