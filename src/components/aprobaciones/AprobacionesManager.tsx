"use client";

import { formatearNombrePropio } from "@/lib/text-format";
import { descargarTablaPdf } from "@/lib/pdf-export";
import { descargarTablaExcel } from "@/lib/excel-export";
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
import HistorialAprobacionesList from "./HistorialAprobacionesList";
import EdicionAprobadorNivel1Form from "./EdicionAprobadorNivel1Form";
import HistorialSolicitud from "@/components/solicitudes-pago/shared/HistorialSolicitud";
import styles from "./AprobacionesManager.module.css";
import {
  formatearEstadoSolicitud,
  formatearTextoDominio,
} from "@/components/solicitudes-pago/solicitudes-pago.utils";

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

type FiltrosProyecto = {
  numeroSolicitud: string;
  centroCostoId: string;
  visiblesEnMovil: boolean;
};

const FILTROS_PROYECTO_INICIALES: FiltrosProyecto = {
  numeroSolicitud: "",
  centroCostoId: "",
  visiblesEnMovil: false,
};

const FORMATEADOR_MONEDA = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

function formatearMoneda(valor: number): string {
  return FORMATEADOR_MONEDA.format(valor);
}

export function ordenarSolicitudesParaExportar(
  solicitudes: SolicitudPagoListado[],
): SolicitudPagoListado[] {
  return [...solicitudes].sort((a, b) => {
    const proyecto = (a.proyecto_base?.nombre ?? "").localeCompare(
      b.proyecto_base?.nombre ?? "",
      "es",
    );
    if (proyecto !== 0) return proyecto;

    const centro = (a.centro_costo?.nombre ?? "").localeCompare(
      b.centro_costo?.nombre ?? "",
      "es",
    );
    if (centro !== 0) return centro;

    return (a.numero_solicitud ?? "").localeCompare(
      b.numero_solicitud ?? "",
      "es",
      { numeric: true },
    );
  });
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

export function calcularDisponibleAntesSeleccionNivel1(
  saldoDisponible: number,
  valorSeleccionado: number,
  valorNuevoPorReservar: number,
) {
  const valorYaReservado = Math.max(
    0,
    valorSeleccionado - valorNuevoPorReservar,
  );

  return saldoDisponible + valorYaReservado;
}

export function filtrarSolicitudesProyecto(
  solicitudes: SolicitudPagoListado[],
  numeroSolicitud: string,
  centroCostoId: string,
) {
  const numeroBuscado = numeroSolicitud.trim().toLocaleLowerCase("es");

  return solicitudes.filter(
    (solicitud) =>
      (!numeroBuscado ||
        solicitud.numero_solicitud
          ?.toLocaleLowerCase("es")
          .includes(numeroBuscado)) &&
      (!centroCostoId || solicitud.centro_costo_id === centroCostoId),
  );
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
  const [solicitudEdicion, setSolicitudEdicion] =
    useState<SolicitudPagoListado | null>(null);
  const [historialAprobaciones, setHistorialAprobaciones] = useState<
    SolicitudPagoListado[]
  >([]);
  const [proyectoExpandidoId, setProyectoExpandidoId] = useState<string | null>(null);
  const [filtrosPorProyecto, setFiltrosPorProyecto] = useState<
    Record<string, FiltrosProyecto>
  >({});
  const [pendientesExpandidas, setPendientesExpandidas] = useState(true);

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

  function actualizarFiltrosProyecto(
    proyectoId: string,
    cambios: Partial<FiltrosProyecto>,
  ) {
    setFiltrosPorProyecto((filtrosActuales) => ({
      ...filtrosActuales,
      [proyectoId]: {
        ...FILTROS_PROYECTO_INICIALES,
        ...filtrosActuales[proyectoId],
        ...cambios,
      },
    }));
  }

  function obtenerSolicitudesSeleccionadasParaExportar() {
    return ordenarSolicitudesParaExportar(
      solicitudes.filter((solicitud) => idsSeleccionados.has(solicitud.id)),
    );
  }

  function exportarPendientesPdf() {
    const filas = obtenerSolicitudesSeleccionadasParaExportar();
    const total = filas.reduce((acumulado, fila) => acumulado + fila.valor_neto, 0);
    descargarTablaPdf({
      titulo: `Solicitudes pendientes de aprobación nivel ${nivel}`,
      nombreArchivo: `aprobaciones-nivel-${nivel}-seleccionadas.pdf`,
      filas,
      filtros: [],
      resumen: [
        `${filas.length} solicitud(es) seleccionada(s)`,
        `Valor total: ${formatearMoneda(total)}`,
      ],
      columnas: [
        { titulo: "Proyecto", ancho: 17, valor: (fila) => fila.proyecto_base?.nombre },
        { titulo: "Centro de costo", ancho: 17, valor: (fila) => fila.centro_costo?.nombre },
        { titulo: "Solicitud", ancho: 19, valor: (fila) => fila.numero_solicitud },
        { titulo: "Beneficiario", ancho: 18, valor: (fila) => fila.beneficiario?.nombre },
        { titulo: "Tipo", ancho: 11, valor: (fila) => formatearTextoDominio(fila.tipo_solicitud) },
        { titulo: "Estado", ancho: 10, valor: (fila) => formatearEstadoSolicitud(fila.estado_actual) },
        { titulo: "Valor neto", ancho: 10, valor: (fila) => formatearMoneda(fila.valor_neto) },
      ],
    });
  }

  async function exportarPendientesExcel() {
    const filas = obtenerSolicitudesSeleccionadasParaExportar();
    const total = filas.reduce((acumulado, fila) => acumulado + fila.valor_neto, 0);
    await descargarTablaExcel({
      nombreArchivo: `aprobaciones-nivel-${nivel}-seleccionadas.xls`,
      nombreHoja: `Aprobaciones nivel ${nivel}`,
      filas,
      resumen: [
        { etiqueta: "Solicitudes seleccionadas", valor: filas.length },
        { etiqueta: "Valor total", valor: total },
      ],
      columnas: [
        { titulo: "Proyecto", ancho: 28, valor: (fila) => fila.proyecto_base?.nombre },
        { titulo: "Centro de costo", ancho: 30, valor: (fila) => fila.centro_costo?.nombre },
        { titulo: "Número de solicitud", ancho: 38, valor: (fila) => fila.numero_solicitud },
        { titulo: "Beneficiario", ancho: 32, valor: (fila) => fila.beneficiario?.nombre },
        { titulo: "Tipo", ancho: 22, valor: (fila) => formatearTextoDominio(fila.tipo_solicitud) },
        { titulo: "Estado", ancho: 22, valor: (fila) => formatearEstadoSolicitud(fila.estado_actual) },
        { titulo: "Valor bruto", ancho: 18, formato: '"$"#,##0', valor: (fila) => fila.valor_bruto },
        { titulo: "Valor neto", ancho: 18, formato: '"$"#,##0', valor: (fila) => fila.valor_neto },
      ],
    });
  }

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
      setProyectoExpandidoId((proyectoActual) =>
        proyectoActual &&
        proyectosPendientes.some(
          (proyecto) => proyecto.fondo_id === proyectoActual,
        )
          ? proyectoActual
          : proyectosPendientes[0]?.fondo_id ?? null,
      );
      setHistorialAprobaciones(body.data?.historial ?? []);
      setIdsSeleccionados(new Set());
      setEstadoCarga("LISTO");
    } catch (error) {
      const mensaje =
        error instanceof Error
          ? error.message
          : "No fue posible consultar las solicitudes pendientes.";

      setProyectos([]);
      setProyectoExpandidoId(null);
      setHistorialAprobaciones([]);
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
          className={styles.accordionToggle}
          aria-label={pendientesExpandidas ? "Contraer solicitudes pendientes" : `Expandir ${solicitudes.length} solicitudes pendientes`}
          aria-expanded={pendientesExpandidas}
          aria-controls={`pendientes-aprobacion-${nivel}`}
          onClick={() => setPendientesExpandidas((expandida) => !expandida)}
        >
          <span aria-hidden="true">{pendientesExpandidas ? "−" : "+"}</span>
        </button>
      </div>

      <div
        id={`pendientes-aprobacion-${nivel}`}
        className={styles.pendingContent}
        hidden={!pendientesExpandidas}
      >

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
              <div className={styles.selectionExportActions}>
                <button
                  type="button"
                  onClick={exportarPendientesPdf}
                  disabled={idsSeleccionados.size === 0}
                >
                  Exportar PDF
                </button>
                <button
                  type="button"
                  onClick={() => void exportarPendientesExcel()}
                  disabled={idsSeleccionados.size === 0}
                >
                  Exportar Excel
                </button>
              </div>
            </div>

            <div className={styles.mobileStickyAction}>
              <div className={styles.mobileStickySummary}>
                <span>
                  {solicitudesSeleccionadas.length} {solicitudesSeleccionadas.length === 1 ? "seleccionada" : "seleccionadas"}
                </span>
                <strong>{formatearMoneda(valorTotalSeleccionado)}</strong>
              </div>
              <button
                type="button"
                className={styles.approveButton}
                onClick={() => void aprobarSeleccionadas()}
                disabled={aprobando || idsSeleccionados.size === 0}
              >
                {aprobando ? "Aprobando..." : `Aprobar (${idsSeleccionados.size})`}
              </button>
            </div>

            {proyectos.map((proyecto) => {
              const filtrosProyecto =
                filtrosPorProyecto[proyecto.fondo_id] ??
                FILTROS_PROYECTO_INICIALES;
              const centrosProyecto = Array.from(
                new Map(
                  proyecto.solicitudes.map((solicitud) => [
                    solicitud.centro_costo_id,
                    solicitud.centro_costo?.nombre ?? "Centro sin nombre",
                  ]),
                ),
                ([id, nombre]) => ({ id, nombre }),
              ).sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
              const solicitudesFiltradas = filtrarSolicitudesProyecto(
                proyecto.solicitudes,
                filtrosProyecto.numeroSolicitud,
                filtrosProyecto.centroCostoId,
              );
              const proyectoExpandido = proyectoExpandidoId === proyecto.fondo_id;
              const cantidadFiltrosActivos = [
                filtrosProyecto.numeroSolicitud,
                filtrosProyecto.centroCostoId,
              ].filter(Boolean).length;
              const valorPendienteProyecto = proyecto.solicitudes.reduce(
                (total, solicitud) => total + solicitud.valor_neto,
                0,
              );
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
              const disponibleAntesSeleccionNivel1 =
                calcularDisponibleAntesSeleccionNivel1(
                  proyecto.saldo_disponible,
                  valorSeleccionado,
                  valorNuevoPorReservar,
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
                  <button
                    type="button"
                    className={styles.projectAccordionHeader}
                    aria-expanded={proyectoExpandido}
                    aria-controls={`proyecto-aprobacion-${nivel}-${proyecto.fondo_id}`}
                    onClick={() =>
                      setProyectoExpandidoId((proyectoActual) =>
                        proyectoActual === proyecto.fondo_id
                          ? null
                          : proyecto.fondo_id,
                      )
                    }
                  >
                    <span className={styles.projectAccordionHeading}>
                      <strong>{proyecto.proyecto_base_nombre}</strong>
                      <span>
                        {proyecto.solicitudes.length}{" "}
                        {proyecto.solicitudes.length === 1
                          ? "solicitud pendiente"
                          : "solicitudes pendientes"}{" "}
                        · {formatearMoneda(valorPendienteProyecto)}
                      </span>
                    </span>
                    {cantidadSeleccionadaProyecto > 0 ? (
                      <span className={styles.projectSelectedBadge}>
                        {cantidadSeleccionadaProyecto} seleccionada{cantidadSeleccionadaProyecto === 1 ? "" : "s"}
                      </span>
                    ) : null}
                    <span className={styles.projectAccordionIcon} aria-hidden="true">
                      {proyectoExpandido ? "−" : "+"}
                    </span>
                  </button>

                  <div
                    id={`proyecto-aprobacion-${nivel}-${proyecto.fondo_id}`}
                    className={styles.projectContent}
                    hidden={!proyectoExpandido}
                  >
                    <button
                      type="button"
                      className={styles.mobileFiltersToggle}
                      aria-expanded={filtrosProyecto.visiblesEnMovil}
                      aria-controls={`filtros-proyecto-${nivel}-${proyecto.fondo_id}`}
                      onClick={() =>
                        actualizarFiltrosProyecto(proyecto.fondo_id, {
                          visiblesEnMovil: !filtrosProyecto.visiblesEnMovil,
                        })
                      }
                    >
                      <span>Filtrar este proyecto</span>
                      <span>
                        {cantidadFiltrosActivos > 0
                          ? `${cantidadFiltrosActivos} activos`
                          : "Mostrar"}
                      </span>
                    </button>
                    <div
                      id={`filtros-proyecto-${nivel}-${proyecto.fondo_id}`}
                      className={`${styles.summaryFilters} ${styles.projectFilters} ${
                        filtrosProyecto.visiblesEnMovil
                          ? ""
                          : styles.mobileFiltersCollapsed
                      }`}
                    >
                      <label>
                        <span>Número de solicitud</span>
                        <input
                          type="search"
                          value={filtrosProyecto.numeroSolicitud}
                          onChange={(event) =>
                            actualizarFiltrosProyecto(proyecto.fondo_id, {
                              numeroSolicitud: event.target.value,
                            })
                          }
                          placeholder="Buscar por número"
                        />
                      </label>
                      <label>
                        <span>Centro de costo</span>
                        <select
                          value={filtrosProyecto.centroCostoId}
                          onChange={(event) =>
                            actualizarFiltrosProyecto(proyecto.fondo_id, {
                              centroCostoId: event.target.value,
                            })
                          }
                        >
                          <option value="">Todos los centros</option>
                          {centrosProyecto.map((centro) => (
                            <option key={centro.id} value={centro.id}>
                              {centro.nombre}
                            </option>
                          ))}
                        </select>
                      </label>
                      <div className={styles.summaryFilterActions}>
                        <button
                          type="button"
                          disabled={cantidadFiltrosActivos === 0}
                          onClick={() =>
                            actualizarFiltrosProyecto(
                              proyecto.fondo_id,
                              FILTROS_PROYECTO_INICIALES,
                            )
                          }
                        >
                          Limpiar filtros
                        </button>
                      </div>
                    </div>

                  <div className={styles.projectHeader}>
                    <div className={styles.mobileProjectSummary}>
                      <span className={styles.summarySectionTitle}>
                        Resumen financiero
                      </span>
                      <div className={styles.mobileKeyFigures}>
                        <div>
                          <span className={styles.summaryLabel}>Disponible ahora</span>
                          <strong className={styles.mobileMainValue}>
                            {formatearMoneda(proyecto.saldo_disponible)}
                          </strong>
                        </div>
                        <div>
                          <span className={styles.summaryLabel}>Seleccionado</span>
                          <strong className={styles.summaryValue}>
                            {formatearMoneda(valorSeleccionado)}
                          </strong>
                          <small className={styles.summaryDescription}>
                            {cantidadSeleccionadaProyecto} {cantidadSeleccionadaProyecto === 1 ? "solicitud" : "solicitudes"}
                          </small>
                        </div>
                      </div>

                      <div className={styles.mobileApprovalResult}>
                        <span className={styles.summaryLabel}>Resultado al aprobar</span>
                        <strong>
                          {valorSeleccionado === 0
                            ? "Selecciona una solicitud"
                            : nivel === 1
                              ? `Quedarían ${formatearMoneda(saldoProyectado)} disponibles`
                              : "Pasa a programación de pago"}
                        </strong>
                        <small>
                          {nivel === 1
                            ? "La aprobación crea o mantiene la reserva correspondiente."
                            : "Todavía no se mueve dinero y la reserva se mantiene."}
                        </small>
                      </div>

                      <details className={styles.mobileCalculationDisclosure}>
                        <summary>Ver cálculo</summary>
                        <div className={styles.mobileOperationCard}>
                          <span className={styles.summaryLabel}>
                            {nivel === 1 ? "Cálculo al aprobar" : "Proyección al pagar"}
                          </span>
                          <strong>
                            {valorSeleccionado > 0
                              ? nivel === 1
                                ? `${formatearMoneda(disponibleAntesSeleccionNivel1)} − ${formatearMoneda(valorSeleccionado)} = ${formatearMoneda(saldoProyectado)}`
                                : `${formatearMoneda(proyecto.saldo_actual)} − ${formatearMoneda(valorSeleccionado)} − ${formatearMoneda(reservaRestante)} = ${formatearMoneda(saldoProyectado)}`
                              : "Selecciona una solicitud para ver la operación"}
                          </strong>
                        </div>
                      </details>
                    </div>

                    <div
                      className={styles.projectSummary}
                    >
                      <section className={styles.compactFinancialSummary}>
                        <span className={styles.summarySectionTitle}>
                          Resumen financiero
                        </span>
                        <div className={styles.compactMetrics}>
                          <div className={styles.compactMetric}>
                            <span className={styles.summaryLabel}>Saldo actual</span>
                            <strong className={styles.summaryValue}>{formatearMoneda(proyecto.saldo_actual)}</strong>
                            <small className={styles.summaryDescription}>
                              Registrado en el fondo.
                            </small>
                          </div>
                          <div className={styles.compactMetric}>
                            <span className={styles.summaryLabel}>
                              {nivel === 1
                                ? "Reservado pendiente"
                                : "Reservado"}
                            </span>
                            <strong className={styles.summaryValue}>{formatearMoneda(proyecto.reservas_existentes)}</strong>
                            <small className={styles.summaryDescription}>
                              {nivel === 1
                                ? "Pagos por terminar de aprobar."
                                : "Solicitudes y compromisos vigentes."}
                            </small>
                          </div>
                          <div className={styles.compactMetric}>
                            <span className={styles.summaryLabel}>Disponible ahora</span>
                            <strong className={styles.summaryValue}>{formatearMoneda(proyecto.saldo_disponible)}</strong>
                            <small className={styles.summaryDescription}>
                              Saldo menos reservas vigentes.
                            </small>
                          </div>
                          <div className={styles.compactMetric}>
                            <span className={styles.summaryLabel}>Seleccionado ({cantidadSeleccionadaProyecto})</span>
                            <strong className={styles.summaryValue}>{formatearMoneda(valorSeleccionado)}</strong>
                            <small className={styles.summaryDescription}>
                              Solicitudes marcadas.
                            </small>
                          </div>
                          <div className={styles.compactResult}>
                            <span className={styles.summaryLabel}>Resultado al aprobar</span>
                            <strong className={styles.projectedValue}>
                              {valorSeleccionado === 0
                                ? "Selecciona una solicitud"
                                : nivel === 1
                                  ? formatearMoneda(saldoProyectado)
                                  : "Pasa a programación de pago"}
                            </strong>
                            <small className={styles.summaryDescription}>
                              {nivel === 1
                                ? "Disponible después de comprometer la selección."
                                : "No mueve dinero; mantiene la reserva."}
                            </small>
                          </div>
                        </div>
                        <div className={styles.compactCalculation}>
                          <span>{nivel === 1 ? "Cálculo al aprobar" : "Efecto de aprobar"}</span>
                          <strong>
                            {valorSeleccionado > 0
                              ? nivel === 1
                                ? `${formatearMoneda(disponibleAntesSeleccionNivel1)} − ${formatearMoneda(valorSeleccionado)} = ${formatearMoneda(saldoProyectado)}`
                                : "La solicitud avanza a programación de pago y conserva su reserva."
                              : "Selecciona una solicitud para ver el resultado."}
                          </strong>
                        </div>
                        {nivel === 2 && valorSeleccionado > 0 ? (
                          <div className={styles.compactPaymentProjection}>
                            <span>Proyección cuando se registre el pago</span>
                            <strong>
                              {formatearMoneda(proyecto.saldo_actual)} − {formatearMoneda(valorSeleccionado)} − {formatearMoneda(reservaRestante)} = {formatearMoneda(saldoProyectado)} disponibles
                            </strong>
                            <small>
                              Saldo después del pago: {formatearMoneda(saldoTrasPagarSeleccion)} · Otras reservas pendientes: {formatearMoneda(reservaRestante)}.
                            </small>
                          </div>
                        ) : null}
                      </section>
                    </div>
                  </div>

                  {solicitudesFiltradas.length > 0 ? (
                  <SolicitudesAprobacionList
                    solicitudes={solicitudesFiltradas}
                    idsSeleccionados={
                      idsSeleccionados
                    }
                    deshabilitado={aprobando}
                    onCambiarSeleccion={
                      alternarSolicitud
                    }
                    onCambiarSeleccionTodas={() =>
                      alternarSolicitudesProyecto(
                        {
                          ...proyecto,
                          solicitudes: solicitudesFiltradas,
                        },
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
                    onEditar={nivel === 1 ? (solicitud) => {
                      setSolicitudEdicion(solicitud);
                      setSolicitudDetalle(null);
                      setMensajeError("");
                      setMensajeExito("");
                    } : undefined}
                  />
                  ) : (
                    <div className={styles.estado}>
                      No hay solicitudes que coincidan con los filtros de este proyecto.
                    </div>
                  )}
                  </div>
                </article>
              );
            })}

            {solicitudesDevolucion.length > 0 ? (
              <div className={`${styles.modalBackdrop} appModalBackdrop`} role="presentation">
                <form
                  className={`${styles.returnDialog} appModalDialog`}
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
              <div className={`${styles.modalBackdrop} appModalBackdrop`} role="presentation">
                <form
                  className={`${styles.returnDialog} appModalDialog`}
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
                className={`${styles.modalBackdrop} ${styles.detailBackdrop} appModalBackdrop`}
                role="presentation"
                onMouseDown={(event) => {
                  if (event.target === event.currentTarget) setSolicitudDetalle(null);
                }}
              >
                <section className={`${styles.detailDialog} appModalDialog`} role="dialog" aria-modal="true" aria-labelledby="detail-title">
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
                      <div><dt>Beneficiario</dt><dd>{solicitudDetalle.beneficiario?.nombre ? formatearNombrePropio(solicitudDetalle.beneficiario.nombre) : "—"}</dd></div>
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

                  {solicitudDetalle.archivo_origen ||
                  (solicitudDetalle.adjuntos &&
                    solicitudDetalle.adjuntos.length > 0) ? (
                    <div className={styles.detailSection}>
                      <h3>Documentos adjuntos</h3>
                      <div className={styles.attachmentList}>
                        {solicitudDetalle.archivo_origen ? (
                          <a
                            className={styles.receiptLink}
                            href={`/api/v1/solicitudes-pago/${solicitudDetalle.id}/archivo`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <span>
                              {solicitudDetalle.archivo_origen.nombre_archivo}
                            </span>
                            <strong>Descargar Excel</strong>
                          </a>
                        ) : null}
                        {(solicitudDetalle.adjuntos ?? []).map((adjunto) => (
                          <a
                            key={adjunto.id}
                            className={styles.receiptLink}
                            href={`/api/v1/solicitudes-pago/${solicitudDetalle.id}/adjuntos/${adjunto.id}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <span>{adjunto.nombre_archivo}</span>
                            <strong>Ver adjunto</strong>
                          </a>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {solicitudDetalle.ultima_devolucion ? (
                    <div className={styles.returnReason}>
                      <strong>Último motivo de devolución</strong>
                      <p>{solicitudDetalle.ultima_devolucion.motivo}</p>
                    </div>
                  ) : null}

                  <div className={styles.detailSection}>
                    <HistorialSolicitud eventos={solicitudDetalle.historial} />
                  </div>
                </section>
              </div>
            ) : null}

            {nivel === 1 && solicitudEdicion ? (
              <EdicionAprobadorNivel1Form
                solicitud={solicitudEdicion}
                onCancelar={() => setSolicitudEdicion(null)}
                onGuardada={async () => {
                  setSolicitudEdicion(null);
                  setMensajeExito("Solicitud actualizada correctamente.");
                  await cargarSolicitudes();
                }}
              />
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

      </div>

      {estadoCarga === "LISTO" ? (
        <HistorialAprobacionesList
          solicitudes={historialAprobaciones}
          nivel={nivel}
        />
      ) : null}
    </section>
  );
}
