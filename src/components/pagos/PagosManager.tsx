"use client";

import type {
  MedioPagoSolicitud,
  SolicitudProgramadaPago,
  SolicitudesPagoApiResponse,
} from "@/modules/solicitudes-pago/solicitudes-pago.types";
import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./PagosManager.module.css";

type FiltrosPagos = {
  busqueda: string;
  proyecto_base_id: string;
  centro_costo_id: string;
  medio_pago: MedioPagoSolicitud | "";
};

const FILTROS_INICIALES: FiltrosPagos = {
  busqueda: "",
  proyecto_base_id: "",
  centro_costo_id: "",
  medio_pago: "",
};

const FORMATEADOR_MONEDA = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

function obtenerBeneficiario(solicitud: SolicitudProgramadaPago): string {
  return (
    solicitud.beneficiario?.nombre ??
    solicitud.proveedor?.nombre ??
    (solicitud.modalidad_nomina === "AGRUPADA_EXCEL"
      ? "Trabajadores de nómina"
      : solicitud.tipo_solicitud === "PAGO_IMPUESTO"
        ? "Entidad recaudadora"
        : "—")
  );
}

function obtenerTipo(solicitud: SolicitudProgramadaPago): string {
  if (solicitud.tipo_solicitud === "PAGO_NOMINA") {
    return solicitud.modalidad_nomina === "AGRUPADA_EXCEL"
      ? "Nómina grupal"
      : "Nómina individual";
  }

  const etiquetas = {
    PAGO_PROVEEDOR: "Pago a proveedor",
    REEMBOLSO: "Reembolso",
    PAGO_IMPUESTO: "Pago de impuesto",
    OTRO_PAGO: "Otro pago",
  };

  return etiquetas[solicitud.tipo_solicitud];
}

export default function PagosManager() {
  const [solicitudes, setSolicitudes] = useState<SolicitudProgramadaPago[]>([]);
  const [solicitudSeleccionada, setSolicitudSeleccionada] =
    useState<SolicitudProgramadaPago | null>(null);
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const [cargando, setCargando] = useState(true);
  const [mensajeError, setMensajeError] = useState("");

  const cargarSolicitudes = useCallback(async () => {
    setCargando(true);
    setMensajeError("");

    try {
      const response = await fetch(
        "/api/v1/solicitudes-pago/programadas",
        {
        credentials: "include",
        cache: "no-store",
        },
      );
      const body =
        (await response.json()) as SolicitudesPagoApiResponse<{
          solicitudes: SolicitudProgramadaPago[];
        }>;

      if (!response.ok || !body.ok) {
        throw new Error(
          body.message ?? "No fue posible consultar la bandeja de pagos.",
        );
      }

      setSolicitudes(body.data?.solicitudes ?? []);
    } catch (error) {
      setSolicitudes([]);
      setMensajeError(
        error instanceof Error
          ? error.message
          : "No fue posible consultar la bandeja de pagos.",
      );
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    const tareaCarga = window.setTimeout(() => {
      void cargarSolicitudes();
    }, 0);

    return () => window.clearTimeout(tareaCarga);
  }, [cargarSolicitudes]);

  useEffect(() => {
    if (!solicitudSeleccionada) {
      return;
    }

    function cerrarConEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSolicitudSeleccionada(null);
      }
    }

    document.addEventListener("keydown", cerrarConEscape);
    return () => document.removeEventListener("keydown", cerrarConEscape);
  }, [solicitudSeleccionada]);

  const proyectos = useMemo(
    () =>
      Array.from(
        new Map(
          solicitudes
            .filter((solicitud) => solicitud.proyecto_base)
            .map((solicitud) => [
              solicitud.proyecto_base_id,
              solicitud.proyecto_base!,
            ]),
        ).values(),
      ).sort((a, b) => a.nombre.localeCompare(b.nombre)),
    [solicitudes],
  );

  const centrosCosto = useMemo(
    () =>
      Array.from(
        new Map(
          solicitudes
            .filter(
              (solicitud) =>
                solicitud.centro_costo &&
                (!filtros.proyecto_base_id ||
                  solicitud.proyecto_base_id === filtros.proyecto_base_id),
            )
            .map((solicitud) => [
              solicitud.centro_costo_id,
              solicitud.centro_costo!,
            ]),
        ).values(),
      ).sort((a, b) => a.nombre.localeCompare(b.nombre)),
    [filtros.proyecto_base_id, solicitudes],
  );

  const solicitudesFiltradas = useMemo(() => {
    const busqueda = filtros.busqueda.trim().toLocaleLowerCase("es");

    return solicitudes.filter((solicitud) => {
      const coincideBusqueda =
        !busqueda ||
        [
          solicitud.numero_solicitud,
          solicitud.descripcion,
          obtenerBeneficiario(solicitud),
          solicitud.proyecto_base?.nombre,
          solicitud.centro_costo?.nombre,
        ].some((valor) => valor?.toLocaleLowerCase("es").includes(busqueda));

      return (
        coincideBusqueda &&
        (!filtros.proyecto_base_id ||
          solicitud.proyecto_base_id === filtros.proyecto_base_id) &&
        (!filtros.centro_costo_id ||
          solicitud.centro_costo_id === filtros.centro_costo_id) &&
        (!filtros.medio_pago ||
          solicitud.medio_pago === filtros.medio_pago)
      );
    });
  }, [filtros, solicitudes]);

  function limpiarFiltros() {
    setFiltros(FILTROS_INICIALES);
  }

  return (
    <section className={styles.container}>
      <div className={styles.filters}>
        <label className={styles.field}>
          <span>Buscar</span>
          <input
            value={filtros.busqueda}
            onChange={(event) =>
              setFiltros((actuales) => ({
                ...actuales,
                busqueda: event.target.value,
              }))
            }
            placeholder="Número, beneficiario o descripción"
          />
        </label>

        <label className={styles.field}>
          <span>Proyecto base</span>
          <select
            value={filtros.proyecto_base_id}
            onChange={(event) =>
              setFiltros((actuales) => ({
                ...actuales,
                proyecto_base_id: event.target.value,
                centro_costo_id: "",
              }))
            }
          >
            <option value="">Todos los proyectos</option>
            {proyectos.map((proyecto) => (
              <option key={proyecto.id} value={proyecto.id}>
                {proyecto.nombre}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.field}>
          <span>Centro de costo</span>
          <select
            value={filtros.centro_costo_id}
            onChange={(event) =>
              setFiltros((actuales) => ({
                ...actuales,
                centro_costo_id: event.target.value,
              }))
            }
          >
            <option value="">Todos los centros</option>
            {centrosCosto.map((centro) => (
              <option key={centro.id} value={centro.id}>
                {centro.nombre}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.field}>
          <span>Medio de pago</span>
          <select
            value={filtros.medio_pago}
            onChange={(event) =>
              setFiltros((actuales) => ({
                ...actuales,
                medio_pago: event.target.value as MedioPagoSolicitud | "",
              }))
            }
          >
            <option value="">Todos</option>
            <option value="TRANSFERENCIA">Transferencia</option>
            <option value="EFECTIVO">Efectivo</option>
          </select>
        </label>

        <button className={styles.secondaryButton} type="button" onClick={limpiarFiltros}>
          Limpiar filtros
        </button>
      </div>

      {mensajeError ? <p className={styles.error}>{mensajeError}</p> : null}

      <div className={styles.summary}>
        <strong>Solicitudes programadas</strong>
        <span>{solicitudesFiltradas.length} resultado(s)</span>
      </div>

      {cargando ? (
        <p className={styles.empty}>Cargando bandeja de pagos...</p>
      ) : solicitudesFiltradas.length === 0 ? (
        <p className={styles.empty}>
          No existen solicitudes programadas que coincidan con los filtros.
        </p>
      ) : (
        <>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Número</th>
                  <th>Beneficiario</th>
                  <th>Proyecto base</th>
                  <th>Centro de costo</th>
                  <th>Tipo</th>
                  <th>Medio de pago</th>
                  <th>Valor neto</th>
                </tr>
              </thead>
              <tbody>
                {solicitudesFiltradas.map((solicitud) => (
                  <tr
                    key={solicitud.id}
                    className={styles.clickableRow}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSolicitudSeleccionada(solicitud)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSolicitudSeleccionada(solicitud);
                      }
                    }}
                  >
                    <td><strong>{solicitud.numero_solicitud ?? "—"}</strong></td>
                    <td>{obtenerBeneficiario(solicitud)}</td>
                    <td>{solicitud.proyecto_base?.nombre ?? "—"}</td>
                    <td>{solicitud.centro_costo?.nombre ?? "—"}</td>
                    <td>{obtenerTipo(solicitud)}</td>
                    <td>{solicitud.medio_pago ?? "—"}</td>
                    <td className={styles.money}>
                      {FORMATEADOR_MONEDA.format(solicitud.valor_neto)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={styles.cards}>
            {solicitudesFiltradas.map((solicitud) => (
              <button
                className={styles.card}
                key={solicitud.id}
                type="button"
                onClick={() => setSolicitudSeleccionada(solicitud)}
              >
                <div className={styles.cardHeader}>
                  <strong>{solicitud.numero_solicitud ?? "Sin número"}</strong>
                  <span>{solicitud.medio_pago ?? "—"}</span>
                </div>
                <dl>
                  <div><dt>Beneficiario</dt><dd>{obtenerBeneficiario(solicitud)}</dd></div>
                  <div><dt>Proyecto</dt><dd>{solicitud.proyecto_base?.nombre ?? "—"}</dd></div>
                  <div><dt>Centro de costo</dt><dd>{solicitud.centro_costo?.nombre ?? "—"}</dd></div>
                  <div><dt>Valor neto</dt><dd>{FORMATEADOR_MONEDA.format(solicitud.valor_neto)}</dd></div>
                </dl>
              </button>
            ))}
          </div>
        </>
      )}

      {solicitudSeleccionada ? (
        <div
          className={styles.modalBackdrop}
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSolicitudSeleccionada(null);
            }
          }}
        >
          <section
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="detalle-pago-title"
          >
            <header className={styles.modalHeader}>
              <div>
                <p className={styles.modalEyebrow}>Detalle para pago</p>
                <h2 id="detalle-pago-title">
                  {solicitudSeleccionada.numero_solicitud ?? "Sin número"}
                </h2>
              </div>
              <button
                className={styles.closeButton}
                type="button"
                aria-label="Cerrar detalle"
                onClick={() => setSolicitudSeleccionada(null)}
              >
                ×
              </button>
            </header>

            <div className={styles.modalGrid}>
              <div><span>Tipo de solicitud</span><strong>{obtenerTipo(solicitudSeleccionada)}</strong></div>
              <div><span>Medio de pago</span><strong>{solicitudSeleccionada.medio_pago ?? "—"}</strong></div>
              <div><span>Beneficiario</span><strong>{obtenerBeneficiario(solicitudSeleccionada)}</strong></div>
              <div><span>Documento</span><strong>{solicitudSeleccionada.beneficiario?.tipo_documento ?? "—"} {solicitudSeleccionada.beneficiario?.numero_documento ?? ""}</strong></div>
              <div><span>Banco</span><strong>{solicitudSeleccionada.beneficiario?.banco ?? "No registrado"}</strong></div>
              <div><span>Tipo de cuenta</span><strong>{solicitudSeleccionada.beneficiario?.tipo_cuenta_bancaria ?? "No registrado"}</strong></div>
              <div className={styles.fullWidth}><span>Número de cuenta</span><strong>{solicitudSeleccionada.beneficiario?.numero_cuenta_bancaria ?? "No registrado"}</strong></div>
            </div>

            <div className={styles.values}>
              <div><span>Valor bruto</span><strong>{FORMATEADOR_MONEDA.format(solicitudSeleccionada.valor_bruto)}</strong></div>
              <div><span>Impuestos</span><strong>{FORMATEADOR_MONEDA.format(solicitudSeleccionada.valor_impuestos)}</strong></div>
              <div><span>Retenciones</span><strong>{FORMATEADOR_MONEDA.format(solicitudSeleccionada.valor_retenciones)}</strong></div>
              <div><span>Descuentos</span><strong>{FORMATEADOR_MONEDA.format(solicitudSeleccionada.valor_descuentos)}</strong></div>
              <div className={styles.netValue}><span>Valor neto</span><strong>{FORMATEADOR_MONEDA.format(solicitudSeleccionada.valor_neto)}</strong></div>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}
