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

              const saldoProyectado =
                proyecto.saldo_disponible -
                valorSeleccionado;

              return (
                <article
                  key={proyecto.fondo_id}
                  className={styles.projectBlock}
                >
                  <div className={styles.projectHeader}>
                    <h3 className={styles.projectTitle}>
                      Proyecto{" "}
                      {proyecto.proyecto_base_nombre}
                    </h3>

                    <div
                      className={styles.projectSummary}
                    >
                      <div className={styles.summaryCard}>
                        <span
                          className={styles.summaryLabel}
                        >
                          Saldo actual
                        </span>

                        <strong
                          className={styles.summaryValue}
                        >
                          {formatearMoneda(
                            proyecto.saldo_actual,
                          )}
                        </strong>
                      </div>

                      <div className={styles.summaryCard}>
                        <span
                          className={styles.summaryLabel}
                        >
                          Reservas
                        </span>

                        <strong
                          className={styles.summaryValue}
                        >
                          {formatearMoneda(
                            proyecto.reservas_existentes,
                          )}
                        </strong>
                      </div>

                      <div className={styles.summaryCard}>
                        <span
                          className={styles.summaryLabel}
                        >
                          Saldo disponible
                        </span>

                        <strong
                          className={styles.summaryValue}
                        >
                          {formatearMoneda(
                            proyecto.saldo_disponible,
                          )}
                        </strong>
                      </div>

                      <div className={styles.summaryCard}>
                        <span
                          className={styles.summaryLabel}
                        >
                          Valor pendiente
                        </span>

                        <strong
                          className={styles.summaryValue}
                        >
                          {formatearMoneda(
                            valorSeleccionado,
                          )}
                        </strong>
                      </div>

                      <div className={styles.summaryCard}>
                        <span
                          className={styles.summaryLabel}
                        >
                          Saldo proyectado
                        </span>

                        <strong
                          className={styles.summaryValue}
                        >
                          {formatearMoneda(
                            saldoProyectado,
                          )}
                        </strong>
                      </div>
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