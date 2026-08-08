"use client";

import type { UsuarioSesion } from "@/modules/auth/auth.types";
import type {
  AprobarSolicitudesNivel1Data,
  AprobarSolicitudesNivel2Data,
  ConsultarAprobacionesNivel1Data,
  ConsultarAprobacionesNivel2Data,
  ProyectoPendienteAprobacionNivel1,
  ProyectoPendienteAprobacionNivel2,
  SolicitudPagoListado,
  SolicitudesPagoApiResponse,
} from "@/modules/solicitudes-pago/solicitudes-pago.types";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import SolicitudesAprobacionList from "./SolicitudesAprobacionList";
import styles from "./AprobacionesManager.module.css";

type NivelAprobacion = 1 | 2;

type ProyectoPendienteAprobacion =
  | ProyectoPendienteAprobacionNivel1
  | ProyectoPendienteAprobacionNivel2;

type ConsultarAprobacionesData =
  | ConsultarAprobacionesNivel1Data
  | ConsultarAprobacionesNivel2Data;

type AprobarSolicitudesData =
  | AprobarSolicitudesNivel1Data
  | AprobarSolicitudesNivel2Data;

type AprobacionesManagerProps = {
  usuario: UsuarioSesion;
  nivel: NivelAprobacion;
};

type EstadoCarga =
  | "INICIAL"
  | "CARGANDO"
  | "LISTO"
  | "ERROR";

const FORMATEADOR_MONEDA = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

function formatearMoneda(valor: number): string {
  return FORMATEADOR_MONEDA.format(valor);
}

export function calcularSaldoProyectadoAprobacion(
  nivel: NivelAprobacion,
  saldoActual: number,
  saldoDisponible: number,
  valorSeleccionado: number,
  reservaRestante: number,
) {
  return nivel === 1
    ? saldoDisponible - valorSeleccionado
    : saldoActual - valorSeleccionado - reservaRestante;
}

export function calcularReservaRestanteNivel2(
  reservasExistentes: number,
  valorSeleccionado: number,
) {
  return Math.max(0, reservasExistentes - valorSeleccionado);
}

export function calcularSaldoTrasPagarSeleccion(
  saldoActual: number,
  valorSeleccionado: number,
) {
  return saldoActual - valorSeleccionado;
}

export default function AprobacionesManager({
  usuario,
  nivel,
}: AprobacionesManagerProps) {
  const [proyectos, setProyectos] = useState<
    ProyectoPendienteAprobacion[]
  >([]);  
  
  const [idsSeleccionados, setIdsSeleccionados] = useState<
    Set<string>
  >(new Set());

  const [estadoCarga, setEstadoCarga] =
    useState<EstadoCarga>("INICIAL");

  const [mensajeError, setMensajeError] = useState("");
  const [mensajeExito, setMensajeExito] = useState("");
  const [aprobando, setAprobando] = useState(false);
  const [solicitudesDevolucion, setSolicitudesDevolucion] =
    useState<SolicitudPagoListado[]>([]);
  const [motivoDevolucion, setMotivoDevolucion] = useState("");
  const [devolviendo, setDevolviendo] = useState(false);
  const [errorDevolucion, setErrorDevolucion] = useState("");
  const [solicitudesAnulacion, setSolicitudesAnulacion] =
    useState<SolicitudPagoListado[]>([]);
  const [motivoAnulacion, setMotivoAnulacion] = useState("");
  const [anulando, setAnulando] = useState(false);
  const [errorAnulacion, setErrorAnulacion] = useState("");
  const [solicitudDetalle, setSolicitudDetalle] =
    useState<SolicitudPagoListado | null>(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);

  const permisoRequerido =
    nivel === 1
      ? "APROBAR_NIVEL_1"
      : "APROBAR_NIVEL_2";

  const endpointAprobacion =
    nivel === 1
      ? "/api/v1/solicitudes-pago/aprobar-nivel-1"
      : "/api/v1/solicitudes-pago/aprobar-nivel-2";

  const puedeAprobar =
    usuario.permisos.includes(permisoRequerido);

  const nombreNivel = `nivel ${nivel}`;

  const mensajeSinPermiso =
    `No tienes permiso para aprobar solicitudes en ${nombreNivel}.`;

const mensajeSinSolicitudes =
  `No existen solicitudes pendientes de aprobación en ${nombreNivel}.`;

  const solicitudes = useMemo(
    () =>
      proyectos.flatMap(
        (proyecto) => proyecto.solicitudes,
      ),
    [proyectos],
  );

  const cargarSolicitudes = useCallback(async () => {
    setEstadoCarga("CARGANDO");
    setMensajeError("");

    try {
      const response = await fetch(
        endpointAprobacion,
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        },
      );

      const body =
        (await response.json()) as SolicitudesPagoApiResponse<ConsultarAprobacionesData>;

      if (!response.ok || !body.ok) {
        throw new Error(
          body.message ??
            "No fue posible consultar las solicitudes pendientes.",
        );
      }

      const proyectosPendientes =
        body.data?.proyectos ?? [];

      setProyectos(proyectosPendientes);
      setIdsSeleccionados(new Set());
      setEstadoCarga("LISTO");
    } catch (error) {
      const mensaje =
        error instanceof Error
          ? error.message
          : "No fue posible consultar las solicitudes pendientes.";

      setProyectos([]);
      setIdsSeleccionados(new Set());
      setMensajeError(mensaje);
      setEstadoCarga("ERROR");
    }
  }, [endpointAprobacion]);

  useEffect(() => {
    if (!puedeAprobar) {
      return;
    }

    const tareaCarga = window.setTimeout(() => {
      void cargarSolicitudes();
    }, 0);

    return () => {
      window.clearTimeout(tareaCarga);
    };
  }, [cargarSolicitudes, puedeAprobar]);

  useEffect(() => {
    if (!solicitudDetalle) return;

    function cerrarConEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setSolicitudDetalle(null);
    }

    window.addEventListener("keydown", cerrarConEscape);
    return () => window.removeEventListener("keydown", cerrarConEscape);
  }, [solicitudDetalle]);

  const solicitudesSeleccionadas = useMemo(
    () =>
      solicitudes.filter((solicitud) =>
        idsSeleccionados.has(solicitud.id),
      ),
    [idsSeleccionados, solicitudes],
  );

  const valorTotalSeleccionado = useMemo(
    () =>
      solicitudesSeleccionadas.reduce(
        (total, solicitud) =>
          total + solicitud.valor_neto,
        0,
      ),
    [solicitudesSeleccionadas],
  );

  function obtenerValorSeleccionadoProyecto(
    proyecto: ProyectoPendienteAprobacion,
  ): number {
    return proyecto.solicitudes.reduce(
      (total, solicitud) =>
        idsSeleccionados.has(solicitud.id)
          ? total + solicitud.valor_neto
          : total,
      0,
    );
  }

  function alternarSolicitud(solicitudId: string) {
    setMensajeExito("");
    setMensajeError("");

    setIdsSeleccionados((idsActuales) => {
      const nuevosIds = new Set(idsActuales);

      if (nuevosIds.has(solicitudId)) {
        nuevosIds.delete(solicitudId);
      } else {
        nuevosIds.add(solicitudId);
      }

      return nuevosIds;
    });
  }

  function alternarSolicitudesProyecto(
    proyecto: ProyectoPendienteAprobacion,
  ) {
    setMensajeExito("");
    setMensajeError("");

    setIdsSeleccionados((idsActuales) => {
      const todasSeleccionadas =
        proyecto.solicitudes.length > 0 &&
        proyecto.solicitudes.every((solicitud) =>
          idsActuales.has(solicitud.id),
        );

      const nuevosIds = new Set(idsActuales);

      for (const solicitud of proyecto.solicitudes) {
        if (todasSeleccionadas) {
          nuevosIds.delete(solicitud.id);
        } else {
          nuevosIds.add(solicitud.id);
        }
      }

      return nuevosIds;
    });
  }

  async function aprobarSeleccionadas() {
    if (!puedeAprobar || aprobando) {
      return;
    }

    const solicitudIds = Array.from(idsSeleccionados);

    if (solicitudIds.length === 0) {
      setMensajeError(
        "Selecciona al menos una solicitud para aprobar.",
      );
      return;
    }

    setAprobando(true);
    setMensajeError("");
    setMensajeExito("");

    try {
      const response = await fetch(
        endpointAprobacion,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            solicitud_ids: solicitudIds,
          }),
        },
      );

      const body =
        (await response.json()) as SolicitudesPagoApiResponse<AprobarSolicitudesData>;

      if (!response.ok || !body.ok) {
        throw new Error(
          body.message ??
            "No fue posible aprobar las solicitudes seleccionadas.",
        );
      }

      const cantidadAprobada =
        body.data?.cantidad_aprobada ??
        solicitudIds.length;

      setMensajeExito(
        cantidadAprobada === 1
          ? `La solicitud fue aprobada correctamente en ${nombreNivel}.`
          : `${cantidadAprobada} solicitudes fueron aprobadas correctamente en ${nombreNivel}.`,
      );

      await cargarSolicitudes();
    } catch (error) {
      const mensaje =
        error instanceof Error
          ? error.message
          : "No fue posible aprobar las solicitudes seleccionadas.";

      setMensajeError(mensaje);
    } finally {
      setAprobando(false);
    }
  }

  async function devolverSolicitud() {
    if (solicitudesDevolucion.length === 0 || devolviendo) return;

    const motivo = motivoDevolucion.trim();
    if (motivo.length < 5) {
      setErrorDevolucion("Escribe un motivo de devolución de al menos 5 caracteres.");
      return;
    }

    setDevolviendo(true);
    setErrorDevolucion("");
    setMensajeError("");
    setMensajeExito("");

    try {
      const esGrupal = solicitudesDevolucion.length > 1;
      const response = await fetch(
        esGrupal
          ? "/api/v1/solicitudes-pago/devolver"
          : `/api/v1/solicitudes-pago/${solicitudesDevolucion[0].id}/devolver`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            esGrupal
              ? {
                  motivo,
                  solicitud_ids: solicitudesDevolucion.map((solicitud) => solicitud.id),
                }
              : { motivo },
          ),
        },
      );
      const body = (await response.json()) as SolicitudesPagoApiResponse<unknown>;

      if (!response.ok || !body.ok) {
        throw new Error(body.message ?? "No fue posible devolver la solicitud.");
      }

      const cantidadDevuelta = solicitudesDevolucion.length;
      setSolicitudesDevolucion([]);
      setMotivoDevolucion("");
      setMensajeExito(
        cantidadDevuelta === 1
          ? nivel === 1
            ? "Solicitud devuelta al solicitante para corrección."
            : "Solicitud devuelta al aprobador de nivel 1."
          : `${cantidadDevuelta} solicitudes fueron devueltas correctamente.`,
      );
      await cargarSolicitudes();
    } catch (error) {
      setErrorDevolucion(error instanceof Error ? error.message : "No fue posible devolver la solicitud.");
    } finally {
      setDevolviendo(false);
    }
  }

  async function anularSolicitudes() {
    if (solicitudesAnulacion.length === 0 || anulando) return;

    const motivo = motivoAnulacion.trim();
    if (motivo.length < 5) {
      setErrorAnulacion("Escribe un motivo de anulación de al menos 5 caracteres.");
      return;
    }

    setAnulando(true);
    setErrorAnulacion("");
    setMensajeError("");
    setMensajeExito("");

    try {
      const response = await fetch("/api/v1/solicitudes-pago/anular", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          motivo,
          solicitud_ids: solicitudesAnulacion.map((solicitud) => solicitud.id),
        }),
      });
      const body = (await response.json()) as SolicitudesPagoApiResponse<unknown>;

      if (!response.ok || !body.ok) {
        throw new Error(body.message ?? "No fue posible anular las solicitudes.");
      }

      const cantidadAnulada = solicitudesAnulacion.length;
      setSolicitudesAnulacion([]);
      setMotivoAnulacion("");
      setMensajeExito(
        cantidadAnulada === 1
          ? "Solicitud anulada correctamente."
          : `${cantidadAnulada} solicitudes fueron anuladas correctamente.`,
      );
      await cargarSolicitudes();
    } catch (error) {
      setErrorAnulacion(
        error instanceof Error ? error.message : "No fue posible anular las solicitudes.",
      );
    } finally {
      setAnulando(false);
    }
  }

  async function verDetalleSolicitud(solicitud: SolicitudPagoListado) {
    setSolicitudDetalle(solicitud);
    setCargandoDetalle(true);
    setMensajeError("");

    try {
      const response = await fetch(`/api/v1/solicitudes-pago/${solicitud.id}`, {
        credentials: "include",
        cache: "no-store",
      });
      const body = (await response.json()) as SolicitudesPagoApiResponse<{
        solicitud: SolicitudPagoListado;
      }>;

      if (!response.ok || !body.ok || !body.data?.solicitud) {
        throw new Error(body.message ?? "No fue posible consultar el detalle.");
      }

      setSolicitudDetalle(body.data.solicitud);
    } catch (error) {
      setMensajeError(error instanceof Error ? error.message : "No fue posible consultar el detalle.");
    } finally {
      setCargandoDetalle(false);
    }
  }

  if (!puedeAprobar) {
    return (
      <section className={styles.panel}>
        <div className={styles.alertaError}>
          {mensajeSinPermiso}
        </div>
      </section>
    );
  }

  return (
    <section className={styles.panel}>
      <div className={styles.toolbar}>
        <div>
          <h2 className={styles.subtitle}>
            Solicitudes pendientes
          </h2>

          <p className={styles.helper}>
            Selecciona las solicitudes que deseas aprobar y
            revisa el valor total antes de continuar.
          </p>
        </div>

        <button
          type="button"
          className={styles.refreshButton}
          onClick={() => void cargarSolicitudes()}
          disabled={
            estadoCarga === "CARGANDO" || aprobando
          }
        >
          Actualizar
        </button>
      </div>

      {(!puedeAprobar || mensajeError) && (
        <div
          className={styles.alertaError}
          role="alert"
        >
          {mensajeError}
        </div>
      )}

      {mensajeExito && (
        <div
          className={styles.alertaExito}
          role="status"
        >
          {mensajeExito}
        </div>
      )}

      {estadoCarga === "CARGANDO" && (
        <div className={styles.estado}>
          Consultando solicitudes pendientes...
        </div>
      )}

      {estadoCarga === "LISTO" &&
        solicitudes.length === 0 && (
        <div className={styles.estado}>
          {mensajeSinSolicitudes}
        </div>
        )}

      {estadoCarga === "LISTO" &&
        solicitudes.length > 0 && (
          <>
            <div className={styles.selectionSummary}>
              <div className={styles.summaryValues}>
                <span>
                  Seleccionadas:{" "}
                  <strong>
                    {solicitudesSeleccionadas.length}
                  </strong>
                </span>

                <span>
                  Total:{" "}
                  <strong>
                    {formatearMoneda(
                      valorTotalSeleccionado,
                    )}
                  </strong>
                </span>
              </div>
            </div>

            {proyectos.map((proyecto) => {
              const valorSeleccionado =
                obtenerValorSeleccionadoProyecto(
                  proyecto,
                );
              const valorNuevoPorReservar =
                proyecto.solicitudes.reduce(
                  (total, solicitud) =>
                    idsSeleccionados.has(solicitud.id) &&
                    solicitud.estado_actual === "PENDIENTE_APROBADOR_1"
                      ? total + solicitud.valor_neto
                      : total,
                  0,
                );
              const cantidadSeleccionadaProyecto =
                proyecto.solicitudes.filter((solicitud) =>
                  idsSeleccionados.has(solicitud.id),
                ).length;
              const reservaRestante =
                calcularReservaRestanteNivel2(
                  proyecto.reservas_existentes,
                  valorSeleccionado,
                );
              const saldoTrasPagarSeleccion =
                calcularSaldoTrasPagarSeleccion(
                  proyecto.saldo_actual,
                  valorSeleccionado,
                );

              const saldoProyectado =
                calcularSaldoProyectadoAprobacion(
                  nivel,
                  proyecto.saldo_actual,
                  proyecto.saldo_disponible,
                  nivel === 1
                    ? valorNuevoPorReservar
                    : valorSeleccionado,
                  reservaRestante,
                );

              return (
                <article
                  key={proyecto.fondo_id}
                  className={styles.projectBlock}
                >
                  <div className={styles.projectHeader}>
                    <h3 className={styles.projectTitle}>
                      {proyecto.proyecto_base_nombre}
                    </h3>

                    <div
                      className={styles.projectSummary}
                    >
                      <section className={styles.summarySection}>
                        <span className={styles.summarySectionTitle}>
                          Estado presupuestal
                        </span>
                        <div className={styles.summaryCards}>
                          <div className={styles.summaryCard}>
                            <span className={styles.summaryLabel}>Saldo actual</span>
                            <strong className={styles.summaryValue}>{formatearMoneda(proyecto.saldo_actual)}</strong>
                            <small className={styles.summaryDescription}>
                              Saldo registrado actualmente en el fondo.
                            </small>
                          </div>
                          <div className={styles.summaryCard}>
                            <span className={styles.summaryLabel}>
                              {nivel === 1
                                ? "Reservado para pagos por terminar de aprobar"
                                : "Total reservado"}
                            </span>
                            <strong className={styles.summaryValue}>{formatearMoneda(proyecto.reservas_existentes)}</strong>
                            <small className={styles.summaryDescription}>
                              {nivel === 1
                                ? "Incluye reservas creadas en nivel 1 aún pendientes de pago."
                                : "Incluye solicitudes de esta bandeja y compromisos que ya avanzaron hacia pago."}
                            </small>
                          </div>
                          <div className={styles.summaryCard}>
                            <span className={styles.summaryLabel}>
                              {nivel === 1
                                ? "Saldo disponible sin comprometer"
                                : "Saldo libre tras todas las reservas"}
                            </span>
                            <strong className={styles.summaryValue}>{formatearMoneda(proyecto.saldo_disponible)}</strong>
                            <small className={styles.summaryDescription}>
                              Saldo actual menos todas las reservas vigentes.
                            </small>
                          </div>
                        </div>
                      </section>

                      <section className={styles.simulationSection}>
                        <span className={styles.summarySectionTitle}>
                          Simulación de la selección
                        </span>
                        <div className={styles.summaryCards}>
                          <div className={styles.summaryCard}>
                            <span className={styles.summaryLabel}>
                              {nivel === 2
                                ? `Seleccionado ahora (${cantidadSeleccionadaProyecto})`
                                : "Seleccionado para aprobar"}
                            </span>
                            <strong className={styles.summaryValue}>{formatearMoneda(valorSeleccionado)}</strong>
                            <small className={styles.summaryDescription}>
                              Suma de las solicitudes marcadas en la lista.
                            </small>
                          </div>
                          {nivel === 2 ? (
                            <>
                              <div className={styles.summaryCard}>
                                <span className={styles.summaryLabel}>
                                  Saldo real tras pagar la selección
                                </span>
                                <strong className={styles.summaryValue}>
                                  {valorSeleccionado > 0
                                    ? formatearMoneda(saldoTrasPagarSeleccion)
                                    : "—"}
                                </strong>
                                <small className={styles.summaryDescription}>
                                  Saldo contable después de ejecutar únicamente los pagos seleccionados.
                                </small>
                              </div>
                              <div className={styles.summaryCard}>
                                <span className={styles.summaryLabel}>
                                  Reserva que permanece
                                </span>
                                <strong className={styles.summaryValue}>
                                  {formatearMoneda(reservaRestante)}
                                </strong>
                                <small className={styles.summaryDescription}>
                                  Compromisos que siguen reservados después de esta selección.
                                </small>
                              </div>
                            </>
                          ) : null}
                          <div className={styles.projectedCard}>
                            <span className={styles.summaryLabel}>
                              {nivel === 1
                                ? "Disponible si se aprueba"
                                : "Disponible sin comprometer después del pago"}
                            </span>
                            <strong className={styles.projectedValue}>
                              {valorSeleccionado > 0 ? formatearMoneda(saldoProyectado) : "—"}
                            </strong>
                            <small className={styles.summaryDescription}>
                              {nivel === 1
                                ? "Considera las reservas vigentes y la selección actual."
                                : "Saldo libre después del pago y de conservar la reserva restante."}
                            </small>
                          </div>
                        </div>
                        <p className={styles.simulationHelp}>
                          {nivel === 1
                            ? "Incluye los compromisos existentes y la selección actual."
                            : "Separa el saldo contable tras el pago del dinero que continúa disponible sin comprometer."}
                        </p>
                      </section>
                    </div>
                  </div>

                  <SolicitudesAprobacionList
                    solicitudes={proyecto.solicitudes}
                    idsSeleccionados={
                      idsSeleccionados
                    }
                    deshabilitado={aprobando}
                    onCambiarSeleccion={
                      alternarSolicitud
                    }
                    onCambiarSeleccionTodas={() =>
                      alternarSolicitudesProyecto(
                        proyecto,
                      )
                    }
                    onDevolver={(solicitud) => {
                      setSolicitudesDevolucion([solicitud]);
                      setMotivoDevolucion("");
                      setErrorDevolucion("");
                      setSolicitudDetalle(null);
                      setMensajeError("");
                    }}
                    onVerDetalle={(solicitud) => void verDetalleSolicitud(solicitud)}
                  />
                </article>
              );
            })}

            {solicitudesDevolucion.length > 0 ? (
              <div className={styles.modalBackdrop} role="presentation">
                <form
                  className={styles.returnDialog}
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="return-title"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void devolverSolicitud();
                  }}
                >
                  <h2 id="return-title">
                    {solicitudesDevolucion.length === 1
                      ? "Devolver solicitud"
                      : "Devolver solicitudes"}
                  </h2>
                  <p>
                    {solicitudesDevolucion.length === 1
                      ? solicitudesDevolucion[0].numero_solicitud
                      : `${solicitudesDevolucion.length} solicitudes seleccionadas`}. {nivel === 1
                      ? "Regresará al solicitante para que pueda corregirla."
                      : "Regresará al aprobador de nivel 1 conservando su reserva."}
                  </p>
                  <label>
                    <span>Motivo de devolución *</span>
                    <textarea
                      autoFocus
                      maxLength={500}
                      rows={4}
                      value={motivoDevolucion}
                      onChange={(event) => setMotivoDevolucion(event.target.value)}
                    />
                    <small className={styles.returnHelper}>
                      Escribe al menos 5 caracteres · {motivoDevolucion.length}/500
                    </small>
                  </label>
                  {errorDevolucion ? (
                    <div className={styles.returnError} role="alert">
                      <strong>No se pudo completar la devolución</strong>
                      <span>{errorDevolucion}</span>
                    </div>
                  ) : null}
                  <div className={styles.dialogActions}>
                    <button
                      className={styles.refreshButton}
                      disabled={devolviendo}
                      type="button"
                      onClick={() => {
                        setSolicitudesDevolucion([]);
                        setErrorDevolucion("");
                      }}
                    >
                      Cancelar
                    </button>
                    <button
                      className={styles.returnConfirmButton}
                      disabled={devolviendo}
                      type="submit"
                    >
                      {devolviendo ? "Devolviendo..." : "Confirmar devolución"}
                    </button>
                  </div>
                </form>
              </div>
            ) : null}

            {nivel === 1 && solicitudesAnulacion.length > 0 ? (
              <div className={styles.modalBackdrop} role="presentation">
                <form
                  className={styles.returnDialog}
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="annul-title"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void anularSolicitudes();
                  }}
                >
                  <h2 id="annul-title">
                    {solicitudesAnulacion.length === 1
                      ? "Anular solicitud"
                      : "Anular solicitudes"}
                  </h2>
                  <p>
                    Esta acción es definitiva. Las solicitudes seleccionadas no continuarán en el flujo de aprobación.
                  </p>
                  <label>
                    <span>Motivo de anulación *</span>
                    <textarea
                      autoFocus
                      maxLength={500}
                      rows={4}
                      value={motivoAnulacion}
                      onChange={(event) => setMotivoAnulacion(event.target.value)}
                    />
                    <small className={styles.returnHelper}>
                      Escribe al menos 5 caracteres · {motivoAnulacion.length}/500
                    </small>
                  </label>
                  {errorAnulacion ? (
                    <div className={styles.returnError} role="alert">
                      <strong>No se pudo completar la anulación</strong>
                      <span>{errorAnulacion}</span>
                    </div>
                  ) : null}
                  <div className={styles.dialogActions}>
                    <button
                      className={styles.refreshButton}
                      disabled={anulando}
                      type="button"
                      onClick={() => {
                        setSolicitudesAnulacion([]);
                        setErrorAnulacion("");
                      }}
                    >
                      Cancelar
                    </button>
                    <button
                      className={styles.annulConfirmButton}
                      disabled={anulando}
                      type="submit"
                    >
                      {anulando ? "Anulando..." : "Confirmar anulación"}
                    </button>
                  </div>
                </form>
              </div>
            ) : null}

            {solicitudDetalle ? (
              <div
                className={styles.modalBackdrop}
                role="presentation"
                onMouseDown={(event) => {
                  if (event.target === event.currentTarget) setSolicitudDetalle(null);
                }}
              >
                <section className={styles.detailDialog} role="dialog" aria-modal="true" aria-labelledby="detail-title">
                  <div className={styles.detailHeader}>
                    <div>
                      <span className={styles.detailEyebrow}>Detalle de solicitud</span>
                      <h2 id="detail-title">{solicitudDetalle.numero_solicitud ?? "Solicitud sin número"}</h2>
                      <div className={styles.detailHeaderMeta}>
                        <span className={styles.detailStatus}>
                          {solicitudDetalle.estado_actual.replaceAll("_", " ")}
                        </span>
                        <span>{solicitudDetalle.tipo_solicitud.replaceAll("_", " ")}</span>
                      </div>
                    </div>
                    <button
                      className={styles.closeButton}
                      type="button"
                      aria-label="Cerrar detalle de la solicitud"
                      onClick={() => setSolicitudDetalle(null)}
                    >
                      <span aria-hidden="true">×</span>
                    </button>
                  </div>

                  {cargandoDetalle ? (
                    <div className={styles.detailLoading}>Actualizando información…</div>
                  ) : null}

                  <div className={styles.detailSection}>
                    <h3>Información general</h3>
                    <dl className={styles.detailGrid}>
                      <div><dt>Proyecto</dt><dd>{solicitudDetalle.proyecto_base?.nombre ?? "—"}</dd></div>
                      <div><dt>Centro de costo</dt><dd>{solicitudDetalle.centro_costo?.nombre ?? "—"}</dd></div>
                      <div><dt>Beneficiario</dt><dd>{solicitudDetalle.beneficiario?.nombre ?? "—"}</dd></div>
                      <div><dt>Medio de pago</dt><dd>{solicitudDetalle.medio_pago?.replaceAll("_", " ") ?? "—"}</dd></div>
                      {solicitudDetalle.categoria_gasto ? <div><dt>Categoría de gasto</dt><dd>{solicitudDetalle.categoria_gasto.replaceAll("_", " ")}</dd></div> : null}
                      {solicitudDetalle.categoria_reembolso ? <div><dt>Categoría de reembolso</dt><dd>{solicitudDetalle.categoria_reembolso.replaceAll("_", " ")}</dd></div> : null}
                      {solicitudDetalle.concepto_nomina ? <div><dt>Concepto de nómina</dt><dd>{solicitudDetalle.concepto_nomina.replaceAll("_", " ")}</dd></div> : null}
                      {solicitudDetalle.periodo_nomina ? <div><dt>Periodo de nómina</dt><dd>{solicitudDetalle.periodo_nomina}</dd></div> : null}
                      {solicitudDetalle.tipo_impuesto ? <div><dt>Tipo de impuesto</dt><dd>{solicitudDetalle.tipo_impuesto.replaceAll("_", " ")}</dd></div> : null}
                      {solicitudDetalle.periodo_impuesto ? <div><dt>Periodo de impuesto</dt><dd>{solicitudDetalle.periodo_impuesto}</dd></div> : null}
                      <div><dt>Solicitante</dt><dd>{solicitudDetalle.creador?.nombre ?? "—"}</dd></div>
                      <div className={styles.detailWide}><dt>Descripción</dt><dd>{solicitudDetalle.descripcion}</dd></div>
                    </dl>
                  </div>

                  <div className={styles.detailSection}>
                    <h3>Resumen de valores</h3>
                    <dl className={`${styles.detailGrid} ${styles.valuesGrid}`}>
                      <div><dt>Valor bruto</dt><dd>{formatearMoneda(solicitudDetalle.valor_bruto)}</dd></div>
                      <div><dt>Impuestos y retenciones</dt><dd>{formatearMoneda(solicitudDetalle.valor_retenciones)}</dd></div>
                      <div><dt>Descuentos</dt><dd>{formatearMoneda(solicitudDetalle.valor_descuentos)}</dd></div>
                      <div className={styles.detailNet}><dt>Valor neto a pagar</dt><dd>{formatearMoneda(solicitudDetalle.valor_neto)}</dd></div>
                    </dl>
                  </div>

                  {solicitudDetalle.ultima_devolucion ? (
                    <div className={styles.returnReason}>
                      <strong>Último motivo de devolución</strong>
                      <p>{solicitudDetalle.ultima_devolucion.motivo}</p>
                    </div>
                  ) : null}
                </section>
              </div>
            ) : null}

            <div className={styles.actions}>
              {nivel === 1 ? (
                <button
                  type="button"
                  className={styles.annulSelectedButton}
                  onClick={() => {
                    setSolicitudesAnulacion(solicitudesSeleccionadas);
                    setMotivoAnulacion("");
                    setErrorAnulacion("");
                    setSolicitudDetalle(null);
                    setMensajeError("");
                  }}
                  disabled={aprobando || devolviendo || anulando || idsSeleccionados.size === 0}
                >
                  {idsSeleccionados.size === 1
                    ? "Anular solicitud"
                    : `Anular ${idsSeleccionados.size} solicitudes`}
                </button>
              ) : null}
              <button
                type="button"
                className={styles.returnSelectedButton}
                onClick={() => {
                  setSolicitudesDevolucion(solicitudesSeleccionadas);
                  setMotivoDevolucion("");
                  setErrorDevolucion("");
                  setSolicitudDetalle(null);
                  setMensajeError("");
                }}
                disabled={aprobando || devolviendo || idsSeleccionados.size === 0}
              >
                {idsSeleccionados.size === 1
                  ? "Devolver solicitud"
                  : `Devolver ${idsSeleccionados.size} solicitudes`}
              </button>
              <button
                type="button"
                className={styles.approveButton}
                onClick={() =>
                  void aprobarSeleccionadas()
                }
                disabled={
                  aprobando ||
                  idsSeleccionados.size === 0
                }
              >
                {aprobando
                  ? "Aprobando..."
                  : idsSeleccionados.size === 1
                    ? "Aprobar solicitud"
                    : `Aprobar ${idsSeleccionados.size} solicitudes`}
              </button>
            </div>
          </>
        )}
    </section>
  );
}
