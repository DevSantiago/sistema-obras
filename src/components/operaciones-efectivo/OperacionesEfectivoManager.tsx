"use client";

import SelectorSoporteConCamara from "@/components/adjuntos/SelectorSoporteConCamara";
import { formatearNombrePropio } from "@/lib/text-format";
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
  const [soloPendientes, setSoloPendientes] = useState(false);
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
  const [direccionCorreccion, setDireccionCorreccion] =
    useState<"INGRESO" | "EGRESO">("INGRESO");
  const [valorCorreccion, setValorCorreccion] = useState("");
  const [motivoCorreccion, setMotivoCorreccion] = useState("");
  const [observacionCorreccion, setObservacionCorreccion] =
    useState("");
  const [registrandoCorreccion, setRegistrandoCorreccion] =
    useState(false);
  const [mensajeCorreccion, setMensajeCorreccion] = useState("");
  const [errorCorreccion, setErrorCorreccion] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError("");
    const parametros = new URLSearchParams();

    if (proyectoId) parametros.set("proyecto_base_id", proyectoId);
    if (fondoId) parametros.set("fondo_id", fondoId);
    if (fechaDesde) parametros.set("fecha_desde", fechaDesde);
    if (fechaHasta) parametros.set("fecha_hasta", fechaHasta);
    if (soloPendientes) parametros.set("solo_pendientes", "true");

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
    soloPendientes,
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
  const resumen = useMemo(
    () => ({
      retiros: operaciones.length,
      proyectos: new Set(
        operaciones.map((operacion) => operacion.proyecto_base_id),
      ).size,
      fondos: new Set(
        operaciones.map((operacion) => operacion.fondo_id),
      ).size,
      pendiente: operaciones.reduce(
        (total, operacion) =>
          total + operacion.valor_pendiente_reintegro,
        0,
      ),
    }),
    [operaciones],
  );

  function exportarPendientes() {
    const encabezados = [
      "Fecha retiro",
      "Proyecto",
      "Fondo",
      "Solicitud",
      "Tipo solicitud",
      "Centro de costo",
      "Beneficiario",
      "Valor requerido",
      "Valor retirado",
      "Valor pagado solicitud",
      "Valor reingresado",
      "Valor pendiente",
    ];
    const escapar = (valor: string | number) =>
      `"${String(valor).replaceAll('"', '""')}"`;
    const filas = operaciones.flatMap((operacion) =>
      operacion.detalles.map((detalle) => [
        new Date(operacion.fecha_retiro).toLocaleDateString("es-CO"),
        operacion.proyecto_nombre,
        operacion.fondo_nombre,
        detalle.numero_solicitud ?? "Sin consecutivo",
        detalle.tipo_solicitud,
        `${detalle.centro_costo_codigo} - ${detalle.centro_costo_nombre}`,
        detalle.beneficiario_nombre
          ? formatearNombrePropio(detalle.beneficiario_nombre)
          : "No aplica",
        operacion.valor_requerido,
        operacion.valor_retirado,
        detalle.valor_pagado,
        operacion.valor_reintegrado,
        operacion.valor_pendiente_reintegro,
      ]),
    );
    const contenido = [encabezados, ...filas]
      .map((fila) => fila.map(escapar).join(";"))
      .join("\n");
    const enlace = document.createElement("a");

    enlace.href = URL.createObjectURL(
      new Blob([`\uFEFF${contenido}`], {
        type: "text/csv;charset=utf-8",
      }),
    );
    enlace.download = `pendientes-reingreso-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    enlace.click();
    URL.revokeObjectURL(enlace.href);
  }

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
      SOBRANTE_AJUSTADO: "Sobrante ajustado",
      ANULADA: "Operación anulada",
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

  async function registrarCorreccion(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!operacionDetalle || !motivoCorreccion.trim()) {
      setErrorCorreccion(true);
      setMensajeCorreccion("El motivo es obligatorio.");
      return;
    }

    const valorNumerico = Number(
      valorCorreccion.replace(/[^\d]/g, ""),
    );

    if (!Number.isFinite(valorNumerico) || valorNumerico <= 0) {
      setErrorCorreccion(true);
      setMensajeCorreccion("El valor del ajuste debe ser mayor que cero.");
      return;
    }

    setRegistrandoCorreccion(true);
    setMensajeCorreccion("");

    try {
      const response = await fetch(
        `/api/v1/operaciones-efectivo/${operacionDetalle.id}/correcciones`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tipo: "AJUSTE",
            direccion: direccionCorreccion,
            valor: valorNumerico,
            motivo: motivoCorreccion,
            observacion: observacionCorreccion,
          }),
        },
      );
      const body = (await response.json()) as {
        ok: boolean;
        message: string;
        data?: { referencia_sistema: string };
      };

      setErrorCorreccion(!response.ok || !body.ok);
      setMensajeCorreccion(
        response.ok && body.ok && body.data
          ? `${body.message} Referencia ${body.data.referencia_sistema}.`
          : body.message,
      );

      if (response.ok && body.ok) {
        setValorCorreccion("");
        setMotivoCorreccion("");
        setObservacionCorreccion("");
        await cargar();
        setOperacionDetalle(null);
      }
    } catch {
      setErrorCorreccion(true);
      setMensajeCorreccion("No fue posible corregir la operación.");
    } finally {
      setRegistrandoCorreccion(false);
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
        <label>
          <span>Estado</span>
          <select
            value={soloPendientes ? "pendientes" : "todos"}
            onChange={(event) =>
              setSoloPendientes(event.target.value === "pendientes")
            }
          >
            <option value="todos">Todos los retiros</option>
            <option value="pendientes">Reingreso pendiente</option>
          </select>
        </label>
        <button
          type="button"
          onClick={() => {
            setProyectoId("");
            setFondoId("");
            setFechaDesde("");
            setFechaHasta("");
            setSoloPendientes(false);
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
          <div className={styles.summary}>
            <div><span>Retiros</span><strong>{resumen.retiros}</strong></div>
            <div><span>Proyectos</span><strong>{resumen.proyectos}</strong></div>
            <div><span>Fondos</span><strong>{resumen.fondos}</strong></div>
            <div><span>Valor pendiente</span><strong>{MONEDA.format(resumen.pendiente)}</strong></div>
            <button type="button" onClick={exportarPendientes}>
              Exportar CSV
            </button>
          </div>
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
                      <span>{operacion.fondo_nombre}</span>
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
                <span
                  className={claseEstado(
                    operacionDetalle.estado_operacion === "ANULADA"
                      ? "SIN_SOBRANTE"
                      : operacionDetalle.estado_seguimiento,
                  )}
                >
                  Operación {operacionDetalle.estado_operacion.toLowerCase()}
                </span>
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
                    <div><dt>Beneficiario</dt><dd>{detalle.beneficiario_nombre ? formatearNombrePropio(detalle.beneficiario_nombre) : "No aplica"}</dd></div>
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
            {operacionDetalle.correcciones.length > 0 ? (
              <div className={styles.correctionHistory}>
                <h3>Correcciones registradas</h3>
                {operacionDetalle.correcciones.map((correccion) => (
                  <article key={correccion.id}>
                    <div>
                      <strong>{correccion.referencia_sistema}</strong>
                      <span>
                        {correccion.tipo === "ANULACION"
                          ? "Anulación"
                          : "Ajuste"}{" "}
                        · {FECHA.format(new Date(correccion.registrado_en))}
                      </span>
                      <span>
                        {correccion.motivo} ·{" "}
                        {correccion.registrado_por_nombre}
                      </span>
                      {correccion.tipo === "AJUSTE" &&
                      correccion.pendiente_anterior != null &&
                      correccion.pendiente_nuevo != null ? (
                        <span>
                          Pendiente: {MONEDA.format(correccion.pendiente_anterior)} → {MONEDA.format(correccion.pendiente_nuevo)}
                        </span>
                      ) : null}
                    </div>
                    <strong>
                      {correccion.valor
                        ? `${correccion.direccion === "INGRESO" ? "+" : "-"} ${MONEDA.format(correccion.valor)}`
                        : "Sin compensación"}
                    </strong>
                  </article>
                ))}
              </div>
            ) : null}
            {operacionDetalle.valor_pendiente_reintegro > 0 &&
            operacionDetalle.estado_operacion !== "ANULADA" ? (
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
                <SelectorSoporteConCamara
                  id="soporte-reingreso"
                  titulo="Soporte"
                  archivo={soporteReingreso}
                  onChange={setSoporteReingreso}
                  required
                />
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
            {operacionDetalle.estado_operacion !== "ANULADA" ? (
              <form
                className={styles.correctionForm}
                onSubmit={registrarCorreccion}
              >
                <div className={styles.correctionIntro}>
                  <span className={styles.correctionEyebrow}>
                    Corrección financiera
                  </span>
                  <h3>Registrar ajuste</h3>
                  <p>
                    Registra una diferencia del retiro mediante un movimiento
                    compensatorio, sin modificar los pagos anteriores.
                  </p>
                </div>
                <label>
                  <span>Tipo de compensación *</span>
                  <select
                    value={direccionCorreccion}
                    onChange={(event) =>
                      setDireccionCorreccion(
                        event.target.value as "INGRESO" | "EGRESO",
                      )
                    }
                  >
                    <option value="INGRESO">Ingreso al fondo</option>
                    <option value="EGRESO">Egreso del fondo</option>
                  </select>
                  <small>
                    {direccionCorreccion === "INGRESO"
                      ? "El retiro real fue menor y reduce el saldo pendiente."
                      : "El retiro real fue mayor y aumenta el saldo pendiente."}
                  </small>
                </label>
                <label>
                  <span>Valor del ajuste *</span>
                  <input
                    inputMode="numeric"
                    placeholder="$ 0"
                    type="text"
                    value={valorCorreccion}
                    onChange={(event) =>
                      setValorCorreccion(
                        formatearValorEntrada(event.target.value),
                      )
                    }
                  />
                  <small>Valor de la diferencia que se compensará.</small>
                </label>
                <label className={styles.fullWidth}>
                  <span>Motivo *</span>
                  <input
                    maxLength={250}
                    placeholder="Ej. Diferencia entre el retiro registrado y el valor real"
                    required
                    type="text"
                    value={motivoCorreccion}
                    onChange={(event) =>
                      setMotivoCorreccion(event.target.value)
                    }
                  />
                </label>
                <label className={styles.fullWidth}>
                  <span>Observación</span>
                  <textarea
                    placeholder="Agrega contexto adicional si es necesario"
                    rows={2}
                    value={observacionCorreccion}
                    onChange={(event) =>
                      setObservacionCorreccion(event.target.value)
                    }
                  />
                </label>
                {mensajeCorreccion ? (
                  <p
                    className={
                      errorCorreccion
                        ? styles.formError
                        : styles.formSuccess
                    }
                  >
                    {mensajeCorreccion}
                  </p>
                ) : null}
                <div className={styles.correctionActions}>
                  <span>El ajuste quedará registrado en el historial.</span>
                  <button
                    disabled={registrandoCorreccion}
                    type="submit"
                  >
                    {registrandoCorreccion
                      ? "Registrando..."
                      : "Registrar ajuste"}
                  </button>
                </div>
              </form>
            ) : null}
          </section>
        </div>
      ) : null}
    </section>
  );
}
