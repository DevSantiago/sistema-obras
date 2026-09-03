"use client";

import { useMemo, useState } from "react";
import { formatearNombrePropio } from "@/lib/text-format";
import { descargarTablaPdf } from "@/lib/pdf-export";
import type {
  EstadoSolicitudPago,
  SolicitudPagoListado,
} from "@/modules/solicitudes-pago/solicitudes-pago.types";
import {
  formatearEstadoSolicitud,
  formatearFechaHora,
  formatearMoneda,
  formatearTextoDominio,
} from "@/components/solicitudes-pago/solicitudes-pago.utils";
import styles from "./AprobacionesManager.module.css";

type HistorialAprobacionesListProps = {
  solicitudes: SolicitudPagoListado[];
  nivel: 1 | 2;
};

function obtenerClaseEstado(estado: EstadoSolicitudPago) {
  switch (estado) {
    case "PENDIENTE_APROBADOR_1":
      return styles.historyStatusPendingOne;
    case "PENDIENTE_APROBADOR_2":
      return styles.historyStatusPendingTwo;
    case "DEVUELTA_APROBADOR_1":
    case "DEVUELTA_SOLICITANTE":
      return styles.historyStatusReturned;
    case "PROGRAMADA_PAGO":
      return styles.historyStatusScheduled;
    case "PAGADA":
      return styles.historyStatusPaid;
    case "ANULADA":
      return styles.historyStatusCancelled;
    default:
      return styles.historyStatusDraft;
  }
}

export default function HistorialAprobacionesList({
  solicitudes,
  nivel,
}: HistorialAprobacionesListProps) {
  const [numeroSolicitudFiltro, setNumeroSolicitudFiltro] = useState("");
  const [proyectoFiltro, setProyectoFiltro] = useState("");
  const [centroFiltro, setCentroFiltro] = useState("");

  const proyectos = useMemo(() => {
    const opciones = new Map<string, string>();
    solicitudes.forEach((solicitud) => {
      opciones.set(
        solicitud.proyecto_base_id,
        solicitud.proyecto_base?.nombre ?? "Proyecto sin nombre",
      );
    });
    return Array.from(opciones, ([id, nombre]) => ({ id, nombre })).sort(
      (a, b) => a.nombre.localeCompare(b.nombre, "es"),
    );
  }, [solicitudes]);

  const centros = useMemo(() => {
    const opciones = new Map<string, string>();
    solicitudes.forEach((solicitud) => {
      if (proyectoFiltro && solicitud.proyecto_base_id !== proyectoFiltro) return;
      opciones.set(
        solicitud.centro_costo_id,
        solicitud.centro_costo?.nombre ?? "Centro sin nombre",
      );
    });
    return Array.from(opciones, ([id, nombre]) => ({ id, nombre })).sort(
      (a, b) => a.nombre.localeCompare(b.nombre, "es"),
    );
  }, [proyectoFiltro, solicitudes]);

  const solicitudesFiltradas = useMemo(() => {
    const numeroBuscado = numeroSolicitudFiltro.trim().toLocaleLowerCase("es");
    return solicitudes.filter(
      (solicitud) =>
        (!numeroBuscado ||
          solicitud.numero_solicitud
            ?.toLocaleLowerCase("es")
            .includes(numeroBuscado)) &&
        (!proyectoFiltro || solicitud.proyecto_base_id === proyectoFiltro) &&
        (!centroFiltro || solicitud.centro_costo_id === centroFiltro),
    );
  }, [centroFiltro, numeroSolicitudFiltro, proyectoFiltro, solicitudes]);

  function exportarPdf() {
    const proyecto = proyectos.find((opcion) => opcion.id === proyectoFiltro);
    const centro = centros.find((opcion) => opcion.id === centroFiltro);
    descargarTablaPdf({
      titulo: `Solicitudes aprobadas por mí - nivel ${nivel}`,
      nombreArchivo: `historial-aprobaciones-nivel-${nivel}.pdf`,
      filas: solicitudesFiltradas,
      filtros: [
        numeroSolicitudFiltro.trim() && `Número: ${numeroSolicitudFiltro.trim()}`,
        proyecto && `Proyecto: ${proyecto.nombre}`,
        centro && `Centro de costo: ${centro.nombre}`,
      ].filter(Boolean) as string[],
      columnas: [
        { titulo: "Solicitud", ancho: 18, valor: (fila) => fila.numero_solicitud },
        { titulo: "Proyecto", ancho: 16, valor: (fila) => fila.proyecto_base?.nombre },
        { titulo: "Centro de costo", ancho: 16, valor: (fila) => fila.centro_costo?.nombre },
        { titulo: "Beneficiario", ancho: 16, valor: (fila) => fila.beneficiario?.nombre },
        { titulo: "Tipo", ancho: 11, valor: (fila) => formatearTextoDominio(fila.tipo_solicitud) },
        { titulo: "Aprobada", ancho: 13, valor: (fila) => formatearFechaHora(nivel === 1 ? fila.aprobado_1_en : fila.aprobado_2_en) },
        { titulo: "Estado", ancho: 10, valor: (fila) => formatearEstadoSolicitud(fila.estado_actual) },
      ],
    });
  }

  return (
    <section className={styles.historySection}>
      <div>
        <h2 className={styles.subtitle}>Solicitudes aprobadas por mí</h2>
        <p className={styles.helper}>
          Historial de solicitudes que aprobaste en el nivel {nivel}, con su
          estado actual dentro del proceso.
        </p>
      </div>

      {solicitudes.length > 0 ? (
        <div className={styles.summaryFilters}>
          <label>
            <span>Número de solicitud</span>
            <input
              type="search"
              value={numeroSolicitudFiltro}
              onChange={(event) => setNumeroSolicitudFiltro(event.target.value)}
              placeholder="Buscar por número"
            />
          </label>
          <label>
            <span>Proyecto</span>
            <select
              value={proyectoFiltro}
              onChange={(event) => {
                setProyectoFiltro(event.target.value);
                setCentroFiltro("");
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
            <span>Centro de costo</span>
            <select
              value={centroFiltro}
              onChange={(event) => setCentroFiltro(event.target.value)}
            >
              <option value="">Todos los centros</option>
              {centros.map((centro) => (
                <option key={centro.id} value={centro.id}>
                  {centro.nombre}
                </option>
              ))}
            </select>
          </label>
          <div className={styles.summaryFilterActions}>
            <button
              type="button"
              onClick={() => {
                setNumeroSolicitudFiltro("");
                setProyectoFiltro("");
                setCentroFiltro("");
              }}
            >
              Limpiar filtros
            </button>
            <button
              type="button"
              onClick={exportarPdf}
              disabled={solicitudesFiltradas.length === 0}
            >
              Exportar PDF ({solicitudesFiltradas.length})
            </button>
          </div>
        </div>
      ) : null}

      {solicitudes.length === 0 ? (
        <div className={styles.estado}>
          Aún no has aprobado solicitudes en este nivel.
        </div>
      ) : solicitudesFiltradas.length === 0 ? (
        <div className={styles.estado}>
          No hay solicitudes aprobadas que coincidan con los filtros.
        </div>
      ) : (
        <>
          <div className={`${styles.tableWrapper} ${styles.historyDesktop}`}>
          <table className={`${styles.table} ${styles.historyTable}`}>
            <thead>
              <tr>
                <th>Solicitud</th>
                <th>Proyecto / Centro</th>
                <th>Beneficiario</th>
                <th>Tipo</th>
                <th>Valor neto</th>
                <th>Fecha de aprobación</th>
                <th>Estado actual</th>
              </tr>
            </thead>
            <tbody>
              {solicitudesFiltradas.map((solicitud) => (
                <tr key={solicitud.id}>
                  <td>
                    <strong className={styles.historyRequestNumber}>
                      {solicitud.numero_solicitud ?? "Sin número"}
                    </strong>
                  </td>
                  <td>
                    <strong className={styles.historyPrimaryText}>
                      {solicitud.proyecto_base?.nombre ?? "Sin proyecto"}
                    </strong>
                    <span className={styles.historySecondaryText}>
                      {solicitud.centro_costo?.nombre ?? "Sin centro de costo"}
                    </span>
                  </td>
                  <td>
                    {solicitud.beneficiario?.nombre
                      ? formatearNombrePropio(solicitud.beneficiario.nombre)
                      : "Sin beneficiario"}
                  </td>
                  <td>{formatearTextoDominio(solicitud.tipo_solicitud)}</td>
                  <td className={styles.moneyCell}>
                    {formatearMoneda(solicitud.valor_neto)}
                  </td>
                  <td>
                    {formatearFechaHora(
                      nivel === 1
                        ? solicitud.aprobado_1_en
                        : solicitud.aprobado_2_en,
                    )}
                  </td>
                  <td>
                    <span
                      className={`${styles.detailStatus} ${obtenerClaseEstado(solicitud.estado_actual)}`}
                    >
                      {formatearEstadoSolicitud(solicitud.estado_actual)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          <div className={styles.historyMobileList}>
            {solicitudesFiltradas.map((solicitud) => (
              <article className={styles.historyMobileCard} key={solicitud.id}>
              <div className={styles.historyMobileHeader}>
                <strong className={styles.historyRequestNumber}>
                  {solicitud.numero_solicitud ?? "Sin número"}
                </strong>
                <span
                  className={`${styles.detailStatus} ${obtenerClaseEstado(solicitud.estado_actual)}`}
                >
                  {formatearEstadoSolicitud(solicitud.estado_actual)}
                </span>
              </div>
              <dl className={styles.historyMobileDetails}>
                <div>
                  <dt>Proyecto / Centro</dt>
                  <dd>
                    {solicitud.proyecto_base?.nombre ?? "Sin proyecto"}
                    <span>
                      {solicitud.centro_costo?.nombre ?? "Sin centro de costo"}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt>Beneficiario</dt>
                  <dd>
                    {solicitud.beneficiario?.nombre
                      ? formatearNombrePropio(solicitud.beneficiario.nombre)
                      : "Sin beneficiario"}
                  </dd>
                </div>
                <div>
                  <dt>Tipo</dt>
                  <dd>{formatearTextoDominio(solicitud.tipo_solicitud)}</dd>
                </div>
                <div>
                  <dt>Fecha de aprobación</dt>
                  <dd>
                    {formatearFechaHora(
                      nivel === 1
                        ? solicitud.aprobado_1_en
                        : solicitud.aprobado_2_en,
                    )}
                  </dd>
                </div>
                <div>
                  <dt>Valor neto</dt>
                  <dd className={styles.historyMobileValue}>
                    {formatearMoneda(solicitud.valor_neto)}
                  </dd>
                </div>
              </dl>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
