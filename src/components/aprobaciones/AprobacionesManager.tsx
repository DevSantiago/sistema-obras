"use client";

import type { UsuarioSesion } from "@/modules/auth/auth.types";
import type {
  AprobarSolicitudesNivel1Data,
  AprobarSolicitudesNivel2Data,
  ConsultarAprobacionesNivel1Data,
  ConsultarAprobacionesNivel2Data,
  ProyectoPendienteAprobacionNivel1,
  ProyectoPendienteAprobacionNivel2,
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
                  valorSeleccionado,
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
                  />
                </article>
              );
            })}

            <div className={styles.actions}>
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
