"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  ConsultarOperacionesEfectivoData,
  OperacionEfectivoConsulta,
} from "@/modules/operaciones-efectivo/operaciones-efectivo.types";
import { formatearValorEntrada } from "@/components/solicitudes-pago/solicitudes-pago.utils";
import styles from "./OperacionesEfectivoManager.module.css";

const MONEDA = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const FECHA = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "medium",
  timeStyle: "short",
});

type Props = {
  operacionInicialId?: string;
};

export default function OperacionesEfectivoManager({
  operacionInicialId,
}: Props) {
  const [operaciones, setOperaciones] = useState<
    OperacionEfectivoConsulta[]
  >([]);
  const [operacionDetalle, setOperacionDetalle] =
    useState<OperacionEfectivoConsulta | null>(null);
  const [proyectoId, setProyectoId] = useState("");
  const [fondoId, setFondoId] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [valorReingreso, setValorReingreso] = useState("");
  const [observacionReingreso, setObservacionReingreso] =
    useState("");
  const [soporteReingreso, setSoporteReingreso] =
    useState<File | null>(null);
  const [registrandoReingreso, setRegistrandoReingreso] =
    useState(false);
  const [mensajeReingreso, setMensajeReingreso] = useState("");
  const [errorReingreso, setErrorReingreso] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError("");
    const parametros = new URLSearchParams();

    if (proyectoId) parametros.set("proyecto_base_id", proyectoId);
    if (fondoId) parametros.set("fondo_id", fondoId);
    if (fechaDesde) parametros.set("fecha_desde", fechaDesde);
    if (fechaHasta) parametros.set("fecha_hasta", fechaHasta);

    try {
      const query = parametros.toString();
      const response = await fetch(
        `/api/v1/operaciones-efectivo${query ? `?${query}` : ""}`,
        { credentials: "include", cache: "no-store" },
      );
      const body = (await response.json()) as {
        ok: boolean;
        message: string;
        data?: ConsultarOperacionesEfectivoData;
      };

      if (!response.ok || !body.ok) {
        throw new Error(body.message);
      }

      const registros = body.data?.operaciones ?? [];
      setOperaciones(registros);

      if (operacionInicialId) {
        setOperacionDetalle(
          registros.find(
            (operacion) => operacion.id === operacionInicialId,
          ) ?? null,
        );
      }
    } catch (causa) {
      setOperaciones([]);
      setError(
        causa instanceof Error
          ? causa.message
          : "No fue posible consultar los retiros.",
      );
    } finally {
      setCargando(false);
    }
  }, [
    fechaDesde,
    fechaHasta,
    fondoId,
    operacionInicialId,
    proyectoId,
  ]);

  useEffect(() => {
    const tarea = window.setTimeout(() => {
      void cargar();
    }, 0);

    return () => window.clearTimeout(tarea);
  }, [cargar]);

  const proyectos = useMemo(
    () =>
      Array.from(
        new Map(
          operaciones.map((operacion) => [
            operacion.proyecto_base_id,
            {
              id: operacion.proyecto_base_id,
              nombre: operacion.proyecto_nombre,
            },
          ]),
        ).values(),
      ),
    [operaciones],
  );
  const fondos = useMemo(
    () =>
      Array.from(
        new Map(
          operaciones
            .filter(
              (operacion) =>
                !proyectoId ||
                operacion.proyecto_base_id === proyectoId,
            )
            .map((operacion) => [
              operacion.fondo_id,
              {
                id: operacion.fondo_id,
                nombre: operacion.fondo_nombre,
              },
            ]),
        ).values(),
      ),
    [operaciones, proyectoId],
  );

  function claseEstado(estado: string) {
    if (estado === "SOBRANTE_PENDIENTE_REINGRESO") {
      return styles.pending;
    }
    if (estado === "SOBRANTE_REINTEGRADO") {
      return styles.completed;
    }
    return styles.neutral;
  }

  function etiquetaEstado(estado: string) {
    const etiquetas: Record<string, string> = {
      SIN_SOBRANTE: "Sin sobrante",
      SOBRANTE_PENDIENTE_REINGRESO: "Reingreso pendiente",
      SOBRANTE_REINTEGRADO: "Sobrante reintegrado",
    };

    return etiquetas[estado] ?? estado;
  }

  async function registrarReingreso(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!operacionDetalle || !soporteReingreso) {
      setErrorReingreso(true);
      setMensajeReingreso("Debe adjuntar el soporte del reingreso.");
      return;
    }

    const valorNumerico = Number(
      valorReingreso.replace(/[^\d]/g, ""),
    );

    if (
      valorNumerico <= 0 ||
      valorNumerico > operacionDetalle.valor_pendiente_reintegro
    ) {
      setErrorReingreso(true);
      setMensajeReingreso(
        "El valor debe ser mayor que cero y no superar el sobrante pendiente.",
      );
      return;
    }

    const formData = new FormData();
    formData.set("valor", String(valorNumerico));
    formData.set("observacion", observacionReingreso);
    formData.set("soporte", soporteReingreso);
    setRegistrandoReingreso(true);
    setMensajeReingreso("");

    try {
      const response = await fetch(
        `/api/v1/operaciones-efectivo/${operacionDetalle.id}/reingresos`,
        {
          method: "POST",
          credentials: "include",
          body: formData,
        },
      );
      const body = (await response.json()) as {
        ok: boolean;
        message: string;
        data?: { referencia_sistema: string };
      };

      setErrorReingreso(!response.ok || !body.ok);
      setMensajeReingreso(
        response.ok && body.ok && body.data
          ? `${body.message} Referencia ${body.data.referencia_sistema}.`
          : body.message,
      );

      if (response.ok && body.ok) {
        setValorReingreso("");
        setObservacionReingreso("");
        setSoporteReingreso(null);
        await cargar();
        setOperacionDetalle(null);
      }
    } catch {
      setErrorReingreso(true);
      setMensajeReingreso("No fue posible registrar el reingreso.");
    } finally {
      setRegistrandoReingreso(false);
    }
  }

  return (
    <section className={styles.container}>
      <div className={styles.filters}>
        <label>
          <span>Proyecto</span>
          <select
            value={proyectoId}
            onChange={(event) => {
              setProyectoId(event.target.value);
              setFondoId("");
            }}
          >
            <option value="">Todos los proyectos</option>
            {proyectos.map((proyecto) => (
              <option key={proyecto.id} value={proyecto.id}>
                {proyecto.nombre}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Fondo</span>
          <select
            value={fondoId}
            onChange={(event) => setFondoId(event.target.value)}
          >
            <option value="">Todos los fondos</option>
            {fondos.map((fondo) => (
              <option key={fondo.id} value={fondo.id}>
                {fondo.nombre}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Desde</span>
          <input
            type="date"
            value={fechaDesde}
            onChange={(event) => setFechaDesde(event.target.value)}
          />
        </label>
        <label>
          <span>Hasta</span>
          <input
            min={fechaDesde || undefined}
            type="date"
            value={fechaHasta}
            onChange={(event) => setFechaHasta(event.target.value)}
          />
        </label>
        <button
          type="button"
          onClick={() => {
            setProyectoId("");
            setFondoId("");
            setFechaDesde("");
            setFechaHasta("");
          }}
        >
          Limpiar filtros
        </button>
      </div>

      {error ? <p className={styles.error}>{error}</p> : null}

      {cargando ? (
        <p className={styles.empty}>Consultando retiros...</p>
      ) : operaciones.length === 0 ? (
        <p className={styles.empty}>
          No existen retiros que coincidan con los filtros.
        </p>
      ) : (
        <>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Fecha / proyecto</th>
                  <th>Solicitudes</th>
                  <th>Retirado</th>
                  <th>Pagado</th>
                  <th>Reintegrado</th>
                  <th>Pendiente</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {operaciones.map((operacion) => (
                  <tr
                    key={operacion.id}
                    tabIndex={0}
                    onClick={() => setOperacionDetalle(operacion)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        setOperacionDetalle(operacion);
                      }
                    }}
                  >
                    <td>
                      <strong>
                        {FECHA.format(new Date(operacion.fecha_retiro))}
                      </strong>
                      <span>{operacion.proyecto_nombre}</span>
                    </td>
                    <td>{operacion.detalles.length}</td>
                    <td>{MONEDA.format(operacion.valor_retirado)}</td>
                    <td>{MONEDA.format(operacion.valor_pagado)}</td>
                    <td>{MONEDA.format(operacion.valor_reintegrado)}</td>
                    <td>
                      {MONEDA.format(
                        operacion.valor_pendiente_reintegro,
                      )}
                    </td>
                    <td>
                      <span
                        className={claseEstado(
                          operacion.estado_seguimiento,
                        )}
                      >
                        {etiquetaEstado(operacion.estado_seguimiento)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className={styles.cards}>
            {operaciones.map((operacion) => (
              <article key={operacion.id}>
                <header>
                  <div>
                    <strong>{operacion.proyecto_nombre}</strong>
                    <span>
                      {FECHA.format(new Date(operacion.fecha_retiro))}
                    </span>
                  </div>
                  <span
                    className={claseEstado(
                      operacion.estado_seguimiento,
                    )}
                  >
                    {etiquetaEstado(operacion.estado_seguimiento)}
                  </span>
                </header>
                <dl>
                  <div><dt>Retirado</dt><dd>{MONEDA.format(operacion.valor_retirado)}</dd></div>
                  <div><dt>Pagado</dt><dd>{MONEDA.format(operacion.valor_pagado)}</dd></div>
                  <div><dt>Reintegrado</dt><dd>{MONEDA.format(operacion.valor_reintegrado)}</dd></div>
                  <div><dt>Pendiente</dt><dd>{MONEDA.format(operacion.valor_pendiente_reintegro)}</dd></div>
                </dl>
                <button
                  type="button"
                  onClick={() => setOperacionDetalle(operacion)}
                >
                  Ver detalle
                </button>
              </article>
            ))}
          </div>
        </>
      )}

      {operacionDetalle ? (
        <div
          className={styles.backdrop}
          role="presentation"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) {
              setOperacionDetalle(null);
            }
          }}
        >
          <section
            aria-labelledby="detalle-retiro-title"
            aria-modal="true"
            className={styles.modal}
            role="dialog"
          >
            <header className={styles.modalHeader}>
              <div>
                <span>Detalle operativo del retiro</span>
                <h2 id="detalle-retiro-title">
                  {operacionDetalle.proyecto_nombre}
                </h2>
              </div>
              <button
                aria-label="Cerrar detalle"
                type="button"
                onClick={() => setOperacionDetalle(null)}
              >
                ×
              </button>
            </header>
            <div className={styles.metrics}>
              <div><span>Requerido</span><strong>{MONEDA.format(operacionDetalle.valor_requerido)}</strong></div>
              <div><span>Retirado</span><strong>{MONEDA.format(operacionDetalle.valor_retirado)}</strong></div>
              <div><span>Pagado</span><strong>{MONEDA.format(operacionDetalle.valor_pagado)}</strong></div>
              <div><span>Sobrante</span><strong>{MONEDA.format(operacionDetalle.valor_sobrante)}</strong></div>
              <div><span>Reintegrado</span><strong>{MONEDA.format(operacionDetalle.valor_reintegrado)}</strong></div>
              <div><span>Pendiente</span><strong>{MONEDA.format(operacionDetalle.valor_pendiente_reintegro)}</strong></div>
            </div>
            <div className={styles.supportRow}>
              <span>
                Retiro registrado por{" "}
                <strong>{operacionDetalle.registrado_por_nombre}</strong>
              </span>
              <a
                href={`/api/v1/operaciones-efectivo/${operacionDetalle.id}/soportes/${operacionDetalle.soporte_retiro.id}`}
                rel="noreferrer"
                target="_blank"
              >
                Ver soporte del retiro
              </a>
            </div>
            <div className={styles.detailList}>
              {operacionDetalle.detalles.map((detalle) => (
                <article key={detalle.id}>
                  <header>
                    <div>
                      <strong>
                        {detalle.numero_solicitud ?? "Sin consecutivo"}
                      </strong>
                      <span>{detalle.tipo_solicitud}</span>
                    </div>
                    <strong>{MONEDA.format(detalle.valor_pagado)}</strong>
                  </header>
                  <dl>
                    <div><dt>Beneficiario</dt><dd>{detalle.beneficiario_nombre ?? "No aplica"}</dd></div>
                    <div><dt>Centro</dt><dd>{detalle.centro_costo_codigo} · {detalle.centro_costo_nombre}</dd></div>
                    <div><dt>Medio</dt><dd>{detalle.medio_pago}</dd></div>
                    <div><dt>Comprobante</dt><dd>{detalle.numero_comprobante ?? "No aplica"}</dd></div>
                  </dl>
                  <a
                    href={`/api/v1/operaciones-efectivo/${operacionDetalle.id}/soportes/${detalle.soporte.id}`}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Ver soporte de pago
                  </a>
                </article>
              ))}
            </div>
            {operacionDetalle.reingresos.length > 0 ? (
              <div className={styles.reentryHistory}>
                <h3>Reingresos registrados</h3>
                {operacionDetalle.reingresos.map((reingreso) => (
                  <article key={reingreso.id}>
                    <div>
                      <strong>{reingreso.referencia_sistema}</strong>
                      <span>
                        {FECHA.format(
                          new Date(reingreso.fecha_reingreso),
                        )}{" "}
                        · {reingreso.registrado_por_nombre}
                      </span>
                    </div>
                    <strong>{MONEDA.format(reingreso.valor)}</strong>
                    <a
                      href={`/api/v1/operaciones-efectivo/${operacionDetalle.id}/soportes/${reingreso.soporte.id}`}
                      rel="noreferrer"
                      target="_blank"
                    >
                      Ver soporte
                    </a>
                  </article>
                ))}
              </div>
            ) : null}
            {operacionDetalle.valor_pendiente_reintegro > 0 ? (
              <form
                className={styles.reentryForm}
                onSubmit={registrarReingreso}
              >
                <div>
                  <h3>Registrar reingreso</h3>
                  <p>
                    Pendiente:{" "}
                    <strong>
                      {MONEDA.format(
                        operacionDetalle.valor_pendiente_reintegro,
                      )}
                    </strong>
                  </p>
                </div>
                <label>
                  <span>Valor *</span>
                  <input
                    inputMode="numeric"
                    placeholder="0"
                    required
                    type="text"
                    value={valorReingreso}
                    onChange={(event) =>
                      setValorReingreso(
                        formatearValorEntrada(event.target.value),
                      )
                    }
                  />
                </label>
                <label>
                  <span>Soporte *</span>
                  <input
                    accept=".pdf,.png,.jpg,.jpeg"
                    required
                    type="file"
                    onChange={(event) =>
                      setSoporteReingreso(
                        event.target.files?.[0] ?? null,
                      )
                    }
                  />
                </label>
                <label className={styles.fullWidth}>
                  <span>Observación</span>
                  <textarea
                    rows={2}
                    value={observacionReingreso}
                    onChange={(event) =>
                      setObservacionReingreso(event.target.value)
                    }
                  />
                </label>
                <div className={styles.systemDate}>
                  La fecha y hora serán asignadas por el sistema.
                </div>
                {mensajeReingreso ? (
                  <p
                    className={
                      errorReingreso
                        ? styles.formError
                        : styles.formSuccess
                    }
                  >
                    {mensajeReingreso}
                  </p>
                ) : null}
                <button
                  disabled={registrandoReingreso}
                  type="submit"
                >
                  {registrandoReingreso
                    ? "Registrando..."
                    : "Registrar reingreso"}
                </button>
              </form>
            ) : null}
          </section>
        </div>
      ) : null}
    </section>
  );
}
